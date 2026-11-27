// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the GPU Serving & Autoscaling narrated lesson (all 38 scenes).
import {
  arrow,
  curve3d,
  fadeIn,
  fadeOut,
  group,
  line,
  line3d,
  linear,
  par,
  parametricSurface,
  point3d,
  rect,
} from 'vizmatic/stage';
import {
  GiB,
  autoscaleHybrid,
  autoscaleMemory,
  bandwidthWorksheet,
  burst,
  finiteWarmBurst,
  greedyPrefixExample,
  outcomes,
  pagedAllocation,
  recommend,
  refillSchedule,
  serviceTrial,
  tokenTiming,
} from '../../films/gpu-autoscaling/arithmetic.mjs';
import { phases } from '../../films/gpu-autoscaling/fixtures.mjs';
import { Worker, freshBurstSchedules, validateModel } from '../../films/gpu-autoscaling/model.mjs';
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
  markDecoration,
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
  GiB,
  Worker,
  aura,
  autoscaleHybrid,
  autoscaleMemory,
  bandwidthWorksheet,
  burst,
  cinematic3d,
  finiteWarmBurst,
  freshBurstSchedules,
  glowDot,
  glowTex,
  glowingTrail,
  greedyPrefixExample,
  guardedDynamic,
  heroTitle,
  markDecoration,
  metricReadout,
  orbitScene,
  outcomes,
  pagedAllocation,
  phases,
  recommend,
  refillSchedule,
  rule,
  serviceTrial,
  tokenTiming,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 38 scenes:
 *   warm / ready / admitted / ok -> emerald
 *   active / running / stream    -> cyan
 *   cold / pending / control     -> blue
 *   focus / deadline / R21 / ask -> gold
 *   expired / reject / alert     -> rose
 *   drain / kv / warmup / warn   -> amber
 *   decode / hybrid / adapter    -> violet
 */
export const ROLE = Object.freeze({
  warm: COSMOS.emerald,
  ready: COSMOS.emerald,
  ok: COSMOS.emerald,
  admitted: COSMOS.emerald,
  active: COSMOS.cyan,
  running: COSMOS.cyan,
  stream: COSMOS.cyan,
  cold: COSMOS.blue,
  pending: COSMOS.blue,
  control: COSMOS.blue,
  focus: COSMOS.gold,
  deadline: COSMOS.gold,
  ticket: COSMOS.gold,
  predict: COSMOS.gold,
  expired: COSMOS.rose,
  reject: COSMOS.rose,
  error: COSMOS.rose,
  alert: COSMOS.rose,
  drain: COSMOS.amber,
  kv: COSMOS.amber,
  warmup: COSMOS.amber,
  caution: COSMOS.amber,
  decode: COSMOS.violet,
  hybrid: COSMOS.violet,
  adapter: COSMOS.violet,
});

// Verified derived datasets computed once from model & arithmetic modules.
export const DATA = Object.freeze({
  coldTotal: phases.reduce((sum, [, s]) => sum + s, 0),
  tokenTrace: tokenTiming(0, [300, 340, 380, 500]),
  bundleGapMs: 340 - 300,
  bundleTpotMs: (340 - 300) / (4 - 1),
  staticRefill: refillSchedule(false),
  contRefill: refillSchedule(true),
  pagedSlack: pagedAllocation([320, 75, 900, 250], 16),
  fixedSlots: 4 * 2048,
  fixedBlocks: (4 * 2048) / 16,
  trial10: serviceTrial(100, 92, 10),
  trial12: serviceTrial(120, 105, 10),
  mem8B: autoscaleMemory(),
  memHybrid: autoscaleHybrid(),
  bw54: bandwidthWorksheet(54, 3350),
  bw27: bandwidthWorksheet(27, 3350),
  bw16: bandwidthWorksheet(16, 3350),
  tpEvents: 80 * 2 * 32,
  ppEvents: 3 * 32,
  burst1: burst(1, 30),
  burst3: burst(3, 30),
  burst4: burst(4, 30),
  burst5: burst(5, 30),
  burst20: burst(20, 30),
  specDraft: ['The', 'deploy', 'is', 'safe'],
  specTarget: ['The', 'deploy', 'was', 'blocked'],
  specResult: greedyPrefixExample(
    ['The', 'deploy', 'is', 'safe'],
    ['The', 'deploy', 'was', 'blocked'],
  ),
  splitWorkloads: [
    { name: 'Short chat', ttft: 820, tpot: 44, pass: true },
    { name: 'Decode pressure', ttft: 800, tpot: 90, pass: false },
    { name: 'Policy surge', ttft: 2450, tpot: 93, pass: false },
  ],
  spot120: { notice: 120, cleanup: 20, usable: 100 },
  spot30: { notice: 30, cleanup: 20, usable: 10 },
});

/** Build-time mathematical invariant suite covering every displayed value in the 38-scene film. */
export function verifyGpuAutoscalingInvariants() {
  verifyInvariant(validateModel() === true, 'legacy model validation suite passes');

  // Intro & Burst & Synthesis
  verifyInvariant(DATA.coldTotal === 207, 'serial cold start = 95+22+78+12 = 207s');
  verifyInvariant(
    DATA.burst1[19].start === 30 && DATA.burst1[20].start === null,
    '1 warm GPU: R20 @ 30s, R21 expires',
  );
  verifyInvariant(
    outcomes(DATA.burst1).admitted.length === 20 && outcomes(DATA.burst1).expired.length === 80,
    '1 warm: 20 admitted, 80 expired',
  );
  verifyInvariant(
    DATA.burst3[20].worker === 2 && DATA.burst3[20].start === 10,
    '3 warm: R21 -> GPU 2 @ 10s',
  );
  verifyInvariant(
    outcomes(DATA.burst3).admitted.length === 60 && outcomes(DATA.burst3).expired.length === 40,
    '3 warm: 60 admitted, 40 expired',
  );
  verifyInvariant(
    outcomes(DATA.burst4).admitted.length === 80 && outcomes(DATA.burst4).expired.length === 20,
    '4 warm: 80 admitted, 20 expired',
  );
  verifyInvariant(
    DATA.burst5[99].worker === 5 && DATA.burst5[99].start === 30 && DATA.burst5[99].end === 40,
    '5 warm: R100 -> GPU 5 @ 30s..40s',
  );
  verifyInvariant(
    outcomes(DATA.burst20).admitted.length === 100 && outcomes(DATA.burst20).expired.length === 0,
    '20 warm: all 100 start @ 0s',
  );

  // Token clocks & Event units
  verifyInvariant(DATA.tokenTrace.ttft === 300, 'TTFT = 300ms');
  verifyInvariant(
    DATA.tokenTrace.gaps[0] === 40 &&
      DATA.tokenTrace.gaps[1] === 40 &&
      DATA.tokenTrace.gaps[2] === 120,
    'decode gaps = 40, 40, 120ms',
  );
  verifyApprox(DATA.tokenTrace.tpot, 200 / 3, 1e-9, 'mean TPOT = 66.67ms');
  verifyInvariant(DATA.bundleGapMs === 40, 'bundled SSE event gap = 40ms');
  verifyApprox(DATA.bundleTpotMs, 40 / 3, 1e-9, 'bundled request TPOT = 13.33ms');

  // Worker state machine (readiness / probe-contract / drain)
  const w = new Worker();
  verifyInvariant(w.admit('R1') === 503, 'unloaded worker returns 503');
  w.loaded = true;
  verifyInvariant(w.admit('R1') === 503, 'unwarmed worker returns 503');
  w.warmed = true;
  verifyInvariant(
    w.admit('R1') === 200 && w.admit('R2') === 200,
    'ready worker admits R1, R2 -> 200',
  );
  verifyInvariant(w.admit('R1') === 409, 'duplicate ID -> 409');
  verifyInvariant(w.admit('R3') === 429 && w.healthy === true, 'full worker -> 429 while healthy');
  w.draining = true;
  verifyInvariant(
    w.admit('R4') === 503 && w.active.size === 2,
    'draining closes intake while keeping R1, R2',
  );
  w.release('R1');
  verifyInvariant(w.active.size === 1, 'R1 release leaves R2 active');
  w.release('R2');
  verifyInvariant(w.active.size === 0, 'R2 release empties active set');

  // Static vs Continuous refill
  verifyInvariant(
    DATA.staticRefill.makespan === 13 && DATA.staticRefill.empty === 8,
    'static: 13 steps, 8 empty',
  );
  verifyInvariant(
    DATA.contRefill.makespan === 10 && DATA.contRefill.empty === 2,
    'continuous: 10 steps, 2 empty',
  );

  // Paged allocation slack
  verifyInvariant(
    DATA.pagedSlack.blocks === 98 &&
      DATA.pagedSlack.slots === 1568 &&
      DATA.pagedSlack.tokens === 1545 &&
      DATA.pagedSlack.slack === 23,
    'paged slack = 98 blocks, 1568 slots, 1545 used, 23 slack',
  );
  verifyInvariant(
    DATA.fixedBlocks === 512 &&
      DATA.fixedSlots === 8192 &&
      DATA.fixedSlots - DATA.pagedSlack.slots === 6624,
    'fixed saves 6624 slots',
  );

  // Goodput trials
  verifyApprox(DATA.trial10.attainment, 0.92, 1e-9, '10 RPS attainment = 92%');
  verifyApprox(DATA.trial10.qualifiedRPS, 9.2, 1e-9, '10 RPS qualified = 9.2/s');
  verifyApprox(DATA.trial12.attainment, 0.875, 1e-9, '12 RPS attainment = 87.5%');
  verifyApprox(DATA.trial12.qualifiedRPS, 10.5, 1e-9, '12 RPS qualified = 10.5/s');

  // Memory & Hybrid & Bandwidth & Parallelism
  verifyInvariant(DATA.mem8B.bytesPerToken === 131072, '8B bytes/token = 128 KiB');
  verifyInvariant(DATA.mem8B.kv === 4 * GiB, '8B KV = 4 GiB');
  verifyApprox(DATA.mem8B.total / 1e9, 23.3392, 1e-3, '8B total ~ 23.34 GB');
  verifyInvariant(DATA.memHybrid.kv === 2 * GiB, 'Qwen3.6-27B KV = 2 GiB');
  verifyInvariant(
    DATA.memHybrid.recurrentPerRequest === 144 * 1024 * 1024,
    'Qwen3.6 recurrent = 144 MiB/req',
  );
  verifyApprox(DATA.memHybrid.total / 1e9, 65.26418, 1e-3, 'Qwen3.6 total ~ 65.3 GB');
  verifyApprox(DATA.bw54.milliseconds, 16.119, 1e-2, '54 GB read ~ 16.1 ms');
  verifyApprox(DATA.bw54.tps, 62.037, 1e-2, '54 GB ceiling ~ 62.0 tok/s');
  verifyApprox(DATA.bw27.milliseconds, 8.06, 1e-2, '27 GB read ~ 8.1 ms');
  verifyApprox(DATA.bw27.tps, 124.074, 1e-2, '27 GB ceiling ~ 124.1 tok/s');
  verifyApprox(DATA.bw16.milliseconds, 4.776, 1e-2, '16 GB read ~ 4.8 ms');
  verifyApprox(DATA.bw16.tps, 209.375, 1e-2, '16 GB ceiling ~ 209.4 tok/s');
  verifyInvariant(
    DATA.tpEvents === 5120 && DATA.ppEvents === 96,
    'TP=5120 collectives, PP=96 transfers',
  );

  // Controller & Boundaries & Coldpath & Fresh waves
  verifyInvariant(
    recommend({ at: 0, waiting: 30, running: 20 }, 4, 4, 0).target === 10,
    'Poll 0: target 10',
  );
  verifyInvariant(
    recommend({ at: 1, waiting: 30, running: 20 }, 10, 4, 1).target === 10,
    'Poll 1: target holds 10',
  );
  verifyInvariant(recommend(null, 10, 4, 2).target === 10, 'Missing telemetry holds 10');
  verifyInvariant(
    recommend({ at: 3, waiting: 36, running: 20 }, 10, 4, 3).target === 12,
    '56 reqs -> 12 desired',
  );
  verifyInvariant(
    DATA.coldTotal - 120 === 87 && 240 - DATA.coldTotal === 33,
    'coldpath lead margins +87s / -33s',
  );
  verifyInvariant(
    DATA.specResult.accepted === 2 && DATA.specResult.correction === 'was',
    'speculative greedy accepts 2 + correction',
  );
  verifyInvariant(
    freshBurstSchedules.four.admitted === 64 &&
      freshBurstSchedules.four.expired === 8 &&
      freshBurstSchedules.five.admitted === 72 &&
      freshBurstSchedules.fiveShort.admitted === 60 &&
      freshBurstSchedules.fiveShort.expired === 12 &&
      freshBurstSchedules.six.admitted === 72,
    'fresh-waves schedules verified',
  );
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
  { faceOpacity = 0.76, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
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

/** Add a wireframe-only 3D box (12 edges) for cold/pending/empty GPU replicas or slots. */
export function addWireBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  color = ROLE.cold,
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
      samples: 36,
      opacity,
    }),
    point3d(a, { color: '#ffffff', radius: 5.0, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.5, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalQuadBezier3D(a, mid, b, (pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.5,
        glow: 12,
        blend: 'screen',
      }),
      point3d(() => evalQuadBezier3D(a, mid, b, (pulseVal.value + phaseOffset + 0.5) % 1), {
        color,
        radius: 5.2,
        glow: 10,
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
  const safeEnd = c.end - 0.06;
  const available = Math.min(c.end - startTime - margin, safeEnd - startTime);
  if (available <= 0.04) return Math.max(0.02, Math.min(0.08, safeEnd - startTime));
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

/** Non-overlapping crossfade curves for a single 0 -> 1 mode value. */
export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

/** Schedule a continuous linear value drift across the active scene window. */
export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.5 } = {}) {
  const span = Math.max(0.3, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

/** Evaluate a 2D quadratic Bezier curve into sample points. */
export function quadArcPts(a, b, liftY = -80, steps = 28) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = Math.min(a[1], b[1]) + liftY;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * mx + t * t * b[0],
      u * u * a[1] + 2 * u * t * my + t * t * b[1],
    ]);
  }
  return pts;
}

/** Glowing 2D vector arrow with screen blend. */
export function glowArrow(from, to, color = COSMOS.gold, { width = 3.4, tip = 14, glow = 8 } = {}) {
  const a = arrow(from, to, { stroke: color, width, tip }).set('blend', 'screen');
  if (glow > 0) a.glow(glow, color);
  return a;
}

/** Glowing horizontal progress / telemetry bar with bright active fill. */
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

/** Smooth glowing curve trail (keeps crisp trail without looping white photon dots). */
export function beamWithPhotons(pts, color, _phaseVal, { width = 3.6, glow = 10, alpha = 1 } = {}) {
  return group(glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha }));
}

/** Floating scene eyebrow + 2-line serif headline with generous spacing (>= 0.3 text-gap). */
export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -420, accent = COSMOS.cyan, size = 52, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 64, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 136, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

/** Subtle dashed separator / threshold reference line. */
export function dashedRule(x1, y1, x2, y2, color = '#334670', opacity = 0.72, width = 2.0) {
  return line([x1, y1], [x2, y2], { stroke: color, width, dash: [8, 8] }).opacity(opacity);
}

/** Helper to safely animate a `Value` to `target` on a cue start or end. */
export function tweenOn(s, c, cueId, val, target, desired = 0.3, { after = false } = {}) {
  const handler = () => {
    const cue = c.cue(cueId);
    const t = after ? cue.end : cue.start;
    s.play(val.to(target, { duration: clampDur(c, t, desired, 0.45) }));
  };
  if (after) c.after(cueId, handler);
  else c.on(cueId, handler);
}
