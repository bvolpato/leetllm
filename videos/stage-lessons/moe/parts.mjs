// Shared cinematic palette, build-time math invariants, 3D manifolds, and reusable glowing
// primitives for the 36-scene Mixture of Experts stage lesson.
import {
  arrow,
  circle,
  curve3d,
  gridPlane3d,
  group,
  line,
  line3d,
  parametricSurface,
  point3d,
  rect,
  seq,
} from 'vizmatic/stage';
import {
  BATCH_ROUTES,
  BLENDED_OUTPUT,
  CAPACITY_ROUTES,
  CHOICE_SCORES,
  EXPERT_OUTPUTS,
  MOE_ASSIGNMENTS,
  MOE_FRESH_ROUTES,
  MOE_INPUTS,
  REMOTE_ASSIGNMENTS,
  ROUTER_LOGITS,
  ROUTING,
  SKEW_COUNTS,
} from '../../films/moe/fixtures.mjs';
import { center, fmt as rawFmt, mc, pointRoute, route, vec } from '../../films/moe/arithmetic.mjs';
import {
  moeBalance,
  moeCapacity,
  moeChoice,
  moeFresh,
  moePacked,
  moeReplica,
  moeScalarGate,
  moeSelection,
  moeServing,
  moeValidatedRoute,
  moeWire,
  moeZ,
} from '../../films/moe/model.mjs';
import {
  overflowReroute,
  queueExample,
  routerScoreSnapshot,
  trainingSkewSnapshot,
} from '../../films/moe/construction.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowingTrail,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  BATCH_ROUTES,
  BLENDED_OUTPUT,
  CAPACITY_ROUTES,
  CHOICE_SCORES,
  EXPERT_OUTPUTS,
  MOE_ASSIGNMENTS,
  MOE_FRESH_ROUTES,
  MOE_INPUTS,
  REMOTE_ASSIGNMENTS,
  ROUTER_LOGITS,
  ROUTING,
  SKEW_COUNTS,
  center,
  mc,
  moeBalance,
  moeCapacity,
  moeChoice,
  moeFresh,
  moePacked,
  moeReplica,
  moeScalarGate,
  moeSelection,
  moeServing,
  moeValidatedRoute,
  moeWire,
  moeZ,
  overflowReroute,
  pointRoute,
  queueExample,
  rawFmt,
  route,
  routerScoreSnapshot,
  trainingSkewSnapshot,
  vec,
};

/** One semantic color per conceptual role across all 36 MoE scenes. */
export const ROLE = Object.freeze({
  router: COSMOS.gold,
  token: COSMOS.cyan,
  expert: COSMOS.blue,
  active: COSMOS.emerald,
  overflow: COSMOS.rose,
  alt: COSMOS.violet,
  warm: COSMOS.amber,
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
  rule: COSMOS.rule,
  surface: COSMOS.surface,
  surfaceAlt: COSMOS.surfaceAlt,
});

/** Four primary expert lane colors (consistent across routing, queues, and balance). */
export const EXP_COLORS = Object.freeze([COSMOS.blue, COSMOS.violet, COSMOS.gold, COSMOS.emerald]);

/** Distinct persistent token colors for multi-token dispatch and queues. */
export const TOK_COLORS = Object.freeze([
  COSMOS.cyan,
  COSMOS.rose,
  COSMOS.gold,
  COSMOS.blue,
  COSMOS.emerald,
  COSMOS.violet,
  COSMOS.amber,
  '#93c5fd',
]);

export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const fmt = (n, digits = 2) => {
  const num = Number(n);
  const clean = Math.abs(num) < 0.5 * 10 ** -digits ? 0 : num;
  return clean.toFixed(digits);
};
export const pct = (n, digits = 0) => `${(Number(n) * 100).toFixed(digits)}%`;
export const vecStr = (v, digits = 2) => `[${v.map((x) => fmt(x, digits)).join(', ')}]`;

/** Walkthrough 4-coord router matrix matching content.md and router-contract. */
export const WALKTHROUGH_HIDDEN = Object.freeze([1, 0, 0, 0]);
export const WALKTHROUGH_GATE = Object.freeze([
  [-0.65, 0, 0, 0],
  [-1.77, 0, 0, 0],
  [-1.35, 0, 0, 0],
  [-3.0, 0, 0, 0],
]);

/** Verify every spoken mathematical invariant imported from videos/films/moe/ at build time. */
export function verifyMoeInvariants() {
  // 1. Core top-2 routing and blended output
  const validated = moeValidatedRoute(WALKTHROUGH_HIDDEN, WALKTHROUGH_GATE, 2);
  verifyApprox(
    validated.probabilities.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    'router probabilities sum to 1',
  );
  verifyInvariant(
    ROUTING.selected[0] === 0 && ROUTING.selected[1] === 2,
    'top-2 experts are E1 (idx 0) and E3 (idx 2)',
  );
  verifyApprox(ROUTING.weights[0], 0.668, 0.001, 'E1 renormalized weight ~0.668');
  verifyApprox(ROUTING.weights[1], 0.332, 0.001, 'E3 renormalized weight ~0.332');
  verifyApprox(ROUTING.weights[0] + ROUTING.weights[1], 1, 1e-12, 'selected weights sum to 1');
  verifyApprox(BLENDED_OUTPUT[0], 1.336, 0.002, 'blended coord 1 ~1.336');
  verifyApprox(BLENDED_OUTPUT[1], 0.995, 0.002, 'blended coord 2 ~0.995');

  // 2. Top-1 scalar gate gradient contrast
  const retained = moeScalarGate(0.75, false);
  const normOne = moeScalarGate(0.75, true);
  verifyApprox(retained.output, 1.5, 1e-12, 'retained top-1 output 1.5');
  verifyApprox(retained.loss, 0.125, 1e-12, 'retained top-1 loss 1/8');
  verifyApprox(retained.gradient, 0.1875, 1e-12, 'retained top-1 grad 3/16');
  verifyApprox(normOne.output, 2.0, 1e-12, 'normalized top-1 output 2');
  verifyApprox(normOne.loss, 0.5, 1e-12, 'normalized top-1 loss 1/2');
  verifyApprox(normOne.gradient, 0, 1e-12, 'normalized top-1 grad 0');

  // 3. Packed execution and scatter-add combine
  const packed = moePacked();
  verifyInvariant(
    packed.packed.map((r) => r.token).join(',') === '1,2,0,0,2',
    'packed token order [1,2,0,0,2]',
  );
  verifyApprox(packed.outputs[0][0], -0.625, 1e-12, 't0 combined x -0.625');
  verifyApprox(packed.outputs[0][1], -1.25, 1e-12, 't0 combined y -1.25');
  verifyApprox(packed.outputs[1][0], 6, 1e-12, 't1 combined x 6');
  verifyApprox(packed.outputs[1][1], 8, 1e-12, 't1 combined y 8');
  verifyApprox(packed.outputs[2][0], 5.5, 1e-12, 't2 combined x 5.5');
  verifyApprox(packed.outputs[2][1], 6.6, 1e-12, 't2 combined y 6.6');

  // 4. Expert-choice routing coverage
  const choice = moeChoice();
  verifyInvariant(choice.coverage.join(',') === '2,1,2,1,0', 'expert-choice coverage [2,1,2,1,0]');
  for (let t = 0; t < CHOICE_SCORES[0].length; t++) {
    const colSum = CHOICE_SCORES.reduce((acc, row) => acc + row[t], 0);
    verifyApprox(colSum, 1, 1e-12, `choice scores column ${t} sum to 1`);
  }

  // 5. Training skew and auxiliary balance loss + counterexample
  verifyInvariant(SKEW_COUNTS.reduce((a, b) => a + b, 0) === 20, 'skew total 20 assignments');
  const bal = moeBalance();
  verifyApprox(bal.products[0], 0.33, 1e-12, 'balance product 0');
  verifyApprox(bal.products[1], 0.044, 1e-12, 'balance product 1');
  verifyApprox(bal.products[2], 0.0225, 1e-12, 'balance product 2');
  verifyApprox(bal.products[3], 0.004, 1e-12, 'balance product 3');
  verifyApprox(bal.sum, 0.4005, 1e-12, 'balance sum 0.4005');
  verifyApprox(bal.score, 1.602, 1e-12, 'balance score 1.602');
  const counter = moeBalance([0.5, 0.5, 0], [0.3, 0.3, 0.4]);
  verifyApprox(counter.score, 0.9, 1e-12, 'dead-expert counterexample score 0.90');

  // 6. Router z-loss shift sensitivity
  const z0 = moeZ(0);
  const z3 = moeZ(3);
  verifyApprox(z0.partition, 0, 1e-12, 'z0 log-partition 0');
  verifyApprox(z0.loss, 0, 1e-12, 'z0 loss 0');
  verifyApprox(z3.partition, 3, 1e-12, 'z3 log-partition 3');
  verifyApprox(z3.loss, 9, 1e-12, 'z3 loss 9');
  verifyApprox(z3.p[0], 0.75, 1e-12, 'z3 prob[0] unchanged 0.75');

  // 7. Capacity limit, dropless, reroute, and scale arithmetic
  const capLim = queueExample(CAPACITY_ROUTES, 4, [0.6, 0.4], 1, false);
  verifyInvariant(capLim.slots === 4 && capLim.totalOverflow === 4, 'capLim 4 slots, 4 overflow');
  verifyApprox(capLim.output[0], 0, 1e-12, 'capLim t4 x = 0');
  verifyApprox(capLim.output[1], 1.2, 1e-12, 'capLim t4 y = 1.2');
  const rer0 = overflowReroute(0);
  const rer1 = overflowReroute(1);
  verifyApprox(rer0.output[0], 1.2, 1e-12, 'dropless t4 x = 1.2');
  verifyApprox(rer1.output[0], 3.0, 1e-12, 'reroute t4 x = 3.0');
  verifyApprox(rer1.output[1], 1.2, 1e-12, 'reroute t4 y = 1.2');

  const big1 = moeCapacity(4096, 2, 32, 1.0, [400]);
  const big12 = moeCapacity(4096, 2, 32, 1.2, [400]);
  verifyInvariant(
    big1.assignments === 8192 && big1.slots === 256 && big1.totalOverflow === 144,
    '4096x2/32 at c=1.0 -> 256 slots, 144 overflow',
  );
  verifyInvariant(
    big12.slots === 308 && big12.totalOverflow === 92,
    '4096x2/32 at c=1.2 -> 308 slots, 92 overflow',
  );

  // 8. Selection bias (DeepSeek-V3 aux-loss-free)
  const selBias = moeSelection();
  verifyInvariant(selBias.ids[0] === 2 && selBias.ids[1] === 0, 'bias selects IDs 2, 0');
  verifyApprox(selBias.weights[0], 0.4, 1e-12, 'unbiased weight for E2 = 0.4');
  verifyApprox(selBias.weights[1], 0.6, 1e-12, 'unbiased weight for E0 = 0.6');

  // 9. Wire protocol, replica, serving gate, and fresh transfer
  const wire = moeWire();
  verifyInvariant(
    wire.assignmentBytes === 32768 && wire.coalescedBytes === 16384,
    'wire 32 KiB vs 16 KiB',
  );
  verifyApprox(wire.separate[0], wire.destinationCombined[0], 1e-12, 'wire x identical');
  verifyApprox(wire.separate[1], wire.destinationCombined[1], 1e-12, 'wire y identical');
  const rep = moeReplica();
  rep.originalOutput.forEach((v, i) =>
    verifyApprox(v, rep.copyOutput[i], 1e-12, `replica output coord ${i}`),
  );
  const srv60 = moeServing(60);
  const srv50 = moeServing(50);
  verifyInvariant(!srv60[0].accepted && srv60[1].accepted, '60 ms gate accepts MoE only');
  verifyInvariant(!srv50[0].accepted && !srv50[1].accepted, '50 ms gate rejects both');

  const f1 = queueExample(MOE_FRESH_ROUTES, 3, [0.25, 0.75], 1.0);
  const f15 = queueExample(MOE_FRESH_ROUTES, 3, [0.25, 0.75], 1.5);
  verifyInvariant(f1.slots === 3 && f1.totalOverflow === 2, 'fresh c=1.0 -> 3 slots, 2 overflow');
  verifyApprox(f1.output[0], 0, 1e-12, 'fresh c=1.0 t3 x=0');
  verifyApprox(f1.output[1], 2.25, 1e-12, 'fresh c=1.0 t3 y=2.25');
  verifyInvariant(f15.slots === 5 && f15.totalOverflow === 0, 'fresh c=1.5 -> 5 slots, 0 overflow');
  verifyApprox(f15.output[0], 0.5, 1e-12, 'fresh c=1.5 t3 x=0.5');
  verifyApprox(f15.output[1], 2.25, 1e-12, 'fresh c=1.5 t3 y=2.25');
}

/** Clamp a play duration so an animation never runs past the scene narration window. */
export function safeDur(c, startTime, desired = 0.7, margin = 0.28) {
  const remaining = c.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, remaining));
}

/**
 * Schedule an animation at a declared cue (start or end), clamping its duration
 * safely inside the scene window so no tween ever overruns c.end.
 */
export function playCue(
  s,
  c,
  cueId,
  build,
  { after = false, offset = 0, dur = 0.7, margin = 0.28 } = {},
) {
  const info = c.cue(cueId);
  const rawStart = (after ? info.end : info.start) + offset;
  const maxStart = c.end - 0.16;
  const adjOffset = rawStart > maxStart ? offset - (rawStart - maxStart) : offset;
  const startAt = (after ? info.end : info.start) + adjOffset;
  const d = safeDur(c, startAt, dur, margin);
  if (after) {
    c.after(cueId, () => build(d), adjOffset);
  } else {
    c.on(cueId, () => build(d), adjOffset);
  }
  return d;
}

/** Sequential fade-out then fade-in across two dynamic view values (zero text overlap). */
export function swapVis(outVal, inVal, d = 0.56) {
  const half = Math.max(0.1, d * 0.46);
  return seq(outVal.to(0, { duration: half }), inVal.to(1, { duration: Math.max(0.1, d - half) }));
}

/** Smooth quadratic Bezier polyline points between two 2D points with perpendicular lift. */
export function arcPts(p0, p1, lift = -110, steps = 26) {
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

/** Glowing vector arrow from origin to tip with tip photon. */
export function glowVector(
  origin,
  tip,
  { color = ROLE.router, width = 5, tipSize = 18, glow = 10, opacity = 1, dotRadius = 5 } = {},
) {
  const len = Math.hypot(tip[0] - origin[0], tip[1] - origin[1]);
  if (len < 2) {
    return glowDot(origin[0], origin[1], { radius: dotRadius, color, glow, opacity });
  }
  const vecNode = arrow(origin, tip, { stroke: color, width, tip: tipSize }).opacity(opacity);
  if (glow > 0) vecNode.glow(glow, color);
  const head = glowDot(tip[0], tip[1], { radius: dotRadius, color, glow: glow + 2, opacity });
  return group(vecNode, head);
}

/** Luminous bar with translucent fill and bright glowing edge (zero slide-card prose boxes). */
export function lumBar(
  x,
  y,
  w,
  h,
  {
    color = ROLE.expert,
    fillOpacity = 0.26,
    strokeWidth = 2.4,
    glow = 8,
    radius = 8,
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
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const edge = rect(safeW, safeH, {
    fill: null,
    stroke: color,
    width: strokeWidth,
    radius,
  })
    .at(x, y)
    .opacity(0.92 * opacity);
  if (glow > 0) edge.glow(glow, color);
  return group(body, edge);
}

/** Luminous ring marker. */
export function glowRing(
  x,
  y,
  radius,
  color,
  { width = 3.5, glow = 10, fillOpacity = 0.14, opacity = 1 } = {},
) {
  const fill = circle(radius, { fill: color, stroke: null })
    .at(x, y)
    .opacity(fillOpacity * opacity);
  const ring = circle(radius, { fill: null, stroke: color, width })
    .at(x, y)
    .glow(glow, color)
    .opacity(opacity);
  return group(fill, ring);
}

/** Ambient energy auras placed behind scene geometry. */
export function cinemaAtmosphere(accent = ROLE.token, secondary = ROLE.router) {
  return group(
    aura(-540, -240, 560, `${accent}24`, '#07091000'),
    aura(460, 140, 620, `${secondary}20`, '#07091000'),
    aura(0, 0, 720, '#2a3d7a22', '#07091000'),
  ).zIndex(-80);
}

/** Clean 2D coordinate plane with glowing axes, subtle grid hairlines, and unit ticks. */
export function vectorPlane({
  originX = -320,
  originY = 170,
  scaleX = 160,
  scaleY = 160,
  xMin = -0.6,
  xMax = 2.6,
  yMin = -0.5,
  yMax = 3.3,
  xTicks = [0, 1, 2],
  yTicks = [0, 1, 2, 3],
  axisColor = '#556894',
  gridColor = '#263457',
  xLabel = 'coord 1',
  yLabel = 'coord 2',
  tickDigits = 0,
  opacity = 1,
} = {}) {
  const toScreen = (vx, vy) => [originX + vx * scaleX, originY - vy * scaleY];
  const left = originX + xMin * scaleX;
  const right = originX + xMax * scaleX;
  const bottom = originY - yMin * scaleY;
  const top = originY - yMax * scaleY;
  const axisX = Math.max(left, Math.min(right, originX));
  const axisY = Math.max(top, Math.min(bottom, originY));

  const parts = [
    aura(
      (left + right) / 2,
      (top + bottom) / 2,
      Math.max(right - left, bottom - top) * 0.65,
      '#1e2d5c36',
      '#0d152b14',
    )
      .opacity(opacity)
      .zIndex(-50),
  ];

  xTicks.forEach((gx) => {
    const sx = originX + gx * scaleX;
    const isZero = Math.abs(gx) < 1e-6;
    parts.push(
      line([sx, bottom], [sx, top], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.4 : 1.3,
      }).opacity((isZero ? 0.85 : 0.55) * opacity),
      txt(fmt(gx, tickDigits), sx, bottom + 36, 26, COSMOS.dim, 'mono', 'center').opacity(opacity),
    );
  });

  yTicks.forEach((gy) => {
    const sy = originY - gy * scaleY;
    const isZero = Math.abs(gy) < 1e-6;
    parts.push(
      line([left, sy], [right, sy], {
        stroke: isZero ? axisColor : gridColor,
        width: isZero ? 2.4 : 1.3,
      }).opacity((isZero ? 0.85 : 0.55) * opacity),
      txt(fmt(gy, tickDigits), left - 26, sy, 26, COSMOS.dim, 'mono', 'right').opacity(opacity),
    );
  });

  parts.push(
    arrow([left, axisY], [right + 16, axisY], {
      stroke: axisColor,
      width: 2.5,
      tip: 12,
    }).opacity(opacity),
    arrow([axisX, bottom], [axisX, top - 16], {
      stroke: axisColor,
      width: 2.5,
      tip: 12,
    }).opacity(opacity),
    txt(xLabel, right + 28, axisY, 26, COSMOS.muted, 'mono', 'left').opacity(opacity),
    txt(yLabel, axisX, top - 40, 26, COSMOS.muted, 'mono', 'center').opacity(opacity),
  );

  return {
    node: group(...parts).zIndex(-10),
    toScreen,
    origin: [originX, originY],
    bounds: { left, right, top, bottom },
  };
}

/** Luminous horizontal vector strip with glowing brackets and generous cell padding. */
export function vectorRow({
  cx = 0,
  cy = 0,
  values = [],
  cellW = 148,
  cellH = 70,
  gap = 12,
  color = ROLE.token,
  digits = 2,
  fontSize = 28,
  label = '',
  labelColor = null,
  highlightIdx = -1,
  opacity = 1,
} = {}) {
  const n = values.length;
  const totalW = n * cellW + (n - 1) * gap;
  const left = cx - totalW / 2;
  const bxL = left - 16;
  const bxR = left + totalW + 16;
  const byT = cy - cellH / 2 - 8;
  const byB = cy + cellH / 2 + 8;
  const baseColor = Array.isArray(color) ? color[0] : color;
  const parts = [
    glowingTrail(
      [
        [bxL + 12, byT],
        [bxL, byT],
        [bxL, byB],
        [bxL + 12, byB],
      ],
      { color: baseColor, width: 2.6, glow: 5, core: false, opacity: 0.72 * opacity },
    ),
    glowingTrail(
      [
        [bxR - 12, byT],
        [bxR, byT],
        [bxR, byB],
        [bxR - 12, byB],
      ],
      { color: baseColor, width: 2.6, glow: 5, core: false, opacity: 0.72 * opacity },
    ),
  ];

  if (label) {
    parts.push(
      txt(label, bxL - 24, cy, 28, labelColor ?? baseColor, 'mono', 'right').opacity(opacity),
    );
  }

  values.forEach((v, i) => {
    const rx = left + i * (cellW + gap) + cellW / 2;
    const isHi = i === highlightIdx;
    const col = Array.isArray(color) ? color[i % color.length] : color;
    const str =
      v === null || v === undefined ? '?' : typeof v === 'number' ? fmt(v, digits) : String(v);
    parts.push(
      lumBar(rx, cy, cellW, cellH, {
        color: isHi ? ROLE.router : col,
        fillOpacity: isHi ? 0.34 : 0.16,
        strokeWidth: isHi ? 2.8 : 1.8,
        glow: isHi ? 10 : 4,
        radius: 8,
        opacity,
      }),
      txt(str, rx, cy, fontSize, isHi ? COSMOS.ink : col, 'mono', 'center').opacity(opacity),
    );
  });

  return group(...parts);
}

/** Luminous matrix grid with glowing brackets and generous cell padding. */
export function glowMatrix({
  cx = 0,
  cy = 0,
  rows = 3,
  cols = 5,
  cellW = 140,
  cellH = 74,
  gap = 14,
  values = [],
  colors = [],
  rowLabels = [],
  colLabels = [],
  highlight = () => false,
  dim = () => false,
  fontSize = 28,
  bracketColor = '#6e83b7',
  opacity = 1,
} = {}) {
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const left = cx - totalW / 2;
  const top = cy - totalH / 2;
  const bxL = left - 18;
  const bxR = left + totalW + 18;
  const byT = top - 10;
  const byB = top + totalH + 10;
  const parts = [
    glowingTrail(
      [
        [bxL + 14, byT],
        [bxL, byT],
        [bxL, byB],
        [bxL + 14, byB],
      ],
      { color: bracketColor, width: 2.8, glow: 5, core: false, opacity: 0.78 * opacity },
    ),
    glowingTrail(
      [
        [bxR - 14, byT],
        [bxR, byT],
        [bxR, byB],
        [bxR - 14, byB],
      ],
      { color: bracketColor, width: 2.8, glow: 5, core: false, opacity: 0.78 * opacity },
    ),
  ];

  for (let r = 0; r < rows; r++) {
    const ry = top + r * (cellH + gap) + cellH / 2;
    if (rowLabels[r]) {
      parts.push(
        txt(rowLabels[r], bxL - 26, ry, 28, COSMOS.muted, 'mono', 'right').opacity(opacity),
      );
    }
    for (let k = 0; k < cols; k++) {
      const rx = left + k * (cellW + gap) + cellW / 2;
      if (r === 0 && colLabels[k]) {
        parts.push(
          txt(colLabels[k], rx, byT - 34, 28, COSMOS.muted, 'mono', 'center').opacity(opacity),
        );
      }
      const val = values[r]?.[k] ?? '';
      const isHi = highlight(r, k);
      const isDim = dim(r, k);
      const col = colors[r]?.[k] ?? (isHi ? ROLE.router : ROLE.token);
      const cellOp = (isDim ? 0.34 : 1) * opacity;
      parts.push(
        lumBar(rx, ry, cellW, cellH, {
          color: col,
          fillOpacity: isHi ? 0.38 : 0.16,
          strokeWidth: isHi ? 3 : 1.6,
          glow: isHi ? 10 : 4,
          radius: 8,
          opacity: cellOp,
        }),
      );
      if (val !== '') {
        parts.push(
          txt(String(val), rx, ry, fontSize, isHi ? COSMOS.ink : col, 'mono', 'center').opacity(
            cellOp,
          ),
        );
      }
    }
  }
  return group(...parts);
}

/** Luminous conserved probability ribbon with evenly spaced external labels. */
export function shareRibbon({
  x = 0,
  y = 0,
  width = 1220,
  height = 54,
  shares = [],
  colors = [],
  labels = [],
  count = shares.length,
  opacity = 1,
} = {}) {
  const left = x - width / 2;
  const parts = [
    lumBar(x, y, width, height, {
      color: ROLE.rule,
      fillOpacity: 0.25,
      strokeWidth: 1.6,
      glow: 0,
      radius: 8,
      opacity,
    }),
  ];
  let cursor = left;
  shares.forEach((w, i) => {
    const segW = Math.max(0, w * width);
    const col = colors[i % colors.length];
    if (i < count && segW > 3) {
      parts.push(
        lumBar(cursor + segW / 2, y, Math.max(6, segW - 4), height, {
          color: col,
          fillOpacity: 0.5,
          strokeWidth: 2.4,
          glow: 9,
          radius: 6,
          opacity,
        }),
      );
    }
    cursor += segW;
  });

  const n = labels.length;
  if (n > 0) {
    const step = width / n;
    labels.forEach((lbl, i) => {
      const lx = left + (i + 0.5) * step;
      const col = colors[i % colors.length];
      const textStr = i < count ? `${lbl} ${pct(shares[i])}` : `${lbl} ?`;
      parts.push(txt(textStr, lx, y + height / 2 + 42, 26, col, 'mono', 'center').opacity(opacity));
    });
  }
  return group(...parts);
}

/** Orbiting 3D 8-expert ring manifold (for Scene 1 capacity-question). */
export function buildExpertRing3d({ x = 590, y = -300, unit = 56 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.8,
    unit,
    focus: [0, 0, 0.25],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-2.6, 2.6],
    z: -1.1,
    step: 1.2,
    color: '#2b3d6b',
    opacity: 0.48,
  });

  const dome = parametricSurface(
    (u, v) => {
      const r = 0.2 + u * 2.5;
      const a = v * Math.PI * 2;
      const z = -0.9 + 0.72 * Math.exp(-r * r * 0.35);
      return [r * Math.cos(a), r * Math.sin(a), z];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [14, 18],
      colors: ['#0c1733', '#1c3b6e', '#5ce1e6', '#ffd166'],
      opacity: 0.42,
      mesh: '#5ce1e6',
      meshOpacity: 0.18,
      meshWidth: 0.6,
    },
  );

  const slabs = [];
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const cx = Math.cos(ang) * 2.35;
    const cy = Math.sin(ang) * 2.35;
    const isFirst = i === 0 || i === 2;
    const isSecond = i === 1 || i === 7;
    const col = isFirst ? COSMOS.cyan : isSecond ? COSMOS.violet : '#4a5c87';
    slabs.push(
      ...wireframeSlab3d([cx, cy, 0.2], 0.34, 0.34, 0.65, {
        color: col,
        width: isFirst || isSecond ? 2.6 : 1.6,
        glow: isFirst || isSecond ? 8 : 2,
      }),
    );
  }
  const hub = point3d([0, 0, 0.85], { radius: 8, color: COSMOS.gold, glow: 12 });
  view.add(floor, dome, ...slabs, hub);
  return view;
}

/** Orbiting 3D softmax routing energy surface (for Scene 3 router-scores). */
export function buildSoftmaxSurface3d({ x = 600, y = -300, unit = 56 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 14.5,
    unit,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const z1 = (u - 0.5) * 4.4;
      const z2 = (v - 0.5) * 4.4;
      const e1 = Math.exp(z1);
      const e2 = Math.exp(z2);
      const p1 = e1 / (e1 + e2 + 0.35);
      return [z1, z2, -0.7 + p1 * 2.1];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [16, 16],
      colors: ['#0c1530', '#1d3e72', '#5ce1e6', '#6ee7b7', '#ffd166'],
      opacity: 0.84,
      mesh: '#80e5ff',
      meshOpacity: 0.16,
      meshWidth: 0.6,
    },
  );

  const ridge = curve3d(
    (t) => {
      const z1 = -1.9 + t * 3.8;
      const p1 = Math.exp(z1) / (Math.exp(z1) + Math.exp(-0.4) + 0.35);
      return [z1, -0.4, -0.66 + p1 * 2.1];
    },
    0,
    1,
    { color: COSMOS.gold, width: 3, glow: 8, samples: 36 },
  );

  view.add(surf, ridge);
  return view;
}

/** Orbiting 3D auxiliary load-balance bowl N * sum(f_i * p_i) (for Scene 15 balance-pressure). */
export function buildBalanceBowl3d({ x = 590, y = -305, unit = 54 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 14.6,
    unit,
    focus: [0, 0, 0.35],
  }).at(x, y);

  const surf = parametricSurface(
    (u, v) => {
      const f = 0.08 + u * 0.84;
      const p = 0.08 + v * 0.84;
      const val = 2 * (f * p + (1 - f) * (1 - p));
      return [(u - 0.5) * 4.4, (v - 0.5) * 4.4, (val - 1) * 1.8];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [16, 16],
      colors: ['#0e1d3b', '#1b5f7a', '#6ee7b7', '#ffd166', '#ff6b8b'],
      opacity: 0.86,
      mesh: '#ffffff',
      meshOpacity: 0.14,
      meshWidth: 0.6,
    },
  );

  const optDot = point3d([0, 0, 0.06], { radius: 8, color: COSMOS.emerald, glow: 12 });
  view.add(surf, optDot);
  return view;
}

/** Orbiting 3D weight vault: 3B shared base + 8 expert weight slabs (for Scene 22 parameter-memory). */
export function buildWeightVault3d({ x = 585, y = -300, unit = 54 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.06,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.25],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-2.4, 2.4],
    z: -1.1,
    step: 1.2,
    color: '#2b3d6b',
    opacity: 0.45,
  });

  const shared = wireframeSlab3d([0, 0, -0.72], 2.5, 1.5, 0.32, {
    color: COSMOS.cyan,
    width: 2.6,
    glow: 9,
  });

  const expSlabs = [];
  for (let i = 0; i < 8; i++) {
    const colIdx = i % 4;
    const rowIdx = Math.floor(i / 4);
    const active = i === 0 || i === 2;
    expSlabs.push(
      ...wireframeSlab3d([-1.8 + colIdx * 1.2, -0.7 + rowIdx * 1.4, 0.35], 0.46, 0.52, 0.56, {
        color: active ? COSMOS.emerald : '#5c72a6',
        width: active ? 2.8 : 1.7,
        glow: active ? 10 : 3,
      }),
    );
  }
  view.add(floor, ...shared, ...expSlabs);
  return view;
}

/** Orbiting 3D dual-GPU interconnect fabric with glowing cross-link arcs (for Scene 29 expert-parallelism). */
export function buildDualGpuFabric3d({ x = 595, y = -305, unit = 54 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.04,
    distance: 15.0,
    unit,
    focus: [0, 0, 0.2],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-2.2, 2.2],
    z: -1.0,
    step: 1.2,
    color: '#26365f',
    opacity: 0.44,
  });

  const g0 = wireframeSlab3d([-1.8, 0, -0.3], 1.1, 1.45, 0.45, {
    color: COSMOS.cyan,
    width: 2.6,
    glow: 8,
  });
  const g1 = wireframeSlab3d([1.8, 0, -0.3], 1.1, 1.45, 0.45, {
    color: COSMOS.violet,
    width: 2.6,
    glow: 8,
  });

  const arcOut = curve3d((t) => [-1.6 + t * 3.2, -0.35, 0.2 + Math.sin(t * Math.PI) * 1.35], 0, 1, {
    color: COSMOS.gold,
    width: 3.2,
    glow: 10,
    samples: 32,
  });
  const arcBack = curve3d((t) => [1.6 - t * 3.2, 0.35, 0.2 + Math.sin(t * Math.PI) * 1.1], 0, 1, {
    color: COSMOS.emerald,
    width: 3.0,
    glow: 9,
    samples: 32,
  });
  const link = line3d([-0.7, 0, -0.3], [0.7, 0, -0.3], {
    color: COSMOS.blue,
    width: 2.2,
    glow: 6,
  });

  view.add(floor, ...g0, ...g1, link, arcOut, arcBack);
  return view;
}

/** Orbiting 3D SwiGLU three-matrix projection slabs (for Scene 24 expert-arithmetic). */
export function buildTensorSlabs3d({ x = 595, y = -305, unit = 54 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.0,
    unit,
    focus: [0, 0, 0.2],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-2.2, 2.2],
    z: -1.0,
    step: 1.2,
    color: '#283963',
    opacity: 0.44,
  });

  const sGate = wireframeSlab3d([-1.7, 0.55, 0.15], 0.55, 0.65, 0.72, {
    color: COSMOS.gold,
    width: 2.6,
    glow: 8,
  });
  const sUp = wireframeSlab3d([-1.7, -0.85, 0.15], 0.55, 0.65, 0.72, {
    color: COSMOS.cyan,
    width: 2.6,
    glow: 8,
  });
  const sDown = wireframeSlab3d([1.45, -0.15, 0.15], 0.72, 1.1, 0.72, {
    color: COSMOS.emerald,
    width: 2.8,
    glow: 10,
  });
  const bridge = line3d([-1.1, -0.15, 0.15], [0.7, -0.15, 0.15], {
    color: COSMOS.violet,
    width: 2.6,
    glow: 8,
  });

  view.add(floor, ...sGate, ...sUp, ...sDown, bridge);
  return view;
}
