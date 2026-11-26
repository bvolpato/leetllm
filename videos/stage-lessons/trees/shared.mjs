// Shared cinematic primitives, verified math model, and timing helpers for `trees`.
// All numerical values derive directly from videos/films/trees/ and are asserted at load time.
import { circle, dot, group, line, linear, rect } from 'vizmatic/stage';
import {
  CINEMA_FRAME,
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';
import { gini, mean, predict, split } from '../../films/trees/arithmetic.mjs';
import {
  boost,
  forest,
  laterCases,
  rows,
  samples,
  stump,
  targets,
  tree,
  validationRows,
} from '../../films/trees/fixtures.mjs';
import {
  firstNewtonLeaves,
  fittedStump,
  policyCosts,
  residualStep,
  sigmoid,
  stumpBill,
  validationAfterBoosting,
} from '../../films/trees/model.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  aura,
  boost,
  cinematic3d,
  firstNewtonLeaves,
  fittedStump,
  forest,
  gini,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  laterCases,
  mean,
  metricReadout,
  orbitScene,
  policyCosts,
  predict,
  residualStep,
  rows,
  rule,
  samples,
  sigmoid,
  split,
  stump,
  stumpBill,
  targets,
  tree,
  txt,
  validationAfterBoosting,
  validationRows,
};

export const ROLE = Object.freeze({
  review: COSMOS.rose,
  routine: COSMOS.cyan,
  cut: COSMOS.gold,
  entropy: COSMOS.violet,
  good: COSMOS.emerald,
  cost: COSMOS.amber,
  boost: COSMOS.blue,
});

export function entropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

export function verifyTreesInvariants() {
  verifyInvariant(rows.length === 8 && validationRows.length === 8, '8 train & 8 val rows');
  verifyApprox(gini(rows.map((r) => r[2])), 0.5, 1e-12, 'root Gini = 0.5');
  verifyApprox(stump.cut, 3.35, 1e-12, 'best ambiguity cut = 3.35');
  verifyApprox(stump.gain, 0.3, 1e-12, 'stump Gini gain = 0.30');

  // Criteria compare: 24 rows (12 rev, 12 rout)
  const giniA = 0.5 - (4 / 24) * 0 - (20 / 24) * (2 * 0.6 * 0.4);
  const giniB = 0.5 - 0.5 * (2 * 0.75 * 0.25) - 0.5 * (2 * 0.25 * 0.75);
  verifyApprox(giniA, 0.1, 1e-12, 'Cut A Gini gain = 0.10');
  verifyApprox(giniB, 0.125, 1e-12, 'Cut B Gini gain = 0.125');
  const entA = 1 - (20 / 24) * entropy(12 / 20);
  const entB = 1 - entropy(0.75);
  verifyInvariant(entA > entB && entA - entB > 0.001, 'Entropy prefers Cut A');

  // Regression MSE split on [10, 20, 60]
  const mseParent = ((10 - 30) ** 2 + (20 - 30) ** 2 + (60 - 30) ** 2) / 3;
  const mseSplit = ((10 - 15) ** 2 + (20 - 15) ** 2 + 0) / 3;
  verifyApprox(mseParent - mseSplit, 450, 1e-9, 'MSE reduction = 450');

  // Boosting round 1
  const b1 = residualStep(0, 1);
  verifyApprox(b1.prediction[2], 33, 1e-12, '60-min prediction moves to 33');
  verifyApprox(b1.prediction[0], 28.5, 1e-12, '10-min prediction moves to 28.5');

  // Newton classification leaf steps
  verifyApprox(firstNewtonLeaves[0].step, -1.2, 1e-12, 'left Newton leaf step = -1.2');
  verifyApprox(firstNewtonLeaves[1].step, 2.0, 1e-12, 'right Newton leaf step = +2.0');

  // Validation bills
  verifyInvariant(stumpBill(0.5, 120).total === 240, 'strict bill = $240');
  verifyInvariant(stumpBill(0.2, 120).total === 72, 'wide bill = $72');
  verifyInvariant(stumpBill(0.5, 40).total === 80, '$40 miss -> $80 strict');
  verifyInvariant(stumpBill(0.5, 30).total === 60, '$30 miss -> $60 strict');
}

export const mix = (a, b, p) => a + (b - a) * p;
export const fadeOut = (t) => Math.max(0, Math.min(1, 1 - t / 0.42));
export const fadeIn = (t) => Math.max(0, Math.min(1, (t - 0.58) / 0.42));

export function safeDur(clock, startTime, desired, margin = 0.34) {
  const avail = clock.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

export function cueTo(s, c, cueId, val, target, { after = false, dur = 0.65, ease } = {}) {
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const opts = ease ? { duration, ease } : { duration };
  if (after) c.after(cueId, () => s.play(val.to(target, opts)));
  else c.on(cueId, () => s.play(val.to(target, opts)));
  return info;
}

export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

export function decorAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, midHex));
}

export function cinemaGrid({
  color = '#24345a',
  accent = COSMOS.gold,
  opacity = 0.44,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160)
    lines.push(line([x, -460], [x, 460], { stroke: color, width: 1.1 }));
  for (let y = -400; y <= 400; y += 160)
    lines.push(line([-880, y], [880, y], { stroke: color, width: 1.1 }));
  const stars = [];
  for (let i = 0; i < 65; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    stars.push(
      dot(0.8 + (i % 4) * 0.3, i % 9 === 0 ? accent : '#8ea4d2')
        .opacity(0.15 + (i % 5) * 0.05)
        .at(-930 + (sx - Math.floor(sx)) * 1860, -510 + (sy - Math.floor(sy)) * 1020),
    );
  }
  return markDecor(
    group(...lines, ...stars)
      .opacity(opacity)
      .zIndex(-60),
  );
}

export function glowBar(x, y, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeW = Math.max(6, w);
  const bar = rect(safeW, h, { fill: color, stroke: null, radius })
    .at(x + safeW / 2, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
}
