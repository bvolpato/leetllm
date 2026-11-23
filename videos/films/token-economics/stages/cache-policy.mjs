import {
  drawChapterBar,
  drawChapterFlow,
  drawChapterFooter,
  drawChapterRectangle,
  drawChapterText,
} from '../defaults.mjs';
export function drawCachePolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-cache-policy-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  api.focus.target('te-cache-policy-mechanism', () => {
    if (currentBeat === 0) {
      const items = ['Instructions', 'Tool schema', 'Policy v3', 'Order 42'];
      const changed = u >= 1;
      drawChapterText(ctx, api, 'Earlier request', 90, 377, 29, themeColors.muted, 'left');
      drawChapterText(ctx, api, 'Current request', 90, 619, 29, themeColors.muted, 'left');
      items.forEach((s, i) => {
        const x = 170 + i * 430;
        drawChapterRectangle(
          ctx,
          api,
          x,
          410,
          350,
          110,
          i < 3 ? themeColors.yellow : themeColors.cyan,
        );
        drawChapterText(
          ctx,
          api,
          s,
          x + 175,
          475,
          27,
          i < 3 ? themeColors.yellow : themeColors.cyan,
        );
        drawChapterRectangle(
          ctx,
          api,
          x,
          650,
          350,
          110,
          i === 3 || (i === 2 && changed) ? themeColors.pink : themeColors.yellow,
        );
        drawChapterText(
          ctx,
          api,
          i === 3 ? 'Order 77' : i === 2 && changed ? 'Policy v4' : s,
          x + 175,
          715,
          27,
          i === 3 || (i === 2 && changed) ? themeColors.pink : themeColors.yellow,
        );
        if (i < 3)
          drawChapterFlow(
            ctx,
            api,
            {
              x: x + 175,
              y: 530,
            },
            {
              x: x + 175,
              y: 620,
            },
            u,
            i === 2 && changed ? themeColors.pink : themeColors.green,
          );
      });
      drawChapterText(
        ctx,
        api,
        changed
          ? 'The matching prefix ends before the changed policy.'
          : 'The instructions, tool schema and policy match.',
        960,
        870,
        32,
        changed ? themeColors.pink : themeColors.green,
      );
    } else {
      const openai = currentBeat === 1;
      drawChapterText(
        ctx,
        api,
        openai ? 'OpenAI GPT-5.6+ · inspected Nov 6, 2026' : 'Anthropic · inspected Nov 6, 2026',
        960,
        325,
        34,
        themeColors.ink,
      );
      const durations = openai ? [30, 720] : [5, 60],
        rates = openai ? [1.25, 2.5] : [1.25, 2],
        names = openai ? ['30 minutes', '12 hours'] : ['5 minutes', '1 hour'];
      durations.forEach((m, i) => {
        const y = 475 + i * 240;
        drawChapterText(ctx, api, names[i], 360, y, 34, themeColors.yellow);
        drawChapterRectangle(ctx, api, 640, y - 50, 930, 75, themeColors.muted, 'transparent');
        drawChapterBar(
          ctx,
          api,
          640,
          y - 50,
          930,
          75,
          (m / Math.max(...durations)) * u,
          themeColors.yellow,
        );
        drawChapterText(
          ctx,
          api,
          'Write ' + rates[i] + ' × base input',
          1110,
          y + 100,
          32,
          themeColors.yellow,
        );
      });
      if (openai)
        drawChapterText(
          ctx,
          api,
          'Minimum: 1,024 visible input tokens · actual read rate is model-specific',
          960,
          935,
          27,
          themeColors.cyan,
        );
    }
    drawChapterFooter(
      ctx,
      api,
      'Policy, minimums, retention and reported hits are provider/model contracts, not a universal discount.',
    );
  });
}
export default {
  id: 'cache-policy',
  draw: drawCachePolicy,
  cues: ['te-cache-policy-0', 'te-cache-policy-1', 'te-cache-policy-2'],
};
