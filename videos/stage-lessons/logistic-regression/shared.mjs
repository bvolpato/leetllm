// Shared cinematic visual primitives, verified math model, and timing helpers for `logistic-regression`.
// All numerical values derive directly from videos/films/logistic-regression/ and are asserted at load time.
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
  logLoss,
  regularizedObjective,
  sigmoid,
  softplus,
  stableDistribution,
} from '../../films/logistic-regression/arithmetic.mjs';
import { clamp, mix, phase, smooth } from '../../films/logistic-regression/construction.mjs';
import {
  auditProbabilities,
  calibrationBins,
  fitSteps,
  fittedWeights,
  multiclassLabels,
  multiclassRows,
  multiclassSteps,
  openingRequest,
  pairEvidence,
  penalizedWeights,
  penaltyFitStates,
  plattFitStates,
  regularizedMinimum,
  roundedScore,
  training,
  validation,
  validationScores,
} from '../../films/logistic-regression/fixtures.mjs';
import {
  boundaryGeometry,
  calibrationAudit,
  costForCounts,
  countsAt,
  curvatureFixture,
  expectedPolicy,
  gpFixture,
  gradientTrajectory,
  harmonicFixture,
  isotonicFixture,
  likelihoodRows,
  marginFixture,
  meanHessian,
  multiclassSnapshot,
  policies,
  policyAt,
  prevalenceFixture,
  probabilityCost,
  rankingMetrics,
  reviewRegionVertices,
  softplusNegative,
  trainingLoss,
  validateModel,
} from '../../films/logistic-regression/model.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  auditProbabilities,
  aura,
  boundaryGeometry,
  calibrationAudit,
  calibrationBins,
  cinematic3d,
  clamp,
  costForCounts,
  countsAt,
  curvatureFixture,
  expectedPolicy,
  fitSteps,
  fittedWeights,
  glowDot,
  glowTex,
  glowingTrail,
  gpFixture,
  gradientTrajectory,
  guardedDynamic,
  harmonicFixture,
  heroTitle,
  isotonicFixture,
  likelihoodRows,
  logLoss,
  marginFixture,
  meanHessian,
  metricReadout,
  mix,
  morphEquation,
  multiclassLabels,
  multiclassRows,
  multiclassSnapshot,
  multiclassSteps,
  openingRequest,
  orbitScene,
  pairEvidence,
  penalizedWeights,
  penaltyFitStates,
  phase,
  plattFitStates,
  policies,
  policyAt,
  prevalenceFixture,
  probabilityCost,
  rankingMetrics,
  regularizedMinimum,
  regularizedObjective,
  reviewRegionVertices,
  roundedScore,
  rule,
  sigmoid,
  smooth,
  softplus,
  softplusNegative,
  stableDistribution,
  training,
  trainingLoss,
  txt,
  validation,
  validationScores,
};

/** One semantic color role per concept across all 32 scenes of Logistic Regression. */
export const ROLE = Object.freeze({
  positive: COSMOS.rose, // review required (y = 1)
  negative: COSMOS.blue, // routine / automatic (y = 0)
  score: COSMOS.cyan, // probability / sigmoid score
  threshold: COSMOS.gold, // decision cut / policy / optimal highlight
  loss: COSMOS.violet, // cross-entropy / curvature / log-odds
  good: COSMOS.emerald, // win / feasible / stable / improved
  warn: COSMOS.amber, // penalty / overflow / warning
});

/** Small deterministic dot product helper. */
export function dotVec(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** Exact fitted logit for the opening request REQ-10234 (3, 5). */
export const FITTED_OPENING_LOGIT = dotVec(fittedWeights, [1, openingRequest.a, openingRequest.s]);

/** Validation requests sorted by descending predicted probability. */
export const SORTED_VAL = Object.freeze([...validationScores].sort((a, b) => b.p - a.p));

/** Scikit-learn unpenalized reference weights from content.md and implementation-parity. */
export const SKLEARN_WEIGHTS = Object.freeze([-4.914, 3.414, -0.964]);

/** Fresh operating point batch fixture (4 requests, 2 slots, $12 FP / $108 FN). */
export const FRESH_BATCH = Object.freeze({
  probs: [0.05, 0.18, 0.45, 0.75],
  fpCost: 12,
  fnCost: 108,
  seats: 2,
  cuts: [0.1, 0.3, 0.6],
  offers: [0.1, 0.3, 0.6].map((cut) => expectedPolicy([0.05, 0.18, 0.45, 0.75], cut, 12, 108, 2)),
});

/** Build-time mathematical verification of every spoken number across all 32 scenes. */
export function verifyLogisticInvariants() {
  verifyInvariant(validateModel() === true, 'films/logistic-regression/model.mjs validateModel()');

  // Opening request & rounded vs full fit
  verifyApprox(openingRequest.p, 0.624, 0.001, 'opening request score ~0.624');
  verifyApprox(roundedScore, 0.5, 1e-12, 'rounded logit 0.5');
  verifyApprox(sigmoid(roundedScore), 0.62246, 0.001, 'sigmoid(0.5) ~0.622');
  verifyApprox(sigmoid(1) - sigmoid(-1), 0.46212, 0.001, 'center delta p ~0.462');
  verifyApprox(sigmoid(6) - sigmoid(4), 0.01553, 0.001, 'tail delta p ~0.016');

  // Log loss & stability
  verifyApprox(-Math.log(0.1), 2.302585, 0.001, '-ln(0.1) ~2.303');
  verifyApprox(-Math.log(0.9), 0.10536, 0.001, '-ln(0.9) ~0.105');
  verifyApprox(logLoss(-1000, 1), 1000, 1e-12, 'stable softplus loss at z=-1000');

  // Curvature at z = -8, y = 1
  const curv = curvatureFixture(-8, 1);
  verifyApprox(curv.bce, -0.999665, 0.0005, 'BCE gradient at z=-8');
  verifyInvariant(Math.abs(curv.squaredError) < 0.001, 'MSE gradient < 0.001 at z=-8');

  // Worked row R4 & first batch update
  verifyApprox(fitSteps[1][0], 0, 1e-12, 'first step intercept 0');
  verifyApprox(fitSteps[1][1], 0.06875, 1e-12, 'first step ambiguity 0.06875');
  verifyApprox(fitSteps[1][2], 0.075, 1e-12, 'first step support 0.075');
  verifyApprox(fittedWeights[0], -4.894, 0.002, 'fitted w0 ~ -4.894');
  verifyApprox(fittedWeights[1], 3.399, 0.002, 'fitted w1 ~ 3.399');
  verifyApprox(fittedWeights[2], -0.959, 0.002, 'fitted w2 ~ -0.959');
  verifyApprox(trainingLoss([0, 0, 0]), Math.LN2, 1e-12, 'initial loss ln(2)');
  verifyApprox(trainingLoss(fittedWeights), 0.4072, 0.001, 'fitted training loss ~0.4072');

  // Regularized separation minimum (0.2 a = sigmoid(-a) -> a ≈ 1.1775)
  verifyApprox(regularizedMinimum, 1.177505, 1e-4, 'regularized optimum a ~1.1775');

  // Policies & capacity
  verifyInvariant(policies[0].cost === 240 && policies[0].queue === 2, 'cut 0.80: 2 reviews, $240');
  verifyInvariant(policies[1].cost === 138 && policies[1].queue === 4, 'cut 0.50: 4 reviews, $138');
  verifyInvariant(policies[2].cost === 36 && policies[2].queue === 6, 'cut 0.20: 6 reviews, $36');

  // Denominators & harmonic mean
  const hVal = harmonicFixture(4, 2, 0);
  verifyApprox(hVal.precision, 2 / 3, 1e-12, 'precision 4/6');
  verifyApprox(hVal.recall, 1, 1e-12, 'recall 4/4');
  verifyApprox(hVal.f1, 0.8, 1e-12, 'F1 = 0.8');
  const hExt = harmonicFixture(1, 0, 99);
  verifyApprox(hExt.arithmetic, 0.505, 1e-12, 'arithmetic mean 0.505');
  verifyApprox(hExt.f1, 2 / 101, 1e-12, 'harmonic F1 ~0.0198');

  // Calibrated cost & break-even cut
  const c20 = probabilityCost(0.2);
  verifyApprox(c20.automatic, 24, 1e-12, 'p=0.20 auto $24');
  verifyApprox(c20.review, 14.4, 1e-12, 'p=0.20 review $14.40');
  const c05 = probabilityCost(0.05);
  verifyApprox(c05.automatic, 6, 1e-12, 'p=0.05 auto $6');
  verifyApprox(c05.review, 17.1, 1e-12, 'p=0.05 review $17.10');
  verifyApprox(c20.cut, 18 / 138, 1e-12, 'Bayes break-even 18/138 ~0.130');
  verifyInvariant(
    validationScores.filter((v) => v.p >= c20.cut).length === 7,
    '7 validation requests qualify at Bayes cut',
  );

  // Ranking, prevalence & AP
  const basePrev = prevalenceFixture('base');
  const repPrev = prevalenceFixture('repeat');
  const easyPrev = prevalenceFixture('easy');
  verifyApprox(basePrev.auc, 13 / 16, 1e-12, 'base AUC 0.8125');
  verifyApprox(basePrev.ap, 0.854167, 0.001, 'base AP ~0.854');
  verifyApprox(repPrev.fpr, 0.5, 1e-12, 'repeat FPR 0.5');
  verifyApprox(repPrev.auc, 13 / 16, 1e-12, 'repeat AUC 0.8125');
  verifyApprox(repPrev.precision, 4 / 54, 1e-12, 'repeat precision ~0.0741');
  verifyApprox(easyPrev.fpr, 2 / 104, 1e-12, 'easy FPR ~0.0192');
  verifyApprox(easyPrev.auc, 413 / 416, 1e-12, 'easy AUC ~0.9928');
  verifyApprox(easyPrev.precision, 2 / 3, 1e-12, 'easy precision 2/3');

  // Calibration, ECE, Brier & V4 flip
  const cal4 = calibrationAudit({ binCount: 4 });
  const cal8 = calibrationAudit({ binCount: 8 });
  verifyApprox(cal4.ece, 0.138625, 1e-6, '4-bin ECE ~0.139');
  verifyApprox(cal4.brier, 0.15838, 0.001, 'Brier ~0.158');
  verifyApprox(cal8.ece, 0.153875, 1e-6, '8-bin ECE ~0.154');
  const flippedLabels = validation.map((r) => r[2]);
  flippedLabels[3] = 1;
  const calFlip = calibrationAudit({ labels: flippedLabels, binCount: 4 });
  verifyApprox(cal4.f1, 0.75, 1e-12, 'original F1 at 0.5 is 0.75');
  verifyApprox(calFlip.f1, 8 / 9, 1e-12, 'flipped V4 F1 ~0.889');
  verifyApprox(calFlip.ece, 0.209, 0.002, 'flipped V4 ECE ~0.209');

  // Multiclass & stable softmax
  verifyApprox(multiclassSnapshot(1000).loss, 0.005545, 0.0001, 'multiclass 1000-step loss');
  verifyApprox(stableDistribution([1000, 0, -1000]).lossFor(2), 2000, 1e-12, 'extreme class loss');
  verifyApprox(-Math.log(1e-15), 34.5388, 0.01, 'clipped 1e-15 penalty ~34.54');

  // Margin & GP kernel
  verifyApprox(marginFixture(0.4).hinge, 0.6, 1e-12, 'hinge at 0.4 is 0.6');
  verifyApprox(marginFixture(1.4).hinge, 0, 1e-12, 'hinge at 1.4 is 0');
  verifyApprox(marginFixture(1.4).logistic, 0.2199, 0.001, 'logistic at 1.4 ~0.220');
  verifyApprox(gpFixture(1).similarity, 0.60653, 0.001, 'RBF d=1 ~0.607');
  verifyApprox(gpFixture(3).similarity, 0.01111, 0.001, 'RBF d=3 ~0.011');
  verifyApprox(gpFixture(0).mean, 2 / 1.04, 1e-12, 'GP mean at x0 ~1.923');
  verifyApprox(gpFixture(0).latentStd, Math.sqrt(1 - 1 / 1.04), 1e-12, 'GP latent std ~0.196');

  // Implementation parity & learning rates
  const r3Base = sigmoid(dotVec(fittedWeights, [1, 2, 3]));
  const r3Pen = sigmoid(dotVec(penalizedWeights, [1, 2, 3]));
  verifyApprox(r3Base, 0.274, 0.01, 'R3 unpenalized ~0.27');
  verifyApprox(r3Pen, 0.52, 0.01, 'R3 penalized ~0.52');
  verifyInvariant(gradientTrajectory(0.2, 1)[1].loss < Math.LN2, 'lr=0.2 lowers loss');
  verifyInvariant(gradientTrajectory(2, 1)[1].loss > 2.0, 'lr=2.0 jumps above 2');

  // Fresh operating point
  verifyApprox(FRESH_BATCH.offers[0].cost, 24.84, 1e-9, 'fresh cut 0.10 cost $24.84');
  verifyApprox(FRESH_BATCH.offers[1].cost, 34.44, 1e-9, 'fresh cut 0.30 cost $34.44');
  verifyApprox(FRESH_BATCH.offers[2].cost, 76.44, 1e-9, 'fresh cut 0.60 cost $76.44');
}

/** Non-overlapping two-phase crossfade helpers (old reaches 0 at 0.42 before new rises at 0.58). */
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

/** Subtle deep-space coordinate lattice marked as non-occluding decoration. */
export function cinemaGrid({
  color = '#24345a',
  accent = COSMOS.cyan,
  opacity = 0.45,
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
    circle(520, { fill: null, stroke: accent, width: 1.2, dash: [10, 14] }).opacity(0.22),
    circle(790, { fill: null, stroke: '#4d6cb3', width: 1, dash: [6, 18] }).opacity(0.16),
  ];
  const stars = [];
  for (let i = 0; i < 65; i++) {
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

/** Vertical glowing bar rising upward from baseline (cx, baseY). */
export function glowCol(cx, baseY, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeH = Math.max(4, h);
  const bar = rect(w, safeH, { fill: color, stroke: null, radius })
    .at(cx, baseY - safeH / 2)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
}

/** Subtle quantitative scale track (no card chrome). */
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
  const core = new Node(path).stroke('#ffffff', 1.2, 0.38).set('blend', 'screen');
  return group(outer, core);
}

/** Lightweight 2D mathematical coordinate mapper + clean axes with phone-readable ticks. */
export function makeAxes({
  x0,
  y0,
  w,
  h,
  xDom,
  yDom,
  xTicks = [],
  yTicks = [],
  xLabel = '',
  yLabel = '',
  grid = true,
}) {
  const px = (xv) => x0 + ((xv - xDom[0]) / (xDom[1] - xDom[0])) * w;
  const py = (yv) => y0 + h - ((yv - yDom[0]) / (yDom[1] - yDom[0])) * h;
  const pt = (xv, yv) => [px(xv), py(yv)];

  const nodes = [];
  if (grid) {
    for (const tx of xTicks) {
      const gx = px(tx);
      nodes.push(markDecor(line([gx, y0], [gx, y0 + h], { stroke: '#1d2947', width: 1.2 })));
    }
    for (const ty of yTicks) {
      const gy = py(ty);
      nodes.push(markDecor(line([x0, gy], [x0 + w, gy], { stroke: '#1d2947', width: 1.2 })));
    }
  }
  // Primary axes
  nodes.push(
    line([x0, y0 + h], [x0 + w, y0 + h], { stroke: '#4d6499', width: 2.6 }),
    line([x0, y0], [x0, y0 + h], { stroke: '#4d6499', width: 2.6 }),
  );
  // Ticks
  for (const tx of xTicks) {
    const gx = px(tx);
    const label = Number.isInteger(tx) ? String(tx) : tx.toFixed(tx % 0.1 === 0 ? 1 : 2);
    nodes.push(
      line([gx, y0 + h], [gx, y0 + h + 8], { stroke: '#5d77b0', width: 2 }),
      txt(label, gx, y0 + h + 32, 26, COSMOS.muted, 'mono'),
    );
  }
  for (const ty of yTicks) {
    const gy = py(ty);
    const label = Number.isInteger(ty) ? String(ty) : ty.toFixed(1);
    nodes.push(
      line([x0 - 8, gy], [x0, gy], { stroke: '#5d77b0', width: 2 }),
      txt(label, x0 - 20, gy, 26, COSMOS.muted, 'mono', 'right'),
    );
  }
  if (xLabel) {
    nodes.push(txt(xLabel, x0 + w / 2, y0 + h + 74, 26, COSMOS.muted, 'sans'));
  }
  if (yLabel) {
    nodes.push(txt(yLabel, x0, y0 - 28, 26, COSMOS.muted, 'sans', 'left'));
  }

  return { px, py, pt, node: group(...nodes) };
}

/** Sample a function f(x) over [a, b] into screen coordinates using an axes helper. */
export function sampleCurve(ax, fn, a, b, n = 90) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const xv = a + ((b - a) * i) / n;
    pts.push(ax.pt(xv, fn(xv)));
  }
  return pts;
}
