import { arrow, circle, dot, line, place } from 'vizmatic/stage';
import { area, label } from '../kit-narrated.mjs';
import { ANGLES, START, TAU } from '../../films/contrastive-learning/fixtures.mjs';
import { comparisonRow, evaluate, vector } from '../../films/contrastive-learning/arithmetic.mjs';

export { ANGLES, START, TAU, comparisonRow, evaluate, vector };
export const COLOR = Object.freeze({
  anchor: 'cyan',
  positive: 'green',
  competitor: 'pink',
  unrelated: 'blue',
  focus: 'yellow',
  invalid: 'red',
});
export const NAMES = ['puppy runs', 'dog sleeps', 'sky is blue'];
export const COLORS = [COLOR.positive, COLOR.competitor, COLOR.unrelated];
export const STATE = Object.freeze({
  intro: { picture: 'the editor selects the running puppy' },
  'order-collision': { picture: 'the reversed sequences have the same static mean' },
  encode: { picture: 'a changed passage format requires fresh encodings and evaluation' },
  'pooling-tensor': {
    picture: 'masked means, normalized inputs, score matrix, analytic derivative',
  },
  scores: { angle: START, tau: TAU, allowed: [1, 1, 1] },
  objective: { angle: START, tau: TAU, allowed: [1, 1, 1] },
  'loss-numerics': { picture: 'swapped score row and stable centered logits' },
  'triplet-margin': { picture: 'the active triplet has loss 0.3' },
  'temperature-gradient': { picture: 'the correct row saturates at the lowest temperature' },
  geometry: { angle: 'steps().at(-1)', tau: TAU, allowed: [1, 1, 1] },
  'alignment-uniformity': { picture: 'four separated pairs, with each positive pair close' },
  'pair-supervision': { picture: 'an animal outside the dog subset and two supervision contracts' },
  'dropout-views': { picture: 'repeatable inference states and a meaning-changing deletion' },
  negatives: { picture: 'the sleeping dog is a hard negative and the sprinting hound is relevant' },
  'batch-identity': { picture: 'the gathered pool contains thirty off-diagonal scores' },
  'false-negatives': { scores: [0.8, 0.8, 0.1], tau: TAU, allowed: [1, 0, 1] },
  'multiple-positives': { picture: 'the new supplied probability row drives both aggregations' },
  'mining-loop': { picture: 'two labeled non-matches survive in supplied teacher-score order' },
  'teacher-margin': { picture: 'a target margin of 3.5 exceeds the cosine margin limit of 2' },
  architectures: { picture: 'independent stored vectors, joint processing, and late matching' },
  'maxsim-readout': {
    picture: 'row maxima sum while the raw payload and compression contract stay distinct',
  },
  'task-format': { picture: 'two instruction-and-text inputs with the full checkpoint contract' },
  'prefix-failure': {
    picture: 'all retained prefixes tie, with a separate zero-prefix rejection rule',
  },
  'nested-loss': {
    picture: 'three prefix losses, with omitted candidates outside full-width rescoring',
  },
  retrieval: {
    picture: 'stored vectors remain while the relevant candidate is outside the shortlist',
  },
  'shortlist-budget': { picture: 'query and reranking consume the sequential request budget' },
  'evaluation-scope': {
    picture: 'the original task distribution remains distinct from MMTEB scope',
  },
  'release-metrics': {
    picture: 'the first query retrieves both positives while the third still misses its evidence',
  },
  transfer: { angle: START, tau: TAU, targets: [0.5, 0.5, 0] },
  'fresh-embedding': {
    picture: 'the wheel guide mirror is masked and the short index falls below its recall floor',
  },
});

// Fixed archive vectors for the encoding and retrieval scenes.
export function dogComparison() {
  const [body, foot] = area.rows([8, 1], 'normal');
  const [left, right] = body.columns([1, 1], 'loose');
  const [plot, under] = left.rows([5, 1], 'normal');
  const origin = plot.point('center');
  const radius = plot.height * 0.34;
  const point = (a, r = radius) => [origin[0] + r * Math.cos(a), origin[1] - r * Math.sin(a)];
  const ring = circle(radius, { stroke: 'dim', width: 2 }).moveTo(origin);
  const axes = [
    line([origin[0] - radius, origin[1]], [origin[0] + radius, origin[1]], { stroke: 'grid' }),
    line([origin[0], origin[1] - radius], [origin[0], origin[1] + radius], { stroke: 'grid' }),
  ];
  const vectors = ANGLES.map((a, i) => arrow(origin, point(a), { stroke: COLORS[i], width: 4 }));
  const tips = ANGLES.map((a, i) => dot(9, COLORS[i]).moveTo(point(a)));
  const names = NAMES.map((name, i) => {
    const p = point(ANGLES[i]);
    const offset = i === 0 ? [130, 110] : i === 1 ? [0, -64] : [-80, -110];
    return label(name, { color: COLORS[i], size: 34 }).moveTo([p[0] + offset[0], p[1] + offset[1]]);
  });
  const anchor = arrow(origin, point(START), { stroke: COLOR.anchor, width: 7 });
  const anchorName = place(label('A dog is running', { color: COLOR.anchor }), under);
  return {
    left,
    right,
    foot,
    names,
    scores: evaluate().scores,
    plane: [ring, ...axes, ...vectors, ...tips, ...names, anchor, anchorName],
  };
}
