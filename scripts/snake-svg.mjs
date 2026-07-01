// Generates assets/snake-game.svg — a self-playing arcade Snake with a REAL snake.
//
// Not a row of blocks: the body is a smooth, tapered tube made of many
// overlapping segments, led by a sculpted snake head that turns to face its
// travel direction, with amber slit eyes, nostrils and a forked tongue that
// flicks. It slithers a serpentine grid, eats apples and GROWS one body-length
// per apple, with a live SCORE / LENGTH / HIGH HUD and a spark burst per bite.
//
// Pure CSS-animated SVG so it plays inside a GitHub README when served as <img>
// (same mechanism as the contribution snake). No JS runs at view time.
//
// How the motion works:
//   - snk-move samples the serpentine path over the loop; every body segment
//     runs it with a negative delay so it trails the head by a fixed arc-length.
//     Using SUB segments per grid cell makes the tube smooth, not chunky.
//   - the head runs snk-head, which is snk-move PLUS a per-keyframe rotation to
//     the current heading, so the snout always points the way it moves.
//   - grow/reveal + HUD windows are keyed to whole cells (LENGTH 4 -> 11).
//
// Run: node scripts/snake-svg.mjs   ->   writes assets/snake-game.svg
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = `${__dir}/../assets/snake-game.svg`;

// ---- geometry -------------------------------------------------------------
const COLS = 15;
const ROWS = 6;
const CELL = 36;
const PAD = 24;            // padding around the playfield
const HUD = 62;            // top HUD bar height
const FIELD_W = COLS * CELL;
const FIELD_H = ROWS * CELL;
const OX = PAD;            // field origin x
const OY = PAD + HUD;      // field origin y
const W = FIELD_W + PAD * 2;
const H = FIELD_H + PAD * 2 + HUD;

// ---- snake / game timing --------------------------------------------------
const DUR = 15;            // seconds for one full loop
const BASE_LEN = 4;        // starting body length in cells
const FOODS = [9, 21, 33, 45, 57, 69, 80]; // path indices where apples sit
const MAX_LEN = BASE_LEN + FOODS.length;   // 11 cells
const HIGH = 990;          // static "HIGH SCORE" flavour on the HUD

const SUB = 5;                       // body segments per cell -> smooth tube
const TOTAL = MAX_LEN * SUB;         // total body segments
const BODY_R = CELL * 0.40;          // fattest radius (just behind the head)
const TAIL_R = CELL * 0.11;          // pointed tail
// Head is an egg/teardrop: only slightly wider than the body (so it blends into
// the tube with no lump/seam) and elongated toward the snout. HH = half-width
// across the body, HW = half-length along travel.
const HH = BODY_R * 1.12;            // head half-width (a touch fatter than body)
const HW = BODY_R * 1.62;            // head half-length (snout reach); kept short so
                                     // the head never overshoots a cell on a turn

const center = (cx, cy) => [OX + cx * CELL + CELL / 2, OY + cy * CELL + CELL / 2];

// ---- build the closed path (serpentine forward + return up left column) ---
const path = [];
for (let y = 0; y < ROWS; y++) {
  if (y % 2 === 0) for (let x = 0; x < COLS; x++) path.push([x, y]);
  else for (let x = COLS - 1; x >= 0; x--) path.push([x, y]);
}
// forward ends at (0, ROWS-1) because ROWS is even -> climb the left column home.
// Stop the climb at (0,1): the wrap index N -> 0 lands on (0,0) itself, so pushing
// (0,0) here too would duplicate it -> a zero-length segment at the loop seam that
// makes the head heading undefined (snaps to 0deg) on every restart. Ending at
// (0,1) leaves a clean up-heading into the seam.
for (let y = ROWS - 2; y >= 1; y--) path.push([0, y]);
const N = path.length;            // loop length; index N wraps to index 0

const pct = (i) => +((i / N) * 100).toFixed(3);
const eatPct = (idx) => pct(idx);

// heading angle (degrees) at each node, from the LOCAL TANGENT (prev -> next),
// unwrapped so the head turns the short way. Using prev->next instead of
// this->next is the fix for the head jutting out of the tube on turns: at a hard
// single-cell 90deg U-turn, this->next snaps the head a full 90deg while its body
// is still in the OLD row (snout stabs into an empty lane, round back pokes out).
// The tangent makes the head BANK through the corner (0 -> 45 -> 135 -> 180)
// instead of snapping, so it stays seated on the body. Straights are unaffected
// (prev->next == forward there).
const headings = [];
let prevAng = 0;
for (let i = 0; i <= N; i++) {
  const [px, py] = path[(i - 1 + N) % N];
  const [nx, ny] = path[(i + 1) % N];
  let ang = (Math.atan2(ny - py, nx - px) * 180) / Math.PI;
  if (i === 0) prevAng = ang;
  while (ang - prevAng > 180) ang -= 360;
  while (ang - prevAng < -180) ang += 360;
  headings.push(ang);
  prevAng = ang;
}

// ---- color helpers --------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;

// ---- move keyframes: translate a centered element along the path -----------
function moveKeyframes() {
  let k = "@keyframes snk-move{\n";
  for (let i = 0; i <= N; i++) {
    const [cx, cy] = center(...path[i % N]);
    k += `  ${pct(i)}%{transform:translate(${cx}px,${cy}px)}\n`;
  }
  return k + "}\n";
}

// per-cell reveal — the segments of a grown cell pop in when its apple is eaten,
// then vanish at the seam so the loop restarts at BASE_LEN.
function revealKeyframes(cell, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-grow-${cell}{` +
    `0%{opacity:0;transform:scale(.2)}` +
    `${(e - 0.6).toFixed(2)}%{opacity:0;transform:scale(.2)}` +
    `${e.toFixed(2)}%{opacity:1;transform:scale(1.15)}` +
    `${(e + 1.4).toFixed(2)}%{opacity:1;transform:scale(1)}` +
    `92%{opacity:1;transform:scale(1)}` +
    `${(91.5 + (MAX_LEN - cell) * 0.5).toFixed(2)}%{opacity:0;transform:scale(.2)}` +
    `100%{opacity:0;transform:scale(.2)}}`
  );
}

// apple: gentle idle bob, pop on eat, respawn at seam
function foodKeyframes(j, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-food-${j}{` +
    `0%{opacity:1;transform:translateY(0) scale(1)}` +
    `${(e - 6).toFixed(2)}%{opacity:1;transform:translateY(0) scale(1)}` +
    `${(e - 3).toFixed(2)}%{transform:translateY(-2px) scale(1.04)}` +
    `${(e - 0.4).toFixed(2)}%{opacity:1;transform:translateY(0) scale(1)}` +
    `${e.toFixed(2)}%{opacity:1;transform:translateY(0) scale(1.5)}` +
    `${(e + 1.0).toFixed(2)}%{opacity:0;transform:translateY(0) scale(.1)}` +
    `99%{opacity:0;transform:translateY(0) scale(.1)}` +
    `100%{opacity:1;transform:translateY(0) scale(1)}}`
  );
}
function ringKeyframes(j, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-ring-${j}{` +
    `0%,${(e - 0.2).toFixed(2)}%{opacity:0;transform:scale(.2)}` +
    `${e.toFixed(2)}%{opacity:.95;transform:scale(.3)}` +
    `${(e + 2.4).toFixed(2)}%{opacity:0;transform:scale(2.3)}` +
    `100%{opacity:0;transform:scale(2.3)}}`
  );
}
function sparkKeyframes(name, foodIdx, dx, dy) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes ${name}{` +
    `0%,${(e - 0.2).toFixed(2)}%{opacity:0;transform:translate(0,0) scale(.4)}` +
    `${e.toFixed(2)}%{opacity:1;transform:translate(0,0) scale(1)}` +
    `${(e + 2.0).toFixed(2)}%{opacity:0;transform:translate(${dx}px,${dy}px) scale(.2)}` +
    `100%{opacity:0;transform:translate(${dx}px,${dy}px) scale(.2)}}`
  );
}
function hudKeyframes(name, idxStart, idxEnd) {
  const a = idxStart === null ? 0 : eatPct(idxStart);
  const b = idxEnd === null ? 100 : eatPct(idxEnd);
  return (
    `@keyframes ${name}{` +
    `0%{opacity:${idxStart === null ? 1 : 0}}` +
    (idxStart === null ? "" : `${(a - 0.3).toFixed(2)}%{opacity:0}${a.toFixed(2)}%{opacity:1}`) +
    `${(b - 0.3).toFixed(2)}%{opacity:1}` +
    (idxEnd === null ? `100%{opacity:1}` : `${b.toFixed(2)}%{opacity:0}100%{opacity:0}`) +
    `}`
  );
}

// ---- assemble body segments (tail first, so front overlaps back) ----------
let body = "";
for (let k = TOTAL - 1; k >= 0; k--) {
  const frac = TOTAL === 1 ? 0 : k / (TOTAL - 1);         // 0 head end -> 1 tail
  const r = lerp(BODY_R, TAIL_R, frac);
  const cell = Math.floor(k / SUB);
  const delay = ((k / SUB) * (DUR / N) - DUR).toFixed(4); // trails the head
  const grown = cell >= BASE_LEN;
  const innerStyle = grown
    ? ` style="animation:snk-grow-${cell} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center;opacity:0"`
    : "";
  // gloss dot sits high on each segment to imply a rounded, glassy back
  const gloss = `<ellipse cx="${-r * 0.18}" cy="${-r * 0.42}" rx="${r * 0.5}" ry="${r * 0.3}" fill="url(#gloss)" opacity=".55"/>`;
  body +=
    `<g class="seg" style="animation:snk-move ${DUR}s linear ${delay}s infinite">` +
    `<g${innerStyle}>` +
    `<circle cx="1.4" cy="2.2" r="${r}" fill="#000" opacity=".26"/>` + // grounded shadow
    `<circle r="${r}" fill="url(#bodyGrad)"/>` +
    gloss +
    `</g></g>`;
}

// ---- sculpted head: an egg/teardrop that blends into the tube --------------
// Back is as round as the body (no lump), tapering to a soft snout at +x.
const f = (n) => n.toFixed(1);
const headShape =
  `<path d="M ${f(-HW * 0.82)} 0 ` +
  `C ${f(-HW * 0.82)} ${f(-HH)}, ${f(-HW * 0.1)} ${f(-HH)}, ${f(HW * 0.45)} ${f(-HH * 0.94)} ` +
  `C ${f(HW * 0.86)} ${f(-HH * 0.82)}, ${f(HW * 1.02)} ${f(-HH * 0.42)}, ${f(HW * 1.12)} 0 ` +
  `C ${f(HW * 1.02)} ${f(HH * 0.42)}, ${f(HW * 0.86)} ${f(HH * 0.82)}, ${f(HW * 0.45)} ${f(HH * 0.94)} ` +
  `C ${f(-HW * 0.1)} ${f(HH)}, ${f(-HW * 0.82)} ${f(HH)}, ${f(-HW * 0.82)} 0 Z" ` +
  `fill="url(#headGrad)" stroke="#1c5417" stroke-width="1"/>`;
// eyes: small, rounded, set forward on top of the head, both facing out; a soft
// amber iris with a slim vertical pupil and a highlight. No wide slits, no mouth.
const eye = (sy) =>
  `<g>` +
  `<ellipse cx="${f(HW * 0.42)}" cy="${f(sy * HH * 0.5)}" rx="${f(HH * 0.3)}" ry="${f(HH * 0.34)}" fill="#ffcf4d" stroke="#7a4a12" stroke-width=".8"/>` +
  `<ellipse cx="${f(HW * 0.42)}" cy="${f(sy * HH * 0.5)}" rx="${f(HH * 0.1)}" ry="${f(HH * 0.24)}" fill="#12200f"/>` +
  `<circle cx="${f(HW * 0.42 + HH * 0.1)}" cy="${f(sy * HH * 0.5 - HH * 0.12)}" r="${f(HH * 0.08)}" fill="#fff" opacity=".95"/>` +
  `</g>`;
const headDetail =
  `<ellipse cx="${f(HW * 0.32)}" cy="0" rx="${f(HW * 1.12)}" ry="${f(HH * 1.25)}" fill="url(#headHalo)" opacity=".7"/>` +
  headShape +
  // top gloss for a rounded, glassy crown
  `<ellipse cx="${f(HW * 0.05)}" cy="${f(-HH * 0.42)}" rx="${f(HW * 0.62)}" ry="${f(HH * 0.4)}" fill="url(#gloss)" opacity=".5"/>` +
  // nostrils near the snout tip
  `<circle cx="${f(HW * 0.98)}" cy="${f(-HH * 0.16)}" r="1.3" fill="#123a10"/>` +
  `<circle cx="${f(HW * 0.98)}" cy="${f(HH * 0.16)}" r="1.3" fill="#123a10"/>` +
  eye(-1) + eye(1);
// forked tongue flicking from the snout tip
const tongue =
  `<g class="tongue">` +
  `<path d="M ${f(HW * 1.08)} 0 L ${f(HW * 1.7)} 0 M ${f(HW * 1.7)} 0 L ${f(HW * 1.95)} ${f(-HH * 0.3)} M ${f(HW * 1.7)} 0 L ${f(HW * 1.95)} ${f(HH * 0.3)}" ` +
  `stroke="#ff3b5c" stroke-width="2" stroke-linecap="round" fill="none"/></g>`;
// The head is positioned by a pure translate (snk-move, same phase as the front
// body segment) on the OUTER group, and rotated by a SMIL animateTransform on
// the INNER group. SVG rotate(a) pivots about local (0,0) — the head's true
// anchor — so the pivot no longer depends on the bounding box (halo/tongue/snout
// all extend along +x, which is what previously threw the pivot off and made the
// head swing out of place on turns and on the return climb).
const rotKeyTimes = headings.map((_, i) => (i / N).toFixed(5)).join(";");
const rotValues = headings.map((a) => a.toFixed(1)).join(";");
const head =
  `<g class="headpos" style="animation:snk-move ${DUR}s linear infinite">` +
  `<g>` +
  `<animateTransform attributeName="transform" attributeType="XML" type="rotate" ` +
  `dur="${DUR}s" repeatCount="indefinite" calcMode="linear" keyTimes="${rotKeyTimes}" values="${rotValues}"/>` +
  tongue + headDetail +
  `</g></g>`;

// ---- apples + sparks ------------------------------------------------------
let foodEls = "";
let sparkKf = "";
FOODS.forEach((idx, j) => {
  const [px, py] = center(...path[idx]);
  const r = CELL * 0.3;
  foodEls +=
    `<g transform="translate(${px} ${py})">` +
    `<circle class="ring" r="${r}" fill="none" stroke="#ffd166" stroke-width="2.5" ` +
    `style="animation:snk-ring-${j} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center"/>`;
  const SPARKS = 6;
  for (let s = 0; s < SPARKS; s++) {
    const ang = (s / SPARKS) * Math.PI * 2 + j * 0.5;
    const dist = 20 + (s % 2) * 8;
    const dx = +(Math.cos(ang) * dist).toFixed(1);
    const dy = +(Math.sin(ang) * dist).toFixed(1);
    const name = `snk-spark-${j}-${s}`;
    sparkKf += sparkKeyframes(name, idx, dx, dy) + "\n";
    const sr = 2 + (s % 3) * 0.6;
    const fill = s % 2 ? "#ffe08a" : "#ff8a5c";
    foodEls +=
      `<circle r="${sr.toFixed(1)}" fill="${fill}" ` +
      `style="animation:${name} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center"/>`;
  }
  foodEls +=
    `<g class="food" style="animation:snk-food-${j} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center">` +
    `<circle r="${r}" fill="url(#appleGrad)" filter="url(#foodGlow)"/>` +
    `<circle cx="${-r * 0.3}" cy="${-r * 0.36}" r="${r * 0.3}" fill="#fff" opacity=".85"/>` +
    `<rect x="-1.4" y="${-r - 4}" width="2.8" height="6" rx="1.4" fill="#7a4a25"/>` +
    `<path d="M1 ${-r - 2} q8 -5 11 2 q-8 4 -11 -2 z" fill="#5fbe3c"/>` +
    `</g></g>`;
});

// ---- HUD ------------------------------------------------------------------
let scoreEls = "", lenEls = "", hudKf = "";
const scoreX = W - PAD - 10, lenX = W - PAD - 150;
for (let j = 0; j <= FOODS.length; j++) {
  const start = j === 0 ? null : FOODS[j - 1];
  const end = j === FOODS.length ? null : FOODS[j];
  hudKf += hudKeyframes(`snk-score-${j}`, start, end);
  hudKf += hudKeyframes(`snk-len-${j}`, start, end);
  scoreEls +=
    `<text x="${scoreX}" y="${PAD + 40}" text-anchor="end" class="hud-val" ` +
    `style="animation:snk-score-${j} ${DUR}s linear infinite">${String(j * 10).padStart(3, "0")}</text>`;
  lenEls +=
    `<text x="${lenX}" y="${PAD + 40}" text-anchor="end" class="hud-val len" ` +
    `style="animation:snk-len-${j} ${DUR}s linear infinite">${String(BASE_LEN + j).padStart(2, "0")}</text>`;
}

// grid + scanlines + rivets
let grid = "";
for (let x = 0; x <= COLS; x++)
  grid += `<line x1="${OX + x * CELL}" y1="${OY}" x2="${OX + x * CELL}" y2="${OY + FIELD_H}"/>`;
for (let y = 0; y <= ROWS; y++)
  grid += `<line x1="${OX}" y1="${OY + y * CELL}" x2="${OX + FIELD_W}" y2="${OY + y * CELL}"/>`;
let scan = "";
for (let y = 0; y < H; y += 3) scan += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
const rivet = (x, y) => `<circle cx="${x}" cy="${y}" r="4.5" fill="url(#rivet)" stroke="#000" stroke-opacity=".4"/>`;
const rivets = rivet(18, 18) + rivet(W - 18, 18) + rivet(18, H - 18) + rivet(W - 18, H - 18);

// ---- styles ---------------------------------------------------------------
let css = moveKeyframes();
for (let c = BASE_LEN; c < MAX_LEN; c++) css += revealKeyframes(c, FOODS[c - BASE_LEN]) + "\n";
FOODS.forEach((idx, j) => { css += foodKeyframes(j, idx) + "\n" + ringKeyframes(j, idx) + "\n"; });
css += sparkKf + "\n" + hudKf + "\n";
css += `@keyframes snk-tongue{0%,30%,100%{opacity:0;transform:scaleX(.1)}36%,44%{opacity:1;transform:scaleX(1)}40%{transform:scaleX(.7)}50%{opacity:0;transform:scaleX(.1)}}`;
css += `@keyframes snk-led{0%,49%{opacity:1}50%,100%{opacity:.25}}`;
css += `@keyframes snk-marquee{0%,100%{opacity:.85}50%{opacity:1}}`;

const style = `
<style>
  .seg{transform-box:fill-box;transform-origin:center;will-change:transform}
  .headpos{will-change:transform}
  .tongue{transform-box:fill-box;transform-origin:left center;animation:snk-tongue 3.2s ease-in-out infinite}
  .grid line{stroke:rgba(124,255,150,.06);stroke-width:1}
  .scan line{stroke:rgba(0,0,0,.14);stroke-width:1}
  .marquee{font:800 24px 'Courier New',monospace;letter-spacing:7px;fill:#8CF06B;animation:snk-marquee 2.4s ease-in-out infinite}
  .hud-label{font:700 11px 'Courier New',monospace;letter-spacing:3px;fill:#5f7d66}
  .hud-val{font:700 30px 'Courier New',monospace;letter-spacing:2px;fill:#eaffe0}
  .hud-val.len{fill:#b48cff}
  .hud-high{font:700 15px 'Courier New',monospace;letter-spacing:2px;fill:#ffd166}
  .credit{font:600 10px 'Courier New',monospace;letter-spacing:3px;fill:#3f5a46}
  .led{animation:snk-led 1.1s steps(1) infinite}
  ${css}
</style>`;

// ---- compose SVG ----------------------------------------------------------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Self-playing arcade snake that grows one body length each time it eats an apple">
<defs>
  <linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7F52FF"/><stop offset=".5" stop-color="#4b8f57"/><stop offset="1" stop-color="#6DB33F"/>
  </linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#101a12"/><stop offset="1" stop-color="#060907"/>
  </linearGradient>
  <radialGradient id="field" cx="50%" cy="40%" r="80%">
    <stop offset="0" stop-color="#0d1913"/><stop offset="100%" stop-color="#060f0a"/>
  </radialGradient>
  <radialGradient id="bodyGrad" cx="42%" cy="32%" r="72%">
    <stop offset="0" stop-color="#9fe873"/><stop offset=".5" stop-color="#5cb83e"/><stop offset="1" stop-color="#256f28"/>
  </radialGradient>
  <linearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c1ff9c"/><stop offset=".55" stop-color="#6fce46"/><stop offset="1" stop-color="#2f7d24"/>
  </linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="appleGrad" cx="38%" cy="34%" r="75%">
    <stop offset="0" stop-color="#ff8a8a"/><stop offset=".55" stop-color="#ef3b53"/><stop offset="1" stop-color="#b31228"/>
  </radialGradient>
  <radialGradient id="headHalo" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#9cff7a" stop-opacity=".5"/><stop offset="100%" stop-color="#9cff7a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="rivet" cx="35%" cy="35%" r="70%">
    <stop offset="0" stop-color="#e7e7ef"/><stop offset="1" stop-color="#6b6b76"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="42%" r="75%">
    <stop offset="58%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".5"/>
  </radialGradient>
  <linearGradient id="glare" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".08"/><stop offset=".18" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <filter id="foodGlow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="marqueeGlow" x="-30%" y="-60%" width="160%" height="260%">
    <feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<!-- cabinet -->
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="22" fill="url(#bezel)"/>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="17" fill="url(#panel)"/>
${rivets}

<!-- HUD -->
<g filter="url(#marqueeGlow)"><text x="${PAD}" y="${PAD + 34}" class="marquee">SNAKE</text></g>
<circle class="led" cx="${PAD + 96}" cy="${PAD + 27}" r="4" fill="#6DB33F"/>
<text x="${PAD}" y="${PAD + 52}" class="credit">ARCADE · AUTOPLAY</text>
<text x="${scoreX}" y="${PAD + 16}" text-anchor="end" class="hud-label">SCORE</text>
<text x="${lenX}" y="${PAD + 16}" text-anchor="end" class="hud-label">LENGTH</text>
<text x="${PAD + 150}" y="${PAD + 40}" class="hud-high">HIGH ${HIGH}</text>
${scoreEls}
${lenEls}

<!-- playfield -->
<rect x="${OX - 3}" y="${OY - 3}" width="${FIELD_W + 6}" height="${FIELD_H + 6}" rx="10" fill="#000" opacity=".45"/>
<rect x="${OX}" y="${OY}" width="${FIELD_W}" height="${FIELD_H}" rx="8" fill="url(#field)"/>
<g class="grid">${grid}</g>

${foodEls}
${body}
${head}

<!-- overlays -->
<g class="scan">${scan}</g>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="17" fill="url(#glare)"/>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="17" fill="url(#vig)"/>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="17" fill="none" stroke="rgba(124,255,150,.10)" stroke-width="1"/>
${style}
</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`snake -> ${OUT}  (${(svg.length / 1024).toFixed(1)} KB, N=${N}, segs=${TOTAL}, len ${BASE_LEN}->${MAX_LEN})`);
