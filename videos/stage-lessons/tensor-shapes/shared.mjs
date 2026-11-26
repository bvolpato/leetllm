// Shared cinematic primitives, verified math model, and timing helpers for `tensor-shapes`.
// All numerical values derive directly from videos/films/tensor-shapes/ and are asserted at load time.
import { Node, circle, dot, group, line, linear, polyPath, rect } from 'vizmatic/stage';
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
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';
import {
  attentionScores,
  bias,
  centeredWhitePixel,
  featureBiasContract,
  featureMean,
  firstSnippetWords,
  headOneTokenOne,
  headZeroTokenOne,
  imageChannelMeans,
  reshapeBatch0,
  rightSquare,
  sentenceWords,
  sequence0,
  sequence1,
  shape,
  shifted,
  squareInput,
  tensor,
  tokenMean,
  tokenOffsets,
  transposeBatch0,
  wrongSquare,
} from '../../films/tensor-shapes/fixtures.mjs';
import {
  attentionSlicePrediction,
  headFrame,
  precisionFrame,
} from '../../films/tensor-shapes/model.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  attentionScores,
  attentionSlicePrediction,
  aura,
  bias,
  centeredWhitePixel,
  cinematic3d,
  featureBiasContract,
  featureMean,
  firstSnippetWords,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  headFrame,
  headOneTokenOne,
  headZeroTokenOne,
  heroTitle,
  imageChannelMeans,
  metricReadout,
  orbitScene,
  precisionFrame,
  reshapeBatch0,
  rightSquare,
  rule,
  sentenceWords,
  sequence0,
  sequence1,
  shape,
  shifted,
  squareInput,
  tensor,
  tokenMean,
  tokenOffsets,
  transposeBatch0,
  txt,
  wireframeSlab3d,
  wrongSquare,
};

/** Semantic color roles across all 12 scenes of Tensor Shapes. */
export const ROLE = Object.freeze({
  batch0: COSMOS.cyan,
  batch1: COSMOS.violet,
  token: COSMOS.blue,
  feature: COSMOS.gold,
  good: COSMOS.emerald,
  bad: COSMOS.rose,
  stride: COSMOS.amber,
});

export const PREC = Object.freeze(precisionFrame());
export const SLICE_PRED = Object.freeze(attentionSlicePrediction());
export const HEADS_REF = Object.freeze(headFrame({ beat: 2, progress: 1, cues: {} }));

/** Build-time mathematical invariants verified against videos/films/tensor-shapes/ (A1). */
export function verifyTensorShapesInvariants() {
  verifyInvariant(tensor.length === 24 && shape.join(',') === '2,3,4', 'tensor shape (2,3,4)');
  verifyInvariant(sequence0[0].join(',') === '0,1,2,3', 'Birds = [0,1,2,3]');
  verifyInvariant(sequence0[1].join(',') === '4,5,6,7', 'migrate = [4,5,6,7]');
  verifyInvariant(sequence1[1].join(',') === '16,17,18,19', 'enjoy = [16,17,18,19]');

  // Broadcast checks
  verifyInvariant(shifted.slice(4, 8).join(',') === '104,205,306,407', 'migrate + feature bias');
  verifyInvariant(wrongSquare[0].join(',') === '10,21,32', 'bare (3,) wrong square row 0');
  verifyInvariant(rightSquare[0].join(',') === '10,11,12', '(3,1) right square row 0');
  verifyInvariant(centeredWhitePixel.join(',') === '0.48,0.52,0.56', 'centered white pixel');
  verifyInvariant(!featureBiasContract(shape, [10, 20, 30]).accepted, 'short bias rejected');
  verifyInvariant(featureBiasContract(shape, bias).accepted, '4-entry bias accepted');

  // Reductions
  verifyInvariant(tokenMean[0].join(',') === '4,5,6,7', 'batch 0 token mean [4,5,6,7]');
  verifyApprox(featureMean[0][1], 5.5, 1e-12, 'migrate feature mean 5.5');

  // Precision float32 vs float64
  verifyInvariant(
    PREC.narrowSum === 0 && PREC.narrowMean === 0,
    'float32 tie-to-even cancels to 0',
  );
  verifyInvariant(PREC.wideSum === 1, 'float64 sum preserves 1');
  verifyApprox(PREC.wideMean, 1 / 3, 1e-12, 'float64 mean 1/3');

  // Reshape vs Transpose & strides
  verifyInvariant(reshapeBatch0[1].join(',') === '3,4,5', 'reshape mixes Birds 3 with migrate 4,5');
  verifyInvariant(
    transposeBatch0[3].join(',') === '3,7,11',
    'transpose keeps last feature [3,7,11]',
  );

  // Attention scores & slice
  verifyInvariant(attentionScores[0][1].join(',') === '38,126,214', 'migrate scores [38,126,214]');
  verifyInvariant(
    SLICE_PRED.score === 214 && SLICE_PRED.shape.join(',') === '1,3',
    'slice [1,3], 214',
  );

  // Multi-head split vs direct reshape
  verifyInvariant(HEADS_REF.correctPair.join(',') === '4,5', 'split+transpose gives migrate [4,5]');
  verifyInvariant(HEADS_REF.directPair.join(',') === '2,3', 'direct reshape gives Birds [2,3]');
  verifyInvariant(
    HEADS_REF.correct[1][1][0].join(',') === '14,15',
    'Children head 1 correct [14,15]',
  );
  verifyInvariant(
    HEADS_REF.direct[1][1][0].join(',') === '18,19',
    'Children head 1 direct [18,19]',
  );
}

/** Non-overlapping two-phase crossfade helpers (P5). */
export const mix = (a, b, p) => a + (b - a) * p;
export const fadeOut = (t) => Math.max(0, Math.min(1, 1 - t / 0.42));
export const fadeIn = (t) => Math.max(0, Math.min(1, (t - 0.58) / 0.42));

/** Clamp duration so an animation strictly ends before clock.end - margin. */
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
  if (after) c.after(cueId, () => s.play(val.to(target, opts)));
  else c.on(cueId, () => s.play(val.to(target, opts)));
  return info;
}

/** Continuous scene-wide drift bounded strictly inside the scene. */
export function livingDrift(s, c, val, target = 1, { startOffset = 0.05, endMargin = 0.45 } = {}) {
  const span = c.end - c.start;
  const duration = Math.max(0.3, span - startOffset - endMargin);
  c.at(startOffset, () => s.play(val.to(target, { duration, ease: linear })));
  return duration;
}

/** Mark node + children as non-occluding decoration. */
export function markDecor(node) {
  if (!node) return node;
  if (!node.data) node.data = {};
  node.data.decoration = true;
  if (Array.isArray(node.children)) {
    for (const child of node.children) markDecor(child);
  }
  return node;
}

export function decorAura(x, y, radius, innerHex, midHex = '#07091000') {
  return markDecor(aura(x, y, radius, innerHex, midHex));
}

export function cinemaGrid({
  color = '#24345a',
  accent = COSMOS.cyan,
  opacity = 0.45,
  seed = 1,
} = {}) {
  const lines = [];
  for (let x = -800; x <= 800; x += 160)
    lines.push(line([x, -460], [x, 460], { stroke: color, width: 1.1 }));
  for (let y = -400; y <= 400; y += 160)
    lines.push(line([-880, y], [880, y], { stroke: color, width: 1.1 }));
  const stars = [];
  for (let i = 0; i < 65; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    stars.push(
      dot(0.8 + (i % 4) * 0.3, i % 9 === 0 ? accent : '#8ea4d2')
        .opacity(0.15 + (i % 5) * 0.05)
        .at(-930 + (sx - Math.floor(sx)) * 1860, -510 + (sy - Math.floor(sy)) * 1020),
    );
  }
  return markDecor(
    group(...lines, ...stars)
      .opacity(opacity)
      .zIndex(-60),
  );
}

/** Render a crisp glowing tensor cell (no prose card chrome; pure numeric matrix cell). */
export function numCell(
  val,
  cx,
  cy,
  {
    w = 96,
    h = 64,
    stroke = COSMOS.cyan,
    fill = '#10182c',
    textColor = COSMOS.ink,
    size = 30,
    glow = 0,
    opacity = 1,
  } = {},
) {
  const r = rect(w, h, { fill, stroke, width: glow > 0 ? 3 : 1.8, radius: 10 }).at(cx, cy);
  if (glow > 0) r.glow(glow, stroke);
  return group(r, txt(String(val), cx, cy, size, textColor, 'mono')).opacity(opacity);
}
