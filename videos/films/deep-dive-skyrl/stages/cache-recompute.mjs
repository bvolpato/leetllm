import { tokens } from '../fixtures.mjs';
import { phraseEnded, phraseProgress } from '../construction.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterEquation,
  drawSkyChapterArrow,
  drawSkyChapterRow,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawCacheRecompute(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat;
  const done = (cue, beat, at) => phraseEnded(state, api, cue, beat, at);
  api.focus.target('sky-cache-recompute-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Five retained positions  /  update from v11 to v19'
        : 'Two requests with the same prefix',
    );
    const replay = phraseProgress(state, api, 'sky-kv-clear', 0, 0.45, 0.7),
      work = Math.min(10, Math.floor(replay * 10)),
      oldVisible = (i) => replay === 0 || (work < 5 && i >= work),
      newVisible = (i) => work >= 5 && i < work - 5;
    if (!currentBeat) {
      drawSkyChapterText(ctx, api, 'retained IDs', 140, 415, 29, themeColors.blue);
      drawSkyChapterRow(ctx, api, tokens, 365, {
        color: themeColors.blue,
      });
      drawSkyChapterText(ctx, api, 'historical scores', 140, 555, 27, themeColors.cyan);
      drawSkyChapterRow(ctx, api, [-0.2, -0.4, 'context', -0.6, -0.8], 500, {
        color: themeColors.cyan,
        size: 29,
      });
      drawSkyChapterText(ctx, api, 'KV cells', 140, 725, 31, themeColors.pink);
      drawSkyChapterRow(
        ctx,
        api,
        tokens.map((_, i) => (newVisible(i) ? 'KV19' : oldVisible(i) ? 'KV11' : 'empty')),
        665,
        {
          colors: tokens.map((_, i) =>
            newVisible(i)
              ? themeColors.green
              : oldVisible(i)
                ? themeColors.pink
                : themeColors.muted,
          ),
          size: 30,
        },
      );
      drawSkyChapterText(
        ctx,
        api,
        'Emitted action tokens: 4 · never resampled',
        960,
        925,
        36,
        done('sky-no-resample', 0, 0.86) ? themeColors.green : themeColors.yellow,
        'center',
      );
      drawSkyChapterText(
        ctx,
        api,
        work > 5
          ? 'recomputed prefix ' + (work - 5) + '/5'
          : replay
            ? 'old KV removed ' + work + '/5'
            : 'old cached activations retained',
        960,
        840,
        30,
        themeColors.cyan,
        'center',
      );
    } else {
      const salted = done('sky-cache-salt', 1, 0.4);
      for (const [i, version] of [11, 19].entries()) {
        const x = 205 + i * 810;
        const color = i ? themeColors.cyan : themeColors.blue;
        drawSkyChapterBox(
          ctx,
          api,
          'Same prefix  /  request v' + version,
          x,
          375,
          680,
          90,
          color,
          35,
        );
        drawSkyChapterArrow(ctx, api, x + 340, 482, x + 340, 568, color);
        drawSkyChapterBox(
          ctx,
          api,
          salted ? 'Cache salt  /  v' + version : 'Cache salt  /  ?',
          x,
          590,
          680,
          92,
          color,
          36,
        );
      }
      drawSkyChapterText(
        ctx,
        api,
        'Action sampled earlier',
        960,
        780,
        36,
        themeColors.ink,
        'center',
      );
      drawSkyChapterText(ctx, api, 'Recorded p = 0.10', 565, 867, 37, themeColors.blue, 'center');
      drawSkyChapterText(ctx, api, 'Current p = 0.30', 1375, 867, 37, themeColors.cyan, 'center');
      if (done('sky-ratio-three', 2, 0.55))
        drawSkyChapterEquation(
          ctx,
          api,
          String.raw`\rho=\frac{0.30}{0.10}=3`,
          960,
          996,
          46,
          themeColors.green,
        );
      else
        drawSkyChapterText(
          ctx,
          api,
          'Which probability belongs in the denominator?',
          960,
          982,
          39,
          themeColors.ink,
          'center',
        );
    }
  });
}
export default {
  id: 'cache-recompute',
  draw: drawCacheRecompute,
  cues: [
    'sky-cache-recompute-b0',
    'sky-kv-clear',
    'sky-no-resample',
    'sky-cache-salt',
    'sky-ratio-three',
  ],
};
