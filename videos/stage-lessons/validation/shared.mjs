// Shared cinematic primitives, verified math model, and timing helpers for `validation`.
// All numerical values derive directly from videos/films/validation/ and are asserted at load time.
import { dot, group, line, linear, rect } from 'vizmatic/stage';
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
import { confusion, f1, lookupAccuracy, mean } from '../../films/validation/arithmetic.mjs';
import {
  LEAK_ROWS,
  SELECTOR,
  allFeatures,
  defaultDays,
  foldScores,
  openingRecord,
  retentionDays,
  test,
  trainingFeatures,
  users,
  validation,
} from '../../films/validation/fixtures.mjs';
import {
  availableHistory,
  oneFoldModel,
  openingRule,
  selectorState,
  sourceLookup,
  validateModel,
} from '../../films/validation/model.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  LEAK_ROWS,
  SELECTOR,
  allFeatures,
  aura,
  availableHistory,
  cinematic3d,
  confusion,
  defaultDays,
  f1,
  foldScores,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lookupAccuracy,
  mean,
  metricReadout,
  oneFoldModel,
  openingRecord,
  openingRule,
  orbitScene,
  retentionDays,
  rule,
  selectorState,
  sourceLookup,
  test,
  trainingFeatures,
  txt,
  users,
  validation,
};

export const ROLE = Object.freeze({
  train: COSMOS.cyan,
  valid: COSMOS.gold,
  test: COSMOS.violet,
  leak: COSMOS.rose,
  safe: COSMOS.emerald,
  warn: COSMOS.amber,
  neutral: COSMOS.blue,
});

export function verifyValidationInvariants() {
  verifyInvariant(validateModel() === true, 'films/validation/model.mjs validateModel()');
  verifyApprox(mean(foldScores), 0.708, 1e-12, '5-fold mean = 0.708');
  verifyApprox(f1(confusion(validation, 0.3)), 0.75, 1e-12, 'July F1 @ 0.3 = 0.75');
  verifyApprox(f1(confusion(validation, 0.5)), 1.0, 1e-12, 'July F1 @ 0.5 = 1.00');
  verifyApprox(f1(confusion(validation, 0.7)), 0.5, 1e-12, 'July F1 @ 0.7 = 0.50');
  verifyApprox(f1(confusion(test, 0.5)), 2 / 3, 1e-12, 'August F1 @ 0.5 = 2/3');
  verifyInvariant(oneFoldModel().f1 === 0.5, 'one-fold F1 = 0.5');
  verifyInvariant(
    selectorState(false).selected === 'T' && selectorState(false).correct === 2,
    'train-only T -> 2/4',
  );
  verifyInvariant(
    selectorState(true).selected === 'L' && selectorState(true).correct === 4,
    'leaked L -> 4/4',
  );
  verifyInvariant(availableHistory().naive === 3 && availableHistory().ready === 2, 'as-of 3 vs 2');
  verifyInvariant(
    sourceLookup(true, 'C').prediction === 7 && sourceLookup(false, 'C').prediction === 30,
    'policy C lookup',
  );
  verifyInvariant(sourceLookup(true, 'D').correct === true, 'policy D fallback correct');
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

export function beatTo(s, c, beatIdx, val, target, { dur = 0.75, ease } = {}) {
  const b = c.beats[beatIdx];
  if (!b) return;
  const duration = safeDur(c, b.start, dur);
  const opts = ease ? { duration, ease } : { duration };
  c.onBeat(beatIdx, () => s.play(val.to(target, opts)));
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
  accent = COSMOS.cyan,
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
