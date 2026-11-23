import { IMAGE, KERNEL } from '../fixtures.mjs';
import { cueProgress, equation, formatValue, imageGrid, kernelGrid, text } from '../defaults.mjs';
export function drawKernel(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const stage = (beat, start = 0.08, end = 0.88) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress2, start, end);
  const fade = components.fade;
  ctx.save();
  {
    if (currentBeat === 0) {
      api.focus.target('edge-kernel', () => {
        const columns = ['kernel-left', 'kernel-center', 'kernel-right'];
        components.matrix({
          values: KERNEL,
          x: 690,
          y: 340,
          cellSize: 150,
          gap: 10,
          format: formatValue,
          style: {
            fill: themeColors.panel,
            stroke: themeColors.cyan,
            fontSize: 55,
            textColor: themeColors.cyan,
            padding: 15,
          },
          cellStyle: (v, r, col) => ({
            labelOpacity: cueProgress(ctx, api, columns[col], stage(0, col * 0.2, 0.4 + col * 0.2)),
            textColor: v < 0 ? themeColors.pink : v > 0 ? themeColors.cyan : themeColors.muted,
          }),
        });
        equation(
          ctx,
          api,
          '\\text{right brightness}-\\text{left brightness}',
          960,
          940,
          43,
          themeColors.ink,
        );
      });
    } else
      api.focus.target('kernel-comparison', () => {
        const values =
          currentBeat === 1
            ? Array.from(
                {
                  length: 3,
                },
                () => [2 / 3, 2 / 3, 2 / 3],
              )
            : IMAGE.slice(0, 3).map((row) => row.slice(1, 4));
        const progress = cueProgress(
          ctx,
          api,
          currentBeat === 1 ? 'uniform-columns' : 'edge-columns',
          stage(currentBeat),
        );
        imageGrid(ctx, api, values, 230, 370, 125);
        kernelGrid(ctx, api, KERNEL, 820, 370, 100);
        const left = -values.reduce((n, row) => n + row[0], 0),
          right = values.reduce((n, row) => n + row[2], 0);
        const first = left * api.phase(progress, 0, 0.45),
          last = right * api.phase(progress, 0.45, 0.9);
        text(ctx, api, 'signed column totals', 1460, 290, 33, themeColors.muted, 'center');
        api.line(ctx, 1260, 590, 1740, 590, themeColors.muted, 3);
        api.rect(ctx, 1290, 590, 145, -first * 90, themeColors.pink, undefined, 7);
        api.rect(ctx, 1530, 590 - last * 90, 145, last * 90, themeColors.cyan, undefined, 7);
        text(ctx, api, first.toFixed(0), 1362, 940, 46, themeColors.pink, 'center');
        text(ctx, api, '+', 1480, 940, 43, themeColors.ink, 'center');
        text(ctx, api, last.toFixed(0), 1602, 940, 46, themeColors.cyan, 'center');
        if (cueProgress(ctx, api, currentBeat === 1 ? 'uniform-result' : 'edge-result', 0) === 1)
          equation(ctx, api, '=' + String(left + right), 1480, 1040, 50, themeColors.green);
      });
  }
  ctx.restore();
}
export default {
  id: 'kernel',
  draw: drawKernel,
  cues: [
    'kernel-left',
    'kernel-center',
    'kernel-right',
    'uniform-columns',
    'uniform-result',
    'edge-columns',
    'edge-result',
  ],
};
