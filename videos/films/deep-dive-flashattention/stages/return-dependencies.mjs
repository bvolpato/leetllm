import { gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionCell,
  drawExtensionFooter,
  drawExtensionL,
  drawExtensionText,
  drawExtensionTravelling,
} from '../defaults.mjs';
export function drawReturnDependencies(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('return-dependencies', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      if (currentBeat < 2) {
        drawExtensionCell(
          ctx,
          api,
          'Caller expects output tensor',
          190,
          350,
          650,
          100,
          themeColors.yellow,
        );
        const n = currentBeat === 0 ? (modelState.ready ? 3 : 1) : 2,
          labels =
            currentBeat === 0 ? (n === 1 ? ['O'] : ['O', 'LSE', 'debug']) : ['O', 'LSE / None'];
        labels.forEach((v, i) =>
          drawExtensionCell(
            ctx,
            api,
            v,
            1020 + i * 240,
            520,
            210,
            110,
            i ? themeColors.muted : themeColors.green,
          ),
        );
        drawExtensionTravelling(ctx, api, 910, 400, 1130, 510, progress, themeColors.yellow);
        drawExtensionText(
          ctx,
          api,
          currentBeat === 0
            ? modelState.ready
              ? 'Public debug return: three-tuple'
              : 'Default return: tensor'
            : 'FA4 public return: pair',
          960,
          780,
          37,
          themeColors.cyan,
          'center',
        );
        drawExtensionText(
          ctx,
          api,
          'Unpack O deliberately · absent optional LSE is not an invented statistic',
          960,
          930,
          28,
          themeColors.yellow,
          'center',
        );
        drawExtensionFooter(
          ctx,
          api,
          currentBeat === 0
            ? 'Private helper additionally carries random state; debug probability buffer may be quadratic/incorrectly scaled'
            : 'Return arity and batch dimensions have different meanings',
        );
      } else if (currentBeat === 2) {
        drawExtensionCell(ctx, api, 'ROCm wrapper', 180, 480, 350, 100, themeColors.blue);
        const rows = [
          ['Composable Kernel', 'default'],
          ['AIter Triton', 'optional path'],
          ['HIP extension missing', 'warn → try Triton import'],
        ];
        rows.forEach(([n, l], i) => {
          drawExtensionCell(
            ctx,
            api,
            n,
            780,
            340 + i * 195,
            520,
            95,
            i < 2 ? themeColors.cyan : themeColors.pink,
          );
          if (progress > i / 3)
            drawExtensionText(ctx, api, l, 1510, 400 + i * 195, 28, themeColors.yellow, 'center');
          drawExtensionL(ctx, api, 530, 530, 780, 390 + i * 195);
        });
        drawExtensionFooter(
          ctx,
          api,
          'Environment Triton and system AIter settings are separate dependency choices',
        );
      } else {
        const dims = [
          ['FA2 CUDA', 'FP16 / BF16', 'head width ≤256'],
          ['FA4 selected operations', 'operation-specific guards', 'value width 512'],
          ['October FA4 FP8', 'forward only under pin', 'backward rejected'],
        ];
        dims.forEach(([name, type, guard], i) => {
          const y = 365 + i * 210;
          drawExtensionCell(ctx, api, name, 180, y, 480, 95, themeColors.blue);
          drawExtensionCell(ctx, api, type, 720, y, 520, 95, themeColors.cyan);
          if (progress > i / 3)
            drawExtensionText(ctx, api, guard, 1530, y + 65, 29, themeColors.yellow, 'center');
        });
        drawExtensionFooter(
          ctx,
          api,
          'Consumer-GPU width 256 backward without dropout documented from FA2.5.5; no universal copied cap',
        );
      }
    }
  });
}
export default {
  id: 'return-dependencies',
  draw: drawReturnDependencies,
  cues: [
    'fa-return-dependencies-0',
    'fa-return-three',
    'fa-return-dependencies-1',
    'fa-return-pair',
    'fa-return-dependencies-2',
    'fa-return-dependencies-3',
  ],
};
