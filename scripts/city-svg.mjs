// Generates assets/contribution-city.svg: the last year of contributions drawn
// as a neon 2.5D city (one building per day, height = contributions) that a
// snake eats week by week before the skyline rebuilds. Pure CSS animation so it
// plays inside a README <img>; no JS runs at view time.
//
// Run: GITHUB_TOKEN=$(gh auth token) node scripts/city-svg.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { withPrivateWork } from "./private-calendar.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = `${__dir}/../assets/contribution-city.svg`;
const USER = process.env.GH_USER || "Mnourkh01";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!TOKEN) {
  console.error("No GITHUB_TOKEN / GH_TOKEN in env. Locally: GITHUB_TOKEN=$(gh auth token) node scripts/city-svg.mjs");
  process.exit(1);
}

const QUERY = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
  totalContributions weeks{contributionDays{date contributionCount weekday}}}}}}`;

async function fetchCalendar() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": `${USER}-city` },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error("GraphQL errors: " + JSON.stringify(json.errors));
  if (!json.data?.user) throw new Error(`user not found: ${USER}`);
  return json.data.user.contributionsCollection.contributionCalendar;
}

// ---- seeded randomness so the output depends only on the data
let seed = 20261016;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const r1 = (n) => Math.round(n * 10) / 10;
const pt = ([x, y]) => `${r1(x)},${r1(y)}`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

// ---- layout ---------------------------------------------------------------
const W = 1240, H = 340;
const CW = 20.6, S = 14, DX = 7, DY = 11.5;   // column pitch, footprint width, per-row shear
const VX = DX * 0.78, VY = -DY * 0.78;        // footprint depth vector
const X0 = 50, YF = 284;                       // front row ground line
const HMIN = 7, HMAX = 92;
const ground = (c, r) => [X0 + c * CW + (6 - r) * DX, YF - (6 - r) * DY];
const centre = (c, r) => add(ground(c, r), [S / 2 + VX / 2, VY / 2]);

const PALETTE = [
  null,
  { top: "#2bd46b", front: ["#1f9a4f", "#0c4d27"], side: "#0b3f20", win: "#7dffb0" },
  { top: "#59f59a", front: ["#25b25c", "#0f5e31"], side: "#0d4a27", win: "#b6ffd2" },
  { top: "#5ff7e6", front: ["#1aa9a0", "#0a5551"], side: "#08403d", win: "#c8fff8" },
  { top: "#d1b8ff", front: ["#8a5cff", "#3a1f9e"], side: "#2b1678", win: "#f1e8ff" },
];

// ---- timing ---------------------------------------------------------------
const DT = 0.05;          // seconds per cell
const ENTRY = 0.9, EXIT = 0.9;
const LAG = 0.022;        // seconds between body segments
const BASE_LEN = 7, MAX_LEN = 30;

function build(cal) {
  const weeks = cal.weeks;
  const ncols = weeks.length;
  const cells = [];
  weeks.forEach((w, c) => w.contributionDays.forEach((d) => cells.push({ c, r: d.weekday, n: d.contributionCount, date: d.date })));
  const max = Math.max(1, ...cells.map((x) => x.n));
  const at = new Map(cells.map((x) => [`${x.c},${x.r}`, x]));

  // serpentine tour: down the first week, up the next, so the year is eaten in order
  const tour = [];
  for (let c = 0; c < ncols; c++) for (let k = 0; k < 7; k++) tour.push([c, c % 2 === 0 ? k : 6 - k]);
  const tEat = (i) => ENTRY + i * DT;
  const tourIndex = new Map(tour.map(([c, r], i) => [`${c},${r}`, i]));
  const tLast = tEat(tour.length - 1);
  const tGone = tLast + EXIT;
  const FIN = tGone + 0.2;               // finale banner
  const REB = FIN + 1.7;                 // rebuild wave start
  const REB_SPAN = 1.3;
  const T = REB + REB_SPAN + 1.6;
  const pc = (t) => `${((Math.max(0, Math.min(t, T)) / T) * 100).toFixed(3)}%`;
  const tRebuild = (c) => REB + (c / Math.max(1, ncols - 1)) * REB_SPAN;

  // eat events in order, with running totals
  const events = [];
  let total = 0;
  tour.forEach(([c, r], i) => {
    const cell = at.get(`${c},${r}`);
    if (cell && cell.n > 0) {
      total += cell.n;
      events.push({ cell, t: tEat(i), total });
    }
  });
  const grandTotal = total;
  events.forEach((e) => (e.cell.t = e.t));

  const css = [];
  const defs = [];
  const body = [];

  // ---- backdrop -----------------------------------------------------------
  defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060d"/><stop offset=".62" stop-color="#0b0820"/><stop offset="1" stop-color="#140a2a"/></linearGradient>`);
  defs.push(`<radialGradient id="haze" cx=".5" cy=".78" r=".6"><stop offset="0" stop-color="#7f52ff" stop-opacity=".38"/><stop offset=".5" stop-color="#7f52ff" stop-opacity=".08"/><stop offset="1" stop-color="#7f52ff" stop-opacity="0"/></radialGradient>`);
  defs.push(`<linearGradient id="gridfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".25"/></linearGradient>`);
  defs.push(`<mask id="gridmask"><rect width="${W}" height="${H}" fill="url(#gridfade)"/></mask>`);
  defs.push(`<pattern id="win" width="4" height="5" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="1.6" height="2" fill="#fff"/></pattern>`);
  defs.push(`<clipPath id="frame"><rect width="${W}" height="${H}" rx="16"/></clipPath>`);
  for (let lv = 1; lv <= 4; lv++) {
    const p = PALETTE[lv];
    defs.push(`<linearGradient id="f${lv}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.front[0]}"/><stop offset="1" stop-color="${p.front[1]}"/></linearGradient>`);
  }

  body.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);
  body.push(`<ellipse cx="${W / 2}" cy="${YF - 40}" rx="${W * 0.62}" ry="190" fill="url(#haze)"/>`);

  // stars
  css.push(`.st{animation:tw 3.2s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}`);
  for (let i = 0; i < 70; i++) {
    const x = r1(rnd() * W), y = r1(64 + rnd() * 110), rr = r1(0.4 + rnd() * 0.9);
    body.push(`<circle class="st" cx="${x}" cy="${y}" r="${rr}" fill="#cfd8ff" style="animation-delay:-${r1(rnd() * 3.2)}s;animation-duration:${r1(2.4 + rnd() * 2.6)}s"/>`);
  }

  // neon floor grid on the board plane, extended past the board
  const grid = [];
  for (let k = -4; k <= 10; k++) {
    const [x, y] = [X0 + (6 - k) * DX, YF - (6 - k) * DY];
    grid.push(`M${r1(x - 400)},${r1(y)}H${r1(x + W + 400)}`);
  }
  for (let c = -8; c <= ncols + 8; c += 2) {
    const a = ground(c, 10), b = ground(c, -5);
    grid.push(`M${pt(a)}L${pt(b)}`);
  }
  body.push(`<path d="${grid.join("")}" stroke="#5ff7e6" stroke-opacity=".13" stroke-width="1" fill="none" mask="url(#gridmask)"/>`);

  // ---- the city -----------------------------------------------------------
  css.push(`.tw{transform-box:fill-box;transform-origin:50% 100%}`);
  css.push(`.tile{fill:#111a3d;stroke:#34428a;stroke-width:.6;stroke-opacity:.8}`);
  css.push(`.trail{fill:#5ff7e6;opacity:0;animation:trail ${T.toFixed(3)}s linear infinite}`);
  css.push(`@keyframes trail{0%{opacity:.75}${pc(1.6)}{opacity:.14}${pc(REB - tLast)}{opacity:.14}${pc(REB - tLast + 0.6)},100%{opacity:0}}`);
  const towers = [];
  const tiles = [];
  const trails = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < ncols; c++) {
      const cell = at.get(`${c},${r}`);
      if (!cell) continue;
      const P = ground(c, r);
      const u = [S, 0], v = [VX, VY];
      const foot = `${pt(P)} ${pt(add(P, u))} ${pt(add(add(P, u), v))} ${pt(add(P, v))}`;
      tiles.push(`<polygon class="tile" points="${foot}"/>`);
      trails.push(`<polygon class="trail" points="${foot}" style="animation-delay:${tEat(tourIndex.get(`${c},${r}`)).toFixed(3)}s"/>`);
      if (cell.n === 0) continue;
      const ratio = cell.n / max;
      const lv = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      const h = HMIN + (HMAX - HMIN) * Math.sqrt(ratio);
      const up = [0, -h];
      const pal = PALETTE[lv];
      const A = P, B = add(P, u), Cc = add(B, v), D = add(P, v);
      const id = `t${c}_${r}`;
      const parts = [
        `<polygon points="${pt(B)} ${pt(Cc)} ${pt(add(Cc, up))} ${pt(add(B, up))}" fill="${pal.side}"/>`,
        `<polygon points="${pt(A)} ${pt(B)} ${pt(add(B, up))} ${pt(add(A, up))}" fill="url(#f${lv})"/>`,
        h > 16 ? `<rect x="${r1(A[0] + 1.5)}" y="${r1(A[1] - h + 4)}" width="${S - 3}" height="${r1(h - 8)}" fill="url(#win)" opacity="${lv >= 3 ? 0.55 : 0.32}"/>` : "",
        `<polygon points="${pt(add(A, up))} ${pt(add(B, up))} ${pt(add(Cc, up))} ${pt(add(D, up))}" fill="${pal.top}"/>`,
        lv >= 3 ? `<polygon points="${pt(add(A, up))} ${pt(add(B, up))} ${pt(add(Cc, up))} ${pt(add(D, up))}" fill="${pal.top}" opacity=".55" filter="url(#bloom)"/>` : "",
      ].join("");
      towers.push(`<g class="tw" style="animation:${id} ${T.toFixed(3)}s linear infinite">${parts}</g>`);
      const te = cell.t, tr = tRebuild(c);
      css.push(
        `@keyframes ${id}{0%,${pc(te - 0.01)}{transform:scaleY(1)}${pc(te + 0.06)}{transform:scaleY(1.12)}${pc(te + 0.3)},${pc(tr)}{transform:scaleY(0)}` +
          `${pc(tr + 0.22)}{transform:scaleY(1.18)}${pc(tr + 0.4)},100%{transform:scaleY(1)}}`
      );
    }
  }
  defs.push(`<filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`);
  body.push(`<g>${tiles.join("")}</g>`);
  body.push(`<g>${trails.join("")}</g>`);
  body.push(`<g>${towers.join("")}</g>`);

  // month labels along the front edge
  const months = [];
  let lastM = -1;
  weeks.forEach((w, c) => {
    const day = w.contributionDays[0]?.date;
    if (!day) return;
    const m = new Date(day + "T00:00:00Z").getUTCMonth();
    if (m !== lastM && c > 0) {
      const [x, y] = ground(c, 6);
      months.push(`<text x="${r1(x)}" y="${r1(y + 22)}">${"JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ")[m]}</text>`);
    }
    lastM = m;
  });
  body.push(`<g font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="10" letter-spacing="1.5" fill="#6d78b8">${months.join("")}</g>`);

  // ---- bite effects: shared keyframes, phase set by a positive delay ------
  css.push(`.fx{opacity:0}`);
  css.push(`.ring{transform-box:fill-box;transform-origin:center;animation:ring ${T.toFixed(3)}s linear infinite}`);
  css.push(`@keyframes ring{0%{opacity:.95;transform:scale(.3)}${pc(0.55)}{opacity:0;transform:scale(2.6)}100%{opacity:0;transform:scale(2.6)}}`);
  css.push(`.pop{animation:pop ${T.toFixed(3)}s linear infinite}`);
  css.push(`@keyframes pop{0%{opacity:0;transform:translateY(0)}${pc(0.06)}{opacity:1}${pc(0.7)}{opacity:1;transform:translateY(-34px)}${pc(0.95)}{opacity:0;transform:translateY(-44px)}100%{opacity:0}}`);
  css.push(`.spk{animation:spk ${T.toFixed(3)}s cubic-bezier(.2,.7,.3,1) infinite}`);
  css.push(`@keyframes spk{0%{opacity:1;transform:translate(0,0)}${pc(0.45)}{opacity:0;transform:translate(var(--x),var(--y))}100%{opacity:0}}`);
  const fx = [];
  for (const e of events) {
    const [x, y] = centre(e.cell.c, e.cell.r);
    const d = `animation-delay:${e.t.toFixed(3)}s`;
    fx.push(`<ellipse class="fx ring" cx="${r1(x)}" cy="${r1(y)}" rx="9" ry="4.5" fill="none" stroke="#ff7ae0" stroke-width="1.6" style="${d}"/>`);
    for (let s = 0; s < 4; s++) {
      const ang = rnd() * Math.PI * 2, dist = 14 + rnd() * 16;
      fx.push(`<circle class="fx spk" cx="${r1(x)}" cy="${r1(y - 6)}" r="1.4" fill="#ffe27a" style="${d};--x:${r1(Math.cos(ang) * dist)}px;--y:${r1(Math.sin(ang) * dist - 10)}px"/>`);
    }
    fx.push(`<text class="fx pop" x="${r1(x)}" y="${r1(y - 14)}" style="${d}">+${e.cell.n}</text>`);
  }
  body.push(`<g font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${fx.join("")}</g>`);

  // ---- the snake ----------------------------------------------------------
  const stops = [];
  const pos = (i) => centre(tour[i][0], tour[i][1]);
  const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const first = pos(0), last = pos(tour.length - 1);
  const offL = [-80, first[1]], offR = [W + 80, last[1]];
  const key = (t, p, a) => stops.push(`${pc(t)}{transform:translate(${r1(p[0])}px,${r1(p[1] - 5)}px) rotate(${Math.round(a)}deg)}`);
  key(0, offL, 0);
  let prevA = 0;
  tour.forEach((_, i) => {
    const p = pos(i);
    const nxt = i + 1 < tour.length ? pos(i + 1) : offR;
    let a = ang(p, nxt);
    while (a - prevA > 180) a -= 360;
    while (a - prevA < -180) a += 360;
    key(tEat(i), p, a);
    prevA = a;
  });
  key(tGone, offR, prevA);
  key(T, offR, prevA);
  css.push(`@keyframes mv{${stops.join("")}}`);
  css.push(`.sg{animation:mv ${T.toFixed(3)}s linear infinite}`);

  const segs = [];
  const step = Math.max(1, events.length / (MAX_LEN - BASE_LEN));
  for (let k = MAX_LEN - 1; k >= 1; k--) {
    const f = k / MAX_LEN;
    const rad = r1(5.6 - f * 3.2);
    const col = mix("#ff4fd8", "#7f52ff", f);
    const delay = -(T - k * LAG);
    let vis = "";
    if (k >= BASE_LEN) {
      const ev = events[Math.min(events.length - 1, Math.floor((k - BASE_LEN) * step))];
      const tv = ev ? ev.t : tLast;
      vis = ` style="animation:g${k} ${T.toFixed(3)}s linear infinite"`;
      css.push(`@keyframes g${k}{0%,${pc(tv)}{opacity:0}${pc(tv + 0.25)},${pc(T - 0.05)}{opacity:1}100%{opacity:0}}`);
    }
    segs.push(
      `<g${vis}><g class="sg" style="animation-delay:${delay.toFixed(3)}s"><circle r="${r1(rad * 2.1)}" fill="${col}" opacity=".16"/><circle r="${rad}" fill="${col}"/><circle r="${r1(rad * 0.45)}" cx="-${r1(rad * 0.2)}" cy="-${r1(rad * 0.3)}" fill="#fff" opacity=".35"/></g></g>`
    );
  }
  segs.push(
    `<g class="sg"><circle r="15" fill="#ff4fd8" opacity=".18"/><ellipse rx="8.6" ry="7" fill="#ff6fe0"/><ellipse cx="2" rx="6" ry="4.6" fill="#ffb3f1" opacity=".55"/>` +
      `<circle cx="4.2" cy="-3.3" r="2" fill="#fff"/><circle cx="4.2" cy="3.3" r="2" fill="#fff"/><circle cx="5" cy="-3.3" r="1" fill="#120326"/><circle cx="5" cy="3.3" r="1" fill="#120326"/>` +
      `<path class="tg" d="M8.4,0 L14,0 M14,0 L17,-2.4 M14,0 L17,2.4" stroke="#ffe27a" stroke-width="1.2" stroke-linecap="round"/></g>`
  );
  css.push(`.tg{animation:tg .5s steps(2) infinite}@keyframes tg{0%{opacity:1}100%{opacity:0}}`);
  body.push(`<g>${segs.join("")}</g>`);

  // ---- HUD ----------------------------------------------------------------
  const mono = `font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"`;
  body.push(`<rect x="0" y="0" width="${W}" height="54" fill="#05060d" opacity=".72"/><path d="M0,54H${W}" stroke="#7f52ff" stroke-opacity=".55"/>`);
  body.push(`<text x="26" y="26" ${mono} font-size="15" font-weight="700" letter-spacing="3" fill="#eaffe0">CONTRIBUTION CITY</text>`);
  body.push(`<text x="26" y="43" ${mono} font-size="10.5" letter-spacing="1" fill="#6f8f9f">one building per day of the last year · the snake eats it week by week · refreshed daily</text>`);

  const LH = 24;
  const still = [];
  defs.push(`<clipPath id="dg"><rect x="-1" y="-19" width="16" height="${LH}"/></clipPath>`);
  css.push(`.lab{font-size:10px;letter-spacing:2px;fill:#6f8f9f}`);
  const odometer = (label, x, digits, series, color) => {
    // series: [{t, v}] in time order, value before the first entry is 0
    let out = `<text class="lab" x="${x}" y="19" ${mono}>${label}</text>`;
    for (let d = 0; d < digits; d++) {
      const pow = 10 ** (digits - 1 - d);
      const id = `${label.toLowerCase()}${d}`;
      const st = [`0%{transform:translateY(0)}`];
      let cur = 0;
      for (const { t, v } of series) {
        const dv = Math.floor(v / pow) % 10;
        if (dv === cur) continue;
        st.push(`${pc(t - 0.001)}{transform:translateY(${-cur * LH}px)}${pc(t + 0.04)}{transform:translateY(${-dv * LH}px)}`);
        cur = dv;
      }
      st.push(`${pc(T - 0.25)}{transform:translateY(${-cur * LH}px)}100%{transform:translateY(0)}`);
      css.push(`@keyframes ${id}{${st.join("")}}`);
      still.push(`.${id}{transform:translateY(${-cur * LH}px)}`);
      const reel = Array.from({ length: 10 }, (_, n) => `<text y="${n * LH}">${n}</text>`).join("");
      out += `<g transform="translate(${x + d * 15},44)" clip-path="url(#dg)"><g class="${id}" style="animation:${id} ${T.toFixed(3)}s linear infinite">${reel}</g></g>`;
    }
    return `<g ${mono} font-size="21" font-weight="700" fill="${color}">${out}</g>`;
  };
  const digitsFor = (n) => Math.max(3, String(n).length);
  const eaten = events.map((e) => ({ t: e.t, v: e.total }));
  const wk = Array.from({ length: ncols }, (_, c) => ({ t: tEat(c * 7), v: c + 1 }));
  const len = [];
  for (let k = BASE_LEN; k < MAX_LEN; k++) {
    const ev = events[Math.min(events.length - 1, Math.floor((k - BASE_LEN) * step))];
    if (ev) len.push({ t: ev.t + 0.25, v: k + 1 });
  }
  const lenByT = new Map([[0.01, BASE_LEN], ...len.map((e) => [e.t, e.v])]);
  const lenSeries = [...lenByT].map(([t, v]) => ({ t, v }));
  body.push(odometer("EATEN", W - 360, digitsFor(grandTotal), eaten, "#ffe27a"));
  body.push(odometer("WEEK", W - 220, 2, wk, "#5ff7e6"));
  body.push(odometer("LENGTH", W - 120, 2, lenSeries, "#ff7ae0"));

  // ---- finale -------------------------------------------------------------
  css.push(`.fin{opacity:0;animation:fin ${T.toFixed(3)}s linear infinite}`);
  css.push(`@keyframes fin{0%,${pc(FIN)}{opacity:0;transform:translateY(8px)}${pc(FIN + 0.25)}{opacity:1;transform:translateY(0)}${pc(REB + 0.2)}{opacity:1}${pc(REB + 0.6)},100%{opacity:0}}`);
  css.push(`.fl{opacity:0;animation:fl ${T.toFixed(3)}s linear infinite}`);
  css.push(`@keyframes fl{0%,${pc(FIN)}{opacity:0}${pc(FIN + 0.05)}{opacity:.35}${pc(FIN + 0.5)},100%{opacity:0}}`);
  body.push(`<rect class="fl" width="${W}" height="${H}" fill="#ff7ae0"/>`);
  body.push(
    `<g class="fin" ${mono} text-anchor="middle"><rect x="${W / 2 - 250}" y="118" width="500" height="92" rx="12" fill="#05060d" opacity=".82" stroke="#ff7ae0" stroke-opacity=".7"/>` +
      `<text x="${W / 2}" y="160" font-size="30" font-weight="800" letter-spacing="6" fill="#fff">YEAR CLEARED</text>` +
      `<text x="${W / 2}" y="190" font-size="13" letter-spacing="2.5" fill="#ffe27a">${grandTotal} CONTRIBUTIONS EATEN · REBUILDING THE CITY</text></g>`
  );

  css.push(`@media (prefers-reduced-motion:reduce){*{animation:none!important}.fx,.fin,.fl,.sg{opacity:0}${still.join("")}}`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Contribution City: ${grandTotal} contributions in the last year drawn as a neon city that a snake eats week by week">
<title>Contribution City: ${grandTotal} contributions in the last year</title>
<style>${css.join("\n")}</style>
<defs>${defs.join("")}</defs>
<g clip-path="url(#frame)">${body.join("\n")}</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="none" stroke="#7f52ff" stroke-opacity=".45"/>
</svg>
`;
}

function mix(a, b, f) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * f).toString(16).padStart(2, "0")).join("");
}

let cal = await fetchCalendar();
if (process.env.PRIVATE_AWARE === "1") cal = (await withPrivateWork(cal, { user: USER, token: TOKEN })).calendar;
const svg = build(cal);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} (${(svg.length / 1024).toFixed(1)} KB, ${cal.totalContributions} contributions)`);
