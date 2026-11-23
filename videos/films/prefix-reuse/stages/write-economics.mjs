import { clamp } from '../arithmetic.mjs';
import { drawText, footer, mark, pill } from '../defaults.mjs';
export function drawWriteEconomics(ctx, scene, state, api) {
  return api.focus.target('write-economics-geometry', () => {
    const { C: themeColors, teaching: teaching } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    const cueComplete = (id) => cueProgress(id) === 1;
    {
      drawText(ctx, api, 'Authored input prices · output and other charges excluded', 150, 270, 30);
      mark(ctx, api, 'cost-rates', () => {
        ['ordinary ×1', 'write ×1.25', 'read ×0.10'].forEach((v, i) =>
          pill(
            ctx,
            api,
            v,
            180 + i * 530,
            355,
            450,
            [themeColors.muted, themeColors.yellow, themeColors.blue][i],
          ),
        );
      });
      const plot = teaching.axes({
        x: 220,
        y: 560,
        width: 1430,
        height: 290,
        xDomain: [0, 2.3],
        yDomain: [0, 20000],
        xTicks: [0, 1, 2],
        yTicks: [0, 6000, 12000, 18000],
        xLabel: 'completed later full reads',
        yLabel: 'input cost units',
        fontSize: 24,
      });
      if (currentBeat === 0) {
        footer(ctx, api, 'Same 6,000-token prefix · count later reads before expiry.');
        return;
      }
      const writeReady = currentBeat > 1 || cueComplete('cost-write'),
        readReady = currentBeat > 1 || cueVisible('cost-read'),
        totalReady = currentBeat > 1 || cueComplete('cost-total');
      const cold = Array.from(
        {
          length: 21,
        },
        (_, i) => ({
          x: i / 10,
          y: (1 + i / 10) * 6000,
        }),
      );
      teaching.curve({
        plot,
        points: cold,
        color: themeColors.muted,
        width: 3,
      });
      if (writeReady) {
        teaching.scatter({
          plot,
          points: [
            {
              x: 0,
              y: 7500,
              color: themeColors.yellow,
              radius: 10,
            },
          ],
        });
        drawText(ctx, api, 'Write 7,500', 590, 520, 28, themeColors.yellow);
      }
      if (readReady) {
        const end = currentBeat > 1 ? 2 : cueProgress('cost-read');
        teaching.curve({
          plot,
          points: Array.from(
            {
              length: 21,
            },
            (_, i) => ({
              x: (end * i) / 20,
              y: 7500 + (600 * end * i) / 20,
            }),
          ),
          color: themeColors.blue,
          width: 5,
        });
        drawText(
          ctx,
          api,
          currentBeat > 1 || cueComplete('cost-read')
            ? 'Each later read adds 600'
            : 'Later read cost pending',
          1200,
          520,
          28,
          themeColors.blue,
          'center',
        );
      }
      const comparisonY = plot.bounds.y + plot.bounds.height + 130;
      mark(ctx, api, 'cost-total', () => {
        if (currentBeat === 1)
          drawText(
            ctx,
            api,
            totalReady
              ? '1 write + 1 read: 8,100 < 12,000 cold'
              : 'Write + read comparison pending',
            960,
            comparisonY,
            34,
            totalReady ? themeColors.green : themeColors.muted,
            'center',
          );
      });
      if (currentBeat === 2) {
        mark(ctx, api, 'cost-formula', () => {
          if (cueVisible('cost-formula'))
            drawText(
              ctx,
              api,
              'r × (ordinary − read) ≥ write − ordinary',
              960,
              comparisonY,
              32,
              themeColors.green,
              'center',
            );
        });
        mark(ctx, api, 'cost-long', () => {
          if (cueVisible('cost-long'))
            drawText(
              ctx,
              api,
              'Write ×2, read ×0.1 → two complete later reads',
              960,
              1040,
              27,
              themeColors.yellow,
              'center',
            );
        });
      }
    }
  });
}
export default {
  id: 'write-economics',
  draw: drawWriteEconomics,
  cues: ['cost-rates', 'cost-write', 'cost-read', 'cost-total', 'cost-formula', 'cost-long'],
};
