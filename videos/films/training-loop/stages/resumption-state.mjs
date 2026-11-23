import { loopMomentum } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';
import { finished } from '../scene-clock.mjs';

export function drawResumptionState(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    api.focus.target('resume-state', () => {
      const entries =
        state.beat === 0
          ? [
              ['Model state', 'Named parameters', 'Persistent buffers'],
              [
                'Rebuild the router',
                'Architecture and feature order',
                'Label for each output column',
              ],
            ]
          : [
              [
                'Continue the update',
                'Optimizer, scheduler and scaler',
                'Pending gradients or window replay',
              ],
              [
                'Continue the data stream',
                'Current RNG states and sampler position',
                'Global step and split identity',
              ],
            ];
      for (const [i, [title, a, b]] of entries.entries()) {
        const x = 185 + i * 850;
        api.line(ctx, x, 392, x + 675, 392, i ? C.yellow : C.blue, 4);
        text(ctx, api, title, x, 355, 46, i ? C.yellow : C.blue);
        text(ctx, api, a, x, 550, 35, C.ink);
        text(ctx, api, b, x, 685, 35, C.ink);
      }
      text(
        ctx,
        api,
        state.beat === 0
          ? 'The model state dictionary is one part of the checkpoint.'
          : 'A seed restarts a sequence. Save the current position to resume it.',
        960,
        919,
        37,
        C.muted,
        'center',
      );
    });
    return;
  }
  if (state.beat < 4) {
    const previous = 0.9,
      gradient = -1,
      coefficient = 0.9,
      rate = 0.1;
    const small = finished(state, 'resume-small', 3, 0.56);
    const large = finished(state, 'resume-large', 3, 0.95);
    api.focus.target('resume-fork', () => {
      text(
        ctx,
        api,
        'Same starting weight  0.90     ·     next gradient  −1     ·     learning rate  0.1',
        960,
        270,
        38,
        C.ink,
        'center',
      );
      const x = (weight) => 530 + (weight - previous) * 10300;
      for (const [i, oldBuffer] of [1, 0].entries()) {
        const r = loopMomentum(oldBuffer, gradient, coefficient, rate, previous);
        const shown = i ? large : small;
        const y = 525 + i * 230,
          col = i ? C.pink : C.cyan;
        text(ctx, api, i ? 'Fresh optimizer' : 'Restored optimizer', 135, y + 10, 36, col);
        text(
          ctx,
          api,
          'Momentum   0.9 × ' +
            oldBuffer +
            ' − 1' +
            (shown ? ' = ' + Number(r.buffer.toFixed(1)) : ''),
          530,
          y - 68,
          35,
          C.ink,
        );
        api.line(ctx, x(0.9), y, x(1), y, C.muted, 3);
        for (const v of [0.9, 0.95, 1]) {
          api.line(ctx, x(v), y + 6, x(v), y + 23, C.muted, 2);
          text(ctx, api, v.toFixed(2), x(v), y + 58, 29, C.muted, 'center');
        }
        if (shown) api.line(ctx, x(previous), y, x(r.weight), y, col, 10);
        api.circle(ctx, x(shown ? r.weight : previous), y, 12, col);
        if (shown) text(ctx, api, r.weight.toFixed(2), x(r.weight), y - 25, 34, col, 'center');
      }
      text(
        ctx,
        api,
        state.beat === 2
          ? 'Which copy takes the larger step?'
          : 'Next weight = 0.90 − 0.1 × new momentum',
        960,
        989,
        40,
        C.ink,
        'center',
      );
    });
    return;
  }
  api.focus.target('resume-checks', () => {
    const same = finished(state, 'resume-logits', 4, 0.3);
    const retained = finished(state, 'resume-ref', 4, 0.55);
    const missing = finished(state, 'resume-other', 4, 0.68);
    text(ctx, api, 'Ticket router   ·   checkpoint after 80 SGD updates', 170, 280, 42, C.ink);
    text(ctx, api, 'Compare with uninterrupted training', 170, 395, 34, C.muted);
    text(ctx, api, 'Weights + optimizer', 1045, 470, 39, C.cyan, 'center');
    text(ctx, api, 'Weights only', 1510, 470, 39, C.pink, 'center');
    for (const [i, name] of [
      'Scores immediately after reload',
      'Weights after the same next batch',
    ].entries()) {
      const y = 615 + i * 175;
      api.line(ctx, 170, y - 86, 1750, y - 86, C.muted, 2);
      text(ctx, api, name, 170, y, 36, C.ink);
      text(ctx, api, (i ? retained : same) ? 'Match' : '?', 1045, y, 44, C.cyan, 'center');
      text(
        ctx,
        api,
        i ? (missing ? 'Differ' : '?') : same ? 'Match' : '?',
        1510,
        y,
        44,
        C.pink,
        'center',
      );
    }
    text(ctx, api, 'This replay uses one fixed batch.', 960, 982, 36, C.muted, 'center');
  });
}
export default {
  id: 'resumption-state',
  draw: drawResumptionState,
  cues: [
    'resume-model',
    'resume-window',
    'resume-fork',
    'resume-small',
    'resume-large',
    'resume-logits',
    'resume-ref',
    'resume-other',
  ],
};
