// Shared math models, invariants, and 3D/vector cinema helpers for verifiable-rewards (RLVR / GRPO).
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
  arithmeticEvaluation,
  categoricalUpdate,
  groupStatistics,
  rlvrClipped,
  rlvrDecimalCheck,
  rlvrGroupUpdate,
  rlvrKl,
  rlvrMixedProbability,
  rlvrReduction,
  rlvrRepair,
  rlvrSoftmax,
} from '../../films/verifiable-rewards/arithmetic.mjs';
import {
  capacityPair,
  capacityScore,
  freshProduct,
  freshRecords,
  openingFields,
} from '../../films/verifiable-rewards/capacity.mjs';
import { ANSWERS, EVALUATION_FIXTURE, REWARDS } from '../../films/verifiable-rewards/fixtures.mjs';
import { validateModel } from '../../films/verifiable-rewards/model.mjs';
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
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export const GROUP_4 = groupStatistics(REWARDS);
export const GROUP_8_REWARDS = Object.freeze([1, 0, 1, 0, 1, 0, 1, 0]);
export const GROUP_8 = groupStatistics(GROUP_8_REWARDS);
export const UPDATE_4 = categoricalUpdate(GROUP_4.advantages, 1);
export const UPDATE_8 = rlvrGroupUpdate(GROUP_8_REWARDS, 0.1, 1);
export const EVAL_DATA = arithmeticEvaluation();
export const REPAIR_OLD = rlvrRepair(0);
export const REPAIR_WEAK = rlvrRepair(1);
export const REPAIR_STRICT = rlvrRepair(2);
export const STEP_STRICT = rlvrGroupUpdate(REPAIR_STRICT.rewards, 0.3, 1);
export const STEP_WEAK = rlvrGroupUpdate(REPAIR_WEAK.rewards, 0.3, 1);
export const KL_BASE = rlvrKl(Math.log(4));
export const KL_SHIFT = rlvrKl(Math.log(4) + 0.2);
export const MIXED_01_64 = rlvrMixedProbability(0.01, 64);
export const RED_RESP = rlvrReduction(0);
export const RED_TOK = rlvrReduction(1);
export const CLIP_POS = rlvrClipped(1.4, 1);
export const CLIP_NEG = rlvrClipped(0.7, -1);
export const DEC_PASS = rlvrDecimalCheck('50.36', '50.35', '0.01');
export const DEC_FAIL = rlvrDecimalCheck('50.361', '50.35', '0.01');

/** Build-time mathematical verification of every core RLVR / GRPO identity. */
export function verifyVerifiableRewardsInvariants() {
  verifyInvariant(validateModel() === true, 'model.mjs validateModel() must pass');
  verifyInvariant(14 * 12 === 168 && freshProduct === 252, 'rack multiplication products');
  verifyInvariant(
    capacityScore(openingFields[0].join(' '), 168, false) === 1,
    'single box passes weak',
  );
  verifyInvariant(
    capacityScore(openingFields[1].join(' then '), 168, false) === 1,
    'double box passes weak',
  );
  verifyInvariant(
    capacityScore(openingFields[1].join(' then '), 168, true) === 0,
    'double box fails strict',
  );
  verifyApprox(GROUP_4.mean, 0.5, 1e-12, '4-group mean');
  verifyApprox(GROUP_4.std, 0.5, 1e-12, '4-group std');
  verifyApprox(UPDATE_4.rewardedMass, 0.6224593312, 1e-6, '4-group updated mass');
  verifyApprox(UPDATE_8.expectedReward, 0.50625, 1e-4, '8-group updated mass');
  verifyApprox(KL_BASE.full, 0.192744757, 1e-5, 'KL base value ~0.193');
  verifyApprox(KL_BASE.fullGradient, 0.221807097, 1e-4, 'full KL gradient ~0.222');
  verifyApprox(KL_BASE.fixedGradient, 0.3, 1e-9, 'fixed-weight KL gradient 0.300');
  verifyApprox(MIXED_01_64.mixed, 0.474416, 1e-3, 'mixed group prob at p=0.01, G=64');
  verifyApprox(RED_RESP.loss, 1.0, 1e-9, 'equal response mean loss');
  verifyApprox(RED_TOK.loss, 2 / 3, 1e-9, 'global token mean loss');
  verifyApprox(CLIP_POS.surrogate, 1.2, 1e-9, 'positive clipped surrogate');
  verifyApprox(CLIP_NEG.surrogate, -0.8, 1e-9, 'negative clipped surrogate');
  verifyApprox(REPAIR_WEAK.mean, 2 / 3, 1e-9, 'weak 3-group mean');
  verifyApprox(REPAIR_STRICT.mean, 1 / 3, 1e-9, 'strict 3-group mean');
  verifyInvariant(
    STEP_STRICT.probabilities[0] > 0.37 && STEP_STRICT.probabilities[1] < 0.32,
    'strict step moves',
  );
  verifyInvariant(STEP_WEAK.probabilities[1] > 0.35, 'weak step boosts contradictory answer');
  verifyInvariant(DEC_PASS.pass === true && DEC_FAIL.pass === false, 'exact decimal tolerance');
}

export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

export function remainDuration(c, cueId, maxDur = 2.0, endMargin = 0.55) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.25, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

export function runPhase(s, c, phaseVal, target = 10, startOffset = 0.08) {
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
  { fill = '#0d1426', radius = 10, glow = 6, opacity = 0.92, dash, width = 2.2 } = {},
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

export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.72) {
  const opts = { resolution: [1, 1], color: fillColor, opacity, mesh: false, shaded: true };
  const edges = wireframeSlab3d(
    [x0 + dx * 0.5, y0 + dy * 0.5, z0 + dz * 0.5],
    dx * 0.5,
    dy * 0.5,
    dz * 0.5,
    { color: edgeColor, width: 2.2, glow: 6 },
  );
  return [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0 + dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
    parametricSurface((u, v) => [x0 + dx, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    ...edges,
  ];
}

/** Orbiting 3D GRPO group-advantage wave & rollout pillars. */
export function buildGroupWave3d(phaseVal, { x = 400, y = 25, rewards = [1, 0, 1, 0] } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 14.8,
    unit: 102,
    focus: [0, 0, 0.5],
  }).at(x, y);

  // Mean baseline plane at z = 0.5
  const meanPlane = parametricSurface(
    (u, v) => [-2.4 + u * 4.8, -1.6 + v * 3.2, 0.6],
    [0, 1],
    [0, 1],
    {
      resolution: [6, 4],
      color: '#1f2b48',
      mesh: COSMOS.gold,
      meshOpacity: 0.36,
      meshWidth: 0.9,
      opacity: 0.32,
      shaded: false,
    },
  );
  const pillars = [];
  rewards.forEach((r, idx) => {
    const px = -1.8 + idx * 1.2;
    const pass = r > 0.5;
    const h = pass ? 1.55 : 0.28;
    pillars.push(
      ...box3d(
        px - 0.34,
        -0.55,
        0,
        0.68,
        1.1,
        h,
        pass ? '#103b33' : '#3a1421',
        pass ? COSMOS.emerald : COSMOS.rose,
        0.82,
      ),
    );
  });

  const wave = curve3d(
    (t) => {
      const wx = -2.2 + t * 4.4;
      const wz = 0.6 + 0.55 * Math.sin(t * Math.PI * 3.5 + phaseVal.value * 0.6);
      return [wx, 0.95, wz];
    },
    0,
    1,
    { color: COSMOS.cyan, width: 3.4, glow: 9, samples: 40, onTop: true },
  );

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      return rewards.map((r, idx) => {
        const px = -1.8 + idx * 1.2;
        const frac = (p * 0.45 + idx * 0.25) % 1;
        return [px, 0, r > 0.5 ? 0.6 + frac * 1.15 : 0.6 - frac * 0.45];
      });
    },
    {
      colorAt: (idx) => (rewards[idx] > 0.5 ? COSMOS.emerald : COSMOS.rose),
      radius: 6,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(meanPlane, ...pillars, wave, photons);
  return view;
}

/** Orbiting 3D PPO/GRPO clipped surrogate surface over (ratio r, advantage A). */
export function buildClipSurface3d(phaseVal, { x = 390, y = 25 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 15.6,
    unit: 98,
    focus: [0, 0, 0.1],
  }).at(x, y);

  const surf = surface(
    (r, adv) => {
      const clipped = Math.min(1.2, Math.max(0.8, r));
      return Math.min(r * adv, clipped * adv) * 0.9;
    },
    {
      x: [0.4, 1.6],
      y: [-1.2, 1.2],
      resolution: [28, 24],
      colors: ['#3b1224', '#6b2243', '#1c2b56', '#1c6d92', '#5ce1e6', '#6ee7b7'],
      mesh: '#80d8ff',
      meshOpacity: 0.22,
      meshWidth: 0.6,
      opacity: 0.88,
    },
  );

  const railLo = line3d([0.8, -1.2, 0.95], [0.8, 1.2, 0.95], {
    color: COSMOS.gold,
    width: 3.2,
    glow: 8,
    onTop: true,
  });
  const railHi = line3d([1.2, -1.2, 1.15], [1.2, 1.2, 1.15], {
    color: COSMOS.gold,
    width: 3.2,
    glow: 8,
    onTop: true,
  });
  const tracer = points3d(
    () => {
      const f = (phaseVal.value * 0.35) % 1;
      const r = 0.5 + f * 1.0;
      const clipped = Math.min(1.2, Math.max(0.8, r));
      return [
        [r, 1.0, Math.min(r, clipped) * 0.9 + 0.08],
        [r, -1.0, Math.min(-r, -clipped) * 0.9 + 0.08],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.emerald : COSMOS.rose),
      radius: 6.5,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(surf, railLo, railHi, tracer);
  return view;
}

export {
  ANSWERS,
  COSMOS,
  EVALUATION_FIXTURE,
  Node,
  REWARDS,
  aura,
  capacityPair,
  capacityScore,
  categoricalUpdate,
  circle,
  cinematic3d,
  curve3d,
  dot,
  freshProduct,
  freshRecords,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  groupStatistics,
  guardedDynamic,
  heroTitle,
  line,
  line3d,
  linear,
  linearGradient,
  metricReadout,
  morphEquation,
  openingFields,
  orbitScene,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  rlvrClipped,
  rlvrDecimalCheck,
  rlvrGroupUpdate,
  rlvrKl,
  rlvrMixedProbability,
  rlvrReduction,
  rlvrRepair,
  rlvrSoftmax,
  rule,
  surface,
  txt,
  wireframeSlab3d,
};
