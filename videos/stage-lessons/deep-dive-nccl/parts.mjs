// Shared math models, invariants, and 3D NVLink/InfiniBand cinema rigs for Deep Dive - NCCL.
import { curve3d, gridPlane3d, group, line, line3d, linear, points3d, rect } from 'vizmatic/stage';
import {
  byteOffset,
  cost as scheduleCost,
  dependencyTrace,
  overlapTime,
  ringTraffic,
  transposeExchange,
} from '../../films/deep-dive-nccl/arithmetic.mjs';
import {
  inputs as RANK_INPUTS,
  reduced as REDUCED_VEC,
} from '../../films/deep-dive-nccl/fixtures.mjs';
import { partial as ringPartial } from '../../films/deep-dive-nccl/model.mjs';
import { validateModel } from '../../films/deep-dive-nccl/validation.mjs';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic as kitGuardedDynamic,
  heroTitle,
  orbitScene,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  COSMOS,
  RANK_INPUTS,
  REDUCED_VEC,
  aura,
  byteOffset,
  cinematic3d,
  dependencyTrace,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  heroTitle,
  line,
  orbitScene,
  overlapTime,
  rect,
  ringPartial,
  ringTraffic,
  scheduleCost,
  transposeExchange,
  txt,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  r0: COSMOS.blue,
  r1: COSMOS.cyan,
  r2: COSMOS.gold,
  r3: COSMOS.violet,
  good: COSMOS.emerald,
  bad: COSMOS.rose,
  warn: COSMOS.amber,
  comm: COSMOS.cyan,
  dim: '#4a5572',
});

export const PAYLOAD_256MIB = 256 * 1024 * 1024;
export const ALGBW_256 = PAYLOAD_256MIB / 0.006 / 1e9;
export const BUSBW_256 = ALGBW_256 * 1.5;
export const RING_4_TRAFFIC = ringTraffic(4, 16);
export const COST_1K_RING = scheduleCost(1000, true);
export const COST_1K_TREE = scheduleCost(1000, false);
export const COST_200K_RING = scheduleCost(200000, true);
export const COST_200K_TREE = scheduleCost(200000, false);
export const COST_1M_RING = scheduleCost(1e6, true);
export const COST_1M_TREE = scheduleCost(1e6, false);
export const OVERLAP_SERIAL = overlapTime(8, 6, 0);
export const OVERLAP_SHIFT = overlapTime(8, 6, 4);
export const ALLTOALL_3X3 = [
  [1, 2, 3],
  [10, 20, 30],
  [100, 200, 300],
];
export const ALLTOALL_DEST = transposeExchange(ALLTOALL_3X3);
export const FRESH_BROKEN = dependencyTrace(4, 3, 7, 5);
export const FRESH_REPLAY = dependencyTrace(4, 4, 8, 8);

export function verifyNcclInvariants() {
  validateModel();
  verifyInvariant(REDUCED_VEC.join(',') === '1111,2222,3333,4444', 'reduced [1111,2222,3333,4444]');
  verifyInvariant(
    ringPartial(0).value === 3000 && ringPartial(3).value === 3333,
    'ring partial 3000->3333',
  );
  verifyInvariant(
    RING_4_TRAFFIC.sent === 24 && RING_4_TRAFFIC.received === 24,
    '4-rank 16B ring sends/recvs 24B',
  );
  verifyApprox(COST_200K_RING.total, 18, 1e-6, '200KB ring tie 18us');
  verifyApprox(COST_200K_TREE.total, 18, 1e-6, '200KB tree tie 18us');
  verifyApprox(COST_1M_RING.total, 42, 1e-6, '1MB ring 42us');
  verifyApprox(COST_1M_TREE.total, 58, 1e-6, '1MB tree 58us');
  verifyApprox(ALGBW_256, 44.7392, 1e-2, '256MiB/6ms algbw 44.74 GB/s');
  verifyApprox(BUSBW_256, 67.1088, 1e-2, '256MiB/6ms busbw 67.11 GB/s');
  verifyInvariant(
    OVERLAP_SERIAL.total === 14 && OVERLAP_SHIFT.total === 10,
    'overlap 14ms vs 10ms',
  );
  verifyInvariant(byteOffset(2, 1, 4) === 8, 'rank 2 offset 8 bytes');
  verifyInvariant(ALLTOALL_DEST[1].join(',') === '2,20,200', 'alltoall dest 1 column 2,20,200');
  verifyInvariant(
    FRESH_BROKEN.first === 'input' && FRESH_REPLAY.first === null,
    'fresh trace first event',
  );
}

export function guardedDynamic(vis, renderFn, threshold = 0.02) {
  const getter = typeof vis === 'number' ? () => vis : vis;
  return kitGuardedDynamic(getter, renderFn, threshold);
}

export function glassCell(x, y, w, h, strokeColor = COSMOS.cyan, opts = {}) {
  const { fill = '#0d1424', strokeWidth = 2.4, radius = 12, glow = 6, opacity = 1 } = opts;
  const box = rect(w, h, { fill, stroke: strokeColor, width: strokeWidth, radius }).at(x, y);
  const g = glow > 0 ? box.glow(glow, strokeColor) : box;
  return opacity < 1 ? g.opacity(opacity) : g;
}

export function remainDuration(c, cueId, want = 0.45) {
  const start = typeof cueId === 'string' ? c.cue(cueId).start : cueId;
  return Math.max(0.16, Math.min(want, c.end - start - 0.55));
}

export function runPhase(s, c, phaseVal, cycles = 12) {
  const span = Math.max(0.8, c.end - c.start - 0.5);
  c.at(0.08, () => {
    s.play(phaseVal.to(cycles, { duration: span, ease: linear }));
  });
}

export function wireStepCues(s, c, stepVal, cueTargets) {
  cueTargets.forEach(([cueId, target, after = false]) => {
    const fn = () => s.play(stepVal.to(target, { duration: remainDuration(c, cueId, 0.4) }));
    if (after) c.after(cueId, fn);
    else c.on(cueId, fn);
  });
}

/** Orbiting 3D 4-GPU NVLink Ring with live packet photon orbiting clockwise. */
export function buildNcclRing3d(hopVal, phaseVal, { x = 470, y = 25, unit = 96 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.0,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.55],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#223152',
      opacity: 0.34,
    }),
  );

  const radius = 2.15;
  const rankCols = [ROLE.r0, ROLE.r1, ROLE.r2, ROLE.r3];
  const rankAngles = [Math.PI * 0.75, Math.PI * 0.25, -Math.PI * 0.25, -Math.PI * 0.75];

  view.add(
    curve3d(
      (t) => [Math.cos(t * Math.PI * 2) * radius, Math.sin(t * Math.PI * 2) * radius, 0.45],
      0,
      1,
      { color: ROLE.comm, width: 3.0, glow: 8, blend: 'screen', samples: 48, opacity: 0.85 },
    ),
  );

  for (let r = 0; r < 4; r++) {
    const gx = Math.cos(rankAngles[r]) * radius;
    const gy = Math.sin(rankAngles[r]) * radius;
    view.add(
      ...wireframeSlab3d([gx, gy, 0.55], 0.45, 0.45, 0.55, {
        color: rankCols[r],
        width: r === 2 ? 2.8 : 2.0,
        glow: r === 2 ? 10 : 6,
      }),
    );
  }

  view.add(
    points3d(
      () => {
        const p = phaseVal.value;
        const h = hopVal.value;
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const ang = -(((p * 0.42 + h * 0.25 + i / 6) % 1) * Math.PI * 2);
          pts.push([
            Math.cos(ang) * radius,
            Math.sin(ang) * radius,
            0.55 + Math.sin(ang * 2) * 0.16,
          ]);
        }
        return pts;
      },
      { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/** Orbiting 3D Complementary Double Binary Tree (Tree A cyan, Tree B gold). */
export function buildDoubleTree3d(phaseVal, { x = 475, y = 25, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 0.96,
    distance: 15.0,
    unit,
    focus: [0, 0, 0.8],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#223152',
      opacity: 0.34,
    }),
  );

  const pos = [
    [-1.7, -1.2, 0.45],
    [1.7, -1.2, 0.45],
    [1.7, 1.2, 0.45],
    [-1.7, 1.2, 0.45],
  ];
  const cols = [ROLE.r0, ROLE.r1, ROLE.r2, ROLE.r3];
  pos.forEach((p3, r) => {
    view.add(...wireframeSlab3d(p3, 0.42, 0.42, 0.42, { color: cols[r], width: 2.2, glow: 7 }));
  });

  // Tree A (cyan, raised z=1.1): internal R0, R1
  const aEdges = [
    [pos[0], pos[1]],
    [pos[0], pos[3]],
    [pos[1], pos[2]],
  ];
  aEdges.forEach(([a, b]) => {
    view.add(
      line3d([a[0], a[1], 0.95], [b[0], b[1], 0.95], {
        color: ROLE.comm,
        width: 3.0,
        glow: 8,
        blend: 'screen',
      }),
    );
  });

  // Tree B (gold, raised z=1.65): internal R2, R3
  const bEdges = [
    [pos[2], pos[3]],
    [pos[2], pos[1]],
    [pos[3], pos[0]],
  ];
  bEdges.forEach(([a, b]) => {
    view.add(
      line3d([a[0], a[1], 1.55], [b[0], b[1], 1.55], {
        color: COSMOS.gold,
        width: 3.0,
        glow: 8,
        blend: 'screen',
      }),
    );
  });

  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.55) % 1;
        return [
          [pos[0][0] + (pos[1][0] - pos[0][0]) * u, pos[0][1], 0.95],
          [pos[2][0] + (pos[3][0] - pos[2][0]) * u, pos[2][1], 1.55],
        ];
      },
      { size: 8, color: COSMOS.ink, glow: 12, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/** Orbiting 3D Dual-Host NVLink + PCIe + NIC + InfiniBand Fabric Bridge. */
export function buildHostFabric3d(pxnVal, phaseVal, { x = 475, y = 25, unit = 90 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 0.96,
    distance: 15.6,
    unit,
    focus: [0, 0, 0.7],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.6, 3.6],
      y: [-2.6, 2.6],
      z: 0,
      step: 0.9,
      color: '#223152',
      opacity: 0.34,
    }),
  );

  // Host A GPUs + NIC
  const gA0 = [-2.4, -0.9, 1.1];
  const gA1 = [-1.4, 0.9, 1.1];
  const nicA = [-1.6, 0.0, 0.25];
  // Host B NIC + GPU
  const nicB = [1.8, 0.0, 0.25];
  const gB0 = [2.3, 0.2, 1.1];

  view.add(
    ...wireframeSlab3d(gA0, 0.42, 0.42, 0.38, { color: ROLE.r2, width: 2.6, glow: 9 }),
    ...wireframeSlab3d(gA1, 0.42, 0.42, 0.38, { color: ROLE.r0, width: 2.2, glow: 7 }),
    ...wireframeSlab3d(nicA, 0.45, 0.35, 0.2, { color: ROLE.comm, width: 2.4, glow: 8 }),
    ...wireframeSlab3d(nicB, 0.45, 0.35, 0.2, { color: ROLE.comm, width: 2.4, glow: 8 }),
    ...wireframeSlab3d(gB0, 0.45, 0.45, 0.38, { color: ROLE.good, width: 2.6, glow: 9 }),
    // NVLink between gA0 and gA1
    line3d(gA0, gA1, { color: COSMOS.gold, width: 3.0, glow: 8, blend: 'screen' }),
    // PCIe links to NICs
    line3d(gA0, nicA, { color: ROLE.r2, width: 2.2, glow: 6, blend: 'screen' }),
    line3d(gA1, nicA, { color: ROLE.r0, width: 2.6, glow: 7, blend: 'screen' }),
    // Cross-node fabric link
    line3d(nicA, nicB, { color: ROLE.comm, width: 3.4, glow: 10, blend: 'screen' }),
    line3d(nicB, gB0, { color: ROLE.good, width: 2.6, glow: 7, blend: 'screen' }),
  );

  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.5) % 1;
        const usePxn = pxnVal.value > 0.5;
        const waypoints = usePxn ? [gA0, gA1, nicA, nicB, gB0] : [gA0, nicA, nicB, gB0];
        const seg = u * (waypoints.length - 1);
        const idx = Math.min(waypoints.length - 2, Math.floor(seg));
        const f = seg - idx;
        const a = waypoints[idx];
        const b = waypoints[idx + 1];
        return [[a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]];
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}
