import {
  drawChapterBar,
  drawChapterFooter,
  drawChapterRectangle,
  drawChapterText,
} from '../defaults.mjs';
export function drawHiddenOutput(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-hidden-output-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  api.focus.target('te-hidden-output-mechanism', () => {
    const total = currentBeat === 2 ? 1024 : 1186,
      reasoning = 1024,
      remaining = total - reasoning,
      x = 240,
      w = 1440;
    drawChapterText(ctx, api, 'Reported output total: ' + total, 960, 315, 37, themeColors.pink);
    drawChapterRectangle(ctx, api, x, 430, w, 115, themeColors.muted, 'transparent');
    api.components.fade(u, () => {
      drawChapterBar(ctx, api, x, 430, (w * reasoning) / total, 115, 1, themeColors.yellow);
      if (remaining)
        drawChapterBar(
          ctx,
          api,
          x + (w * reasoning) / total,
          430,
          (w * remaining) / total,
          115,
          1,
          themeColors.pink,
        );
    });
    drawChapterText(
      ctx,
      api,
      reasoning + ' reasoning inside output',
      760,
      625,
      34,
      themeColors.yellow,
    );
    if (currentBeat > 0 || done)
      drawChapterText(
        ctx,
        api,
        remaining ? remaining + ' other output' : 'No useful visible answer supplied',
        960,
        705,
        31,
        themeColors.pink,
      );
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'Do not add the nested detail again',
        960,
        865,
        37,
        themeColors.ink,
      );
      drawChapterFooter(
        ctx,
        api,
        'The non-reasoning remainder can include formatting; it is not a visible-word count.',
      );
    } else if (currentBeat === 1) {
      const duplicate = u > 0.45;
      drawChapterText(ctx, api, '1,186 × $15 / million', 500, 815, 32, themeColors.green);
      if (done) drawChapterText(ctx, api, '$0.01779', 500, 905, 43, themeColors.green);
      if (duplicate) {
        drawChapterText(
          ctx,
          api,
          'Incorrect: (1,186 + 1,024) × $15 / million',
          1390,
          815,
          27,
          themeColors.pink,
        );
        if (done)
          drawChapterText(ctx, api, '$0.03315 · DOUBLE COUNT', 1390, 905, 36, themeColors.pink);
      }
      drawChapterFooter(
        ctx,
        api,
        'The reasoning detail explains the total; it is not a second bucket.',
      );
    } else {
      drawChapterText(ctx, api, 'Input 1,800 · $0.00450', 510, 810, 32, themeColors.cyan);
      drawChapterText(ctx, api, 'Output 1,024 · $0.01536', 1400, 810, 32, themeColors.pink);
      if (done)
        drawChapterText(
          ctx,
          api,
          'Incomplete still costs $0.01986',
          960,
          925,
          42,
          themeColors.yellow,
        );
      drawChapterFooter(
        ctx,
        api,
        'The output cap includes reasoning, visible output and non-visible formatting.',
      );
    }
  });
}
export default {
  id: 'hidden-output',
  draw: drawHiddenOutput,
  cues: ['te-hidden-output-0', 'te-hidden-output-1', 'te-hidden-output-2'],
};
