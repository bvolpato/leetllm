import { alignExpertRows } from '../arithmetic.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawFooter, drawGrid, drawSubtitle, drawText } from '../defaults.mjs';
export function drawGroupedModes(ctx, scene, state, api) {
  return api.focus.target('grouped-modes-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('grouped-modes', state),
      { b: currentBeat, g: teaching2 } = modelState;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Each expert owns a separate aligned segment'
          : currentBeat === 1
            ? 'A fixed allocation uses device-valid ranges'
            : 'The helper alignment is a versioned contract',
      );
      if (currentBeat === 0) {
        const rows = [64, 192, 32, 128, 0],
          pack = alignExpertRows(rows, 128);
        let start = 0;
        rows.forEach((n, i) => {
          const capacity = pack.capacities[i],
            y = 350 + i * 110;
          drawText(
            ctx,
            api,
            `Expert ${i}`,
            150,
            y + 43,
            29,
            n ? themeColors.blue : themeColors.muted,
          );
          if (capacity) {
            api.rect(ctx, 440, y, capacity * 2.5, 70, themeColors.panel, themeColors.muted, 3);
            api.rect(ctx, 440, y, n * 2.5, 70, themeColors.cyan, undefined, 3);
          }
          drawText(
            ctx,
            api,
            n ? `${start} → ${start + n} valid / ${capacity} allocated` : '0 rows → 0 reserved',
            1390,
            y + 43,
            27,
            n ? themeColors.cyan : themeColors.muted,
            'center',
          );
          start += capacity;
        });
      } else if (currentBeat === 1) {
        const valid = 3 + Math.floor(teaching2(1, 2)),
          labels = Array.from(
            {
              length: 6,
            },
            (_, i) =>
              Array.from(
                {
                  length: 8,
                },
                () => (i < valid ? 'x' : '·'),
              ),
          );
        drawGrid(
          ctx,
          api,
          labels,
          350,
          385,
          940,
          440,
          themeColors.muted,
          32,
          Array.from(
            {
              length: valid,
            },
            (_, row) => ({
              row,
              column: 0,
              fill: themeColors.panel,
              stroke: themeColors.cyan,
            }),
          ),
        );
        drawText(ctx, api, 'Fixed receive capacity', 820, 340, 33, themeColors.blue, 'center');
        drawBox(
          ctx,
          api,
          'Device count\n' + valid + ' valid rows',
          1390,
          440,
          350,
          150,
          themeColors.cyan,
          34,
        );
        drawText(
          ctx,
          api,
          'Invalid rows do not become tokens',
          960,
          925,
          34,
          themeColors.yellow,
          'center',
        );
      } else {
        const p = teaching2(2, 1);
        drawGrid(
          ctx,
          api,
          [
            ['K₀', 'K₀', '·', '·'],
            ['K₁', 'K₁', '·', '·'],
          ],
          180,
          400,
          650,
          250,
          themeColors.blue,
          35,
        );
        drawGrid(
          ctx,
          api,
          [
            ['∂W', '∂W'],
            ['∂W', '∂W'],
          ],
          1160,
          400,
          500,
          250,
          themeColors.green,
          40,
        );
        api.arrow(ctx, 880, 525, 1080, 525, themeColors.cyan, 5);
        drawText(
          ctx,
          api,
          'K-grouped weight-gradient reduction',
          960,
          755,
          36,
          themeColors.cyan,
          'center',
        );
        if (p > 0) {
          drawBox(ctx, api, 'Default 128', 300, 850, 550, 90, themeColors.blue, 35);
          drawBox(ctx, api, 'SM100 theoretical 256', 1020, 850, 650, 90, themeColors.yellow, 34);
        }
      }
      drawFooter(
        ctx,
        api,
        'Packed counts, masked capacity and K-grouping solve different layout problems',
      );
    }
  });
}
export default {
  id: 'grouped-modes',
  draw: drawGroupedModes,
  cues: [
    'grouped-modes-b0',
    'dg-grouped-modes-0-0',
    'dg-grouped-modes-0-1',
    'dg-grouped-modes-0-2',
    'dg-grouped-modes-0-3',
    'dg-grouped-modes-0-4',
    'grouped-modes-b1',
    'dg-grouped-modes-1-0',
    'dg-grouped-modes-1-1',
    'dg-grouped-modes-1-2',
    'dg-grouped-modes-1-3',
    'dg-grouped-modes-1-4',
    'grouped-modes-b2',
    'dg-grouped-modes-2-0',
    'dg-grouped-modes-2-1',
    'dg-grouped-modes-2-2',
    'dg-grouped-modes-2-3',
  ],
};
