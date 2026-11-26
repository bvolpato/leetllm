// Shared cinematic visual primitives, verified math model, and timing helpers for `probability`.
// All numerical values derive directly from videos/films/probability/ and are asserted at load time.
import {
  Node,
  circle,
  dot,
  group,
  line,
  linear,
  linearGradient,
  polyPath,
  rect,
} from 'vizmatic/stage';
import {
  CINEMA_FRAME,
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
} from '../cinematic-kit.mjs';
import {
  checkedPosterior,
  mix,
  posterior,
  probSoftmax,
} from '../../films/probability/arithmetic.mjs';
import {
  broad,
  changedQueue,
  freshCapacity,
  freshQueue,
  nextLogits,
  nextProbabilities,
  population,
  queuePackets,
  strict,
  tokenDraws,
} from '../../films/probability/fixtures.mjs';
import { repeatedRates, validateModel } from '../../films/probability/model.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  aura,
  broad,
  changedQueue,
  checkedPosterior,
  cinematic3d,
  freshCapacity,
  freshQueue,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  mix,
  morphEquation,
  nextLogits,
  nextProbabilities,
  orbitScene,
  population,
  posterior,
  probSoftmax,
  queuePackets,
  repeatedRates,
  rule,
  strict,
  tokenDraws,
  txt,
};

/** One semantic color role per concept across all 21 scenes of Probability. */
export const ROLE = Object.freeze({
  abuse: COSMOS.rose,
  clean: COSMOS.cyan,
  posterior: COSMOS.gold,
  likelihood: COSMOS.violet,
  improved: COSMOS.emerald,
  warning: COSMOS.amber,
  token: COSMOS.blue,
});

/** Exact precomputed token-chain, log-loss, calibration, and sampling-error fixtures. */
export const TOKEN_CHAIN = Object.freeze({
  words: ['rain', 'fell', 'here'],
  probs: [0.5, 0.2, 0.1],
  product: 0.5 * 0.2 * 0.1,
  nlls: [0.5, 0.2, 0.1].map((p) => -Math.log(p)),
  meanNll: [0.5, 0.2, 0.1].reduce((acc, p) => acc - Math.log(p), 0) / 3,
  perplexity: Math.exp([0.5, 0.2, 0.1].reduce((acc, p) => acc - Math.log(p), 0) / 3),
  longCount: 200,
  longStepP: 0.01,
  longLogSum: 200 * Math.log(0.01),
});

export const LOG_LOSS_MODELS = Object.freeze(
  [
    {
      name: 'Moderate',
      probs: [0.6, 0.5, 0.7, 0.4],
      color: COSMOS.cyan,
    },
    {
      name: 'Unsure (1/4 each)',
      probs: [0.25, 0.25, 0.25, 0.25],
      color: COSMOS.violet,
    },
    {
      name: 'Overconfident',
      probs: [0.99, 0.99, 0.99, 0.001],
      color: COSMOS.rose,
    },
  ].map((m) => ({
    ...m,
    losses: m.probs.map((p) => -Math.log(p)),
    mean: m.probs.reduce((acc, p) => acc - Math.log(p), 0) / m.probs.length,
  })),
);

export const CALIBRATION_SIX = Object.freeze([
  { score: 0.78, abusive: true },
  { score: 0.81, abusive: false },
  { score: 0.79, abusive: true },
  { score: 0.82, abusive: false },
  { score: 0.8, abusive: true },
  { score: 0.8, abusive: false },
]);

export const TOKEN_LABELS = Object.freeze(['result', 'value', 'None', 'banana']);
export const REPEATED_50 = Object.freeze(repeatedRates(50));
export const REPEATED_200 = Object.freeze(repeatedRates(200));

/** Build-time mathematical verification of every spoken number across all 21 scenes (A1). */
export function verifyProbabilityInvariants() {
  verifyInvariant(validateModel() === true, 'films/probability/model.mjs validateModel()');

  const prior1 = population.abusive / (population.abusive + population.clean);
  verifyApprox(prior1, 0.01, 1e-12, 'base prior 1%');
  verifyApprox(prior1 * (1 - prior1), 0.0099, 1e-12, 'Bernoulli variance 0.0099');

  verifyApprox(posterior(0.01, 0.95, 0.05), 95 / 590, 1e-12, '1% prior posterior');
  verifyApprox(posterior(0.1, 0.95, 0.05), 950 / 1400, 1e-12, '10% prior posterior');
  verifyApprox(posterior(0.01, 0.2, 0.2), 0.01, 1e-12, 'independent 20% flag posterior');
  verifyApprox(posterior(0.01, 0.95 ** 2, 0.05 ** 2), 90.25 / 115, 1e-12, 'independent pair');
  verifyApprox(
    checkedPosterior(Number.MIN_VALUE, 0.5, Number.MIN_VALUE),
    1 / 3,
    1e-12,
    'log-sum-exp subnormal rescue',
  );

  // Likelihood L(p) = p^2 (1 - p)
  const lik = (p) => p * p * (1 - p);
  verifyApprox(lik(0.2), 0.032, 1e-12, 'L(0.2)');
  verifyApprox(lik(0.8), 0.128, 1e-12, 'L(0.8)');
  verifyApprox(lik(2 / 3), 4 / 27, 1e-12, 'L(2/3) peak');
  verifyApprox(3 * lik(2 / 3), 4 / 9, 1e-12, 'unordered binomial 3 * L(2/3)');

  // Calibration six-item bucket
  const avgScore = CALIBRATION_SIX.reduce((a, r) => a + r.score, 0) / CALIBRATION_SIX.length;
  const obsFrac = CALIBRATION_SIX.filter((r) => r.abusive).length / CALIBRATION_SIX.length;
  verifyApprox(avgScore, 0.8, 1e-12, 'calibration average score 0.80');
  verifyApprox(obsFrac, 0.5, 1e-12, 'calibration observed fraction 0.50');
  verifyApprox(avgScore - obsFrac, 0.3, 1e-12, 'calibration gap 30pp');

  // Distributions: Binomial(10, 0.01) and Poisson(2)
  verifyApprox(10 * 0.01, 0.1, 1e-12, 'Binomial mean 0.10');
  verifyApprox(10 * 0.01 * 0.99, 0.099, 1e-12, 'Binomial variance 0.099');
  verifyApprox(Math.exp(-2), 0.1353352832, 1e-6, 'Poisson(2) P(0) = e^-2');

  // Softmax and sampling
  verifyApprox(
    nextProbabilities.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    'softmax sums to 1',
  );
  verifyApprox(
    nextProbabilities[0] / nextProbabilities[1],
    Math.exp(0.8),
    1e-12,
    'logit gap 0.8 -> e^0.8 ratio',
  );
  verifyApprox(nextProbabilities[0] * 1000, 618.4, 0.2, 'expected result count in 1000 draws');
  verifyInvariant(tokenDraws.length === 1000, '1000 deterministic token draws');

  // Token chain and perplexity
  verifyApprox(TOKEN_CHAIN.product, 0.01, 1e-12, 'rain fell here product 0.01');
  verifyApprox(TOKEN_CHAIN.longLogSum, -921.034, 0.01, '200 * ln(0.01) = -921.0');
  verifyApprox(TOKEN_CHAIN.meanNll, 1.53506, 0.001, '3-token mean NLL');
  verifyApprox(TOKEN_CHAIN.perplexity, 4.64159, 0.005, '3-token perplexity');

  // Log loss models
  verifyApprox(-Math.log(0.9), 0.10536, 1e-4, '-ln(0.9)');
  verifyApprox(-Math.log(0.01), 4.60517, 1e-4, '-ln(0.01)');
  verifyApprox(LOG_LOSS_MODELS[0].mean, 0.619, 0.002, 'moderate mean loss 0.619');
  verifyApprox(LOG_LOSS_MODELS[1].mean, 1.38629, 0.001, 'unsure mean loss 1.386');
  verifyApprox(LOG_LOSS_MODELS[2].mean, 1.73448, 0.001, 'overconfident mean loss 1.734');

  // Sampling error & rate gap
  const se50 = Math.sqrt((0.8 * 0.2) / 50);
  verifyApprox(se50, 0.05657, 1e-3, 'SE(0.8, 50)');
  const gapSe = Math.sqrt((0.84 * 0.16) / 50 + (0.8 * 0.2) / 50);
  verifyApprox(gapSe, 0.07673, 1e-3, 'independent gap SE');

  // Fresh batch & changed queue
  verifyInvariant(freshQueue.tp === 480 && freshQueue.fp === 388, 'fresh queue counts');
  verifyInvariant(
    freshQueue.total === 868 && freshCapacity - freshQueue.total === 32,
    'fresh spare',
  );
  verifyApprox(freshQueue.tp / freshQueue.total, 480 / 868, 1e-12, 'fresh posterior ~55.3%');
  verifyInvariant(changedQueue.fp - freshQueue.fp === 97, '+97 extra clean flags');
  verifyInvariant(changedQueue.total - freshCapacity === 65, '+65 over capacity');
}

/** Non-overlapping two-phase crossfade helpers (P5: old drops to 0 before new rises). */
export const fadeOut = (t) => Math.max(0, Math.min(1, 1 - t / 0.42));
export const fadeIn = (t) => Math.max(0, Math.min(1, (t - 0.58) / 0.42));

/** Clamp duration so an animation strictly finishes before `clock.end - margin`. */
export function safeDur(clock, startTime, desired, margin = 0.34) {
  const avail = clock.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

/** Schedule a Value transition cleanly on or after a declared cue without overrunning. */
export function cueTo(s, c, cueId, val, target, { after = false, dur = 0.65, ease } = {}) {
  const info = c.cue(cueId);
  const t0 = after ? info.end : info.start;
  const duration = safeDur(c, t0, dur);
  const opts = ease ? { duration, ease } : { duration };
  if (after) {
    c.after(cueId, () => s.play(val.to(target, opts)));
  } else {
    c.on(cueId, () => s.play(val.to(target, opts)));
  }
  return info;
}

/** Continuous living scene-wide drift [0 -> target] bounded strictly inside the scene. */
export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

/** Mark a node (and its children) as non-occluding backdrop decoration. */
export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

/** Decorative aura wrapper so text over ambient glow never trips text_crowded. */
export function decorAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, midHex));
}

/** Subtle deep-space probability lattice marked as non-occluding decoration. */
export function cinemaGrid({
  color = '#24345a',
  accent = COSMOS.cyan,
  opacity = 0.48,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160) {
    lines.push(line([x, -460], [x, 460], { stroke: color, width: 1.1 }));
  }
  for (let y = -400; y <= 400; y += 160) {
    lines.push(line([-880, y], [880, y], { stroke: color, width: 1.1 }));
  }
  const arcs = [
    circle(520, { fill: null, stroke: accent, width: 1.2, dash: [10, 14] }).opacity(0.24),
    circle(790, { fill: null, stroke: '#4d6cb3', width: 1, dash: [6, 18] }).opacity(0.18),
  ];
  const stars = [];
  for (let i = 0; i < 70; i++) {
    const sx = Math.sin((i + seed * 17) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 29) * 269.5 + 9.1) * 19642.349;
    const x = -930 + (sx - Math.floor(sx)) * 1860;
    const y = -510 + (sy - Math.floor(sy)) * 1020;
    stars.push(
      dot(0.8 + (i % 4) * 0.3, i % 9 === 0 ? accent : '#8ea4d2')
        .opacity(0.15 + (i % 5) * 0.05)
        .at(x, y),
    );
  }
  return markDecor(
    group(...lines, ...arcs, ...stars)
      .opacity(opacity)
      .zIndex(-60),
  );
}

/** Glowing proportional bar anchored from its left edge at (x, y). */
export function glowBar(x, y, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeW = Math.max(4, w);
  const bar = rect(safeW, h, { fill: color, stroke: null, radius })
    .at(x + safeW / 2, y)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
}

/** Subtle glowing ribbon track (no card chrome, pure quantitative scale track). */
export function scaleTrack(x, y, w, h, { stroke = '#334670', fill = '#0f162a', radius = 10 } = {}) {
  return rect(w, h, { fill, stroke, width: 1.6, radius }).at(x + w / 2, y);
}

/** Glowing smooth curve from [x, y] points using gradient polyPath. */
export function neonCurve(pts, colors, { width = 4, glow = 10, opacity = 0.96 } = {}) {
  if (pts.length < 2) return group();
  const path = polyPath(pts);
  const paint =
    Array.isArray(colors) && colors.length >= 2
      ? linearGradient(pts[0], pts.at(-1), colors)
      : colors;
  const glowCol = Array.isArray(colors) ? colors.at(-1) : colors;
  const outer = new Node(path)
    .stroke(paint, width, opacity)
    .glow(glow, glowCol)
    .set('blend', 'screen');
  const core = new Node(path).stroke('#ffffff', 1.2, 0.4).set('blend', 'screen');
  return group(outer, core);
}
