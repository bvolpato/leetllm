// Shared math models, invariants, semantic palette, and 2D/3D cinema primitives for reward-modeling.
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
  finalUnmasked,
  rewardEnsemble,
  rewardHeadFit,
  sigmoid,
  softplus,
  stablePairLoss,
} from '../../films/reward-modeling/arithmetic.mjs';
import {
  CONTROLLED_PAIRS,
  FINAL_RULE_FIXTURE,
  LIKELIHOOD_FIXTURE,
  SUPPORT_SCREEN,
  TRAINING_PAIRS,
} from '../../films/reward-modeling/fixtures.mjs';
import {
  REWARD_FITS,
  approvalRuleCheck,
  headScore,
  replayApproval,
} from '../../films/reward-modeling/model.mjs';
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

// Semantic color roles across the entire film:
//   gold    = scalar reward, margin Delta, active highlight
//   emerald = preferred / compliant reply A, true gold quality, passing check
//   rose    = rejected / violating reply B or D, high loss, failure, Goodhart drop
//   cyan    = policy writer, hidden states, Bradley-Terry sigmoid curve
//   violet  = shared context, shared scorer weights, ensemble members
//   amber   = length shortcut, proxy drift, KL scale tension

export const LIKE_A = LIKELIHOOD_FIXTURE.answers[0];
export const LIKE_B = LIKELIHOOD_FIXTURE.answers[1];
export const LIKE_A_PREFIX = LIKE_A.probabilities.map((_, i) =>
  LIKE_A.probabilities.slice(0, i + 1).reduce((a, b) => a * b, 1),
);
export const LIKE_B_PREFIX = LIKE_B.probabilities.map((_, i) =>
  LIKE_B.probabilities.slice(0, i + 1).reduce((a, b) => a * b, 1),
);
export const LIKE_A_PROD = LIKE_A_PREFIX.at(-1);
export const LIKE_B_PROD = LIKE_B_PREFIX.at(-1);

export const HEAD_W = Object.freeze([0.5, 1.0]);
export const HEAD_A_VEC = Object.freeze([2.0, 0.8]);
export const HEAD_B_VEC = Object.freeze([1.0, 0.2]);
export const HEAD_A_PRODS = Object.freeze(HEAD_A_VEC.map((v, i) => v * HEAD_W[i]));
export const HEAD_B_PRODS = Object.freeze(HEAD_B_VEC.map((v, i) => v * HEAD_W[i]));
export const SCORE_A = headScore(HEAD_W, HEAD_A_VEC); // 1.8
export const SCORE_B = headScore(HEAD_W, HEAD_B_VEC); // 0.7
export const MARGIN_AB = SCORE_A - SCORE_B; // 1.1
export const EXP_A = Math.exp(SCORE_A);
export const EXP_B = Math.exp(SCORE_B);
export const PROB_AB = sigmoid(MARGIN_AB);
export const LOSS_AB = stablePairLoss(MARGIN_AB);
export const PROB_M2 = sigmoid(-2);
export const LOSS_M2 = stablePairLoss(-2);
export const PROB_P2 = sigmoid(2);
export const LOSS_P2 = stablePairLoss(2);

export const PAD_STATES = Object.freeze([
  [1, 0],
  [2, 3],
  [99, 99],
]);
export const PAD_RIGHT_MASK = Object.freeze([1, 1, 0]);
export const PAD_LEFT_MASK = Object.freeze([0, 1, 1]);
export const PAD_RIGHT_IDX = finalUnmasked(PAD_RIGHT_MASK); // 1
export const PAD_LEFT_IDX = finalUnmasked(PAD_LEFT_MASK); // 2
export const PAD_SCORE = headScore(HEAD_W, PAD_STATES[PAD_RIGHT_IDX]); // 4.0

export const MARGIN_TARGET_90 = 1 + Math.log(0.9 / 0.1); // 3.197224577...

export const SHARED_W0 = -1.0;
export const SHARED_FEATS = Object.freeze([1.0, 2.0]);
export const SHARED_LR = 0.1;
export const SHARED_SCORES0 = Object.freeze(SHARED_FEATS.map((h) => SHARED_W0 * h)); // [-1, -2]
export const SHARED_MARGIN0 = SHARED_SCORES0[0] - SHARED_SCORES0[1]; // 1.0
export const SHARED_GRAD = 1 - sigmoid(SHARED_MARGIN0); // 0.2689414...
export const SHARED_W1 = SHARED_W0 - SHARED_LR * SHARED_GRAD; // -1.026894...
export const SHARED_SCORES1 = Object.freeze(SHARED_FEATS.map((h) => SHARED_W1 * h));
export const SHARED_MARGIN1 = SHARED_SCORES1[0] - SHARED_SCORES1[1];

export const CONFOUNDED_FIT = REWARD_FITS.confounded;
export const BALANCED_FIT = REWARD_FITS.balanced;
export const SCALED_CONFOUNDED_W = Object.freeze(
  CONFOUNDED_FIT.weights.map((w) => w / CONFOUNDED_FIT.weights[0]),
);

export const BRIER_VOTES = Object.freeze([1, 1, 1, 0]);
export const BRIER_75_ERRS = Object.freeze(BRIER_VOTES.map((y) => (0.75 - y) ** 2));
export const BRIER_99_ERRS = Object.freeze(BRIER_VOTES.map((y) => (0.99 - y) ** 2));
export const BRIER_75 = BRIER_75_ERRS.reduce((a, b) => a + b, 0) / BRIER_VOTES.length;
export const BRIER_99 = BRIER_99_ERRS.reduce((a, b) => a + b, 0) / BRIER_VOTES.length;

export const LENGTH_MARGIN_CASES = Object.freeze(
  [0, 3, 6].map((b) => ({
    b,
    logit: (b - 1) * 1,
    loss: stablePairLoss((b - 1) * 1),
    shortGood: b * 1,
    longWrong: b * 2,
  })),
);

export const ENS_SPREAD = rewardEnsemble([2, 4, 6], 1);
export const ENS_SHARED = rewardEnsemble([5, 5, 5], 1);

export const SCREEN_AGREE = SUPPORT_SCREEN.agreements.filter(Boolean).length;
export const SCREEN_TOTAL = SUPPORT_SCREEN.agreements.length;
export const SCREEN_RATE = SCREEN_AGREE / SCREEN_TOTAL;
export const SCREEN_ENS = rewardEnsemble(SUPPORT_SCREEN.memberScores, 1);

export const REPLAY_VERBOSE = replayApproval(FINAL_RULE_FIXTURE.verbose);
export const REPLAY_REVISED = replayApproval(FINAL_RULE_FIXTURE.revised);

export const PL_STRENGTHS = Object.freeze([3, 2, 1]);
export const PL_STEP1 = PL_STRENGTHS[0] / (PL_STRENGTHS[0] + PL_STRENGTHS[1] + PL_STRENGTHS[2]); // 3/6
export const PL_STEP2 = PL_STRENGTHS[1] / (PL_STRENGTHS[1] + PL_STRENGTHS[2]); // 2/3
export const PL_ORDER_PROB = PL_STEP1 * PL_STEP2; // 1/3

/** Build-time mathematical invariants verified before every compile and render. */
export function verifyRewardInvariants() {
  verifyApprox(LIKE_A_PROD, 0.1, 1e-12, 'answer A sequence probability');
  verifyApprox(LIKE_B_PROD, 0.2, 1e-12, 'answer B sequence probability');
  verifyApprox(LIKE_B_PROD / LIKE_A_PROD, 2.0, 1e-12, 'B has twice A probability');

  verifyApprox(SCORE_A, 1.8, 1e-12, 'scalar score A');
  verifyApprox(SCORE_B, 0.7, 1e-12, 'scalar score B');
  verifyApprox(MARGIN_AB, 1.1, 1e-12, 'score margin A - B');
  verifyApprox(EXP_A / (EXP_A + EXP_B), PROB_AB, 1e-12, 'Bradley-Terry ratio equals sigmoid');
  verifyApprox(PROB_AB, 0.75026, 1e-4, 'sigma(1.1) approx 0.7503');
  verifyApprox(LOSS_AB, 0.28734, 1e-4, 'loss(1.1) approx 0.2873');
  verifyApprox(LOSS_M2, 2.12693, 1e-4, 'loss(-2) approx 2.1269');
  verifyApprox(LOSS_P2, 0.12693, 1e-4, 'loss(+2) approx 0.1269');

  verifyInvariant(stablePairLoss(-1000) === 1000, 'stablePairLoss(-1000) === 1000');
  verifyInvariant(stablePairLoss(1000) === 0, 'stablePairLoss(1000) === 0');
  verifyApprox(stablePairLoss(0), Math.LN2, 1e-12, 'stablePairLoss(0) === ln 2');
  verifyApprox(MARGIN_TARGET_90, 3.19722, 1e-4, 'margin m=1 for 90% probability');

  verifyInvariant(PAD_RIGHT_IDX === 1, 'right-padded last unmasked index');
  verifyInvariant(PAD_LEFT_IDX === 2, 'left-padded last unmasked index');
  verifyApprox(PAD_SCORE, 4.0, 1e-12, 'pooled vector [2, 3] dot [0.5, 1] === 4');

  verifyApprox(SHARED_GRAD, 0.26894, 1e-4, 'shared weight gradient');
  verifyApprox(SHARED_W1, -1.02689, 1e-4, 'updated shared weight');
  verifyInvariant(
    SHARED_SCORES1[0] < SHARED_SCORES0[0] &&
      SHARED_SCORES1[1] < SHARED_SCORES0[1] &&
      SHARED_MARGIN1 > SHARED_MARGIN0,
    'both shared scores drop while margin widens',
  );

  verifyApprox(CONFOUNDED_FIT.weights[0], 1.6294, 1e-3, 'confounded compliance weight');
  verifyApprox(CONFOUNDED_FIT.weights[1], 1.6294, 1e-3, 'confounded length weight');
  verifyApprox(BALANCED_FIT.weights[0], 2.6667, 1e-3, 'balanced compliance weight');
  verifyApprox(BALANCED_FIT.weights[1], 0.0, 1e-12, 'balanced length weight cancels to 0');
  verifyInvariant(
    headScore(CONFOUNDED_FIT.weights, FINAL_RULE_FIXTURE.verbose.features) >
      headScore(CONFOUNDED_FIT.weights, FINAL_RULE_FIXTURE.reviewFirst.features),
    'confounded head picks verbose D over compliant A',
  );
  verifyInvariant(
    CONTROLLED_PAIRS.every(
      ([a, d]) => headScore(BALANCED_FIT.weights, a) > headScore(BALANCED_FIT.weights, d),
    ),
    'balanced head passes all 3 controlled pairs',
  );

  verifyApprox(sigmoid(SCORE_A + 10 - (SCORE_B + 10)), PROB_AB, 1e-12, 'shift invariance');
  verifyApprox(sigmoid(3 * MARGIN_AB), 0.96443, 1e-4, '3x scale pushes prob to 96.4%');
  verifyApprox(BRIER_75, 0.1875, 1e-12, 'Brier score at 0.75');
  verifyApprox(BRIER_99, 0.2451, 1e-12, 'Brier score at 0.99');

  verifyApprox(LENGTH_MARGIN_CASES[0].loss, 1.3133, 1e-3, 'length margin loss at b=0');
  verifyApprox(LENGTH_MARGIN_CASES[1].loss, 0.1269, 1e-3, 'length margin loss at b=3');
  verifyApprox(LENGTH_MARGIN_CASES[2].loss, 0.0067, 1e-3, 'length margin loss at b=6');

  verifyInvariant(
    ENS_SPREAD.mean === 4 && ENS_SPREAD.sd === 2 && ENS_SPREAD.aggregate === 2,
    'ensemble [2,4,6]',
  );
  verifyInvariant(
    ENS_SHARED.mean === 5 && ENS_SHARED.sd === 0 && ENS_SHARED.aggregate === 5,
    'ensemble [5,5,5]',
  );
  verifyApprox(PL_ORDER_PROB, 1 / 3, 1e-12, 'Plackett-Luce A,B,C order probability === 1/3');

  verifyApprox(SCREEN_RATE, 0.75, 1e-12, 'fresh screen 18/24 === 75%');
  verifyInvariant(SCREEN_RATE < SUPPORT_SCREEN.floor, '75% fails 80% floor');
  verifyInvariant(
    !SUPPORT_SCREEN.sections.includes(SUPPORT_SCREEN.citedSection),
    'section 4 missing',
  );
  verifyInvariant(REPLAY_VERBOSE[0].passes === false, 'D fails approval check at step 1');
  verifyInvariant(
    REPLAY_REVISED.every((s) => s.passes),
    'A2 passes all steps',
  );
  verifyInvariant(REPLAY_REVISED[2].grantNow === true, 'A2 grants at step 3');
  verifyInvariant(
    headScore(SCALED_CONFOUNDED_W, FINAL_RULE_FIXTURE.reviewFirst.features) === 1 &&
      headScore(SCALED_CONFOUNDED_W, FINAL_RULE_FIXTURE.verbose.features) === 2,
    'scaled equal weights give A=1, D=2',
  );
}

/** Sample a continuous 1D function as screen-space points for glowingTrail. */
export function sampleCurve(fn, xMin, xMax, mapX, mapY, samples = 72) {
  return Array.from({ length: samples }, (_, i) => {
    const x = xMin + ((xMax - xMin) * i) / (samples - 1);
    return [mapX(x), mapY(fn(x))];
  });
}

/** Smooth 2D quadratic Bezier curve rendered as a glowingTrail. */
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

/** Circular calibration / probability arc dial (no boxy card chrome). */
export function radialDial(
  cx,
  cy,
  radius,
  frac,
  {
    color = COSMOS.cyan,
    trackColor = '#28365a',
    startDeg = 135,
    sweepDeg = 270,
    width = 10,
    glow = 10,
    opacity = 1,
    samples = 44,
  } = {},
) {
  const toRad = (d) => (d * Math.PI) / 180;
  const arcPts = (f) => {
    const n = Math.max(2, Math.round(samples * Math.max(0.03, f)));
    return Array.from({ length: n }, (_, i) => {
      const deg = startDeg + (sweepDeg * f * i) / (n - 1);
      return [cx + Math.cos(toRad(deg)) * radius, cy + Math.sin(toRad(deg)) * radius];
    });
  };
  const bgTrack = new Node(polyPath(arcPts(1))).stroke(trackColor, width, 0.72 * opacity);
  const clamped = Math.max(0, Math.min(1, frac));
  const out = [bgTrack];
  if (clamped > 0.01) {
    const pts = arcPts(clamped);
    out.push(
      glowingTrail(pts, {
        color,
        width,
        opacity: 0.95 * opacity,
        glow,
        core: true,
        coreWidth: 2,
      }),
    );
    const tip = pts.at(-1);
    out.push(glowDot(tip[0], tip[1], { radius: width * 0.65, color, glow: glow + 2, opacity }));
  }
  return group(...out);
}

/** Minimal translucent token or matrix cell marker (never for bullet-point prose lists). */
export function tokenCell(
  x,
  y,
  w,
  h,
  strokeColor = COSMOS.cyan,
  { fill = '#0f162a', radius = 10, glow = 6, opacity = 0.92, dash, width = 2.2 } = {},
) {
  const r = rect(w, h, { fill, stroke: strokeColor, width, radius, dash })
    .at(x, y)
    .opacity(opacity);
  if (glow > 0) r.glow(glow, strokeColor);
  return r;
}

/** Safe duration inside a scene window so an animation never outruns narration. */
export function safeDuration(c, startOffset = 0.1, endMargin = 0.55) {
  return Math.max(0.4, c.end - c.start - startOffset - endMargin);
}

/** Safe duration from a specific cue start to the scene end. */
export function remainDuration(c, cueId, maxDur = 1.6, endMargin = 0.5) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.22, c.end - cue.start - endMargin);
  return Math.min(maxDur, avail);
}

/** Safe duration from a specific cue end (for c.after) to the scene end. */
export function afterDuration(c, cueId, maxDur = 0.45, endMargin = 0.35) {
  const cue = c.cue(cueId);
  const avail = Math.max(0.16, c.end - cue.end - endMargin);
  return Math.min(maxDur, avail);
}

/** Schedule a continuous ambient phase animation across the whole scene. */
export function runPhase(s, c, phaseVal, target = 12, startOffset = 0.08) {
  const dur = safeDuration(c, startOffset, 0.55);
  c.at(startOffset, () => s.play(phaseVal.to(target, { duration: dur, ease: linear })));
  return dur;
}

/**
 * Orbiting 3D Goodhart overoptimization landscape:
 *   x = optimization KL distance (0..1 -> -2.8..2.8)
 *   y = shortcut vs true-quality axis (-2.2..2.2)
 *   surface = true gold quality ridge (peaks near KL~0.42 then drops off into Goodhart valley)
 *   curves = glowing amber proxy reward climbing monotonically vs emerald gold curve peaking and falling.
 */
export function goodhartProxyZ(u) {
  return 0.25 + 1.85 * Math.pow(u, 0.72);
}

export function goodhartGoldZ(u) {
  // Smooth hump: climbs with proxy up to u ~ 0.44, then collapses as policy hacks the proxy
  return 0.25 + 2.35 * u * Math.exp(-2.15 * Math.pow(Math.max(0, u - 0.12), 1.45));
}

export function buildGoodhartLandscape3d(progressVal, { x = 310, y = 20 } = {}) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 14.8,
    unit: 108,
    focus: [0, 0, 0.65],
  }).at(x, y);

  const halfX = 2.8;
  const halfY = 2.2;
  const landscape = surface(
    (wx, wy) => {
      const u = (wx + halfX) / (2 * halfX);
      const ridge = goodhartGoldZ(u);
      const cross = Math.exp(-Math.pow((wy + 0.35 * Math.sin(u * 3.1)) / 1.15, 2));
      const hackSlope = Math.max(0, wy) * 0.28 * u;
      return Math.max(0.06, 0.14 + ridge * cross - hackSlope);
    },
    {
      x: [-halfX, halfX],
      y: [-halfY, halfY],
      resolution: [38, 32],
      colors: ['#0c1228', '#221c48', '#8a2b56', '#2178a8', '#44c7a5', '#ffd166'],
      mesh: '#68b8ff',
      meshOpacity: 0.16,
      meshWidth: 0.55,
      opacity: 0.88,
    },
  );

  const floorGrid = gridPlane3d({
    x: [-halfX, halfX],
    y: [-halfY, halfY],
    z: 0.04,
    step: 1.4,
    color: '#344770',
    opacity: 0.42,
  });

  const proxyCurve = curve3d(
    (t) => [-halfX + t * 2 * halfX, 1.05, goodhartProxyZ(t) + 0.24],
    0,
    1,
    { color: COSMOS.amber, width: 5.0, glow: 12, blend: 'screen', samples: 48, onTop: true },
  );

  const goldCurve = curve3d(
    (t) => [-halfX + t * 2 * halfX, -0.35 * Math.sin(t * 3.1), goodhartGoldZ(t) + 0.26],
    0,
    1,
    { color: COSMOS.emerald, width: 5.0, glow: 12, blend: 'screen', samples: 48, onTop: true },
  );

  const gapBeam = line3d(
    () => {
      const u = Math.max(0.06, progressVal.value);
      const wx = -halfX + u * 2 * halfX;
      return [wx, 1.05, goodhartProxyZ(u) + 0.24];
    },
    () => {
      const u = Math.max(0.06, progressVal.value);
      const wx = -halfX + u * 2 * halfX;
      return [wx, -0.35 * Math.sin(u * 3.1), goodhartGoldZ(u) + 0.26];
    },
    { color: COSMOS.rose, width: 3.4, glow: 10, blend: 'screen', onTop: true },
  );

  const heads = points3d(
    () => {
      const u = Math.max(0.06, progressVal.value);
      const wx = -halfX + u * 2 * halfX;
      return [
        [wx, 1.05, goodhartProxyZ(u) + 0.24],
        [wx, -0.35 * Math.sin(u * 3.1), goodhartGoldZ(u) + 0.26],
      ];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.amber : COSMOS.emerald),
      radius: 8.5,
      glow: 13,
      blend: 'screen',
      onTop: true,
    },
  );

  view.add(floorGrid, landscape, proxyCurve, goldCurve, gapBeam, heads);
  return { view };
}

/**
 * Orbiting 3D linear reward surface r(c, l) = w_c * c + w_l * l
 * showing how confounded training tilts the reward plane along length,
 * whereas balanced training aligns the slope purely along compliance.
 */
export function buildRewardPlane3d(modeBlend, { x = 315, y = 10 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 14.4,
    unit: 108,
    focus: [0, 0, 0.7],
  }).at(x, y);

  const half = 2.4;
  // Base compliance surface (always rendered smoothly)
  const surf = surface(
    (wx, wy) => {
      const comp = (wx + half) / (2 * half); // 0..1
      const len = (wy + half) / (2 * half); // 0..1
      return 0.25 + 1.55 * comp + 0.85 * len * (1 - 0.82 * comp) + 0.18 * Math.sin(wx * 1.4);
    },
    {
      x: [-half, half],
      y: [-half, half],
      resolution: [30, 30],
      colors: ['#0c1228', '#1d2b5c', '#5b348c', '#2684b5', '#5ce1e6', '#ffd166'],
      mesh: '#69c9ff',
      meshOpacity: 0.18,
      meshWidth: 0.55,
      opacity: 0.85,
    },
  );

  // Reactive hyperplane wireframe tilting from confounded [1.63, 1.63] -> balanced [2.67, 0]
  const planeZ = (u, v) => {
    const b = modeBlend.value;
    const wc = (1 - b) * 0.95 + b * 1.65;
    const wl = (1 - b) * 0.95;
    return 0.28 + wc * u + wl * v;
  };
  const pt = (u, v) => () => [-half + u * 2 * half, -half + v * 2 * half, planeZ(u, v)];

  const edges = [
    line3d(pt(0, 0), pt(1, 0), { color: COSMOS.emerald, width: 3.4, glow: 8, onTop: true }),
    line3d(pt(1, 0), pt(1, 1), { color: COSMOS.gold, width: 3.4, glow: 8, onTop: true }),
    line3d(pt(1, 1), pt(0, 1), { color: COSMOS.amber, width: 3.4, glow: 8, onTop: true }),
    line3d(pt(0, 1), pt(0, 0), { color: COSMOS.rose, width: 3.4, glow: 8, onTop: true }),
    line3d(pt(0, 0.5), pt(1, 0.5), { color: COSMOS.cyan, width: 2.2, opacity: 0.7, onTop: true }),
    line3d(pt(0.5, 0), pt(0.5, 1), { color: COSMOS.cyan, width: 2.2, opacity: 0.7, onTop: true }),
  ];

  // Candidate markers A=(1, 0) and D=(0, 1) lifted to their scored heights
  const pts = points3d(
    () => [
      [-half + 2 * half, -half, planeZ(1, 0) + 0.14],
      [-half, -half + 2 * half, planeZ(0, 1) + 0.14],
    ],
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.emerald : COSMOS.rose),
      radius: 8,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );

  const floor = gridPlane3d({
    x: [-half, half],
    y: [-half, half],
    z: 0.05,
    step: 1.2,
    color: '#344770',
    opacity: 0.45,
  });

  view.add(floor, surf, ...edges, pts);
  return { view };
}

export {
  CONTROLLED_PAIRS,
  COSMOS,
  FINAL_RULE_FIXTURE,
  LIKELIHOOD_FIXTURE,
  Node,
  REWARD_FITS,
  SUPPORT_SCREEN,
  TRAINING_PAIRS,
  approvalRuleCheck,
  aura,
  circle,
  cinematic3d,
  curve3d,
  delay,
  dot,
  finalUnmasked,
  glowDot,
  glowTex,
  glowingTrail,
  gridPlane3d,
  group,
  guardedDynamic,
  headScore,
  heroTitle,
  line,
  line3d,
  linear,
  linearGradient,
  metricReadout,
  morphEquation,
  orbitScene,
  par,
  parametricSurface,
  points3d,
  polyPath,
  radialGradient,
  rect,
  replayApproval,
  rewardEnsemble,
  rewardHeadFit,
  rule,
  sigmoid,
  softplus,
  stablePairLoss,
  surface,
  txt,
  wireframeSlab3d,
};
