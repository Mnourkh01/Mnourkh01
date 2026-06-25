// Generates assets/snake-game.svg — a self-playing arcade Snake.
// The snake slithers a grid, eats apples, and GROWS one segment per apple,
// with a live SCORE + LENGTH HUD. Pure CSS-animated SVG so it animates inside
// a GitHub README (served as <img>, same mechanism as the contribution snake).
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
const CELL = 34;
const PAD = 22;            // padding around the playfield
const HUD = 56;            // top HUD bar height
const FIELD_W = COLS * CELL;
const FIELD_H = ROWS * CELL;
const OX = PAD;            // field origin x
const OY = PAD + HUD;      // field origin y
const W = FIELD_W + PAD * 2;
const H = FIELD_H + PAD * 2 + HUD;

const SEG = Math.round(CELL * 0.84);   // segment square size
const SEG_OFF = (CELL - SEG) / 2;
const RAD = Math.round(SEG * 0.32);    // segment corner radius

// ---- snake / game timing --------------------------------------------------
const DUR = 13;            // seconds for one full loop
const BASE_LEN = 4;        // starting body length
const FOODS = [9, 21, 33, 45, 57, 69, 80]; // path indices where apples sit
const MAX_LEN = BASE_LEN + FOODS.length;   // 11

const center = (cx, cy) => [OX + cx * CELL + CELL / 2, OY + cy * CELL + CELL / 2];
const topleft = (cx, cy) => {
  const [px, py] = center(cx, cy);
  return [px - SEG / 2, py - SEG / 2];
};

// ---- build the closed path (serpentine forward + return up left column) ---
const path = [];
for (let y = 0; y < ROWS; y++) {
  if (y % 2 === 0) for (let x = 0; x < COLS; x++) path.push([x, y]);
  else for (let x = COLS - 1; x >= 0; x--) path.push([x, y]);
}
// forward ends at (0, ROWS-1) because ROWS is even -> climb the left column home
for (let y = ROWS - 2; y >= 0; y--) path.push([0, y]);
const N = path.length;            // loop length; index N wraps to index 0
const FWD = COLS * ROWS;          // forward-pass length

const pct = (i) => +((i / N) * 100).toFixed(3);
const eatPct = (idx) => pct(idx);

// ---- color helpers --------------------------------------------------------
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) =>
  `rgb(${lerp(c1[0], c2[0], t)},${lerp(c1[1], c2[1], t)},${lerp(c1[2], c2[2], t)})`;
const HEAD = [150, 240, 120];
const BODY_HI = [109, 179, 63];   // #6DB33F
const BODY_LO = [33, 96, 45];     // dark tail

// ---- move keyframes (shared by every segment) -----------------------------
function moveKeyframes() {
  let k = "@keyframes snk-move{\n";
  for (let i = 0; i <= N; i++) {
    const [cx, cy] = path[i % N];
    const [x, y] = topleft(cx, cy);
    k += `  ${pct(i)}%{transform:translate(${x}px,${y}px)}\n`;
  }
  return k + "}\n";
}

// reveal keyframes — a grown segment pops in the instant its apple is eaten,
// then the snake shrinks back to base length on the return run (seam reset).
function revealKeyframes(k, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-grow-${k}{` +
    `0%{opacity:0;transform:scale(.2)}` +
    `${(e - 0.6).toFixed(2)}%{opacity:0;transform:scale(.2)}` +
    `${e.toFixed(2)}%{opacity:1;transform:scale(1.18)}` +
    `${(e + 1.4).toFixed(2)}%{opacity:1;transform:scale(1)}` +
    `92%{opacity:1;transform:scale(1)}` +
    `${91.5 + (MAX_LEN - k) * 0.6}%{opacity:0;transform:scale(.2)}` +
    `100%{opacity:0;transform:scale(.2)}}`
  );
}

// food keyframes — apple visible & pulsing, then eaten (pop + fade), respawns at seam
function foodKeyframes(j, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-food-${j}{` +
    `0%{opacity:1;transform:scale(1)}` +
    `${(e - 0.4).toFixed(2)}%{opacity:1;transform:scale(1)}` +
    `${e.toFixed(2)}%{opacity:1;transform:scale(1.5)}` +
    `${(e + 1.0).toFixed(2)}%{opacity:0;transform:scale(.1)}` +
    `99%{opacity:0;transform:scale(.1)}` +
    `100%{opacity:1;transform:scale(1)}}`
  );
}
function ringKeyframes(j, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-ring-${j}{` +
    `0%,${(e - 0.2).toFixed(2)}%{opacity:0;transform:scale(.2)}` +
    `${e.toFixed(2)}%{opacity:.9;transform:scale(.3)}` +
    `${(e + 2.2).toFixed(2)}%{opacity:0;transform:scale(2.1)}` +
    `100%{opacity:0;transform:scale(2.1)}}`
  );
}
// HUD value windows: value j shown between food j-1 and food j eaten
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

// ---- assemble segments ----------------------------------------------------
let segs = "";
for (let k = MAX_LEN - 1; k >= 0; k--) {
  // draw tail first so the head renders on top
  const t = MAX_LEN === 1 ? 0 : k / (MAX_LEN - 1);
  const fill = k === 0 ? mix(HEAD, HEAD, 0) : mix(BODY_HI, BODY_LO, Math.min(1, t * 1.15));
  const delay = (k * (DUR / N) - DUR).toFixed(4); // body trails head by k cells
  const grown = k >= BASE_LEN;
  const opacity = grown ? 0 : 1;
  const headBits =
    k === 0
      ? `<rect class="hl" x="${SEG * 0.18}" y="${SEG * 0.16}" width="${SEG * 0.34}" height="${SEG * 0.28}" rx="${RAD * 0.5}" fill="#eaffe0" opacity=".55"/>`
      : "";
  // outer <g> owns the path movement (translate); inner <g> owns the grow
  // pop + reveal (opacity + scale). Separate elements so the two animations
  // never fight over the same `transform` property.
  const innerStyle = grown
    ? ` style="animation:snk-grow-${k} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center;opacity:${opacity}"`
    : "";
  segs +=
    `<g class="seg${k === 0 ? " head" : ""}" style="animation:snk-move ${DUR}s linear ${delay}s infinite">` +
    `<g${innerStyle}>` +
    `<rect width="${SEG}" height="${SEG}" rx="${RAD}" fill="${fill}"` +
    (k === 0 ? ` filter="url(#headGlow)"` : ``) + `/>` +
    headBits +
    `</g></g>`;
}

// ---- assemble food --------------------------------------------------------
let foodEls = "";
FOODS.forEach((idx, j) => {
  const [cx, cy] = path[idx];
  const [px, py] = center(cx, cy);
  const r = SEG * 0.3;
  foodEls +=
    `<g transform="translate(${px} ${py})">` +
    // eat shock ring
    `<circle class="ring" r="${r}" fill="none" stroke="#ffd166" stroke-width="2.5" ` +
    `style="animation:snk-ring-${j} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center"/>` +
    // apple
    `<g class="food" style="animation:snk-food-${j} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center">` +
    `<circle r="${r}" fill="#ff3b5c" filter="url(#foodGlow)"/>` +
    `<circle cx="${-r * 0.32}" cy="${-r * 0.34}" r="${r * 0.32}" fill="#ffb3c1"/>` +
    `<rect x="${-1.4}" y="${-r - 4}" width="2.8" height="5" rx="1.4" fill="#7a4a25"/>` +
    `<path d="M1 ${-r - 2} q7 -4 9 2 q-7 3 -9 -2 z" fill="#6DB33F"/>` +
    `</g></g>`;
});

// ---- HUD ------------------------------------------------------------------
// score number (0..7 -> x10) and length number (4..11) swap via opacity windows
let scoreEls = "";
let lenEls = "";
let hudKf = "";
for (let j = 0; j <= FOODS.length; j++) {
  const start = j === 0 ? null : FOODS[j - 1];
  const end = j === FOODS.length ? null : FOODS[j];
  hudKf += hudKeyframes(`snk-score-${j}`, start, end);
  hudKf += hudKeyframes(`snk-len-${j}`, start, end);
  const score = String(j * 10).padStart(3, "0");
  const len = BASE_LEN + j;
  scoreEls +=
    `<text x="${W - PAD - 8}" y="${PAD + 36}" text-anchor="end" class="hud-val" ` +
    `style="animation:snk-score-${j} ${DUR}s linear infinite">${score}</text>`;
  lenEls +=
    `<text x="${W - PAD - 132}" y="${PAD + 36}" text-anchor="end" class="hud-val len" ` +
    `style="animation:snk-len-${j} ${DUR}s linear infinite">${len}</text>`;
}

// grid lines
let grid = "";
for (let x = 0; x <= COLS; x++)
  grid += `<line x1="${OX + x * CELL}" y1="${OY}" x2="${OX + x * CELL}" y2="${OY + FIELD_H}"/>`;
for (let y = 0; y <= ROWS; y++)
  grid += `<line x1="${OX}" y1="${OY + y * CELL}" x2="${OX + FIELD_W}" y2="${OY + y * CELL}"/>`;

// scanlines
let scan = "";
for (let y = 0; y < H; y += 3) scan += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;

// ---- styles ---------------------------------------------------------------
let css = moveKeyframes();
for (let k = BASE_LEN; k < MAX_LEN; k++) css += revealKeyframes(k, FOODS[k - BASE_LEN]) + "\n";
FOODS.forEach((idx, j) => {
  css += foodKeyframes(j, idx) + "\n" + ringKeyframes(j, idx) + "\n";
});
css += hudKf + "\n";
css += `@keyframes snk-blink{0%,45%{opacity:1}50%,95%{opacity:.25}100%{opacity:1}}`;

const style = `
<style>
  .seg{transform-box:fill-box;transform-origin:center;will-change:transform}
  .grid line{stroke:rgba(124,255,150,.07);stroke-width:1}
  .scan line{stroke:rgba(0,0,0,.16);stroke-width:1}
  .hud-title{font:700 22px 'Courier New',monospace;letter-spacing:5px;fill:#8CF06B}
  .hud-label{font:700 11px 'Courier New',monospace;letter-spacing:3px;fill:#5f7d66}
  .hud-val{font:700 26px 'Courier New',monospace;letter-spacing:2px;fill:#eaffe0}
  .hud-val.len{fill:#b48cff}
  .credit{font:600 10px 'Courier New',monospace;letter-spacing:2px;fill:#3f5a46}
  ${css}
</style>`;

// ---- compose SVG ----------------------------------------------------------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Self-playing arcade snake that grows one segment each time it eats an apple">
<defs>
  <linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7F52FF"/><stop offset="1" stop-color="#6DB33F"/>
  </linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0c140e"/><stop offset="1" stop-color="#070b08"/>
  </linearGradient>
  <radialGradient id="vig" cx="50%" cy="42%" r="75%">
    <stop offset="60%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity=".55"/>
  </radialGradient>
  <filter id="headGlow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="foodGlow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="20" fill="url(#bezel)"/>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="16" fill="url(#panel)"/>

<!-- HUD -->
<text x="${PAD}" y="${PAD + 34}" class="hud-title">SNAKE</text>
<text x="${PAD + 2}" y="${PAD + 50}" class="credit">ARCADE · AUTOPLAY</text>
<text x="${W - PAD - 8}" y="${PAD + 14}" text-anchor="end" class="hud-label">SCORE</text>
<text x="${W - PAD - 132}" y="${PAD + 14}" text-anchor="end" class="hud-label">LENGTH</text>
${scoreEls}
${lenEls}

<!-- playfield -->
<rect x="${OX}" y="${OY}" width="${FIELD_W}" height="${FIELD_H}" rx="8" fill="#091009"/>
<g class="grid">${grid}</g>

${foodEls}
${segs}

<!-- overlays -->
<g class="scan">${scan}</g>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="16" fill="url(#vig)"/>
<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="16" fill="none" stroke="rgba(124,255,150,.10)" stroke-width="1"/>
${style}
</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`snake -> ${OUT}  (${(svg.length / 1024).toFixed(1)} KB, N=${N} cells, len ${BASE_LEN}->${MAX_LEN})`);
