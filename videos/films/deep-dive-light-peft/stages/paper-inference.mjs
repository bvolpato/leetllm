import { chapterFooter, chapterSubtitle, chapterText, focusScope } from '../defaults.mjs';
export function drawPaperInference(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      'Table 5 · fixed 52% foundation, different adapter count',
    );
    focusScope(ctx, api, 'lp-inference', () => {
      api.text(ctx, 'Inference speed', 1360, 307, 32, themeColors.green, 'center');
      if (beat) api.text(ctx, 'Load memory', 1670, 307, 32, themeColors.yellow, 'center');
      [
        [192, 1.2, 6.5],
        [96, 1.4, 6.5],
        [48, 1.6, 6.4],
      ].forEach(([n, speed, memory], i) => {
        const y = 385 + i * 180;
        chapterText(ctx, api, themeColors, n + ' modules', 210, y + 45, 31, themeColors.cyan);
        api.rect(ctx, 600, y - 20, 710, 70, themeColors.panel, themeColors.muted, 0);
        api.rect(ctx, 600, y - 20, 710 * 0.52, 70, themeColors.blue, undefined, 0);
        api.rect(ctx, 600, y + 70, (710 * n) / 192, 25, themeColors.purple, undefined, 0);
        chapterText(
          ctx,
          api,
          themeColors,
          speed.toFixed(1) + '×',
          1360,
          y + 45,
          36,
          themeColors.green,
          'center',
        );
        if (beat)
          api.text(ctx, memory.toFixed(1) + 'G', 1670, y + 45, 36, themeColors.yellow, 'center');
      });
    });
    focusScope(ctx, api, 'lp-inference-memory', () => {
      if (beat)
        chapterText(
          ctx,
          api,
          themeColors,
          'All 192 modules  ·  12.5G baseline → 6.5G with the smaller backbone',
          960,
          950,
          32,
          themeColors.yellow,
          'center',
        );
    });
    if (!beat)
      chapterFooter(
        ctx,
        api,
        themeColors,
        'OPT-6.7B · batch 96 · maximum length 100 · source-reported configuration',
      );
  }
}
export default {
  id: 'paper-inference',
  draw: drawPaperInference,
  cues: ['lp-inference-base', 'lp-inference-modules', 'lp-inference-memory'],
};
