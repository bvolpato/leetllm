import { cueAmount } from '../construction.mjs';
import { conditionalDistribution } from '../model.mjs';
import { target, text } from '../defaults.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const x = 220,
    width = 1480;
  const options = conditionalDistribution('The cat');
  const children = conditionalDistribution('The cat sat');
  const colors = [C.blue, C.green, C.pink];
  const spokenShares = [
    cueAmount(state, 0, 'intro-distribution', 0.12, 0.39),
    cueAmount(state, 0, 'intro-slept', 0.55, 0.72),
    cueAmount(state, 0, 'intro-ate', 0.73, 0.94),
  ];
  const move = cueAmount(state, 2, 'intro-append', 0.04, 0.23);
  const next = move === 1 ? cueAmount(state, 2, 'intro-next', 0.32, 0.59) : 0;
  const product = cueAmount(state, 3, 'intro-path', 0.1, 0.51);
  const branch = width * options[0].probability;
  const stop = branch * children[0].probability;
  const satStart = x + branch / 2;
  const satEnd = x + 365;

  api.text(ctx, 'The', x, 351, 104, C.ink, 'left', 'serif');
  api.text(ctx, 'cat', x + 210, 351, 104, C.ink, 'left', 'serif');
  if (move === 0 || move === 1) {
    const caret = move === 0 ? x + 369 : satEnd + 158;
    api.line(ctx, caret, 265, caret, 355, C.cyan, 5);
  }
  text(ctx, api, 'P(next | The cat)', x + width, 454, 34, C.muted, 'right');
  target(ctx, api, 'intro-choices', () => {
    let left = x;
    for (const [i, { token, probability }] of options.entries()) {
      const w = width * probability,
        center = left + w / 2;
      api.rect(ctx, left, 556, w, 94, colors[i], undefined, 4);
      if (i > 0 || move === 1) api.text(ctx, token, center, 532, 54, colors[i], 'center', 'serif');
      const percent = Math.round(probability * 100) + '%';
      text(ctx, api, percent, center, 620, 45, C.bg, 'center');
      const underline = w * spokenShares[i];
      if (underline > 0) api.line(ctx, left, 665, left + underline, 665, colors[i], 5);
      left += w;
    }
  });
  target(ctx, api, 'intro-selected-token', () => {
    api.text(
      ctx,
      options[0].token,
      satStart + (satEnd + 73 - satStart) * move,
      532 + (351 - 532) * move,
      54 + 50 * move,
      move === 1 ? C.ink : C.blue,
      'center',
      'serif',
    );
  });

  if (next > 0 || ((state.beat ?? 0) >= 2 && move === 1)) {
    target(ctx, api, 'intro-children', () => {
      api.line(ctx, x, 671, x, 758, C.muted, 2);
      api.line(ctx, x + branch, 671, x + branch, 758, C.muted, 2);
      text(ctx, api, 'P(next | The cat sat)', x + 28, 731, 34, C.ink);
      api.rect(ctx, x, 762, branch, 64, C.panel, C.muted, 2);
      if (next > 0) {
        api.rect(ctx, x, 762, stop * next, 64, C.yellow);
        if (next === 1) {
          api.rect(ctx, x + stop, 762, branch - stop, 64, C.cyan);
          text(ctx, api, 'end', x + stop / 2 - 55, 807, 35, C.bg, 'center');
          text(
            ctx,
            api,
            children[0].probability.toFixed(2),
            x + stop / 2 + 48,
            807,
            35,
            C.bg,
            'center',
          );
          text(ctx, api, 'beside', x + (stop + branch) / 2, 807, 34, C.bg, 'center');
          text(
            ctx,
            api,
            children[1].probability.toFixed(2),
            x + (stop + branch) / 2,
            875,
            31,
            C.cyan,
            'center',
          );
        }
      }
    });
  }
  if ((state.beat ?? 0) >= 3)
    target(ctx, api, 'intro-joint', () => {
      api.line(ctx, x, 895, x + stop * product, 895, C.yellow, 5);
      if (product === 1) {
        api.line(ctx, x, 879, x, 895, C.yellow, 4);
        api.line(ctx, x + stop, 879, x + stop, 895, C.yellow, 4);
        const joint = options[0].probability * children[0].probability;
        text(
          ctx,
          api,
          '0.60 × 0.80 = ' + joint.toFixed(2) + ' of the original row',
          x,
          966,
          47,
          C.yellow,
        );
      }
    });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-distribution',
    'intro-slept',
    'intro-ate',
    'intro-append',
    'intro-next',
    'intro-path',
  ],
};
