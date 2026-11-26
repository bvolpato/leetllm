// Shared math models, invariants, and 3D multi-axis Megatron mesh cinema rigs for Deep Dive - Megatron.
import { gridPlane3d, group, line, line3d, linear, points3d, rect } from 'vizmatic/stage';
import {
  checkpointLayout,
  expertSkewTrace,
  forwardWave,
} from '../../films/deep-dive-megatron/construction.mjs';
import {
  checkpointRow as CHECKPOINT_ROW,
  context as CTX_SPLITS,
  trackedColumn as TRACKED_COL,
} from '../../films/deep-dive-megatron/fixtures.mjs';
import {
  coords as meshCoords,
  expertCapacityReceipt,
  group as meshGroup,
  largerMlp,
  mlp as smallMlp,
  momentumReceipt,
  ownedSgd,
  rankOf,
  trainingSchedule,
} from '../../films/deep-dive-megatron/model.mjs';
import { validateModel } from '../../films/deep-dive-megatron/validation.mjs';
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
  CHECKPOINT_ROW,
  COSMOS,
  CTX_SPLITS,
  TRACKED_COL,
  aura,
  checkpointLayout,
  cinematic3d,
  expertCapacityReceipt,
  expertSkewTrace,
  forwardWave,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  heroTitle,
  largerMlp,
  line,
  meshCoords,
  meshGroup,
  momentumReceipt,
  orbitScene,
  ownedSgd,
  rankOf,
  rect,
  smallMlp,
  trainingSchedule,
  txt,
  wireframeSlab3d,
};

export const ROLE = Object.freeze({
  tp: COSMOS.blue,
  cp: COSMOS.cyan,
  dp: COSMOS.emerald,
  pp: COSMOS.violet,
  ep: COSMOS.gold,
  good: COSMOS.emerald,
  bad: COSMOS.rose,
  warn: COSMOS.amber,
  dim: '#4a5572',
});

export const SMALL_MLP = smallMlp();
export const LARGE_MLP = largerMlp();
export const OWNED_SGD = ownedSgd();
export const WAVE_DP4 = forwardWave(8);
export const WAVE_DP8 = forwardWave(4);
export const RESUME_FULL = momentumReceipt(2, 0.4, 1, 1);
export const RESUME_RESET = momentumReceipt(2, 0, 1, 1);
export const EARNED_FULL = momentumReceipt(1.5, 0.8, 2, 2);
export const EARNED_RESET = momentumReceipt(1.5, 0, 2, 2);
export const EARNED_STALE = momentumReceipt(1.5, 0.8, 1, 2);
export const EXP_CAP = expertCapacityReceipt(4);

export function verifyMegatronInvariants() {
  validateModel();
  verifyInvariant(CHECKPOINT_ROW[TRACKED_COL] === 1.5, 'tracked col 6 weight 1.5');
  verifyInvariant(meshGroup(3, 'tp').join(',') === '0,1,2,3', 'rank 3 TP peers 0..3');
  verifyInvariant(meshGroup(3, 'pp').join(',') === '3,35', 'rank 3 PP peers 3,35');
  verifyInvariant(meshGroup(3, 'dp').join(',') === '3,11,19,27', 'rank 3 DP peers 3,11,19,27');
  verifyInvariant(meshGroup(27, 'tp').join(',') === '24,25,26,27', 'rank 27 TP peers 24..27');
  verifyInvariant(meshGroup(27, 'pp').join(',') === '27,59', 'rank 27 PP peers 27,59');
  verifyApprox(SMALL_MLP.output[0], SMALL_MLP.serial[0], 1e-12, 'small MLP TP == serial[0]');
  verifyApprox(LARGE_MLP.output[0], LARGE_MLP.serial[0], 1e-12, 'large MLP TP == serial[0]');
  verifyInvariant(WAVE_DP4.slots === 18 && WAVE_DP8.slots === 10, 'pipeline slots 18 vs 10');
  verifyApprox(OWNED_SGD.updated[0], 0.8, 1e-12, 'SGD updated[0] 0.8');
  verifyApprox(RESUME_FULL.nextWeight, 1.88, 1e-12, 'resume full 1.88');
  verifyApprox(RESUME_RESET.nextWeight, 1.9, 1e-12, 'resume reset 1.90');
  verifyApprox(EARNED_FULL.nextWeight, 1.26, 1e-12, 'earned full 1.26');
  verifyApprox(EARNED_RESET.nextWeight, 1.3, 1e-12, 'earned reset 1.30');
  verifyApprox(EARNED_STALE.nextWeight, 1.51, 1e-12, 'earned stale 1.51');
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

/** Orbiting 3D 2x2x2 (8-rank) or 4x4x2 Megatron Parallelism Cube Lattice. */
export function buildMegatronMesh3d(axisVal, phaseVal, { x = 475, y = 25, unit = 94 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 0.98,
    distance: 15.0,
    unit,
    focus: [0, 0, 0.9],
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

  // 2x2x2 cube of ranks (tp x dp x pp)
  const nodes = [];
  for (let pp = 0; pp < 2; pp++) {
    for (let dp = 0; dp < 2; dp++) {
      for (let tp = 0; tp < 2; tp++) {
        const rank = tp + dp * 2 + pp * 4;
        const pos = [(tp - 0.5) * 2.1, (dp - 0.5) * 2.1, 0.5 + pp * 1.6];
        nodes.push({ rank, tp, dp, pp, pos });
        const isR3 = rank === 3;
        view.add(
          ...wireframeSlab3d(pos, 0.42, 0.42, 0.42, {
            color: isR3 ? COSMOS.gold : pp === 0 ? ROLE.tp : ROLE.pp,
            width: isR3 ? 3.0 : 1.9,
            glow: isR3 ? 12 : 6,
          }),
        );
      }
    }
  }

  // Axis links from Rank 3 (tp=1, dp=1, pp=0) to TP=2, DP=1, PP=7
  const r3 = nodes[3].pos;
  view.add(
    line3d(r3, nodes[2].pos, { color: ROLE.tp, width: 3.2, glow: 9, blend: 'screen' }),
    line3d(r3, nodes[1].pos, { color: ROLE.dp, width: 3.2, glow: 9, blend: 'screen' }),
    line3d(r3, nodes[7].pos, { color: ROLE.pp, width: 3.2, glow: 9, blend: 'screen' }),
  );

  view.add(
    points3d(
      () => {
        const a = Math.round(axisVal.value); // 0=TP, 1=PP, 2=DP
        const u = (phaseVal.value * 0.65) % 1;
        const dst = a === 1 ? nodes[7].pos : a === 2 ? nodes[1].pos : nodes[2].pos;
        return [
          [
            r3[0] + (dst[0] - r3[0]) * u,
            r3[1] + (dst[1] - r3[1]) * u,
            r3[2] + (dst[2] - r3[2]) * u,
          ],
        ];
      },
      { size: 9, color: COSMOS.gold, glow: 14, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}

/** Orbiting 3D Attention vs Folded Expert Parallel World (256 GPUs refactored). */
export function buildFoldedWorld3d(foldVal, phaseVal, { x = 475, y = 25, unit = 92 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 0.96,
    distance: 15.2,
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

  // 4 pipeline layers, each split into 4 glowing slabs
  for (let pp = 0; pp < 4; pp++) {
    const z = 0.35 + pp * 0.62;
    view.add(
      ...wireframeSlab3d([0, 0, z], 2.0, 1.35, 0.16, {
        color: pp % 2 === 0 ? ROLE.tp : ROLE.ep,
        width: 2.2,
        glow: 7,
      }),
    );
  }

  view.add(
    points3d(
      () => {
        const u = (phaseVal.value * 0.55) % 1;
        const pts = [];
        for (let k = 0; k < 4; k++) {
          const ang = (u + k * 0.25) * Math.PI * 2;
          const r = foldVal.value > 0.5 ? 1.85 : 1.15;
          pts.push([Math.cos(ang) * r, Math.sin(ang) * 0.9, 0.4 + k * 0.62]);
        }
        return pts;
      },
      { size: 8, color: COSMOS.gold, glow: 12, blend: 'screen', onTop: true },
    ),
  );

  return { view };
}
