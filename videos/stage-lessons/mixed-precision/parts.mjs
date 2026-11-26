// Shared math models, invariants, color semantics, and 2D/3D cinema primitives for mixed-precision.
import {
  Node,
  circle,
  curve3d,
  dot,
  fade,
  fadeIn,
  fadeOut,
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
import { bf16, fp16, roundBinary } from '../../films/mixed-precision/arithmetic.mjs';
import {
  partialSumConstruction,
  saturationFixture,
  spikeScaleFixture,
} from '../../films/mixed-precision/construction.mjs';
import {
  comparisonRuns,
  passesGates,
  policyPrecisionFixture,
  precisionBoundaryFixture,
  qualityGates,
  reductionPrecisionFixture,
  unequalTokenFixture,
} from '../../films/mixed-precision/fixtures.mjs';
import {
  accumulationState,
  memoryInventory,
  overflowControllerState,
  underflowState,
  underflowTraceSnapshot,
  validateModel,
} from '../../films/mixed-precision/model.mjs';
import {
  above,
  below,
  decrement,
  one,
  weightAfter,
  weightHistory,
} from '../../films/mixed-precision/weight-ruler.mjs';
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
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

// Precomputed model snapshots derived directly from videos/films/mixed-precision/*.mjs
export const ONE = one;
export const FP16_BELOW = below;
export const FP16_ABOVE = above;
export const DECREMENT = decrement;
export const WANTED_WEIGHT = one - decrement;
export const FP16_HALF_DOWN = (one - below) / 2;
export const FP16_HALF_UP = (above - one) / 2;
export const FP16_MID_DOWN = (one + below) / 2;
export const FP16_MID_UP = (one + above) / 2;

export const FP16_AFTER_DEC = weightAfter(one, -decrement, fp16);
export const FP32_AFTER_DEC = weightAfter(one, -decrement, Math.fround);
export const FP32_UNIT = 2 ** -24;
export const FP32_LOWER_TICK = Math.floor(WANTED_WEIGHT / FP32_UNIT) * FP32_UNIT;
export const FP32_UPPER_TICK = FP32_LOWER_TICK + FP32_UNIT;

export const GRID_DELTA = 0.0003;
export const FP16_MINUS_GRID = weightAfter(one, -GRID_DELTA, fp16);
export const FP16_PLUS_GRID = weightAfter(one, GRID_DELTA, fp16);

export const WEIGHT_HIST = weightHistory(6);

export const RANGE_SMALL = Math.fround(1.2e-8);
export const RANGE_LARGE = Math.fround(100000);
export const RANGE_SMALL_FP16 = fp16(RANGE_SMALL);
export const RANGE_LARGE_FP16 = fp16(RANGE_LARGE);
export const RANGE_SMALL_BF16 = bf16(RANGE_SMALL);
export const RANGE_LARGE_BF16 = bf16(RANGE_LARGE);
export const FP16_MAX = fp16(65504);
export const FP16_MIN_SUBNORMAL = 2 ** -24;
export const FP16_HALF_SUBNORMAL = 2 ** -25;

export const UNDERFLOW_PLAIN = underflowState(0);
export const UNDERFLOW_SCALED = underflowState(1);
export const UNDERFLOW_RECOVERED = underflowState(2, 1);
export const TRANSFER_TRACE_RESTORED = underflowTraceSnapshot({
  beat: 2,
  cues: {
    'unscale-gradient': { phase: 'after', progress: 1 },
    'recovered-gradient': { phase: 'after', progress: 1 },
    'forward-rounding': { phase: 'after', progress: 1 },
  },
});

export const CTRL_SPIKE = overflowControllerState(0, 1);
export const CTRL_BACKOFF = overflowControllerState(1, 1);
export const CTRL_WRONG = overflowControllerState(2, 1);
export const CTRL_RETRIED = fp16(CTRL_SPIKE.gradient * CTRL_BACKOFF.nextScale);

export const ACCUM_END = accumulationState(1, 1);
export const MEM_START = memoryInventory(0);
export const MEM_END = memoryInventory(1);

export const REDUCE_FIX = reductionPrecisionFixture();
export const POLICY_FIX = policyPrecisionFixture();
export const UNEQUAL_FIX = unequalTokenFixture();
export const BOUNDARY_FIX = precisionBoundaryFixture();
export const SPIKE_FP8_FIX = spikeScaleFixture();
export const SAT_FP8_FIX = saturationFixture();

export const PARTIAL_INPUTS = Object.freeze([40000, 40000, -40000]);
export const PARTIAL_FP16_STEPS = Object.freeze([
  0,
  fp16(40000),
  fp16(fp16(40000) + 40000),
  fp16(fp16(fp16(40000) + 40000) - 40000),
]);
export const PARTIAL_FP32_STEPS = Object.freeze([
  0,
  Math.fround(40000),
  Math.fround(Math.fround(40000) + 40000),
  Math.fround(Math.fround(Math.fround(40000) + 40000) - 40000),
]);

export const RUNS_INIT = comparisonRuns(0.92);
export const RUNS_RETEST = comparisonRuns(qualityGates.policy);

/** Build-time mathematical verification of every identity across the 14 scenes. */
export function verifyMixedPrecisionInvariants() {
  verifyInvariant(validateModel() === true, 'mixed-precision model validation passes');

  // Intro & Grid
  verifyInvariant(FP16_AFTER_DEC === 1, 'FP16 swamps 1 - 0.0001 back to 1');
  verifyApprox(FP32_AFTER_DEC, 0.99989998, 1e-8, 'FP32 preserves 1 - 0.0001');
  verifyInvariant(FP16_MINUS_GRID === FP16_BELOW, 'FP16 1 - 0.0003 crosses lower midpoint');
  verifyInvariant(FP16_PLUS_GRID === 1, 'FP16 1 + 0.0003 stays at 1');
  verifyApprox(FP16_HALF_UP / FP16_HALF_DOWN, 2, 1e-12, 'upper half-gap is 2x lower half-gap');

  // Range check & Underflow & Transfer
  verifyInvariant(RANGE_SMALL_FP16 === 0, 'FP16 underflows 1.2e-8 to 0');
  verifyInvariant(RANGE_LARGE_FP16 === Infinity, 'FP16 overflows 100000 to Infinity');
  verifyInvariant(RANGE_SMALL_BF16 > 0, 'BF16 preserves 1.2e-8');
  verifyInvariant(RANGE_LARGE_BF16 === 99840, 'BF16 rounds 100000 to 99840');
  verifyInvariant(UNDERFLOW_PLAIN.stored === 0, 'unscaled 2^-26 stores 0 in FP16');
  verifyInvariant(UNDERFLOW_SCALED.stored === 2 ** -18, 'scaled 2^-26 * 256 stores 2^-18');
  verifyInvariant(UNDERFLOW_RECOVERED.recovered === 2 ** -26, 'FP32 unscale recovers 2^-26');
  verifyInvariant(BOUNDARY_FIX.roundedInput === 1, 'forward 1.0001 rounds to 1 in FP16');
  verifyInvariant(TRANSFER_TRACE_RESTORED.recovered === 2 ** -26, 'transfer trace recovers 2^-26');

  // Update trace
  verifyInvariant(WEIGHT_HIST[2].copy === 1, 'step 2 FP16 copy still at 1');
  verifyInvariant(WEIGHT_HIST[3].copy === FP16_BELOW, 'step 3 FP16 copy steps down');
  verifyInvariant(
    WEIGHT_HIST.every((r) => r.direct === 1),
    'direct FP16 stalls at 1 for all 6 steps',
  );

  // Controller
  verifyInvariant(CTRL_SPIKE.scaled === 76800, 'spike 300 * 256 = 76800');
  verifyInvariant(CTRL_SPIKE.stored === Infinity, '76800 overflows FP16');
  verifyInvariant(CTRL_BACKOFF.nextScale === 64, 'backoff scale drops to 64');
  verifyInvariant(CTRL_RETRIED === 19200, '300 * 64 = 19200 fits FP16');
  verifyInvariant(CTRL_WRONG.wrongMoment === Infinity, 'unskipped Inf poisons Adam m');

  // Ordering & Memory
  verifyApprox(Math.min(20.48, 1) / 1024, 1 / 1024, 1e-12, 'premature clip yields 1/1024');
  verifyApprox(Math.min(20.48 / 1024, 1), 0.02, 1e-12, 'unscale-then-clip keeps 0.02');
  verifyInvariant(
    ACCUM_END.scaled[0] === 192 && ACCUM_END.scaled[1] === 128,
    '3-microbatch scaled buffer = [192, 128]',
  );
  verifyApprox(ACCUM_END.unscaled[0], 0.75, 1e-12, 'unscaled coord 0 = 0.75');
  verifyApprox(ACCUM_END.unscaled[1], 0.5, 1e-12, 'unscaled coord 1 = 0.5');
  verifyInvariant(UNEQUAL_FIX.mean === -1 && UNEQUAL_FIX.meanOfMeans === 0, 'unequal token means');
  verifyApprox(MEM_END.saved, 1.6, 1e-12, '1.6 GB freed');
  verifyApprox(MEM_END.fraction, 1 / 3, 1e-12, 'one third of 4.8 GB freed');

  // Communication, Policy, FP8, Earned Transfer
  verifyInvariant(REDUCE_FIX.bf16[2] === 0 && REDUCE_FIX.fp32[2] === 1, 'BF16 vs FP32 reduction');
  verifyInvariant(
    POLICY_FIX.wideAction === 1 && POLICY_FIX.roundedAction === 0,
    'BF16 logit rounding flips sampled action',
  );
  verifyInvariant(
    SPIKE_FP8_FIX[0].restored === 512 && SPIKE_FP8_FIX[1].restored === 8,
    'FP8 current vs delayed spike restore',
  );
  verifyInvariant(
    SAT_FP8_FIX.stored === 448 && SAT_FP8_FIX.error === 52,
    'E4M3 saturates 500 to 448 (err 52)',
  );
  verifyInvariant(
    PARTIAL_FP16_STEPS[2] === Infinity &&
      PARTIAL_FP16_STEPS[3] === Infinity &&
      PARTIAL_FP32_STEPS[3] === 40000,
    'intermediate 80000 overflows FP16 irreversibly while FP32 recovers 40000',
  );
  verifyInvariant(
    !passesGates(RUNS_INIT[0]) && passesGates(RUNS_INIT[1]),
    'initial gates pass only B',
  );
  verifyInvariant(
    passesGates(RUNS_RETEST[0]) && passesGates(RUNS_RETEST[1]),
    'retest at 93% passes both A and B',
  );
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.45) {
  return Math.max(0.35, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start/end to the scene end. */
export function remainDuration(c, cueId, maxDur = 0.65, endMargin = 0.35, fromEnd = false) {
  const cue = c.cue(cueId);
  const origin = fromEnd ? cue.end : cue.start;
  const avail = Math.max(0.18, c.end - origin - endMargin);
  return Math.min(maxDur, avail);
}

/** Safe duration from a beat start to the scene end. */
export function beatRemainDuration(c, beatIndex, maxDur = 0.65, endMargin = 0.35) {
  const beat = c.beats[beatIndex];
  const origin = beat ? beat.start : c.start;
  const avail = Math.max(0.18, c.end - origin - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.45);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Smooth 2D Bezier curve sampled as a glowingTrail. */
export function glowingArc(p0, p1, liftY, opts = {}) {
  const mx = (p0[0] + p1[0]) * 0.5;
  const my = (p0[1] + p1[1]) * 0.5 + liftY;
  const pts = Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ];
  });
  return glowingTrail(pts, opts);
}

/** Luminous IEEE-754 bit-field beam (individual glowing bit cells, zero boxed card chrome). */
export function bitFieldRibbon({
  x,
  y,
  totalWidth,
  height = 54,
  signBits = 1,
  expBits = 5,
  fracBits = 10,
  signColor = COSMOS.rose,
  expColor = COSMOS.gold,
  fracColor = COSMOS.blue,
  opacity = 1,
  reveal = 1,
  showBitGlyphs = false,
}) {
  const totalBits = signBits + expBits + fracBits;
  const gap = totalBits <= 8 ? 10 : 5;
  const groupGap = totalBits <= 8 ? 22 : 14;
  const availW = totalWidth - (totalBits - 1) * gap - 2 * groupGap;
  const cellW = availW / totalBits;
  const nodes = [];
  let cursor = x;
  const litBits = Math.max(0, Math.ceil(totalBits * reveal));
  let bitIdx = 0;

  const segments = [
    { count: signBits, color: signColor, tag: 's' },
    { count: expBits, color: expColor, tag: 'e' },
    { count: fracBits, color: fracColor, tag: 'm' },
  ];

  const centers = [];
  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const seg = segments[segIdx];
    const segStart = cursor;
    for (let k = 0; k < seg.count; k++) {
      const lit = bitIdx < litBits;
      const cx = cursor + cellW * 0.5;
      const cell = rect(cellW, height, {
        fill: lit ? seg.color : '#101628',
        stroke: seg.color,
        width: lit ? 1.8 : 1.2,
        radius: 6,
      })
        .at(cx, y)
        .opacity((lit ? 0.86 : 0.25) * opacity);
      if (lit) cell.glow(7, seg.color);
      nodes.push(cell);
      if (showBitGlyphs && lit && cellW >= 36) {
        nodes.push(txt(seg.tag, cx, y, 26, COSMOS.bg, 'mono').opacity(opacity));
      }
      cursor += cellW + gap;
      bitIdx++;
    }
    const segEnd = cursor - gap;
    centers.push({
      cx: (segStart + segEnd) * 0.5,
      x0: segStart,
      x1: segEnd,
      color: seg.color,
      count: seg.count,
    });
    if (segIdx < 2) cursor += groupGap - gap;
  }

  return { group: group(...nodes), centers, endX: cursor - gap };
}

/** Shaded 3D rectangular prism for memory volumes, MXFP8 elements, and 16-byte parameter monoliths. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.78) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.0,
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

/** Shaded glowing 3D silicon tier slab. */
export function siliconSlab3d(
  halfX,
  halfY,
  zTop,
  thickness,
  fillColor,
  edgeColor,
  meshColor,
  opacity = 0.62,
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
      meshWidth: 0.7,
      opacity,
      shaded: true,
    },
  );
  const frontFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, -halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.75, shaded: true },
  );
  const rightFace = parametricSurface(
    (u, v) => [halfX, (u * 2 - 1) * halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.62, shaded: true },
  );
  const edges = wireframeSlab3d([0, 0, zTop - thickness * 0.5], halfX, halfY, thickness * 0.5, {
    color: edgeColor,
    width: 2.6,
    glow: 7,
  });
  return [topFace, frontFace, rightFace, ...edges];
}

/** Format large or tiny numeric values cleanly for phone-readable cinema display. */
export function fmtVal(value) {
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '-∞';
  if (Number.isNaN(value)) return 'NaN';
  if (value === 0) return '0';
  if (Math.abs(value) < 1e-3) return value.toExponential(2);
  if (Math.abs(value) >= 1000) return value.toLocaleString('en-US');
  return String(value);
}

export {
  COSMOS,
  Node,
  accumulationState,
  aura,
  bf16,
  circle,
  cinematic3d,
  comparisonRuns,
  curve3d,
  dot,
  fade,
  fadeIn,
  fadeOut,
  fp16,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  linearGradient,
  markDecoration,
  memoryInventory,
  metricReadout,
  morphEquation,
  orbitScene,
  parametricSurface,
  partialSumConstruction,
  passesGates,
  points3d,
  polyPath,
  qualityGates,
  radialGradient,
  rect,
  roundBinary,
  rule,
  surface,
  txt,
  wireframeSlab3d,
};
