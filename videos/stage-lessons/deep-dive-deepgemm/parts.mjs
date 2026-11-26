// Shared math models, invariants, color semantics, and 3D hardware cinema rigs for deep-dive-deepgemm.
import {
  Node,
  circle,
  curve3d,
  delay,
  dot,
  gridPlane3d,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  par,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
} from 'vizmatic/stage';
import {
  alignExpertRows,
  compareReturnedRows,
  compressedKeySelection,
  copyLayoutViews,
  expertProjectionFlops,
  expertWeightedReturn,
  gemmTile,
  indexerReference,
  packSegments,
  packing,
  ringSchedule,
  scaledDot,
  sparseCachePosition,
  sum,
} from '../../films/deep-dive-deepgemm/arithmetic.mjs';
import {
  counts,
  finalRuns,
  freshReference,
  freshRows,
  layerRuns,
  parallel,
  routedReturns,
  serial,
} from '../../films/deep-dive-deepgemm/fixtures.mjs';
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

export const ROLE = Object.freeze({
  a: COSMOS.blue,
  b: COSMOS.rose,
  c: COSMOS.cyan,
  scale: COSMOS.violet,
  gold: COSMOS.gold,
  good: COSMOS.emerald,
  warn: COSMOS.amber,
  bad: COSMOS.rose,
});

// Precomputed model constants from videos/films/deep-dive-deepgemm/
export const PACK_64 = packing(64);
export const PACK_128 = packing(128);
export const PACK_256 = packing(256);
export const FRESH_128 = alignExpertRows(freshRows, 128);
export const FRESH_256 = alignExpertRows(freshRows, 256);
export const SCALED_DOT = scaledDot();
export const LAYOUT_VIEWS = copyLayoutViews();
export const INDEXER_REF = indexerReference();
export const TILE_DONE = gemmTile(1);
export const SPARSE_POS = sparseCachePosition([3, 7], 4, 5);
export const ROUTED_T7 = expertWeightedReturn(routedReturns[0].values, routedReturns[0].weights);
export const ROUTED_T9 = expertWeightedReturn(routedReturns[1].values, routedReturns[1].weights);
export const RETURN_PASS = compareReturnedRows([7, 3], [7, 3]);
export const RETURN_FAIL = compareReturnedRows([7, 3], [3, 7]);
export const FINAL_CHECK_0 = compareReturnedRows(freshReference.values, finalRuns[0].returned);
export const FINAL_CHECK_1 = compareReturnedRows(freshReference.values, finalRuns[1].returned);

export const BENCH_M = 512;
export const BENCH_N = 4096;
export const BENCH_K = 4096;
export const BENCH_FLOPS = 2 * BENCH_M * BENCH_N * BENCH_K;
export const BENCH_US = 10;
export const BENCH_TFLOPS = BENCH_FLOPS / (BENCH_US * 1e-6) / 1e12;

export const FLASH_SOURCE_PER_RANK = 512;
export const FLASH_RANKS = 8;
export const FLASH_TOPK = 6;
export const FLASH_EXPERTS = 256;
export const FLASH_SOURCE_TOTAL = FLASH_SOURCE_PER_RANK * FLASH_RANKS;
export const FLASH_ASSIGNMENTS = FLASH_SOURCE_TOTAL * FLASH_TOPK;
export const FLASH_BALANCED_ROWS = FLASH_ASSIGNMENTS / FLASH_RANKS;
export const FLASH_LOCAL_EXPERTS = FLASH_EXPERTS / FLASH_RANKS;
export const FLASH_512_US = 146.5;
export const FLASH_512_FLOPS = expertProjectionFlops(FLASH_BALANCED_ROWS);
export const FLASH_512_TFLOPS = FLASH_512_FLOPS / (FLASH_512_US * 1e-6) / 1e12;

export const FLASH_1_US = 56.5;
export const FLASH_1_SPEEDUP = 1.96;
export const FLASH_1_BASE_US = FLASH_1_US * FLASH_1_SPEEDUP;
export const FLASH_1_SHARE = 1 / FLASH_1_SPEEDUP;
export const FLASH_1_REDUCTION = 1 - FLASH_1_SHARE;

export const FP32_BIG = 2 ** 24;
export const FP32_ORDER_A = Math.fround(Math.fround(Math.fround(FP32_BIG) + 1) - FP32_BIG);
export const FP32_ORDER_B = Math.fround(Math.fround(FP32_BIG - FP32_BIG) + 1);

/** Build-time mathematical invariant assertions matching model.mjs without node-only imports. */
export function verifyDeepGemmInvariants() {
  verifyInvariant(counts.join(',') === '64,192,32,128', 'four-expert counts [64,192,32,128]');
  verifyInvariant(PACK_64.padded.join(',') === '64,192,64,128', 'align 64 padded');
  verifyInvariant(PACK_64.useful === 416 && PACK_64.capacity === 448, 'align 64 totals');
  verifyInvariant(PACK_128.padded.join(',') === '128,256,128,128', 'align 128 padded');
  verifyInvariant(PACK_128.useful === 416 && PACK_128.capacity === 640, 'align 128 totals');
  verifyInvariant(PACK_256.padded.join(',') === '256,256,256,256', 'align 256 padded');
  verifyInvariant(PACK_256.capacity === 1024, 'align 256 capacity 1024');
  verifyInvariant(PACK_128.usefulFlops === 20937965568, '416 useful FLOPs');
  verifyInvariant(PACK_128.paddedFlops === 32212254720, '640 padded FLOPs');
  verifyInvariant(expertProjectionFlops(640) === 6 * 640 * 4096 * 2048, '6MHI identity');

  const seg0 = packSegments(counts, counts);
  const seg128 = packSegments(counts, PACK_128.padded);
  const seg256 = packSegments(counts, PACK_256.padded);
  verifyInvariant(seg0[2].start === 256, 'unaligned token 7 at 256');
  verifyInvariant(seg128[2].start === 384, '128-aligned token 7 at 384');
  verifyInvariant(seg256[2].start === 512, '256-aligned token 7 at 512');

  verifyInvariant(FRESH_128.capacities.join(',') === '128,384,0', 'fresh align 128');
  verifyInvariant(FRESH_128.useful === 353 && FRESH_128.capacity === 512, 'fresh 128 sum');
  verifyInvariant(FRESH_128.padding === 159, 'fresh 128 padding 159');
  verifyApprox(FRESH_128.paddingShare * 100, 31.0546875, 1e-6, 'fresh 128 padding share');
  verifyApprox(FRESH_128.overhead * 100, 45.0424929, 1e-4, 'fresh 128 overhead');
  verifyInvariant(FRESH_256.capacities.join(',') === '256,512,0', 'fresh align 256');
  verifyInvariant(FRESH_256.capacity === 768 && FRESH_256.padding === 415, 'fresh 256 sum');

  verifyInvariant(
    TILE_DONE.result[0][0] === 11 &&
      TILE_DONE.result[0][1] === -1 &&
      TILE_DONE.result[1][0] === -4 &&
      TILE_DONE.result[1][1] === 1,
    '2x2 NT tile [[11,-1],[-4,1]]',
  );
  verifyApprox(BENCH_FLOPS / 1e9, 17.179869184, 1e-6, '512x4096x4096 FLOPs');
  verifyApprox(BENCH_TFLOPS, 1717.9869184, 1e-4, '10 us TFLOP/s');

  verifyApprox(SCALED_DOT.result, 6.5, 1e-12, 'scaled dot = 6.5');
  verifyApprox(SCALED_DOT.explicit, 6.5, 1e-12, 'dequantized dot = 6.5');
  verifyInvariant(sum(SCALED_DOT.raw) === 9, 'unscaled raw dot = 9');
  verifyInvariant(
    LAYOUT_VIEWS.base.accepted && !LAYOUT_VIEWS.transpose.accepted,
    'TMA layout views',
  );

  verifyApprox(INDEXER_REF.score, 0.4, 1e-12, 'indexer score = 0.4');
  const sel = compressedKeySelection([0.2, 0.9, 99], 40, 42, 1);
  verifyInvariant(sel.length === 1 && sel[0].token === 41, 'compressed indexer token 41');
  verifyInvariant(compressedKeySelection([0.2, 0.9, 99], 40, 40, 1).length === 0, 'empty span []');
  verifyInvariant(
    SPARSE_POS.blockIndex === 1 && SPARSE_POS.block === 7 && SPARSE_POS.token === 29,
    'sparse col 5 -> block 7 -> token 29',
  );

  verifyInvariant(Math.max(...serial.map((e) => e.end)) === 8, 'serial end = 8');
  verifyInvariant(Math.max(...parallel.map((e) => e.end)) === 6, 'parallel end = 6');
  verifyInvariant(ringSchedule(1).length === 6 && ringSchedule(2).length === 6, 'ring schedules');

  verifyInvariant(ROUTED_T7.total === 7 && ROUTED_T9.total === 3, 'routed returns [7, 3]');
  verifyInvariant(RETURN_PASS.pass && RETURN_PASS.total === 10, 'return pass sum 10');
  verifyInvariant(!RETURN_FAIL.pass && RETURN_FAIL.total === 10, 'return fail sum 10');

  verifyInvariant(
    layerRuns[0].prep + layerRuns[0].kernel === 120 &&
      layerRuns[1].prep + layerRuns[1].kernel === 130,
    'layer runs 120 vs 130 us',
  );
  verifyInvariant(
    FINAL_CHECK_0.pass &&
      !FINAL_CHECK_1.pass &&
      FINAL_CHECK_0.total === 14 &&
      FINAL_CHECK_1.total === 14,
    'final runs check [true, false], sum 14',
  );

  verifyInvariant(
    FLASH_SOURCE_TOTAL === 4096 &&
      FLASH_ASSIGNMENTS === 24576 &&
      FLASH_BALANCED_ROWS === 3072 &&
      FLASH_LOCAL_EXPERTS === 32,
    'EP8 Flash denominators',
  );
  verifyApprox(FLASH_512_TFLOPS, 1055.28, 0.5, 'Flash 512 TFLOP/s ~1055');
  verifyApprox(FLASH_1_SHARE * 100, 51.02, 0.1, '1/1.96 ~ 51%');
  verifyInvariant(FP32_ORDER_A === 0 && FP32_ORDER_B === 1, 'FP32 non-associativity 0 vs 1');
}

export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 1.2, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.2, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function remainAfterDuration(c, cueId, maxDur = 0.5, endMargin = 0.45) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.18, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

export function runPhase(s, c, phaseVal, target = 14, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0d1528', radius = 10, glow = 6, opacity = 0.92, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

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

export function solidBox3d(
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  color,
  { opacity = 0.84, edgeColor, edgeWidth = 1.6 } = {},
) {
  const opts = { resolution: [2, 2], color, opacity };
  const ec = edgeColor ?? color;
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    { color: ec, width: edgeWidth, glow: 5, onTop: false },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

export function bezier3d(a, b, lift, color, width = 2.8) {
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
      samples: 26,
      opacity: 0.9,
      onTop: true,
    }),
  };
}

/**
 * 3D Rig 1: Orbiting Hopper/Blackwell FP8 WGMMA / tcgen05 systolic tile cube
 * (1x128 activation slice x 128x128 weight slab + violet block scales + glowing FP32 promotion core).
 */
export function buildFp8WgmmaCube3d(
  kCursor,
  promoVal,
  phaseVal,
  { x = 440, y = 20, unit = 96 } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.03,
    distance: 16.2,
    unit,
    focus: [0, 0, 0.7],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  // Activation A slab (1x128 FP8 K-groups)
  const aSlabs = [];
  for (let g = 0; g < 3; g++) {
    aSlabs.push(
      ...solidBox3d(-2.9 + g * 0.72, -0.8, 0.14, 0.6, 1.5, 0.52, '#1d4685', {
        opacity: 0.86,
        edgeColor: ROLE.a,
        edgeWidth: 1.8,
      }),
    );
  }

  // Weight B slab (128x128 FP8/FP4 block)
  const bSlabs = [];
  for (let g = 0; g < 3; g++) {
    bSlabs.push(
      ...solidBox3d(0.35, -2.65 + g * 0.72, 0.14, 1.75, 0.6, 0.52, '#6d1b39', {
        opacity: 0.86,
        edgeColor: ROLE.b,
        edgeWidth: 1.8,
      }),
    );
  }

  // Violet scale factor cube (FP32 / UE8M0)
  const sfCube = solidBox3d(-2.5, -2.4, 0.2, 1.1, 1.1, 0.75, '#46267d', {
    opacity: 0.88,
    edgeColor: ROLE.scale,
    edgeWidth: 2.0,
  });

  // Cyan Tensor Core / TMEM accumulator prism
  const accCore = solidBox3d(0.45, -0.2, 0.22, 1.55, 1.55, 1.05, '#0f5066', {
    opacity: 0.9,
    edgeColor: ROLE.c,
    edgeWidth: 2.2,
  });

  // Two-level FP32 promotion upper halo cage (rises when promoVal -> 1)
  const fp32Cage = wireframeSlab3d(
    () => [1.22, 0.57, 1.35 + promoVal.value * 0.55],
    0.85,
    0.85,
    0.42,
    { color: ROLE.good, width: 2.6, glow: 10 },
  );

  // Active K-group sweep cage on A and B
  const cageA = wireframeSlab3d(
    () => {
      const k = Math.max(0, Math.min(2, kCursor.value));
      return [-2.6 + k * 0.72, -0.05, 0.42];
    },
    0.34,
    0.84,
    0.36,
    { color: ROLE.gold, width: 2.8, glow: 9 },
  );
  const cageB = wireframeSlab3d(
    () => {
      const k = Math.max(0, Math.min(2, kCursor.value));
      return [1.22, -2.35 + k * 0.72, 0.42];
    },
    0.94,
    0.34,
    0.36,
    { color: ROLE.gold, width: 2.8, glow: 9 },
  );

  const arcA = bezier3d([-0.8, 0.0, 0.65], [0.85, 0.55, 1.3], 1.05, ROLE.a, 2.8);
  const arcB = bezier3d([1.22, -0.65, 0.65], [1.22, 0.45, 1.3], 1.0, ROLE.b, 2.8);
  const arcS = bezier3d([-1.95, -1.85, 0.95], [1.1, 0.55, 1.65], 1.15, ROLE.scale, 2.6);

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      return [arcA.evalAt(u1), arcA.evalAt(u2), arcB.evalAt(u1), arcB.evalAt(u2), arcS.evalAt(u1)];
    },
    { size: 8, color: ROLE.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...aSlabs,
    ...bSlabs,
    ...sfCube,
    ...accCore,
    ...fp32Cage,
    ...cageA,
    ...cageB,
    arcA.node,
    arcB.node,
    arcS.node,
    photons,
  );
  return { view };
}

/**
 * 3D Rig 2: SM100 TMA -> Shared Memory -> TMEM (scales + acc) -> tcgen05 -> Epilogue tower.
 */
export function buildTmaTmemPipeline3d(stageVal, phaseVal, { x = 445, y = 20, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.04,
    distance: 16.6,
    unit,
    focus: [0, 0, 0.85],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.6, 3.6],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.9,
    color: '#223152',
    opacity: 0.34,
  });

  // Global HBM slab (left)
  const hbm = solidBox3d(-3.2, -1.2, 0.15, 1.1, 2.4, 0.7, '#1a3869', {
    opacity: 0.84,
    edgeColor: ROLE.a,
    edgeWidth: 1.9,
  });
  // Shared memory TMA staging ring (center-left)
  const smem = solidBox3d(-1.2, -1.3, 0.3, 1.25, 2.6, 0.95, '#2b1e58', {
    opacity: 0.86,
    edgeColor: ROLE.scale,
    edgeWidth: 2.0,
  });
  // TMEM dedicated scale + accumulator monolith (center-right)
  const tmem = solidBox3d(0.75, -1.2, 0.35, 1.25, 2.4, 1.35, '#0e4c63', {
    opacity: 0.9,
    edgeColor: ROLE.c,
    edgeWidth: 2.2,
  });
  // Epilogue output slab (far right)
  const epi = solidBox3d(2.45, -1.0, 0.25, 0.85, 2.0, 0.9, '#124a38', {
    opacity: 0.86,
    edgeColor: ROLE.good,
    edgeWidth: 2.0,
  });

  // Active stage wireframe spotlight sweeping across the 4 hardware tiers
  const stageX = [-2.65, -0.58, 1.38, 2.88];
  const activeCage = wireframeSlab3d(
    () => {
      const idx = Math.max(0, Math.min(3, stageVal.value));
      const i0 = Math.floor(idx);
      const i1 = Math.min(3, i0 + 1);
      const frac = idx - i0;
      const cx = stageX[i0] + (stageX[i1] - stageX[i0]) * frac;
      return [cx, 0, 1.05];
    },
    0.72,
    1.36,
    0.85,
    { color: ROLE.gold, width: 2.8, glow: 10 },
  );

  const arcTma = bezier3d([-2.1, 0.4, 0.85], [-1.15, 0.4, 1.25], 0.9, ROLE.a, 2.8);
  const arcScale = bezier3d([0.05, -0.5, 1.2], [0.8, -0.5, 1.65], 0.95, ROLE.scale, 3.0);
  const arcEpi = bezier3d([2.0, 0.2, 1.45], [2.5, 0.2, 1.15], 0.85, ROLE.good, 2.8);

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const st = stageVal.value;
      const u = (((p * 0.6) % 1) + 1) % 1;
      const u2 = (u + 0.5) % 1;
      const pts = [arcTma.evalAt(u), arcTma.evalAt(u2)];
      if (st >= 0.8) pts.push(arcScale.evalAt(u), arcScale.evalAt(u2));
      if (st >= 2.2) pts.push(arcEpi.evalAt(u), arcEpi.evalAt(u2));
      return pts;
    },
    { size: 8, color: ROLE.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...hbm,
    ...smem,
    ...tmem,
    ...epi,
    ...activeCage,
    arcTma.node,
    arcScale.node,
    arcEpi.node,
    photons,
  );
  return { view };
}

/**
 * 3D Rig 3: Orbiting 3D MoE Grouped GEMM Row-Packing Slabs (useful cyan prisms + amber padding tails
 * + glowing gold Token-7 beacon shifting along the M axis).
 */
export function buildMoePackSlabs3d(
  usefulRows,
  paddedFn,
  pinRowFn,
  maxRows,
  phaseVal,
  { x = 445, y = 20, unit = 94 } = {},
) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.05,
    distance: 16.4,
    unit,
    focus: [0, 0, 0.65],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.5, 3.5],
    y: [-2.6, 2.6],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  const toX = (row) => -3.1 + (row / maxRows) * 6.2;
  const n = usefulRows.length;
  const dy = n === 3 ? 1.25 : 0.98;
  const yStart = -((n - 1) * dy) * 0.5;

  // Dynamic 3D bars for each expert: solid cyan line bundle for useful, amber wireframe for padding
  const segLines = [];
  for (let i = 0; i < n; i++) {
    const yc = yStart + i * dy;
    // Useful segment glowing beam + top rail
    segLines.push(
      line3d(
        () => {
          const pads = paddedFn();
          let start = 0;
          for (let j = 0; j < i; j++) start += pads[j];
          return [toX(start), yc, 0.55];
        },
        () => {
          const pads = paddedFn();
          let start = 0;
          for (let j = 0; j < i; j++) start += pads[j];
          return [toX(start + usefulRows[i]), yc, 0.55];
        },
        { color: ROLE.c, width: 11, glow: 8, blend: 'screen', onTop: true },
      ),
      // Padding tail in amber wireframe
      line3d(
        () => {
          const pads = paddedFn();
          let start = 0;
          for (let j = 0; j < i; j++) start += pads[j];
          return [toX(start + usefulRows[i]), yc, 0.55];
        },
        () => {
          const pads = paddedFn();
          let start = 0;
          for (let j = 0; j < i; j++) start += pads[j];
          return [toX(start + pads[i]), yc, 0.55];
        },
        { color: ROLE.warn, width: 6, glow: 6, opacity: 0.85, onTop: true },
      ),
      // Base rail on floor
      line3d([-3.1, yc, 0.05], [3.1, yc, 0.05], { color: '#2b3b5f', width: 1.8, opacity: 0.6 }),
    );
  }

  // Glowing gold vertical beacon at Token 7 (or highlighted edge)
  const beacon = line3d(
    () => [toX(pinRowFn()), -2.1, 0.05],
    () => [toX(pinRowFn()), -2.1, 2.35],
    { color: ROLE.gold, width: 5.0, glow: 12, blend: 'screen', onTop: true },
  );
  const beaconCross = line3d(
    () => [toX(pinRowFn()), -2.1, 0.6],
    () => [toX(pinRowFn()), 2.1, 0.6],
    { color: ROLE.gold, width: 2.4, glow: 8, opacity: 0.75, onTop: true },
  );

  // Orbiting weight projection slab behind M axis
  const weightWall = solidBox3d(-3.1, 2.05, 0.15, 6.2, 0.42, 1.35, '#591834', {
    opacity: 0.72,
    edgeColor: ROLE.b,
    edgeWidth: 1.8,
  });

  // Flowing photons along the concatenated M rail
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const pads = paddedFn();
      const total = Math.max(1, sum(pads));
      const out = [];
      for (let k = 0; k < 6; k++) {
        const u = (((p * 0.42 + k / 6) % 1) + 1) % 1;
        out.push([toX(u * total), yStart + (k % n) * dy, 0.78 + Math.sin(u * Math.PI) * 0.35]);
      }
      return out;
    },
    { size: 7.5, color: ROLE.gold, glow: 11, blend: 'screen', onTop: true },
  );

  view.add(floor, ...weightWall, ...segLines, beacon, beaconCross, photons);
  return { view };
}

/**
 * 3D Rig 4: Orbiting 3D Persistent Mega MoE Symmetric Ring Buffer & NVLink/Compute Dual-Track Rig.
 */
export function buildMegaMoeRing3d(overlapVal, phaseVal, { x = 445, y = 20, unit = 96 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.4, 3.4],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  const radius = 2.35;
  const ringBase = curve3d(
    (t) => [Math.cos(t * Math.PI * 2) * radius, Math.sin(t * Math.PI * 2) * radius, 0.08],
    0,
    1,
    { color: ROLE.c, width: 2.4, opacity: 0.7, samples: 48 },
  );
  const nvlinkRing = curve3d(
    (t) => [
      Math.cos(t * Math.PI * 2) * (radius * 0.86),
      Math.sin(t * Math.PI * 2) * (radius * 0.86),
      1.9,
    ],
    0,
    1,
    { color: ROLE.scale, width: 2.8, glow: 8, blend: 'screen', samples: 48 },
  );

  // 8 EP rank pillars around the ring
  const rankPillars = [];
  for (let r = 0; r < 8; r++) {
    const ang = (r / 8) * Math.PI * 2;
    const rx = Math.cos(ang) * radius;
    const ry = Math.sin(ang) * radius;
    const isSlotA = r % 2 === 0;
    rankPillars.push(
      line3d([rx, ry, 0.08], () => [rx, ry, isSlotA ? 1.6 : 0.65 + overlapVal.value * 0.95], {
        color: isSlotA ? ROLE.a : ROLE.good,
        width: 5.5,
        glow: 9,
        blend: 'screen',
        onTop: true,
      }),
    );
  }

  // Central persistent Tensor Core compute hub
  const hub = solidBox3d(-0.7, -0.7, 0.15, 1.4, 1.4, 1.2, '#104961', {
    opacity: 0.9,
    edgeColor: ROLE.c,
    edgeWidth: 2.2,
  });

  // Orbiting chunk A (blue) and chunk B (emerald) NVLink + compute packets
  const packets = points3d(
    () => {
      const p = phaseVal.value;
      const ov = overlapVal.value;
      const out = [];
      for (let i = 0; i < 6; i++) {
        const a = p * 0.65 + (i / 6) * Math.PI * 2;
        out.push([Math.cos(a) * radius * 0.86, Math.sin(a) * radius * 0.86, 1.9]);
      }
      if (ov > 0.2) {
        for (let i = 0; i < 4; i++) {
          const b = -p * 0.8 + (i / 4) * Math.PI * 2;
          out.push([Math.cos(b) * radius * 0.52, Math.sin(b) * radius * 0.52, 0.95]);
        }
      }
      return out;
    },
    { size: 8.5, color: ROLE.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ringBase, nvlinkRing, ...rankPillars, ...hub, packets);
  return { view };
}

/**
 * 3D Rig 5: Orbiting 3D JIT Runtime-Specialized Template Lowering & Atomic Cache Stack.
 */
export function buildJitLowering3d(stageVal, phaseVal, { x = 445, y = 20, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.02,
    distance: 16.2,
    unit,
    focus: [0, 0, 1.0],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-3.2, 3.2],
    z: 0,
    step: 0.8,
    color: '#223152',
    opacity: 0.34,
  });

  // 3 vertical tiers: Source/Signature (top) -> Digest/Compiler Prism (mid) -> Atomic CUBIN Cache (base)
  const cacheSlab = solidBox3d(-1.8, -1.4, 0.12, 3.6, 2.8, 0.5, '#11443a', {
    opacity: 0.86,
    edgeColor: ROLE.good,
    edgeWidth: 2.0,
  });
  const compilerSlab = solidBox3d(-1.35, -1.05, 1.05, 2.7, 2.1, 0.52, '#3d2072', {
    opacity: 0.88,
    edgeColor: ROLE.scale,
    edgeWidth: 2.2,
  });
  const sigSlab = solidBox3d(-1.6, -1.2, 2.0, 3.2, 2.4, 0.45, '#1b3e78', {
    opacity: 0.84,
    edgeColor: ROLE.a,
    edgeWidth: 1.9,
  });

  // Active lowering cage dropping from z=2.2 -> 1.3 -> 0.37
  const activeCage = wireframeSlab3d(
    () => {
      const st = Math.max(0, Math.min(2, stageVal.value));
      const z = 2.22 - st * 0.92;
      return [0, 0, z];
    },
    1.85,
    1.45,
    0.34,
    { color: ROLE.gold, width: 2.8, glow: 10 },
  );

  // Vertical lowering beams + photons
  const beams = [
    line3d([-1.1, -0.8, 0.62], [-1.1, -0.8, 2.0], { color: ROLE.c, width: 2.4, opacity: 0.7 }),
    line3d([1.1, -0.8, 0.62], [1.1, -0.8, 2.0], { color: ROLE.c, width: 2.4, opacity: 0.7 }),
    line3d([-1.1, 0.8, 0.62], [-1.1, 0.8, 2.0], { color: ROLE.scale, width: 2.4, opacity: 0.7 }),
    line3d([1.1, 0.8, 0.62], [1.1, 0.8, 2.0], { color: ROLE.scale, width: 2.4, opacity: 0.7 }),
  ];

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      return [
        [-1.1, -0.8, 2.0 - u1 * 1.4],
        [1.1, 0.8, 2.0 - u1 * 1.4],
        [1.1, -0.8, 2.0 - u2 * 1.4],
        [-1.1, 0.8, 2.0 - u2 * 1.4],
      ];
    },
    { size: 8, color: ROLE.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...cacheSlab, ...compilerSlab, ...sigSlab, ...activeCage, ...beams, photons);
  return { view };
}

/**
 * 3D Rig 6: Orbiting 3D Lightning Indexer MQA Scoring & Sparse Block-Table Matrix.
 */
export function buildIndexerTower3d(maskVal, phaseVal, { x = 445, y = 20, unit = 96 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.3, 3.3],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.82,
    color: '#223152',
    opacity: 0.34,
  });

  // Valid compressed columns 0 and 1 (cyan & emerald) + unwritten sentinel slot 2 (rose, collapses when masked)
  const col0 = solidBox3d(-2.2, -0.6, 0.12, 0.9, 1.2, 0.65, '#134e63', {
    opacity: 0.88,
    edgeColor: ROLE.c,
    edgeWidth: 2.0,
  });
  const col1 = solidBox3d(-0.7, -0.6, 0.12, 0.9, 1.2, 1.85, '#125943', {
    opacity: 0.92,
    edgeColor: ROLE.good,
    edgeWidth: 2.2,
  });
  // Sentinel pillar dynamically shrinks when maskVal -> 1
  const sentinelPillar = line3d(
    [1.35, 0, 0.12],
    () => [1.35, 0, 2.75 * (1 - maskVal.value) + 0.18 * maskVal.value],
    { color: ROLE.bad, width: 12, glow: 10, blend: 'screen', onTop: true },
  );

  // Valid span wireframe gate around columns 0..1
  const validGate = wireframeSlab3d([-1.0, 0, 1.08], 1.38, 0.82, 1.02, {
    color: ROLE.gold,
    width: 2.6,
    glow: 9,
  });

  // Arc mapping winner column 1 to absolute cache token 41 / block 7
  const mapArc = bezier3d([-0.25, 0, 2.0], [2.4, 1.6, 1.2], 1.1, ROLE.good, 3.0);
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      return [mapArc.evalAt(u1), mapArc.evalAt(u2)];
    },
    { size: 8.5, color: ROLE.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...col0, ...col1, sentinelPillar, ...validGate, mapArc.node, photons);
  return { view };
}

export {
  COSMOS,
  Node,
  alignExpertRows,
  aura,
  circle,
  cinematic3d,
  compareReturnedRows,
  compressedKeySelection,
  copyLayoutViews,
  counts,
  delay,
  dot,
  expertProjectionFlops,
  expertWeightedReturn,
  finalRuns,
  freshReference,
  freshRows,
  gemmTile,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  indexerReference,
  layerRuns,
  line,
  line3d,
  linear,
  linearGradient,
  markDecoration,
  metricReadout,
  orbitScene,
  packSegments,
  packing,
  par,
  parallel,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  ringSchedule,
  routedReturns,
  rule,
  scaledDot,
  serial,
  sparseCachePosition,
  sum,
  txt,
  wireframeSlab3d,
};
