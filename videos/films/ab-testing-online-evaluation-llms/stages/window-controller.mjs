import { onlineCueProgress } from '../construction.mjs';
import { box, caption, text as constructionText } from '../defaults.mjs';
export function drawWindowController(ctx, scene, state, api) {
  const { C: themeColors } = api,
    B = state.beat ?? 0;
  const cueProgress = (suffix, beat, start = 0.1, end = 0.85) =>
      onlineCueProgress(state, `oa-${'window-controller'}-${suffix}`, beat, start, end),
    resultComplete = (suffix, beat) => cueProgress(suffix, beat) === 1;
  api.focus.target('oa-window-controller-mechanism', () => {
    const limits = [3000, 0.001, 0.08],
      values = [
        [3300, 3400, 2500],
        [0.002, 0.003, 0.0005],
        [0.09, 0.091, null],
      ],
      labels = ['Latency (ms)', 'Error rate', 'Cost ($)'],
      actions = ['W2: PAUSE', 'W2: ROLLBACK', 'W2: SPEND'];
    constructionText(ctx, api, 'Independent metric lanes', 200, 285, 33, themeColors.cyan);
    labels.forEach((v, i) => {
      const y = 380 + i * 175;
      constructionText(
        ctx,
        api,
        v,
        190,
        y,
        31,
        [themeColors.blue, themeColors.pink, themeColors.yellow][i],
      );
      constructionText(ctx, api, 'limit ' + limits[i], 190, y + 55, 26, themeColors.muted);
      for (let j = 0; j < 3; j++) {
        const reveal =
            j === 0
              ? resultComplete('first', 0)
              : j === 1
                ? resultComplete('lanes', 1)
                : i === 2
                  ? resultComplete('unavailable', 1)
                  : resultComplete('reset', 1),
          val = values[i][j],
          streak = j === 0 ? 1 : j === 1 ? 2 : 0;
        box(
          ctx,
          api,
          reveal
            ? val === null
              ? ['unavailable', 'streak 0', 'PAUSE']
              : [String(val), 'streak ' + streak]
            : ['window ' + (j + 1), 'pending'],
          560 + j * 370,
          y - 55,
          320,
          115,
          reveal
            ? val === null
              ? themeColors.yellow
              : streak === 2
                ? themeColors.pink
                : themeColors.cyan
            : themeColors.muted,
          val === null ? 26 : 29,
        );
      }
      if (resultComplete('lanes', 1))
        constructionText(
          ctx,
          api,
          actions[i],
          1740,
          y + 50,
          23,
          i === 2 ? themeColors.yellow : themeColors.pink,
          'center',
        );
    });
    caption(
      ctx,
      api,
      B === 2
        ? 'In-memory recommendations fire at the target streak; production needs durable delivery'
        : 'Equality resets a breach; unavailable required data pauses exposure and resets its lane',
    );
  });
}
export default {
  id: 'window-controller',
  draw: drawWindowController,
  cues: [
    'oa-window-controller-0',
    'oa-window-controller-strict',
    'oa-window-controller-first',
    'oa-window-controller-second',
    'oa-window-controller-1',
    'oa-window-controller-lanes',
    'oa-window-controller-reset',
    'oa-window-controller-unavailable',
    'oa-window-controller-2',
    'oa-window-controller-once',
  ],
};
