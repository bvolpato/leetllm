import { words, rowClock } from '../row-workspace.mjs';

export function drawRequestLifetime(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const appended = clock.done('append-key');
  const n = appended ? 4 : 3;
  const query = n - 1,
    x = 300,
    stride = 268;
  api.focus.target('prompt-row', () => {
    api.text(ctx, 'Absolute position', x, 280, 34, C.muted);
    for (let i = 0; i < n; i++) {
      const pos = x + i * stride;
      api.text(ctx, i, pos + 107, 355, 37, C.muted, 'center');
      api.rect(ctx, pos, 394, 214, 122, C.panel, i === query ? C.yellow : C.blue, 9);
      api.text(
        ctx,
        [...words, 'new token'][i],
        pos + 107,
        472,
        39,
        i === query ? C.yellow : C.blue,
        'center',
      );
      api.line(ctx, pos + 107, 532, pos + 107, 584, C.blue, 3);
    }
    api.line(ctx, x + 107, 584, x + 107 + query * stride, 584, C.blue, 4);
    api.text(ctx, 'Query ' + query + ' reads keys 0 through ' + query, x, 690, 45, C.ink);
  });
  api.focus.target('request-output', () => {
    api.text(ctx, appended ? 'Decode' : 'Prompt', 300, 862, 36, C.muted);
    api.text(
      ctx,
      appended
        ? 'One new output vector'
        : clock.started('save-stat')
          ? 'Save the output and one log-sum-exp per row'
          : 'One output vector for test',
      560,
      862,
      43,
      C.cyan,
    );
  });
}

export default {
  id: 'request-lifetime',
  draw: drawRequestLifetime,
  cues: ['track-test', 'one-coordinate', 'save-stat', 'append-key', 'decode-row'],
};
