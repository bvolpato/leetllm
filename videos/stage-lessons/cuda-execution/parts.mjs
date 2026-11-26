// Shared math models, invariants, color semantics, and 3D hardware cinema helpers for cuda-execution.
import {
  Node,
  circle,
  curve3d,
  dot,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  activationBytes,
  addressReceipt,
  allocatorAccounting,
  cachedBlockRelease,
  executionAt,
  memoryRequests,
  modeledCopySchedule,
  precisionFailureTraces,
  reduction,
  residentResources,
  roofline,
  roundedFormat,
  sharedTrace,
  sum,
  threadMap,
  tileReuse,
  warmupTrace,
  warpMap,
} from '../../films/cuda-execution/arithmetic.mjs';
import {
  extendedValues,
  freshClock,
  freshRuntimeValues,
  ticketClock,
  tokenValues,
  writeTimes,
} from '../../films/cuda-execution/fixtures.mjs';
import { sampleModel } from '../../films/cuda-execution/model.mjs';
import {
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

export const TOKEN_VALUES = tokenValues;
export const EXTENDED_VALUES = extendedValues;
export const FRESH_VALUES = freshRuntimeValues;
export const TICKET_CLOCK = ticketClock;
export const FRESH_CLOCK = freshClock;
export const WRITE_TIMES = writeTimes;

export const BASE_REDUCTION = reduction(tokenValues, 4);
export const EXTENDED_REDUCTION = reduction(extendedValues, 4);
export const FRESH_REDUCTION = reduction(freshRuntimeValues, 8);

export const COALESCED_REQ = memoryRequests(1);
export const STRIDED_REQ = memoryRequests(32);
export const PADDED_REQ = memoryRequests(33);
export const BROADCAST_REQ = memoryRequests(0, true);

export const COPY_SERIAL = modeledCopySchedule(false);
export const COPY_OVERLAP = modeledCopySchedule(true);
export const FAIL_TRACES = precisionFailureTraces();

export const FORMAT_SPECS = Object.freeze([
  { name: 'FP32', exponent: 8, fraction: 23, min: -126, max: 127, bytes: 4, color: COSMOS.cyan },
  { name: 'FP16', exponent: 5, fraction: 10, min: -14, max: 15, bytes: 2, color: COSMOS.blue },
  { name: 'BF16', exponent: 8, fraction: 7, min: -126, max: 127, bytes: 2, color: COSMOS.gold },
]);

export const WEIGHT_START = 1;
export const WEIGHT_CANDIDATE = 1 - 0.0001;
export const FP16_PREV_BELOW_ONE = 1 - 2 ** -11;

export function storedInFormat(spec, value) {
  return roundedFormat(value, spec.fraction, spec.min, spec.max);
}

/** Build-time mathematical verification of every core identity in the CUDA execution lesson. */
export function verifyCudaInvariants() {
  // Reductions and thread mapping
  verifyInvariant(BASE_REDUCTION.blocks[0].subtotal === 10, 'block 0 subtotal must be 10');
  verifyInvariant(BASE_REDUCTION.blocks[1].subtotal === 11, 'block 1 subtotal must be 11');
  verifyApprox(BASE_REDUCTION.mean, 2.625, 1e-12, '8-token mean must be 2.625');
  verifyInvariant(EXTENDED_REDUCTION.blocks[2].subtotal === 6, 'extended block 2 subtotal = 6');
  verifyApprox(EXTENDED_REDUCTION.mean, 2.7, 1e-12, '10-token exact mean = 2.7');
  verifyInvariant(
    EXTENDED_REDUCTION.blocks.flatMap((b) => b.threads).every((t) => t.reachesBarrier),
    'every launched thread reaches block barrier',
  );
  verifyInvariant(FRESH_REDUCTION.blocks[0].subtotal === 21, 'fresh block 0 subtotal = 21');
  verifyInvariant(FRESH_REDUCTION.blocks[1].subtotal === 14, 'fresh block 1 subtotal = 14');
  verifyInvariant(FRESH_REDUCTION.total === 35, 'fresh total = 35');
  verifyInvariant(FRESH_REDUCTION.denominator === 13, 'fresh valid count = 13');
  verifyApprox(FRESH_REDUCTION.mean, 35 / 13, 1e-12, 'fresh mean = 35/13');

  // Warp packing
  const wTwo = warpMap([4, 4]);
  const w36 = warpMap([36]);
  verifyInvariant(wTwo.length === 2, 'two 4-thread blocks occupy 2 warps');
  verifyInvariant(w36.length === 2, '36-thread block occupies 2 warps');
  verifyInvariant(w36[1].lanes.filter((x) => x !== null).length === 4, 'second warp has 4 lanes');

  // Coalescing & banks
  verifyInvariant(COALESCED_REQ.segments.length === 1, 'coalesced load touches 1 segment');
  verifyInvariant(COALESCED_REQ.footprint === 32, 'coalesced footprint = 32 B');
  verifyInvariant(STRIDED_REQ.segments.length === 8, 'stride-32 load touches 8 segments');
  verifyInvariant(STRIDED_REQ.footprint === 256, 'stride-32 footprint = 256 B');
  verifyInvariant(STRIDED_REQ.maxDistinctWords === 8, 'stride-32 shared memory = 8-way conflict');
  verifyInvariant(PADDED_REQ.maxDistinctWords === 1, 'stride-33 padded = conflict-free');
  verifyInvariant(BROADCAST_REQ.maxDistinctWords === 1, 'same-word broadcast = conflict-free');

  const lanes32 = Array.from({ length: 32 }, (_, i) => i);
  const shifted32 = addressReceipt(lanes32.map((i) => 7 + i));
  verifyInvariant(shifted32.segments.length === 5, 'shifted 32-lane load touches 5 segments');
  verifyInvariant(shifted32.footprint === 160, 'shifted 32-lane footprint = 160 B');
  const stride34 = addressReceipt(lanes32.map((i) => 34 * i));
  verifyInvariant(new Set(stride34.rows.map((r) => r.bank)).size === 16, 'stride 34 uses 16 banks');
  verifyInvariant(stride34.maxDistinctWords === 2, 'stride 34 causes 2-way conflict');

  // Barrier & clocks
  verifyInvariant(sharedTrace(0.6, false).result === null, 'unsynchronized read has null result');
  verifyInvariant(sharedTrace(2.1, false).readSlots === null, 'unsynchronized slots remain null');
  verifyInvariant(sharedTrace(2.0, true).result === null, 'pre-read barrier state is null');
  verifyInvariant(sharedTrace(2.1, true).result === 10, 'synchronized block A sum = 10');

  verifyInvariant(executionAt(2).scalar === null, 'scalar not ready at host return 2 ms');
  verifyInvariant(executionAt(41).eventInterval === 40, 'GPU event interval = 40 ms');
  verifyInvariant(executionAt(41).scalar === null, 'scalar not ready until 42 ms');
  verifyApprox(executionAt(42).scalar, 2.625, 1e-12, 'scalar at 42 ms = 2.625');
  verifyInvariant(executionAt(42).hostInterval === 42, 'host completed interval = 42 ms');
  verifyInvariant(warmupTrace(21).mean === null, 'warmup excluded from sample mean');
  verifyInvariant(warmupTrace(30).completed === 2, 'two warmed samples completed');
  verifyInvariant(warmupTrace(30).mean === 8, 'warmed sample mean = 8 ms');

  const freshReady = executionAt(freshClock.scalarAt, freshClock, freshRuntimeValues);
  verifyInvariant(freshReady.eventInterval === 18, 'fresh GPU event interval = 18 ms');
  verifyInvariant(freshReady.hostInterval === 20, 'fresh host interval = 20 ms');
  verifyApprox(freshReady.scalar, Math.fround(35 / 13), 1e-12, 'fresh FP32 scalar');

  const extReady = executionAt(ticketClock.scalarAt, ticketClock, extendedValues);
  verifyInvariant(extReady.scalar === Math.fround(2.7), '10-token FP32 stored value');
  verifyInvariant(extReady.scalar.toFixed(1) === '2.7', '10-token formatted .1f log');

  // Memory budgets, activations, precision
  verifyInvariant(
    activationBytes({ batch: 32, tokens: 128, width: 768, bytes: 4 }) === 12 * 2 ** 20,
    '32x128x768 FP32 = 12 MiB',
  );
  verifyInvariant(
    activationBytes({ batch: 32, heads: 12, layers: 12, tokens: 2048, bytes: 2, scores: true }) ===
      38654705664,
    '32x12x12x2048^2x2 = 38.65 GB',
  );
  verifyInvariant(roundedFormat(65519, 10, -14, 15) === 65504, 'FP16 65519 rounds to 65504');
  verifyInvariant(roundedFormat(65520, 10, -14, 15) === Infinity, 'FP16 65520 overflows');
  verifyInvariant(roundedFormat(70000, 10, -14, 15) === Infinity, 'FP16 70000 overflows');
  verifyInvariant(roundedFormat(70000, 7, -126, 127) === 70144, 'BF16 70000 stores 70144');
  verifyInvariant(roundedFormat(0.9999, 10, -14, 15) === 1, 'FP16 loses 1 - 0.0001');
  verifyInvariant(roundedFormat(0.9999, 7, -126, 127) === 1, 'BF16 loses 1 - 0.0001');
  verifyInvariant(Math.fround(0.9999) < 1, 'FP32 preserves 1 - 0.0001');
  verifyInvariant(Number.isNaN(FAIL_TRACES.overflow.fp16), 'FP16 overflow route gives NaN');
  verifyInvariant(Number.isNaN(FAIL_TRACES.underflow.fp16), 'FP16 underflow route gives NaN');

  // Allocator, copy overlap, roofline, occupancy
  const allocInit = cachedBlockRelease(0);
  const allocDone = cachedBlockRelease(1);
  verifyInvariant(
    allocInit.allocated === 8 && allocInit.reserved === 10 && allocInit.modeledDriver === 11,
    'initial allocator ledger 8/10/11',
  );
  verifyInvariant(
    allocDone.allocated === 8 && allocDone.reserved === 8 && allocDone.modeledDriver === 9,
    'post empty_cache ledger 8/8/9',
  );
  verifyInvariant(COPY_SERIAL.completion === 20, 'serial copy+compute = 20 ms');
  verifyInvariant(COPY_OVERLAP.completion === 17, 'overlapped copy+compute = 17 ms');
  verifyInvariant(COPY_OVERLAP.inputReady.B === 6, 'B input arrives at 6 ms');
  verifyInvariant(COPY_OVERLAP.computeReady.B === 10, 'B compute starts at 10 ms');

  verifyApprox(roofline(0.25).bound, 10, 1e-12, 'roofline I=0.25 -> 10 GFLOP/s');
  verifyApprox(roofline(1.0).bound, 40, 1e-12, 'roofline I=1.0 -> 40 GFLOP/s');
  verifyApprox(roofline(4.0).bound, 100, 1e-12, 'roofline I=4.0 -> 100 GFLOP/s');

  verifyApprox(residentResources(16).occupancy, 0.5, 1e-12, '16 KiB shared -> 50% occupancy');
  verifyApprox(residentResources(32).occupancy, 0.25, 1e-12, '32 KiB shared -> 25% occupancy');
  verifyInvariant(
    tileReuse(tokenValues, 2, true).globalLoads === 8,
    'shared tile = 8 global loads',
  );
  verifyInvariant(tileReuse(tokenValues, 2, true).sharedReads === 16, '2 passes = 16 shared reads');

  // Sample model sanity check
  verifyApprox(
    sampleModel('synthesis', { beat: 0, beatP: 1 }).bound,
    10,
    1e-12,
    'sampleModel check',
  );
}

/** Shaded glowing 3D silicon tier slab (for CPU host / GPU VRAM / SM / Shared Memory views). */
export function siliconSlab3d(
  halfX,
  halfY,
  zTop,
  thickness,
  fillColor,
  edgeColor,
  meshColor,
  opacity = 0.64,
) {
  const zBot = zTop - thickness;
  const topFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, (v * 2 - 1) * halfY, zTop],
    [0, 1],
    [0, 1],
    {
      resolution: [8, 6],
      color: fillColor,
      mesh: meshColor,
      meshOpacity: 0.28,
      meshWidth: 0.65,
      opacity,
      shaded: true,
    },
  );
  const frontFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, -halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.72, shaded: true },
  );
  const rightFace = parametricSurface(
    (u, v) => [halfX, (u * 2 - 1) * halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.6, shaded: true },
  );
  const edges = wireframeSlab3d([0, 0, zTop - thickness * 0.5], halfX, halfY, thickness * 0.5, {
    color: edgeColor,
    width: 2.6,
    glow: 7,
  });
  return [topFace, frontFace, rightFace, ...edges];
}

/** Shaded 3D rectangular prism for SM warp blocks, memory allocations, and tensor cubes. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.1,
      glow: 6,
    },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/** Smooth quadratic Bezier arc in 3D space. */
export function bezier3d(a, b, lift, color, width = 3.0) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const evalAt = (t) => {
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ];
  };
  return {
    evalAt,
    node: curve3d(evalAt, 0, 1, {
      color,
      width,
      glow: 8,
      blend: 'screen',
      samples: 28,
      opacity: 0.9,
      onTop: true,
    }),
  };
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 2.0, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.25, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Safe duration after a specific cue end to the scene end. */
export function afterDuration(c, cueId, maxDur = 0.55, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.18, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Clean translucent dark-glass container cell (no PowerPoint bullet chrome). */
export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.92, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

/** Smooth 2D Bezier curve sampled as a glowingTrail. */
export function glowingArc(p0, p1, liftY, opts = {}) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const pts = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

/**
 * Reusable orbiting 3D discrete GPU package: top SM compute array + bottom HBM/VRAM slab
 * with glowing bus conduits and moving photons.
 */
export function buildGpuPackage3d(phaseVal, { x = 420, y = -80, unit = 74 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.6,
    unit,
    focus: [0, 0, 0.1],
  }).at(x, y);

  const vramSlab = siliconSlab3d(2.6, 1.8, -1.35, 0.42, '#133a5c', COSMOS.cyan, '#7ce8ff', 0.62);
  const smBase = siliconSlab3d(2.2, 1.5, 1.15, 0.24, '#1b2c4e', COSMOS.blue, '#93c5fd', 0.65);

  const smCubes = [];
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 4; col++) {
      const bx = -1.65 + col * 0.92;
      const by = -0.82 + r * 0.95;
      smCubes.push(
        ...box3d(
          bx,
          by,
          1.22,
          0.66,
          0.66,
          0.42,
          col % 2 === 0 ? '#1b5064' : '#322b66',
          col % 2 === 0 ? COSMOS.cyan : COSMOS.violet,
          0.74,
        ),
      );
    }
  }

  const conduits = [
    [-1.1, -0.6],
    [1.1, -0.6],
    [-1.1, 0.6],
    [1.1, 0.6],
  ];
  const pipes = conduits.map(([px, py]) =>
    line3d([px, py, -1.3], [px, py, 1.15], {
      color: COSMOS.cyan,
      width: 2.6,
      glow: 8,
      blend: 'screen',
      opacity: 0.78,
      onTop: true,
    }),
  );

  const photons = points3d(
    () => {
      const ph = phaseVal.value;
      return conduits.map(([px, py], i) => {
        const u = (ph * 0.55 + i * 0.25) % 1;
        return [px, py, -1.25 + u * 2.35];
      });
    },
    { color: COSMOS.gold, radius: 5.2, glow: 10, blend: 'screen', onTop: true },
  );

  view.add(...vramSlab, ...pipes, photons, ...smBase, ...smCubes);
  return view;
}

/**
 * Render a glowing dual-track asynchronous execution timeline (Python host + GPU stream).
 * Used consistently across intro, clocks, full-step-contract, and fresh-runtime.
 */
export function buildDualClockNodes({
  clock,
  time,
  ticks,
  x0 = -640,
  x1 = 760,
  hostY = 120,
  streamY = 270,
  waiting = false,
  showStreamInterval = false,
  showHostInterval = false,
  alpha = 1,
}) {
  const tMin = ticks[0];
  const tMax = ticks[ticks.length - 1];
  const sx = (t) => x0 + ((t - tMin) / (tMax - tMin)) * (x1 - x0);
  const run = executionAt(time, clock);
  const nodes = [];

  // Ruler ticks
  nodes.push(
    txt('TIME (ms)', x0 - 40, hostY - 100, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
    rule(x0, hostY - 72, x1, hostY - 72, COSMOS.rule, 2).opacity(alpha),
  );
  for (const tick of ticks) {
    const tx = sx(tick);
    nodes.push(
      rule(tx, hostY - 80, tx, hostY - 64, COSMOS.muted, 2).opacity(alpha),
      txt(String(tick), tx, hostY - 102, 26, COSMOS.muted, 'mono').opacity(alpha),
    );
  }

  // Python host lane
  nodes.push(
    txt('Python host', x0 - 40, hostY, 28, COSMOS.blue, 'sans', 'right').opacity(alpha),
    rule(x0, hostY, x1, hostY, '#263452', 3).opacity(alpha),
  );
  const subEnd = clock.hostStart + run.submitted;
  if (subEnd > clock.hostStart) {
    const w = Math.max(4, sx(subEnd) - sx(clock.hostStart));
    nodes.push(
      rect(w, 26, { fill: COSMOS.blue, stroke: null, radius: 5 })
        .at(sx(clock.hostStart) + w * 0.5, hostY)
        .glow(8, COSMOS.blue)
        .opacity(alpha),
    );
  }
  if (run.returned) {
    const rx = sx(clock.hostReturn);
    nodes.push(
      rule(rx, hostY - 26, rx, hostY + 26, COSMOS.blue, 4).opacity(alpha),
      txt(
        `return ${clock.hostReturn} ms`,
        rx + 14,
        hostY + 52,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(alpha),
    );
  }
  if (waiting && time > clock.hostReturn) {
    const waitTo = Math.min(time, clock.scalarAt);
    if (waitTo > clock.hostReturn) {
      const w = Math.max(4, sx(waitTo) - sx(clock.hostReturn));
      nodes.push(
        rect(w, 20, { fill: COSMOS.gold, stroke: null, radius: 4 })
          .at(sx(clock.hostReturn) + w * 0.5, hostY)
          .glow(7, COSMOS.gold)
          .opacity(0.82 * alpha),
      );
    }
  }
  if (run.reported) {
    const ex = sx(clock.scalarAt);
    nodes.push(
      glowDot(ex, hostY, { radius: 8, color: COSMOS.emerald, glow: 12, opacity: alpha }),
      txt(
        `scalar ${clock.scalarAt} ms`,
        ex,
        hostY + 52,
        26,
        COSMOS.emerald,
        'mono',
        'right',
      ).opacity(alpha),
    );
  }
  if (showHostInterval && run.hostInterval !== null) {
    const midX = (sx(clock.hostStart) + sx(clock.scalarAt)) * 0.5;
    nodes.push(
      txt(
        `${clock.scalarAt} - ${clock.hostStart} = ${run.hostInterval} ms`,
        midX,
        hostY - 40,
        28,
        COSMOS.gold,
        'mono',
      )
        .glow(6, COSMOS.gold)
        .opacity(alpha),
    );
  }

  // GPU stream lane
  nodes.push(
    txt('GPU stream', x0 - 40, streamY, 28, COSMOS.cyan, 'sans', 'right').opacity(alpha),
    rule(x0, streamY, x1, streamY, '#1d364a', 3).opacity(alpha),
  );
  const devEnd = clock.eventStart + run.deviceElapsed;
  if (devEnd > clock.eventStart) {
    const w = Math.max(4, sx(devEnd) - sx(clock.eventStart));
    nodes.push(
      rect(w, 28, { fill: COSMOS.cyan, stroke: null, radius: 5 })
        .at(sx(clock.eventStart) + w * 0.5, streamY)
        .glow(9, COSMOS.cyan)
        .opacity(alpha),
    );
  }
  if (time >= clock.eventStart) {
    const bx = sx(clock.eventStart);
    nodes.push(
      glowDot(bx, streamY, { radius: 7, color: COSMOS.ink, glow: 10, opacity: alpha }),
      txt(
        `ev0 ${clock.eventStart}`,
        bx + 12,
        streamY + 52,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(alpha),
    );
  }
  if (run.deviceComplete) {
    const dx = sx(clock.eventEnd);
    nodes.push(
      glowDot(dx, streamY, { radius: 7, color: COSMOS.ink, glow: 10, opacity: alpha }),
      txt(`ev1 ${clock.eventEnd}`, dx, streamY + 52, 26, COSMOS.cyan, 'mono', 'right').opacity(
        alpha,
      ),
    );
  }
  if (showStreamInterval && run.eventInterval !== null) {
    const midX = (sx(clock.eventStart) + sx(clock.eventEnd)) * 0.5;
    nodes.push(
      txt(
        `${clock.eventEnd} - ${clock.eventStart} = ${run.eventInterval} ms`,
        midX,
        streamY - 42,
        28,
        COSMOS.cyan,
        'mono',
      )
        .glow(6, COSMOS.cyan)
        .opacity(alpha),
    );
  }

  // Playhead beam (split to avoid crossing labels)
  const px = sx(Math.max(tMin, Math.min(tMax, time)));
  nodes.push(
    rule(px, hostY - 46, px, hostY + 26, COSMOS.gold, 3)
      .glow(6, COSMOS.gold)
      .opacity(0.9 * alpha),
    rule(px, streamY - 26, px, streamY + 26, COSMOS.gold, 3)
      .glow(6, COSMOS.gold)
      .opacity(0.9 * alpha),
  );

  return { nodes, run, sx };
}

export {
  COSMOS,
  Node,
  activationBytes,
  addressReceipt,
  allocatorAccounting,
  aura,
  cachedBlockRelease,
  circle,
  cinematic3d,
  dot,
  executionAt,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  linearGradient,
  markDecoration,
  memoryRequests,
  metricReadout,
  modeledCopySchedule,
  orbitScene,
  points3d,
  polyPath,
  precisionFailureTraces,
  radialGradient,
  rect,
  reduction,
  residentResources,
  roofline,
  roundedFormat,
  rule,
  sharedTrace,
  sum,
  surface,
  threadMap,
  tileReuse,
  txt,
  warmupTrace,
  warpMap,
  wireframeSlab3d,
};
