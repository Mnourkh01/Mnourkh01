// Generates assets/stats.svg and assets/contributions.svg from live GitHub data.
//
// WHY THIS EXISTS: the README used to embed public image services
// (github-readme-stats, streak-stats, activity-graph). Those share ONE GitHub
// API budget across every user of the instance, so they constantly rate-limit
// and render "something went wrong" cards. This script instead fetches the data
// once via the API and bakes it into static SVGs committed to the repo, so the
// README never depends on a third-party service at view time. A GitHub Action
// refreshes the SVGs on a schedule using the built-in GITHUB_TOKEN (no PAT, no
// setup). Locally it uses `GITHUB_TOKEN` / `GH_TOKEN` (e.g. `gh auth token`).
//
// Safety: if the API call fails or returns nothing, it exits non-zero WITHOUT
// writing, so a bad run can never clobber the last good SVGs.
//
// Run: GITHUB_TOKEN=$(gh auth token) node scripts/github-stats.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ASSETS = `${__dir}/../assets`;
const USER = process.env.GH_USER || "Mnourkh01";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!TOKEN) {
  console.error("No GITHUB_TOKEN / GH_TOKEN in env. Locally: GITHUB_TOKEN=$(gh auth token) node scripts/github-stats.mjs");
  process.exit(1);
}

// ---- palette (matches the arcade-cabinet snake for a cohesive profile) -----
const C = {
  ink: "#eaffe0", sub: "#6f8f76", faint: "#3f5a46",
  accent: "#6DB33F", purple: "#b48cff", gold: "#ffd166",
};
const HEAT = ["#0f2318", "#1f5c34", "#2f9146", "#54c463", "#8bf089"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n));

// ---- fetch -----------------------------------------------------------------
async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": `${USER}-profile-stats`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error("GraphQL errors: " + JSON.stringify(json.errors));
  return json.data;
}

const QUERY = `
query($login:String!){
  user(login:$login){
    name login
    followers{ totalCount }
    contributionsCollection{
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount weekday } }
      }
    }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC){
      totalCount
      nodes{
        stargazerCount
        languages(first:10, orderBy:{field:SIZE, direction:DESC}){
          edges{ size node{ name color } }
        }
      }
    }
  }
}`;

// ---- SVG chrome shared by both cards ---------------------------------------
function frame(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="GitHub stats for ${USER}">
<defs>
  <linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7F52FF"/><stop offset=".5" stop-color="#4b8f57"/><stop offset="1" stop-color="#6DB33F"/>
  </linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#101a12"/><stop offset="1" stop-color="#080d0a"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".14"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
</defs>
<style>
  .lbl{font:700 11px 'Segoe UI',Verdana,sans-serif;letter-spacing:2px;fill:${C.sub}}
  .big{font:800 30px 'Segoe UI',Verdana,sans-serif;fill:${C.ink}}
  .cap{font:600 12px 'Segoe UI',Verdana,sans-serif;fill:${C.sub}}
  .foot{font:600 10px 'Segoe UI',Verdana,sans-serif;fill:${C.faint}}
  .title{font:800 15px 'Segoe UI',Verdana,sans-serif;fill:${C.ink};letter-spacing:.5px}
  .accent{fill:${C.accent}}
  @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  @keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
  @keyframes sweep{0%{opacity:0}20%{opacity:1}100%{opacity:0;transform:translateX(${w}px)}}
  .rise{opacity:0;animation:rise .6s ease-out forwards}
  .bar{transform-box:fill-box;transform-origin:left center;animation:grow 1.1s cubic-bezier(.2,.7,.2,1) forwards}
  .cell{transform-box:fill-box;transform-origin:center;opacity:0;animation:pop .5s ease-out forwards}
</style>
<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="18" fill="url(#bezel)"/>
<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="15" fill="url(#panel)"/>
<rect x="4" y="4" width="${w - 8}" height="26" rx="15" fill="url(#sheen)" opacity=".5"/>
${inner}
</svg>`;
}

// ---- build stats.svg (metrics + languages) ---------------------------------
function buildStats(d) {
  const cc = d.contributionsCollection;
  const repos = d.repositories.nodes;
  const stars = repos.reduce((s, r) => s + r.stargazerCount, 0);
  const pubRepos = d.repositories.totalCount;

  // aggregate language sizes across public repos
  const langMap = new Map();
  for (const r of repos) {
    for (const e of r.languages.edges) {
      const cur = langMap.get(e.node.name) || { size: 0, color: e.node.color || "#8a8a8a" };
      cur.size += e.size;
      langMap.set(e.node.name, cur);
    }
  }
  const total = [...langMap.values()].reduce((s, v) => s + v.size, 0) || 1;
  const langs = [...langMap.entries()]
    .map(([name, v]) => ({ name, pct: (v.size / total) * 100, color: v.color }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);

  const W = 840, H = 252;
  const metrics = [
    { n: cc.contributionCalendar.totalContributions, l: "CONTRIBUTIONS · 1Y" },
    { n: cc.totalCommitContributions, l: "COMMITS · 1Y" },
    { n: cc.totalPullRequestContributions, l: "PULL REQUESTS · 1Y" },
    { n: pubRepos, l: "PUBLIC REPOS" },
  ];
  // left column: 2x2 metric grid
  let left = "";
  const mx = [34, 190], my = [92, 168];
  metrics.forEach((m, i) => {
    const x = mx[i % 2], y = my[i < 2 ? 0 : 1];
    const delay = (0.1 + i * 0.08).toFixed(2);
    left +=
      `<g class="rise" style="animation-delay:${delay}s">` +
      `<text x="${x}" y="${y}" class="big">${fmt(m.n)}</text>` +
      `<text x="${x}" y="${y + 17}" class="lbl">${m.l}</text></g>`;
  });

  // right column: languages stacked bar + legend
  const bx = 330, bw = 476, by = 96, bh = 16;
  let run = 0;
  let bar = `<clipPath id="barclip"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}"/></clipPath>`;
  bar += `<g clip-path="url(#barclip)">`;
  bar += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#0e1a12"/>`;
  langs.forEach((l, i) => {
    const segw = (l.pct / 100) * bw;
    bar +=
      `<rect class="bar" x="${(bx + run).toFixed(2)}" y="${by}" width="${Math.max(segw, 0).toFixed(2)}" height="${bh}" ` +
      `fill="${l.color}" style="animation-delay:${(0.3 + i * 0.06).toFixed(2)}s"/>`;
    run += segw;
  });
  bar += `</g>`;

  // legend: 2 columns x 4 rows
  let legend = "";
  langs.forEach((l, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const lx = bx + col * 240, ly = by + 44 + row * 24;
    const delay = (0.5 + i * 0.05).toFixed(2);
    legend +=
      `<g class="rise" style="animation-delay:${delay}s">` +
      `<circle cx="${lx + 5}" cy="${ly - 4}" r="5.5" fill="${l.color}"/>` +
      `<text x="${lx + 18}" y="${ly}" class="cap" style="fill:${C.ink}">${esc(l.name)}</text>` +
      `<text x="${lx + 214}" y="${ly}" text-anchor="end" class="cap">${l.pct.toFixed(1)}%</text></g>`;
  });

  const inner =
    `<text x="30" y="40" class="title">GitHub at a glance</text>` +
    `<circle cx="200" cy="35" r="4" class="accent"/>` +
    `<text x="212" y="40" class="cap">@${esc(d.login)}</text>` +
    `<text x="${W - 30}" y="40" text-anchor="end" class="cap" style="fill:${C.gold}">★ ${fmt(stars)} stars · ${fmt(d.followers.totalCount)} followers</text>` +
    `<line x1="306" y1="64" x2="306" y2="216" stroke="#20342a" stroke-width="1"/>` +
    left +
    `<text x="${bx}" y="84" class="lbl">MOST USED LANGUAGES</text>` +
    bar + legend +
    `<text x="30" y="${H - 18}" class="foot">Static SVG · refreshed daily by GitHub Actions · no rate-limited third-party service</text>`;

  writeFileSync(`${ASSETS}/stats.svg`, frame(W, H, inner));
  console.log(`stats.svg  -> repos ${pubRepos}, stars ${stars}, langs ${langs.map((l) => l.name).join("/")}`);
}

// ---- build contributions.svg (heatmap) -------------------------------------
function buildContrib(d) {
  const cal = d.contributionsCollection.contributionCalendar;
  const weeks = cal.weeks;
  if (!weeks || !weeks.length) throw new Error("empty contribution calendar");

  const level = (c) => (c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 9 ? 3 : 4);
  const cell = 11, gap = 3, step = cell + gap;
  const gridX = 40, gridY = 74;
  const W = gridX + weeks.length * step + 18;
  const H = gridY + 7 * step + 40;

  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let months = "", cells = "", lastMonth = -1, lastLabelWi = -3;
  weeks.forEach((wk, wi) => {
    const first = wk.contributionDays[0];
    if (first) {
      const m = new Date(first.date + "T00:00:00Z").getUTCMonth();
      // label a new month only if it is >= 3 weeks from the previous label,
      // so short partial months at the edges never print on top of each other.
      if (m !== lastMonth && wi - lastLabelWi >= 3) {
        months += `<text x="${gridX + wi * step}" y="${gridY - 8}" class="mon">${MON[m]}</text>`;
        lastMonth = m;
        lastLabelWi = wi;
      }
    }
    for (const day of wk.contributionDays) {
      const x = gridX + wi * step;
      const y = gridY + day.weekday * step;
      const lv = level(day.contributionCount);
      const delay = (0.15 + (wi * 0.008 + day.weekday * 0.01)).toFixed(3);
      cells +=
        `<rect class="cell" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2.5" ` +
        `fill="${HEAT[lv]}" style="animation-delay:${delay}s"><title>${day.date}: ${day.contributionCount}</title></rect>`;
    }
  });

  // weekday hints
  const wd = [["Mon", 1], ["Wed", 3], ["Fri", 5]];
  let days = "";
  for (const [t, i] of wd) days += `<text x="${gridX - 8}" y="${gridY + i * step + 9}" text-anchor="end" class="mon">${t}</text>`;

  // legend
  let legend = `<text x="${W - 150}" y="${H - 16}" class="mon">Less</text>`;
  HEAT.forEach((c, i) => (legend += `<rect x="${W - 118 + i * 16}" y="${H - 26}" width="11" height="11" rx="2.5" fill="${c}"/>`));
  legend += `<text x="${W - 30}" y="${H - 16}" class="mon">More</text>`;

  const inner =
    `<text x="30" y="40" class="title">Contribution activity</text>` +
    `<text x="30" y="${H - 16}" class="foot">${cal.totalContributions} contributions in the last year</text>` +
    `<style>.mon{font:600 10px 'Segoe UI',Verdana,sans-serif;fill:${C.sub}}</style>` +
    days + months + cells + legend;

  writeFileSync(`${ASSETS}/contributions.svg`, frame(W, H, inner));
  console.log(`contributions.svg -> ${cal.totalContributions} contributions, ${weeks.length} weeks`);
}

// ---- run -------------------------------------------------------------------
try {
  mkdirSync(ASSETS, { recursive: true });
  const data = await gql(QUERY, { login: USER });
  if (!data || !data.user) throw new Error("no user data returned");
  buildStats(data.user);
  buildContrib(data.user);
  console.log("OK");
} catch (err) {
  console.error("stats generation failed (SVGs left untouched):", err.message);
  process.exit(1);
}
