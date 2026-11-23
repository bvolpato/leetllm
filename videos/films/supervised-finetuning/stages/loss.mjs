import { motion, spoken } from '../construction.mjs';
import { REPLY_PROBS, TOKENS } from '../fixtures.mjs';
import { lossTrace } from '../model.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  const v = lossTrace(state.beat, state.beatP, state.cues);
  const logs = motion(state, 'loss-terms', 0, 0.65, 0.9);
  api.focus.target('loss-terms', () => {
    const x = (i) => 565 + i * 500;
    text(ctx, api, 'Target', 140, 341, 31, C.muted);
    text(ctx, api, 'Probability', 140, 457, 31, C.muted);
    text(ctx, api, '−ln(p)', 140, 621, 36, C.muted);
    REPLY_PROBS.forEach((p, i) => {
      const off = v.removed && i === 2;
      upgradeBox(ctx, api, TOKENS[5 + i], x(i) - 164, 276, 328, 91, C.blue, 42);
      text(ctx, api, p.toFixed(1), x(i), 457, 44, C.blue, 'center');
      if (logs > i / 3) {
        api.rect(
          ctx,
          x(i) - 154,
          650 - 210 * v.losses[i],
          308,
          210 * v.losses[i],
          off ? C.muted : C.green,
        );
        text(ctx, api, v.losses[i].toFixed(3), x(i), 516, 36, off ? C.muted : C.green, 'center');
      }
      if (off) text(ctx, api, 'label  −100', x(i), 714, 33, C.pink, 'center');
    });
  });
  api.focus.target('loss-total', () => {
    const summed = spoken(state, 'loss-sum', 1, 0.4);
    const meanVisible = v.removed
      ? spoken(state, 'loss-two', 3, 0.52)
      : spoken(state, 'loss-mean', 1, 0.85);
    const line = summed
      ? 'Sum ≈ ' + v.sum.toFixed(3) + '       Scored targets  ' + v.count
      : 'One loss per scored token';
    text(ctx, api, line, 960, 811, 41, C.ink, 'center');
    if (meanVisible)
      text(
        ctx,
        api,
        'Mean loss ≈ ' + v.mean.toFixed(3) + ' nats per target',
        960,
        911,
        50,
        C.green,
        'center',
      );
    if (state.beat === 2)
      text(
        ctx,
        api,
        'If END is ignored, what leaves the sum and the divisor?',
        960,
        1000,
        32,
        C.yellow,
        'center',
      );
  });
}

export default {
  id: 'loss',
  draw: draw,
  cues: ['loss-terms', 'loss-sum', 'loss-mean', 'loss-what-if', 'loss-remove', 'loss-two'],
};
