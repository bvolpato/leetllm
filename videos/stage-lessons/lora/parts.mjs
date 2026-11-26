// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for LoRA.
import {
  Node,
  arrow,
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
import { matmul, matvec } from '../../films/lora/arithmetic.mjs';
import { rankOneConstruction } from '../../films/lora/construction.mjs';
import { EXAMPLE, FACTORS, NF4_LEVELS } from '../../films/lora/fixtures.mjs';
import { num } from '../../films/lora/geometry.mjs';
import {
  adapterGradients,
  doraRow,
  forward,
  learningSteps,
  nf4Block,
  policyEvaluation,
  policyRequest,
  projectionBudget,
  rectangularExample,
  rotatedPlane,
  rotationPolicy,
  trainingInventory,
  validateModel,
} from '../../films/lora/model.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export const FWD_SCALE2 = forward(2, EXAMPLE.x);
export const FWD_EQUAL = forward(2, [1, 1]);
export const LEARN_STEPS = learningSteps();
export const RECT_ZERO = rectangularExample(0);
export const RECT_EDITED = rectangularExample(1);
export const BUDGET_7B = projectionBudget(4096, 11008, 4096, 16);
export const BUDGET_TINY = projectionBudget(16, 32, 8, 2);
export const NF4_SAMPLE_WEIGHTS = Object.freeze([-0.2, 0, 0.2, 2]);
export const NF4_SAMPLE = nf4Block(NF4_SAMPLE_WEIGHTS);
export const DORA_BASE_V = Object.freeze([3, 4]);
export const DORA_STRETCH_V = Object.freeze([6, 8]);
export const DORA_X = Object.freeze([1, 0]);
export const DORA_M = 5;
export const DORA_BASE = doraRow(DORA_BASE_V, DORA_M, DORA_X);
export const DORA_STRETCH = doraRow(DORA_STRETCH_V, DORA_M, DORA_X);
export const POLICY_REQ = policyRequest();
export const POLICY_ORIG = policyEvaluation();
export const POLICY_A = policyEvaluation('P20');
export const POLICY_B = policyEvaluation('R07');
export const MEM_SHORT = trainingInventory(8, 1);
export const MEM_LONG = trainingInventory(13, 1);
export const MEM_HALF = trainingInventory(13, 0.5);
export const FACTORS_BA = matmul(FACTORS.B, FACTORS.A);

export const PARAM_4096 = Object.freeze({
  d: 4096,
  r: 16,
  base: 4096 * 4096,
  adapter: 16 * (4096 + 4096),
  ratio: (16 * (4096 + 4096)) / (4096 * 4096),
  baseFlops: 2 * 4096 * 4096,
  adapterFlops: 4 * 4096 * 16,
});

export const SCALE_SWEEP = Object.freeze([
  { r: 8, alpha: 16, ordinary: 16 / 8, rslora: 16 / Math.sqrt(8) },
  { r: 32, alpha: 16, ordinary: 16 / 32, rslora: 16 / Math.sqrt(32) },
  { r: 32, alpha: 64, ordinary: 64 / 32, rslora: 64 / Math.sqrt(32) },
]);

export const NESTED_QUANT = Object.freeze({
  blockSize: 64,
  groupSize: 256,
  ordinaryBits: 32 / 64,
  nestedBits: 8 / 64 + 32 / (64 * 256),
  paramsB: 65,
  savedGB: (65 * (32 / 64 - (8 / 64 + 32 / (64 * 256)))) / 8,
  nestedTotalGB: (65 * (8 / 64 + 32 / (64 * 256))) / 8,
  rawFourBitGB: (65 * 4) / 8,
});

export const SERVING_FOOTPRINT = Object.freeze({
  baseGB: 14,
  tenants: 50,
  adapterGB: 0.128,
  mergedTotalGB: 50 * 14,
  sharedAdaptersGB: 50 * 0.128,
  sharedTotalGB: 14 + 50 * 0.128,
  ratio: (50 * 14) / (14 + 50 * 0.128),
});

export const TINY_COUNTS = Object.freeze({
  base: 3408,
  adapter: BUDGET_TINY.reduce((sum, row) => sum + row.count, 0),
  wrapped: 3408 + BUDGET_TINY.reduce((sum, row) => sum + row.count, 0),
});

export const BUDGET_7B_SUMS = Object.freeze({
  qv: BUDGET_7B[0].count + BUDGET_7B[2].count,
  attn: BUDGET_7B.slice(0, 4).reduce((sum, row) => sum + row.count, 0),
  all: BUDGET_7B.reduce((sum, row) => sum + row.count, 0),
});

export const BUDGET_TINY_SUMS = Object.freeze({
  qv: BUDGET_TINY[0].count + BUDGET_TINY[2].count,
  attn: BUDGET_TINY.slice(0, 4).reduce((sum, row) => sum + row.count, 0),
  all: BUDGET_TINY.reduce((sum, row) => sum + row.count, 0),
});

/** Build-time mathematical verification of every core identity in the LoRA lesson. */
export function verifyLoraInvariants() {
  verifyInvariant(validateModel() === true, 'films/lora/model.mjs validateModel() must pass');

  // 2x2 thin-forward and merge invariants
  verifyInvariant(FWD_SCALE2.base[0] === 4 && FWD_SCALE2.base[1] === 10, 'base output [4, 10]');
  verifyInvariant(FWD_SCALE2.intermediate[0] === 1, 'Ax = [1]');
  verifyInvariant(
    FWD_SCALE2.correction[0] === 1 && FWD_SCALE2.correction[1] === 2,
    'correction [1, 2]',
  );
  verifyInvariant(
    FWD_SCALE2.output[0] === 5 && FWD_SCALE2.output[1] === 12,
    'adapted output [5, 12]',
  );
  verifyInvariant(
    FWD_SCALE2.merged[0][0] === 2 &&
      FWD_SCALE2.merged[0][1] === 1 &&
      FWD_SCALE2.merged[1][0] === 5 &&
      FWD_SCALE2.merged[1][1] === 2,
    'merged matrix [[2,1],[5,2]]',
  );
  verifyInvariant(
    FWD_EQUAL.correction[0] === 0 &&
      FWD_EQUAL.correction[1] === 0 &&
      FWD_EQUAL.output[0] === 3 &&
      FWD_EQUAL.output[1] === 7,
    'null-space input [1, 1] gives zero correction and [3, 7]',
  );

  // Zero-init 2-step gradient invariants
  verifyInvariant(LEARN_STEPS[0].gradA === 0, 'step 1 gradA is 0');
  verifyInvariant(LEARN_STEPS[0].gradB === -1, 'step 1 gradB is -1');
  verifyApprox(LEARN_STEPS[1].b, 0.1, 1e-12, 'step 2 B = 0.1');
  verifyApprox(LEARN_STEPS[1].gradB, -0.9, 1e-12, 'step 2 gradB = -0.9');
  verifyApprox(LEARN_STEPS[1].gradA, -0.09, 1e-12, 'step 2 gradA = -0.09');

  const gCheck = adapterGradients({ A: [[1]], B: [[0]], x: [1], g: [-1], scale: 1 });
  verifyInvariant(gCheck.gradB[0][0] === -1 && gCheck.gradA[0][0] === 0, 'adapterGradients step 1');

  // 4096x4096 r=16 budget and FLOPs
  verifyInvariant(PARAM_4096.base === 16777216, '4096^2 base params');
  verifyInvariant(PARAM_4096.adapter === 131072, 'r=16 adapter params');
  verifyApprox(PARAM_4096.ratio, 0.0078125, 1e-12, '0.78125% param ratio');
  verifyInvariant(PARAM_4096.baseFlops === 33554432, 'base matvec FLOPs');
  verifyInvariant(PARAM_4096.adapterFlops === 262144, 'adapter matvec FLOPs');

  // Rank scaling (ordinary vs rsLoRA)
  verifyInvariant(SCALE_SWEEP[0].ordinary === 2, '16/8 = 2');
  verifyInvariant(SCALE_SWEEP[1].ordinary === 0.5, '16/32 = 0.5');
  verifyInvariant(SCALE_SWEEP[2].ordinary === 2, '64/32 = 2');
  verifyApprox(SCALE_SWEEP[0].rslora, 5.656854, 1e-4, '16/sqrt(8)');
  verifyApprox(SCALE_SWEEP[1].rslora, 2.828427, 1e-4, '16/sqrt(32)');
  verifyApprox(SCALE_SWEEP[2].rslora, 11.313708, 1e-4, '64/sqrt(32)');

  // Projection budgets
  verifyInvariant(BUDGET_7B_SUMS.qv === 262144, '7B Q+V r=16 = 262,144');
  verifyInvariant(BUDGET_7B_SUMS.all === 1249280, '7B all-linear r=16 = 1,249,280');
  verifyApprox(BUDGET_7B_SUMS.all / BUDGET_7B_SUMS.qv, 4.765625, 1e-6, '4.77x ratio');
  verifyInvariant(BUDGET_TINY_SUMS.qv === 112, 'tiny Q+V = 112');
  verifyInvariant(BUDGET_TINY_SUMS.attn === 224, 'tiny all-attn = 224');
  verifyInvariant(BUDGET_TINY_SUMS.all === 512, 'tiny all-linear = 512');
  verifyInvariant(TINY_COUNTS.wrapped === 3920, 'tiny wrapped = 3920');

  // Rectangular example
  verifyApprox(RECT_EDITED.output[0], 1.285, 1e-12, 'rectangular out[0]');
  verifyApprox(RECT_EDITED.output[1], -0.875, 1e-12, 'rectangular out[1] unchanged');
  verifyApprox(RECT_EDITED.output[2], 1.105, 1e-12, 'rectangular out[2]');

  // Memory inventories & QLoRA nested quantization
  verifyInvariant(MEM_SHORT.total === 29, '1024-token peak 29 GB');
  verifyInvariant(MEM_LONG.total === 34, '2048-token peak 34 GB');
  verifyInvariant(MEM_HALF.total === 33.5, 'halved adapter peak 33.5 GB');
  verifyApprox(NESTED_QUANT.nestedBits, 0.126953125, 1e-12, 'nested scale bits/weight');
  verifyApprox(NESTED_QUANT.savedGB, 3.0315, 1e-3, '65B nested savings ~3.0315 GB');
  verifyApprox(
    NESTED_QUANT.rawFourBitGB + NESTED_QUANT.nestedTotalGB,
    33.5315,
    1e-3,
    '65B QLoRA base',
  );

  // NF4 codec
  verifyInvariant(NF4_LEVELS.length === 16, '16 NF4 levels');
  verifyInvariant(NF4_LEVELS[7] === 0, 'code 7 is exact 0');
  verifyInvariant(
    NF4_SAMPLE.codes[0] === 6 &&
      NF4_SAMPLE.codes[1] === 7 &&
      NF4_SAMPLE.codes[2] === 8 &&
      NF4_SAMPLE.codes[3] === 15,
    'NF4 codes [6,7,8,15]',
  );
  verifyApprox(NF4_SAMPLE.decoded[2], 0.15916, 1e-5, 'NF4 decoded +0.2');
  verifyApprox(NF4_SAMPLE.decoded[0], -0.1821, 1e-5, 'NF4 decoded -0.2');

  // DoRA forward & backward
  verifyInvariant(DORA_BASE.norm === 5 && DORA_BASE.output === 3, 'DoRA [3,4] output 3');
  verifyInvariant(DORA_STRETCH.norm === 10 && DORA_STRETCH.output === 3, 'DoRA [6,8] output 3');
  verifyApprox(DORA_BASE.full[0], 0.64, 1e-12, 'DoRA full grad x = 0.64');
  verifyApprox(DORA_BASE.full[1], -0.48, 1e-12, 'DoRA full grad y = -0.48');
  verifyInvariant(
    DORA_BASE.detached[0] === 1 && DORA_BASE.detached[1] === 0,
    'DoRA detached grad [1,0]',
  );

  // Serving footprint
  verifyInvariant(SERVING_FOOTPRINT.mergedTotalGB === 700, '50 merged = 700 GB');
  verifyApprox(SERVING_FOOTPRINT.sharedTotalGB, 20.4, 1e-12, 'shared = 20.4 GB');
  verifyApprox(SERVING_FOOTPRINT.ratio, 34.3137, 1e-3, '34.3x ratio');

  // Finale policy request & evaluation
  verifyInvariant(POLICY_REQ.base === -1, 'policy base score -1');
  verifyApprox(POLICY_REQ.z, 1.5, 1e-12, 'policy Ax = 1.5');
  verifyApprox(POLICY_REQ.unscaled, 0.75, 1e-12, 'policy B(Ax) = 0.75');
  verifyApprox(POLICY_REQ.correction, 1.5, 1e-12, 'policy correction = 1.5');
  verifyApprox(POLICY_REQ.output, 0.5, 1e-12, 'policy output = +0.5');
  verifyInvariant(
    POLICY_ORIG.deploy === false && POLICY_A.deploy === false && POLICY_B.deploy === true,
    'only B passes',
  );
}

/** Shaded 3D rectangular prism for weight monoliths, adapter slabs, and GPU shards. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.4,
      glow: 7,
    },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/** Shaded glowing 3D silicon / memory tier slab. */
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
      meshWidth: 0.7,
      opacity,
      shaded: true,
    },
  );
  const frontFace = parametricSurface(
    (u, v) => [(u * 2 - 1) * halfX, -halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.76, shaded: true },
  );
  const rightFace = parametricSurface(
    (u, v) => [halfX, (u * 2 - 1) * halfY, zBot + v * thickness],
    [0, 1],
    [0, 1],
    { resolution: [6, 2], color: fillColor, mesh: false, opacity: opacity * 0.64, shaded: true },
  );
  const edges = wireframeSlab3d([0, 0, zTop - thickness * 0.5], halfX, halfY, thickness * 0.5, {
    color: edgeColor,
    width: 2.8,
    glow: 8,
  });
  return [topFace, frontFace, rightFace, ...edges];
}

/**
 * Signature 3D LoRA assembly: frozen full-rank monolith W_0 beside thin low-rank
 * bottleneck slabs A (gold) and B (cyan/emerald) with animated photon conduits.
 */
export function buildLoraAssembly3d(
  phaseVal,
  adapterActiveVal,
  { x = 310, y = 20, unit = 96, showSum = true } = {},
) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.3],
  }).at(x, y);

  // Frozen full-rank weight monolith W_0 (left/back)
  const monolith = box3d(-2.8, -1.2, -1.4, 2.3, 2.4, 2.8, '#1a3870', COSMOS.blue, 0.68);

  // Thin down-projection A (gold) and up-projection B (cyan) beside W_0
  const slabA = box3d(0.7, -1.1, -1.35, 1.9, 2.2, 0.42, '#9a6f14', COSMOS.gold, 0.78);
  const slabB = box3d(0.7, -1.1, 0.92, 1.9, 2.2, 0.42, '#147285', COSMOS.cyan, 0.78);

  // Bottleneck core link between A and B
  const bottleneck = wireframeSlab3d([1.65, 0, 0.0], 0.36, 0.36, 0.85, {
    color: COSMOS.gold,
    width: 2.8,
    glow: 9,
  });

  // Photon conduits along frozen W_0 and parallel A -> B branch
  const baseLine = line3d([-1.65, 0, -2.3], [-1.65, 0, 2.3], {
    color: COSMOS.blue,
    width: 3.4,
    glow: 9,
    blend: 'screen',
    onTop: true,
  });
  const branchIn = line3d([-1.65, 0, -2.3], [1.65, 0, -1.35], {
    color: COSMOS.gold,
    width: 3.0,
    glow: 8,
    blend: 'screen',
    onTop: true,
  });
  const branchMid = line3d([1.65, 0, -0.92], [1.65, 0, 0.92], {
    color: COSMOS.gold,
    width: 3.6,
    glow: 10,
    blend: 'screen',
    onTop: true,
  });
  const branchOut = line3d([1.65, 0, 1.35], [0.0, 0, 2.55], {
    color: COSMOS.emerald,
    width: 3.2,
    glow: 9,
    blend: 'screen',
    onTop: true,
  });
  const baseMerge = line3d([-1.65, 0, 2.3], [0.0, 0, 2.55], {
    color: COSMOS.blue,
    width: 3.2,
    glow: 8,
    blend: 'screen',
    onTop: true,
  });

  const photons = points3d(
    () => {
      const ph = phaseVal.value;
      const act =
        typeof adapterActiveVal === 'function' ? adapterActiveVal() : adapterActiveVal.value;
      const u1 = (ph * 0.45) % 1;
      const u2 = (ph * 0.45 + 0.5) % 1;
      const pts = [
        [-1.65, 0, -2.3 + u1 * 4.6],
        [-1.65, 0, -2.3 + u2 * 4.6],
      ];
      if (act > 0.15) {
        const v1 = (ph * 0.55) % 1;
        const v2 = (ph * 0.55 + 0.33) % 1;
        pts.push(
          [-1.65 + 3.3 * v1, 0, -2.3 + 0.95 * v1],
          [1.65, 0, -0.92 + 1.84 * v2],
          [1.65 - 1.65 * v1, 0, 1.35 + 1.2 * v1],
        );
      }
      if (showSum) pts.push([0, 0, 2.55]);
      return pts;
    },
    {
      colorAt: (idx) => (idx < 2 ? COSMOS.blue : idx === 5 ? COSMOS.emerald : COSMOS.gold),
      radius: 6,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(
    ...monolith,
    ...slabA,
    ...slabB,
    ...bottleneck,
    baseLine,
    branchIn,
    branchMid,
    branchOut,
    baseMerge,
    photons,
  );
  return view;
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
      samples: 32,
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
  { fill = '#141c33', radius = 10, glow = 6, opacity = 0.92, dash } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width: 2.2, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
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

/** Clean glowing matrix cell grid centered around (cx, cy). */
export function matrixGrid(
  values,
  cx,
  cy,
  {
    cellW = 86,
    cellH = 74,
    gap = 8,
    color = COSMOS.blue,
    highlight = null,
    highlightRow = -1,
    highlightCol = -1,
    revealCount = Infinity,
    opacity = 1,
    fontSize = 28,
    format = num,
  } = {},
) {
  const rows = values.length;
  const cols = values[0].length;
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const x0 = cx - totalW * 0.5;
  const y0 = cy - totalH * 0.5;
  const nodes = [
    rect(totalW + 24, totalH + 24, {
      fill: '#10172b',
      stroke: color,
      width: 2.2,
      radius: 12,
    })
      .at(cx, cy)
      .glow(6, color)
      .opacity(opacity * 0.94),
  ];

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const idx = r * cols + col;
      const x = x0 + col * (cellW + gap) + cellW * 0.5;
      const y = y0 + r * (cellH + gap) + cellH * 0.5;
      const isActive =
        (highlight && highlight[0] === r && highlight[1] === col) ||
        r === highlightRow ||
        col === highlightCol;
      const fill = isActive ? '#2d2514' : '#16203a';
      const stroke = isActive ? COSMOS.gold : color;
      nodes.push(
        rect(cellW, cellH, {
          fill,
          stroke,
          width: isActive ? 2.8 : 1.4,
          radius: 7,
        })
          .at(x, y)
          .opacity(opacity * (isActive ? 0.98 : 0.85)),
      );
      if (idx < revealCount) {
        nodes.push(
          txt(
            format(values[r][col]),
            x,
            y,
            fontSize,
            isActive ? COSMOS.gold : COSMOS.ink,
            'mono',
          ).opacity(opacity),
        );
      }
    }
  }
  return group(...nodes);
}

/** Format a number with typographic minus sign. */
export function fmtNum(value, decimals = 2) {
  if (Math.abs(value) < 1e-9) return '0';
  return Number(value.toFixed(decimals)).toString().replace('-', '−');
}

export {
  COSMOS,
  EXAMPLE,
  FACTORS,
  NF4_LEVELS,
  Node,
  adapterGradients,
  arrow,
  aura,
  circle,
  cinematic3d,
  doraRow,
  dot,
  forward,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  learningSteps,
  line,
  line3d,
  linear,
  linearGradient,
  matmul,
  matvec,
  metricReadout,
  morphEquation,
  nf4Block,
  num,
  orbitScene,
  parametricSurface,
  points3d,
  policyEvaluation,
  policyRequest,
  polyPath,
  projectionBudget,
  radialGradient,
  rankOneConstruction,
  rect,
  rectangularExample,
  rotatedPlane,
  rotationPolicy,
  rule,
  surface,
  trainingInventory,
  txt,
  wireframeSlab3d,
};
