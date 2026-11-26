// Shared cinematic primitives, verified math model, and timing helpers for `language-modeling`.
// All numerical values derive directly from videos/films/language-modeling/ and are asserted at load time.
import {
  Node,
  circle,
  curve3d,
  dot,
  group,
  line,
  line3d,
  linear,
  linearGradient,
  point3d,
  polyPath,
  rect,
  surface,
} from 'vizmatic/stage';
import { stableSoftmax } from 'vizmatic';
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
  wireframeSlab3d,
} from '../cinematic-kit.mjs';
import {
  CACHE_PARITY_FIXTURE,
  CONDITIONAL_ROWS,
  CORPUS,
  FITTED_NGRAM,
  SENTENCE,
  SPLIT_CAT,
  TARGET_PROBS,
  VERBS,
} from '../../films/language-modeling/fixtures.mjs';
import {
  LOSS,
  architectureMemoryState,
  conditionalDistribution,
  counts,
  fittedPrediction,
  generationWork,
  lifecycleSnapshot,
  localGradientCredit,
  rawKvBytes,
  selectSample,
} from '../../films/language-modeling/model.mjs';
import { validateModel } from '../../films/language-modeling/validation.mjs';

export {
  CACHE_PARITY_FIXTURE,
  CINEMA_FRAME,
  CONDITIONAL_ROWS,
  CORPUS,
  COSMOS,
  FITTED_NGRAM,
  LOSS,
  SENTENCE,
  SPLIT_CAT,
  TARGET_PROBS,
  VERBS,
  architectureMemoryState,
  aura,
  cinematic3d,
  conditionalDistribution,
  counts,
  curve3d,
  fittedPrediction,
  generationWork,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lifecycleSnapshot,
  line3d,
  localGradientCredit,
  metricReadout,
  morphEquation,
  orbitScene,
  point3d,
  rawKvBytes,
  rule,
  selectSample,
  stableSoftmax,
  surface,
  txt,
  wireframeSlab3d,
};

/** One semantic color role per concept across all 28 scenes of Language Modeling. */
export const ROLE = Object.freeze({
  prefix: COSMOS.cyan,
  target: COSMOS.gold,
  prob: COSMOS.blue,
  alt: COSMOS.emerald,
  rare: COSMOS.violet,
  danger: COSMOS.rose,
  warm: COSMOS.amber,
});

/** Exact article code-comment corpus & compiler softmax logits used across extended scenes. */
export const CODE_COMMENTS = Object.freeze([
  ['function', 'returns', 'value'],
  ['function', 'returns', 'value'],
  ['method', 'returns', 'result'],
  ['handler', 'returns', 'value'],
  ['test', 'returns', 'result'],
  ['test', 'returns', 'error'],
]);

export const COMPILER_TOKENS = Object.freeze(['error', 'warning', 'success', 'the', '</s>']);
export const COMPILER_LOGITS = Object.freeze([3.0, 1.5, -1.0, -2.0, -3.0]);
export const COMPILER_PROBS = Object.freeze(stableSoftmax([...COMPILER_LOGITS]));

export const FITTED_FUNCTION = Object.freeze(fittedPrediction(['function', 'returns']));
export const FITTED_TEST = Object.freeze(fittedPrediction(['test', 'returns']));
export const GRAD_CREDIT = Object.freeze(localGradientCredit());
export const WORK_3_3 = Object.freeze(generationWork(3, 3));

/** Build-time mathematical verification of every spoken number across all 28 scenes. */
export function verifyLanguageModelingInvariants() {
  verifyInvariant(validateModel() === true, 'films/language-modeling validateModel()');

  // 1. Intro chain step: 0.60 * 0.80 = 0.48
  const pSat = conditionalDistribution('The cat').find((r) => r.token === 'sat').probability;
  const pEndAfterSat = conditionalDistribution('The cat sat').find(
    (r) => r.token === 'end',
  ).probability;
  verifyApprox(pSat, 0.6, 1e-12, 'P(sat | The cat) = 0.60');
  verifyApprox(pEndAfterSat, 0.8, 1e-12, 'P(end | The cat sat) = 0.80');
  verifyApprox(pSat * pEndAfterSat, 0.48, 1e-12, 'P(sat, end | The cat) = 0.48');

  // 2. Bigram counts & smoothing
  const cRow = counts(CORPUS);
  verifyInvariant(cRow.sat === 2 && cRow.slept === 1 && cRow.ate === 0, 'cat counts 2,1,0');
  verifyApprox((cRow.sat + 1) / 6, 0.5, 1e-12, 'add-one sat 3/6');
  verifyApprox((cRow.slept + 1) / 6, 1 / 3, 1e-12, 'add-one slept 2/6');
  verifyApprox((cRow.ate + 1) / 6, 1 / 6, 1e-12, 'add-one ate 1/6');

  // 3. Full vocabulary smoothing on 6 code comments
  const retCounts = { value: 3, result: 2, error: 1, exception: 0 };
  verifyInvariant(CODE_COMMENTS.length === 6, '6 code comments');
  verifyApprox((retCounts.exception + 1) / (6 + 4), 0.1, 1e-12, 'restricted 4-vocab 1/10');
  verifyApprox((retCounts.exception + 1) / (6 + 10), 1 / 16, 1e-12, 'full 10-vocab 1/16');
  verifyApprox(3 / 7, 0.42857, 1e-4, '7-record value 3/7');
  verifyApprox(1 / 7, 0.14286, 1e-4, '7-record exception 1/7');

  // 4. Sparse history combinatorics
  verifyApprox(50000 ** 4, 6.25e18, 1e6, '50000^4 = 6.25e18');

  // 5. Context tiny neural head
  const tiredP = stableSoftmax([0, 2, -2]);
  const hungryP = stableSoftmax([0, -2, 2]);
  verifyInvariant(tiredP[1] > tiredP[0] && tiredP[1] > tiredP[2], 'tired favors slept');
  verifyInvariant(hungryP[2] > hungryP[0] && hungryP[2] > hungryP[1], 'hungry favors ate');

  // 6. Neural forward fitted n-gram
  const embParams = FITTED_NGRAM.vocab.length * FITTED_NGRAM.embeddings[0].length;
  const mapParams = FITTED_NGRAM.weights.length * FITTED_NGRAM.weights[0].length;
  const biasParams = FITTED_NGRAM.bias.length;
  verifyInvariant(
    embParams === 48 &&
      mapParams === 96 &&
      biasParams === 8 &&
      embParams + mapParams + biasParams === 152,
    '48 + 96 + 8 = 152 trainable params',
  );
  verifyApprox(FITTED_FUNCTION.logits[7], 7.904, 0.002, 'value logit ~7.904');
  verifyApprox(FITTED_FUNCTION.logits[4], 0.678, 0.002, 'result logit ~0.678');
  verifyApprox(FITTED_FUNCTION.logits[0], 0.036, 0.002, 'error logit ~0.036');
  verifyApprox(FITTED_FUNCTION.probabilities[7], 0.9984, 0.0005, 'value prob ~99.84%');
  verifyInvariant(
    FITTED_TEST.probabilities[4] > FITTED_TEST.probabilities[0],
    'test returns: result edges error',
  );

  // 7. Neural gradient credit
  verifyApprox(GRAD_CREDIT.residual[2], -0.7, 1e-12, 'C residual -0.7');
  verifyApprox(GRAD_CREDIT.weightGradients[0][2], -1.4, 1e-12, 'w_0,C grad -1.4');
  verifyApprox(GRAD_CREDIT.weightGradients[1][2], 0.7, 1e-12, 'w_1,C grad +0.7');
  verifyApprox(GRAD_CREDIT.inputGradient[0], -0.39, 1e-12, 'input[0] grad -0.39');

  // 8. Conditional entropy floor
  verifyApprox((2 * Math.log(2)) / 6, 0.231049, 0.001, '6-target floor ~0.231 nats');
  const hTwoThirds = -(2 / 3) * Math.log(2 / 3) - (1 / 3) * Math.log(1 / 3);
  verifyApprox(hTwoThirds, 0.636514, 0.001, '2/3 vs 1/3 floor ~0.637 nats');

  // 9. Compiler softmax & temperature
  verifyApprox(COMPILER_PROBS[0], 0.8, 0.001, 'compiler error ~0.800');
  verifyApprox(COMPILER_PROBS[1], 0.178, 0.001, 'compiler warning ~0.178');
  verifyApprox(
    stableSoftmax(COMPILER_LOGITS.map((v) => v / 0.5))[0],
    0.952,
    0.002,
    'T=0.5 leading ~0.952',
  );
  verifyApprox(
    stableSoftmax(COMPILER_LOGITS.map((v) => v / 2.0))[0],
    0.575,
    0.002,
    'T=2.0 leading ~0.575',
  );
  verifyApprox(0.6 / (0.6 + 0.3), 2 / 3, 1e-12, 'top-2 renorm 2/3');

  // 10. BERT 15% quota on 1000
  verifyInvariant(
    1000 * 0.15 === 150 && 150 * 0.8 === 120 && 150 * 0.1 === 15,
    'BERT 150/120/15/15',
  );

  // 11. Sequence chain rule & loss/perplexity
  verifyApprox(0.8 * 0.6 * 0.6, 0.288, 1e-12, 'prefix prob 0.288');
  verifyApprox(0.288 * 0.8, 0.2304, 1e-12, 'sentence prob 0.2304');
  verifyApprox(Math.exp(LOSS), 1.4434, 0.002, '4-token perplexity ~1.443');
  verifyApprox(Math.exp((LOSS * 4) / 5), 1.3413, 0.002, '5-token perplexity ~1.341');

  // 12. Pooled evaluation & UTF-8 bits per byte
  verifyApprox(2 ** (10 / 4), 5.65685, 0.005, 'pooled ppl ~5.657');
  verifyApprox((2 + 8) / 2, 5.0, 1e-12, 'avg batch ppl 5.0');
  verifyApprox(2 ** ((1 + 3) / 2), 4.0, 1e-12, 'equal batch loss ppl 4.0');
  verifyInvariant('The cat sat'.length === 11, '11 UTF-8 bytes');
  verifyApprox((4 * LOSS) / Math.log(2) / 11, 0.1925, 0.001, 'bits per byte invariant');

  // 13. Greedy branch
  verifyApprox(0.6 * 0.1, 0.06, 1e-12, 'A path 6%');
  verifyApprox(0.4 * 0.9, 0.36, 1e-12, 'B path 36%');

  // 14. Cached parity max diff
  let maxParityDiff = 0;
  for (let i = 0; i < CACHE_PARITY_FIXTURE.full.length; i++) {
    for (let j = 0; j < CACHE_PARITY_FIXTURE.full[i].length; j++) {
      maxParityDiff = Math.max(
        maxParityDiff,
        Math.abs(CACHE_PARITY_FIXTURE.full[i][j] - CACHE_PARITY_FIXTURE.cached[i][j]),
      );
    }
  }
  verifyInvariant(maxParityDiff < 1e-6, 'cached parity matches full pass within 1e-6');

  // 15. Work & cache budget & architecture memory
  verifyInvariant(
    WORK_3_3.uncachedPositions === 12 &&
      WORK_3_3.uncachedCells === 50 &&
      WORK_3_3.cachedPositions === 5 &&
      WORK_3_3.cachedCells === 18,
    'work counts 12/50 vs 5/18',
  );
  verifyApprox(
    rawKvBytes({ layers: 32, heads: 8, width: 128, positions: 2048 * 4, bytes: 2 }) / 1024 ** 3,
    1,
    1e-12,
    '2048 x 4 = 1 GiB',
  );
  verifyApprox(
    rawKvBytes({ layers: 32, heads: 8, width: 128, positions: 32768 * 4, bytes: 2 }) / 1024 ** 3,
    16,
    1e-12,
    '32768 x 4 = 16 GiB',
  );
  verifyApprox(
    rawKvBytes({ layers: 32, heads: 8, width: 128, positions: 32768 * 32, bytes: 2 }) / 1024 ** 3,
    128,
    1e-12,
    '32768 x 32 = 128 GiB',
  );
  verifyApprox(architectureMemoryState(0).gib, 16, 1e-12, '8 heads = 16 GiB');
  verifyApprox(architectureMemoryState(1).gib, 8, 1e-12, '4 heads = 8 GiB');

  // 16. Context policy, transfer & fresh budgeted rollout
  verifyInvariant(25 + 8 === 33 && 24 + 8 === 32, 'context policy 25+8=33 vs 24+8=32');
  verifyApprox(-Math.log(0.3), 1.20397, 0.001, 'transfer -ln(0.3) ~1.204');
  verifyApprox(Math.sqrt(8), 2.8284, 0.001, 'fresh rollout ppl sqrt(8)');
}

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, t) => a + (b - a) * clamp01(t);

/** Non-overlapping two-phase crossfade helpers (old hits 0 by 0.42, new enters at 0.58). */
export const fadeOut = (t) => clamp01(1 - t / 0.42);
export const fadeIn = (t) => clamp01((t - 0.58) / 0.42);

/** Clamp duration so an animation strictly finishes before `clock.end - margin`. */
export function safeDur(clock, startTime, desired = 0.6, margin = 0.34) {
  const avail = clock.end - startTime - margin;
  return Math.max(0.08, Math.min(desired, avail));
}

/** Schedule a Value transition cleanly on or after a declared cue without overrunning. */
export function cueTo(s, c, cueId, val, target, { after = false, dur = 0.6, ease } = {}) {
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

/** Drive a continuous beat-long Value across a voice cue's spoken span without overrunning. */
export function voiceSpan(s, c, cueId, val, target = 1) {
  const info = c.cue(cueId);
  const duration = safeDur(c, info.start, Math.max(0.4, info.end - info.start), 0.38);
  c.on(cueId, () => s.play(val.to(target, { duration, ease: linear })));
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

/** Subtle deep-space lattice with .opacity(0.14) grid lines and .zIndex(-60). */
export function cinemaGrid({ accent = COSMOS.gold, seed = 1 } = {}) {
  const nodes = [];
  for (let x = -840; x <= 840; x += 240) {
    nodes.push(line([x, -540], [x, 540], { stroke: '#1b2848', width: 1.1 }).opacity(0.14));
  }
  for (let y = -420; y <= 420; y += 210) {
    nodes.push(line([-960, y], [960, y], { stroke: '#1b2848', width: 1.1 }).opacity(0.14));
  }
  for (let i = 0; i < 42; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    nodes.push(
      dot(0.8 + (i % 4) * 0.3, i % 8 === 0 ? accent : '#8ea4d2')
        .opacity(0.15 + (i % 5) * 0.045)
        .at(-930 + (sx - Math.floor(sx)) * 1860, -510 + (sy - Math.floor(sy)) * 1020),
    );
  }
  return markDecor(group(...nodes).zIndex(-60));
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

/** Glowing vertical bar growing upward from baseline yBase. */
export function glowVBar(cx, yBase, w, h, color, { glow = 8, radius = 8, opacity = 1 } = {}) {
  const safeH = Math.max(4, h);
  const bar = rect(w, safeH, { fill: color, stroke: null, radius })
    .at(cx, yBase - safeH / 2)
    .opacity(opacity);
  if (glow > 0) bar.glow(glow, color);
  return bar;
}

/** Subtle scale track behind proportional ribbons or meters (no card chrome). */
export function scaleTrack(x, y, w, h, { stroke = '#334670', fill = '#0d1427', radius = 10 } = {}) {
  return rect(w, h, { fill, stroke, width: 1.6, radius }).at(x + w / 2, y);
}

/** Compact glowing token chip for single tokens (never for prose or bullet text). */
export function tokenChip(
  word,
  x,
  y,
  color = ROLE.prefix,
  { w = 132, h = 58, size = 30, fill = '#10182b', glow = 6, dash = null, opacity = 1 } = {},
) {
  const style = { fill, stroke: color, width: 2.4, radius: 12 };
  if (dash) style.dash = dash;
  const box = rect(w, h, style).at(x, y);
  if (glow > 0) box.glow(glow, color);
  return group(box, txt(word, x, y + 1, size, color, 'mono')).opacity(opacity);
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
