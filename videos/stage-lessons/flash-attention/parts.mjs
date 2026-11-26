// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for flash-attention.
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
import { SCORES, VALUES } from '../../films/flash-attention/fixtures.mjs';
import {
  absoluteCausalPairs,
  attentionBackwardRow,
  attentionInventory,
  cachedBlend,
  causalTileClass,
  finiteAccumulatorExample,
  merge,
  rescaledFirstTile,
  summarize,
  tileInventory,
  tilePipelinePrefix,
  tileStream,
  transferPrediction,
} from '../../films/flash-attention/model.mjs';
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
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export const PROMPT_3 = Object.freeze(['fix', 'this', 'test']);
export const PROMPT_6 = Object.freeze(['fix', 'this', 'test', 'and', 'run', 'it']);

export const TILE_A = summarize(SCORES.slice(0, 2), VALUES.slice(0, 2));
export const TILE_B = summarize(SCORES.slice(2), VALUES.slice(2));
export const DENSE_ALL = summarize(SCORES, VALUES);
export const MERGED_ALL = merge(TILE_A, TILE_B);
export const DENSE_OUTPUT = DENSE_ALL.u / DENSE_ALL.l;
export const TILE_A_OUTPUT = TILE_A.u / TILE_A.l;
export const DENSE_PROBS = SCORES.map((s) => Math.exp(s - DENSE_ALL.m) / DENSE_ALL.l);
export const DENSE_TERMS = DENSE_PROBS.map((p, i) => p * VALUES[i]);
export const BROKEN_MERGE_OUTPUT = (TILE_A.u + TILE_B.u) / MERGED_ALL.l;
export const EQUAL_VOTE_OUTPUT = (TILE_A_OUTPUT + VALUES[2]) / 2;
export const LSE_ROW = DENSE_ALL.m + Math.log(DENSE_ALL.l);

export const LEDGER_CONFIG = Object.freeze({ batch: 8, heads: 32, seq: 8192, bytes: 2 });
export const LEDGER_INV = attentionInventory(
  LEDGER_CONFIG.batch,
  LEDGER_CONFIG.heads,
  LEDGER_CONFIG.seq,
  LEDGER_CONFIG.bytes,
);
export const SCORE_GIB = LEDGER_INV.score / 2 ** 30;
export const SCORE_DEC_GB = LEDGER_INV.score / 1e9;
export const FOUR_PASS_GIB = LEDGER_INV.fourPasses / 2 ** 30;
export const LSE_MIB = LEDGER_INV.lse / 2 ** 20;
export const STATE_RATIO = LEDGER_INV.score / LEDGER_INV.lse;

export const H100_SPEC = Object.freeze({
  smemTotalKib: 228,
  smemBlockMaxKib: 227,
  regCount: 65536,
  regFileKib: 256,
  sparseTflops: 1979,
  denseTflops: 989.5,
  hbmTbs: 3.35,
  ridgeAi: 989.5 / 3.35,
});

export const TILE_128 = tileInventory(128, 128, 64);
export const BWD_ROW = attentionBackwardRow(SCORES, VALUES, 1);
export const BWD_RAISED = attentionBackwardRow([1, 3, 3], VALUES, 1);
export const TRANSFER_EX = transferPrediction(4);
export const FINITE_OVF = finiteAccumulatorExample(1e308);

export const ALIGN_VALUES = Object.freeze([10, 20, 40, 80]);
export const ALIGN_UPPER = cachedBlend(3, ALIGN_VALUES, 4, 'upper-left');
export const ALIGN_ABS = cachedBlend(3, ALIGN_VALUES, 4, 'absolute');

export const FRESH_VALUES = Object.freeze([2, 4, 6, 8, 10, 12, 1000, 1000]);
export const FRESH_UPPER = cachedBlend(5, FRESH_VALUES, 6, 'upper-left');
export const FRESH_ALL = cachedBlend(5, FRESH_VALUES, 6, 'all');
export const FRESH_ABS_5 = cachedBlend(5, FRESH_VALUES, 6, 'absolute');
export const FRESH_ABS_4 = cachedBlend(4, FRESH_VALUES, 6, 'absolute');

export const PREFILL_N = 8192;
export const PREFILL_PAIRS = (PREFILL_N * (PREFILL_N + 1)) / 2;
export const PREFILL_SQUARE = PREFILL_N * PREFILL_N;
export const PREFILL_DECODE_RATIO = PREFILL_PAIRS / PREFILL_N;

/** Build-time mathematical verification of every core identity in the FlashAttention lesson. */
export function verifyFlashInvariants() {
  verifyInvariant(MERGED_ALL.m === DENSE_ALL.m, 'merged max must equal dense max');
  verifyApprox(MERGED_ALL.l, DENSE_ALL.l, 1e-12, 'merged denominator');
  verifyApprox(MERGED_ALL.u, DENSE_ALL.u, 1e-12, 'merged weighted value');
  verifyApprox(MERGED_ALL.u / MERGED_ALL.l, DENSE_OUTPUT, 1e-12, 'merged output');
  verifyApprox(DENSE_OUTPUT, 32.405, 1e-3, 'dense output ~32.405');
  verifyApprox(TILE_A_OUTPUT, 17.3106, 1e-3, 'tile A mean ~17.31');
  verifyApprox(BROKEN_MERGE_OUTPUT, 42.361, 1e-2, 'broken numerator merge ~42.36');
  verifyApprox(EQUAL_VOTE_OUTPUT, 28.655, 1e-2, 'equal vote mean ~28.66');
  verifyApprox(
    rescaledFirstTile(1).u / rescaledFirstTile(1).l,
    TILE_A_OUTPUT,
    1e-12,
    'ratio invariant',
  );
  verifyApprox(tileStream(1).output, DENSE_OUTPUT, 1e-12, 'tileStream final output');

  verifyInvariant(SCORE_GIB === 32, 'score matrix must be 32 GiB');
  verifyApprox(SCORE_DEC_GB, 34.3597, 1e-3, 'score matrix decimal GB');
  verifyInvariant(FOUR_PASS_GIB === 128, 'four-pass intermediate traffic must be 128 GiB');
  verifyInvariant(LSE_MIB === 8, 'FP32 LSE strip must be 8 MiB');
  verifyInvariant(STATE_RATIO === 4096, 'probability slab to LSE ratio must be 4096');
  verifyInvariant(TILE_128.total === 144 * 1024, '128x128 d=64 tile subtotal must be 144 KiB');
  verifyApprox(H100_SPEC.ridgeAi, 295.373, 0.05, 'H100 ridge AI');

  verifyApprox(BWD_ROW.ds[1], -3.038, 1e-2, 'score slope for key 1 (~ -3.04)');
  verifyApprox(
    BWD_ROW.ds.reduce((a, b) => a + b, 0),
    0,
    1e-12,
    'score derivatives sum to zero',
  );
  verifyInvariant(BWD_RAISED.output < BWD_ROW.output, 'raising score for 20 lowers blend');

  verifyInvariant(causalTileClass(128, 255, 128, 191) === 'boundary', 'unequal tile boundary');
  verifyInvariant(FINITE_OVF.accepted === false, '1e308 + 1e308 overflows FP64');
  verifyInvariant(tilePipelinePrefix(8).slots.A.tile === 2, 'two-slot pipeline step 8');

  verifyInvariant(PREFILL_PAIRS === 33558528, '8192 causal prefill pairs');
  verifyApprox(PREFILL_DECODE_RATIO, 4096.5, 1e-9, 'prefill to decode pair ratio');

  verifyInvariant(ALIGN_UPPER.output === 10, 'upper-left alignment returns 10');
  verifyApprox(ALIGN_ABS.output, 37.5, 1e-12, 'absolute alignment returns 37.5');
  verifyApprox(TRANSFER_EX.dense, 8.456, 1e-3, 'transfer replay output ~8.456');
  verifyInvariant(FRESH_UPPER.output === 2, 'fresh cache upper-left returns 2');
  verifyApprox(FRESH_ALL.output, 255.25, 1e-12, 'fresh cache open returns 255.25');
  verifyInvariant(FRESH_ABS_5.output === 7, 'fresh cache pos 5 returns 7');
  verifyInvariant(FRESH_ABS_4.output === 6, 'fresh cache pos 4 returns 6');
  verifyInvariant(
    absoluteCausalPairs([4, 5], [0, 1, 2, 3, 4, 5, 6, 7], 6)
      .flat()
      .filter((v) => v === 'allowed').length === 11,
    'absoluteCausalPairs allowed count',
  );
}

/** Smooth deterministic 3D attention-score terrain height in [0, 2.3] for u, v in [0, 1]. */
function rawAttentionHeight(u, v) {
  const diag = Math.exp(-Math.pow((u - v) / 0.16, 2)) * 1.48;
  const sink = Math.exp(-Math.pow(u / 0.11, 2)) * 0.92;
  const peakA = Math.exp(-(Math.pow((u - 0.68) / 0.12, 2) + Math.pow((v - 0.34) / 0.12, 2))) * 1.05;
  const peakB = Math.exp(-(Math.pow((u - 0.28) / 0.14, 2) + Math.pow((v - 0.72) / 0.14, 2))) * 0.82;
  const ripple = 0.16 * Math.sin(u * 13.0) * Math.cos(v * 11.0);
  return Math.max(0.08, 0.24 + diag + sink + peakA + peakB + ripple);
}

const TERRAIN_RES = 56;
const TERRAIN_LUT = new Float32Array(TERRAIN_RES * TERRAIN_RES);
for (let j = 0; j < TERRAIN_RES; j++) {
  const v = j / (TERRAIN_RES - 1);
  for (let i = 0; i < TERRAIN_RES; i++) {
    const u = i / (TERRAIN_RES - 1);
    TERRAIN_LUT[j * TERRAIN_RES + i] = rawAttentionHeight(u, v);
  }
}

export function sampleAttentionTerrain(wx, wy, half = 3.0) {
  const u = Math.max(0, Math.min(1, (wx + half) / (2 * half))) * (TERRAIN_RES - 1);
  const v = Math.max(0, Math.min(1, (wy + half) / (2 * half))) * (TERRAIN_RES - 1);
  const i0 = Math.min(TERRAIN_RES - 2, Math.floor(u));
  const j0 = Math.min(TERRAIN_RES - 2, Math.floor(v));
  const fu = u - i0;
  const fv = v - j0;
  const h00 = TERRAIN_LUT[j0 * TERRAIN_RES + i0];
  const h10 = TERRAIN_LUT[j0 * TERRAIN_RES + i0 + 1];
  const h01 = TERRAIN_LUT[(j0 + 1) * TERRAIN_RES + i0];
  const h11 = TERRAIN_LUT[(j0 + 1) * TERRAIN_RES + i0 + 1];
  return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv;
}

/**
 * Reusable orbiting 3D attention-score terrain with glowing wireframe SRAM tile cage
 * and streaming Q (gold) / K,V (cyan) photon conduits.
 */
export function buildAttentionTerrain3d(
  tileCursor,
  { x = 310, y = 20, half = 3.0, grid = 4 } = {},
) {
  const tileW = (2 * half) / grid;
  const bounds = () => {
    const idx = Math.max(0, Math.min(grid * grid - 1, Math.floor(tileCursor.value)));
    const row = Math.floor(idx / grid);
    const col = idx % grid;
    const x0 = -half + col * tileW;
    const y0 = -half + row * tileW;
    return {
      row,
      col,
      x0,
      x1: x0 + tileW,
      y0,
      y1: y0 + tileW,
      cx: x0 + tileW * 0.5,
      cy: y0 + tileW * 0.5,
    };
  };

  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 15.6,
    unit: 108,
    focus: [0, 0, 0.72],
  }).at(x, y);

  const terrain = surface((wx, wy) => sampleAttentionTerrain(wx, wy, half), {
    x: [-half, half],
    y: [-half, half],
    resolution: [42, 42],
    colors: ['#070b1a', '#1b275c', '#4c2f8a', '#1f7ec2', '#5ce1e6', '#ffd166'],
    mesh: '#7ce8ff',
    meshOpacity: 0.16,
    meshWidth: 0.55,
    opacity: 0.9,
  });

  const gridLines = [];
  for (let k = 0; k <= grid; k++) {
    const pos = -half + k * tileW;
    gridLines.push(
      line3d([pos, -half, 0.05], [pos, half, 0.05], {
        color: '#4c6599',
        width: 1.4,
        opacity: 0.48,
      }),
      line3d([-half, pos, 0.05], [half, pos, 0.05], {
        color: '#4c6599',
        width: 1.4,
        opacity: 0.48,
      }),
    );
  }

  const cageCenter = () => {
    const b = bounds();
    return [b.cx, b.cy, 1.24];
  };
  const qCenter = () => {
    const b = bounds();
    return [-half - 0.78, b.cy, 0.72];
  };
  const kCenter = () => {
    const b = bounds();
    return [b.cx, -half - 0.78, 0.72];
  };
  const topCenter = () => {
    const b = bounds();
    return [b.cx, b.cy, 2.34];
  };

  const cage = wireframeSlab3d(cageCenter, tileW * 0.5, tileW * 0.5, 1.1, {
    color: COSMOS.gold,
    width: 3.4,
    glow: 9,
  });
  const qSlab = wireframeSlab3d(qCenter, 0.28, 0.56, 0.18, {
    color: COSMOS.gold,
    width: 2.6,
    glow: 7,
  });
  const kSlab = wireframeSlab3d(kCenter, 0.56, 0.28, 0.18, {
    color: COSMOS.cyan,
    width: 2.6,
    glow: 7,
  });

  const photons = points3d(
    () => {
      const b = bounds();
      const q = qCenter();
      const k = kCenter();
      const top = topCenter();
      const frac = (tileCursor.value * 2.4) % 1;
      return [
        [b.x0, b.y0, 2.34],
        [b.x1, b.y0, 2.34],
        [b.x1, b.y1, 2.34],
        [b.x0, b.y1, 2.34],
        [
          q[0] + (top[0] - q[0]) * frac,
          q[1] + (top[1] - q[1]) * frac,
          q[2] + (top[2] - q[2]) * frac,
        ],
        [
          k[0] + (top[0] - k[0]) * frac,
          k[1] + (top[1] - k[1]) * frac,
          k[2] + (top[2] - k[2]) * frac,
        ],
      ];
    },
    {
      colorAt: (idx) => (idx < 4 ? '#fff8dc' : idx === 4 ? COSMOS.gold : COSMOS.cyan),
      radius: 5.5,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(
    terrain,
    ...gridLines,
    ...qSlab,
    ...kSlab,
    ...cage,
    line3d(qCenter, topCenter, {
      color: COSMOS.gold,
      width: 3.4,
      glow: 9,
      blend: 'screen',
      onTop: true,
    }),
    line3d(kCenter, topCenter, {
      color: COSMOS.cyan,
      width: 3.4,
      glow: 9,
      blend: 'screen',
      onTop: true,
    }),
    photons,
  );
  return { view, bounds };
}

/** Shaded glowing 3D silicon tier slab (for HBM / SRAM / Tensor Core hierarchy views). */
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
      meshOpacity: 0.3,
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
    width: 2.8,
    glow: 7,
  });
  return [topFace, frontFace, rightFace, ...edges];
}

/** Shaded 3D rectangular prism for memory volumes, tiles, and paged blocks. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    {
      color: edgeColor,
      width: 2.2,
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
export function runPhase(s, c, phaseVal, target = 10, startOffset = 0.08) {
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
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.92, dash } = {},
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

export {
  COSMOS,
  Node,
  SCORES,
  VALUES,
  aura,
  circle,
  cinematic3d,
  dot,
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
  metricReadout,
  orbitScene,
  points3d,
  polyPath,
  radialGradient,
  rect,
  rule,
  surface,
  txt,
  wireframeSlab3d,
};
