import { spokenProgress } from '../construction.mjs';
import { equation, text } from '../defaults.mjs';

export function drawAlignmentMask(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.focus.target('alignment-example', () => {
    if (beat === 0) {
      const progress = spokenProgress(state, api, 'map-bird', 0, 0.39, 0.57);
      const xs = [790, 1380];
      ['Teacher', 'Student'].forEach((s, i) =>
        text(ctx, api, s, 150, 437 + i * 365, 45, i ? C.cyan : C.blue),
      );
      ['bird', 'dog'].forEach((word, i) => {
        const mass = [0.8, 0.2][i];
        const color = i ? C.muted : C.yellow;
        text(ctx, api, 'ID ' + i, xs[i], 302, 32, C.muted, 'center');
        text(ctx, api, word, xs[i], 425, 52, color, 'center');
        text(ctx, api, i === 0 ? 'dog' : 'bird', xs[i], 800, 52, i ? C.yellow : C.muted, 'center');
        const destination = xs[1 - i];
        const px = xs[i] + (destination - xs[i]) * progress;
        const py = 494 + 211 * progress + (i ? -1 : 1) * 68 * Math.sin(Math.PI * progress);
        api.rect(ctx, px - 87, py - 42, 174, 75, C.panel, undefined, 5);
        text(ctx, api, mass.toFixed(1), px, py + 15, 40, color, 'center');
      });
      text(
        ctx,
        api,
        progress === 1
          ? 'Student target in ID order     [0.2, 0.8]'
          : 'Same prefix     •     same words     •     different IDs',
        960,
        952,
        41,
        C.ink,
        'center',
      );
      return;
    }
    if (beat === 1) {
      const words = ['BOS', 'prompt', 'answer 1', 'answer 2', 'PAD'];
      const x = (i) => 290 + 333 * i;
      const shift = spokenProgress(state, api, 'shift-hard', 1, 0.17, 0.29);
      const soft = spokenProgress(state, api, 'response-mask', 1, 0.3, 0.44);
      const second = spokenProgress(state, api, 'second-answer', 1, 0.45, 0.55);
      text(ctx, api, 'Same input in both models', 145, 285, 38, C.ink);
      words.forEach((word, i) => {
        text(ctx, api, 'Slot ' + i, x(i), 365, 29, C.muted, 'center');
        api.rect(ctx, x(i) - 122, 408, 244, 86, C.panel, undefined, 3);
        text(ctx, api, word, x(i), 468, 36, C.ink, 'center');
      });
      [shift, second].forEach((visible, j) => {
        if (visible <= 0) return;
        const from = x(j + 1),
          to = x(j + 2);
        // The hard label is one input slot ahead of the logits that predict it.
        api.components.fade(visible, () => {
          api.arrow(ctx, from + 22, 603, to - 20, 510, C.yellow, 4);
          text(ctx, api, 'label ' + (j + 2), to - 65, 645, 29, C.yellow, 'center');
        });
        api.components.fade(j ? second : soft, () => {
          api.circle(ctx, from, 693, 10, C.blue);
          api.circle(ctx, from, 764, 10, C.cyan);
          text(ctx, api, 'KL at slot ' + (j + 1), from, 848, 32, C.cyan, 'center');
        });
      });
      text(ctx, api, 'Teacher', 148, 704, 31, C.blue);
      text(ctx, api, 'Student', 148, 774, 31, C.cyan);
      text(ctx, api, 'Response-only supervision', 960, 981, 31, C.muted, 'center');
      return;
    }
    const empty = beat === 3;
    const batches = [[0.2], [0.8, 0.8, 0.8]];
    const losses = batches.flat();
    text(
      ctx,
      api,
      empty ? 'New batch     •     every target masked' : 'Each valid token gets one vote',
      145,
      304,
      44,
    );
    losses.forEach((loss, i) => {
      const x = 325 + 410 * i;
      text(ctx, api, 'Batch ' + (i ? 'B' : 'A'), x, 430, 34, C.muted, 'center');
      api.rect(ctx, x - 130, 505, 260, 145, C.panel);
      text(
        ctx,
        api,
        empty ? 'masked' : loss.toFixed(1),
        x,
        602,
        48,
        empty ? C.muted : i ? C.cyan : C.blue,
        'center',
      );
    });
    if (empty) {
      text(
        ctx,
        api,
        '0 valid tokens     →     skip optimizer step',
        960,
        836,
        47,
        C.yellow,
        'center',
      );
    } else if (spokenProgress(state, api, 'token-mean', 2, 0.57, 0.74) === 1) {
      const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
      const decimal = (v) => v.toFixed(2).replace(/^0/, '');
      const means = batches.map(mean);
      text(ctx, api, 'Equal weight per token', 520, 766, 35, C.yellow, 'center');
      text(ctx, api, 'Equal weight per batch', 1390, 766, 35, C.muted, 'center');
      const weighted = batches.map((batch, i) => batch.length + '(' + decimal(means[i]) + ')');
      equation(
        ctx,
        api,
        '\\frac{' + weighted.join('+') + '}{' + losses.length + '}=' + decimal(mean(losses)),
        520,
        897,
        45,
        C.yellow,
        'center',
      );
      equation(
        ctx,
        api,
        '\\frac{' +
          means.map(decimal).join('+') +
          '}{' +
          batches.length +
          '}=' +
          decimal(mean(means)),
        1390,
        897,
        45,
        C.ink,
        'center',
      );
    }
  });
}
export default {
  id: 'alignment-mask',
  draw: drawAlignmentMask,
  cues: ['map-bird', 'shift-hard', 'response-mask', 'second-answer', 'token-mean'],
};
