import { sampleModel } from '../model.mjs';
import {
  drawOriginalEquation,
  drawOriginalFooter,
  drawOriginalMark,
  drawOriginalText,
} from '../defaults.mjs';
export function drawWarps(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('warps', state);
  {
    drawOriginalText(
      ctx,
      api,
      currentBeat === 0
        ? 'Two blocks of four threads'
        : 'One 36-thread block · consecutive local indexes',
      160,
      290,
      34,
      themeColors.cyan,
    );
    drawOriginalMark(ctx, api, 'warp-membership', () => {
      const rows =
        currentBeat === 0
          ? [
              {
                block: 0,
                count: Math.floor(4 * modelState.first + 1e-9),
                start: 0,
              },
              {
                block: 1,
                count: Math.floor(4 * modelState.second + 1e-9),
                start: 4,
              },
            ]
          : [
              {
                block: 0,
                count: Math.floor(32 * modelState.main + 1e-9),
                start: 0,
              },
              {
                block: 0,
                count: Math.floor(4 * modelState.rest + 1e-9),
                start: 32,
              },
            ];
      rows.forEach((row, j) => {
        const y = 430 + j * 220;
        drawOriginalText(ctx, api, 'Block ' + row.block, 120, y + 40, 27, themeColors.muted);
        drawOriginalText(
          ctx,
          api,
          'warp ' + (currentBeat === 0 ? 0 : j),
          120,
          y + 83,
          26,
          themeColors.muted,
        );
        teaching.grid({
          x: 295,
          y,
          width: 1440,
          height: 110,
          rows: 1,
          columns: 32,
          labels: [
            Array.from(
              {
                length: 32,
              },
              (_, i) =>
                i < row.count && (currentBeat === 0 || [0, 3, 4, 7, 31, 32, 35].includes(row.start + i))
                  ? (currentBeat === 0 ? 'T' : '') + (row.start + i)
                  : '',
            ),
          ],
          fontSize: 26,
          padding: 3,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          highlights: Array.from(
            {
              length: row.count,
            },
            (_, column) => ({
              row: 0,
              column,
              fill: themeColors.panel,
              stroke: [31, 32].includes(row.start + column)
                ? themeColors.yellow
                : j === 0
                  ? themeColors.cyan
                  : themeColors.pink,
            }),
          ),
        });
        if (currentBeat === 0 && row.count > 0) {
          const firstLane = 295 + 1440 / 64;
          api.line(ctx, firstLane, y + 114, firstLane, y + 131, themeColors.muted, 2);
          drawOriginalText(ctx, api, 'local thread 0', 295, y + 164, 27, themeColors.muted);
        }
      });
      const ready =
        currentBeat === 0 ? modelState.second === 1 : modelState.main === 1 && modelState.rest === 1;
      if (ready)
        drawOriginalEquation(
          ctx,
          api,
          currentBeat === 0 ? '\\frac{8}{64}=12.5\\%' : '\\frac{36}{64}=56.25\\%',
          960,
          920,
          54,
          themeColors.green,
        );
    });
    drawOriginalFooter(ctx, api, 'Lane slots in this launch');
  }
}
export default {
  id: 'warps',
  draw: drawWarps,
  cues: ['populate-warps', 'next-block-warp', 'larger-block', 'warp-remainder'],
};
