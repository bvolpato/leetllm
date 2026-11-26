// Shared math models, invariants, color semantics, and 3D distributed GPU collective cinema rigs for fsdp-zero.
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
import { BASE, GRADIENT_CONTRIBUTIONS, SHARDS } from '../../films/fsdp-zero/fixtures.mjs';
import {
  adamContinuation,
  capacitySnapshot,
  contextAttentionConstruction,
  onlineAttention,
  perRank,
  pipelineSchedule,
  recipeLedger,
  reduceScatter,
  stageSnapshot,
} from '../../films/fsdp-zero/model.mjs';
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
  weights: COSMOS.blue,
  grads: COSMOS.violet,
  opt: COSMOS.gold,
  act: COSMOS.rose,
  comm: COSMOS.cyan,
  good: COSMOS.emerald,
  warn: COSMOS.amber,
  bad: COSMOS.rose,
});

export const LEDGER_70_16 = recipeLedger(70, 16, 3);
export const LEDGER_70_24 = recipeLedger(70, 24, 3);
export const LEDGER_70_32 = recipeLedger(70, 32, 3);
export const LEDGER_70_8 = recipeLedger(70, 8, 3);
export const LEDGER_30_16_S2 = recipeLedger(30, 16, 2);
export const LEDGER_30_16_S3 = recipeLedger(30, 16, 3);

export const ZERO_0 = perRank(0, 4);
export const ZERO_1 = perRank(1, 4);
export const ZERO_2 = perRank(2, 4);
export const ZERO_3 = perRank(3, 4);

export const RS_BASE = reduceScatter(GRADIENT_CONTRIBUTIONS);
export const RS_CHANGED_GRID = GRADIENT_CONTRIBUTIONS.map((row, r) =>
  r === 3 ? [row[0], row[1], 9, row[3]] : [...row],
);
export const RS_CHANGED = reduceScatter(RS_CHANGED_GRID);
export const ADAM_CONT = adamContinuation();
export const PIPE_1F1B = pipelineSchedule(4, 8, true);
export const PIPE_GPIPE = pipelineSchedule(4, 8, false);
export const RING_ATTN = onlineAttention();

export function verifyFsdpInvariants() {
  verifyApprox(LEDGER_70_16.full.weights, 140, 1e-12, '70B BF16 weights 140 GB');
  verifyApprox(LEDGER_70_16.parts.weights, 8.75, 1e-12, '70B / 16 shard 8.75 GB');
  verifyApprox(LEDGER_70_16.total, 70, 1e-12, '70B / 16 total state 70 GB');
  verifyApprox(LEDGER_70_24.total, 1120 / 24, 1e-9, '70B / 24 total state ~46.67 GB');
  verifyApprox(LEDGER_70_32.total, 35, 1e-12, '70B / 32 total state 35 GB');
  verifyApprox(LEDGER_70_8.total, 140, 1e-12, 'HSDP 70B / 8 total state 140 GB');
  verifyApprox(LEDGER_30_16_S2.total, 86.25, 1e-12, '30B S2 / 16 = 86.25 GB');
  verifyApprox(LEDGER_30_16_S3.total, 30, 1e-12, '30B S3 / 16 = 30 GB');

  verifyInvariant(
    ZERO_0.weights + ZERO_0.gradients + ZERO_0.optimizer === 8 &&
      ZERO_1.weights + ZERO_1.gradients + ZERO_1.optimizer === 5 &&
      ZERO_2.weights + ZERO_2.gradients + ZERO_2.optimizer === 3.5 &&
      ZERO_3.weights + ZERO_3.gradients + ZERO_3.optimizer === 2,
    'ZeRO 0/1/2/3 teaching ledger totals 8, 5, 3.5, 2',
  );
  verifyInvariant(RS_BASE[2] === 18 && RS_CHANGED[2] === 21, 'reduceScatter col C 18 -> 21');
  verifyApprox(ADAM_CONT.resumed, 1 / 70, 1e-12, 'Adam resumed delta ~0.01429');
  verifyApprox(ADAM_CONT.reset, 0.1, 1e-12, 'Adam reset delta 0.1');
  verifyInvariant(
    PIPE_1F1B.maxLive.join(',') === '4,3,2,1' && PIPE_GPIPE.maxLive.join(',') === '8,8,8,8',
    '1F1B vs GPipe max live activations',
  );
  verifyApprox(RING_ATTN.at(-1).output, 8, 1e-12, 'Ring Attention online merge output = 8');
  verifyInvariant(
    capacitySnapshot(0, 14 / 21.07).peak === 7 &&
      capacitySnapshot(0, 1).peak === 5.5 &&
      capacitySnapshot(1, 1).peak === 8.5,
    'capacitySnapshot peaks 7, 5.5, 8.5',
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

/**
 * Orbiting 3D NVLink GPU Ring (4 or 8 GPUs) with dynamic sharded state height & streaming collective photons.
 */
export function buildGpuRing3d(
  heightVal,
  phaseVal,
  { x = 420, y = 20, unit = 104, gpus = 4, color = ROLE.comm } = {},
) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.02,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.75],
  }).at(x, y);

  const floor = gridPlane3d({
    x: [-3.3, 3.3],
    y: [-3.3, 3.3],
    z: 0,
    step: 0.85,
    color: '#223152',
    opacity: 0.34,
  });

  const radius = 2.2;
  const ringLoop = curve3d(
    (t) => [Math.cos(t * Math.PI * 2) * radius, Math.sin(t * Math.PI * 2) * radius, 0.35],
    0,
    1,
    { color, width: 3.0, glow: 8, blend: 'screen', samples: 48, opacity: 0.85 },
  );

  const pillars = [];
  for (let i = 0; i < gpus; i++) {
    const ang = (i / gpus) * Math.PI * 2;
    const gx = Math.cos(ang) * radius;
    const gy = Math.sin(ang) * radius;
    pillars.push(
      line3d(
        () => [gx, gy, 0.08],
        () => [gx, gy, 0.12 + Math.max(0.18, heightVal.value) * 1.9],
        {
          color: i === 0 ? COSMOS.gold : color,
          width: gpus <= 4 ? 18 : 11,
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
      for (let i = 0; i < gpus * 2; i++) {
        const ang = ((((p * 0.45 + i / (gpus * 2)) % 1) + 1) % 1) * Math.PI * 2;
        pts.push([Math.cos(ang) * radius, Math.sin(ang) * radius, 0.45 + Math.sin(ang * 2) * 0.18]);
      }
      return pts;
    },
    { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(floor, ringLoop, ...pillars, photons);
  return { view };
}

export {
  BASE,
  COSMOS,
  GRADIENT_CONTRIBUTIONS,
  Node,
  SHARDS,
  adamContinuation,
  aura,
  capacitySnapshot,
  circle,
  cinematic3d,
  contextAttentionConstruction,
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
  onlineAttention,
  orbitScene,
  parametricSurface,
  perRank,
  pipelineSchedule,
  points3d,
  polyPath,
  radialGradient,
  recipeLedger,
  rect,
  reduceScatter,
  rule,
  stageSnapshot,
  surface,
  txt,
  wireframeSlab3d,
};
