// Generates assets/snake-game.svg — a self-playing, neon-arcade Snake with a REAL snake.
//
// v2 "NEON ARCADE": the snake no longer mows serpentine rows. It follows a
// Hamiltonian cycle (seeded spanning-tree construction over 2x2 blocks) across a
// 16x8 board, so it wanders, doubles back and corners like a real perfect-play
// snake AI. The body is a smooth tapered tube of overlapping segments led by a
// sculpted head that banks through turns (SMIL rotation about its true anchor),
// with amber eyes, nostrils and a flicking forked tongue.
//
// Game systems in the loop:
//   - 9 foods on the tour: 8 neon orbs (+10) and one spinning GOLD bonus (+50)
//   - score popups (+10/+50) float up at each bite, spark burst + shock ring
//   - live D-pad in the HUD lights the direction currently being "pressed"
//   - HUD: SCORE rolls 000->130, LENGTH 05->14, LVL alternates 01/02 per lap,
//     BEST flips 120 -> 130 with a NEW RECORD flash at the end of the run
//   - GO! intro flash; STAGE CLEAR outro with screen flash + confetti while the
//     snake sheds its grown length so the loop restarts clean
//
// Pure CSS-animated SVG + SMIL. Plays inside a GitHub README served as <img>
// (same mechanism as the contribution snake). No JS runs at view time.
//
// Motion model (unchanged, proven):
//   - snk-move samples the tour; every body segment runs it with a negative
//     delay so it trails the head by fixed arc-length. SUB segments per cell
//     keep the tube smooth.
//   - the head translates with snk-move and rotates via SMIL animateTransform
//     using the LOCAL TANGENT (prev->next) per node, unwrapped so it banks the
//     short way through corners instead of snapping.
//
// Run: node scripts/snake-svg.mjs   ->   writes assets/snake-game.svg
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = `${__dir}/../assets/snake-game.svg`;

// ---- geometry -------------------------------------------------------------
const COLS = 16;           // must be even (Hamiltonian construction uses 2x2 blocks)
const ROWS = 8;            // must be even
const CELL = 34;
const PAD = 26;            // padding around the playfield
const HUD = 66;            // top HUD bar height
const FIELD_W = COLS * CELL;
const FIELD_H = ROWS * CELL;
const OX = PAD;            // field origin x
const OY = PAD + HUD;      // field origin y
const W = FIELD_W + PAD * 2;
const H = FIELD_H + PAD * 2 + HUD;

// ---- snake / game timing --------------------------------------------------
const DUR = 28;            // seconds for one full lap (128 cells ~ 4.6 cells/s)
const BASE_LEN = 5;        // starting body length in cells
const GOLD = 4;            // FOODS[GOLD] is the +50 bonus diamond
const POINTS_ORB = 10;
const POINTS_GOLD = 50;

const SUB = 9;                       // body segments per cell -> smooth tube
const BODY_R = CELL * 0.36;          // fattest radius (mid-body)
const TAIL_R = CELL * 0.09;          // pointed tail
// Head is a top-view spade: temples slightly wider than the neck, tapering to a
// rounded snout. HH = half-width across the body, HW = half-length along travel.
const HH = BODY_R * 1.18;
const HW = BODY_R * 1.6;
// natural body profile: slim neck -> thick mid-body -> long fine taper to tail
const radiusAt = (frac) => {
  const peak = 0.16;
  if (frac < peak) return lerp(BODY_R * 0.9, BODY_R, frac / peak);
  const t = (frac - peak) / (1 - peak);
  return lerp(BODY_R, TAIL_R, Math.pow(t, 1.12));
};

const center = (cx, cy) => [OX + cx * CELL + CELL / 2, OY + cy * CELL + CELL / 2];

// ---- Hamiltonian tour -------------------------------------------------------
// Classic construction: random spanning tree on the half-grid (COLS/2 x ROWS/2),
// then merge each 2x2 block's little 4-cycle across every tree edge. Tree =
// connected + acyclic guarantees the merge yields ONE cycle visiting every cell.
// Seeded PRNG keeps the output deterministic; we scan seeds and keep the tour
// with the most turns so the run looks alive, not mechanical.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCycle(seed) {
  const rnd = mulberry32(seed);
  const HC = COLS / 2, HR = ROWS / 2;

  // randomized DFS spanning tree on the half-grid
  const seen = new Array(HC * HR).fill(false);
  const treeEdges = [];
  const stack = [[0, 0]];
  seen[0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => [x + dx, y + dy])
      .filter(([nx, ny]) => nx >= 0 && nx < HC && ny >= 0 && ny < HR && !seen[ny * HC + nx]);
    if (!nbrs.length) { stack.pop(); continue; }
    const [nx, ny] = nbrs[Math.floor(rnd() * nbrs.length)];
    seen[ny * HC + nx] = true;
    treeEdges.push([x, y, nx, ny]);
    stack.push([nx, ny]);
  }

  // full-grid edge set: each block starts as its own 4-cycle
  const key = (a, b) => {
    const s = [`${a[0]},${a[1]}`, `${b[0]},${b[1]}`].sort();
    return s.join("|");
  };
  const E = new Set();
  const add = (a, b) => E.add(key(a, b));
  const del = (a, b) => E.delete(key(a, b));
  for (let by = 0; by < HR; by++) for (let bx = 0; bx < HC; bx++) {
    const TL = [2 * bx, 2 * by], TR = [2 * bx + 1, 2 * by];
    const BR = [2 * bx + 1, 2 * by + 1], BL = [2 * bx, 2 * by + 1];
    add(TL, TR); add(TR, BR); add(BR, BL); add(BL, TL);
  }
  // merge blocks across each tree edge: drop the two parallel boundary edges,
  // add the two crossing edges. Degree stays 2 everywhere.
  for (const [x, y, nx, ny] of treeEdges) {
    if (nx === x + 1) {         // right
      del([2 * x + 1, 2 * y], [2 * x + 1, 2 * y + 1]);
      del([2 * x + 2, 2 * y], [2 * x + 2, 2 * y + 1]);
      add([2 * x + 1, 2 * y], [2 * x + 2, 2 * y]);
      add([2 * x + 1, 2 * y + 1], [2 * x + 2, 2 * y + 1]);
    } else if (nx === x - 1) {  // left (same as right, from the neighbor)
      del([2 * nx + 1, 2 * ny], [2 * nx + 1, 2 * ny + 1]);
      del([2 * nx + 2, 2 * ny], [2 * nx + 2, 2 * ny + 1]);
      add([2 * nx + 1, 2 * ny], [2 * nx + 2, 2 * ny]);
      add([2 * nx + 1, 2 * ny + 1], [2 * nx + 2, 2 * ny + 1]);
    } else if (ny === y + 1) {  // down
      del([2 * x, 2 * y + 1], [2 * x + 1, 2 * y + 1]);
      del([2 * x, 2 * y + 2], [2 * x + 1, 2 * y + 2]);
      add([2 * x, 2 * y + 1], [2 * x, 2 * y + 2]);
      add([2 * x + 1, 2 * y + 1], [2 * x + 1, 2 * y + 2]);
    } else {                    // up (same as down, from the neighbor)
      del([2 * x, 2 * ny + 1], [2 * x + 1, 2 * ny + 1]);
      del([2 * x, 2 * ny + 2], [2 * x + 1, 2 * ny + 2]);
      add([2 * x, 2 * ny + 1], [2 * x, 2 * ny + 2]);
      add([2 * x + 1, 2 * ny + 1], [2 * x + 1, 2 * ny + 2]);
    }
  }

  // adjacency, then walk the single cycle from (0,0)
  const adj = new Map();
  for (const k of E) {
    const [a, b] = k.split("|");
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  }
  for (const [c, ns] of adj) if (ns.length !== 2) throw new Error(`degree!=2 at ${c}`);

  const tour = [];
  let prev = null, cur = "0,0";
  do {
    tour.push(cur.split(",").map(Number));
    const [n1, n2] = adj.get(cur);
    const next = n1 === prev ? n2 : n1;
    prev = cur; cur = next;
  } while (cur !== "0,0" && tour.length <= COLS * ROWS + 1);
  if (tour.length !== COLS * ROWS) throw new Error(`tour length ${tour.length}, want ${COLS * ROWS}`);
  for (let i = 0; i < tour.length; i++) {
    const [ax, ay] = tour[i], [bx, by] = tour[(i + 1) % tour.length];
    if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) throw new Error(`non-unit step at ${i}`);
  }
  return tour;
}

const countTurns = (p) => {
  let t = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
    if (c[0] - b[0] !== b[0] - a[0] || c[1] - b[1] !== b[1] - a[1]) t++;
  }
  return t;
};

let pick = null;
for (let s = 1; s <= 64; s++) {
  const p = buildCycle(s);
  const t = countTurns(p);
  if (!pick || t > pick.turns) pick = { seed: s, path: p, turns: t };
}
const rawPath = pick.path;
const N = rawPath.length;         // 128; index N wraps to index 0

// rotate the tour so index 0 sits mid-straight: the loop seam must not be a
// turn, so the 0%/100% keyframes and the SMIL rotation endpoints are plain
// holds and the restart is seamless
const dirIdxOf = (a, b) => (b[0] > a[0] ? 0 : b[1] > a[1] ? 1 : b[0] < a[0] ? 2 : 3);
let shift = 0;
for (let i = 0; i < N; i++) {
  const dIn = dirIdxOf(rawPath[(i - 1 + N) % N], rawPath[i]);
  const dOut = dirIdxOf(rawPath[i], rawPath[(i + 1) % N]);
  if (dIn === dOut) { shift = i; break; }
}
const path = rawPath.slice(shift).concat(rawPath.slice(0, shift));
const dirs = path.map((p, i) => dirIdxOf(p, path[(i + 1) % N])); // step leaving node i
const isTurn = (i) => dirs[((i - 1) % N + N) % N] !== dirs[((i % N) + N) % N];
const DIR_VEC = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// corners are chamfered: the translate path cuts each corner diagonally over
// +-K cells, and the head rotates exactly inside that window, so its facing
// always matches its actual velocity (no drift)
const K = 0.3;

// foods sit ON the tour at fixed fractions, snapped to straight nodes so the
// bite happens at a cell center (the chamfer never quite reaches corner cells)
const FOODS = [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.875]
  .map((frac) => Math.round(frac * N))
  .map((idx) => {
    for (let d = 0; d < N; d++) {
      if (!isTurn((idx + d) % N)) return (idx + d) % N;
      if (!isTurn((idx - d + N) % N)) return (idx - d + N) % N;
    }
    return idx;
  });
const MAX_LEN = BASE_LEN + FOODS.length;   // 14 cells
const TOTAL = MAX_LEN * SUB;               // body segments
const ptsAt = (j) => (j === GOLD ? POINTS_GOLD : POINTS_ORB);
const score = [0];
FOODS.forEach((_, j) => score.push(score[j] + ptsAt(j)));
const FINAL = score[score.length - 1];     // 130
const BEST_OLD = FINAL - POINTS_ORB;       // 120, beaten on the last orb

const pct = (i) => +((i / N) * 100).toFixed(3);
const eatPct = (idx) => pct(idx);

// stage-clear window (after the last bite, before the seam)
const CLR_IN = 92.4, CLR_HOLD = 98.6, CLR_OUT = 99.5;

// head rotation samples: HOLD the run's angle on straights, rotate the +-90
// exactly across each corner's chamfer window (i-K .. i+K). Unwrapped so the
// head always turns the short way; over one lap the total winding is +-360,
// so the seam value differs from the start by a full turn = visually identical.
const rotT = [0];
const rotV = [dirs[0] * 90];
{
  let cur = dirs[0] * 90;
  for (let i = 1; i < N; i++) {
    if (!isTurn(i)) continue;
    const target = dirs[i] * 90;
    const delta = ((((target - cur) % 360) + 540) % 360) - 180;
    rotT.push((i - K) / N); rotV.push(cur);
    cur += delta;
    rotT.push((i + K) / N); rotV.push(cur);
  }
  rotT.push(1); rotV.push(cur);
}

// ---- helpers ----------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const f = (n) => +n.toFixed(1);

// ---- move keyframes: translate a centered element along the tour ------------
function moveKeyframes() {
  let k = "@keyframes snk-move{\n";
  const samples = [];
  for (let i = 0; i < N; i++) {
    const [cx, cy] = center(...path[i]);
    if (!isTurn(i)) {
      samples.push([i, cx, cy]);
    } else {
      // no sample AT the corner: entry/exit samples make the tube cut the
      // corner diagonally, in sync with the head's rotation window
      const [ix, iy] = DIR_VEC[dirs[(i - 1 + N) % N]];
      const [ox, oy] = DIR_VEC[dirs[i]];
      samples.push([i - K, cx - ix * K * CELL, cy - iy * K * CELL]);
      samples.push([i + K, cx + ox * K * CELL, cy + oy * K * CELL]);
    }
  }
  samples.push([N, ...center(...path[0])]); // seam node is straight by construction
  for (const [t, x, y] of samples)
    k += `  ${((t / N) * 100).toFixed(3)}%{transform:translate(${f(x)}px,${f(y)}px)}\n`;
  return k + "}\n";
}

// per-cell reveal: a grown cell's segments pop in when its food is eaten, then
// shed tail-first during STAGE CLEAR so the loop restarts at BASE_LEN.
function revealKeyframes(cell, foodIdx) {
  const e = eatPct(foodIdx);
  const shed = (92.8 + (MAX_LEN - 1 - cell) * 0.35).toFixed(2);
  return (
    `@keyframes snk-grow-${cell}{` +
    `0%{opacity:0;transform:scale(.2)}` +
    `${(e - 0.6).toFixed(2)}%{opacity:0;transform:scale(.2)}` +
    `${e.toFixed(2)}%{opacity:1;transform:scale(1.15)}` +
    `${(e + 1.4).toFixed(2)}%{opacity:1;transform:scale(1)}` +
    `${(+shed - 0.4).toFixed(2)}%{opacity:1;transform:scale(1)}` +
    `${shed}%{opacity:0;transform:scale(.2)}` +
    `100%{opacity:0;transform:scale(.2)}}`
  );
}

// food: idle bob, pop on eat, respawn at the seam
function foodKeyframes(j, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-food-${j}{` +
    `0%{opacity:1;transform:translateY(0) scale(1)}` +
    `${(e - 6).toFixed(2)}%{opacity:1;transform:translateY(0) scale(1)}` +
    `${(e - 3).toFixed(2)}%{transform:translateY(-2px) scale(1.05)}` +
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
function sparkKeyframes(name, atPct, dx, dy) {
  return (
    `@keyframes ${name}{` +
    `0%,${(atPct - 0.2).toFixed(2)}%{opacity:0;transform:translate(0,0) scale(.4)}` +
    `${atPct.toFixed(2)}%{opacity:1;transform:translate(0,0) scale(1)}` +
    `${(atPct + 2.2).toFixed(2)}%{opacity:0;transform:translate(${dx}px,${dy}px) scale(.2)}` +
    `100%{opacity:0;transform:translate(${dx}px,${dy}px) scale(.2)}}`
  );
}
// floating score popup at the bite point
function popKeyframes(j, foodIdx) {
  const e = eatPct(foodIdx);
  return (
    `@keyframes snk-pop-${j}{` +
    `0%,${(e - 0.1).toFixed(2)}%{opacity:0;transform:translateY(4px)}` +
    `${(e + 0.4).toFixed(2)}%{opacity:1;transform:translateY(-4px)}` +
    `${(e + 3.2).toFixed(2)}%{opacity:0;transform:translateY(-26px)}` +
    `100%{opacity:0;transform:translateY(-26px)}}`
  );
}
// opacity window for HUD values that change on each bite
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

// ---- body segments (tail first, so front overlaps back) ---------------------
let body = "";
for (let k = TOTAL - 1; k >= 0; k--) {
  const frac = TOTAL === 1 ? 0 : k / (TOTAL - 1);         // 0 head end -> 1 tail
  const r = radiusAt(frac);
  const cell = Math.floor(k / SUB);
  const delay = ((k / SUB) * (DUR / N) - DUR).toFixed(4); // trails the head
  const grown = cell >= BASE_LEN;
  const innerStyle = grown
    ? ` style="animation:snk-grow-${cell} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center;opacity:0"`
    : "";
  // dense overlap + concentric dorsal circle: the small dark circles chain into
  // one continuous stripe down the spine instead of per-segment decoration
  body +=
    `<g class="seg" style="animation:snk-move ${DUR}s linear ${delay}s infinite">` +
    `<g${innerStyle}>` +
    `<circle cx="1.2" cy="2" r="${f(r)}" fill="#000" opacity=".14"/>` +
    `<circle r="${f(r)}" fill="url(#bodyGrad)"/>` +
    `<circle r="${f(r * 0.34)}" cy="${f(-r * 0.1)}" fill="#1d5a20" opacity=".45"/>` +
    `</g></g>`;
}

// ---- sculpted head: egg/teardrop that blends into the tube ------------------
// top-view spade: rounded back blends into the tube, temples flare slightly at
// the eyes, then long taper to a rounded snout. No cartoon face, no mouth line
// (a mouth is not visible from above).
const headShape =
  `<path d="M ${f(-HW * 0.95)} 0 ` +
  `C ${f(-HW * 0.95)} ${f(-HH * 0.85)}, ${f(-HW * 0.62)} ${f(-HH * 1.02)}, ${f(-HW * 0.18)} ${f(-HH * 1.05)} ` +
  `C ${f(HW * 0.22)} ${f(-HH * 1.06)}, ${f(HW * 0.6)} ${f(-HH * 0.78)}, ${f(HW * 0.92)} ${f(-HH * 0.34)} ` +
  `Q ${f(HW * 1.14)} 0, ${f(HW * 0.92)} ${f(HH * 0.34)} ` +
  `C ${f(HW * 0.6)} ${f(HH * 0.78)}, ${f(HW * 0.22)} ${f(HH * 1.06)}, ${f(-HW * 0.18)} ${f(HH * 1.05)} ` +
  `C ${f(-HW * 0.62)} ${f(HH * 1.02)}, ${f(-HW * 0.95)} ${f(HH * 0.85)}, ${f(-HW * 0.95)} 0 Z" ` +
  `fill="url(#headGrad)" stroke="#1c5417" stroke-width="1"/>`;
// eyes sit laterally near the temples, as seen from above: small amber ring,
// round dark pupil, pin of light
const eye = (sy) =>
  `<g>` +
  `<path d="M ${f(-HW * 0.08)} ${f(sy * HH * 0.92)} Q ${f(HW * 0.14)} ${f(sy * HH * 0.98)} ${f(HW * 0.34)} ${f(sy * HH * 0.62)}" ` +
  `stroke="#1c5417" stroke-width="1.2" fill="none" opacity=".8"/>` +
  `<circle cx="${f(HW * 0.12)}" cy="${f(sy * HH * 0.66)}" r="${f(HH * 0.19)}" fill="#e8a832" stroke="#2c1c06" stroke-width=".7"/>` +
  `<circle cx="${f(HW * 0.14)}" cy="${f(sy * HH * 0.66)}" r="${f(HH * 0.1)}" fill="#0e1408"/>` +
  `<circle cx="${f(HW * 0.17)}" cy="${f(sy * HH * 0.66 - HH * 0.055)}" r="${f(HH * 0.04)}" fill="#fff" opacity=".85"/>` +
  `</g>`;
// viper-style spearhead marking: a dark V from the temples converging forward
const marking =
  `<path d="M ${f(-HW * 0.55)} ${f(-HH * 0.52)} Q ${f(-HW * 0.05)} ${f(-HH * 0.3)} ${f(HW * 0.52)} ${f(-HH * 0.08)} ` +
  `L ${f(HW * 0.52)} ${f(HH * 0.08)} Q ${f(-HW * 0.05)} ${f(HH * 0.3)} ${f(-HW * 0.55)} ${f(HH * 0.52)} ` +
  `Q ${f(-HW * 0.2)} 0 ${f(-HW * 0.55)} ${f(-HH * 0.52)} Z" fill="#1d5a20" opacity=".45"/>`;
const headDetail =
  `<ellipse cx="${f(HW * 0.32)}" cy="0" rx="${f(HW * 1.1)}" ry="${f(HH * 1.2)}" fill="url(#headHalo)" opacity=".5"/>` +
  headShape +
  marking +
  `<ellipse cx="${f(-HW * 0.05)}" cy="${f(-HH * 0.45)}" rx="${f(HW * 0.66)}" ry="${f(HH * 0.3)}" fill="url(#gloss)" opacity=".28"/>` +
  `<circle cx="${f(HW * 0.88)}" cy="${f(-HH * 0.14)}" r="1.1" fill="#123a10"/>` +
  `<circle cx="${f(HW * 0.88)}" cy="${f(HH * 0.14)}" r="1.1" fill="#123a10"/>` +
  eye(-1) + eye(1);
const tongue =
  `<g class="tongue">` +
  `<path d="M ${f(HW * 1.05)} 0 L ${f(HW * 1.6)} 0 M ${f(HW * 1.6)} 0 L ${f(HW * 1.85)} ${f(-HH * 0.26)} M ${f(HW * 1.6)} 0 L ${f(HW * 1.85)} ${f(HH * 0.26)}" ` +
  `stroke="#ff3b5c" stroke-width="1.8" stroke-linecap="round" fill="none"/></g>`;
// translate on the outer group (snk-move), SMIL rotate on the inner group about
// local (0,0) so the pivot never depends on the bounding box.
const rotKeyTimes = rotT.map((t) => t.toFixed(5)).join(";");
const rotValues = rotV.map((a) => a.toFixed(1)).join(";");
const head =
  `<g class="headpos" style="animation:snk-move ${DUR}s linear infinite">` +
  `<g>` +
  `<animateTransform attributeName="transform" attributeType="XML" type="rotate" ` +
  `dur="${DUR}s" repeatCount="indefinite" calcMode="linear" keyTimes="${rotKeyTimes}" values="${rotValues}"/>` +
  tongue + headDetail +
  `</g></g>`;

// ---- foods: neon orbs + one gold bonus diamond, sparks, popups --------------
let foodEls = "";   // orbs + halos: UNDER the snake (they get swallowed)
let foodFx = "";    // rings, sparks, score popups: OVER the snake
let sparkKf = "";
let popKf = "";
FOODS.forEach((idx, j) => {
  const [px, py] = center(...path[idx]);
  const r = CELL * 0.28;
  const golden = j === GOLD;
  const ringColor = golden ? "#ffd166" : "#ff5d73";
  foodFx +=
    `<g transform="translate(${px} ${py})">` +
    `<circle class="ring" r="${f(r)}" fill="none" stroke="${ringColor}" stroke-width="2.5" ` +
    `style="animation:snk-ring-${j} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center"/>`;
  const SPARKS = 6;
  for (let s = 0; s < SPARKS; s++) {
    const ang = (s / SPARKS) * Math.PI * 2 + j * 0.5;
    const dist = 20 + (s % 2) * 8;
    const dx = +(Math.cos(ang) * dist).toFixed(1);
    const dy = +(Math.sin(ang) * dist).toFixed(1);
    const name = `snk-spark-${j}-${s}`;
    sparkKf += sparkKeyframes(name, eatPct(idx), dx, dy) + "\n";
    const sr = 2 + (s % 3) * 0.6;
    const fill = golden ? (s % 2 ? "#ffe08a" : "#ffd166") : s % 2 ? "#ffe08a" : "#ff8a5c";
    foodFx +=
      `<circle r="${sr.toFixed(1)}" fill="${fill}" ` +
      `style="animation:${name} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center"/>`;
  }
  // score popup rides the same overlay group
  popKf += popKeyframes(j, idx) + "\n";
  foodFx +=
    `<text y="-16" text-anchor="middle" class="pop${golden ? " gold" : ""}" ` +
    `style="animation:snk-pop-${j} ${DUR}s linear infinite">+${ptsAt(j)}</text>` +
    `</g>`;
  // the food body: pulsing halo + core; gold spins a diamond instead of an orb
  const core = golden
    ? `<g style="animation:snk-spin 3.5s linear infinite;transform-box:fill-box;transform-origin:center">` +
      `<rect x="${f(-r * 0.85)}" y="${f(-r * 0.85)}" width="${f(r * 1.7)}" height="${f(r * 1.7)}" rx="3" ` +
      `transform="rotate(45)" fill="url(#goldGrad)" stroke="#fff3c4" stroke-width="1" stroke-opacity=".8"/>` +
      `<circle r="${f(r * 0.32)}" fill="#fff" opacity=".9"/></g>`
    : `<circle r="${f(r)}" fill="url(#appleGrad)"/>` +
      `<circle cx="${f(-r * 0.3)}" cy="${f(-r * 0.36)}" r="${f(r * 0.3)}" fill="#fff" opacity=".85"/>`;
  foodEls +=
    `<g transform="translate(${px} ${py})">` +
    `<g class="food" style="animation:snk-food-${j} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center">` +
    `<circle r="${f(r * 1.7)}" fill="url(#${golden ? "goldHalo" : "orbHalo"})" class="halo"/>` +
    `<g filter="url(#foodGlow)">${core}</g>` +
    `</g></g>`;
});

// ---- HUD: score, length, level, best ----------------------------------------
let hudKf = "";
const bestX = W - PAD - 4;
const scoreX = bestX - 104;
const lenX = scoreX - 96;
const lvlX = lenX - 82;
const labelY = PAD + 22;
const valueY = PAD + 46;

let scoreEls = "", lenEls = "";
for (let j = 0; j <= FOODS.length; j++) {
  const start = j === 0 ? null : FOODS[j - 1];
  const end = j === FOODS.length ? null : FOODS[j];
  hudKf += hudKeyframes(`snk-score-${j}`, start, end);
  hudKf += hudKeyframes(`snk-len-${j}`, start, end);
  scoreEls +=
    `<text x="${scoreX}" y="${valueY}" text-anchor="end" class="hud-val score" ` +
    `style="animation:snk-score-${j} ${DUR}s linear infinite">${String(score[j]).padStart(3, "0")}</text>`;
  lenEls +=
    `<text x="${lenX}" y="${valueY}" text-anchor="end" class="hud-val len" ` +
    `style="animation:snk-len-${j} ${DUR}s linear infinite">${String(BASE_LEN + j).padStart(2, "0")}</text>`;
}
// BEST flips to the new record on the final orb
const lastIdx = FOODS[FOODS.length - 1];
hudKf += hudKeyframes("snk-best-old", null, lastIdx);
hudKf += hudKeyframes("snk-best-new", lastIdx, null);
const bestEls =
  `<text x="${bestX}" y="${valueY}" text-anchor="end" class="hud-val best" ` +
  `style="animation:snk-best-old ${DUR}s linear infinite">${BEST_OLD}</text>` +
  `<text x="${bestX}" y="${valueY}" text-anchor="end" class="hud-val best lit" ` +
  `style="animation:snk-best-new ${DUR}s linear infinite">${FINAL}</text>`;
// LVL alternates 01 / 02 across two laps (one lap = one stage)
const lvlEls =
  `<text x="${lvlX}" y="${valueY}" text-anchor="end" class="hud-val lvl" ` +
  `style="animation:snk-lvl-a ${DUR * 2}s linear infinite">01</text>` +
  `<text x="${lvlX}" y="${valueY}" text-anchor="end" class="hud-val lvl" ` +
  `style="animation:snk-lvl-b ${DUR * 2}s linear infinite">02</text>`;

// ---- D-pad: lights the direction the autopilot is "pressing" ----------------
// direction of the step leaving node i: 0 right, 1 down, 2 left, 3 up
const dirAt = dirs;
// compress into runs per direction, emit opacity windows
const dirRuns = [[], [], [], []];
let runStart = 0;
for (let i = 1; i <= N; i++) {
  if (i === N || dirAt[i] !== dirAt[runStart]) {
    dirRuns[dirAt[runStart]].push([runStart, i]);
    runStart = i;
  }
}
const DIR_NAMES = ["right", "down", "left", "up"];
let dpadKf = "";
DIR_NAMES.forEach((name, d) => {
  let kf = `@keyframes snk-key-${name}{`;
  const runs = dirRuns[d];
  if (!runs.length || pct(runs[0][0]) > 0) kf += `0%{opacity:.12}`;
  runs.forEach(([a, b]) => {
    const pa = pct(a), pb = pct(b);
    if (pa === 0) kf += `0%{opacity:1}`;
    else kf += `${(pa - 0.15).toFixed(2)}%{opacity:.12}${pa.toFixed(2)}%{opacity:1}`;
    if (pb >= 100) kf += `100%{opacity:1}`;
    else kf += `${pb.toFixed(2)}%{opacity:1}${(pb + 0.15).toFixed(2)}%{opacity:.12}`;
  });
  if (runs.length && pct(runs[runs.length - 1][1]) < 100) kf += `100%{opacity:.12}`;
  dpadKf += kf + "}\n";
});
// key geometry: up on top, left/down/right in a row below
const KEY = 16, GAP = 19;
const dpadX = 226, dpadY = PAD + 22;
function keyEl(name, kx, ky, arrow) {
  return (
    `<g transform="translate(${kx} ${ky})">` +
    `<rect x="${-KEY / 2}" y="${-KEY / 2}" width="${KEY}" height="${KEY}" rx="4" fill="#0c1410" stroke="#28402f" stroke-width="1"/>` +
    `<path d="${arrow}" fill="#3c5a44"/>` +
    `<g style="animation:snk-key-${name} ${DUR}s linear infinite" opacity=".12">` +
    `<rect x="${-KEY / 2}" y="${-KEY / 2}" width="${KEY}" height="${KEY}" rx="4" fill="#122619" stroke="#8CF06B" stroke-width="1.4"/>` +
    `<path d="${arrow}" fill="#8CF06B"/>` +
    `</g></g>`
  );
}
const arrows = {
  up: "M0 -3.4 L3.6 2.6 L-3.6 2.6 Z",
  down: "M0 3.4 L3.6 -2.6 L-3.6 -2.6 Z",
  left: "M-3.4 0 L2.6 3.6 L2.6 -3.6 Z",
  right: "M3.4 0 L-2.6 3.6 L-2.6 -3.6 Z",
};
const dpad =
  keyEl("up", dpadX, dpadY, arrows.up) +
  keyEl("left", dpadX - GAP, dpadY + GAP, arrows.left) +
  keyEl("down", dpadX, dpadY + GAP, arrows.down) +
  keyEl("right", dpadX + GAP, dpadY + GAP, arrows.right);

// ---- GO! intro + STAGE CLEAR outro ------------------------------------------
const fieldCX = OX + FIELD_W / 2, fieldCY = OY + FIELD_H / 2;
let confettiKf = "";
let confettiEls = "";
for (let s = 0; s < 14; s++) {
  const ang = (s / 14) * Math.PI * 2 + 0.4;
  const dist = 44 + (s % 3) * 22;
  const dx = +(Math.cos(ang) * dist).toFixed(1);
  const dy = +(Math.sin(ang) * dist * 0.6).toFixed(1);
  const name = `snk-conf-${s}`;
  confettiKf += sparkKeyframes(name, CLR_IN + 0.3, dx, dy) + "\n";
  const fill = ["#8CF06B", "#ffd166", "#b48cff", "#ff5d73"][s % 4];
  confettiEls +=
    `<circle r="${(2 + (s % 3)).toFixed(1)}" fill="${fill}" ` +
    `style="animation:${name} ${DUR}s linear infinite;transform-box:fill-box;transform-origin:center"/>`;
}
const overlays =
  `<g transform="translate(${fieldCX} ${fieldCY})">` +
  confettiEls +
  `<g style="animation:snk-clear ${DUR}s linear infinite" opacity="0">` +
  `<text y="-4" text-anchor="middle" class="big" filter="url(#textGlow)">STAGE CLEAR</text>` +
  `<text y="22" text-anchor="middle" class="sub gold">NEW RECORD · ${FINAL}</text>` +
  `</g>` +
  `<g style="animation:snk-go ${DUR}s linear infinite">` +
  `<text y="8" text-anchor="middle" class="big" filter="url(#textGlow)">GO!</text>` +
  `</g></g>` +
  `<rect x="${OX}" y="${OY}" width="${FIELD_W}" height="${FIELD_H}" rx="8" fill="#eaffe0" ` +
  `style="animation:snk-flash ${DUR}s linear infinite" opacity="0"/>`;

// ---- board: dot grid, ambient glows -----------------------------------------
let dots = "";
for (let x = 1; x < COLS; x++) for (let y = 1; y < ROWS; y++)
  dots += `<circle cx="${OX + x * CELL}" cy="${OY + y * CELL}" r="1.1"/>`;
let scan = "";
for (let y = 0; y < H; y += 3) scan += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
const ambient =
  `<ellipse cx="${OX + FIELD_W * 0.22}" cy="${OY + FIELD_H * 0.3}" rx="150" ry="90" fill="url(#ambGreen)" class="amb1"/>` +
  `<ellipse cx="${OX + FIELD_W * 0.8}" cy="${OY + FIELD_H * 0.72}" rx="170" ry="100" fill="url(#ambViolet)" class="amb2"/>`;

// ---- styles -------------------------------------------------------------------
let css = moveKeyframes();
for (let c = BASE_LEN; c < MAX_LEN; c++) css += revealKeyframes(c, FOODS[c - BASE_LEN]) + "\n";
FOODS.forEach((idx, j) => { css += foodKeyframes(j, idx) + "\n" + ringKeyframes(j, idx) + "\n"; });
css += sparkKf + popKf + confettiKf + hudKf + dpadKf + "\n";
css += `@keyframes snk-tongue{0%,30%,100%{opacity:0;transform:scaleX(.1)}36%,44%{opacity:1;transform:scaleX(1)}40%{transform:scaleX(.7)}50%{opacity:0;transform:scaleX(.1)}}`;
css += `@keyframes snk-led{0%,49%{opacity:1}50%,100%{opacity:.25}}`;
css += `@keyframes snk-marquee{0%,100%{opacity:.85}50%{opacity:1}}`;
css += `@keyframes snk-spin{to{transform:rotate(360deg)}}`;
css += `@keyframes snk-halo{0%,100%{opacity:.35}50%{opacity:.75}}`;
css += `@keyframes snk-border{0%,100%{opacity:.55}50%{opacity:1}}`;
css += `@keyframes snk-lvl-a{0%{opacity:1}49.7%{opacity:1}50%{opacity:0}100%{opacity:0}}`;
css += `@keyframes snk-lvl-b{0%{opacity:0}49.7%{opacity:0}50%{opacity:1}99.7%{opacity:1}100%{opacity:0}}`;
css += `@keyframes snk-go{0%{opacity:1;transform:scale(1)}2.4%{opacity:1;transform:scale(1.06)}3.6%{opacity:0;transform:scale(1.3)}98.5%{opacity:0;transform:scale(.7)}100%{opacity:.9;transform:scale(1)}}`;
css += `@keyframes snk-clear{0%,${CLR_IN}%{opacity:0;transform:scale(.8)}${(CLR_IN + 0.7).toFixed(1)}%{opacity:1;transform:scale(1.04)}${(CLR_IN + 1.6).toFixed(1)}%{opacity:1;transform:scale(1)}${CLR_HOLD}%{opacity:1;transform:scale(1)}${CLR_OUT}%{opacity:0;transform:scale(1.1)}100%{opacity:0;transform:scale(1.1)}}`;
css += `@keyframes snk-flash{0%,${(CLR_IN - 0.3).toFixed(1)}%{opacity:0}${(CLR_IN + 0.1).toFixed(1)}%{opacity:.13}${(CLR_IN + 1.2).toFixed(1)}%{opacity:0}100%{opacity:0}}`;
css += `@keyframes snk-amb1{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,10px)}}`;
css += `@keyframes snk-amb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-18px,-12px)}}`;

const style = `
<style>
  .seg{transform-box:fill-box;transform-origin:center;will-change:transform}
  .headpos{will-change:transform}
  .tongue{transform-box:fill-box;transform-origin:left center;animation:snk-tongue 3.2s ease-in-out infinite}
  .dots circle{fill:rgba(140,240,107,.13)}
  .scan line{stroke:rgba(0,0,0,.10);stroke-width:1}
  .amb1{animation:snk-amb1 11s ease-in-out infinite}
  .amb2{animation:snk-amb2 17s ease-in-out infinite}
  .halo{animation:snk-halo 2.4s ease-in-out infinite}
  .marquee{font:800 23px 'Courier New',monospace;letter-spacing:5px;fill:#8CF06B;animation:snk-marquee 2.4s ease-in-out infinite}
  .credit{font:600 9px 'Courier New',monospace;letter-spacing:2.5px;fill:#496653}
  .foot{font:600 9px 'Courier New',monospace;letter-spacing:2.5px;fill:#3b5344}
  .hud-label{font:700 10px 'Courier New',monospace;letter-spacing:2.5px;fill:#5f7d66}
  .hud-val{font:700 21px 'Courier New',monospace;letter-spacing:1px;fill:#eaffe0}
  .hud-val.score{font-size:25px}
  .hud-val.len{fill:#b48cff}
  .hud-val.lvl{fill:#6fd9ff}
  .hud-val.best{fill:#8a9c8e;font-size:17px}
  .hud-val.best.lit{fill:#ffd166}
  .pop{font:800 13px 'Courier New',monospace;fill:#8CF06B;paint-order:stroke;stroke:#04140a;stroke-width:3px}
  .pop.gold{fill:#ffd166}
  .big{font:800 34px 'Courier New',monospace;letter-spacing:8px;fill:#8CF06B}
  .sub{font:700 12px 'Courier New',monospace;letter-spacing:3px;fill:#cfe8d6}
  .sub.gold{fill:#ffd166}
  .led{animation:snk-led 1.1s steps(1) infinite}
  .edge{animation:snk-border 6s ease-in-out infinite}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
  ${css}
</style>`;

// ---- compose SVG --------------------------------------------------------------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Self-playing neon snake game: an autopilot snake runs a winding tour, eats neon orbs and a gold bonus, grows to length 14, posts a 130 score record and clears the stage">
<defs>
  <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7F52FF"/><stop offset=".5" stop-color="#3fae8a"/><stop offset="1" stop-color="#6DB33F"/>
  </linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b120d"/><stop offset="1" stop-color="#050807"/>
  </linearGradient>
  <radialGradient id="field" cx="50%" cy="40%" r="80%">
    <stop offset="0" stop-color="#0c1712"/><stop offset="100%" stop-color="#050d09"/>
  </radialGradient>
  <radialGradient id="bodyGrad" cx="42%" cy="32%" r="72%">
    <stop offset="0" stop-color="#a9f07d"/><stop offset=".5" stop-color="#5cc23e"/><stop offset="1" stop-color="#1f6b26"/>
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
  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffe9a3"/><stop offset=".5" stop-color="#ffc94d"/><stop offset="1" stop-color="#d99114"/>
  </linearGradient>
  <radialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ff5d73" stop-opacity=".5"/><stop offset="100%" stop-color="#ff5d73" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="goldHalo" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ffd166" stop-opacity=".6"/><stop offset="100%" stop-color="#ffd166" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="headHalo" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#9cff7a" stop-opacity=".5"/><stop offset="100%" stop-color="#9cff7a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ambGreen" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#2fae57" stop-opacity=".16"/><stop offset="100%" stop-color="#2fae57" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="ambViolet" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#7F52FF" stop-opacity=".17"/><stop offset="100%" stop-color="#7F52FF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="42%" r="75%">
    <stop offset="58%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".45"/>
  </radialGradient>
  <linearGradient id="glare" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".07"/><stop offset=".18" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <filter id="foodGlow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="textGlow" x="-30%" y="-60%" width="160%" height="260%">
    <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="edgeGlow" x="-8%" y="-8%" width="116%" height="116%">
    <feGaussianBlur stdDeviation="4"/>
  </filter>
</defs>

<!-- device shell: dark glass panel with a neon gradient edge -->
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20" fill="url(#panel)"/>
<rect x="2.5" y="2.5" width="${W - 5}" height="${H - 5}" rx="18" fill="none" stroke="url(#edgeGrad)" stroke-width="2.5" filter="url(#edgeGlow)" class="edge"/>
<rect x="2.5" y="2.5" width="${W - 5}" height="${H - 5}" rx="18" fill="none" stroke="url(#edgeGrad)" stroke-width="1.6"/>

<!-- HUD -->
<g filter="url(#textGlow)"><text x="${PAD}" y="${PAD + 30}" class="marquee">SNAKE</text></g>
<circle class="led" cx="${PAD + 118}" cy="${PAD + 23}" r="4" fill="#6DB33F"/>
<text x="${PAD}" y="${PAD + 48}" class="credit">NEON · AUTOPILOT</text>
${dpad}
<text x="${lvlX}" y="${labelY}" text-anchor="end" class="hud-label">LVL</text>
<text x="${lenX}" y="${labelY}" text-anchor="end" class="hud-label">LENGTH</text>
<text x="${scoreX}" y="${labelY}" text-anchor="end" class="hud-label">SCORE</text>
<text x="${bestX}" y="${labelY}" text-anchor="end" class="hud-label">BEST</text>
${lvlEls}
${lenEls}
${scoreEls}
${bestEls}

<!-- playfield -->
<rect x="${OX - 3}" y="${OY - 3}" width="${FIELD_W + 6}" height="${FIELD_H + 6}" rx="10" fill="#000" opacity=".5"/>
<rect x="${OX}" y="${OY}" width="${FIELD_W}" height="${FIELD_H}" rx="8" fill="url(#field)"/>
${ambient}
<g class="dots">${dots}</g>

${foodEls}
${body}
${head}
${foodFx}
${overlays}

<!-- overlays -->
<g class="scan">${scan}</g>
<rect x="2.5" y="2.5" width="${W - 5}" height="${H - 5}" rx="18" fill="url(#glare)"/>
<rect x="2.5" y="2.5" width="${W - 5}" height="${H - 5}" rx="18" fill="url(#vig)"/>
<text x="${W - PAD}" y="${H - 11}" text-anchor="end" class="foot">HAMILTONIAN AUTOPILOT · PURE SVG · NO JS</text>
${style}
</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(
  `snake -> ${OUT}  (${(svg.length / 1024).toFixed(1)} KB, seed=${pick.seed}, N=${N}, turns=${pick.turns}, segs=${TOTAL}, len ${BASE_LEN}->${MAX_LEN}, score 0->${FINAL})`
);
