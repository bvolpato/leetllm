import { lossTerms } from '../arithmetic.mjs';
import { cueProgress, done } from '../construction.mjs';
import { instructionF as focus, instructionT as text } from '../defaults.mjs';

const names = ['<U>', 'question', '<A>', 'Open', 'ticket', 'end'];
const cues = ['loss-open', 'loss-ticket', 'loss-end'];

export function drawLossConstruction(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const loss = lossTerms();
  if (beat === 1) {
    for (const [i, probability] of loss.probabilities.entries()) {
      const x = 210 + i * 560;
      const p = cueProgress(state, cues[i], 1);
      focus(ctx, api, cues[i], () => {
        text(ctx, api, 'Position ' + (i + 2), x, 295, 32, C.muted);
        text(ctx, api, names[i + 2] + ' → ' + names[i + 3], x, 402, 50);
        text(ctx, api, p > 0 ? 'p(target) = ' + probability : 'p(target) = ?', x, 518, 36, C.cyan);
        if (p > 0) api.rect(ctx, x, 591, 330 * loss.terms[i] * p, 44, C.yellow, undefined, 3);
        if (p === 1) text(ctx, api, '−ln(p) = ' + loss.terms[i].toFixed(3), x, 712, 34, C.yellow);
      });
    }
    focus(ctx, api, 'loss-total', () => {
      const summed = done(state, 'im-loss-sum', 1);
      const mean = done(state, 'im-loss-mean', 1);
      text(ctx, api, summed ? 'Sum   ' + loss.sum.toFixed(6) + ' nats' : 'Sum   ?', 210, 882, 43);
      text(
        ctx,
        api,
        mean
          ? '÷ ' + loss.count + '   =   ' + loss.mean.toFixed(6) + ' nats per target'
          : '÷ 3 scored targets',
        833,
        882,
        43,
        C.green,
      );
    });
    return;
  }
  const center = (i) => 375 + i * 257;
  focus(ctx, api, 'loss-row', () => {
    for (const [i, word] of names.entries()) {
      text(ctx, api, i, center(i), 350, 32, C.muted, 'center');
      text(ctx, api, word, center(i), 450, 47, C.ink, 'center');
      if (beat === 0) {
        text(
          ctx,
          api,
          i < 3 ? '−100' : word,
          center(i),
          720,
          44,
          i < 3 ? C.muted : C.green,
          'center',
        );
        if (i >= 3 && done(state, 'loss-direct', 0))
          api.arrow(ctx, center(i - 1), 488, center(i), 648, C.yellow, 4);
      } else if (done(state, 'im-loss-backward', 2)) {
        const active = i >= 2 && i <= 4;
        text(
          ctx,
          api,
          active ? 'nonzero' : 'zero',
          center(i),
          721,
          40,
          active ? C.green : C.muted,
          'center',
        );
      }
    }
    text(ctx, api, 'Input', 110, 450, 35, C.muted);
    text(ctx, api, beat === 0 ? 'Label' : 'Gradient', 110, 720, 35, C.muted);
    text(
      ctx,
      api,
      beat === 0
        ? 'Each scored logit points to the next label.'
        : 'Direct loss gradients on these supplied logits',
      960,
      909,
      43,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'loss-construction',
  draw: drawLossConstruction,
  cues: ['loss-direct', ...cues, 'im-loss-sum', 'im-loss-mean', 'im-loss-backward'],
};
