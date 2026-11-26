// Shared math models, invariants, color semantics, and 3D IR-to-hardware cinema rigs for gpu-compilers-kernel-languages.
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
  coldPhases,
  coverage,
  enumeratedAccesses,
  liveSlots,
  nativeOnlyRuns,
  publishedPair,
  recipeDigest,
  residency,
  resolve,
  specializationFixture,
  tailSummary,
  vectorLane,
} from '../../films/gpu-compilers-kernel-languages/arithmetic.mjs';
import { ARTIFACT, artifactLines } from '../../films/gpu-compilers-kernel-languages/fixtures.mjs';
import { publishable } from '../../films/gpu-compilers-kernel-languages/model.mjs';
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

export const ROLE = Object.freeze({
  ir: COSMOS.cyan,
  ptx: COSMOS.gold,
  cubin: COSMOS.emerald,
  host: COSMOS.blue,
  triton: COSMOS.violet,
  fail: COSMOS.rose,
  warn: COSMOS.amber,
});

export const LANE_1 = vectorLane(1); // { x: 0.25, y: -2, sum: -1.75 }
export const RES_32 = residency(32);
export const RES_33 = residency(33);
export const RES_40 = residency(40);
export const RES_41 = residency(41);
export const RES_65 = residency(65);
export const RES_129 = residency(129);
export const SLOTS_SHORT = liveSlots(false);
export const SLOTS_EXT = liveSlots(true);
export const SPEC_STALE = specializationFixture(2, false);
export const SPEC_REBUILT = specializationFixture(2, true);
export const COLD_PTX = coldPhases(false);
export const COLD_NATIVE = coldPhases(true);
export const TAIL_257 = tailSummary(257, 256);
export const TAIL_769 = tailSummary(769, 128);
export const INT32_MAX = 2147483647;
export const WIDE_BLOCKS = Math.floor(INT32_MAX / 256) + 1;

export function verifyCompilerInvariants() {
  verifyApprox(LANE_1.x, 0.25, 1e-12, 'lane 1 x');
  verifyApprox(LANE_1.y, -2, 1e-12, 'lane 1 y');
  verifyApprox(LANE_1.sum, -1.75, 1e-12, 'lane 1 sum');
  verifyInvariant(
    nativeOnlyRuns[0].selection === 'LOAD NATIVE' &&
      nativeOnlyRuns[1].selection === 'MISSING IMAGE',
    'native-only loader selection',
  );
  verifyInvariant(
    resolve(true, true) === 'LOAD NATIVE' &&
      resolve(false, true) === 'JIT THEN LOAD' &&
      resolve(false, false) === 'MISSING IMAGE',
    'loader resolution states',
  );
  verifyInvariant(
    RES_32.blocks === 8 &&
      RES_32.warps === 64 &&
      RES_33.blocks === 6 &&
      RES_33.warps === 48 &&
      65536 - RES_33.blocks * RES_33.perBlock === 4096 &&
      RES_40.blocks === 6 &&
      RES_41.blocks === 5,
    'register granule residency cliffs',
  );
  verifyInvariant(
    SLOTS_SHORT.required === 2 && SLOTS_EXT.required === 3,
    'live interval register slots',
  );
  verifyInvariant(
    SPEC_STALE.cached === 9 &&
      SPEC_STALE.required === 18 &&
      SPEC_STALE.current === null &&
      SPEC_REBUILT.current === 18,
    'header specialization cache miss & rebuild',
  );
  verifyInvariant(
    publishable(ARTIFACT) === true && publishable(ARTIFACT.slice(0, 7)) === false,
    'atomic artifact publication check',
  );
  verifyInvariant(
    COLD_PTX.at(-1).end === 78 && COLD_NATIVE.at(-1).end === 18,
    'cold start 78 ms vs 18 ms',
  );
  verifyInvariant(
    enumeratedAccesses(257, 256, true).at(-1) === 257 &&
      enumeratedAccesses(257, 256, false).length === 257,
    '257 inclusive vs strict tail guard',
  );
  verifyInvariant(
    enumeratedAccesses(769, 128, true).at(-1) === 769 &&
      TAIL_769.blocks === 7 &&
      TAIL_769.positions === 896 &&
      TAIL_769.masked === 127,
    '769 fresh transfer tail guard',
  );
  verifyInvariant(
    recipeDigest({ stride: [1] }) !== recipeDigest({ stride: [2] }),
    'stride changes recipe digest',
  );
  verifyInvariant(
    publishedPair(ARTIFACT, { kernelSha256: publishedPair(ARTIFACT, { kernelSha256: '' }).actual })
      .matches === true,
    'digest pair verification',
  );
}

export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 1.5, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.25, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
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
  { fill = '#0d1528', radius = 10, glow = 6, opacity = 0.94, dash, width = 2.2 } = {},
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
      samples: 28,
      opacity: 0.9,
      onTop: true,
    }),
  };
}

/**
 * Orbiting 3D IR-to-Hardware lowering conduit: 4 glowing architecture slabs
 * (Source -> IR -> PTX -> Cubin/Silicon) with streaming golden instruction photons.
 */
export function buildLoweringConduit3d(
  activeStage,
  phaseVal,
  { x = 410, y = 20, unit = 102 } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.7],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-2.6, 2.6],
    z: 0,
    step: 0.85,
    color: '#253459',
    opacity: 0.34,
  });

  const slabs = [
    { x0: -2.95, fill: '#173869', edge: ROLE.host },
    { x0: -1.15, fill: '#2c1f57', edge: ROLE.triton },
    { x0: 0.65, fill: '#473612', edge: ROLE.ptx },
    { x0: 2.45, fill: '#0e473c', edge: ROLE.cubin },
  ];
  const boxes = [];
  for (const sl of slabs) {
    boxes.push(
      ...solidBox3d(sl.x0, -1.15, 0.15, 0.82, 2.3, 1.35, sl.fill, {
        opacity: 0.84,
        edgeColor: sl.edge,
        edgeWidth: 2.0,
      }),
    );
  }

  const cage = wireframeSlab3d(
    () => {
      const idx = Math.max(0, Math.min(3, activeStage.value));
      return [-2.54 + idx * 1.8, 0, 0.82];
    },
    0.5,
    1.28,
    0.82,
    { color: COSMOS.gold, width: 3.0, glow: 10 },
  );

  const arcs = [
    bezier3d([-2.1, 0, 0.9], [-1.18, 0, 0.9], 0.85, ROLE.ir, 2.8),
    bezier3d([-0.3, 0, 0.9], [0.62, 0, 0.9], 0.85, ROLE.ptx, 2.8),
    bezier3d([1.5, 0, 0.9], [2.42, 0, 0.9], 0.85, ROLE.cubin, 2.8),
  ];

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      return arcs.map((arc, i) => arc.evalAt((((p * 0.55 + i * 0.31) % 1) + 1) % 1));
    },
    { size: 8.5, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...boxes, ...cage, ...arcs.map((a) => a.node), photons);
  return { view };
}

/**
 * Orbiting 3D 65,536-register SM slab showing resident blocks (8 -> 6 -> 5) and unused gap.
 */
export function buildRegisterFile3d(blocksVal, phaseVal, { x = 420, y = 20, unit = 104 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 16.0,
    unit,
    focus: [0, 0, 0.85],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-2.4, 2.4],
    z: 0,
    step: 0.85,
    color: '#233254',
    opacity: 0.34,
  });

  // Outer 65,536-register SM boundary cage
  const outerCage = wireframeSlab3d([0, 0, 0.92], 3.1, 1.45, 0.92, {
    color: COSMOS.cyan,
    width: 2.2,
    glow: 6,
  });

  // 8 dynamic block prisms scaling smoothly as blocksVal drops 8 -> 6 -> 5
  const blockPillars = [];
  for (let b = 0; b < 8; b++) {
    const bx = -2.62 + b * 0.75;
    blockPillars.push(
      line3d(
        () => [bx, 0, 0.08],
        () => {
          const active = Math.max(0, Math.min(1, blocksVal.value - b));
          return [bx, 0, 0.1 + active * 1.68];
        },
        {
          color: b < 5 ? ROLE.cubin : b === 5 ? COSMOS.gold : ROLE.fail,
          width: 14,
          glow: 9,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  }

  const pulses = points3d(
    () => {
      const p = phaseVal.value;
      const n = Math.max(1, Math.round(blocksVal.value));
      const out = [];
      for (let i = 0; i < n; i++) {
        const bx = -2.62 + i * 0.75;
        const z = 0.25 + ((((p * 0.5 + i * 0.17) % 1) + 1) % 1) * 1.4;
        out.push([bx, 0.75, z]);
      }
      return out;
    },
    { size: 7.5, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...outerCage, ...blockPillars, pulses);
  return { view };
}

export {
  ARTIFACT,
  COSMOS,
  Node,
  artifactLines,
  aura,
  circle,
  cinematic3d,
  coldPhases,
  coverage,
  dot,
  enumeratedAccesses,
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
  liveSlots,
  metricReadout,
  nativeOnlyRuns,
  orbitScene,
  parametricSurface,
  points3d,
  polyPath,
  publishable,
  publishedPair,
  radialGradient,
  recipeDigest,
  rect,
  residency,
  resolve,
  rule,
  specializationFixture,
  surface,
  tailSummary,
  txt,
  vectorLane,
  wireframeSlab3d,
};
