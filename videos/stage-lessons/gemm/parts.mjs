// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for gemm.
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
import { bankAddress, bf16, registerDemand } from '../../films/gemm/arithmetic.mjs';
import { doubleBuffer, fragmentAccumulation } from '../../films/gemm/construction.mjs';
import { A, B, bottomEdge, rightEdge } from '../../films/gemm/fixtures.mjs';
import { cooperativeCell, partialProduct, warpRequests } from '../../films/gemm/model.mjs';
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

// Semantic color roles aligned with narration ("blue A", "pink B", "cyan C").
export const ROLE = Object.freeze({
  a: COSMOS.blue,
  b: COSMOS.rose,
  c: COSMOS.cyan,
  gold: COSMOS.gold,
  good: COSMOS.emerald,
  warn: COSMOS.amber,
  bad: COSMOS.rose,
  violet: COSMOS.violet,
});

export const FULL_C = partialProduct(0, 3);
export const PANEL_K0 = partialProduct(0, 1);
export const PANEL_K01 = partialProduct(0, 2);
export const PANEL_K2 = partialProduct(2, 3);

export const RIGHT_SAFE = cooperativeCell(rightEdge, false);
export const RIGHT_BUG = cooperativeCell(rightEdge, true);
export const BOTTOM_SAFE = cooperativeCell(bottomEdge, false);
export const BOTTOM_BUG = cooperativeCell(bottomEdge, true);

export const WARP_STRIDED = warpRequests(false);
export const WARP_COALESCED = warpRequests(true);

export const REG_1X1 = registerDemand(1, 1);
export const REG_1X4 = registerDemand(1, 4);
export const REG_8X8 = registerDemand(8, 8);
export const REG_16X16 = registerDemand(16, 16);

export const BF16_A = bf16(1.125);
export const BF16_B = bf16(1.25);
export const BF16_WIDE_SUM = Math.fround(1024 + BF16_A * BF16_B);
export const BF16_ROUNDED_SUM = bf16(BF16_WIDE_SUM);

export const CANCEL_ORIG = Math.fround(1.0001) - 1.0;
export const SHAPE_FLOPS = 72;
export const SHAPE_BYTES = 4 * (6 + 36 + 6);
export const SHAPE_AI = SHAPE_FLOPS / SHAPE_BYTES;

/** Build-time mathematical invariant assertions against videos/films/gemm/*.mjs. */
export function verifyGemmInvariants() {
  verifyInvariant(
    FULL_C[0][0] === 4 && FULL_C[0][1] === 7 && FULL_C[1][0] === 7 && FULL_C[1][1] === 13,
    'full A*B must equal [[4,7],[7,13]]',
  );
  verifyInvariant(
    PANEL_K0[1][0] === -2 && PANEL_K01[1][0] === 1 && PANEL_K2[1][0] === 6,
    'partial products along k must sum to bottom-left 7',
  );
  verifyInvariant(RIGHT_SAFE.sum === 7 && RIGHT_BUG.sum === 4, 'right-edge cooperative sum');
  verifyInvariant(BOTTOM_SAFE.sum === 9 && BOTTOM_BUG.sum === 3, 'bottom-edge cooperative sum');
  verifyInvariant(
    BOTTOM_SAFE.panels.map((p) => p.sum).join(',') === '7,5,9',
    'bottom-edge panel sums 7,5,9',
  );
  verifyInvariant(
    BOTTOM_SAFE.panels.map((p) => p.right[1][1]).join(',') === '4,-2,0',
    'bottom-edge masked thread B loads 4,-2,0',
  );
  verifyInvariant(
    WARP_STRIDED.sectors.join(',') === '16,1,16' && WARP_COALESCED.sectors.join(',') === '1,4,4',
    'warp sector counts 33 vs 9',
  );
  verifyInvariant(
    WARP_STRIDED.lanes[0].a === 0 &&
      WARP_STRIDED.lanes[1].a === 256 &&
      WARP_STRIDED.lanes[16].a === 0,
    'strided warp A byte offsets',
  );

  const lanes32 = Array.from({ length: 32 }, (_, i) => i);
  verifyInvariant(
    new Set(lanes32.map((l) => bankAddress(l, 3, 32).bank)).size === 1,
    'stride-32 collapses all 32 lanes into bank 3',
  );
  verifyInvariant(
    new Set(lanes32.map((l) => bankAddress(l, 3, 33).bank)).size === 32,
    'stride-33 padding spreads lanes across 32 banks',
  );
  verifyInvariant(bankAddress(1, 3, 33).word === 36 && bankAddress(1, 3, 33).bank === 4, 'pad L1');
  verifyInvariant([0, 1, 2, 3].map((c) => c ^ 1).join(',') === '1,0,3,2', 'row-1 XOR order');

  verifyApprox(REG_1X1.ratio, 0.25, 1e-12, '1x1 register ratio');
  verifyApprox(REG_1X4.ratio, 0.4, 1e-12, '1x4 register ratio');
  verifyApprox(REG_8X8.ratio, 2.0, 1e-12, '8x8 register ratio');
  verifyApprox(REG_16X16.ratio, 4.0, 1e-12, '16x16 shared ratio');

  verifyApprox(BF16_WIDE_SUM, 1025.40625, 1e-12, 'BF16 wide FP32 sum');
  verifyInvariant(BF16_ROUNDED_SUM === 1024, 'BF16 narrow sum rounds back to 1024');
  verifyApprox(CANCEL_ORIG, 0.00010002, 1e-7, 'FP32 cancellation reference');
  verifyApprox(SHAPE_AI, 0.375, 1e-12, 'batch=1 6x6 cold AI = 3/8');

  const frag = fragmentAccumulation(1);
  verifyInvariant(frag.output[1][0] === 1 && frag.output[1][1] === 13, 'fragmentAccumulation');
  verifyInvariant(
    doubleBuffer(1.5)
      .stages.map((st) => st.status)
      .join(',') === 'reading,loading',
    'doubleBuffer overlap',
  );
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 1.6, endMargin = 0.55) {
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

/** Clean translucent dark-glass tile cell (never used for prose bullet cards). */
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

/** Solid glowing 3D prism built from parametricSurface faces + wireframe edge lines. */
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
    {
      color: ec,
      width: edgeWidth,
      glow: 5,
      onTop: false,
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
      samples: 28,
      opacity: 0.9,
      onTop: true,
    }),
  };
}

/**
 * Orbiting 3D Tensor Core systolic GEMM rig: A slab (blue), B slab (rose), C tile (cyan),
 * plus an animated glowing gold wireframe K-slice cage sweeping along the reduction axis.
 */
export function buildSystolicGemm3d(kCursor, { x = 390, y = 20, unit = 104 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.65],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.0, 3.0],
    z: -0.02,
    step: 0.85,
    color: '#253459',
    opacity: 0.35,
  });

  // A matrix (2x3) left slab in blue
  const aCells = [];
  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 3; k++) {
      aCells.push(
        ...solidBox3d(-2.9 + k * 0.72, -0.75 + r * 0.9, 0.15, 0.58, 0.72, 0.52, '#224c8c', {
          opacity: 0.86,
          edgeColor: ROLE.a,
          edgeWidth: 1.8,
        }),
      );
    }
  }

  // B matrix (3x2) upper slab in rose
  const bCells = [];
  for (let k = 0; k < 3; k++) {
    for (let col = 0; col < 2; col++) {
      bCells.push(
        ...solidBox3d(0.45 + col * 0.92, -2.55 + k * 0.72, 0.15, 0.74, 0.58, 0.52, '#6e1d3b', {
          opacity: 0.86,
          edgeColor: ROLE.b,
          edgeWidth: 1.8,
        }),
      );
    }
  }

  // C matrix (2x2) glowing cyan accumulator tiles
  const cCells = [];
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 2; col++) {
      cCells.push(
        ...solidBox3d(0.45 + col * 0.92, -0.1 + r * 0.95, 0.25, 0.76, 0.78, 0.88, '#10546a', {
          opacity: 0.92,
          edgeColor: ROLE.c,
          edgeWidth: 2.2,
        }),
      );
    }
  }

  // Animated wireframe cage around active K column in A and K row in B
  const activeSliceA = wireframeSlab3d(
    () => {
      const k = Math.max(0, Math.min(2, kCursor.value));
      return [-2.61 + k * 0.72, 0.06, 0.44];
    },
    0.34,
    0.92,
    0.38,
    { color: COSMOS.gold, width: 2.8, glow: 9 },
  );
  const activeSliceB = wireframeSlab3d(
    () => {
      const k = Math.max(0, Math.min(2, kCursor.value));
      return [1.28, -2.26 + k * 0.72, 0.44];
    },
    0.94,
    0.34,
    0.38,
    { color: COSMOS.gold, width: 2.8, glow: 9 },
  );

  // Glowing 3D energy conduits feeding C
  const arcA = bezier3d([-0.8, 0.2, 0.75], [0.85, 0.7, 1.15], 1.15, ROLE.a, 3.0);
  const arcB = bezier3d([1.3, -0.6, 0.75], [1.3, 0.4, 1.15], 1.1, ROLE.b, 3.0);
  const photons = points3d(
    () => {
      const u = (((kCursor.value * 0.65) % 1) + 1) % 1;
      const u2 = (u + 0.5) % 1;
      return [arcA.evalAt(u), arcA.evalAt(u2), arcB.evalAt(u), arcB.evalAt(u2)];
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...aCells,
    ...bCells,
    ...cCells,
    ...activeSliceA,
    ...activeSliceB,
    arcA.node,
    arcB.node,
    photons,
  );
  return { view };
}

/**
 * Orbiting 3D 32-bank shared-memory ring: when conflictVal -> 0 (stride 32), tall crimson
 * spire spikes at bank 3; when conflictVal -> 1 (stride 33 / XOR), 32 even emerald prisms light up.
 */
export function buildBankRing3d(spreadVal, phaseVal, { x = 390, y = 10, unit = 108 } = {}) {
  const view = cinematic3d({
    theta: -0.7,
    phi: 1.06,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.8],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.4, 3.4],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  const ringPts = [];
  const radius = 2.45;
  for (let b = 0; b < 32; b++) {
    const ang = (b / 32) * Math.PI * 2;
    const bx = Math.cos(ang) * radius;
    const by = Math.sin(ang) * radius;
    const isBank3 = b === 3;
    const pillar = line3d(
      () => [bx, by, 0.05],
      () => {
        const sp = spreadVal.value;
        const h = isBank3 ? 2.85 * (1 - sp) + 0.68 * sp : 0.14 * (1 - sp) + 0.68 * sp;
        return [bx, by, h];
      },
      {
        color: isBank3 ? COSMOS.rose : COSMOS.emerald,
        width: isBank3 ? 6.5 : 4.2,
        glow: 9,
        blend: 'screen',
        onTop: true,
      },
    );
    ringPts.push(pillar);
  }

  // Orbiting request photons converging on bank 3 or fanning across all 32 banks
  const bank3Ang = (3 / 32) * Math.PI * 2;
  const b3x = Math.cos(bank3Ang) * radius;
  const b3y = Math.sin(bank3Ang) * radius;
  const pulses = points3d(
    () => {
      const sp = spreadVal.value;
      const p = phaseVal.value;
      const out = [];
      for (let i = 0; i < 16; i++) {
        const u = (((p * 0.45 + i / 16) % 1) + 1) % 1;
        const targetAng = ((i * 2) / 32) * Math.PI * 2;
        const tx = b3x * (1 - sp) + Math.cos(targetAng) * radius * sp;
        const ty = b3y * (1 - sp) + Math.sin(targetAng) * radius * sp;
        const tz = 0.6 + Math.sin(u * Math.PI) * 1.4;
        out.push([tx * u, ty * u, tz]);
      }
      return out;
    },
    { size: 7.5, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  // Highlight ring around base
  const ringCircle = curve3d(
    (t) => [Math.cos(t * Math.PI * 2) * radius, Math.sin(t * Math.PI * 2) * radius, 0.04],
    0,
    1,
    { color: COSMOS.cyan, width: 2.0, opacity: 0.55, samples: 48 },
  );

  view.add(floor, ringCircle, ...ringPts, pulses);
  return { view };
}

/**
 * Orbiting 3D 6x6 weight wall + dynamic batch token slabs (collapsing 8 -> 1).
 */
export function buildBatchWeights3d(batchRatio, phaseVal, { x = 370, y = 25, unit = 104 } = {}) {
  const view = cinematic3d({
    theta: -0.85,
    phi: 1.02,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.85,
    color: '#253459',
    opacity: 0.34,
  });

  // Weight matrix 6x6 crystal wall (always fixed in place!)
  const wSlab = solidBox3d(0.4, -1.65, 0.15, 0.65, 3.3, 2.2, '#691c3a', {
    opacity: 0.82,
    edgeColor: ROLE.b,
    edgeWidth: 2.2,
  });

  // Active weight column highlight inside weight slab
  const wColCage = wireframeSlab3d([0.72, -0.35, 1.25], 0.38, 0.28, 1.15, {
    color: COSMOS.gold,
    width: 2.8,
    glow: 10,
  });

  // Dynamic batch token slabs (shrinks from 8 rows down to 1 row as batchRatio goes 1 -> 0)
  const batchLines = [];
  for (let row = 0; row < 8; row++) {
    const zBase = 0.22 + row * 0.27;
    batchLines.push(
      line3d(
        () => [-2.75, -1.2, zBase],
        () => {
          const visible =
            row === 0 ? 1 : Math.max(0, Math.min(1, (batchRatio.value - (row - 1) / 8) * 4));
          return [-2.75 + 2.25 * visible, -1.2 + 2.4 * visible, zBase];
        },
        {
          color: row === 0 ? COSMOS.gold : ROLE.a,
          width: row === 0 ? 5.5 : 3.2,
          glow: 8,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  }

  // Flowing photons from batch rows through fixed weight column into output rows
  const beams = points3d(
    () => {
      const p = phaseVal.value;
      const activeRows = Math.max(1, Math.round(1 + batchRatio.value * 7));
      const pts = [];
      for (let r = 0; r < activeRows; r++) {
        const u = (((p * 0.55 + r * 0.13) % 1) + 1) % 1;
        const z = 0.25 + r * 0.27;
        pts.push([-1.8 + u * 4.4, -0.35, z]);
      }
      return pts;
    },
    { size: 8, color: COSMOS.cyan, glow: 12, blend: 'screen', onTop: true },
  );

  // Output ribbon cage on the right
  const outCage = wireframeSlab3d([2.35, -0.35, 1.25], 0.42, 1.15, 1.12, {
    color: ROLE.c,
    width: 2.0,
    glow: 6,
  });

  view.add(floor, ...wSlab, ...wColCage, ...batchLines, ...outCage, beams);
  return { view };
}

export {
  A,
  B,
  COSMOS,
  Node,
  aura,
  bankAddress,
  bf16,
  bottomEdge,
  circle,
  cinematic3d,
  cooperativeCell,
  dot,
  doubleBuffer,
  fragmentAccumulation,
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
  parametricSurface,
  partialProduct,
  points3d,
  polyPath,
  radialGradient,
  rect,
  registerDemand,
  rightEdge,
  rule,
  surface,
  txt,
  warpRequests,
  wireframeSlab3d,
};
