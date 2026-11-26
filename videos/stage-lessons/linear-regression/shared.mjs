// Shared cinematic primitives, verified math model, and timing helpers for `linear-regression`.
// All numerical values derive directly from videos/films/linear-regression/ and are asserted at load time.
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
import { meanX, optimum, quadratic, varianceX } from '../../films/linear-regression/arithmetic.mjs';
import {
  data,
  oversizedRate,
  stableRate,
  testRequests,
} from '../../films/linear-regression/fixtures.mjs';
import {
  bendInput,
  bendPredict,
  eigenStep,
  gradientAt,
  interceptEstimatorState,
  lassoLine,
  mse,
  oversizedPath,
  predict,
  ridgeLine,
  stabilityLimit,
  stablePath,
  testMeanSquares,
  testScores,
  validateModel,
} from '../../films/linear-regression/model.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  aura,
  bendInput,
  bendPredict,
  cinematic3d,
  data,
  eigenStep,
  glowDot,
  glowTex,
  glowingTrail,
  gradientAt,
  guardedDynamic,
  heroTitle,
  interceptEstimatorState,
  lassoLine,
  meanX,
  metricReadout,
  mse,
  optimum,
  orbitScene,
  oversizedPath,
  oversizedRate,
  predict,
  quadratic,
  ridgeLine,
  rule,
  stabilityLimit,
  stablePath,
  stableRate,
  testMeanSquares,
  testRequests,
  testScores,
  txt,
  varianceX,
};

export const ROLE = Object.freeze({
  data: COSMOS.gold,
  line: COSMOS.cyan,
  curve: COSMOS.rose,
  good: COSMOS.emerald,
  ridge: COSMOS.blue,
  warn: COSMOS.amber,
  proj: COSMOS.violet,
});

export function verifyLinearRegressionInvariants() {
  verifyInvariant(validateModel() === true, 'films/linear-regression/model.mjs validateModel()');
  verifyApprox(mse(100, 20), 2.8, 1e-12, 'OLS MSE = 2.8');
  verifyApprox(Math.sqrt(mse(100, 20)), 1.67332, 1e-4, 'OLS RMSE ≈ 1.673');
  verifyApprox(stablePath[1].intercept, 16, 1e-12, 'first GD step intercept = 16');
  verifyApprox(stablePath[1].slope, 52, 1e-12, 'first GD step slope = 52');
  verifyApprox(stabilityLimit, 0.08452, 1e-4, 'stability limit ~0.0845');
  verifyApprox(bendPredict(6, -1), 213, 1e-12, 'full bend forecast at 600 = 213');
  verifyApprox(bendPredict(6, -0.5), 216.5, 1e-12, 'half bend forecast = 216.5');
  verifyApprox(predict(6), 220, 1e-12, 'line forecast at 600 = 220');
  verifyApprox(testMeanSquares.line, 18.5, 1e-12, 'held-out tie line MSE = 18.5');
  verifyApprox(testMeanSquares.curve, 18.5, 1e-12, 'held-out tie curve MSE = 18.5');
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
