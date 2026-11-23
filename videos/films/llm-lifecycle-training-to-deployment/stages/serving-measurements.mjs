import { sceneCues } from '../picture.mjs';

export function drawServingMeasurements(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  api.focus.target('serving-measurements-mechanism', () => {
    if (state.beat < 2) {
      const times = [0, 200, 240, 300];
      const x = (ms) => 190 + ms * 5;
      const visible = cue.after('serving-measurements-b2')
        ? 4
        : cue.after('serving-measurements-b1')
          ? 2
          : 1;
      api.line(ctx, x(0), 552, x(300), 552, C.muted, 3);
      times.slice(0, visible).forEach((ms, i) => {
        const color = i === 0 ? C.blue : C.cyan;
        api.circle(ctx, x(ms), 552, 16, color);
        api.text(ctx, i ? 'Token ' + i : 'Request', x(ms), 477, 39, color, 'center');
        api.text(ctx, ms + ' ms', x(ms), 630, 38, C.ink, 'center');
        if (i > 0) {
          const start = x(times[i - 1]);
          api.line(ctx, start + 5, 732, x(ms) - 5, 732, C.yellow, 5);
          if (i === 1 || cue.after(i === 2 ? 'gap-forty' : 'gap-sixty')) {
            api.text(
              ctx,
              ms - times[i - 1] + ' ms',
              (start + x(ms)) / 2,
              813,
              40,
              C.yellow,
              'center',
            );
          }
        }
      });
      return;
    }
    const second = cue.started('serving-measurements-b3');
    api.text(ctx, '6 live tokens   ·   4 slots per block', 960, 318, 49, C.ink, 'center');
    for (let block = 0; block < (second ? 2 : 1); block++) {
      const left = 166 + 850 * block;
      api.text(ctx, 'Block ' + (block + 1), left, 465, 40, C.cyan);
      for (let j = 0; j < 4; j++) {
        const index = 4 * block + j;
        const slot = left + j * 171;
        api.rect(ctx, slot, 520, 153, 145, index < 6 ? C.blue : C.panel, C.muted, 3);
        api.text(
          ctx,
          index < 6 ? String(index + 1) : 'Free',
          slot + 76,
          610,
          39,
          index < 6 ? C.bg : C.muted,
          'center',
        );
      }
    }
    if (cue.after('serving-measurements-b3'))
      api.text(ctx, '8 slots allocated   ·   2 unused', 960, 835, 49, C.yellow, 'center');
  });
}
export default {
  id: 'serving-measurements',
  draw: drawServingMeasurements,
  cues: [
    'serving-measurements-b1',
    'serving-measurements-b2',
    'gap-forty',
    'gap-sixty',
    'serving-measurements-b3',
  ],
};
