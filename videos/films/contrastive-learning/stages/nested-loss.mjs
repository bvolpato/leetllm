import { formatValue, nestedLoss } from '../arithmetic.mjs';
import { drawNote, drawRectangle, drawText } from '../defaults.mjs';
export function drawNestedLoss(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-nested-loss-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('nested-loss-mechanism', () => {
    drawText(
      ctx,
      api,
      'One representation · selected nested prefix objectives',
      960,
      285,
      35,
      themeColors.blue,
    );
    if (currentBeat < 2) {
      const widths = [2, 4, 6],
        keys = ['two', 'four', 'six'];
      widths.forEach((w, i) => {
        const y = 410 + i * 150;
        drawText(ctx, api, 'd = ' + w, 330, y + 40, 31, themeColors.blue);
        for (let j = 0; j < 6; j++)
          drawRectangle(
            ctx,
            api,
            520 + j * 145,
            y,
            130,
            75,
            j < w ? themeColors.cyan : themeColors.panel,
          );
        if (currentBeat === 1 && resultComplete(keys[i]))
          drawText(
            ctx,
            api,
            'L = ' + formatValue(nestedLoss(w), 4),
            1570,
            y + 50,
            34,
            themeColors.green,
          );
      });
      if (currentBeat === 1 && resultComplete('mean'))
        drawText(
          ctx,
          api,
          'Mean objective = ' + formatValue(widths.reduce((s, w) => s + nestedLoss(w), 0) / 3, 4),
          960,
          945,
          38,
          themeColors.yellow,
        );
      drawNote(
        ctx,
        api,
        'Normalize each valid prefix independently · actual supplied-vector objective,no encoder trained',
      );
    } else {
      const short = 10e6 * 64 * 4,
        full = 10e6 * 768 * 4;
      drawText(ctx, api, '10M vectors · float32 · decimal GB', 960, 385, 34, themeColors.yellow);
      drawRectangle(ctx, api, 260, 500, 1400, 75, themeColors.panel);
      if (resultComplete('bytes')) {
        drawRectangle(ctx, api, 260, 500, (1400 * short) / full, 75, themeColors.cyan);
        drawText(ctx, api, '64d: 2.56 GB', 960, 685, 39, themeColors.cyan);
        drawText(ctx, api, '768d: 30.72 GB', 960, 820, 39, themeColors.blue);
      }
      if (resultComplete('missing'))
        drawText(
          ctx,
          api,
          'An omitted passage is outside every later rescore',
          960,
          945,
          32,
          themeColors.pink,
        );
      drawNote(ctx, api, 'IDs, graphs, metadata and retained full-width vectors add storage');
    }
  });
}
export default {
  id: 'nested-loss',
  draw: drawNestedLoss,
  cues: [
    'cl-nested-loss-slice',
    'cl-nested-loss-loss',
    'cl-nested-loss-two',
    'cl-nested-loss-four',
    'cl-nested-loss-six',
    'cl-nested-loss-mean',
    'cl-nested-loss-bytes',
    'cl-nested-loss-missing',
  ],
};
