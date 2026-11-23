import {
  drawChapterBar,
  drawChapterFlow,
  drawChapterLine,
  drawChapterRectangle,
  drawChapterTag,
  drawChapterText,
} from '../defaults.mjs';
import { cueProgress } from '../construction.mjs';
import { coldMicro } from '../fixtures.mjs';
import { usd } from '../forecast-calendar.mjs';
export function drawAccountingPhysics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-accounting-physics-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82);
  api.focus.target('te-accounting-physics-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(ctx, api, 'Known input positions', 490, 330, 33, themeColors.cyan);
      drawChapterText(ctx, api, 'Generated positions', 1420, 330, 33, themeColors.pink);
      for (let i = 0; i < 8; i++) {
        drawChapterRectangle(ctx, api, 200 + i * 78, 420, 62, 100, themeColors.cyan);
        drawChapterBar(ctx, api, 200 + i * 78, 420, 62, 100, u, themeColors.cyan);
        drawChapterText(ctx, api, i + 1, 231 + i * 78, 570, 25, themeColors.cyan);
        const v = api.clamp(u * 8 - i);
        drawChapterRectangle(ctx, api, 1110 + i * 78, 620, 62, 100, themeColors.pink);
        drawChapterBar(ctx, api, 1110 + i * 78, 620, 62, 100, v, themeColors.pink);
        if (i < 7)
          drawChapterLine(ctx, api, 1174 + i * 78, 670, 1185 + i * 78, 670, themeColors.pink, 2);
      }
      drawChapterText(
        ctx,
        api,
        'Same layer · many known positions',
        490,
        780,
        29,
        themeColors.cyan,
      );
      drawChapterText(
        ctx,
        api,
        'Each next position depends on earlier output',
        1420,
        820,
        27,
        themeColors.pink,
      );
      drawChapterText(
        ctx,
        api,
        'Measure prefill and decode time on the workload you serve.',
        960,
        935,
        34,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      drawChapterText(ctx, api, 'Execution', 430, 330, 34, themeColors.cyan);
      drawChapterText(ctx, api, 'Billing categories', 1320, 330, 34, themeColors.yellow);
      drawChapterTag(ctx, api, 'Prefill', 430, 475, themeColors.cyan);
      drawChapterTag(ctx, api, 'Decode', 430, 715, themeColors.pink);
      const labels = ['Ordinary input', 'Cache read', 'Cache write', 'Output'];
      labels.forEach((s, i) => {
        const y = 420 + i * 125;
        drawChapterTag(ctx, api, s, 1370, y, themeColors[i === 3 ? 'pink' : 'yellow'], 460);
        if (u > i / 4)
          drawChapterFlow(
            ctx,
            api,
            {
              x: 690,
              y: i === 3 ? 715 : 475,
            },
            {
              x: 1100,
              y,
            },
            api.clamp(u * 4 - i),
            i === 3 ? themeColors.pink : themeColors.yellow,
          );
      });
      drawChapterText(
        ctx,
        api,
        'Embeddings · tools · lookup · storage · infrastructure',
        960,
        945,
        28,
        themeColors.muted,
      );
    } else {
      drawChapterTag(ctx, api, 'Attempt A1 · dispatched', 430, 420, themeColors.blue);
      drawChapterTag(ctx, api, 'Local timeout', 1360, 420, themeColors.pink);
      drawChapterFlow(
        ctx,
        api,
        {
          x: 680,
          y: 420,
        },
        {
          x: 1110,
          y: 420,
        },
        u,
        themeColors.pink,
      );
      const matched = cueProgress(state, 'match-timeout', api.phase(q, 0.7, 0.85)) === 1;
      const color = matched ? themeColors.green : themeColors.yellow;
      drawChapterRectangle(ctx, api, 640, 620, 640, 170, color);
      drawChapterText(ctx, api, matched ? 'Receipt A1' : 'Attempt A1', 960, 685, 36, color);
      drawChapterText(
        ctx,
        api,
        matched ? 'Generation charge  ' + usd(coldMicro, 5) : 'Awaiting usage',
        960,
        745,
        27,
        color,
      );
      drawChapterText(
        ctx,
        api,
        matched
          ? '1,800 ordinary input tokens  +  180 output tokens'
          : 'Keep the charge open for this request.',
        960,
        905,
        32,
        color,
      );
    }
  });
}
export default {
  id: 'accounting-physics',
  draw: drawAccountingPhysics,
  cues: [
    'te-accounting-physics-0',
    'te-accounting-physics-1',
    'te-accounting-physics-2',
    'match-timeout',
  ],
};
