// Shared math models, build-time invariants, and 3D hardware-grade vLLM cinema rigs.
import { curve3d, gridPlane3d, group, line, line3d, linear, points3d, rect } from 'vizmatic/stage';
import { reuse } from '../../films/deep-dive-vllm/arithmetic.mjs';
import {
  budgetTrace,
  goodputReceiptState,
  lifetimeTrace,
  sampleModel,
  vvState,
} from '../../films/deep-dive-vllm/construction.mjs';
import {
  r0 as R0_WORDS,
  r1 as R1_WORDS,
  sharedPrefix as SHARED_PREFIX,
} from '../../films/deep-dive-vllm/fixtures.mjs';
import {
  references,
  schedule,
  vvReleaseRequest,
  vvTouchAllocate,
} from '../../films/deep-dive-vllm/model.mjs';
import { validateModel } from '../../films/deep-dive-vllm/validation.mjs';
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
  R0_WORDS,
  R1_WORDS,
  SHARED_PREFIX,
  aura,
  budgetTrace,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  goodputReceiptState,
  group,
  heroTitle,
  lifetimeTrace,
  line,
  orbitScene,
  rect,
  references,
  reuse,
  sampleModel,
  schedule,
  txt,
  vvReleaseRequest,
  vvState,
  vvTouchAllocate,
  wireframeSlab3d,
};

/** Consistent semantic roles across all 29 scenes of Deep Dive - vLLM. */
export const ROLE = Object.freeze({
  kv: COSMOS.cyan,
  r0: COSMOS.blue,
  r1: COSMOS.violet,
  good: COSMOS.emerald,
  warn: COSMOS.gold,
  bad: COSMOS.rose,
  amber: COSMOS.amber,
  dim: '#4a5572',
});

export const SCHED_6 = schedule(9, 6);
export const SCHED_10 = schedule(9, 10);
export const GOODPUT_ROWS = goodputReceiptState(2).rows;
export const TOY_POOL_RESULT = vvTouchAllocate([71, 55, 9], { 71: 0, 55: 0, 9: 0 }, 9);
export const QUEUE_RELEASE_RESULT = vvReleaseRequest(
  { R1: [12, 73, 90], R2: [41] },
  new Set([12, 73, 41]),
  'R1',
);
export const SYNTHESIS_DURATIONS = [20, 80, 40, 10];
export const FRESH_DURATIONS = [7, 65, 24, 6];

export function verifyVllmInvariants() {
  validateModel();
  verifyInvariant(R0_WORDS.length === 8, 'R0 has 8 word tokens');
  verifyInvariant(R1_WORDS.length === 9, 'R1 has 9 word tokens');
  verifyInvariant(SHARED_PREFIX === 6, 'R0 and R1 share 6 leading tokens');
  verifyInvariant(reuse(6, 9, 4) === 4, 'shared=6, len=9 -> skip 4');
  verifyInvariant(reuse(7, 9, 4) === 4, 'shared=7, len=9 -> skip 4');
  verifyInvariant(reuse(8, 9, 4) === 8, 'shared=8, len=9 -> skip 8');
  verifyInvariant(reuse(8, 8, 4) === 4, 'shared=8, len=8 -> skip 4 (logits guard)');
  verifyInvariant(reuse(1, 1, 4) === 0, 'shared=1, len=1 -> skip 0');
  verifyInvariant(reuse(10, 13, 4) === 8, 'shared=10, len=13 -> skip 8');
  verifyInvariant(
    SCHED_6[0].used === 6 && SCHED_6[1].used === 5 && SCHED_6[2].used === 2,
    'cap-6 steps 6,5,2',
  );
  verifyInvariant(
    2 + SCHED_6[0].used === 8 && 2 + SCHED_6[1].used === 7,
    'cap-6 clock 8ms + 7ms = 15ms',
  );
  verifyInvariant(2 + SCHED_10[0].used === 12, 'cap-10 clock 12ms');
  verifyInvariant(1 + 1 + 4 === 6, 'TP4/DP1 process count = 6');
  verifyInvariant(4 + 4 + 8 + 1 === 17, 'TP2/DP4 process count = 17');
  verifyInvariant(
    TOY_POOL_RESULT.free.join(',') === '55' && TOY_POOL_RESULT.allocated === 71,
    'toy pool touch 9 + alloc 71',
  );
  verifyInvariant(
    QUEUE_RELEASE_RESULT.free.join(',') === '90,73,12',
    'reverse release queue order [90,73,12]',
  );
  verifyApprox(GOODPUT_ROWS[0].goodput, 5.5, 1e-12, 'Candidate A goodput 5.50/s');
  verifyApprox(GOODPUT_ROWS[1].goodput, 7.52, 1e-12, 'Candidate B goodput 7.52/s');
  verifyApprox(GOODPUT_ROWS[0].wrong, 55 / 6, 1e-12, 'Candidate A inflated 9.17/s');
  verifyApprox((24 - 0) / (4 - 1), 8, 1e-12, 'request-mean TPOT = 8 ms');
  verifyInvariant(SYNTHESIS_DURATIONS.reduce((a, b) => a + b, 0) === 150, 'synthesis total 150 ms');
  verifyInvariant(
    FRESH_DURATIONS.reduce((a, b) => a + b, 0) === 102,
    'fresh admission total 102 ms',
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

export function remainDuration(c, cueId, want = 0.35, after = false) {
  const cue = typeof cueId === 'string' ? c.cue(cueId) : null;
  const anchor = cue ? (after ? cue.end : cue.start) : cueId;
  const avail = c.end - anchor - 0.35;
  return Math.max(0.08, Math.min(want, avail));
}

export function runPhase(s, c, phaseVal, cycles = 12) {
  const span = Math.max(0.8, c.end - c.start - 0.5);
  c.at(0.08, () => {
    s.play(phaseVal.to(cycles, { duration: span, ease: linear }));
  });
}

export function wireStepCues(s, c, stepVal, cueTargets) {
  cueTargets.forEach(([cueId, target, after = false]) => {
    const fn = () =>
      s.play(stepVal.to(target, { duration: remainDuration(c, cueId, 0.24, after) }));
    if (after) c.after(cueId, fn);
    else c.on(cueId, fn);
  });
}

function quadBezier3d(a, mid, b, t) {
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
    u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
  ];
}

/**
 * Orbiting 3D PagedAttention Virtual-to-Physical KV Block Table Rig.
 * Left upper tier: logical blocks. Lower HBM grid: non-contiguous physical slots (12, 41, 73, 90).
 * Glowing curved address rays + animated photon pulses trace virtual-to-physical lookups & CoW sharing.
 */
export function buildPagedKvRig3d(
  modeVal,
  phaseVal,
  { x = 475, y = 25, unit = 90, shareMode = false } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 0.96,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#203252',
      opacity: 0.34,
    }),
  );

  // Physical HBM block bank (z = 0.38): slots 12, 41, 73, 90 spread non-contiguously
  const physPos = [
    [-2.0, -1.6, 0.38], // slot 12 (shared prefix)
    [1.8, -1.3, 0.38], // slot 41 (R0 suffix)
    [-1.4, 1.8, 0.38], // slot 73 (R1 suffix)
    [2.0, 1.6, 0.38], // slot 90 (R1 partial tail)
  ];
  const physCols = [ROLE.good, ROLE.r0, ROLE.r1, COSMOS.gold];

  physPos.forEach((pos, idx) => {
    view.add(
      ...wireframeSlab3d(pos, 0.62, 0.5, 0.28, {
        color: physCols[idx],
        width: idx === 0 ? 2.8 : 2.1,
        glow: idx === 0 ? 11 : 7,
      }),
    );
  });

  // Logical block tables floating above (z = 2.05)
  const logR0 = [
    [-1.5, -0.9, 2.05], // R0 L0 -> 12
    [0.2, -0.9, 2.05], // R0 L1 -> 41
  ];
  logR0.forEach((pos, idx) => {
    view.add(
      ...wireframeSlab3d(pos, 0.48, 0.34, 0.2, {
        color: ROLE.r0,
        width: 2.3,
        glow: 8,
      }),
    );
  });

  const links = [
    { a: logR0[0], mid: [-1.9, -1.3, 1.35], b: physPos[0], color: ROLE.good },
    { a: logR0[1], mid: [1.1, -1.2, 1.4], b: physPos[1], color: ROLE.r0 },
  ];

  if (shareMode) {
    const logR1 = [
      [-1.5, 1.1, 2.05], // R1 L0 -> 12 (CoW shared)
      [0.0, 1.1, 2.05], // R1 L1 -> 73
      [1.5, 1.1, 2.05], // R1 L2 -> 90
    ];
    logR1.forEach((pos) => {
      view.add(
        ...wireframeSlab3d(pos, 0.45, 0.34, 0.2, {
          color: ROLE.r1,
          width: 2.2,
          glow: 8,
        }),
      );
    });
    links.push(
      { a: logR1[0], mid: [-2.2, -0.2, 1.5], b: physPos[0], color: ROLE.good },
      { a: logR1[1], mid: [-0.8, 1.6, 1.35], b: physPos[2], color: ROLE.r1 },
      { a: logR1[2], mid: [1.9, 1.4, 1.35], b: physPos[3], color: COSMOS.gold },
    );
  }

  links.forEach(({ a, mid, b, color }) => {
    view.add(
      curve3d((t) => quadBezier3d(a, mid, b, t), 0, 1, {
        color,
        width: 2.8,
        glow: 8,
        blend: 'screen',
        samples: 24,
        opacity: 0.88,
      }),
    );
  });

  view.add(
    points3d(
      () => {
        const m = Math.round(modeVal.value);
        const u = (phaseVal.value * 0.55) % 1;
        const pts = [];
        links.forEach(({ a, mid, b }, i) => {
          const t = (u + i * 0.22) % 1;
          pts.push(quadBezier3d(a, mid, b, t));
        });
        const focus = physPos[Math.abs(m) % physPos.length];
        pts.push([focus[0], focus[1], focus[2] + 0.35 + Math.sin(phaseVal.value * 2.5) * 0.12]);
        return pts;
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D vLLM V1 Multiprocessing Topology Rig.
 * Tier 2 (z=2.3): API servers. Tier 1 (z=1.3): EngineCore scheduler + KV pool.
 * Tier 0 (z=0.35): GPU Worker fleet connected over ZeroMQ streams.
 */
export function buildV1TopologyRig3d(scaleVal, phaseVal, { x = 475, y = 25, unit = 90 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 0.98,
    distance: 15.2,
    unit,
    focus: [0, 0, 1.05],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#203252',
      opacity: 0.34,
    }),
  );

  const apis = [
    [-1.4, -0.8, 2.35],
    [1.4, -0.8, 2.35],
  ];
  const cores = [
    [-1.2, 0.2, 1.35],
    [1.2, 0.2, 1.35],
  ];
  const workers = [
    [-2.0, 1.3, 0.35],
    [-0.7, 1.3, 0.35],
    [0.7, 1.3, 0.35],
    [2.0, 1.3, 0.35],
  ];

  apis.forEach((p) =>
    view.add(...wireframeSlab3d(p, 0.65, 0.36, 0.22, { color: ROLE.r0, width: 2.4, glow: 8 })),
  );
  cores.forEach((p) =>
    view.add(...wireframeSlab3d(p, 0.72, 0.42, 0.24, { color: COSMOS.gold, width: 2.6, glow: 9 })),
  );
  workers.forEach((p) =>
    view.add(...wireframeSlab3d(p, 0.46, 0.46, 0.26, { color: ROLE.kv, width: 2.2, glow: 7 })),
  );

  // ZeroMQ full mesh between API and Cores, plus Core-to-Worker dispatch lines
  const routes = [
    [apis[0], cores[0]],
    [apis[0], cores[1]],
    [apis[1], cores[0]],
    [apis[1], cores[1]],
    [cores[0], workers[0]],
    [cores[0], workers[1]],
    [cores[1], workers[2]],
    [cores[1], workers[3]],
  ];
  routes.forEach(([a, b], i) => {
    view.add(
      line3d(a, b, {
        color: i < 4 ? ROLE.r1 : ROLE.kv,
        width: 2.2,
        glow: 6,
        blend: 'screen',
      }),
    );
  });

  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.6) % 1;
        const multi = scaleVal.value > 0.5;
        const activeRoutes = multi ? routes : [routes[0], routes[4], routes[5]];
        return activeRoutes.map(([a, b], idx) => {
          const t = (u + idx * 0.17) % 1;
          return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        });
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D Block Pool & Intrusive Doubly-Linked LRU Free Queue Rig.
 * Shows 4 physical HBM slabs + glowing circular/linear free-queue track with orbiting reference halos.
 */
export function buildBlockPoolRig3d(stepVal, phaseVal, { x = 475, y = 25, unit = 90 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 0.98,
    distance: 15.0,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#203252',
      opacity: 0.34,
    }),
  );

  // Live HBM slots on back row (y = -1.1)
  const slots = [
    { pos: [-1.8, -1.1, 0.45], col: ROLE.good },
    { pos: [-0.6, -1.1, 0.45], col: COSMOS.gold },
    { pos: [0.6, -1.1, 0.45], col: ROLE.r1 },
    { pos: [1.8, -1.1, 0.45], col: ROLE.kv },
  ];
  slots.forEach(({ pos, col }) => {
    view.add(...wireframeSlab3d(pos, 0.45, 0.45, 0.32, { color: col, width: 2.4, glow: 8 }));
  });

  // Intrusive doubly-linked free queue rail in front (y = 1.45)
  const qNodes = [
    [-1.6, 1.45, 0.45],
    [0.0, 1.45, 0.45],
    [1.6, 1.45, 0.45],
  ];
  qNodes.forEach((pos, idx) => {
    view.add(
      ...wireframeSlab3d(pos, 0.48, 0.38, 0.24, {
        color: idx === 0 ? ROLE.warn : ROLE.kv,
        width: 2.3,
        glow: 8,
      }),
    );
  });

  // Bidirectional doubly-linked pointers between free-queue nodes
  view.add(
    line3d([-1.1, 1.32, 0.45], [-0.5, 1.32, 0.45], {
      color: ROLE.good,
      width: 2.6,
      glow: 7,
      blend: 'screen',
    }),
    line3d([-0.5, 1.58, 0.45], [-1.1, 1.58, 0.45], {
      color: ROLE.kv,
      width: 2.0,
      glow: 5,
      blend: 'screen',
    }),
    line3d([0.5, 1.32, 0.45], [1.1, 1.32, 0.45], {
      color: ROLE.good,
      width: 2.6,
      glow: 7,
      blend: 'screen',
    }),
    line3d([1.1, 1.58, 0.45], [0.5, 1.58, 0.45], {
      color: ROLE.kv,
      width: 2.0,
      glow: 5,
      blend: 'screen',
    }),
    curve3d((t) => quadBezier3d(slots[1].pos, [0.0, 0.2, 1.85], qNodes[1], t), 0, 1, {
      color: COSMOS.gold,
      width: 2.6,
      glow: 8,
      blend: 'screen',
      samples: 24,
    }),
  );

  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.55) % 1;
        const s = Math.round(stepVal.value);
        const arcPt = quadBezier3d(slots[1].pos, [0.0, 0.2, 1.85], qNodes[1], u);
        const qPt = [-1.6 + u * 3.2, 1.45, 0.85];
        const haloAngle = phaseVal.value * 2.2;
        const focus = slots[Math.abs(s) % slots.length].pos;
        const halo = [
          focus[0] + Math.cos(haloAngle) * 0.55,
          focus[1] + Math.sin(haloAngle) * 0.55,
          focus[2] + 0.55,
        ];
        return [arcPt, qPt, halo];
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/**
 * Orbiting 3D Multi-GPU Parallelism & Private Cluster KV-Transfer Fabric Rig.
 * Used for TP/PP/DP/EP parallelism and disaggregated private-network KV handoff.
 */
export function buildParallelFabricRig3d(modeVal, phaseVal, { x = 475, y = 25, unit = 90 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 0.96,
    distance: 15.2,
    unit,
    focus: [0, 0, 0.9],
  }).at(x, y);

  view.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-3.2, 3.2],
      z: 0,
      step: 0.85,
      color: '#203252',
      opacity: 0.34,
    }),
  );

  // 2x2x2 GPU rack slabs (2 PP stages x 2 TP ranks x 2 DP/EP columns)
  const gpus = [];
  for (let z = 0; z < 2; z++) {
    for (let y = 0; y < 2; y++) {
      for (let gx = 0; gx < 2; gx++) {
        const pos = [(gx - 0.5) * 2.2, (y - 0.5) * 2.1, 0.48 + z * 1.45];
        gpus.push(pos);
        const col = z === 0 ? (y === 0 ? ROLE.r0 : ROLE.kv) : y === 0 ? ROLE.r1 : COSMOS.gold;
        view.add(...wireframeSlab3d(pos, 0.48, 0.42, 0.3, { color: col, width: 2.3, glow: 8 }));
      }
    }
  }

  // Collective / KV transfer arcs across GPUs
  const arcs = [
    { a: gpus[0], mid: [0, -1.05, 1.05], b: gpus[1], col: ROLE.r0 }, // TP
    { a: gpus[0], mid: [-1.1, -1.05, 1.2], b: gpus[4], col: ROLE.r1 }, // PP
    { a: gpus[1], mid: [1.1, 0, 1.15], b: gpus[3], col: ROLE.good }, // DP / KV handoff
    { a: gpus[2], mid: [0, 1.05, 1.65], b: gpus[7], col: COSMOS.gold }, // EP all-to-all
  ];
  arcs.forEach(({ a, mid, b, col }) => {
    view.add(
      curve3d((t) => quadBezier3d(a, mid, b, t), 0, 1, {
        color: col,
        width: 2.8,
        glow: 8,
        blend: 'screen',
        samples: 24,
      }),
    );
  });

  view.add(
    points3d(
      () => {
        const m = Math.round(modeVal.value);
        const u = (phaseVal.value * 0.65) % 1;
        return arcs.map(({ a, mid, b }, i) => {
          const t = (u + i * 0.25 + (m % 2) * 0.1) % 1;
          return quadBezier3d(a, mid, b, t);
        });
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}
