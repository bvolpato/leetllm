import { stableDistribution } from '../arithmetic.mjs';
import { cueAmount, equation, rectangle, text } from '../defaults.mjs';
export function drawStableSoftmax(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-stable-softmax-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-stable-softmax-mechanism', () => {
    if (currentBeat === 0) {
      const original = [10, 12, 10],
        a = cueAmount(ctx, api, 'lr-shift-largest'),
        z = original.map((x) => x - 12 * a),
        s = stableDistribution(original);
      text(ctx, api, 'Supplied row: [10, 12, 10]', 960, 285, 36, themeColors.muted);
      z.forEach((v, i) => {
        const x = 410 + i * 550;
        text(ctx, api, 'class ' + i, x, 390, 31, themeColors.muted);
        text(ctx, api, v.toFixed(2), x, 505, 48, themeColors.yellow);
        if (resultComplete('lr-shift-largest'))
          text(ctx, api, 'exp = ' + s.exponentials[i].toFixed(4), x, 640, 36, themeColors.cyan);
        if (resultComplete('lr-exp-normalizer'))
          text(ctx, api, 'p = ' + s.probabilities[i].toFixed(4), x, 810, 37, themeColors.green);
      });
      if (resultComplete('lr-exp-normalizer'))
        equation(
          ctx,
          api,
          '\\sum_j e^{z_j-\\max z}=' + s.normalizer.toFixed(4),
          960,
          980,
          46,
          themeColors.yellow,
        );
      else
        text(
          ctx,
          api,
          'Subtract the maximum before evaluating actual exponentials',
          960,
          980,
          32,
          themeColors.muted,
        );
    } else if (currentBeat === 1) {
      const z = [1000, 0, -1000],
        s = stableDistribution(z),
        amount = op;
      z.forEach((v, i) => {
        const x = 390 + i * 570;
        text(
          ctx,
          api,
          'class ' + i + (i === 2 ? ' · TARGET' : ''),
          x,
          370,
          33,
          i === 2 ? themeColors.pink : themeColors.muted,
        );
        text(ctx, api, 'z = ' + v, x, 485, 43, themeColors.yellow);
        text(ctx, api, 'shifted ' + s.shifted[i], x, 620, 36, themeColors.cyan);
        rectangle(ctx, api, x - 120, 730, 240, 85, themeColors.panel, themeColors.muted);
        if (amount > (i + 1) / 4)
          text(ctx, api, 'exp = ' + s.exponentials[i], x, 785, 33, themeColors.cyan);
      });
      if (resultComplete('lr-extreme-class-loss'))
        equation(ctx, api, 'L=\\log(1+0+0)-(-2000)=2000', 960, 985, 46, themeColors.pink);
      else
        text(
          ctx,
          api,
          'The target probability can underflow while its logit-space loss stays finite',
          960,
          985,
          30,
          themeColors.muted,
        );
    } else {
      text(ctx, api, 'Same extreme wrong target', 960, 285, 36, themeColors.muted);
      rectangle(ctx, api, 340, 430, 1100, 85, themeColors.pink);
      text(ctx, api, 'Logit-space loss: 2000 nats', 960, 395, 37, themeColors.pink);
      if (cueAmount(ctx, api, 'lr-clipped-class-loss') > 0) {
        rectangle(ctx, api, 340, 690, 1100 * (-Math.log(1e-15) / 2000), 85, themeColors.yellow);
        text(
          ctx,
          api,
          'Clipped penalty: ' + (-Math.log(1e-15)).toFixed(2) + ' nats',
          960,
          855,
          38,
          themeColors.yellow,
        );
      }
      text(
        ctx,
        api,
        'Common scale: bar width represents negative log probability',
        960,
        980,
        30,
        themeColors.muted,
      );
    }
  });
}
export default {
  id: 'stable-softmax',
  draw: drawStableSoftmax,
  cues: [
    'lr-stable-softmax-step-0',
    'lr-shift-largest',
    'lr-exp-normalizer',
    'lr-stable-softmax-step-1',
    'lr-extreme-class-loss',
    'lr-stable-softmax-step-2',
    'lr-clipped-class-loss',
  ],
};
