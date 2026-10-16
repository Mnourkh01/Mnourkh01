// Rebuilds the contribution calendar from the search API so work in private
// repos counts even while the profile's "Private contributions" setting is off
// (GraphQL then hides it from every token, the owner's included). Only per-day
// totals leave this module; repository names never do.
//
// Needs a token that can read the private repos (STATS_TOKEN in CI). Results
// are cached in the OS temp dir per calendar range, so the stats and city
// scripts share one crawl (a second local run the same day reuses it).
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const API = "https://api.github.com";
const PACE_MS = 2200; // search allows 30 requests a minute; bursts trip the secondary limit
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoDay = (d) => d.toISOString().slice(0, 10);
const addDays = (day, n) => isoDay(new Date(Date.parse(day + "T00:00:00Z") + n * 86400000));

async function search(kind, q, page, token) {
  const url = `${API}/search/${kind}?q=${encodeURIComponent(q)}&per_page=100&page=${page}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(PACE_MS);
    const res = await fetch(url, {
      headers: { Authorization: `bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "profile-private-calendar" },
    });
    if (res.ok) return res.json();
    const limited = res.status === 429 || (res.status === 403 &&
      (res.headers.get("retry-after") || res.headers.get("x-ratelimit-remaining") === "0" || /rate limit/i.test(await res.text())));
    if (limited) {
      const wait = Number(res.headers.get("retry-after")) || 60;
      console.warn(`search rate limited, waiting ${wait}s`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`search ${kind} HTTP ${res.status}`);
  }
  throw new Error(`search ${kind} still rate limited after retries`);
}

// Walks [from, to] in windows, splitting any window that hits the 1000-result cap.
async function collect(kind, qualifier, user, from, to, days, token, dateOf) {
  const q = (a, b) => `author:${user} ${qualifier}:${a}..${b}`;
  const mine = {};
  const walk = async (a, b) => {
    const first = await search(kind, q(a, b), 1, token);
    if (first.total_count > 1000 && a === b) days.truncated = true;
    if (first.total_count > 1000 && a === b) console.warn(`::warning::${kind} on ${a}: ${first.total_count} results, only the first 1000 are counted`);
    if (first.total_count > 1000 && a !== b) {
      const span = (Date.parse(b) - Date.parse(a)) / 86400000;
      const mid = addDays(a, Math.floor(span / 2));
      await walk(a, mid);
      await walk(addDays(mid, 1), b);
      return;
    }
    let items = first.items;
    for (let page = 1; ; page++) {
      for (const it of items) {
        const key = it.sha || it.id;
        if (days.seen.has(key)) continue;
        days.seen.add(key);
        const day = dateOf(it);
        days.count.set(day, (days.count.get(day) || 0) + 1);
        mine[day] = (mine[day] || 0) + 1;
      }
      if (items.length < 100 || page * 100 >= Math.min(first.total_count, 1000)) break;
      items = (await search(kind, q(a, b), page + 1, token)).items;
    }
  };
  for (let a = from; a <= to; a = addDays(a, 31)) {
    const b = addDays(a, 30) < to ? addDays(a, 30) : to;
    await walk(a, b);
  }
  return mine;
}

// A token without private access returns public-only results and no error, which
// would quietly undo the point of this module, so refuse to run with one.
async function assertSeesPrivate(token) {
  const res = await fetch(`${API}/user/repos?visibility=private&per_page=1`, {
    headers: { Authorization: `bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "profile-private-calendar" },
  });
  if (!res.ok) throw new Error(`token check HTTP ${res.status}`);
  if (!(await res.json()).length) throw new Error("token cannot read any private repo; refusing to publish public-only counts");
}

async function crawl(user, from, to, token) {
  await assertSeesPrivate(token);
  const days = { count: new Map(), seen: new Set(), truncated: false };
  // author date keeps the committer's own calendar day, like the profile graph does
  const commits = await collect("commits", "author-date", user, from, to, days, token, (it) => it.commit.author.date.slice(0, 10));
  const prs = await collect("issues", "type:pr created", user, from, to, days, token, (it) => it.created_at.slice(0, 10));
  const issues = await collect("issues", "type:issue created", user, from, to, days, token, (it) => it.created_at.slice(0, 10));
  return { perDay: Object.fromEntries(days.count), commits, prs, issues, truncated: days.truncated };
}

// Takes the public GraphQL calendar (it fixes the week grid) and returns the
// same shape with each day raised to the private-aware count.
export async function withPrivateWork(calendar, { user, token }) {
  const allDays = calendar.weeks.flatMap((w) => w.contributionDays);
  if (!allDays.length) return { calendar, commits: 0, prs: 0, issues: 0 };
  const from = allDays[0].date, to = allDays[allDays.length - 1].date;
  const cacheFile = join(tmpdir(), `private-calendar-v2-${user}-${from}-${to}.json`);
  let data;
  try {
    data = JSON.parse(readFileSync(cacheFile, "utf8"));
  } catch {
    // one day of padding each side: commits are keyed by the author's local day, the query window is UTC
    data = await crawl(user, addDays(from, -1), addDays(to, 1), token);
    if (!data.truncated) writeFileSync(cacheFile, JSON.stringify(data));
  }
  let total = 0;
  const weeks = calendar.weeks.map((w) => ({
    contributionDays: w.contributionDays.map((d) => {
      const n = Math.max(d.contributionCount, data.perDay[d.date] || 0);
      total += n;
      return { ...d, contributionCount: n };
    }),
  }));
  const inRange = (byDay) => Object.entries(byDay).reduce((n, [d, c]) => (d >= from && d <= to ? n + c : n), 0);
  return { calendar: { ...calendar, totalContributions: total, weeks }, commits: inRange(data.commits), prs: inRange(data.prs), issues: inRange(data.issues) };
}
