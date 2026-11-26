// Shared math models, invariants, color semantics, and 3D/vector cinema helpers for deep-dive-flashinfer.
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
import { merge, mergeReference, prefix } from '../../films/deep-dive-flashinfer/arithmetic.mjs';
import {
  flashinferExtensionFrame,
  mergeConstruction,
  pageLookupFrame,
  sampleModel,
} from '../../films/deep-dive-flashinfer/construction.mjs';
import { requests } from '../../films/deep-dive-flashinfer/fixtures.mjs';
import { address, readSlot, splitExample } from '../../films/deep-dive-flashinfer/model.mjs';
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

// Semantic color roles held constant across all 28 scenes.
export const ROLE = Object.freeze({
  r0: COSMOS.blue,
  r1: COSMOS.violet,
  r2: COSMOS.cyan,
  page: COSMOS.cyan,
  query: COSMOS.gold,
  gold: COSMOS.gold,
  good: COSMOS.emerald,
  warn: COSMOS.amber,
  bad: COSMOS.rose,
  violet: COSMOS.violet,
  blue: COSMOS.blue,
});

export const PAGE_SIZE = 4;
export const QUERY_OFFSETS = prefix(requests.map((r) => r.q)); // [0, 3, 4, 8]
export const PAGE_OFFSETS = prefix(requests.map((r) => r.pages.length)); // [0, 2, 3, 6]
export const ALL_PAGES = requests.flatMap((r) => r.pages); // [7, 2, 11, 3, 14, 6]
export const KV_LENS = requests.map((r) => (r.pages.length - 1) * PAGE_SIZE + r.tail); // [6, 2, 9]
export const TOTAL_ROWS = requests.reduce((acc, r) => acc + r.q, 0); // 8
export const PADDED_ROWS = requests.length * Math.max(...requests.map((r) => r.q)); // 12

export const ADDR_5 = address(5); // { page: 14, slot: 1 }
export const ADDR_8 = address(8); // { page: 6, slot: 0 }
export const R2_PAGES = requests[2].pages; // [3, 14, 6]
export const R2_SORTED_PAGES = [...R2_PAGES].sort((a, b) => a - b); // [3, 6, 14]

export const SPLIT_EQ = splitExample(0); // shares [2/3, 1/3], b=[2,1], parent=log2(6)
export const SPLIT_LN3 = splitExample(Math.log(3)); // shares [1/2, 1/2], b=[2,2], parent=3
export const MERGE_CORRECT = merge([1, 0], 2, [0, 1], 1);
export const MERGE_WRONG_BASE = merge([1, 0], 2 * Math.LN2, [0, 1], Math.LN2);
export const MERGE_DOUBLE_CONV = merge([1, 0], 2 / Math.LN2, [0, 1], 1 / Math.LN2);
export const MERGE_OVERLAP = merge([0.5, 0.5], 1, [1, 0], 0);
export const MERGE_HUGE = mergeReference([1e308], 0, [1e308], 0);
export const MERGE_EMPTY_LEFT = mergeReference([0, 0], -Infinity, [1, 2], 0);

export const ALLOC_PAGES = 15;
export const ALLOC_KINDS = 2;
export const ALLOC_SLOTS = 4;
export const ALLOC_KV_HEADS = 8;
export const ALLOC_Q_HEADS = 32;
export const ALLOC_HEAD_DIM = 128;
export const ALLOC_ELEMS =
  ALLOC_PAGES * ALLOC_KINDS * ALLOC_SLOTS * ALLOC_KV_HEADS * ALLOC_HEAD_DIM;
export const ALLOC_BYTES = ALLOC_ELEMS * 2;

export const OFFSET_Q_DIM = 192;
export const OFFSET_O_DIM = 128;
export const OFFSET_Q_STRIDE = ALLOC_Q_HEADS * OFFSET_Q_DIM; // 6144
export const OFFSET_O_STRIDE = ALLOC_Q_HEADS * OFFSET_O_DIM; // 4096
export const OFFSET_Q = QUERY_OFFSETS.map((t) => t * OFFSET_Q_STRIDE); // [0, 18432, 24576, 49152]
export const OFFSET_O = QUERY_OFFSETS.map((t) => t * OFFSET_O_STRIDE); // [0, 12288, 16384, 32768]

export const PROFILE_STAGES = Object.freeze([
  { label: 'Plan', ms: 0.8, color: COSMOS.blue },
  { label: 'Copy', ms: 0.2, color: COSMOS.violet },
  { label: 'Launch', ms: 0.1, color: COSMOS.amber },
  { label: 'Attention', ms: 1.6, color: COSMOS.cyan },
  { label: 'Merge', ms: 0.3, color: COSMOS.emerald },
]);
export const PROFILE_ORIG_TOTAL = PROFILE_STAGES.reduce((s, st) => s + st.ms, 0); // 3.0
export const PROFILE_HALF_TOTAL = PROFILE_ORIG_TOTAL - 0.8; // 2.2
export const PROFILE_SPEEDUP = PROFILE_ORIG_TOTAL / PROFILE_HALF_TOTAL; // 1.3636...

export const LEASE_EARLY = readSlot({ writeBefore: true, read: true, writeAfter: false });
export const LEASE_WAIT = readSlot({ writeBefore: false, read: true, writeAfter: true });

export const SPLIT_CHUNKS = [4, 4, 4, 4];
export const SPLIT_SERIAL = 16;
export const SPLIT_4LANE_FINISH = 5;
export const SPLIT_2LANE_FINISH = 9;
export const SPLIT_4LANE_SPEEDUP = SPLIT_SERIAL / SPLIT_4LANE_FINISH; // 3.2

/** Build-time mathematical invariant assertions against videos/films/deep-dive-flashinfer/*.mjs. */
export function verifyFlashInferInvariants() {
  verifyInvariant(QUERY_OFFSETS.join(',') === '0,3,4,8', 'qo_indptr must equal [0,3,4,8]');
  verifyInvariant(PAGE_OFFSETS.join(',') === '0,2,3,6', 'kv_indptr must equal [0,2,3,6]');
  verifyInvariant(KV_LENS.join(',') === '6,2,9', 'KV lengths must equal [6,2,9]');
  verifyInvariant(TOTAL_ROWS === 8 && PADDED_ROWS === 12, '8 packed rows vs 12 padded');
  verifyInvariant(ADDR_5.page === 14 && ADDR_5.slot === 1, 'k5 -> page 14, slot 1');
  verifyInvariant(ADDR_8.page === 6 && ADDR_8.slot === 0, 'k8 -> page 6, slot 0');
  verifyInvariant(R2_SORTED_PAGES.join(',') === '3,6,14', 'sorted pages must equal [3,6,14]');
  verifyInvariant(
    pageLookupFrame(5, 1, 0.5).entry === 1 && pageLookupFrame(5, 1, 0.9).slot === 1,
    'pageLookupFrame matches k5',
  );

  const causalRows = sampleModel('causal', { beat: 0, beatP: 0 }).mask.map(
    (row) => row.filter(Boolean).length,
  );
  verifyInvariant(causalRows.join(',') === '6,7,8,9', 'bottom-right causal row lengths [6,7,8,9]');
  verifyInvariant(
    flashinferExtensionFrame('causal-rule', { beat: 4, beatP: 1 }).maskBoundary === 5,
    'transfer request K=7, Q=3, row=1 stops at key 5',
  );

  verifyApprox(SPLIT_EQ.result.output[0], 2 / 3, 1e-12, 'split equal scores A share 2/3');
  verifyApprox(SPLIT_EQ.result.output[1], 1 / 3, 1e-12, 'split equal scores B share 1/3');
  verifyApprox(SPLIT_EQ.result.b, Math.log2(6), 1e-12, 'split equal scores parent LSE log2(6)');
  verifyApprox(SPLIT_LN3.result.output[0], 0.5, 1e-12, 'split ln(3) A share 0.5');
  verifyApprox(SPLIT_LN3.result.output[1], 0.5, 1e-12, 'split ln(3) B share 0.5');
  verifyApprox(SPLIT_LN3.result.b, 3, 1e-12, 'split ln(3) parent LSE 3');
  verifyInvariant(
    Math.abs(MERGE_WRONG_BASE.output[0] - 2 / 3) > 0.04,
    'ln LSE in log2 merge shifts output away from 2/3',
  );
  verifyApprox(
    MERGE_OVERLAP.output[0],
    2 / 3,
    1e-12,
    'duplicate key 0 shifts [0.5,0.5] to [2/3,1/3]',
  );
  verifyInvariant(MERGE_HUGE.output[0] === 1e308, 'pre-normalized merge avoids 1e308 overflow');
  verifyInvariant(
    MERGE_EMPTY_LEFT.output[0] === 1 &&
      MERGE_EMPTY_LEFT.output[1] === 2 &&
      MERGE_EMPTY_LEFT.b === 0,
    'empty left sentinel returns right state',
  );

  let rejectedNonZeroEmpty = false;
  try {
    mergeReference([1], -Infinity, [2], 0);
  } catch (err) {
    rejectedNonZeroEmpty = err instanceof RangeError;
  }
  verifyInvariant(rejectedNonZeroEmpty, 'non-zero vector with -Inf must throw RangeError');

  verifyInvariant(
    ALLOC_ELEMS === 122880 && ALLOC_BYTES === 245760,
    'FP16 KV cache allocation bytes',
  );
  verifyInvariant(OFFSET_Q[1] === 18432 && OFFSET_O[1] === 12288, 'cuDNN element offsets for R1');
  verifyApprox(PROFILE_ORIG_TOTAL, 3.0, 1e-12, 'original profile total 3.0ms');
  verifyApprox(PROFILE_HALF_TOTAL, 2.2, 1e-12, 'halved attention profile total 2.2ms');
  verifyApprox(PROFILE_SPEEDUP, 3.0 / 2.2, 1e-12, 'whole-call speedup ~1.3636x');

  verifyInvariant(
    LEASE_EARLY.returned[0] === 1 && LEASE_EARLY.returned[1] === 0,
    'early overwrite returns R9 [1,0]',
  );
  verifyInvariant(
    LEASE_WAIT.returned[0] === 0 && LEASE_WAIT.returned[1] === 1,
    'waiting lease returns R2 [0,1]',
  );
  verifyInvariant(
    LEASE_EARLY.value[0] === LEASE_WAIT.value[0] && LEASE_EARLY.value[1] === LEASE_WAIT.value[1],
    'both runs end with identical final slot payload',
  );

  verifyInvariant(
    mergeConstruction(1, 0.5).output[0] === 2 / 3,
    'mergeConstruction mid-beat matches 2/3',
  );
  verifyInvariant(
    sampleModel('planning', { beat: 1, beatP: 0.5 }).valid === false &&
      sampleModel('planning', { beat: 2, beatP: 0.8 }).valid === true,
    'planning transitions from stale to valid',
  );
  const ft = flashinferExtensionFrame('fresh-tail', { beat: 2, beatP: 1 });
  verifyInvariant(ft.oldLength === 15 && ft.newLength === 16, 'fresh-tail 15 -> 16');
  verifyApprox(SPLIT_4LANE_SPEEDUP, 3.2, 1e-12, 'split-schedule 4-lane speedup 3.2x');
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.35, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 0.55, endMargin = 0.35) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.12, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Safe duration from a specific cue end (for c.after) to the scene end. */
export function remainAfter(c, cueId, maxDur = 0.45, endMargin = 0.25) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.1, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

/** Safe duration from a beat start to the scene end. */
export function remainBeat(c, beatIdx, maxDur = 0.45, endMargin = 0.35) {
  const beat = c.beats[beatIdx];
  const start = beat ? beat.start : c.start;
  const avail = Math.max(0.12, c.end - start - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 14, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Clean translucent dark-glass tile cell (for data slots, memory cells, and hardware stages). */
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
 * Orbiting 3D Paged KV-Cache Physical Bank:
 * Non-contiguous physical pages [3, 14, 6] arranged as glowing 3D 4-slot slabs on an HBM grid,
 * with an animated gold wireframe cage tracking the selected (pageEntry, slot) and photon streams.
 */
export function buildPagedKvRig3d(
  entryVal,
  slotVal,
  phaseVal,
  { x = 420, y = 20, unit = 104, occupiedCounts = [4, 4, 1] } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.55],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.0, 3.0],
    z: -0.02,
    step: 0.85,
    color: '#253459',
    opacity: 0.34,
  });

  // Three non-contiguous physical page racks scattered on the HBM floor
  const pageBases = [
    { px: -2.45, py: -1.4, col: '#14436b', edge: ROLE.r0 }, // Entry 0 -> Page 3
    { px: 0.05, py: 0.55, col: '#11586e', edge: ROLE.r2 }, // Entry 1 -> Page 14
    { px: 1.85, py: -1.65, col: '#3a2263', edge: ROLE.r1 }, // Entry 2 -> Page 6
  ];

  const blocks = [];
  pageBases.forEach((pg, pIdx) => {
    const occ = occupiedCounts[pIdx] ?? 4;
    for (let sIdx = 0; sIdx < 4; sIdx++) {
      const isOcc = sIdx < occ;
      const sx = pg.px + (sIdx % 2) * 0.72;
      const sy = pg.py + Math.floor(sIdx / 2) * 0.72;
      blocks.push(
        ...solidBox3d(sx, sy, 0.12, 0.56, 0.56, isOcc ? 0.68 : 0.16, isOcc ? pg.col : '#181e30', {
          opacity: isOcc ? 0.88 : 0.42,
          edgeColor: isOcc ? pg.edge : COSMOS.dim,
          edgeWidth: isOcc ? 1.8 : 1.1,
        }),
      );
    }
  });

  // Wireframe gold selection cage tracking (entryVal, slotVal)
  const cage = wireframeSlab3d(
    () => {
      const e = Math.max(0, Math.min(2, entryVal.value));
      const sl = Math.max(0, Math.min(3, slotVal.value));
      const e0 = Math.floor(e);
      const e1 = Math.min(2, e0 + 1);
      const f = e - e0;
      const bx = pageBases[e0].px * (1 - f) + pageBases[e1].px * f;
      const by = pageBases[e0].py * (1 - f) + pageBases[e1].py * f;
      const col = Math.round(sl) % 2;
      const row = Math.floor(Math.round(sl) / 2);
      return [bx + col * 0.72 + 0.28, by + row * 0.72 + 0.28, 0.48];
    },
    0.34,
    0.34,
    0.42,
    { color: COSMOS.gold, width: 3.0, glow: 10 },
  );

  // Logical indirection conduits connecting entry 0 -> entry 1 -> entry 2
  const arc01 = bezier3d([-1.75, -0.7, 0.85], [0.75, 1.25, 0.85], 1.15, ROLE.r2, 2.8);
  const arc12 = bezier3d([0.75, 1.25, 0.85], [2.2, -1.3, 0.85], 1.1, COSMOS.gold, 2.8);
  const photons = points3d(
    () => {
      const u = (((phaseVal.value * 0.42) % 1) + 1) % 1;
      const u2 = (u + 0.5) % 1;
      return [arc01.evalAt(u), arc01.evalAt(u2), arc12.evalAt(u), arc12.evalAt(u2)];
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...blocks, ...cage, arc01.node, arc12.node, photons);
  return { view };
}

/**
 * Orbiting 3D Split-KV CTA Merge Cascade:
 * Parallel CTA pillars send glowing LSE beams into a floating parent online-softmax merge prism.
 * `weightShiftVal` controls the relative pillar heights (0 = 4:2 split, 1 = 4:4 equal split).
 */
export function buildSplitMergeTree3d(
  weightShiftVal,
  phaseVal,
  { x = 420, y = 20, unit = 104 } = {},
) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.05,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.95],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.8,
    color: '#253459',
    opacity: 0.34,
  });

  // Left Worker A pillar (4 keys)
  const ctaA = solidBox3d(-2.35, -0.55, 0.1, 1.1, 1.1, 1.55, '#134c78', {
    opacity: 0.88,
    edgeColor: ROLE.r0,
    edgeWidth: 2.0,
  });

  // Right Worker B pillar (2 keys, rises dynamically with weightShiftVal)
  const ctaBBase = solidBox3d(1.25, -0.55, 0.1, 1.1, 1.1, 0.85, '#4c2270', {
    opacity: 0.88,
    edgeColor: ROLE.r1,
    edgeWidth: 2.0,
  });
  const ctaBBoost = wireframeSlab3d(
    () => [1.8, 0.0, 0.95 + weightShiftVal.value * 0.38],
    0.58,
    0.58,
    0.36,
    { color: COSMOS.gold, width: 2.6, glow: 9 },
  );

  // Parent LSE merge prism hovering above center
  const parentPrism = solidBox3d(-0.62, -0.62, 2.25, 1.24, 1.24, 0.72, '#0f5c63', {
    opacity: 0.92,
    edgeColor: COSMOS.emerald,
    edgeWidth: 2.4,
  });

  const beamA = bezier3d([-1.8, 0, 1.68], [-0.25, 0, 2.28], 0.55, ROLE.r0, 3.2);
  const beamB = bezier3d([1.8, 0, 1.1], [0.25, 0, 2.28], 0.75, ROLE.r1, 3.2);

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const pts = [];
      for (let i = 0; i < 3; i++) {
        const u = (((p * 0.48 + i / 3) % 1) + 1) % 1;
        pts.push(beamA.evalAt(u), beamB.evalAt(u));
      }
      return pts;
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...ctaA,
    ...ctaBBase,
    ...ctaBBoost,
    ...parentPrism,
    beamA.node,
    beamB.node,
    photons,
  );
  return { view };
}

/**
 * Orbiting 3D GQA Head-Group & NHD/HND Tensor Core Slab:
 * 8 physical KV head prisms feed 32 query head prisms (4:1 sharing) via glowing fan-out beams.
 */
export function buildGqaTensorCube3d(
  activeGroupVal,
  phaseVal,
  { x = 420, y = 20, unit = 104 } = {},
) {
  const view = cinematic3d({
    theta: -0.8,
    phi: 1.02,
    distance: 16.2,
    unit,
    focus: [0, 0, 0.85],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.85,
    color: '#253459',
    opacity: 0.34,
  });

  const nodes = [floor];
  // 8 KV head slabs along back row (y = -1.6)
  for (let h = 0; h < 8; h++) {
    const hx = -2.8 + h * 0.78;
    nodes.push(
      ...solidBox3d(hx, -1.9, 0.12, 0.56, 0.78, 0.72, '#134c78', {
        opacity: 0.86,
        edgeColor: ROLE.r2,
        edgeWidth: 1.6,
      }),
    );
  }
  // 4 query heads per group in front (y = 0.8..2.0)
  for (let h = 0; h < 8; h++) {
    const hx = -2.8 + h * 0.78;
    for (let q = 0; q < 2; q++) {
      nodes.push(
        ...solidBox3d(hx, 0.4 + q * 0.75, 0.12, 0.56, 0.52, 1.15, '#3b1f63', {
          opacity: 0.84,
          edgeColor: ROLE.violet,
          edgeWidth: 1.5,
        }),
      );
    }
  }

  // Highlight wireframe cage sweeping across the 8 KV groups
  const groupCage = wireframeSlab3d(
    () => {
      const g = Math.max(0, Math.min(7, activeGroupVal.value));
      return [-2.52 + g * 0.78, -1.51, 0.5];
    },
    0.34,
    0.46,
    0.44,
    { color: COSMOS.gold, width: 2.8, glow: 10 },
  );

  // Fan-out photons from active KV head to its 4 query heads
  const photons = points3d(
    () => {
      const g = Math.max(0, Math.min(7, activeGroupVal.value));
      const hx = -2.52 + g * 0.78;
      const u = (((phaseVal.value * 0.55) % 1) + 1) % 1;
      const out = [];
      for (let q = 0; q < 4; q++) {
        const t = (u + q * 0.25) % 1;
        const py = -1.1 + t * 2.4;
        const pz = 0.75 + Math.sin(t * Math.PI) * 1.0;
        out.push([hx + (q - 1.5) * 0.08, py, pz]);
      }
      return out;
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(...nodes, ...groupCage, photons);
  return { view };
}

/**
 * Orbiting 3D Inspector-Executor Pipeline (Host plan -> Fixed Workspace -> CUDA Graph Run Grid).
 */
export function buildPlanRunPipeline3d(stageVal, phaseVal, { x = 420, y = 20, unit = 104 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.7],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.85,
    color: '#253459',
    opacity: 0.34,
  });

  // Left: Host plan() inspector slab
  const planSlab = solidBox3d(-2.9, -0.9, 0.12, 1.2, 1.8, 0.72, '#1b356e', {
    opacity: 0.88,
    edgeColor: ROLE.r0,
    edgeWidth: 2.0,
  });
  // Center: Fixed-address Workspace buffer slab
  const wsSlab = solidBox3d(-0.7, -1.1, 0.12, 1.4, 2.2, 1.05, '#0f5666', {
    opacity: 0.9,
    edgeColor: ROLE.r2,
    edgeWidth: 2.2,
  });
  // Right: 2x2 GPU CTA execution grid
  const ctaGrid = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      ctaGrid.push(
        ...solidBox3d(1.55 + c * 0.82, -0.82 + r * 0.88, 0.12, 0.66, 0.68, 1.25, '#125444', {
          opacity: 0.9,
          edgeColor: ROLE.good,
          edgeWidth: 2.0,
        }),
      );
    }
  }

  const activeCage = wireframeSlab3d(
    () => {
      const s = Math.max(0, Math.min(2, stageVal.value));
      const cx = s < 1 ? -2.3 + s * 2.3 : 0 + (s - 1) * 2.3;
      return [cx, 0, 0.75];
    },
    0.82,
    1.15,
    0.72,
    { color: COSMOS.gold, width: 2.8, glow: 10 },
  );

  const arcPW = bezier3d([-1.7, 0, 0.85], [-0.7, 0, 1.15], 0.85, ROLE.r0, 3.0);
  const arcWR = bezier3d([0.7, 0, 1.15], [1.65, 0, 1.35], 0.85, ROLE.good, 3.0);
  const photons = points3d(
    () => {
      const u = (((phaseVal.value * 0.5) % 1) + 1) % 1;
      const u2 = (u + 0.5) % 1;
      return [arcPW.evalAt(u), arcPW.evalAt(u2), arcWR.evalAt(u), arcWR.evalAt(u2)];
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...planSlab,
    ...wsSlab,
    ...ctaGrid,
    ...activeCage,
    arcPW.node,
    arcWR.node,
    photons,
  );
  return { view };
}

export {
  COSMOS,
  Node,
  address,
  aura,
  circle,
  cinematic3d,
  curve3d,
  delay,
  dot,
  flashinferExtensionFrame,
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
  merge,
  mergeConstruction,
  mergeReference,
  metricReadout,
  orbitScene,
  pageLookupFrame,
  par,
  parametricSurface,
  points3d,
  polyPath,
  prefix,
  radialGradient,
  readSlot,
  rect,
  requests,
  rule,
  sampleModel,
  splitExample,
  txt,
  wireframeSlab3d,
};
