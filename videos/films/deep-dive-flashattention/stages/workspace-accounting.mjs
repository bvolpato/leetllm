import { clamp, gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionEquation,
  drawExtensionFooter,
  drawExtensionText,
  drawExtensionTravelling,
} from '../defaults.mjs';
export function drawWorkspaceAccounting(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleModel('workspace-accounting', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      if (currentBeat < 2) {
        drawExtensionText(ctx, api, 'B8 × H32 × L8192', 170, 300, 36, themeColors.yellow);
        const n = 24,
          size = 22,
          x = 180,
          y = 390;
        teaching.grid({
          x,
          y,
          width: size * n,
          height: size * n,
          rows: n,
          columns: n,
          fill: themeColors.panel,
          stroke: themeColors.blue,
        });
        for (let i = 0; i < Math.floor(progress * n); i++)
          api.rect(
            ctx,
            x + i * size + 1,
            y + 1,
            size - 2,
            size * n - 2,
            themeColors.blue,
            undefined,
            0,
          );
        drawExtensionText(ctx, api, '8192 × 8192 per head', 180, 970, 29, themeColors.blue);
        if (currentBeat === 0) {
          drawExtensionEquation(ctx, api, String.raw`8\cdot32\cdot8192^2\cdot2`, 1330, 475, 42);
          drawExtensionText(
            ctx,
            api,
            modelState.scoreReady ? '32 GiB' : 'Score allocation = ?',
            1330,
            660,
            52,
            modelState.scoreReady ? themeColors.pink : themeColors.yellow,
            'center',
          );
          drawExtensionText(
            ctx,
            api,
            'One score tensor · Q/K/V/O remain',
            1330,
            810,
            27,
            themeColors.muted,
            'center',
          );
        } else {
          teaching.grid({
            x: 1080,
            y: 390,
            width: 70,
            height: 528,
            rows: 24,
            columns: 1,
            fill: themeColors.panel,
            stroke: themeColors.cyan,
          });
          drawExtensionTravelling(ctx, api, 750, 650, 1050, 650, progress);
          drawExtensionText(
            ctx,
            api,
            'FP32 LSE per query row',
            1430,
            440,
            31,
            themeColors.cyan,
            'center',
          );
          drawExtensionEquation(ctx, api, String.raw`8\cdot32\cdot8192\cdot4`, 1430, 600, 36);
          drawExtensionText(
            ctx,
            api,
            modelState.lseReady ? '8 MiB' : 'Saved LSE = ?',
            1430,
            780,
            51,
            modelState.lseReady ? themeColors.green : themeColors.yellow,
            'center',
          );
        }
        drawExtensionFooter(
          ctx,
          api,
          'Physical drawings show structure; allocations are calculated from stated real dimensions',
        );
      } else {
        drawExtensionText(
          ctx,
          api,
          'FA1 element-access model',
          960,
          300,
          37,
          themeColors.blue,
          'center',
        );
        drawExtensionEquation(ctx, api, String.raw`d\le M\le nd`, 960, 410, 46);
        const widths = [1000, 1000 / 2, 1000 / 4],
          labels = ['M', '2M', '4M'];
        widths.forEach((w, i) => {
          drawExtensionText(ctx, api, labels[i], 200, 560 + i * 130, 30, themeColors.yellow);
          api.rect(
            ctx,
            430,
            515 + i * 130,
            w * (i === 0 ? 1 : clamp(progress * 3 - i + 1)),
            65,
            themeColors.blue,
            undefined,
            0,
          );
        });
        drawExtensionEquation(ctx, api, String.raw`O(n^2d^2/M)`, 1530, 650, 39);
        drawExtensionFooter(
          ctx,
          api,
          'M counts scalar elements · model-specific accesses, not universal byte/runtime forecasts',
        );
      }
    }
  });
}
export default {
  id: 'workspace-accounting',
  draw: drawWorkspaceAccounting,
  cues: [
    'fa-workspace-accounting-0',
    'fa-workspace-score',
    'fa-workspace-accounting-1',
    'fa-workspace-lse',
    'fa-workspace-accounting-2',
  ],
};
