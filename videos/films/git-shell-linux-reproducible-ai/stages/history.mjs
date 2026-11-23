import { score } from '../arithmetic.mjs';
import { commitFixtures, wrongRow } from '../fixtures.mjs';
import { historyFrame } from '../model.mjs';
import { mark, panel, terminal, text } from '../defaults.mjs';
export function drawHistory(ctx, scene, state, api) {
  const modelState = historyFrame(state),
    x = (i) => 270 + i * 197;
  mark(api, 'history-interval', () => {
    api.line(ctx, x(modelState.low), 420, x(modelState.high), 420, api.C.yellow, 11);
    api.line(ctx, x(modelState.low), 400, x(modelState.low), 440, api.C.yellow, 5);
    api.line(ctx, x(modelState.high), 400, x(modelState.high), 440, api.C.yellow, 5);
    for (let i = 0; i < 8; i++) {
      const tested = modelState.trace.checks.findIndex((c) => c.mid === i),
        p = modelState.progress[tested],
        known = i === 0 || i === 7 || (tested >= 0 && p > 0),
        good = score(commitFixtures[i]).passes,
        color = known ? (good ? api.C.green : api.C.pink) : api.C.muted;
      panel(ctx, api, x(i) - 62, 480, 124, 86, color);
      text(ctx, api, 'c' + i, x(i), 538, 36, color, 'center');
      if (known) text(ctx, api, good ? '2/3' : '2/4', x(i), 620, 30, color, 'center');
    }
  });
  mark(api, 'history-receipt', () => {
    const done = modelState.trace.checks.filter((c, i) => modelState.progress[i] > 0).at(-1);
    if (modelState.complete)
      terminal(
        ctx,
        api,
        'First bad snapshot: c5 · actual change',
        ['+ ' + JSON.stringify(wrongRow), '$ git bisect reset'],
        150,
        720,
        1620,
        200,
        {
          color: api.C.pink,
          size: 26,
        },
      );
    else
      terminal(
        ctx,
        api,
        'Same command at each candidate',
        [
          '$ ./repro.sh',
          done
            ? `c${done.mid}: ${done.result.correct}/${done.result.total} · exit ${done.good ? 0 : 1}`
            : 'known good c0 · known bad c7',
        ],
        350,
        720,
        1220,
        200,
        {
          size: 36,
        },
      );
  });
}
export default {
  id: 'history',
  draw: drawHistory,
  cues: ['bisect-three', 'bisect-five', 'bisect-four', 'first-bad'],
};
