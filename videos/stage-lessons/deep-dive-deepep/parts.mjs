// Shared math models, invariants, color semantics, and 3D hardware cinema rigs for deep-dive-deepep.
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
  bf16,
  communicationBudget,
  deferredWaitTrace,
  destinationExpectation,
  redundantGradient,
  sum,
} from '../../films/deep-dive-deepep/arithmetic.mjs';
import { finalToken, hidden, routes, source } from '../../films/deep-dive-deepep/fixtures.mjs';
import {
  Deferred,
  alignedLayout,
  combine,
  completeLayerReceipt,
  expertReturnReceipt,
  expertThreeReplay,
  ledger,
  resolveAlignedSlot,
  routeReplayComparison,
  roundTripAligned,
  weightedExpertRow,
} from '../../films/deep-dive-deepep/model.mjs';
import { validateModel } from '../../films/deep-dive-deepep/validation.mjs';
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
  brand: COSMOS.amber,
  nvlink: COSMOS.cyan,
  rdma: COSMOS.amber,
  rank0: COSMOS.blue,
  rank1: COSMOS.violet,
  meta: COSMOS.violet,
  token: COSMOS.gold,
  good: COSMOS.emerald,
  bad: COSMOS.rose,
  muted: COSMOS.muted,
});

// Precomputed model fixtures from videos/films/deep-dive-deepep/
export const LEDGER_BASE = ledger(routes);
export const ROUTES_DEDUP = Object.freeze({
  ...routes,
  a: [
    [2, 0.7],
    [3, 0.3],
  ],
});
export const ROUTES_MASKED = Object.freeze({
  ...routes,
  a: [
    [2, 0.7],
    [-1, 0.3],
  ],
});
export const LEDGER_DEDUP = ledger(ROUTES_DEDUP);
export const LEDGER_MASKED = ledger(ROUTES_MASKED);
export const REPLAY_COMP = routeReplayComparison();
export const EXPERT3_REPLAY = expertThreeReplay();
export const LAYOUT_UNALIGNED = alignedLayout([3, 1], 1);
export const LAYOUT_ALIGNED4 = alignedLayout([3, 1], 4);
export const LAYER_RECEIPT_BASE = completeLayerReceipt(routes);

export const DOUBLE_GATE_A0 = 0.7 * 0.7 * 1 + 0.3 * 0.3 * 4;
export const BACKWARD_A_ROW = weightedExpertRow([1, 0], [0, 3], [0.7, 0.3]);
export const BACKWARD_UPSTREAM = [2, 1];
export const BACKWARD_INPUT_GRAD = BACKWARD_UPSTREAM.map((x) => x * (0.7 + 4 * 0.3));
export const BACKWARD_GATE_GRAD = BACKWARD_A_ROW.raw.map((v) =>
  sum(v.map((x, i) => x * BACKWARD_UPSTREAM[i])),
);

export const ROUND_RAW = 256 + 1;
export const ROUND_BF16_MID = bf16(ROUND_RAW);
export const ROUND_STAGED = bf16(ROUND_BF16_MID - 256);
export const ROUND_SINGLE = bf16(ROUND_RAW - 256);

export const TOPO_LOGICAL_MIB = 100;
export const TOPO_REMOTE_MIB = 50;
export const TOPO_LOCAL_MIB = 50;
export const TOPO_LOGICAL_BYTES = TOPO_LOGICAL_MIB * 2 ** 20;
export const TOPO_REMOTE_BYTES = TOPO_REMOTE_MIB * 2 ** 20;
export const TOPO_LOGICAL_GBS = TOPO_LOGICAL_BYTES / 0.001 / 1e9;
export const TOPO_REMOTE_GBS = TOPO_REMOTE_BYTES / 0.001 / 1e9;

export const FP8_WIDTH = 7168;
export const FP8_GROUP_SIZE = 128;
export const FP8_SCALE_BYTES_PER_GROUP = 4;
export const FP8_GROUPS = FP8_WIDTH / FP8_GROUP_SIZE;
export const FP8_SCALE_BYTES = FP8_GROUPS * FP8_SCALE_BYTES_PER_GROUP;
export const FP8_TOTAL_BYTES = FP8_WIDTH + FP8_SCALE_BYTES;
export const BF16_TOTAL_BYTES = FP8_WIDTH * 2;
export const BF16_OVER_FP8_RATIO = BF16_TOTAL_BYTES / FP8_TOTAL_BYTES;
export const SCALE_WRONG_DECODE = 10 * 2;
export const SCALE_RIGHT_DECODE = 10 * 0.5;

export const DEFERRED_1 = deferredWaitTrace(1);
export const DEFERRED_2 = deferredWaitTrace(2);
export const REDUNDANT_GRAD = redundantGradient([2, 4], [1, 3], [0, 1, 2, 3], [0, 1, 2, 3]);

export const EXPECTED_DEST_4_2_2 = destinationExpectation(4, 2, 2);
export const RESOURCE_PAIRS = (() => {
  const pairs = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      pairs.push({
        experts: [i, j],
        destinations: new Set([Math.floor(i / 2), Math.floor(j / 2)]).size,
      });
    }
  }
  return pairs;
})();

export const RESOURCES_12SM = Object.freeze({
  sms: 12,
  allocated: 128,
  directRequested: Math.min(12, 9),
  hybridRequested: 12 * 16 + 1,
  direct: Math.min(Math.min(12, 9), 128),
  hybrid: Math.min(12 * 16 + 1, 128),
});

export const BUDGET_OVERLAP = communicationBudget(15.2, { preferOverlap: true });
export const BUDGET_NO_OVERLAP = communicationBudget(15.2, { preferOverlap: false });
export const SERIAL_A = [1, 4, 1];
export const SERIAL_B = [0.7, 4.5, 0.8];

export const FINAL_REBUILT = weightedExpertRow(
  finalToken.input,
  finalToken.current,
  finalToken.gates,
);
export const FINAL_STALE = weightedExpertRow(finalToken.input, finalToken.cached, finalToken.gates);
export const FINAL_RECEIPT = expertReturnReceipt(
  finalToken.input,
  finalToken.current,
  finalToken.gates,
);

/** Build-time mathematical invariant assertions backed by validateModel() and assertEqual. */
export function verifyDeepEpInvariants() {
  verifyInvariant(validateModel() === true, 'DeepEP reference validateModel() passes');

  verifyInvariant(
    LEDGER_BASE.slots.length === 8 && LEDGER_BASE.destinations === 8,
    'baseline ledger: 8 slots, 8 destinations',
  );
  verifyInvariant(
    LEDGER_DEDUP.slots.length === 8 && LEDGER_DEDUP.destinations === 7,
    'same-rank dedup: 8 slots, 7 destinations',
  );
  verifyInvariant(
    LEDGER_MASKED.slots.length === 7 && LEDGER_MASKED.destinations === 7,
    'masked -1 slot: 7 slots, 7 destinations',
  );
  verifyInvariant(
    LEDGER_DEDUP.counts.join(',') === '1,2,3,2' && LEDGER_MASKED.counts.join(',') === '1,2,3,1',
    'per-expert counts for dedup and masked routes',
  );

  verifyInvariant(
    LAYOUT_ALIGNED4.starts.join(',') === '0,4' &&
      LAYOUT_ALIGNED4.endpoints.join(',') === '3,5' &&
      LAYOUT_ALIGNED4.capacity === 8 &&
      LAYOUT_ALIGNED4.valid.filter(Boolean).length === 4,
    'aligned layout [3,1] align 4 -> starts [0,4], endpoints [3,5], cap 8',
  );

  verifyApprox(REPLAY_COMP.cached.restored.a[0], 1.9, 1e-12, 'cached a[0] = 1.9');
  verifyApprox(REPLAY_COMP.rebuilt.restored.a[0], 3.3, 1e-12, 'rebuilt a[0] = 3.3');
  verifyApprox(DOUBLE_GATE_A0, 0.85, 1e-12, 'double-gated a[0] = 0.85');
  verifyApprox(EXPERT3_REPLAY.detached.a[0], 2.5, 1e-12, 'detached a[0] = 2.5');
  verifyApprox(EXPERT3_REPLAY.detached.a[1], 1.8, 1e-12, 'detached a[1] = 1.8');

  verifyApprox(BACKWARD_INPUT_GRAD[0], 3.8, 1e-12, 'backward input grad[0] = 3.8');
  verifyApprox(BACKWARD_INPUT_GRAD[1], 1.9, 1e-12, 'backward input grad[1] = 1.9');
  verifyInvariant(
    BACKWARD_GATE_GRAD[0] === 2 && BACKWARD_GATE_GRAD[1] === 8,
    'backward gate gradients [2, 8]',
  );

  verifyInvariant(
    ROUND_BF16_MID === 256 && ROUND_STAGED === 0 && ROUND_SINGLE === 1,
    'BF16 ties-to-even 257->256, staged 0 vs FP32 1',
  );

  verifyApprox(TOPO_LOGICAL_GBS, 104.8576, 1e-6, '100 MiB / 1 ms = 104.8576 GB/s');
  verifyApprox(TOPO_REMOTE_GBS, 52.4288, 1e-6, '50 MiB / 1 ms = 52.4288 GB/s');

  verifyInvariant(
    FP8_GROUPS === 56 &&
      FP8_SCALE_BYTES === 224 &&
      FP8_TOTAL_BYTES === 7392 &&
      BF16_TOTAL_BYTES === 14336,
    'FP8 7392 B vs BF16 14336 B row bytes',
  );
  verifyApprox(BF16_OVER_FP8_RATIO, 1.9393939, 1e-4, 'BF16/FP8 ratio ~1.94x');
  verifyInvariant(SCALE_WRONG_DECODE === 20 && SCALE_RIGHT_DECODE === 5, 'scale decode 20 vs 5');

  verifyInvariant(
    DEFERRED_2.dependencyCalls === 2 &&
      DEFERRED_2.hookCalls === 1 &&
      DEFERRED_2.results[0].length === 4 &&
      DEFERRED_2.results[1] === null,
    'V2.5 deferred wait one-shot hook contract',
  );
  verifyInvariant(
    REDUNDANT_GRAD[0] === 3 && REDUNDANT_GRAD[1] === 7,
    'redundant gradient [2,4]+[1,3]=[3,7]',
  );

  verifyApprox(EXPECTED_DEST_4_2_2, 5 / 3, 1e-12, 'E[dests](4,2,2) = 5/3');
  verifyInvariant(
    RESOURCES_12SM.direct === 9 &&
      RESOURCES_12SM.hybridRequested === 193 &&
      RESOURCES_12SM.hybrid === 128,
    '12 SM QP sizing: direct 9, hybrid 193 -> 128',
  );
  verifyInvariant(
    BUDGET_OVERLAP.sms === 20 &&
      BUDGET_NO_OVERLAP.sms === 64 &&
      BUDGET_OVERLAP.direct === 9 &&
      BUDGET_OVERLAP.hybridRequest === 321 &&
      BUDGET_OVERLAP.hybrid === 128,
    '15.2 SM budget: 20/64 SMs, direct 9, hybrid 321 -> 128',
  );
  verifyApprox(sum(SERIAL_A), 6.0, 1e-12, 'serial A = 6.0 ms');
  verifyApprox(sum(SERIAL_B), 6.0, 1e-12, 'serial B = 6.0 ms');

  verifyApprox(FINAL_REBUILT.output[0], 5.6, 1e-12, 'token z rebuilt x = 5.6');
  verifyApprox(FINAL_REBUILT.output[1], -2.8, 1e-12, 'token z rebuilt y = -2.8');
  verifyApprox(FINAL_STALE.output[0], 6.8, 1e-12, 'token z stale x = 6.8');
  verifyApprox(FINAL_STALE.output[1], -3.4, 1e-12, 'token z stale y = -3.4');
}

export function fmtVec(row, digits = 2) {
  return '[' + row.map((v) => v.toFixed(digits)).join(', ') + ']';
}

export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 1.1, endMargin = 0.5) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.2, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function remainAfterDuration(c, cueId, maxDur = 0.45, endMargin = 0.4) {
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
  strokeColor = COSMOS.amber,
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
 * 3D Rig 1: Orbiting Dual-GPU NVLink & Expert-Slot Dispatch/Combine Hardware Stage.
 * GPU 0 (left) owns E0 & E1; GPU 1 (right) owns E2 & E3.
 * `routeMode`: 0 = E0/E3 split, 1 = E2/E3 dedup on GPU 1, 2 = combine return / reverse flow.
 */
export function buildDualGpuNvlinkRig3d(
  routeMode,
  travelVal,
  expandVal,
  phaseVal,
  { x = 470, y = 12, unit = 94 } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.03,
    distance: 16.4,
    unit,
    focus: [0, 0, 0.72],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.5, 3.5],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.36,
  });

  // GPU 0 deck (left) and GPU 1 deck (right)
  const gpu0 = solidBox3d(-3.15, -1.75, 0.08, 2.25, 3.5, 0.34, '#142a52', {
    opacity: 0.86,
    edgeColor: ROLE.rank0,
    edgeWidth: 2.0,
  });
  const gpu1 = solidBox3d(0.9, -1.75, 0.08, 2.25, 3.5, 0.34, '#2a1c4f', {
    opacity: 0.86,
    edgeColor: ROLE.rank1,
    edgeWidth: 2.0,
  });

  // Four expert compute monoliths: E0, E1 on GPU 0; E2, E3 on GPU 1
  const e0 = solidBox3d(-2.75, -1.35, 0.44, 1.45, 1.1, 0.92, '#134466', {
    opacity: 0.88,
    edgeColor: ROLE.nvlink,
    edgeWidth: 1.9,
  });
  const e1 = solidBox3d(-2.75, 0.25, 0.44, 1.45, 1.1, 0.92, '#173866', {
    opacity: 0.84,
    edgeColor: ROLE.rank0,
    edgeWidth: 1.8,
  });
  const e2 = solidBox3d(1.3, -1.35, 0.44, 1.45, 1.1, 0.92, '#4d2b16', {
    opacity: 0.88,
    edgeColor: ROLE.brand,
    edgeWidth: 1.9,
  });
  const e3 = solidBox3d(1.3, 0.25, 0.44, 1.45, 1.1, 0.92, '#432066', {
    opacity: 0.88,
    edgeColor: ROLE.rank1,
    edgeWidth: 1.9,
  });

  // NVLink / RDMA bridge arcs between GPU 0 and GPU 1
  const bridgeTop = bezier3d([-0.9, -0.5, 0.45], [0.9, -0.5, 0.45], 1.15, ROLE.nvlink, 3.0);
  const bridgeBot = bezier3d([-0.9, 0.5, 0.45], [0.9, 0.5, 0.45], 1.15, ROLE.brand, 3.0);
  const localFanA = bezier3d([0.9, 0.0, 0.72], [2.02, -0.8, 1.38], 0.55, ROLE.good, 2.4);
  const localFanB = bezier3d([0.9, 0.0, 0.72], [2.02, 0.8, 1.38], 0.55, ROLE.good, 2.4);

  // Traveling token wireframe packet crossing GPU 0 -> GPU 1
  const packetCage = wireframeSlab3d(
    () => {
      const t = Math.max(0, Math.min(1, travelVal.value));
      const p = bridgeTop.evalAt(t);
      return [p[0], p[1] + 0.5, p[2] + 0.16];
    },
    0.38,
    0.38,
    0.26,
    { color: ROLE.token, width: 2.8, glow: 10 },
  );

  // Active expert highlight cage (moves from E0 to E2 as routeMode transitions 0 -> 1)
  const activeExpertCage = wireframeSlab3d(
    () => {
      const m = Math.max(0, Math.min(1, routeMode.value));
      return [-2.02 + m * 4.04, -0.8, 0.92];
    },
    0.8,
    0.62,
    0.52,
    { color: ROLE.token, width: 2.6, glow: 9 },
  );

  // Flowing photons along interconnect and local expert fanout
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const rev = routeMode.value >= 1.5;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      const t1 = rev ? 1 - u1 : u1;
      const t2 = rev ? 1 - u2 : u2;
      const pts = [
        bridgeTop.evalAt(t1),
        bridgeTop.evalAt(t2),
        bridgeBot.evalAt(t1),
        bridgeBot.evalAt(t2),
      ];
      if (expandVal.value > 0.15) {
        const ef = Math.max(0.05, Math.min(1, expandVal.value));
        pts.push(localFanA.evalAt(ef), localFanB.evalAt(ef));
      }
      return pts;
    },
    { size: 8.5, color: ROLE.token, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...gpu0,
    ...gpu1,
    ...e0,
    ...e1,
    ...e2,
    ...e3,
    bridgeTop.node,
    bridgeBot.node,
    localFanA.node,
    localFanB.node,
    ...packetCage,
    ...activeExpertCage,
    photons,
  );
  return { view };
}

/**
 * 3D Rig 2: Orbiting 2-Node 4-Rank Direct vs Hybrid RDMA Rail + NVLink Fabric with Visibility Fence.
 */
export function buildFabricTopologyRig3d(
  hybridVal,
  fenceVal,
  phaseVal,
  { x = 470, y = 12, unit = 92 } = {},
) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 16.8,
    unit,
    focus: [0, 0, 0.8],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.6, 3.6],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.9,
    color: '#223152',
    opacity: 0.36,
  });

  // Node A base (left) & Node B base (right)
  const nodeA = solidBox3d(-3.3, -1.85, 0.06, 2.25, 3.7, 0.24, '#13274a', {
    opacity: 0.82,
    edgeColor: ROLE.rank0,
    edgeWidth: 1.8,
  });
  const nodeB = solidBox3d(1.05, -1.85, 0.06, 2.25, 3.7, 0.24, '#2a1847', {
    opacity: 0.82,
    edgeColor: ROLE.rank1,
    edgeWidth: 1.8,
  });

  // 4 GPU ranks: R0 (-2.2, -0.9), R1 (-2.2, 0.9), R2 (2.2, -0.9), R3 (2.2, 0.9)
  const r0 = solidBox3d(-2.75, -1.45, 0.34, 1.15, 1.05, 0.86, '#1a497d', {
    opacity: 0.9,
    edgeColor: ROLE.rank0,
    edgeWidth: 2.0,
  });
  const r1 = solidBox3d(-2.75, 0.4, 0.34, 1.15, 1.05, 0.86, '#143963', {
    opacity: 0.84,
    edgeColor: ROLE.rank0,
    edgeWidth: 1.8,
  });
  const r2 = solidBox3d(1.6, -1.45, 0.34, 1.15, 1.05, 0.86, '#4d2b16', {
    opacity: 0.9,
    edgeColor: ROLE.rdma,
    edgeWidth: 2.0,
  });
  const r3 = solidBox3d(1.6, 0.4, 0.34, 1.15, 1.05, 0.86, '#124e63', {
    opacity: 0.9,
    edgeColor: ROLE.nvlink,
    edgeWidth: 2.0,
  });

  // Direct cross-fabric link R0 -> R3, Hybrid RDMA rail R0 -> R2, Hybrid NVLink hop R2 -> R3
  const directArc = bezier3d([-1.6, -0.92, 1.15], [1.6, 0.92, 1.15], 1.15, ROLE.rank0, 2.4);
  const railArc = bezier3d([-1.6, -0.92, 1.2], [1.6, -0.92, 1.2], 1.4, ROLE.rdma, 3.2);
  const nvHop = bezier3d([2.18, -0.4, 1.2], [2.18, 0.4, 1.2], 0.72, ROLE.nvlink, 3.2);

  // Optional system-scope visibility fence plane (rises at x=0.0 when fenceVal > 0)
  const fenceWall = wireframeSlab3d(
    () => [0.0, 0.0, -0.8 + fenceVal.value * 1.95],
    0.08,
    1.75,
    0.82,
    {
      color: ROLE.bad,
      width: 2.6,
      glow: 9,
    },
  );

  // Photons switching between Direct arc and Hybrid (RDMA rail + NVLink hop)
  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.52) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      const h = hybridVal.value;
      if (h < 0.45) {
        return [directArc.evalAt(u1), directArc.evalAt(u2)];
      }
      return [railArc.evalAt(u1), railArc.evalAt(u2), nvHop.evalAt(u1), nvHop.evalAt(u2)];
    },
    { size: 8.5, color: ROLE.token, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...nodeA,
    ...nodeB,
    ...r0,
    ...r1,
    ...r2,
    ...r3,
    directArc.node,
    railArc.node,
    nvHop.node,
    ...fenceWall,
    photons,
  );
  return { view };
}

/**
 * 3D Rig 3: Orbiting Aligned Expert Slot Buffer & Capacity Envelope Deck.
 * Renders 8 aligned slots (valid cyan prisms vs rose/amber padding gaps) with sweeping spotlight cage.
 */
export function buildAlignedSlotBuffer3d(
  alignVal,
  focusSlotVal,
  phaseVal,
  { x = 470, y = 12, unit = 94 } = {},
) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 16.4,
    unit,
    focus: [0, 0, 0.68],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.5, 3.5],
    y: [-2.6, 2.6],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.36,
  });

  // Symmetric HBM slab
  const deck = solidBox3d(-3.3, -1.25, 0.06, 6.6, 2.5, 0.28, '#122240', {
    opacity: 0.84,
    edgeColor: ROLE.rank0,
    edgeWidth: 1.8,
  });

  // 8 slots along X from -2.95 to +2.95 (width 0.64, stride 0.78)
  const slotCenterX = (i) => -2.73 + i * 0.78;
  const slots = [];
  for (let i = 0; i < 8; i++) {
    const cx = slotCenterX(i);
    const isValidAligned = i === 0 || i === 1 || i === 2 || i === 4;
    const isGap = !isValidAligned;
    slots.push(
      ...solidBox3d(
        cx - 0.3,
        -0.75,
        0.36,
        0.6,
        1.5,
        isGap ? 0.35 : 1.05,
        isGap ? '#3b1c2a' : '#115066',
        {
          opacity: isGap ? 0.62 : 0.9,
          edgeColor: isGap ? ROLE.bad : ROLE.nvlink,
          edgeWidth: isGap ? 1.5 : 2.1,
        },
      ),
    );
  }

  // Active slot spotlight wireframe cage (moves along focusSlotVal 0..7)
  const spotCage = wireframeSlab3d(
    () => {
      const sIdx = Math.max(0, Math.min(7, focusSlotVal.value));
      return [slotCenterX(sIdx), 0, 0.96];
    },
    0.36,
    0.84,
    0.62,
    { color: ROLE.token, width: 2.8, glow: 10 },
  );

  // Overhead inverse-map bridge arc linking valid slots back to source deck
  const invArcA = bezier3d(
    [slotCenterX(0), 0, 1.45],
    [slotCenterX(2), 0, 1.45],
    0.9,
    ROLE.nvlink,
    2.5,
  );
  const invArcB = bezier3d(
    [slotCenterX(4), 0, 1.45],
    [slotCenterX(0), 0, 1.45],
    1.35,
    ROLE.good,
    2.5,
  );

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.5) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      const a = alignVal.value;
      return [
        invArcA.evalAt(u1),
        invArcB.evalAt(u2),
        [slotCenterX(a > 0.5 ? 4 : 3), 0, 1.65 + Math.sin(p * 1.4) * 0.2],
      ];
    },
    { size: 8.5, color: ROLE.token, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...deck, ...slots, ...spotCage, invArcA.node, invArcB.node, photons);
  return { view };
}

/**
 * 3D Rig 4: Orbiting FP8 + Violet Scale-Factor Wire & BF16/FP32 Precision Columns.
 */
export function buildFp8ScaleWireRig3d(
  scaleVal,
  cursorVal,
  phaseVal,
  { x = 470, y = 12, unit = 94 } = {},
) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.03,
    distance: 16.2,
    unit,
    focus: [0, 0, 0.78],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.5, 3.5],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.36,
  });

  // Back lane: BF16 full-width tall blue bar (256 B / group or 14,336 B row)
  const bf16Slab = solidBox3d(-2.9, 0.55, 0.14, 5.8, 0.95, 1.15, '#194078', {
    opacity: 0.86,
    edgeColor: ROLE.rank0,
    edgeWidth: 2.0,
  });

  // Front lane: FP8 half-width cyan value slab (128 B / group) + violet 4-byte scale prism
  const fp8ValSlab = solidBox3d(-2.9, -1.35, 0.14, 2.9, 0.95, 0.95, '#105066', {
    opacity: 0.9,
    edgeColor: ROLE.nvlink,
    edgeWidth: 2.1,
  });
  const scalePrism = solidBox3d(0.15, -1.35, 0.14, 0.65, 0.95, 1.32, '#4b2380', {
    opacity: 0.92,
    edgeColor: ROLE.meta,
    edgeWidth: 2.2,
  });

  // Receiver decode chamber (right)
  const decoder = solidBox3d(1.65, -1.4, 0.14, 1.35, 1.1, 1.2, '#134c3a', {
    opacity: 0.88,
    edgeColor: ROLE.good,
    edgeWidth: 2.0,
  });

  // Active scale/precision spotlight cage sweeping between Group 0 (left) and Group 1 (right)
  const cursorCage = wireframeSlab3d(
    () => {
      const c = Math.max(0, Math.min(1, cursorVal.value));
      return [-1.45 + c * 1.92, -0.88, 0.78 + scaleVal.value * 0.25];
    },
    0.72,
    0.62,
    0.66,
    { color: ROLE.token, width: 2.8, glow: 10 },
  );

  const wireBf = bezier3d([-2.6, 1.02, 1.32], [2.4, 1.02, 1.32], 0.75, ROLE.rank0, 2.6);
  const wireFp8 = bezier3d([-1.45, -0.88, 1.12], [2.25, -0.88, 1.36], 0.95, ROLE.nvlink, 2.8);
  const wireSf = bezier3d([0.48, -0.88, 1.48], [2.25, -0.88, 1.36], 0.85, ROLE.meta, 2.8);

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      const pts = [wireBf.evalAt(u1), wireFp8.evalAt(u1), wireFp8.evalAt(u2)];
      if (scaleVal.value > 0.15) pts.push(wireSf.evalAt(u1), wireSf.evalAt(u2));
      return pts;
    },
    { size: 8.5, color: ROLE.token, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...bf16Slab,
    ...fp8ValSlab,
    ...scalePrism,
    ...decoder,
    ...cursorCage,
    wireBf.node,
    wireFp8.node,
    wireSf.node,
    photons,
  );
  return { view };
}

/**
 * 3D Rig 5: Orbiting GPU SM Partition & Multi-Stream EventOverlap Execution Stage.
 * Upper track: Communication SMs + RDMA QPs; Middle track: Independent Compute; Lower track: Expert GEMMs.
 */
export function buildStreamOverlapRig3d(
  smSplitVal,
  waitGateVal,
  phaseVal,
  { x = 470, y = 12, unit = 94 } = {},
) {
  const view = cinematic3d({
    theta: -0.75,
    phi: 1.03,
    distance: 16.4,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.5, 3.5],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.36,
  });

  // Stream 0: Communication dispatch/combine slab (amber)
  const commSlab = solidBox3d(-3.1, -1.65, 0.16, 3.6, 0.85, 0.92, '#592e14', {
    opacity: 0.9,
    edgeColor: ROLE.brand,
    edgeWidth: 2.1,
  });
  // Stream 1: Independent compute overlap slab (cyan)
  const indepSlab = solidBox3d(-1.8, -0.35, 0.16, 2.5, 0.85, 0.82, '#104c63', {
    opacity: 0.88,
    edgeColor: ROLE.nvlink,
    edgeWidth: 2.0,
  });
  // Stream 2: Expert consumer GEMM slab (emerald)
  const expertSlab = solidBox3d(0.85, 0.95, 0.16, 2.3, 0.85, 1.15, '#12543d', {
    opacity: 0.9,
    edgeColor: ROLE.good,
    edgeWidth: 2.1,
  });

  // Synchronization EventOverlap gate pillar connecting Comm end -> Expert start
  const syncGate = wireframeSlab3d(
    () => [0.65, 0.35, 0.15 + waitGateVal.value * 0.95],
    0.22,
    1.55,
    0.72,
    { color: ROLE.token, width: 2.8, glow: 10 },
  );

  // Dynamic SM budget partition beam moving along X as smSplitVal shifts
  const smBar = line3d(
    () => [-3.1 + smSplitVal.value * 5.8, -2.15, 0.1],
    () => [-3.1 + smSplitVal.value * 5.8, 2.15, 0.1],
    { color: ROLE.meta, width: 5.5, glow: 10, blend: 'screen', onTop: true },
  );

  const eventArc = bezier3d([0.5, -1.22, 1.1], [0.95, 1.38, 1.32], 0.95, ROLE.token, 3.0);
  const indepArc = bezier3d([-1.75, 0.08, 1.0], [0.65, 0.08, 1.0], 0.65, ROLE.nvlink, 2.4);

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      const pts = [indepArc.evalAt(u1), indepArc.evalAt(u2)];
      if (waitGateVal.value > 0.2) pts.push(eventArc.evalAt(u1), eventArc.evalAt(u2));
      return pts;
    },
    { size: 8.5, color: ROLE.token, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(
    floor,
    ...commSlab,
    ...indepSlab,
    ...expertSlab,
    ...syncGate,
    smBar,
    eventArc.node,
    indepArc.node,
    photons,
  );
  return { view };
}

/**
 * 3D Rig 6: Orbiting 3-Tier DeepJIT / Version Stack / Engram NIC Doorbell Tower.
 */
export function buildJitAndStackRig3d(stageVal, phaseVal, { x = 470, y = 12, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.02,
    distance: 16.2,
    unit,
    focus: [0, 0, 1.0],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.3, 3.3],
    y: [-3.0, 3.0],
    z: 0,
    step: 0.82,
    color: '#223152',
    opacity: 0.36,
  });

  // Base tier: Device GPU CUBIN / Registered Window / NIC Doorbell Flush
  const baseSlab = solidBox3d(-1.85, -1.4, 0.12, 3.7, 2.8, 0.5, '#11473b', {
    opacity: 0.88,
    edgeColor: ROLE.good,
    edgeWidth: 2.1,
  });
  // Mid tier: DeepJIT Compiler / NCCL Gin / Unaggregated Tail Gate
  const midSlab = solidBox3d(-1.45, -1.1, 1.06, 2.9, 2.2, 0.52, '#4a2815', {
    opacity: 0.9,
    edgeColor: ROLE.brand,
    edgeWidth: 2.2,
  });
  // Top tier: Python Host API / Specialization Key / Peer Fetch Queue
  const topSlab = solidBox3d(-1.65, -1.25, 2.02, 3.3, 2.5, 0.46, '#1a3c74', {
    opacity: 0.86,
    edgeColor: ROLE.rank0,
    edgeWidth: 2.0,
  });

  const activeCage = wireframeSlab3d(
    () => {
      const st = Math.max(0, Math.min(2, stageVal.value));
      return [0, 0, 2.25 - st * 0.94];
    },
    1.9,
    1.48,
    0.34,
    { color: ROLE.token, width: 2.8, glow: 10 },
  );

  const rails = [
    line3d([-1.15, -0.82, 0.62], [-1.15, -0.82, 2.02], {
      color: ROLE.nvlink,
      width: 2.4,
      opacity: 0.72,
    }),
    line3d([1.15, -0.82, 0.62], [1.15, -0.82, 2.02], {
      color: ROLE.nvlink,
      width: 2.4,
      opacity: 0.72,
    }),
    line3d([-1.15, 0.82, 0.62], [-1.15, 0.82, 2.02], {
      color: ROLE.brand,
      width: 2.4,
      opacity: 0.72,
    }),
    line3d([1.15, 0.82, 0.62], [1.15, 0.82, 2.02], {
      color: ROLE.brand,
      width: 2.4,
      opacity: 0.72,
    }),
  ];

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const u1 = (((p * 0.55) % 1) + 1) % 1;
      const u2 = (u1 + 0.5) % 1;
      return [
        [-1.15, -0.82, 2.02 - u1 * 1.4],
        [1.15, 0.82, 2.02 - u1 * 1.4],
        [1.15, -0.82, 2.02 - u2 * 1.4],
        [-1.15, 0.82, 2.02 - u2 * 1.4],
      ];
    },
    { size: 8.5, color: ROLE.token, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ...baseSlab, ...midSlab, ...topSlab, ...activeCage, ...rails, photons);
  return { view };
}

export {
  COSMOS,
  Deferred,
  Node,
  alignedLayout,
  aura,
  bf16,
  circle,
  cinematic3d,
  combine,
  communicationBudget,
  completeLayerReceipt,
  curve3d,
  deferredWaitTrace,
  delay,
  destinationExpectation,
  dot,
  expertReturnReceipt,
  expertThreeReplay,
  finalToken,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  hidden,
  ledger,
  line,
  line3d,
  linear,
  linearGradient,
  markDecoration,
  metricReadout,
  orbitScene,
  par,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  redundantGradient,
  resolveAlignedSlot,
  routeReplayComparison,
  roundTripAligned,
  routes,
  rule,
  source,
  sum,
  txt,
  weightedExpertRow,
  wireframeSlab3d,
};
