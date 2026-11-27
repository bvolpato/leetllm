// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Design Code Completion System stage lesson (35 scenes).
import {
  circle,
  curve3d,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  point3d,
  rect,
} from 'vizmatic/stage';
import {
  completeTraceQuantiles,
  correctionDistribution,
  prefillCohortWork,
  sum,
} from '../../films/design-code-completion-system/arithmetic.mjs';
import {
  accepted,
  base,
  phaseDurations,
  retained,
} from '../../films/design-code-completion-system/fixtures.mjs';
import {
  fresh,
  promptParts,
  route,
  selectionKey,
} from '../../films/design-code-completion-system/model.mjs';
import {
  CINEMA_FRAME,
  COSMOS,
  aura as kitAura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout as kitMetricReadout,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  accepted,
  base,
  cinematic3d,
  completeTraceQuantiles,
  correctionDistribution,
  fresh,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout as kitMetricReadout,
  orbitScene,
  phaseDurations,
  prefillCohortWork,
  promptParts,
  retained,
  route,
  rule,
  selectionKey,
  sum,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 35 design-code-completion-system scenes:
 *   editor / prefix / client -> cyan
 *   fresh / ok / retained    -> emerald
 *   caret / suffix / focus   -> gold
 *   policy / cache / model   -> violet
 *   stale / drop / miss      -> rose
 *   debounce / caution / tmp -> amber
 *   worker / remote / GPU    -> blue
 */
export const ROLE = Object.freeze({
  ed: COSMOS.cyan,
  ok: COSMOS.emerald,
  focus: COSMOS.gold,
  model: COSMOS.violet,
  fail: COSMOS.rose,
  warn: COSMOS.amber,
  gpu: COSMOS.blue,
});

export const PROMPT_BASE = promptParts(false);
export const PROMPT_FULL = promptParts(true);
export const TRACE_Q = completeTraceQuantiles();
export const COHORT_EQ = prefillCohortWork(2048, 2048);
export const COHORT_LONG_HIT = prefillCohortWork(3072, 1024);
export const COHORT_LONG_MISS = prefillCohortWork(1024, 3072);
export const CORR_DIST = correctionDistribution([0.1, 0.6, 0.3], [0.4, 0.4, 0.2]);

/** Build-time mathematical invariant suite covering every spoken value in design-code-completion-system. */
export function verifyCodeCompletionInvariants() {
  verifyInvariant(route('.', true, true) === 'LOCAL SEMANTIC', 'dot semantic -> local');
  verifyInvariant(route('=', false, true) === 'REMOTE FIM', 'assignment + bool True -> remote');
  verifyInvariant(route('=', false, 'False') === 'LOCAL FALLBACK', 'string False stays local');
  verifyInvariant(route('=', false, 1) === 'LOCAL FALLBACK', 'int 1 stays local');
  verifyInvariant(fresh(base, base) === true, 'identical snapshot is fresh');
  verifyInvariant(
    fresh({ ...base, epoch: 101 }, { ...base, epoch: 103 }) === false,
    'epoch mismatch stale',
  );
  verifyInvariant(sum(PROMPT_FULL.map((p) => p.value)) === 8000, 'full prompt budget 8000 tokens');
  verifyInvariant(sum(phaseDurations) === 183, 'immediate path 183 ms');
  verifyInvariant(sum(phaseDurations) + 150 === 333, 'debounced path 333 ms');
  verifyInvariant(
    TRACE_Q.rank === 19 && TRACE_Q.complete === 101 && TRACE_Q.stageSum === 2,
    'trace p95 101 vs 2',
  );
  verifyInvariant(sum(accepted) === 64 && sum(retained) === 39, '64 inserted, 39 retained');
  verifyApprox(39 / 64, 0.609375, 1e-4, 'retention ~60.9%');
  verifyInvariant(
    COHORT_EQ.total === 1_024_000 && COHORT_EQ.gpus === 52,
    'equal cohort 1.024M -> 52 GPUs',
  );
  verifyInvariant(
    COHORT_LONG_HIT.total === 716_800 && COHORT_LONG_HIT.gpus === 36,
    'long hits 716.8k -> 36 GPUs',
  );
  verifyInvariant(
    COHORT_LONG_MISS.total === 1_331_200 && COHORT_LONG_MISS.gpus === 67,
    'long misses 1.3312M -> 67 GPUs',
  );
  verifyApprox(CORR_DIST.probabilities[1], 2 / 3, 1e-9, 'correction request prob 2/3');
  verifyApprox(CORR_DIST.probabilities[2], 1 / 3, 1e-9, 'correction scope prob 1/3');
}

export function aura(x, y, radius, innerHex, midHex = '#07091000') {
  const c1 = typeof innerHex === 'string' && innerHex.length === 7 ? `${innerHex}18` : innerHex;
  const c2 =
    midHex === COSMOS.bg
      ? '#07091000'
      : typeof midHex === 'string' && midHex.length === 7
        ? `${midHex}0a`
        : midHex;
  return kitAura(x, y, radius, c1, c2);
}

export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -445, accent = COSMOS.cyan, size = 46, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 56, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 116, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

export function metricReadout(caption, value, xOrOpts = {}, y = 190, opts = {}) {
  if (typeof xOrOpts === 'object' && xOrOpts !== null) {
    return kitMetricReadout(caption, value, xOrOpts);
  }
  const { color = COSMOS.gold, size = 44, anchor = 'center', glow = 8, sub } = opts;
  const parts = [
    txt(caption, xOrOpts, y - 34, 26, COSMOS.muted, 'mono', anchor),
    txt(value, xOrOpts, y + 18, size, color, 'mono', anchor).glow(glow, color),
  ];
  if (sub) {
    parts.push(txt(sub, xOrOpts, y + 74, 26, COSMOS.muted, 'mono', anchor));
  }
  return group(...parts);
}

export function clampDur(c, startTime, desired, margin = 0.4) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.45 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

export function glowMeter(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.cyan,
    bg = '#0f1629',
    border = '#2c3d66',
    glow = 8,
    radius = 8,
    opacity = 1,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cx = xLeft + totalW * 0.5;
  const track = rect(totalW, h, { fill: bg, stroke: border, width: 2, radius })
    .at(cx, y)
    .opacity(opacity);
  if (clamped <= 0.004) return track;
  const innerW = Math.max(8, (totalW - 6) * clamped);
  const bar = rect(innerW, h - 6, { fill, stroke: null, radius: Math.max(4, radius - 2) })
    .at(xLeft + 3 + innerW * 0.5, y)
    .opacity(0.9 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

export function beamWithPhotons(pts, color, _phaseVal, { width = 3.6, glow = 9, alpha = 1 } = {}) {
  return glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha });
}

export function trimSeg(a, b, padA = 56, padB = 56) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

export function codeNode(
  x,
  y,
  label,
  color,
  { radius = 50, sub = null, opacity = 1, glow = 8, size = 26 } = {},
) {
  const r = Math.max(radius, Math.ceil(String(label).length * 9.5 + 22));
  const parts = [
    circle(r, { fill: '#0b1224', stroke: color, width: 3.4 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    txt(label, x, y, size, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + r + 36, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return { node: group(...parts), r };
}

export function addBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  fillColor,
  edgeColor = fillColor,
  { faceOpacity = 0.78, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const faceOpts = {
    resolution: [1, 1],
    color: fillColor,
    opacity: faceOpacity,
    mesh: false,
    shaded: true,
  };
  const edgeOpts = {
    color: edgeColor,
    width: edgeWidth,
    opacity: edgeOpacity,
    glow: edgeGlow,
    ...(blend ? { blend } : {}),
  };
  const objs = [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    line3d([x0, y0, z0], [x1, y0, z0], edgeOpts),
    line3d([x1, y0, z0], [x1, y1, z0], edgeOpts),
    line3d([x1, y1, z0], [x0, y1, z0], edgeOpts),
    line3d([x0, y1, z0], [x0, y0, z0], edgeOpts),
    line3d([x0, y0, z1], [x1, y0, z1], edgeOpts),
    line3d([x1, y0, z1], [x1, y1, z1], edgeOpts),
    line3d([x1, y1, z1], [x0, y1, z1], edgeOpts),
    line3d([x0, y1, z1], [x0, y0, z1], edgeOpts),
    line3d([x0, y0, z0], [x0, y0, z1], edgeOpts),
    line3d([x1, y0, z0], [x1, y0, z1], edgeOpts),
    line3d([x1, y1, z0], [x1, y1, z1], edgeOpts),
    line3d([x0, y1, z0], [x0, y1, z1], edgeOpts),
  ];
  view.add(...objs);
  return objs;
}
