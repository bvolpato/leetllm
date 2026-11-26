// Shared math models, invariants, semantic palette, and 3D hardware cluster rigs for model-parallelism.
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
  denseMLP,
  expertAssignments,
  historyOwnership,
  localPlacement,
  mergeMass,
  parallelMLP,
  pipeline,
  pipelineOccupancy,
  usefulCost,
  weightLedger,
} from '../../films/model-parallelism/arithmetic.mjs';
import { B, W, X, mpA, mpB, mpBias } from '../../films/model-parallelism/fixtures.mjs';
import {
  checkpointGB,
  deviceGB,
  halfGB,
  poolGB,
  reserveGB,
} from '../../films/model-parallelism/memory-rails.mjs';
import {
  attentionExample,
  mpFresh,
  mpReference,
  shards,
} from '../../films/model-parallelism/model.mjs';
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
  gpu0: COSMOS.blue,
  gpu1: COSMOS.cyan,
  comm: COSMOS.gold,
  expert: COSMOS.violet,
  good: COSMOS.emerald,
  bad: COSMOS.rose,
  warn: COSMOS.amber,
});

export const LEDGER_1 = weightLedger(35e9, 2, 80e9, 16e9, 1);
export const LEDGER_2 = weightLedger(35e9, 2, 80e9, 16e9, 2);
export const LEDGER_4 = weightLedger(35e9, 2, 80e9, 16e9, 4);
export const SHARDS = shards();
export const DENSE_REF = denseMLP(mpReference.input);
export const MP_MEAN = parallelMLP(mpReference.input, 'mean');
export const MP_DUP_BIAS = parallelMLP(mpReference.input, 'sum', true);
export const DENSE_FRESH = denseMLP(mpFresh.input);

export const PIPE_1 = pipelineOccupancy(3, 1);
export const PIPE_4 = pipelineOccupancy(3, 4);
export const PIPE_12 = pipelineOccupancy(3, 12);
export const PIPE_LAT_COMPUTE = 2;
export const PIPE_LAT_TRANSFER = 0.2;
export const PIPE_LAT_TOTAL = 3 * PIPE_LAT_COMPUTE + 2 * PIPE_LAT_TRANSFER;

export const HISTORY_DCP = historyOwnership({ tp: 8, heads: 2, lanes: 4, positions: 32 });
export const ATTN_EQ = attentionExample(false);
export const ATTN_BOOST = attentionExample(true);
export const MOE = expertAssignments();

export const PLACE_LOCAL = localPlacement([35, 15], poolGB);
export const PLACE_FRESH_INIT = localPlacement([31, 15], poolGB);
export const PLACE_FRESH_BAL = localPlacement([23, 23], poolGB);

export const COST_A = usefulCost(6, 620);
export const COST_B = usefulCost(12, 900);

export const KV_1M_BYTES = 2 * 80 * 1e6 * 8 * 128 * 2;
export const KV_1M_GIB = KV_1M_BYTES / 2 ** 30;
export const KV_1M_PER4_GIB = KV_1M_GIB / 4;
export const DEVICE_80GB_IN_GIB = 80e9 / 2 ** 30;

export const RING_ACT_KIB = (8 * 4096 * 2) / 1024; // 64 KiB
export const RING_SEND_KIB = (RING_ACT_KIB * 2 * (4 - 1)) / 4; // 96 KiB
export const RING_WIRE_MS = ((160 * RING_SEND_KIB * 1024) / 300e9) * 1000; // 0.0524288 ms

export function verifyModelParallelInvariants() {
  verifyApprox(LEDGER_1.payload / 1e9, 70, 1e-12, '35B BF16 payload = 70 GB');
  verifyApprox(LEDGER_1.free / 1e9, -6, 1e-12, '1 GPU deficit = -6 GB');
  verifyInvariant(LEDGER_1.minimumRanks === 2 && !LEDGER_1.fits, 'Minimum 2 GPUs for 70 GB');
  verifyApprox(LEDGER_2.weight / 1e9, 35, 1e-12, '2 GPUs weight = 35 GB');
  verifyApprox(LEDGER_2.free / 1e9, 29, 1e-12, '2 GPUs free = 29 GB');
  verifyApprox(LEDGER_4.weight / 1e9, 17.5, 1e-12, '4 GPUs weight = 17.5 GB');
  verifyApprox(LEDGER_4.free / 1e9, 46.5, 1e-12, '4 GPUs free = 46.5 GB');

  verifyInvariant(
    SHARDS.y.join(',') === '1,4,6,5' &&
      SHARDS.first.join(',') === '1,4' &&
      SHARDS.second.join(',') === '16,1' &&
      SHARDS.total.join(',') === '17,5',
    'Linear, column, row, and pair shard arithmetic',
  );

  for (let i = 0; i < 2; i++) {
    verifyApprox(mpReference.output[i], DENSE_REF[i], 1e-12, `GeLU ref[${i}]`);
    verifyApprox(mpFresh.output[i], DENSE_FRESH[i], 1e-12, `GeLU fresh[${i}]`);
  }
  verifyInvariant(
    Math.abs(MP_MEAN.output[0] - DENSE_REF[0]) > 1 &&
      Math.abs(MP_DUP_BIAS.output[0] - DENSE_REF[0]) > 0.4,
    'Faulty mean and duplicate bias diverge from dense reference',
  );

  verifyApprox(PIPE_1.utilization, 1 / 3, 1e-12, 'PP m=1 utilization 1/3');
  verifyApprox(PIPE_4.utilization, 2 / 3, 1e-12, 'PP m=4 utilization 2/3');
  verifyApprox(PIPE_4.idleFraction, 1 / 3, 1e-12, 'PP m=4 idle 1/3');
  verifyApprox(PIPE_4.overhead, 0.5, 1e-12, 'PP m=4 overhead 1/2');
  verifyApprox(PIPE_12.utilization, 36 / 42, 1e-12, 'PP m=12 utilization 36/42');
  verifyApprox(PIPE_LAT_TOTAL, 6.4, 1e-12, 'PP 3 stages + 2 handoffs = 6.4 ms');

  verifyInvariant(
    HISTORY_DCP.plainPairs === 256 &&
      HISTORY_DCP.uniquePairs === 64 &&
      HISTORY_DCP.physicalPairs === 64 &&
      HISTORY_DCP.perRank === 8,
    'DCP 256 -> 64 physical pairs, 8/rank',
  );

  verifyApprox(ATTN_EQ.shares[2], 1 / 3, 1e-12, 'Equal attention share 1/3');
  verifyApprox(ATTN_EQ.output, 3, 1e-12, 'Equal attention output 3');
  verifyApprox(ATTN_EQ.wrongMean, 4.5, 1e-12, 'Naive mean 4.5');
  verifyApprox(ATTN_BOOST.shares[2], 0.5, 1e-12, 'Boosted attention share 1/2');
  verifyApprox(ATTN_BOOST.output, 4.5, 1e-12, 'Boosted attention output 4.5');

  verifyInvariant(
    MOE.loads.join(',') === '8,4' && MOE.outputs[3] === 6,
    'MoE loads [8,4] and T3 output 6',
  );
  verifyApprox(MOE.skew, 8 / 6, 1e-12, 'MoE skew 8/6');

  verifyInvariant(
    PLACE_LOCAL.free.join(',') === '-6,14' &&
      !PLACE_LOCAL.fits &&
      PLACE_FRESH_INIT.free.join(',') === '-2,14' &&
      PLACE_FRESH_BAL.free.join(',') === '6,6' &&
      PLACE_FRESH_BAL.fits,
    'Per-rank local memory placement checks',
  );

  verifyApprox(COST_A, 2.688172043, 1e-6, 'Cost A ~$2.69/M');
  verifyApprox(COST_B, 3.703703703, 1e-6, 'Cost B ~$3.70/M');
  verifyApprox(KV_1M_GIB, 305.17578125, 1e-6, '1M KV = 305.18 GiB');
  verifyApprox(KV_1M_PER4_GIB, 76.2939453125, 1e-6, '1M KV / 4 = 76.29 GiB');
  verifyInvariant(KV_1M_PER4_GIB > DEVICE_80GB_IN_GIB, '76.3 GiB > 74.5 GiB device');
  verifyApprox(RING_SEND_KIB, 96, 1e-12, 'TP=4 ring send = 96 KiB');
  verifyApprox(RING_WIRE_MS, 0.0524288, 1e-6, '160x96 KiB @ 300 GB/s = 0.0524 ms');
}

export function safeDuration(c, startOffset = 0.08, endMargin = 0.55) {
  return Math.max(0.35, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 0.6, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.18, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function remainAfterDuration(c, cueId, maxDur = 0.55, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.16, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

export function remainBeatDuration(c, beatIndex, maxDur = 0.5, endMargin = 0.55) {
  const beat = c.beats[beatIndex];
  const start = beat ? beat.start : c.start;
  const avail = Math.max(0.18, c.end - start - endMargin);
  return Math.min(maxDur, avail);
}

export function runPhase(s, c, phaseVal, target = 14, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** P5-safe non-overlapping view transition: old hits 0 before new rises above 0. */
export function swapViews(s, fromVal, toVal, fadeOut = 0.16, fadeIn = 0.22) {
  s.play(
    par(
      fromVal.to(0, { duration: fadeOut }),
      delay(toVal.to(1, { duration: fadeIn }), fadeOut + 0.04),
    ),
  );
}

export function fmtNum(v, decimals = 4) {
  const s = Number(v.toFixed(decimals)).toString();
  return s.replace('-', '−');
}

export function fmtFixed(v, decimals = 2) {
  return v.toFixed(decimals).replace('-', '−');
}

export function fmtVec(values, decimals = 2) {
  return '[' + values.map((v) => fmtNum(v, decimals)).join(', ') + ']';
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

/**
 * Orbiting 3D NVLink GPU Ring/Cluster (2, 4, or 8 GPUs) with dynamic per-rank pillar height
 * and glowing collective photons.
 */
export function buildCluster3d(
  heightFn,
  phaseVal,
  { x = 445, y = 25, unit = 100, gpus = 4, radius = 2.15, ringColor = ROLE.comm, rankColors } = {},
) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.02,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.72],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.2, 3.2],
    y: [-3.2, 3.2],
    z: 0,
    step: 0.8,
    color: '#223152',
    opacity: 0.34,
  });

  const ringLoop = curve3d(
    (t) => [Math.cos(t * Math.PI * 2) * radius, Math.sin(t * Math.PI * 2) * radius, 0.32],
    0,
    1,
    { color: ringColor, width: 3.0, glow: 8, blend: 'screen', samples: 48, opacity: 0.85 },
  );

  const resolveH = typeof heightFn === 'function' ? heightFn : () => heightFn.value;
  const pillars = [];
  for (let i = 0; i < gpus; i++) {
    const ang = (i / gpus) * Math.PI * 2;
    const gx = Math.cos(ang) * radius;
    const gy = Math.sin(ang) * radius;
    const col = rankColors
      ? rankColors[i % rankColors.length]
      : i % 2 === 0
        ? ROLE.gpu0
        : ROLE.gpu1;
    pillars.push(
      ...wireframeSlab3d(
        () => [gx, gy, 0.08 + Math.max(0.14, resolveH(i)) * 0.9],
        0.38,
        0.38,
        0.08,
        {
          color: col,
          width: 2.2,
          glow: 6,
        },
      ),
      line3d(
        () => [gx, gy, 0.06],
        () => [gx, gy, 0.1 + Math.max(0.15, resolveH(i)) * 1.85],
        {
          color: col,
          width: gpus <= 2 ? 22 : gpus <= 4 ? 16 : 11,
          glow: 10,
          blend: 'screen',
          onTop: true,
        },
      ),
    );
  }

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const pts = [];
      const count = Math.max(4, gpus * 2);
      for (let i = 0; i < count; i++) {
        const ang = ((((p * 0.42 + i / count) % 1) + 1) % 1) * Math.PI * 2;
        pts.push([Math.cos(ang) * radius, Math.sin(ang) * radius, 0.42 + Math.sin(ang * 2) * 0.16]);
      }
      return pts;
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ringLoop, ...pillars, photons);
  return { view };
}

/**
 * 3D Dual-Node Hybrid TP=4 x PP=2 cluster: two NVLink rings connected by a glowing inter-node PP bridge.
 */
export function buildHybridNodes3d(phaseVal, { x = 435, y = 25, unit = 88 } = {}) {
  const view = cinematic3d({
    theta: -0.68,
    phi: 1.06,
    distance: 17.2,
    unit,
    focus: [0, 0, 0.6],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-4.2, 4.2],
    y: [-2.8, 2.8],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  const nodes = [floor];
  const nodeOffsets = [
    { cx: -2.15, col: ROLE.gpu0 },
    { cx: 2.15, col: ROLE.gpu1 },
  ];
  const r = 1.1;

  for (const { cx, col } of nodeOffsets) {
    nodes.push(
      curve3d(
        (t) => [cx + Math.cos(t * Math.PI * 2) * r, Math.sin(t * Math.PI * 2) * r, 0.35],
        0,
        1,
        {
          color: col,
          width: 2.8,
          glow: 8,
          blend: 'screen',
          samples: 36,
        },
      ),
    );
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const gx = cx + Math.cos(ang) * r;
      const gy = Math.sin(ang) * r;
      nodes.push(
        line3d([gx, gy, 0.08], [gx, gy, 1.35], {
          color: col,
          width: 14,
          glow: 9,
          blend: 'screen',
          onTop: true,
        }),
      );
    }
  }

  // Inter-node PP bridge
  nodes.push(
    curve3d((t) => [-1.05 + t * 2.1, 0, 0.9 + Math.sin(t * Math.PI) * 0.75], 0, 1, {
      color: COSMOS.gold,
      width: 3.4,
      glow: 10,
      blend: 'screen',
      samples: 28,
    }),
    points3d(
      () => {
        const p = phaseVal.value;
        const pts = [];
        for (let k = 0; k < 3; k++) {
          const t = (((p * 0.45 + k / 3) % 1) + 1) % 1;
          pts.push([-1.05 + t * 2.1, 0, 0.9 + Math.sin(t * Math.PI) * 0.75]);
        }
        return pts;
      },
      { size: 9, color: COSMOS.gold, glow: 13, blend: 'screen', onTop: true },
    ),
  );

  view.add(...nodes);
  return { view };
}

export {
  B,
  COSMOS,
  Node,
  W,
  X,
  attentionExample,
  aura,
  checkpointGB,
  circle,
  cinematic3d,
  curve3d,
  delay,
  denseMLP,
  deviceGB,
  dot,
  expertAssignments,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  halfGB,
  heroTitle,
  historyOwnership,
  line,
  line3d,
  linear,
  linearGradient,
  localPlacement,
  mergeMass,
  metricReadout,
  mpA,
  mpB,
  mpBias,
  mpFresh,
  mpReference,
  orbitScene,
  par,
  parallelMLP,
  parametricSurface,
  pipeline,
  pipelineOccupancy,
  points3d,
  polyPath,
  poolGB,
  radialGradient,
  rect,
  reserveGB,
  rule,
  shards,
  surface,
  txt,
  usefulCost,
  weightLedger,
  wireframeSlab3d,
};
