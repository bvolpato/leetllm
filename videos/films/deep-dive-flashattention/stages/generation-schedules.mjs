import { gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionBar,
  drawExtensionCell,
  drawExtensionFooter,
  drawExtensionL,
  drawExtensionRectangle,
  drawExtensionText,
} from '../defaults.mjs';
export function drawGenerationSchedules(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('generation-schedules', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      if (currentBeat === 0) {
        drawExtensionText(
          ctx,
          api,
          'Same query-owned output tiles',
          960,
          300,
          35,
          themeColors.yellow,
          'center',
        );
        for (let row = 0; row < 4; row++) {
          const y = 390 + row * 135;
          drawExtensionCell(ctx, api, 'Q tile' + row, 200, y, 350, 85, themeColors.blue);
          drawExtensionRectangle(ctx, api, 900, y, 790, 85, themeColors.muted);
          if (row < Math.ceil(progress * 4))
            api.rect(ctx, 903, y + 3, 784, 79, themeColors.cyan, undefined, 0);
          drawExtensionText(
            ctx,
            api,
            'independent thread block',
            1295,
            y + 55,
            27,
            themeColors.ink,
            'center',
          );
          drawExtensionL(ctx, api, 550, y + 42, 900, y + 42);
        }
        drawExtensionFooter(
          ctx,
          api,
          'FA2 partitions query work and reduces non-matrix / cross-warp overhead',
        );
      } else if (currentBeat === 1) {
        drawExtensionText(
          ctx,
          api,
          'Hopper pipeline: two tiles share three stages',
          960,
          295,
          31,
          themeColors.yellow,
          'center',
        );
        const tasks = [
          ['load A', 0, 2, 0, themeColors.blue],
          ['matmul A', 2, 5, 1, themeColors.cyan],
          ['load B', 2, 4, 0, themeColors.blue],
          ['softmax A', 5, 7, 2, themeColors.pink],
          ['matmul B', 5, 8, 1, themeColors.cyan],
          ['softmax B', 8, 10, 2, themeColors.pink],
        ];
        const x = (t) => 450 + t * 125;
        ['TMA / load', 'tensor-core matmul', 'softmax'].forEach((v, i) =>
          drawExtensionText(ctx, api, v, 170, 455 + i * 180, 27, themeColors.muted),
        );
        for (const [name, a, z, l, c] of tasks) {
          const f = Math.max(0, progress * 10 - a);
          if (f > 0) {
            drawExtensionRectangle(
              ctx,
              api,
              x(a),
              390 + l * 180,
              Math.max(0.01, Math.min(z - a, f) * 125),
              100,
              c,
            );
            if (f > (z - a) * 0.8)
              drawExtensionText(ctx, api, name, x((a + z) / 2), 450 + l * 180, 25, c, 'center');
          }
        }
        drawExtensionFooter(
          ctx,
          api,
          'FA3 Hopper: warp specialization and dependency-safe overlap',
        );
      } else {
        const lanes = [
          ['matrix engine', 0.95, themeColors.cyan],
          ['shared-memory work', 0.6, themeColors.blue],
          ['exponential work', 0.35, themeColors.pink],
        ];
        drawExtensionText(
          ctx,
          api,
          'Qualitative hardware scaling illustration',
          960,
          300,
          35,
          themeColors.yellow,
          'center',
        );
        lanes.forEach(([n, f, c], i) => {
          const y = 400 + i * 180;
          drawExtensionText(ctx, api, n, 200, y + 45, 30, c);
          drawExtensionBar(ctx, api, 680, y, 960, 70, f * (0.25 + 0.75 * progress), c);
        });
        drawExtensionFooter(
          ctx,
          api,
          'FA4: emulated exp / conditional rescale / tensor memory / cooperative CTAs · CuTe DSL in Python',
        );
      }
    }
  });
}
export default {
  id: 'generation-schedules',
  draw: drawGenerationSchedules,
  cues: ['fa-generation-schedules-0', 'fa-generation-schedules-1', 'fa-generation-schedules-2'],
};
