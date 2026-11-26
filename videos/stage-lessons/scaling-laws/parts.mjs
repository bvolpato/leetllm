// Shared cinematic palette, math invariants, and reusable luminous primitives
// for the 26-scene Scaling Laws & Compute-Optimal Training stage film.
import {
  arrow,
  circle,
  curve3d,
  dot,
  gridPlane3d,
  group,
  line,
  point3d,
  rect,
  seq,
  surface,
} from 'vizmatic/stage';
import {
  allocationOptimum,
  anchorFit,
  bounded,
  loss,
  optimum,
  surfaceLoss,
} from '../../films/scaling-laws/arithmetic.mjs';
import {
  EXPONENT_GRID,
  budgetAccountingState,
  budgetAllocationState,
  fitExponentGrid,
  freshAllocationState,
  growthState,
  sampleTradeoff,
  simultaneousWidthUpdate,
} from '../../films/scaling-laws/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowingTrail,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../cinematic-kit.mjs';

export {
  EXPONENT_GRID,
  allocationOptimum,
  anchorFit,
  bounded,
  budgetAccountingState,
  budgetAllocationState,
  fitExponentGrid,
  freshAllocationState,
  growthState,
  loss,
  optimum,
  sampleTradeoff,
  simultaneousWidthUpdate,
  surfaceLoss,
};

/** One semantic color per conceptual role across all 26 scenes. */
export const ROLE = Object.freeze({
  params: COSMOS.blue,
  tokens: COSMOS.cyan,
  compute: COSMOS.gold,
  optimal: COSMOS.emerald,
  cap: COSMOS.rose,
  surface: COSMOS.violet,
  amber: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surfaceFill: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

export const fmt = (n, digits = 2) => Number(n).toFixed(digits);
export const fmtTrim = (n, digits = 2) => String(Number(Number(n).toFixed(digits)));
export const signed = (n, digits = 3) => `${n >= 0 ? '+' : ''}${fmt(n, digits)}`;
export const pct = (n, digits = 1) => `${(n * 100).toFixed(digits)}%`;

/** Shared lifetime comparison models (70B/1.4T vs 30B/4.0T). */
export const LIFETIME_MODELS = Object.freeze([
  { id: '70B', n: 70e9, d: 1.4e12, label: '70B on 1.4T', color: ROLE.params },
  { id: '30B', n: 30e9, d: 4.0e12, label: '30B on 4.0T', color: ROLE.tokens },
]);

export const trainFlops = (n, d) => 6 * n * d;
export const serveFlops = (n, q) => 2 * n * q;
export const LIFETIME_PREMIUM =
  trainFlops(LIFETIME_MODELS[1].n, LIFETIME_MODELS[1].d) -
  trainFlops(LIFETIME_MODELS[0].n, LIFETIME_MODELS[0].d);
export const LIFETIME_SAVING = 2 * (LIFETIME_MODELS[0].n - LIFETIME_MODELS[1].n);
export const LIFETIME_CROSSING_T = LIFETIME_PREMIUM / LIFETIME_SAVING / 1e12;
export const LIFETIME_CROSSING_TOTAL_E23 =
  (trainFlops(LIFETIME_MODELS[0].n, LIFETIME_MODELS[0].d) +
    serveFlops(LIFETIME_MODELS[0].n, LIFETIME_CROSSING_T * 1e12)) /
  1e23;

/** Verify all computed numbers imported from arithmetic.mjs and model.mjs at film build time. */
export function verifyScalingLawsModel() {
  verifyInvariant(budgetAccountingState(0, 1).completed === 3, 'budget 3 contractions');
  verifyInvariant(budgetAccountingState(0, 1).perToken === 6, 'budget 6N per token');
  const allocEnd = budgetAllocationState({ t: 34.624 + 12.85 });
  verifyApprox(allocEnd.n, 20, 1e-9, 'budget allocation N=20');
  verifyApprox(allocEnd.d, 5, 1e-9, 'budget allocation D=5');
  verifyApprox(allocEnd.budget, 100, 1e-9, 'budget allocation ND=100');

  verifyApprox(6 * 1e9 * 20e9, 1.2e20, 1e8, '1B x 20B dense training FLOPs');
  verifyApprox(loss(5, 20, 2, 2), 1 + 2 / Math.sqrt(5) + 2 / Math.sqrt(20), 1e-12, 'tall loss b=2');
  verifyApprox(loss(10, 10, 2, 2), 2.264911, 1e-4, 'square loss b=2');
  verifyInvariant(loss(10, 10, 2, 2) < loss(5, 20, 2, 2), 'square beats tall at b=2');
  verifyInvariant(loss(5, 20, 2, 4) < loss(10, 10, 2, 4), 'tall beats square at b=4');
  verifyApprox(optimum(100, 2, 2), 10, 1e-12, 'optimum ND=100 b=2');
  verifyApprox(optimum(100, 2, 4), 5, 1e-12, 'optimum ND=100 b=4');

  const gStart = growthState({ beat: 0, t: 0.4 + 3.1 });
  const gEnd = growthState({ beat: 0, t: 0.4 + 7.55 });
  verifyApprox(gStart.budget, 100, 1e-9, 'growth baseline budget 100');
  verifyApprox(gEnd.budget, 400, 1e-9, 'growth expanded budget 400');
  verifyApprox(gEnd.n, 20, 1e-9, 'growth expanded N=20');
  verifyInvariant(gEnd.loss < gStart.loss, 'growth lowers loss');

  const equalMil = allocationOptimum(1e6, 2, 2, 0.5, 0.5);
  const weightedMil = allocationOptimum(1e6, 2, 8, 0.5, 0.5);
  verifyApprox(equalMil.n, 1000, 1e-9, 'equal 1M opt N=1000');
  verifyApprox(weightedMil.n, 250, 1e-9, 'weighted 1M opt N=250');
  verifyApprox(weightedMil.d, 4000, 1e-9, 'weighted 1M opt D=4000');

  const chinchilla24N = Math.sqrt(1e24 / 120);
  verifyApprox(chinchilla24N / 1e9, 91.287, 0.05, '1e24 20:1 N in billions');
  verifyApprox((20 * chinchilla24N) / 1e12, 1.8257, 0.01, '1e24 20:1 D in trillions');

  verifyApprox(EXPONENT_GRID.best.alpha, 0.07, 1e-12, 'recovered alpha 0.070');
  verifyApprox(EXPONENT_GRID.best.beta, 0.098, 1e-12, 'recovered beta 0.098');
  verifyApprox(surfaceLoss(1e9, 1e11), 2.4082, 0.001, 'holdout 1B/100B forecast');
  verifyApprox(surfaceLoss(70e9, 1.4e12), 2.091, 0.002, '70B/1.4T forecast');

  const syntheticProduct = 70e9 * 1.4e12;
  const syntheticOpt = allocationOptimum(syntheticProduct, 2.8, 7.8, 0.07, 0.098);
  verifyApprox(syntheticOpt.n / 1e9, 7.82, 0.02, 'synthetic opt N');
  verifyApprox(syntheticOpt.d / 1e12, 12.53, 0.02, 'synthetic opt D');
  verifyApprox(surfaceLoss(syntheticOpt.n, syntheticOpt.d), 2.074, 0.002, 'synthetic opt loss');
  verifyApprox(surfaceLoss(49e9, 2e12), 2.086, 0.002, 'data-capped 49B/2T loss');

  const midPred = surfaceLoss(10e9, 100e9);
  verifyApprox(midPred, 2.31, 0.002, 'mid-scale 10B/100B forecast');
  verifyInvariant(Math.abs(2.35 - midPred) > 0.02, 'Run A fails 0.02 tolerance');
  verifyInvariant(Math.abs(2.32 - midPred) <= 0.02, 'Run B passes 0.02 tolerance');

  const fit1 = anchorFit(0.1);
  const fit2 = anchorFit(0.2);
  verifyApprox(fit1.predict(1), 3, 1e-12, 'anchor alpha=0.1 at C=1');
  verifyApprox(fit1.predict(100), 2.5, 1e-12, 'anchor alpha=0.1 at C=100');
  verifyApprox(fit1.predict(1e6), 1.985, 0.002, 'anchor alpha=0.1 at C=1e6');
  verifyApprox(fit2.predict(1e6), 2.222, 0.002, 'anchor alpha=0.2 at C=1e6');

  for (const w of [16, 64, 256]) {
    verifyApprox(simultaneousWidthUpdate(w, false, 1).prediction, w + 1, 1e-9, `std w=${w}`);
    verifyApprox(simultaneousWidthUpdate(w, true, 1).prediction, 2, 1e-9, `muP w=${w} eta=1`);
    verifyApprox(
      simultaneousWidthUpdate(w, true, 0.25).prediction,
      0.5,
      1e-9,
      `muP w=${w} eta=0.25`,
    );
  }

  verifyApprox(trainFlops(70e9, 1.4e12), 5.88e23, 1e10, '70B/1.4T training FLOPs');
  verifyApprox(trainFlops(280e9, 300e9), 5.04e23, 1e10, '280B/300B training FLOPs');
  verifyApprox(trainFlops(30e9, 4e12), 7.2e23, 1e10, '30B/4T training FLOPs');
  verifyApprox(LIFETIME_CROSSING_T, 1.65, 1e-9, 'lifetime break-even 1.65T');
  verifyApprox(LIFETIME_CROSSING_TOTAL_E23, 8.19, 0.01, 'lifetime crossing 8.19e23');

  verifyApprox(2 * 8e9 * 512 * 1, 8.192e12, 1e6, '1 draft 8B 512 tok FLOPs');
  verifyApprox(2 * 8e9 * 512 * 16, 1.31072e14, 1e6, '16 drafts 8B 512 tok FLOPs');
  verifyApprox((80e9 * 2) / 1e9, 160, 1e-9, 'MoE 80B FP16 storage GB');
  verifyApprox(6 * 10e9 * 100e9, 6e21, 1e8, 'MoE 10B active 100B tok FLOPs');

  const freshEnd = freshAllocationState(2, 1);
  verifyApprox(freshEnd.n, 22.5, 1e-9, 'fresh capped N=22.5');
  verifyApprox(freshEnd.d, 40, 1e-9, 'fresh capped D=40');
  verifyApprox(loss(15, 60, 3, 6), 2.549, 0.002, 'fresh Plan B loss');
  verifyApprox(loss(22.5, 40, 3, 6), 2.581, 0.002, 'fresh capped loss');
  verifyApprox(20 * 40, 800, 1e-9, 'fresh dual-cap area');
}

/** Clamp a play duration so an animation never runs past the scene's narration. */
export function safeDur(c, startTime, desired = 0.75, margin = 0.44) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.12, Math.min(desired, remaining));
}

/** Schedule an animation at a declared cue (start or end), clamped safely inside c.end. */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.75, margin = 0.44 } = {},
) {
  const info = c.cue(cueId);
  const startAt = (after ? info.end : info.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  if (after) {
    c.after(cueId, () => build(d), offset);
  } else {
    c.on(cueId, () => build(d), offset);
  }
  return d;
}

/** Schedule an animation at the start of a beat index, clamped safely inside c.end. */
export function playBeat(s, c, beatIndex, build, { offset = 0, dur = 0.75, margin = 0.44 } = {}) {
  const beat = c.beats[beatIndex];
  const startAt = (beat ? beat.start : c.start) + offset;
  const d = safeDur(c, startAt, dur, margin);
  c.onBeat(beatIndex, () => build(d), offset);
  return d;
}

/** Drive a continuous subtle ambient phase (0 -> 1) spanning the full scene window safely. */
export function scenePulse(s, c, phaseVal, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const d = Math.max(0.5, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(phaseVal.to(1, { duration: d }));
  });
  return d;
}

/** Sequential fade-out then fade-in across two dynamic view values (zero overlap). */
export function swapVis(outVal, inVal, d = 0.65) {
  const half = Math.max(0.12, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.12, d - half) }));
}

/** Full-canvas ambient energy field placed cleanly behind scene geometry. */
export function cinemaAtmosphere(primary = ROLE.tokens, secondary = ROLE.compute) {
  return group(
    aura(-540, -240, 560, `${primary}24`, '#07091000'),
    aura(460, 140, 620, `${secondary}20`, '#07091000'),
    aura(0, 0, 720, '#2a3d7a22', '#07091000'),
  ).zIndex(-80);
}

/** Luminous horizontal or vertical bar with soft fill and bright edge glow (no card chrome). */
export function lumBar(
  xPos,
  yPos,
  w,
  h,
  {
    color = ROLE.params,
    fillOpacity = 0.3,
    strokeWidth = 2.4,
    glow = 8,
    radius = 6,
    opacity = 1,
  } = {},
) {
  const safeW = Math.max(4, w);
  const safeH = Math.max(4, h);
  const body = rect(safeW, safeH, {
    fill: color,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(xPos, yPos)
    .opacity(fillOpacity * opacity);
  const edge = rect(safeW, safeH, {
    fill: null,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(xPos, yPos)
    .opacity(0.92 * opacity);
  if (glow > 0) edge.glow(glow, color);
  return group(body, edge);
}

/** Glowing vector arrow from origin to tip with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.compute, width = 4.5, tipSize = 16, glow = 10, opacity = 1, dotRadius = 5 } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 2) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vec = arrow(origin, tip, { stroke: color, width, tip: tipSize }).opacity(opacity);
  if (glow > 0) vec.glow(glow, color);
  const head = glowDot(tip[0], tip[1], { radius: dotRadius, color, glow: glow + 2, opacity });
  return group(vec, head);
}

/** Luminous ring marker for ghost positions and focus anchors. */
export function glowRing(
  xPos,
  yPos,
  radius,
  color,
  { width = 3, glow = 8, fillOpacity = 0.12, opacity = 1 } = {},
) {
  const fill = circle(radius, { fill: color, stroke: null })
    .at(xPos, yPos)
    .opacity(fillOpacity * opacity);
  const ring = circle(radius, { fill: null, stroke: color, width }).at(xPos, yPos).opacity(opacity);
  if (glow > 0) ring.glow(glow, color);
  return group(fill, ring);
}

/** Smooth quadratic Bezier polyline points between two 2D points with perpendicular lift. */
export function arcPts(p0, p1, lift = -120, steps = 28) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + lift;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ]);
  }
  return pts;
}

/** Sample a 1D function fn(x) on [lo, hi] into screen [sx, sy] points through a plotPlane. */
export function sampleCurve(plane, fn, lo, hi, steps = 72) {
  const pts = [];
  const safeHi = Math.max(lo + 1e-6, hi);
  for (let i = 0; i <= steps; i++) {
    const x = lo + (safeHi - lo) * (i / steps);
    const y = fn(x);
    if (Number.isFinite(y)) {
      pts.push(plane.toScreen(x, y));
    }
  }
  return pts;
}

/**
 * Clean dark-cinema 2D plot plane with glowing axes, subtle gridlines, and >= 26px ticks.
 * Supports numeric ticks or `{ v, label }` entries.
 */
export function plotPlane({
  left = -760,
  right = 60,
  top = -230,
  bottom = 290,
  xDomain = [0, 10],
  yDomain = [0, 10],
  xTicks = [],
  yTicks = [],
  xLabel = '',
  yLabel = '',
  opacity = 1,
} = {}) {
  const width = right - left;
  const height = bottom - top;
  const toX = (vx) => left + ((vx - xDomain[0]) / (xDomain[1] - xDomain[0])) * width;
  const toY = (vy) => bottom - ((vy - yDomain[0]) / (yDomain[1] - yDomain[0])) * height;
  const toScreen = (vx, vy) => [toX(vx), toY(vy)];

  const parts = [];
  const normTick = (t) => (typeof t === 'object' ? t : { v: t, label: String(t) });
  const xList = xTicks.map(normTick);
  const yList = yTicks.map(normTick);

  for (const tk of xList) {
    const sx = toX(tk.v);
    parts.push(
      line([sx, bottom], [sx, top], { stroke: '#253357', width: 1.3 }).opacity(0.6 * opacity),
    );
    parts.push(txt(tk.label, sx, bottom + 32, 26, COSMOS.dim, 'mono', 'center').opacity(opacity));
  }
  for (const tk of yList) {
    const sy = toY(tk.v);
    parts.push(
      line([left, sy], [right, sy], { stroke: '#253357', width: 1.3 }).opacity(0.6 * opacity),
    );
    parts.push(txt(tk.label, left - 22, sy, 26, COSMOS.dim, 'mono', 'right').opacity(opacity));
  }

  parts.push(
    arrow([left, bottom], [right + 16, bottom], {
      stroke: '#6c82b8',
      width: 2.6,
      tip: 12,
    }).opacity(opacity),
    arrow([left, bottom], [left, top - 16], {
      stroke: '#6c82b8',
      width: 2.6,
      tip: 12,
    }).opacity(opacity),
    dot(4.5, COSMOS.ink).at(left, bottom).opacity(opacity),
  );

  if (xLabel) {
    parts.push(txt(xLabel, right, bottom + 74, 26, COSMOS.muted, 'mono', 'right').opacity(opacity));
  }
  if (yLabel) {
    parts.push(txt(yLabel, left, top - 38, 26, COSMOS.muted, 'mono', 'left').opacity(opacity));
  }

  return {
    node: group(...parts),
    toX,
    toY,
    toScreen,
    bounds: { left, right, top, bottom, width, height },
  };
}

/**
 * Translucent glowing rectangle anchored at (0, 0) up to (n, d) on a plotPlane.
 */
export function isoRect(
  plane,
  n,
  d,
  { color = ROLE.params, fillOpacity = 0.2, strokeWidth = 2.6, glow = 8, opacity = 1 } = {},
) {
  const [x0, y0] = plane.toScreen(0, 0);
  const [x1, y1] = plane.toScreen(n, d);
  const w = Math.max(4, x1 - x0);
  const h = Math.max(4, y0 - y1);
  return lumBar(x0 + w / 2, y0 - h / 2, w, h, {
    color,
    fillOpacity,
    strokeWidth,
    glow,
    radius: 3,
    opacity,
  });
}

/**
 * Build an orbiting 3D Chinchilla-style iso-loss power-law surface L(N, D) = E + A N^-alpha + B D^-beta
 * with glowing compute-optimal ridge curve and floor grid.
 */
export function buildLossSurface3d({
  xPos = 430,
  yPos = -10,
  unit = 96,
  distance = 15.6,
  theta = -0.82,
  phi = 1.04,
  focus = [0, 0, 1.0],
  A = 2.0,
  B = 2.0,
  alpha = 0.5,
  beta = 0.5,
  zScale = 1.15,
  zShift = 0.25,
  ridgeColor = ROLE.compute,
  beacons = [],
} = {}) {
  const view3d = cinematic3d({ theta, phi, distance, unit, focus }).at(xPos, yPos);

  const floor = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    z: 0,
    step: 1,
    color: '#26365e',
    opacity: 0.45,
  });

  // Map u, v in [-2.6, 2.6] to log-scaled N, D in [1.5, 45]
  const toResource = (coord) => Math.exp(((coord + 2.6) / 5.2) * Math.log(30) + Math.log(1.5));
  const rawZ = (u, v) => {
    const nVal = toResource(u);
    const dVal = toResource(v);
    return Math.min(3.3, zShift + zScale * (A / nVal ** alpha + B / dVal ** beta));
  };

  const lossSurf = surface((u, v) => rawZ(u, v), {
    x: [-2.6, 2.6],
    y: [-2.6, 2.6],
    steps: 18,
    colors: [ROLE.optimal, ROLE.tokens, ROLE.params, ROLE.surface, ROLE.cap],
    opacity: 0.78,
    wireframe: true,
    wireColor: '#8ba4db',
    wireOpacity: 0.26,
  });

  // Compute-optimal ridge: alpha * A * N^-alpha = beta * B * D^-beta
  const ratioConst = Math.log((beta * B) / (alpha * A));
  const ridge = curve3d(
    (u) => {
      const nVal = toResource(u);
      const logD = (ratioConst + alpha * Math.log(nVal)) / beta;
      const vRaw = ((logD - Math.log(1.5)) / Math.log(30)) * 5.2 - 2.6;
      const v = Math.max(-2.6, Math.min(2.6, vRaw));
      return [u, v, rawZ(u, v) + 0.09];
    },
    -2.5,
    2.5,
    { color: ridgeColor, width: 4.8, glow: 12 },
  );

  const pts = beacons.map((b) =>
    point3d([b.u, b.v, (b.z ?? rawZ(b.u, b.v)) + 0.14], {
      color: b.color ?? ROLE.compute,
      radius: b.radius ?? 7.5,
      glow: b.glow ?? 14,
    }),
  );

  view3d.add(floor, lossSurf, ridge, ...pts);
  return { view3d, rawZ, toResource };
}
