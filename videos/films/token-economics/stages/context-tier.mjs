import { contextTierPrice } from '../arithmetic.mjs';
import {
  drawChapterBar,
  drawChapterFlow,
  drawChapterFooter,
  drawChapterLine,
  drawChapterRectangle,
  drawChapterText,
} from '../defaults.mjs';
export function drawContextTier(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-context-tier-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  const money = (n, digits = 5) => '$' + n.toFixed(digits);
  api.focus.target('te-context-tier-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'GPT-5.4 · full-session threshold',
        960,
        315,
        37,
        themeColors.yellow,
      );
      const pairs = [
        ['Ordinary input', 2.5, 5],
        ['Cached input', 0.25, 0.5],
        ['Output', 15, 22.5],
      ];
      pairs.forEach((r, i) => {
        const y = 430 + i * 185;
        drawChapterText(ctx, api, r[0], 390, y, 31, themeColors.ink);
        drawChapterText(ctx, api, '$' + r[1] + ' / million', 870, y, 32, themeColors.cyan);
        drawChapterLine(ctx, api, 1100, y - 15, 1200, y - 15, themeColors.yellow, 3);
        drawChapterText(ctx, api, '$' + r[2] + ' / million', 1500, y, 32, themeColors.pink);
        drawChapterBar(ctx, api, 780, y + 32, 650, 17, (r[1] / r[2]) * u, themeColors.cyan);
        drawChapterBar(ctx, api, 780, y + 68, 650, 17, u, themeColors.pink);
      });
    } else {
      const transitioned = currentBeat === 2 || done,
        input = currentBeat === 2 ? 300000 : transitioned ? 272001 : 272000,
        output = currentBeat === 2 ? 1000 : 0,
        price = contextTierPrice(input, output);
      drawChapterText(
        ctx,
        api,
        'Input positions: ' + input.toLocaleString(),
        960,
        320,
        38,
        themeColors.ink,
      );
      drawChapterRectangle(ctx, api, 230, 450, 1460, 100, themeColors.muted, 'transparent');
      drawChapterBar(
        ctx,
        api,
        230,
        450,
        1460,
        100,
        input / 300000,
        price.long ? themeColors.pink : themeColors.cyan,
      );
      if (currentBeat === 1)
        drawChapterFlow(
          ctx,
          api,
          {
            x: 1550,
            y: 350,
          },
          {
            x: 1550,
            y: 500,
          },
          api.clamp(u / 0.4),
          themeColors.yellow,
        );
      drawChapterText(ctx, api, '272,000 boundary', 1510, 620, 29, themeColors.yellow);
      drawChapterText(
        ctx,
        api,
        transitioned ? 'All input uses $5 / million' : 'Input uses $2.50 / million',
        960,
        735,
        35,
        transitioned ? themeColors.pink : themeColors.cyan,
      );
      if (currentBeat === 2)
        drawChapterText(
          ctx,
          api,
          'Output 1,000 × $22.50 / million',
          960,
          820,
          31,
          themeColors.pink,
        );
      else {
        drawChapterBar(
          ctx,
          api,
          430,
          780,
          1050,
          50,
          price.cost / 1.5,
          price.long ? themeColors.pink : themeColors.cyan,
        );
        drawChapterText(
          ctx,
          api,
          'Input charge for the entire prompt',
          960,
          865,
          28,
          themeColors.muted,
        );
      }
      if (currentBeat === 1 || done)
        drawChapterText(
          ctx,
          api,
          money(price.cost, 6) + ' full call',
          960,
          925,
          45,
          themeColors.yellow,
        );
      else
        drawChapterText(
          ctx,
          api,
          'Multiply the entire selected category, then add output',
          960,
          925,
          29,
          themeColors.muted,
        );
    }
    drawChapterFooter(
      ctx,
      api,
      'One extra input token selects a different full-session row; overflow-only pricing is wrong.',
    );
  });
}
export default {
  id: 'context-tier',
  draw: drawContextTier,
  cues: ['te-context-tier-0', 'te-context-tier-1', 'te-context-tier-2'],
};
