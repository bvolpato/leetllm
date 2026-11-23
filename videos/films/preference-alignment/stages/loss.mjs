import { comparisonLoss, lossPresentation } from '../construction.mjs';
import { EXAMPLE } from '../fixtures.mjs';

export function drawLoss(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const worked = beat < 1 ? 0 : beat > 1 ? 1 : api.phase(state.beatP ?? 0, 0.05, 0.93);
  const applied = state.cues ? focus.progress('loss-b2-1', worked) : worked;
  const confident = focus.progress('loss-already-confident', 0);
  let { probability: p } = lossPresentation(beat, applied, confident);
  if (state.cues && beat === 2) {
    const workedProbability = comparisonLoss(1).probability;
    const miss = focus.progress('loss-wrong-order', 0);
    const mistakenProbability = workedProbability + (0.08 - workedProbability) * miss;
    p = mistakenProbability + (0.95 - mistakenProbability) * confident;
  }
  const loss = -Math.log(p);
  const even = p.toFixed(2) === '0.50';
  const ordering = even
    ? p === 0.5
      ? 'at even odds'
      : 'near even odds'
    : p < 0.5
      ? 'chosen below even odds'
      : 'chosen above even odds';
  const logit = Number(Math.log(p / (1 - p)).toFixed(2)).toFixed(2);
  api.text(ctx, 'Recorded vote   A over B', 135, 280, 48, C.ink);
  focus.target('pair-probability', () => {
    api.text(ctx, 'Predicted winner of the comparison', 145, 400, 35, C.ink);
    api.teaching.bars({
      x: 150,
      y: 470,
      width: 780,
      height: 300,
      max: 1,
      values: [p, 1 - p],
      labels: ['A  ·  station', 'B  ·  entrance'],
      colors: [C.blue, C.muted],
      progress: 1,
      showValues: true,
      format: (v) => (100 * v).toFixed(1) + '%',
      fontSize: 32,
    });
  });
  focus.target('pair-loss', () => {
    api.text(ctx, 'Score the vote for A', 1040, 400, 37, C.blue);
    api.math(ctx, String.raw`L=-\ln P(A\succ B)`, 1370, 545, 57, C.ink, 'center');
    api.text(ctx, 'Loss   ' + loss.toFixed(3), 1040, 660, 74, C.yellow);
    api.text(ctx, 'Loss at even odds   ' + Math.log(2).toFixed(3), 1040, 742, 31, C.muted);
    if (beat === 2) {
      const pull = EXAMPLE.beta * (1 - p);
      api.text(ctx, 'Margin gradient   −' + pull.toFixed(3), 1040, 828, 35, C.blue);
    }
  });
  focus.target('loss-order', () =>
    api.text(ctx, 'Scaled margin βm = ' + logit + ' · ' + ordering, 135, 967, 34, C.ink),
  );
}

export default {
  id: 'loss',
  draw: drawLoss,
  cues: ['loss-b1-1', 'loss-b2-1', 'loss-wrong-order', 'loss-b3-1', 'loss-already-confident'],
};
