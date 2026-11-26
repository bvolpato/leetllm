// Shared math models, invariants, and 3D/vector cinema helpers for preference-alignment (RLHF / PPO / DPO / GRPO).
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
  bounded,
  prefBound,
  prefLerp,
  prefLoss,
  sigmoid,
  wordCount,
} from '../../films/preference-alignment/arithmetic.mjs';
import {
  alignmentFreshStep,
  alignmentMissingPair,
  comparisonLoss,
  evaluationState,
  introState,
  lossPresentation,
  methodState,
  pairLayout,
} from '../../films/preference-alignment/construction.mjs';
import {
  ALIGNMENT_TOKEN_FIXTURE,
  CONTROLLED_CASES,
  EXAMPLE,
  ROUTE_FIXTURE,
  SHORTCUT_PAIRS,
} from '../../films/preference-alignment/fixtures.mjs';
import {
  alignmentBudget,
  alignmentClipping,
  alignmentGae,
  alignmentGroup,
  alignmentReduction,
  alignmentRelease,
  alignmentSoftmax,
  alignmentTilt,
  alignmentTokenScores,
  alignmentWilson,
  dpoExample,
  twoLogitState,
  twoLogitTrace,
} from '../../films/preference-alignment/model.mjs';
import { validateAlignmentExtension } from '../../films/preference-alignment/validation.mjs';
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
  morphEquation,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export const DPO_WORKED = dpoExample();
export const LOGIT_TRACE = twoLogitTrace(6, 0.4, EXAMPLE.beta);
export const BUDGET_FULL = alignmentBudget(70e9, true);
export const BUDGET_NO_CRITIC = alignmentBudget(70e9, false);
export const TILT_WORKED = alignmentTilt([0.5, 0.5], [Math.log(3), 0], 1);
export const GAE_FULL = alignmentGae([0, 0, 1], [0, 0, 0, 0], 1, 1);
export const GAE_HALF = alignmentGae([0, 0, 1], [0, 0, 0, 0], 1, 0.5);
export const TOKEN_BASE = alignmentTokenScores(0, 0, true);
export const TOKEN_BOOST = alignmentTokenScores(1, 0, true);
export const TOKEN_EXCLUDED = alignmentTokenScores(0, 1000, true);
export const TOKEN_NO_EOS = alignmentTokenScores(0, 0, false);
export const RED_SUM = alignmentReduction(0);
export const RED_MEAN = alignmentReduction(1);
export const RELEASE_HOLD = alignmentRelease(184, 400, 48);
export const RELEASE_EDGE = alignmentRelease(222, 400, 20);
export const RELEASE_PASS = alignmentRelease(222, 400, 19);
export const GROUP_MIXED = alignmentGroup([1, 0, 0.5, 1]);
export const GROUP_FLAT = alignmentGroup([1, 1, 1, 1]);
export const FRESH_STEP = alignmentFreshStep(1);
export const UNSEEN_START = alignmentMissingPair(0);
export const UNSEEN_END = alignmentMissingPair(1);
export const EVAL_SNAPSHOT = evaluationState(2, 1);

export const DISPLACE_DATA = Object.freeze({
  chosen: { ref: -8.5, before: -8.2, after: -9.1 },
  rejected: { ref: -9.1, before: -9.5, after: -11.2 },
  beta: 0.1,
});

export function ktoLoss(logRatio, desirable, beta = 0.5, z0 = 0.2) {
  const sign = desirable ? 1 : -1;
  return 1 - sigmoid(sign * beta * (logRatio - z0));
}

export function ipoLoss(margin, tau = 0.1) {
  const target = 1 / (2 * tau);
  return (margin - target) ** 2;
}

export function klBernoulliUniform(p) {
  const q = Math.max(1e-9, Math.min(1 - 1e-9, p));
  return q * Math.log(2 * q) + (1 - q) * Math.log(2 * (1 - q));
}

/** Build-time mathematical verification of every spoken invariant in preference-alignment. */
export function verifyPreferenceAlignmentInvariants() {
  verifyInvariant(validateAlignmentExtension() === true, 'validateAlignmentExtension() must pass');

  // Route DPO worked example
  verifyApprox(DPO_WORKED.chosenRatio, 0.6, 1e-12, 'route chosen log ratio');
  verifyApprox(DPO_WORKED.rejectedRatio, -0.4, 1e-12, 'route rejected log ratio');
  verifyApprox(DPO_WORKED.margin, 1.0, 1e-12, 'route margin');
  verifyApprox(DPO_WORKED.probability, 0.6224593312, 1e-6, 'route preference prob');
  verifyApprox(DPO_WORKED.loss, 0.4740769842, 1e-6, 'route DPO loss');
  verifyApprox(-Math.log(0.5), 0.6931471806, 1e-6, 'starting ln 2 loss');

  // Bradley-Terry judge (1.8 vs 0.7 -> gap 1.1)
  const btWin = sigmoid(1.1);
  verifyApprox(btWin, 0.7502601, 1e-5, 'BT 1.1 gap prob ~75%');
  verifyApprox(-Math.log(btWin), 0.287335, 1e-4, 'BT first loss ~0.287');
  verifyApprox(-Math.log(sigmoid(-1.1)), 1.387335, 1e-4, 'BT swapped loss ~1.387');

  // KL expectation on [0.8, 0.2] vs [0.5, 0.5]
  const klVal = 0.8 * Math.log(0.8 / 0.5) + 0.2 * Math.log(0.2 / 0.5);
  verifyApprox(Math.log(0.8 / 0.5), 0.4700036, 1e-4, 'positive log ratio ~0.470');
  verifyApprox(Math.log(0.2 / 0.5), -0.9162907, 1e-4, 'negative log ratio ~-0.916');
  verifyApprox(klVal, 0.1927448, 1e-4, 'expected forward KL ~0.193');

  // GAE backward recurrence
  verifyInvariant(
    GAE_FULL.advantages.every((v) => Math.abs(v - 1) < 1e-12),
    'GAE lambda=1 -> [1, 1, 1]',
  );
  verifyApprox(GAE_HALF.advantages[0], 0.25, 1e-12, 'GAE lambda=0.5 t=0');
  verifyApprox(GAE_HALF.advantages[1], 0.5, 1e-12, 'GAE lambda=0.5 t=1');
  verifyApprox(GAE_HALF.advantages[2], 1.0, 1e-12, 'GAE lambda=0.5 t=2');

  // PPO clipping at rho = 1.5 and 0.5
  verifyApprox(alignmentClipping(1.5, 1).surrogate, 1.2, 1e-12, 'PPO clip +1 @ 1.5');
  verifyApprox(alignmentClipping(1.5, -1).surrogate, -1.5, 1e-12, 'PPO clip -1 @ 1.5');
  verifyApprox(alignmentClipping(0.5, 1).surrogate, 0.5, 1e-12, 'PPO clip +1 @ 0.5');
  verifyApprox(alignmentClipping(0.5, -1).surrogate, -0.8, 1e-12, 'PPO clip -1 @ 0.5');

  // Four-role 70B state budget
  verifyApprox(BUDGET_FULL.total, 2520, 1e-9, '70B four-role budget 2520 GB');
  verifyApprox(BUDGET_NO_CRITIC.total, 1400, 1e-9, '70B critic-free budget 1400 GB');
  verifyApprox(BUDGET_NO_CRITIC.saved, 16 / 36, 1e-9, '44.4% critic savings');

  // Optimal policy tilt
  verifyApprox(TILT_WORKED.masses[0], 1.5, 1e-12, 'tilt mass 1.5');
  verifyApprox(TILT_WORKED.masses[1], 0.5, 1e-12, 'tilt mass 0.5');
  verifyApprox(TILT_WORKED.partition, 2.0, 1e-12, 'tilt Z = 2');
  verifyApprox(TILT_WORKED.probabilities[0], 0.75, 1e-12, 'tilt opt prob 0.75');

  // Two-logit trace
  verifyApprox(LOGIT_TRACE[0].gradient[0], -0.25, 1e-12, 'step 0 chosen grad -0.25');
  verifyApprox(LOGIT_TRACE[1].logits[0], 0.1, 1e-12, 'step 1 chosen logit +0.1');

  // CPU token toy
  verifyApprox(TOKEN_BASE.chosen, -0.992994, 1e-4, 'CPU toy chosen logp');
  verifyApprox(TOKEN_BASE.rejected, -1.882, 1e-3, 'CPU toy rejected logp');
  verifyApprox(TOKEN_BASE.loss, 0.662, 1e-3, 'CPU toy base DPO loss');
  verifyApprox(TOKEN_BOOST.loss, 0.646, 1e-3, 'CPU toy boosted DPO loss');
  verifyApprox(TOKEN_EXCLUDED.loss, TOKEN_BASE.loss, 1e-12, 'excluded logits unchanged');

  // Sum vs per-token mean reversal
  verifyApprox(RED_SUM.margin, 0.1, 1e-12, 'summed margin +0.10');
  verifyApprox(RED_MEAN.margin, -0.05, 1e-12, 'per-token mean margin -0.05');

  // Beta dual role
  verifyApprox(sigmoid(Math.log(3) / 0.1), 0.999983, 1e-5, 'beta=0.1 ideal P(A)');
  verifyApprox(sigmoid(Math.log(3) / 0.5), 0.9, 1e-9, 'beta=0.5 ideal P(A)');
  verifyApprox(sigmoid(Math.log(3) / 1.0), 0.75, 1e-9, 'beta=1.0 ideal P(A)');

  // Likelihood displacement
  verifyApprox(prefLoss(0.1 * 0.7), 0.658746, 1e-3, 'P-7 initial loss ~0.659');
  verifyApprox(prefLoss(0.1 * 1.5), 0.620942, 1e-3, 'P-7 displaced loss ~0.621');

  // Unseen probability mass
  verifyApprox(UNSEEN_START.loss, UNSEEN_END.loss, 1e-12, 'unseen C preserves DPO loss');
  verifyApprox(UNSEEN_START.loss, 0.62623, 1e-4, 'unseen C loss ~0.626');

  // Evaluation shortcut
  verifyInvariant(
    SHORTCUT_PAIRS.every((r) => wordCount(r.chosen) < wordCount(r.other)),
    'shortcut matches all 3 training pairs',
  );
  verifyInvariant(
    CONTROLLED_CASES.every((r) => wordCount(r.good) === 8 && wordCount(r.bad) === 8),
    'controlled pairs have 8 words each',
  );
  verifyInvariant(EVAL_SNAPSHOT.shortcutCorrect === 1, 'tie rule gets 1 of 2 right');

  // Release Wilson intervals
  verifyApprox(RELEASE_HOLD.rate, 0.46, 1e-9, '184/400 = 46%');
  verifyApprox(RELEASE_HOLD.lower, 0.4117, 1e-3, '184/400 Wilson lower ~41.2%');
  verifyApprox(RELEASE_HOLD.upper, 0.509, 1e-3, '184/400 Wilson upper ~50.9%');
  verifyInvariant(RELEASE_HOLD.eligible === false, '184/400 +48 fails');
  verifyApprox(RELEASE_EDGE.lower, 0.506, 1e-3, '222/400 Wilson lower ~50.6%');
  verifyInvariant(RELEASE_EDGE.eligible === false, '+20 exact fails');
  verifyInvariant(RELEASE_PASS.eligible === true, '+19 passes');

  // IPO / KTO / ORPO / SimPO
  verifyApprox(ipoLoss(0, 0.1), 25, 1e-12, 'IPO m=0 -> 25');
  verifyApprox(ipoLoss(5, 0.1), 0, 1e-12, 'IPO m=5 -> 0');
  verifyApprox(ipoLoss(10, 0.1), 25, 1e-12, 'IPO m=10 -> 25');
  verifyApprox(ktoLoss(1, true), 0.4013, 1e-3, 'KTO desirable r=1');
  verifyApprox(ktoLoss(2, true), 0.2891, 1e-3, 'KTO desirable r=2');
  verifyApprox(ktoLoss(1, false), 0.5987, 1e-3, 'KTO undesirable r=1');
  verifyApprox(ktoLoss(2, false), 0.7109, 1e-3, 'KTO undesirable r=2');

  // GRPO group advantages & token vs sequence clipping
  verifyApprox(GROUP_MIXED.mean, 0.625, 1e-12, 'GRPO group mean 0.625');
  verifyApprox(GROUP_MIXED.std, 0.414578, 1e-4, 'GRPO group std ~0.415');
  verifyApprox(GROUP_MIXED.advantages[0], 0.9045, 1e-3, 'GRPO adv[0] ~0.905');
  verifyApprox(GROUP_MIXED.advantages[1], -1.5076, 1e-3, 'GRPO adv[1] ~-1.508');
  verifyApprox(GROUP_MIXED.advantages[2], -0.3015, 1e-3, 'GRPO adv[2] ~-0.302');
  verifyInvariant(
    GROUP_FLAT.advantages.every((v) => v === 0),
    'flat group advantages are 0',
  );
  verifyApprox(alignmentClipping(1.1 * 1.1, 1).surrogate, 1.2, 1e-12, 'seq ratio 1.21 -> 1.20');

  // Fresh transfer A-over-C step
  verifyApprox(FRESH_STEP.gradient[0], -0.293, 2e-3, 'fresh transfer grad A ~-0.293');
  verifyApprox(FRESH_STEP.gradient[1], 0, 1e-12, 'fresh transfer grad B = 0');
  verifyApprox(FRESH_STEP.probabilities[0], 0.3474, 1e-3, 'fresh transfer P(A) ~35%');
  verifyApprox(FRESH_STEP.probabilities[1], 0.1021, 1e-3, 'fresh transfer P(B) >10%');
  verifyApprox(FRESH_STEP.probabilities[2], 0.5505, 1e-3, 'fresh transfer P(C) ~55%');
  verifyApprox(FRESH_STEP.beforeLoss, 0.8805, 1e-3, 'fresh transfer before loss ~0.88');
  verifyApprox(FRESH_STEP.loss, 0.8144, 1e-3, 'fresh transfer after loss ~0.81');
}

/** Scene-bounded phase driver that finishes comfortably before narration ends. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Remaining duration from cue.start clamped safely inside scene window. */
export function remainDuration(c, cueId, maxDur = 0.65, endMargin = 0.5) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.15, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Remaining duration from cue.end (for c.after) clamped safely inside scene window. */
export function remainAfterDuration(c, cueId, maxDur = 0.48, endMargin = 0.45) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.14, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

/** Run continuous phase driver over the full scene without ever exceeding scene bounds. */
export function runPhase(s, c, phaseVal, target = 14, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/** Translucent glowing tile for compact metrics, tokens, or equation slots (never prose cards). */
export function glassCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.gold,
  { fill = '#0e1526', radius = 10, glow = 6, opacity = 0.92, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

/** Smooth quadratic glowing bezier arc between two [x, y] points. */
export function glowingArc(p0, p1, liftY = -40, opts = {}) {
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

/** Sample a 2D mathematical function onto pixel coordinates inside [x0, x1] x [yBot, yTop]. */
export function sampleCurve(fn, xDom, yDom, x0, x1, yBot, yTop, steps = 64) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const u = xDom[0] + ((xDom[1] - xDom[0]) * i) / steps;
    const v = Math.max(yDom[0], Math.min(yDom[1], fn(u)));
    const px = x0 + ((u - xDom[0]) / (xDom[1] - xDom[0])) * (x1 - x0);
    const py = yBot - ((v - yDom[0]) / (yDom[1] - yDom[0])) * (yBot - yTop);
    pts.push([px, py]);
  }
  return pts;
}

/** Shaded 3D rectangular prism with glowing wireframe edges. */
export function box3d(x0, y0, z0, dx, dy, dz, fillColor, edgeColor, opacity = 0.78) {
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

/** Orbiting 3D DPO pairwise loss surface over (chosen log-ratio r_w, rejected log-ratio r_l). */
export function buildDpoLandscape3d(phaseVal, { x = 420, y = 20, beta = 0.5 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 15.8,
    unit: 96,
    focus: [0, 0, 0.55],
  }).at(x, y);

  const surf = surface(
    (rw, rl) => {
      const m = rw - rl;
      return Math.min(2.2, prefLoss(beta * m)) * 0.85;
    },
    {
      x: [-2.0, 2.0],
      y: [-2.0, 2.0],
      resolution: [26, 26],
      colors: ['#103b33', '#1c6d92', '#2b3e7c', '#6b2243', '#ff6b8b', '#ffd166'],
      mesh: '#80d8ff',
      meshOpacity: 0.24,
      meshWidth: 0.65,
      opacity: 0.88,
    },
  );

  // Diagonal constant-margin ridge (m = 1.0)
  const ridge = curve3d(
    (t) => {
      const rl = -1.6 + t * 2.2;
      const rw = rl + 1.0;
      const z = prefLoss(beta * 1.0) * 0.85 + 0.08;
      return [rw, rl, z];
    },
    0,
    1,
    { color: COSMOS.gold, width: 3.4, glow: 9, samples: 32, onTop: true },
  );

  // Flowing photons showing displacement along the constant-margin ridge vs descent across it
  const tracer = points3d(
    () => {
      const f = (phaseVal.value * 0.3) % 1;
      const rl = -1.5 + f * 2.0;
      const rw = rl + 1.0;
      const descentM = -1.2 + f * 2.8;
      return [
        [rw, rl, prefLoss(beta * 1.0) * 0.85 + 0.14],
        [descentM * 0.5, -descentM * 0.5, prefLoss(beta * descentM) * 0.85 + 0.14],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.gold : COSMOS.emerald),
      radius: 7,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(surf, ridge, tracer);
  return view;
}

/** Orbiting 3D PPO clipped surrogate surface over (ratio rho, advantage A) with gold [0.8, 1.2] rails. */
export function buildPpoClipSurface3d(phaseVal, { x = 420, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 15.6,
    unit: 96,
    focus: [0, 0, 0.1],
  }).at(x, y);

  // Map u in [-2, 2] -> rho in [0.4, 1.6] and v in [-1.8, 1.8] -> advantage A in [-1.2, 1.2]
  const uToR = (u) => 1.0 + u * 0.3;
  const rToU = (r) => (r - 1.0) / 0.3;
  const vToA = (v) => v * (1.2 / 1.8);

  const surf = surface(
    (u, v) => {
      const r = uToR(u);
      const adv = vToA(v);
      const clipped = Math.min(1.2, Math.max(0.8, r));
      return Math.min(r * adv, clipped * adv) * 0.9;
    },
    {
      x: [-2.0, 2.0],
      y: [-1.8, 1.8],
      resolution: [28, 24],
      colors: ['#3b1224', '#6b2243', '#1c2b56', '#1c6d92', '#5ce1e6', '#6ee7b7'],
      mesh: '#80d8ff',
      meshOpacity: 0.24,
      meshWidth: 0.65,
      opacity: 0.88,
    },
  );

  const railLo = line3d([rToU(0.8), -1.8, 0.92], [rToU(0.8), 1.8, 0.92], {
    color: COSMOS.gold,
    width: 3.4,
    glow: 9,
    onTop: true,
  });
  const railHi = line3d([rToU(1.2), -1.8, 1.12], [rToU(1.2), 1.8, 1.12], {
    color: COSMOS.gold,
    width: 3.4,
    glow: 9,
    onTop: true,
  });

  const tracer = points3d(
    () => {
      const f = (phaseVal.value * 0.32) % 1;
      const r = 0.5 + f * 1.0;
      const u = rToU(r);
      const clipped = Math.min(1.2, Math.max(0.8, r));
      return [
        [u, 1.5, Math.min(r, clipped) * 0.9 + 0.1],
        [u, -1.5, Math.min(-r, -clipped) * 0.9 + 0.1],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.emerald : COSMOS.rose),
      radius: 7,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(surf, railLo, railHi, tracer);
  return view;
}

/** Orbiting 3D reward-minus-beta*KL landscape showing closed-form Boltzmann optimum shifting with beta. */
export function buildBetaKlSurface3d(phaseVal, { x = 420, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.6,
    unit: 96,
    focus: [0, 0, 0.35],
  }).at(x, y);

  // Map u in [-2, 2] -> p in [0.08, 0.96], v in [-1.8, 1.8] -> beta in [0.25, 1.8]
  const uToP = (u) => 0.52 + u * 0.22;
  const pToU = (p) => (p - 0.52) / 0.22;
  const vToB = (v) => 1.025 + v * (0.775 / 1.8);
  const bToV = (b) => ((b - 1.025) / 0.775) * 1.8;

  const surf = surface(
    (u, v) => {
      const q = Math.max(0.05, Math.min(0.95, uToP(u)));
      const beta = vToB(v);
      const rew = q * Math.log(3);
      const kl = klBernoulliUniform(q);
      return (rew - beta * kl) * 1.25;
    },
    {
      x: [-2.0, 2.0],
      y: [-1.8, 1.8],
      resolution: [26, 22],
      colors: ['#2b1742', '#1d3266', '#1e6e94', '#5ce1e6', '#ffd166'],
      mesh: '#a78bfa',
      meshOpacity: 0.24,
      meshWidth: 0.65,
      opacity: 0.88,
    },
  );

  // Optimal policy ridge p*(beta) = sigmoid(ln(3)/beta)
  const optRidge = curve3d(
    (t) => {
      const beta = 0.28 + t * 1.48;
      const pOpt = sigmoid(Math.log(3) / beta);
      const kl = klBernoulliUniform(pOpt);
      const z = (pOpt * Math.log(3) - beta * kl) * 1.25 + 0.1;
      return [pToU(pOpt), bToV(beta), z];
    },
    0,
    1,
    { color: COSMOS.gold, width: 3.6, glow: 10, samples: 36, onTop: true },
  );

  const photon = points3d(
    () => {
      const f = (phaseVal.value * 0.28) % 1;
      const beta = 0.3 + f * 1.4;
      const pOpt = sigmoid(Math.log(3) / beta);
      const kl = klBernoulliUniform(pOpt);
      return [[pToU(pOpt), bToV(beta), (pOpt * Math.log(3) - beta * kl) * 1.25 + 0.16]];
    },
    { colorAt: () => COSMOS.gold, radius: 7.5, glow: 13, blend: 'screen', onTop: true },
  );

  view.add(surf, optRidge, photon);
  return view;
}

/** Orbiting 3D probability simplex with glowing constant A/B = 4 odds ridge where unseen C absorbs mass. */
export function buildUnseenSimplex3d(phaseVal, moveVal, { x = 430, y = 30 } = {}) {
  const view = cinematic3d({
    theta: -0.74,
    phi: 1.02,
    distance: 15.2,
    unit: 102,
    focus: [0, 0, 0.65],
  }).at(x, y);

  // Base simplex triangle in (x, y) representing (A, B, C)
  const vA = [-1.9, -1.2, 0];
  const vB = [1.9, -1.2, 0];
  const vC = [0, 1.9, 0];
  const toXY = (pa, pb, pc) => [
    pa * vA[0] + pb * vB[0] + pc * vC[0],
    pa * vA[1] + pb * vB[1] + pc * vC[1],
  ];

  const baseTri = parametricSurface(
    (u, v) => {
      const pc = u;
      const pa = (1 - u) * v;
      const pb = (1 - u) * (1 - v);
      const [sx, sy] = toXY(pa, pb, pc);
      return [sx, sy, 0.04 + pc * 0.15];
    },
    [0, 1],
    [0, 1],
    {
      resolution: [16, 16],
      color: '#17223d',
      mesh: COSMOS.cyan,
      meshOpacity: 0.28,
      meshWidth: 0.7,
      opacity: 0.56,
      shaded: false,
    },
  );

  // Constant A/B = 4 odds rail leading straight into unseen vertex C
  const oddsRail = curve3d(
    (t) => {
      const pc = 0.05 + t * 0.9;
      const pa = 0.8 * (1 - pc);
      const pb = 0.2 * (1 - pc);
      const [sx, sy] = toXY(pa, pb, pc);
      return [sx, sy, 0.92];
    },
    0,
    1,
    { color: COSMOS.gold, width: 3.6, glow: 10, samples: 30, onTop: true },
  );

  // Rising C tower height showing unseen probability mass
  const cCurve = curve3d(
    (t) => {
      const pc = 0.05 + t * 0.9;
      const pa = 0.8 * (1 - pc);
      const pb = 0.2 * (1 - pc);
      const [sx, sy] = toXY(pa, pb, pc);
      return [sx, sy, pc * 1.9];
    },
    0,
    1,
    { color: COSMOS.rose, width: 3.4, glow: 9, samples: 30, onTop: true },
  );

  const marker = points3d(
    () => {
      const q = moveVal ? moveVal.value : (phaseVal.value * 0.25) % 1;
      const pc = 0.5 + 0.4 * q;
      const pa = 0.8 * (1 - pc);
      const pb = 0.2 * (1 - pc);
      const [sx, sy] = toXY(pa, pb, pc);
      return [
        [sx, sy, 0.92],
        [sx, sy, pc * 1.9],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.gold : COSMOS.rose),
      radius: 7.5,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(baseTri, oddsRail, cCurve, marker);
  return view;
}

/** Orbiting 3D IPO quadratic bowl vs DPO logistic descent surface. */
export function buildIpoDpoSurface3d(phaseVal, { x = 430, y = 25, unit = 90 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.8,
    unit,
    focus: [0, 0, 0.55],
  }).at(x, y);

  // Map u in [-2.2, 2.2] to margin m = 5 + u * (5 / 2.2) in [0, 10] so bowl centers at origin!
  const ipoSurf = surface(
    (u, shift) => {
      const m = 5 + u * (5 / 2.2);
      const target = 5.0 + shift;
      return Math.min(2.1, (m - target) ** 2 / 14);
    },
    {
      x: [-2.2, 2.2],
      y: [-1.2, 1.2],
      resolution: [28, 18],
      colors: ['#103b33', '#1c6d92', '#5ce1e6', '#a78bfa', '#ffd166'],
      mesh: '#5ce1e6',
      meshOpacity: 0.24,
      meshWidth: 0.6,
      opacity: 0.86,
    },
  );

  const targetLine = line3d([0, -1.2, 0.08], [0, 1.2, 0.08], {
    color: COSMOS.gold,
    width: 3.4,
    glow: 10,
    onTop: true,
  });

  const bead = points3d(
    () => {
      const u = 1.45 * Math.cos(phaseVal.value * 0.55);
      const m = 5 + u * (5 / 2.2);
      return [[u, 0, Math.min(2.1, (m - 5) ** 2 / 14) + 0.14]];
    },
    { colorAt: () => COSMOS.emerald, radius: 7.5, glow: 12, blend: 'screen', onTop: true },
  );

  view.add(ipoSurf, targetLine, bead);
  return view;
}

/** Orbiting 3D GRPO prompt-group pillars piercing the gold group-mean plane. */
export function buildGroupPillars3d(
  phaseVal,
  { x = 425, y = 25, rewards = [1, 0, 0.5, 1], meanZ = 0.625 } = {},
) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.0,
    unit: 100,
    focus: [0, 0, 0.65],
  }).at(x, y);

  const zScale = 1.65;
  const meanPlane = parametricSurface(
    (u, v) => [-2.4 + u * 4.8, -1.5 + v * 3.0, meanZ * zScale],
    [0, 1],
    [0, 1],
    {
      resolution: [6, 4],
      color: '#1f2b48',
      mesh: COSMOS.gold,
      meshOpacity: 0.42,
      meshWidth: 1.0,
      opacity: 0.34,
      shaded: false,
    },
  );

  const pillars = [];
  rewards.forEach((r, idx) => {
    const px = -1.8 + idx * 1.2;
    const above = r >= meanZ;
    const h = Math.max(0.18, r * zScale);
    pillars.push(
      ...box3d(
        px - 0.34,
        -0.5,
        0,
        0.68,
        1.0,
        h,
        above ? '#103b33' : '#3a1421',
        above ? COSMOS.emerald : COSMOS.rose,
        0.84,
      ),
    );
  });

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      return rewards.map((r, idx) => {
        const px = -1.8 + idx * 1.2;
        const frac = (p * 0.42 + idx * 0.23) % 1;
        const above = r >= meanZ;
        return [px, 0, above ? meanZ * zScale + frac * 0.9 : meanZ * zScale - frac * 0.55];
      });
    },
    {
      colorAt: (idx) => (rewards[idx] >= meanZ ? COSMOS.emerald : COSMOS.rose),
      radius: 6.5,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(meanPlane, ...pillars, photons);
  return view;
}

/** Orbiting 3D four-role GPU memory monoliths (Actor 1120, Critic 1120, Ref 140, Reward 140 GB). */
export function buildRoleTowers3d(phaseVal, { x = 425, y = 25, includeCritic = true } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.4,
    unit: 96,
    focus: [0, 0, 0.85],
  }).at(x, y);

  const baseGrid = gridPlane3d({
    size: 5.4,
    step: 0.9,
    color: COSMOS.rule,
    opacity: 0.45,
    width: 0.9,
  });

  const specs = [
    { px: -1.8, h: 2.1, fill: '#10354a', edge: COSMOS.cyan },
    {
      px: -0.6,
      h: includeCritic ? 2.1 : 0.14,
      fill: includeCritic ? '#3a1a46' : '#181e30',
      edge: includeCritic ? COSMOS.violet : COSMOS.dim,
    },
    { px: 0.6, h: 0.36, fill: '#2c2410', edge: COSMOS.gold },
    { px: 1.8, h: 0.36, fill: '#103b33', edge: COSMOS.emerald },
  ];

  const towers = [];
  for (const sp of specs) {
    towers.push(...box3d(sp.px - 0.38, -0.5, 0, 0.76, 1.0, sp.h, sp.fill, sp.edge, 0.86));
  }

  const flow = curve3d(
    (t) => [-1.8 + t * 3.6, 0.85, 0.7 + 0.35 * Math.sin(t * Math.PI * 3 + phaseVal.value * 0.7)],
    0,
    1,
    { color: COSMOS.gold, width: 3.0, glow: 8, samples: 36, onTop: true },
  );

  view.add(baseGrid, ...towers, flow);
  return view;
}

export {
  ALIGNMENT_TOKEN_FIXTURE,
  CONTROLLED_CASES,
  COSMOS,
  EXAMPLE,
  Node,
  ROUTE_FIXTURE,
  SHORTCUT_PAIRS,
  alignmentBudget,
  alignmentClipping,
  alignmentFreshStep,
  alignmentGae,
  alignmentGroup,
  alignmentMissingPair,
  alignmentReduction,
  alignmentRelease,
  alignmentSoftmax,
  alignmentTilt,
  alignmentTokenScores,
  alignmentWilson,
  aura,
  bounded,
  circle,
  cinematic3d,
  comparisonLoss,
  curve3d,
  dot,
  dpoExample,
  evaluationState,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  introState,
  line,
  line3d,
  linear,
  linearGradient,
  lossPresentation,
  markDecoration,
  methodState,
  metricReadout,
  morphEquation,
  orbitScene,
  pairLayout,
  parametricSurface,
  points3d,
  polyPath,
  prefBound,
  prefLerp,
  prefLoss,
  radialGradient,
  rect,
  rule,
  sigmoid,
  surface,
  twoLogitState,
  twoLogitTrace,
  txt,
  wireframeSlab3d,
  wordCount,
};
