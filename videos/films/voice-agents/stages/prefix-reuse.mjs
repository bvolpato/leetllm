import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawFooter, drawLine, drawText } from '../defaults.mjs';
export function drawPrefixReuse(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-prefix-reuse-${i}-${j}`;
    if (state.cues && !Object.hasOwn(state.cues, key))
      throw Error('Unknown voice narration cue: ' + key);
    return state.cues?.[key];
  };
  const cueVisible = (i, j) => {
    const c = cue(i, j);
    return c ? c.phase !== 'before' : currentBeat > i || (currentBeat === i && beatProgress > 0.02);
  };
  const cueComplete = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after' || c.progress >= 1
      : currentBeat > i || (currentBeat === i && beatProgress > 0.98);
  };
  const withStageFocus = (name, paint) => api.focus.target(`va-prefix-reuse-${name}`, paint);
  {
    const x = 150,
      stable = 930;
    withStageFocus('request', () => {
      drawText(ctx, api, 'Request A', 150, 300, 30, themeColors.blue);
      drawBox(ctx, api, x, 350, stable, 95, themeColors.cyan);
      drawText(ctx, api, 'stable policy + tools + examples', x + 25, 410, 31, themeColors.cyan);
      drawBox(ctx, api, x + stable + 10, 350, 610, 95, themeColors.yellow);
      drawText(ctx, api, 'history + dynamic A', x + stable + 35, 410, 30, themeColors.yellow);
      drawText(ctx, api, 'Request B', 150, 570, 30, themeColors.blue);
      drawBox(ctx, api, x, 620, stable, 95, themeColors.cyan);
      drawText(ctx, api, 'same stable content', x + 25, 680, 31, themeColors.cyan);
      drawBox(ctx, api, x + stable + 10, 620, 610, 95, themeColors.yellow);
      drawText(ctx, api, 'history + dynamic B', x + stable + 35, 680, 30, themeColors.yellow);
    });
    withStageFocus('endpoint', () => {
      if (cueVisible(1, 0)) drawText(ctx, api, 'Stored endpoints', 150, 850, 29, themeColors.muted);
      if (cueVisible(1, 1)) {
        drawLine(ctx, api, 1710, 330, 1710, 465, themeColors.pink, 5);
        drawText(ctx, api, 'implicit full endpoint A', 1710, 510, 27, themeColors.pink, 'right');
      }
      if (cueComplete(1, 2))
        drawText(ctx, api, 'B misses longer A entry', 1710, 775, 30, themeColors.pink, 'right');
      if (cueVisible(1, 3)) {
        drawLine(ctx, api, x + stable, 330, x + stable, 735, themeColors.green, 6);
        drawText(
          ctx,
          api,
          cueComplete(1, 3)
            ? 'eligible stable endpoint → reuse'
            : 'create endpoint at stable boundary',
          x + stable,
          850,
          30,
          themeColors.green,
          'center',
        );
      }
    });
    drawFooter(
      ctx,
      api,
      'Inspected Responses / GPT-5.6+ example · verify route, minimum and reported usage.',
    );
  }
}
export default {
  id: 'prefix-reuse',
  draw: drawPrefixReuse,
  cues: [
    'va-prefix-reuse-0-0',
    'va-prefix-reuse-0-1',
    'va-prefix-reuse-0-2',
    'va-prefix-reuse-0-3',
    'va-prefix-reuse-1-0',
    'va-prefix-reuse-1-1',
    'va-prefix-reuse-1-2',
    'va-prefix-reuse-1-3',
    'va-prefix-reuse-2-0',
    'va-prefix-reuse-2-1',
    'va-prefix-reuse-2-2',
  ],
};
