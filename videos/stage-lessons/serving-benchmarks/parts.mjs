// Shared cinema building blocks, semantic color roles, 3D helpers, oscilloscope/receipt
// primitives, and verified math invariants for the Serving Benchmark Engineering stage lesson.
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  fadeIn,
  fadeOut,
  group,
  line,
  line3d,
  linear,
  par,
  parametricSurface,
  point3d,
  polyPath,
  rect,
} from 'vizmatic/stage';
import {
  SERVING_COHORT,
  averageResidenceMs,
  comparisonTokenTimes,
  gaps,
  rate,
  rates,
  scheduledMs,
  timedArrivalsMs,
  tokenTerminalMs,
  tokenTimes,
} from '../../films/serving-benchmarks/fixtures.mjs';
import {
  arrivalComparison,
  fixedPlayback,
  freshServingRows,
  inFlightAt,
  meanInFlight,
  nearestRank,
  servingGate,
  servingReceipt,
  servingRequestMetrics,
  wilsonLower,
} from '../../films/serving-benchmarks/model.mjs';
import {
  averageInFlight,
  freshServingState,
  servingClock,
} from '../../films/serving-benchmarks/construction.mjs';
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
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  SERVING_COHORT,
  arrivalComparison,
  aura,
  averageInFlight,
  averageResidenceMs,
  cinematic3d,
  comparisonTokenTimes,
  fixedPlayback,
  freshServingRows,
  freshServingState,
  gaps,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  inFlightAt,
  meanInFlight,
  metricReadout,
  nearestRank,
  orbitScene,
  rate,
  rates,
  rule,
  scheduledMs,
  servingClock,
  servingGate,
  servingReceipt,
  servingRequestMetrics,
  timedArrivalsMs,
  tokenTerminalMs,
  tokenTimes,
  txt,
  verifyApprox,
  verifyInvariant,
  wilsonLower,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 24 scenes:
 *   send / open-loop / Run A / primary telemetry -> cyan
 *   reply / terminal / Run B / closed-loop       -> violet
 *   qualified / pass / healthy                   -> emerald
 *   deadline / SLO floor / focus / window        -> gold
 *   fail / lag breach / late / invalid           -> rose
 *   timeout / drain / burst / caution            -> amber
 *   workload / in-flight / scheduled             -> blue
 */
export const ROLE = Object.freeze({
  send: COSMOS.cyan,
  open: COSMOS.cyan,
  runA: COSMOS.cyan,
  telemetry: COSMOS.cyan,
  reply: COSMOS.violet,
  terminal: COSMOS.violet,
  runB: COSMOS.violet,
  closed: COSMOS.violet,
  qualified: COSMOS.emerald,
  pass: COSMOS.emerald,
  ok: COSMOS.emerald,
  deadline: COSMOS.gold,
  slo: COSMOS.gold,
  focus: COSMOS.gold,
  window: COSMOS.gold,
  fail: COSMOS.rose,
  lag: COSMOS.rose,
  late: COSMOS.rose,
  error: COSMOS.rose,
  timeout: COSMOS.amber,
  drain: COSMOS.amber,
  burst: COSMOS.amber,
  caution: COSMOS.amber,
  workload: COSMOS.blue,
  inFlight: COSMOS.blue,
  scheduled: COSMOS.blue,
});

// Verified domain constants spoken across scenes
export const GAMMA_FAMILIES = Object.freeze([
  { name: 'Regular', cv: 0, k: Infinity, color: ROLE.workload },
  { name: 'Gamma k = 4', cv: 0.5, k: 4, color: ROLE.ok },
  { name: 'Poisson (k = 1)', cv: 1, k: 1, color: ROLE.open },
  { name: 'Gamma k = 1/4', cv: 2, k: 0.25, color: ROLE.burst },
]);

export const SAMPLED_GAMMA_ARRIVALS = Object.freeze([0.12, 0.37, 0.61, 0.72, 1.35, 1.69]);
export const VLLM_RESCALED_END_S = 6 / 3; // 2.0 s

export const GOODPUT_CASES = Object.freeze([
  { rps: 1.5, n: 200, qualified: 190, elapsed: 200 / 1.5, goodput: (190 * 1.5) / 200, pass: true },
  { rps: 2.0, n: 200, qualified: 160, elapsed: 200 / 2.0, goodput: (160 * 2.0) / 200, pass: false },
]);

export const REPLICA_MATH = Object.freeze({
  fleetRate: 1.5,
  residenceS: 10,
  replicas: 3,
  meanActive: 15,
  perReplicaActive: 5,
  perReplicaRate: 0.5,
  surgeDemand: 100,
  surgeReplicas: 20,
  burstExtra: 2,
  burstInstant: 7,
  strictRate: 1.0,
  strictActive: 10,
  strictPerReplica: 10 / 3,
  strictSurgeReplicas: 30,
});

export const WILSON_CASES = Object.freeze([
  { passes: 200, n: 200, lower: wilsonLower(200, 200) },
  { passes: 20, n: 20, lower: wilsonLower(20, 20) },
  { passes: 190, n: 200, lower: wilsonLower(190, 200) },
]);

export const WILSON_Z = 1.6448536269514722;
export const WILSON_Z2 = WILSON_Z * WILSON_Z;

export const ADAPTER_EVENTS = Object.freeze([
  { t: 100, label: 'choices: empty content', kind: 'choices', advances: true },
  { t: 320, label: 'choices: visible text', kind: 'choices', advances: true },
  { t: 500, label: 'usage-only frame', kind: 'usage', advances: false },
  { t: 520, label: '[DONE] marker', kind: 'done', advances: false },
]);

export const PERCENTILE_POOLED = Object.freeze([...Array(19).fill(1), 100]);
export const PERCENTILE_PER_REQ = Object.freeze([1, 100]);

/** Build-time mathematical invariant suite covering every displayed value in the 24 scenes. */
export function verifyServingBenchmarksInvariants() {
  const fast = arrivalComparison(0);
  const slow = arrivalComparison(1);
  verifyInvariant(
    fast.closed.filter((r) => r.start < fast.horizon).length === 6,
    'fast closed-loop sends 6 inside 2s',
  );
  verifyInvariant(
    slow.closed.filter((r) => r.start < slow.horizon).length === 3,
    'slow closed-loop sends 3 inside 2s',
  );
  verifyInvariant(slow.closed[3].start === 2000, 'slow closed-loop R4 arrives right at 2000 ms');
  verifyInvariant(slow.open.length === 6, 'open-loop sends 6 inside 2s');

  verifyInvariant(SERVING_COHORT.length === 6, 'cohort has 6 requests');
  verifyInvariant(
    SERVING_COHORT[3].scheduled - SERVING_COHORT[2].scheduled === 60,
    'r04 is due 60 ms after r03',
  );
  verifyInvariant(
    SERVING_COHORT[2].terminal + 80 === 1300,
    'closed-loop next send = 1220 + 80 = 1300 ms',
  );

  const c0 = servingClock(0);
  const c1 = servingClock(1);
  verifyInvariant(
    c0.lag === 5 && c0.ttft === 285 && c0.valid === true,
    'r04 baseline lag=5, TTFT=285, valid',
  );
  verifyInvariant(
    c1.sent === 800 && c1.lag === 40 && c1.ttft === 250 && c1.valid === false,
    'r04 delayed send=800 -> lag=40, TTFT=250, invalid',
  );

  verifyApprox(averageInFlight, 2.7, 1e-9, 'Little law mean in-flight = 2.7');
  verifyInvariant(inFlightAt(0) === 3, 'inFlightAt(0) = 3');

  verifyApprox(1 / Math.sqrt(0.25), 2, 1e-9, 'Gamma k=1/4 CV = 2');
  verifyApprox(1 / Math.sqrt(4), 0.5, 1e-9, 'Gamma k=4 CV = 0.5');
  verifyApprox(VLLM_RESCALED_END_S, 2.0, 1e-9, 'vLLM constant-rate rescaled last arrival = 2.0 s');

  verifyInvariant(
    gaps.length === 4 && gaps[0] === 40 && gaps[1] === 40 && gaps[2] === 120 && gaps[3] === 40,
    'r01 ITL gaps = [40, 40, 120, 40]',
  );
  verifyApprox(
    (tokenTimes.at(-1) - tokenTimes[0]) / gaps.length,
    60,
    1e-9,
    'r01 mean TPOT = 60 ms',
  );
  verifyInvariant(tokenTerminalMs === 500, 'r01 terminal E2E = 500 ms');

  const m2 = servingRequestMetrics(SERVING_COHORT[1]);
  verifyInvariant(m2.ttft === 170 && m2.tpot === null && m2.qualified, 'r02 TTFT=170, TPOT=null');
  const m3 = servingRequestMetrics(SERVING_COHORT[2]);
  verifyInvariant(m3.ttft === 340 && !m3.qualified, 'r03 TTFT=340 fails 300ms limit');

  const runA = fixedPlayback(tokenTimes);
  const runB = fixedPlayback(comparisonTokenTimes);
  verifyInvariant(
    runA.deadlines[3] === 540 &&
      runA.deadlines[3] - runA.arrivals[3] === 100 &&
      runA.lateCount === 0,
    'Run A token 4 arrives 100 ms early with 0 misses',
  );
  verifyInvariant(
    runB.late[3] === 40 && runB.meanTpot === 80 && runB.arrivals[3] + 80 === 660,
    'Run B token 4 is 40 ms late, mean TPOT=80, Etalon next deadline=660',
  );

  const receipt = servingReceipt();
  verifyInvariant(
    receipt.offered === 6 &&
      receipt.success === 5 &&
      receipt.qualified === 3 &&
      receipt.horizon === 2500,
    'cohort receipt 6/5/3/2500',
  );
  verifyApprox(receipt.attainment, 0.5, 1e-9, 'cohort attainment = 50%');
  verifyApprox(receipt.offeredRps, 3.0, 1e-9, 'cohort offered RPS = 3.0');
  verifyApprox(receipt.successRps, 2.0, 1e-9, 'cohort success RPS = 2.0');
  verifyApprox(receipt.qualifiedRps, 1.2, 1e-9, 'cohort qualified RPS = 1.2');

  verifyApprox(GOODPUT_CASES[0].goodput, 1.425, 1e-9, '1.5 RPS * 95% = 1.425');
  verifyApprox(GOODPUT_CASES[1].goodput, 1.6, 1e-9, '2.0 RPS * 80% = 1.60');
  verifyInvariant(servingGate(rates)?.rps === 1.5, 'highest passing sweep rate = 1.5 RPS');

  verifyInvariant(
    REPLICA_MATH.fleetRate * REPLICA_MATH.residenceS === 15 &&
      REPLICA_MATH.surgeDemand / REPLICA_MATH.perReplicaActive === 20 &&
      Math.round(REPLICA_MATH.surgeDemand / REPLICA_MATH.strictPerReplica) === 30,
    'replica budget 15 -> 5/replica -> 20 replicas (30 under strict rule)',
  );

  verifyInvariant(nearestRank(PERCENTILE_POOLED, 0.95) === 1, 'pooled 20-gap p95 = 1 ms');
  verifyInvariant(nearestRank(PERCENTILE_PER_REQ, 0.95) === 100, 'per-request worst p95 = 100 ms');
  verifyApprox((1 + 100) / 2, 50.5, 1e-9, 'mean of p95s = 50.5 ms');

  verifyApprox(WILSON_Z2, 2.705543454, 1e-4, 'z^2 approx 2.706');
  verifyApprox(wilsonLower(190, 200), 0.918108167, 1e-6, 'Wilson lower 190/200 = 91.8%');
  verifyApprox(wilsonLower(200, 200), 200 / (200 + WILSON_Z2), 1e-9, 'Wilson 200/200 shortcut');
  verifyApprox(wilsonLower(20, 20), 20 / (20 + WILSON_Z2), 1e-9, 'Wilson 20/20 shortcut');

  const fresh = servingReceipt(freshServingRows(), [0, 2500]);
  verifyInvariant(
    fresh.offered === 8 && fresh.success === 7 && fresh.qualified === 6 && fresh.horizon === 4000,
    'fresh receipt 8/7/6/4000',
  );
  verifyApprox(fresh.attainment, 0.75, 1e-9, 'fresh attainment = 75%');
  verifyApprox(fresh.qualifiedRps, 1.5, 1e-9, 'fresh qualified RPS = 1.5');
  verifyApprox(fresh.successRps, 1.75, 1e-9, 'fresh success RPS = 1.75');
  verifyApprox(fresh.offeredRps, 3.2, 1e-9, 'fresh offered RPS = 3.2');
}

/** Add a glowing, depth-sorted 3D rectangular prism (6 shaded faces + 12 edges) to a Scene3D. */
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
  { faceOpacity = 0.74, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
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

/** Add a wireframe-only 3D box (12 edges). */
export function addWireBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  color = COSMOS.rose,
  { width = 1.8, opacity = 0.72, glow = 5, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const es = { color, width, opacity, glow, ...(blend ? { blend } : {}) };
  const objs = [
    line3d([x0, y0, z0], [x1, y0, z0], es),
    line3d([x1, y0, z0], [x1, y1, z0], es),
    line3d([x1, y1, z0], [x0, y1, z0], es),
    line3d([x0, y1, z0], [x0, y0, z0], es),
    line3d([x0, y0, z1], [x1, y0, z1], es),
    line3d([x1, y0, z1], [x1, y1, z1], es),
    line3d([x1, y1, z1], [x0, y1, z1], es),
    line3d([x0, y1, z1], [x0, y0, z1], es),
    line3d([x0, y0, z0], [x0, y0, z1], es),
    line3d([x1, y0, z0], [x1, y0, z1], es),
    line3d([x1, y1, z0], [x1, y1, z1], es),
    line3d([x0, y1, z0], [x0, y1, z1], es),
  ];
  view.add(...objs);
  return objs;
}

/** Evaluate a quadratic 3D Bezier curve at parameter t in [0, 1]. */
export function evalQuadBezier3D(a, mid, b, t) {
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
    u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
  ];
}

/** Add a glowing 3D Bezier pointer arc with optional streaming photons. */
export function addPointerArc3D(
  view,
  a,
  b,
  color,
  { lift = 0.65, width = 3.0, glow = 8, pulseVal = null, phaseOffset = 0, opacity = 0.92 } = {},
) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const objs = [
    curve3d((t) => evalQuadBezier3D(a, mid, b, t), 0, 1, {
      color,
      width,
      glow,
      blend: 'screen',
      samples: 32,
      opacity,
    }),
    point3d(a, { color: '#ffffff', radius: 4.8, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.4, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalQuadBezier3D(a, mid, b, (pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.4,
        glow: 12,
        blend: 'screen',
      }),
    );
  }
  view.add(...objs);
  return objs;
}

/** Hide an array of Object3D/Node items initially. */
export function hideNodes(nodes) {
  for (const n of nodes) n.hide();
  return nodes;
}

/** Clamp an animation duration so it finishes strictly before `c.end - margin`. */
export function clampDur(c, startTime, desired, margin = 0.45) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

/** Fade in an array of Object3D/Node items safely within scene end bounds. */
export function fadeInNodes(s, c, triggerTime, nodes, desired = 0.35) {
  const duration = clampDur(c, triggerTime, desired, 0.45);
  s.play(par(...nodes.map((n) => fadeIn(n, { duration }))));
}

/** Fade out an array of Object3D/Node items safely within scene end bounds. */
export function fadeOutNodes(s, c, triggerTime, nodes, desired = 0.3) {
  const duration = clampDur(c, triggerTime, desired, 0.45);
  s.play(par(...nodes.map((n) => fadeOut(n, { duration }))));
}

/** Non-overlapping crossfade curve helpers for a 0 -> 1 mode value `v`. */
export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

/** Schedule a continuous linear value drift across the active scene window. */
export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

/** Floating scene eyebrow + 1 or 2-line serif headline with generous spacing (>= 0.3 text-gap). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -435, accent = COSMOS.cyan, size = 50, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 60, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 128, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

/** Subtle dashed vertical or horizontal guide line. */
export function dashedRule(x1, y1, x2, y2, color = '#2a3c63', opacity = 0.72, width = 2) {
  return line([x1, y1], [x2, y2], { stroke: color, width, dash: [8, 8] }).opacity(opacity);
}

/** Glowing horizontal progress / allocation bar with bright active fill. */
export function glowBar(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.cyan,
    bg = '#11182c',
    border = '#2c3c63',
    glow = 8,
    radius = 10,
    opacity = 1,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cx = xLeft + totalW * 0.5;
  const track = rect(totalW, h, { fill: bg, stroke: border, width: 2.0, radius })
    .at(cx, y)
    .opacity(opacity);
  if (clamped <= 0.004) return track;
  const innerW = Math.max(8, (totalW - 8) * clamped);
  const bar = rect(innerW, h - 8, { fill, stroke: null, radius: Math.max(4, radius - 3) })
    .at(xLeft + 4 + innerW * 0.5, y)
    .opacity(0.9 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

/** Glowing 2D vector arrow with screen blend. */
export function glowArrow(from, to, color = COSMOS.gold, { width = 3.6, tip = 14, glow = 8 } = {}) {
  const a = arrow(from, to, { stroke: color, width, tip }).set('blend', 'screen');
  if (glow > 0) a.glow(glow, color);
  return a;
}

/** Smooth glowing curve trail with optional animated traveling photon dots. */
export function beamWithPhotons(
  pts,
  color,
  phaseVal,
  { width = 3.6, glow = 10, photonCount = 2, alpha = 1 } = {},
) {
  const nodes = [glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha })];
  if (typeof phaseVal === 'number' && photonCount > 0) {
    const last = pts.length - 1;
    for (let i = 0; i < photonCount; i++) {
      const u = (phaseVal + i / photonCount) % 1;
      const idx = u * last;
      const k = Math.min(last - 1, Math.floor(idx));
      const f = idx - k;
      const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f;
      const py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
      nodes.push(glowDot(px, py, { radius: 5.5, color: '#ffffff', glow: 12, opacity: alpha }));
    }
  }
  return group(...nodes);
}

/** Glowing horizontal time/value axis with >= 26px tick labels. */
export function timeAxisNodes(
  xLeft,
  xRight,
  y,
  minVal,
  maxVal,
  ticks,
  { format = (v) => String(v), color = '#3c4f78', labelColor = COSMOS.muted, opacity = 1 } = {},
) {
  const xOf = (v) => xLeft + ((v - minVal) / (maxVal - minVal)) * (xRight - xLeft);
  const nodes = [line([xLeft, y], [xRight, y], { stroke: color, width: 2.4 }).opacity(opacity)];
  for (const t of ticks) {
    const xx = xOf(t);
    nodes.push(
      line([xx, y - 9], [xx, y + 9], { stroke: color, width: 2.2 }).opacity(opacity),
      txt(format(t), xx, y + 36, 26, labelColor, 'mono').opacity(opacity),
    );
  }
  return nodes;
}

/** Precision glowing bracket showing a latency or time span without boxed chrome. */
export function spanBracket(
  x1,
  x2,
  y,
  label,
  color,
  { above = false, labelSize = 26, glow = 6, opacity = 1 } = {},
) {
  const nodes = [];
  if (Math.abs(x2 - x1) >= 2) {
    nodes.push(
      glowingTrail(
        [
          [x1, y],
          [x2, y],
        ],
        { color, width: 4.0, glow, opacity },
      ),
    );
  }
  nodes.push(
    line([x1, y - 10], [x1, y + 10], { stroke: color, width: 3.0 }).opacity(opacity),
    line([x2, y - 10], [x2, y + 10], { stroke: color, width: 3.0 }).opacity(opacity),
  );
  if (label) {
    const ly = above ? y - 34 : y + 38;
    nodes.push(txt(label, (x1 + x2) * 0.5, ly, labelSize, color, 'mono').opacity(opacity));
  }
  return nodes;
}

/** Glowing circular radial gauge (latency clock / attainment ring). */
export function radialGauge(
  cx,
  cy,
  radius,
  frac,
  color,
  { bgStroke = '#1f2b48', width = 10, glow = 10, opacity = 1, markerFrac = null } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const nodes = [
    circle(radius, { fill: null, stroke: bgStroke, width }).at(cx, cy).opacity(opacity),
  ];
  const steps = Math.max(2, Math.round(48 * clamped));
  if (clamped > 0.01) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI * 0.5 + (i / steps) * clamped * Math.PI * 2;
      pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
    }
    nodes.push(glowingTrail(pts, { color, width, glow, opacity }));
    const endPt = pts.at(-1);
    nodes.push(glowDot(endPt[0], endPt[1], { radius: 6.5, color: '#ffffff', glow: 12, opacity }));
  }
  if (markerFrac !== null) {
    const ma = -Math.PI * 0.5 + markerFrac * Math.PI * 2;
    const x1 = cx + Math.cos(ma) * (radius - 16);
    const y1 = cy + Math.sin(ma) * (radius - 16);
    const x2 = cx + Math.cos(ma) * (radius + 16);
    const y2 = cy + Math.sin(ma) * (radius + 16);
    nodes.push(
      line([x1, y1], [x2, y2], { stroke: ROLE.slo, width: 4.5 }).glow(8, ROLE.slo).opacity(opacity),
    );
  }
  return group(...nodes);
}

/** Determine semantic color for a request row in a cohort receipt clock. */
export function cohortRowColor(r, finished = true) {
  if (!finished) return COSMOS.muted;
  if (r.status === 'timeout') return ROLE.timeout;
  return servingRequestMetrics(r).qualified ? ROLE.qualified : ROLE.fail;
}

/** Determine concise outcome text for a request row. */
export function cohortRowOutcome(r, finished = true) {
  if (!finished) return 'still open';
  const m = servingRequestMetrics(r);
  if (r.status === 'timeout') return 'timeout';
  if (m.qualified) return 'qualified';
  return r.quality ? 'TTFT > 300' : 'quality fail';
}

/**
 * Signature cinematic Benchmark Receipt Clock:
 * Full-bleed horizontal oscilloscope rails with scheduled tick, glowing send photon,
 * observed token pulses, cutoff & drain laser curtains, and terminal outcome tags.
 */
export function receiptClockNodes(
  rows,
  {
    xLeft = -690,
    xRight = 460,
    topY = -170,
    spacing = 68,
    windowEnd = 2000,
    horizon = 2500,
    until = 2500,
    showOutcomes = true,
    highlightId = null,
    opacity = 1,
    ticks = null,
    slotCount = null,
  } = {},
) {
  const xOf = (ms) => xLeft + (ms / horizon) * (xRight - xLeft);
  const totalSlots = slotCount ?? rows.length;
  const bottomY = topY + (totalSlots - 1) * spacing;
  const nodes = [];

  // Cutoff and drain laser curtains
  const xCut = xOf(windowEnd);
  const xHor = xOf(horizon);
  nodes.push(
    dashedRule(xCut, topY - 46, xCut, bottomY + 34, ROLE.send, 0.8 * opacity, 2.6),
    txt(`${windowEnd / 1000}s cutoff`, xCut, topY - 68, 26, ROLE.send, 'mono').opacity(opacity),
  );
  if (horizon > windowEnd) {
    nodes.push(
      dashedRule(xHor, topY - 46, xHor, bottomY + 34, ROLE.drain, 0.85 * opacity, 2.6),
      txt(`${horizon / 1000}s drain`, xHor, topY - 68, 26, ROLE.drain, 'mono').opacity(opacity),
    );
  }

  // Sweep playhead when animating between cutoff and horizon
  if (until > windowEnd && until < horizon - 5) {
    const xNow = xOf(until);
    nodes.push(
      line([xNow, topY - 38], [xNow, bottomY + 34], { stroke: ROLE.focus, width: 3.0 })
        .glow(8, ROLE.focus)
        .opacity(opacity),
    );
  }

  rows.forEach((r, i) => {
    const yy = topY + i * spacing;
    const finished = r.terminal <= until;
    const col = cohortRowColor(r, finished);
    const isHi = highlightId && r.id === highlightId;
    const rowAlpha = highlightId && !isHi ? 0.45 * opacity : opacity;

    // Subtle oscilloscope rail
    nodes.push(
      line([xLeft, yy], [xRight, yy], { stroke: '#1c2742', width: 1.8 }).opacity(rowAlpha),
      txt(r.id, xLeft - 36, yy, 28, isHi ? ROLE.focus : COSMOS.ink, 'mono', 'right').opacity(
        rowAlpha,
      ),
    );

    const endMs = Math.min(until, r.terminal);
    const xSched = xOf(r.scheduled);
    const xEnd = xOf(endMs);

    // Scheduled notch
    nodes.push(
      line([xSched, yy - 13], [xSched, yy + 13], { stroke: ROLE.scheduled, width: 3.2 }).opacity(
        rowAlpha,
      ),
    );

    // Active span beam
    if (xEnd > xSched + 1) {
      nodes.push(
        glowingTrail(
          [
            [xSched, yy],
            [xEnd, yy],
          ],
          { color: col, width: isHi ? 7.0 : 5.2, glow: isHi ? 12 : 7, opacity: rowAlpha },
        ),
      );
    }

    // Actual send photon
    if (r.sent !== null && r.sent <= until) {
      nodes.push(
        glowDot(xOf(r.sent), yy, { radius: 6.2, color: ROLE.send, glow: 8, opacity: rowAlpha }),
      );
    }

    // Token pulse dots
    for (const tk of r.tokens) {
      if (tk <= until) {
        nodes.push(
          dot(4.0, COSMOS.ink)
            .at(xOf(tk), yy)
            .opacity(0.92 * rowAlpha),
        );
      }
    }

    // Terminal marker
    nodes.push(
      glowDot(xEnd, yy, {
        radius: finished ? 7.8 : 6.0,
        color: col,
        glow: finished ? 10 : 5,
        opacity: rowAlpha,
      }),
    );

    if (showOutcomes) {
      nodes.push(
        txt(cohortRowOutcome(r, finished), xRight + 40, yy, 26, col, 'mono', 'left').opacity(
          rowAlpha,
        ),
      );
    }
  });

  // Bottom time axis
  const axisTicks =
    ticks ?? (horizon > 3000 ? [0, 1000, 2000, 3000, 4000] : [0, 500, 1000, 1500, 2000, 2500]);
  nodes.push(
    ...timeAxisNodes(xLeft, xRight, bottomY + 46, 0, horizon, axisTicks, {
      format: (v) => (v === 0 ? '0' : `${v / 1000}s`),
      opacity,
    }),
  );

  return nodes;
}
