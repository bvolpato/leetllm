// Shared math models, invariants, color semantics, and 3D/vector cinema helpers
// for gpu-kernel-performance-engineering-lab.
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
  surface,
} from 'vizmatic/stage';
import {
  bankModel,
  clamp,
  edgeOwnership as computeEdgeOwnership,
  laneSectorCoverage,
  mix,
  resourceCapacity,
  sectorModel,
  sectorTransition,
  transpose,
} from '../../films/gpu-kernel-performance-engineering-lab/arithmetic.mjs';
import { columnRequests } from '../../films/gpu-kernel-performance-engineering-lab/bank-desk.mjs';
import {
  compact,
  compactProgress,
  sharedTileSnapshot,
} from '../../films/gpu-kernel-performance-engineering-lab/construction.mjs';
import { copyPass } from '../../films/gpu-kernel-performance-engineering-lab/copy-check.mjs';
import {
  bits as MISMATCH_BITS,
  introOrder,
  recordedTiming,
} from '../../films/gpu-kernel-performance-engineering-lab/fixtures.mjs';
import {
  freshEdgeReadout,
  sampleModel,
  timingEvidence,
} from '../../films/gpu-kernel-performance-engineering-lab/model.mjs';
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

// Semantic color roles across all 19 scenes.
export const ROLE = Object.freeze({
  input: COSMOS.blue,
  shared: COSMOS.gold,
  output: COSMOS.cyan,
  good: COSMOS.emerald,
  warn: COSMOS.amber,
  bad: COSMOS.rose,
  violet: COSMOS.violet,
  gold: COSMOS.gold,
});

// Precomputed model constants imported directly from videos/films/gpu-kernel-performance-engineering-lab/*.mjs
export const TRANSPOSE_4 = transpose(4);
export const WATCHED_SIX = TRANSPOSE_4.find((e) => e.value === 6);

export const COPY_FIRST_15 = copyPass('empty', 'repaired', 15);
export const COPY_FIRST_16 = copyPass('empty', 'repaired', 16);
export const COPY_STALE_SKIP = copyPass('previous', 'skipped', 15);
export const COPY_POISON_EMPTY = copyPass('poison', 'skipped', 0);
export const COPY_POISON_SKIP = copyPass('poison', 'skipped', 15);
export const COPY_POISON_FIXED = copyPass('poison', 'repaired', 16);

export const ZERO_F32 = new Float32Array([0.0, -0.0]);
export const ZERO_U32 = new Uint32Array(ZERO_F32.buffer);

export const SECTOR_ALIGNED = sectorModel(true);
export const SECTOR_STRIDED = sectorModel(false);
export const EDGE_SECTOR_N33 = laneSectorCoverage(33, 32);
export const EDGE_SECTOR_ONE = laneSectorCoverage(0, 1);

export const LOGICAL_N = 4096;
export const LOGICAL_BYTES = 2 * LOGICAL_N * LOGICAL_N * 4;
export const LOGICAL_MIB = LOGICAL_BYTES / 2 ** 20;
export const WORKSHEET_MS = 0.25;
export const WORKSHEET_SEC = WORKSHEET_MS / 1000;
export const WORKSHEET_GBS = LOGICAL_BYTES / WORKSHEET_SEC / 1e9;

export const EDGE_33 = computeEdgeOwnership(33, 1, 0);
export const EDGE_33_PAIRS = EDGE_33.pairs.slice().sort((a, b) => a.producer.row - b.producer.row);
export const EDGE_33_PAIR65 = EDGE_33_PAIRS[1];

export const BANK_32 = bankModel(32);
export const BANK_33 = bankModel(33);
export const BANK_34 = bankModel(34);

export const RES_40 = resourceCapacity(40);
export const RES_56 = resourceCapacity(56);

export const COMPACT_FULL = compact();

export const TIMING_EVIDENCE = timingEvidence(recordedTiming);
export const PADDED_DELTA_US = recordedTiming.padded.map(
  (v, i) => (v - recordedTiming.tiled[i]) * 1000,
);

export const EDGE_67 = computeEdgeOwnership(67, 2, 0);
export const EDGE_67_PAIR131 = EDGE_67.pairs.find(
  (p) => p.producer.row === 1 && p.producer.col === 64,
);

/** Build-time mathematical invariant assertions against the lesson model modules. */
export function verifyPerfLabInvariants() {
  verifyInvariant(TRANSPOSE_4.length === 16, '4x4 transpose has 16 entries');
  verifyInvariant(
    WATCHED_SIX.source[0] === 1 &&
      WATCHED_SIX.source[1] === 2 &&
      WATCHED_SIX.target[0] === 2 &&
      WATCHED_SIX.target[1] === 1,
    'value 6 transposes A[1,2] -> B[2,1]',
  );
  verifyInvariant(
    COPY_STALE_SKIP.mismatches === 0 && COPY_STALE_SKIP.words[9] === 0x40c00000,
    'stale output hides skipped store with 0 mismatches',
  );
  verifyInvariant(
    COPY_POISON_SKIP.mismatches === 1 && COPY_POISON_SKIP.words[9] === 0xffffffff,
    'fresh 0xff poison exposes skipped store as 1 mismatch',
  );
  verifyInvariant(
    COPY_POISON_FIXED.mismatches === 0 && COPY_POISON_FIXED.words[9] === 0x40c00000,
    'repaired store restores exact 0x40c00000 with 0 mismatches',
  );
  verifyInvariant(
    ZERO_U32[0] === 0x00000000 && ZERO_U32[1] === 0x80000000,
    '+0.0 and -0.0 differ at sign bit',
  );

  verifyInvariant(
    SECTOR_ALIGNED.sectors.length === 4 && SECTOR_ALIGNED.fraction === 1,
    'aligned scalar float warp hits 4 sectors (100%)',
  );
  verifyInvariant(
    SECTOR_STRIDED.sectors.length === 32 && SECTOR_STRIDED.fraction === 0.125,
    'stride-4096 store hits 32 sectors (12.5%)',
  );
  verifyInvariant(
    EDGE_SECTOR_N33.sectors.length === 5 &&
      EDGE_SECTOR_N33.sectors[0] === 4 &&
      EDGE_SECTOR_N33.sectors.at(-1) === 8,
    'N=33 row 1 spans sectors 4..8 (5 sectors)',
  );
  verifyApprox(EDGE_SECTOR_N33.fraction, 0.8, 1e-12, 'N=33 row 1 payload fraction');
  verifyApprox(EDGE_SECTOR_ONE.fraction, 0.125, 1e-12, '1-lane edge payload fraction');

  verifyInvariant(LOGICAL_BYTES === 134217728 && LOGICAL_MIB === 128, 'N=4096 logical bytes');
  verifyApprox(WORKSHEET_GBS, 536.870912, 1e-6, '0.25 ms worksheet effective GB/s');

  verifyInvariant(
    sharedTileSnapshot(0, 1).read === 16 &&
      sharedTileSnapshot(1, 1).read === 9 &&
      sharedTileSnapshot(1, 1).arrived === 16,
    '4x4 and partial 3x3 shared tile snapshot invariants',
  );

  verifyInvariant(
    EDGE_33.producers.length === 32 &&
      EDGE_33.barrierArrivals === 256 &&
      EDGE_33_PAIR65.producer.value === 65 &&
      EDGE_33_PAIR65.producer.warp === 1 &&
      EDGE_33_PAIR65.consumer.warp === 0 &&
      EDGE_33_PAIR65.consumer.index === 1057,
    'N=33 edge ownership handoff of 65 from Warp 1 to Warp 0',
  );

  verifyInvariant(
    BANK_32.conflict === 32 && BANK_32.sharedBytes === 4096,
    'stride 32 gives 32-way conflict and 4096 B',
  );
  verifyInvariant(
    BANK_33.conflict === 1 &&
      BANK_33.sharedBytes === 4224 &&
      BANK_33.sharedBytes - BANK_32.sharedBytes === 128,
    'stride 33 gives 1-way conflict and +128 B',
  );
  verifyInvariant(
    BANK_34.conflict === 2 &&
      BANK_34.used === 16 &&
      BANK_34.sharedBytes === 4352 &&
      columnRequests(34, 16)[0] === 1 &&
      columnRequests(34, 17)[0] === 2,
    'stride 34 wraps lane 16 back to bank 0 (2-way across 16 banks)',
  );

  verifyInvariant(
    RES_40.blocks === 6 &&
      RES_40.warps === 48 &&
      RES_40.sharedBlocks === 15 &&
      RES_40.warpBlocks === 8,
    '40 regs/thread packs 6 blocks (48 warps)',
  );
  verifyApprox(RES_40.fraction, 0.75, 1e-12, '40 regs/thread occupancy 75%');
  verifyInvariant(RES_56.blocks === 4 && RES_56.warps === 32, '56 regs/thread packs 4 blocks');
  verifyApprox(RES_56.fraction, 0.5, 1e-12, '56 regs/thread occupancy 50%');

  verifyInvariant(
    COMPACT_FULL.count === 4 &&
      COMPACT_FULL.offsets.join(',') === '0,0,1,1,2,3,3,3' &&
      COMPACT_FULL.indexes.join(',') === '1,3,4,7',
    'mismatch reduction + exclusive scan + compaction',
  );

  verifyInvariant(
    TIMING_EVIDENCE.allTiledBelowNaive &&
      TIMING_EVIDENCE.paddingRangesOverlap &&
      PADDED_DELTA_US.filter((d) => d < 0).length === 3 &&
      PADDED_DELTA_US.filter((d) => d > 0).length === 2,
    'RTX 5070 Ti timing evidence: tiled beats naive, padded 3 faster / 2 slower',
  );

  verifyInvariant(
    EDGE_67.producers.length === 96 &&
      EDGE_67.barrierArrivals === 256 &&
      EDGE_67_PAIR131.producer.value === 131 &&
      EDGE_67_PAIR131.consumer.index === 4289,
    'N=67 fresh trial: 96 loads, 256 barrier arrivals, A[1,64]=131 -> idx 4289',
  );
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.08, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 1.2, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.22, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Safe duration from a specific cue END (`c.after`) to the scene end. */
export function remainAfterDuration(c, cueId, maxDur = 0.85, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.2, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 14, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Clean translucent dark-glass tile cell (used for hardware cells, matrix slots, and gauges). */
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
 * Orbiting 3D Shared-Memory Transpose Cube Rig:
 * Left slab = Global Input A (blue), Center cube = Shared Tile (gold), Right slab = Global Output B (cyan).
 */
export function buildTransposeCube3d(stageVal, phaseVal, { x = 420, y = 20, unit = 96 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.4,
    unit,
    focus: [0, 0, 0.55],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.6, 3.6],
    y: [-2.8, 2.8],
    z: -0.02,
    step: 0.9,
    color: '#233254',
    opacity: 0.34,
  });

  // Input A (4x4 blue slab on left)
  const inputSlab = solidBox3d(-3.0, -1.2, 0.15, 1.35, 2.4, 0.45, '#193b70', {
    opacity: 0.85,
    edgeColor: ROLE.input,
    edgeWidth: 1.8,
  });
  // Shared memory tile cube (center, gold)
  const sharedCube = solidBox3d(-0.75, -1.2, 0.25, 1.5, 2.4, 1.05, '#473612', {
    opacity: 0.82,
    edgeColor: ROLE.shared,
    edgeWidth: 2.2,
  });
  // Output B (4x4 cyan slab on right)
  const outputSlab = solidBox3d(1.65, -1.2, 0.15, 1.35, 2.4, 0.45, '#10495c', {
    opacity: 0.85,
    edgeColor: ROLE.output,
    edgeWidth: 1.8,
  });

  // Active wireframe sweep cage moving across the shared tile
  const activeCage = wireframeSlab3d(
    () => {
      const p = phaseVal.value;
      const st = stageVal.value;
      const sweep = -0.85 + ((p * 0.35) % 1) * 1.7;
      return st < 0.5 ? [-2.32, sweep, 0.42] : st < 1.5 ? [0, sweep, 0.78] : [2.32, sweep, 0.42];
    },
    0.72,
    0.34,
    0.58,
    { color: COSMOS.gold, width: 2.6, glow: 9 },
  );

  // Glowing 3D data conduits: Input -> Shared -> Output
  const arcIn = bezier3d([-1.65, 0.0, 0.6], [-0.75, 0.0, 0.9], 0.9, ROLE.input, 3.0);
  const arcOut = bezier3d([0.75, 0.0, 0.9], [1.65, 0.0, 0.6], 0.9, ROLE.output, 3.0);

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      return [arcIn.evalAt(u1), arcIn.evalAt(u2), arcOut.evalAt(u1), arcOut.evalAt(u2)];
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...inputSlab,
    ...sharedCube,
    ...outputSlab,
    ...activeCage,
    arcIn.node,
    arcOut.node,
    photons,
  );
  return { view };
}

/**
 * Orbiting 3D 32-Bank Shared-Memory Ring:
 * modeVal: 0 = stride 32 (32-way rose spire at Bank 0),
 *          1 = stride 33 (32 uniform emerald pillars),
 *          2 = stride 34 (16 even amber 2-way spires, odd banks low).
 */
export function buildBankRing3d(modeVal, phaseVal, { x = 420, y = 15, unit = 104 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.05,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.85],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.4, 3.4],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  const radius = 2.45;
  const pillars = [];
  for (let b = 0; b < 32; b++) {
    const ang = (b / 32) * Math.PI * 2;
    const bx = Math.cos(ang) * radius;
    const by = Math.sin(ang) * radius;
    const isBank0 = b === 0;
    const isEven = b % 2 === 0;
    pillars.push(
      line3d(
        () => [bx, by, 0.04],
        () => {
          const m = modeVal.value;
          let h;
          if (m <= 1) {
            const h0 = isBank0 ? 2.9 : 0.14;
            const h1 = 0.72;
            h = h0 + (h1 - h0) * m;
          } else {
            const t = m - 1;
            const h1 = 0.72;
            const h2 = isEven ? 1.48 : 0.14;
            h = h1 + (h2 - h1) * t;
          }
          return [bx, by, h];
        },
        {
          color: isBank0 ? COSMOS.rose : isEven ? COSMOS.cyan : COSMOS.emerald,
          width: isBank0 ? 6.5 : 4.2,
          glow: 9,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  }

  const pulses = points3d(
    () => {
      const m = modeVal.value;
      const p = phaseVal.value;
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const u = (((p * 0.45 + i / 16) % 1) + 1) % 1;
        let targetBank;
        if (m < 0.5) targetBank = 0;
        else if (m < 1.5) targetBank = (i * 2) % 32;
        else targetBank = ((i * 2) % 16) * 2;
        const ang = (targetBank / 32) * Math.PI * 2;
        const tx = Math.cos(ang) * radius;
        const ty = Math.sin(ang) * radius;
        const tz = 0.55 + Math.sin(u * Math.PI) * 1.45;
        pts.push([tx * u, ty * u, tz]);
      }
      return pts;
    },
    { size: 7.5, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  const ringCircle = curve3d(
    (t) => [Math.cos(t * Math.PI * 2) * radius, Math.sin(t * Math.PI * 2) * radius, 0.04],
    0,
    1,
    { color: COSMOS.cyan, width: 2.0, opacity: 0.55, samples: 48 },
  );

  view.add(floor, ringCircle, ...pillars, pulses);
  return { view };
}

/**
 * Orbiting 3D Warp-to-Sector Coalescing Manifold:
 * coalescedVal = 1 -> 32 warp lanes converge into 4 adjacent 32-byte sectors (cyan/emerald).
 * coalescedVal = 0 -> 32 warp lanes fan out across 32 strided sectors (rose).
 */
export function buildSectorStream3d(coalescedVal, phaseVal, { x = 420, y = 20, unit = 98 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 16.2,
    unit,
    focus: [0, 0, 0.65],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.5, 3.5],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  // Warp emitter bar on the left
  const warpBar = solidBox3d(-2.7, -1.6, 0.3, 0.45, 3.2, 0.45, '#1b3e78', {
    opacity: 0.88,
    edgeColor: ROLE.input,
    edgeWidth: 2.0,
  });

  // 16 visible representative sector beams fanning to 4 tight sectors or wide scattered DRAM sectors
  const rays = [];
  for (let i = 0; i < 16; i++) {
    const sy = -1.45 + (i / 15) * 2.9;
    const tightY = -0.6 + (Math.floor(i / 4) / 3) * 1.2;
    const wideY = -2.4 + (i / 15) * 4.8;
    const wideZ = 0.25 + (i % 4) * 0.42;
    const tightZ = 0.55;
    rays.push(
      line3d(
        () => [-2.25, sy, 0.52],
        () => {
          const co = coalescedVal.value;
          return [2.15, wideY + (tightY - wideY) * co, wideZ + (tightZ - wideZ) * co];
        },
        {
          color: i % 4 === 0 ? COSMOS.gold : COSMOS.cyan,
          width: 2.6,
          glow: 8,
          blend: 'screen',
          opacity: 0.82,
          onTop: true,
        },
      ),
    );
  }

  // 4 contiguous coalesced sector cages on right
  const sectorCage = wireframeSlab3d([2.25, 0.0, 0.58], 0.35, 0.85, 0.42, {
    color: ROLE.good,
    width: 2.6,
    glow: 9,
  });

  // Photons traveling along the memory rays
  const photons = points3d(
    () => {
      const co = coalescedVal.value;
      const p = phaseVal.value;
      const pts = [];
      for (let i = 0; i < 16; i += 2) {
        const u = (((p * 0.6 + i * 0.07) % 1) + 1) % 1;
        const sy = -1.45 + (i / 15) * 2.9;
        const tightY = -0.6 + (Math.floor(i / 4) / 3) * 1.2;
        const wideY = -2.4 + (i / 15) * 4.8;
        const wideZ = 0.25 + (i % 4) * 0.42;
        const ty = wideY + (tightY - wideY) * co;
        const tz = wideZ + (0.55 - wideZ) * co;
        pts.push([-2.25 + u * 4.4, sy + (ty - sy) * u, 0.52 + (tz - 0.52) * u]);
      }
      return pts;
    },
    { size: 7.5, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...warpBar, ...rays, ...sectorCage, photons);
  return { view };
}

/**
 * Orbiting 3D SM Occupancy Chamber:
 * Stacks glowing resident blocks (1..6) inside the SM resource envelope.
 */
export function buildOccupancyChamber3d(blocksVal, phaseVal, { x = 440, y = 20, unit = 96 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.05,
    distance: 16.0,
    unit,
    focus: [0, 0, 1.1],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.0, 3.0],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.75,
    color: '#223152',
    opacity: 0.34,
  });

  // Outer SM capacity envelope (8-block warp ceiling)
  const smCage = wireframeSlab3d([0, 0, 1.55], 1.75, 1.35, 1.55, {
    color: COSMOS.cyan,
    width: 2.2,
    glow: 7,
  });

  // Up to 6 glowing resident block layers (dynamic heights by blocksVal)
  const slabs = [];
  for (let i = 0; i < 6; i++) {
    const zBase = 0.14 + i * 0.36;
    const isDropped = i >= 4;
    slabs.push(
      line3d(
        () => [-1.45, -1.05, zBase],
        () => {
          const vis = Math.max(0, Math.min(1, blocksVal.value - i));
          return [-1.45 + 2.9 * vis, -1.05, zBase];
        },
        {
          color: isDropped ? COSMOS.amber : ROLE.good,
          width: 7.0,
          glow: 9,
          blend: 'screen',
          onTop: true,
        },
      ),
      line3d(
        () => [-1.45, 1.05, zBase],
        () => {
          const vis = Math.max(0, Math.min(1, blocksVal.value - i));
          return [-1.45 + 2.9 * vis, 1.05, zBase];
        },
        {
          color: isDropped ? COSMOS.amber : ROLE.output,
          width: 7.0,
          glow: 9,
          blend: 'screen',
          onTop: true,
        },
      ),
      line3d(
        () => [1.45, -1.05, zBase],
        () => {
          const vis = Math.max(0, Math.min(1, blocksVal.value - i));
          return [1.45, -1.05 + 2.1 * vis, zBase];
        },
        {
          color: isDropped ? COSMOS.amber : ROLE.input,
          width: 5.5,
          glow: 8,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  }

  // Orbiting warp-scheduler photons around active block stack
  const warpPhotons = points3d(
    () => {
      const p = phaseVal.value;
      const nBlocks = Math.max(1, Math.round(blocksVal.value));
      const pts = [];
      for (let i = 0; i < nBlocks; i++) {
        const ang = p * 1.1 + i * 1.05;
        pts.push([Math.cos(ang) * 2.1, Math.sin(ang) * 1.65, 0.25 + i * 0.36]);
      }
      return pts;
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...smCage, ...slabs, warpPhotons);
  return { view };
}

/**
 * Orbiting 3D Nsight Compute Speed-of-Light & Roofline Manifold:
 * Shows the 3D memory-bandwidth ramp meeting the compute plateau, with a pulsing kernel probe.
 */
export function buildRooflineSol3d(phaseVal, { x = 440, y = 25, unit = 96 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.9],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.8,
    color: '#223152',
    opacity: 0.34,
  });

  // Bandwidth-bound ramp surface (x from -2.6 to 0.2)
  const memRamp = parametricSurface(
    (u, v) => [-2.6 + u * 2.8, -1.5 + v * 3.0, 0.2 + u * 2.0],
    [0, 1],
    [0, 1],
    { resolution: [8, 6], color: '#164d68', opacity: 0.78 },
  );

  // Compute-bound ceiling plateau (x from 0.2 to 2.8)
  const computeFlat = parametricSurface(
    (u, v) => [0.2 + u * 2.6, -1.5 + v * 3.0, 2.2],
    [0, 1],
    [0, 1],
    { resolution: [6, 6], color: '#4c3812', opacity: 0.78 },
  );

  // Glowing roofline ridge line
  const ridge = curve3d(
    (t) => {
      const xx = -2.6 + t * 5.4;
      const zz = xx < 0.2 ? 0.2 + ((xx + 2.6) / 2.8) * 2.0 : 2.2;
      return [xx, 0, zz + 0.06];
    },
    0,
    1,
    { color: COSMOS.gold, width: 4.5, glow: 10, blend: 'screen', samples: 40, onTop: true },
  );

  // Pulsing operating-point probes on the memory-bound slope (transpose is memory-bound!)
  const probe = points3d(
    () => {
      const p = phaseVal.value;
      const lift = 0.08 + 0.08 * Math.sin(p * 3.2);
      return [
        [-1.6, 0, 0.92 + lift],
        [-0.7, 0, 1.56 + lift],
        [0.2, 0, 2.26],
      ];
    },
    { size: 9, color: COSMOS.cyan, glow: 14, blend: 'screen', onTop: true },
  );

  view.add(floor, memRamp, computeFlat, ridge, probe);
  return { view };
}

export {
  COSMOS,
  MISMATCH_BITS,
  Node,
  aura,
  bankModel,
  circle,
  cinematic3d,
  clamp,
  columnRequests,
  compact,
  compactProgress,
  computeEdgeOwnership,
  copyPass,
  curve3d,
  delay,
  dot,
  freshEdgeReadout,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  introOrder,
  laneSectorCoverage,
  line,
  line3d,
  linear,
  linearGradient,
  metricReadout,
  mix,
  orbitScene,
  par,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  recordedTiming,
  rect,
  resourceCapacity,
  rule,
  sampleModel,
  sectorModel,
  sectorTransition,
  sharedTileSnapshot,
  surface,
  timingEvidence,
  transpose,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};
