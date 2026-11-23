import { lossStep } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';

export function drawLoss(ctx, scene, state, api) {
  const { C } = api;
  const step = spoken(state, 'step-logits', 1);
  const m = lossStep(step);
  const counted = Math.ceil(4 * spoken(state, 'exp-sum', 0));
  const showShares = ended(state, 'exp-sum', 0);
  const showLoss = ended(state, 'score-target', 0);
  const total = m.weights.slice(0, counted).reduce((a, b) => a + b, 0);
  api.text(ctx, 'One prediction at the comma', 155, 284, 39, C.ink);
  api.text(ctx, 'Candidate', 145, 405, 29, C.muted);
  api.text(ctx, 'Score z', 145, 490, 29, C.muted);
  api.text(ctx, 'Weight exp(z)', 145, 574, 29, C.muted);
  m.outputPieces.forEach((piece, i) => {
    const x = 550 + 340 * i,
      c = i === m.targetIndex ? C.yellow : C.blue;
    api.text(ctx, piece === '↵' ? '↵  line break' : piece, x, 407, 43, c, 'center');
    api.focus.target('scores', () =>
      api.text(ctx, m.logits[i].toFixed(step > 0 ? 2 : 0), x, 496, 44, c, 'center'),
    );
    api.focus.target('weights', () =>
      api.text(ctx, i < counted ? m.weights[i].toFixed(3) : '·', x, 578, 37, c, 'center'),
    );
  });
  api.focus.target('weights', () => {
    api.text(ctx, 'Sum of weights   ' + total.toFixed(3), 960, 670, 37, C.ink, 'center');
  });
  api.focus.target('share', () => {
    if (!showShares) return;
    let left = 180;
    const w = 1560;
    m.probabilities.forEach((p, i) => {
      const c = i === m.targetIndex ? C.yellow : [C.blue, C.yellow, C.cyan, C.muted][i];
      api.rect(ctx, left, 728, w * p - 2, 86, c, undefined, 0);
      if (i === m.targetIndex && ended(state, 'target-share', 0))
        api.text(
          ctx,
          '↵   ' + (100 * p).toFixed(1) + '%',
          left + (w * p) / 2,
          786,
          39,
          C.bg,
          'center',
        );
      left += w * p;
    });
  });
  api.focus.target('penalty', () => {
    api.text(
      ctx,
      showLoss
        ? '−ln(' + m.probabilities[m.targetIndex].toFixed(3) + ') ≈ ' + m.loss.toFixed(3) + ' nats'
        : 'How much probability went to the line break?',
      960,
      922,
      50,
      C.yellow,
      'center',
    );
  });
  api.text(
    ctx,
    state.beat === 0
      ? 'Batch loss averages one such penalty per scored position.'
      : 'One free-logit step   ·   learning rate 0.5   ·   the CPU lab updates network weights with AdamW',
    960,
    1014,
    30,
    C.muted,
    'center',
  );
}
export default {
  id: 'loss',
  draw: drawLoss,
  cues: ['exp-sum', 'target-share', 'score-target', 'step-logits'],
};
