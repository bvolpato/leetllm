import { cueProgress } from '../construction.mjs';
import { codeBlock, focusTarget, codeText } from '../defaults.mjs';
export function drawGpu(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const q = (id, beat = 0, start, end) => cueProgress(state, id, beat, start, end);
  {
    const visible = q('gpu-visible', 1) >= 1;
    const framework = q('gpu-framework', 1) >= 1;
    focusTarget(ctx, api, 'host-probe', () =>
      codeBlock(
        ctx,
        api,
        '1 · Host driver',
        ['$ nvidia-smi', visible ? 'GPU visible' : 'Result pending'],
        140,
        345,
        480,
        250,
        {
          color: themeColors.blue,
        },
      ),
    );
    focusTarget(ctx, api, 'device-probe', () =>
      codeBlock(
        ctx,
        api,
        '2 · Device exposure',
        [
          'docker run --rm \\',
          '  --runtime=nvidia \\',
          '  --gpus all \\',
          '  ubuntu nvidia-smi',
          visible ? 'GPU visible' : 'Result pending',
        ],
        720,
        345,
        540,
        365,
        {
          color: themeColors.cyan,
        },
      ),
    );
    focusTarget(ctx, api, 'framework-probe', () =>
      codeBlock(
        ctx,
        api,
        '3 · Application image',
        ['>>> import torch', framework > 0 ? 'ModuleNotFoundError' : 'Probe pending'],
        1360,
        345,
        410,
        250,
        {
          color: framework > 0 ? themeColors.yellow : themeColors.muted,
        },
      ),
    );
    api.arrow(ctx, 645, 470, 695, 470, themeColors.blue, 4);
    api.arrow(ctx, 1285, 470, 1335, 470, themeColors.cyan, 4);
    if (framework > 0)
      codeBlock(
        ctx,
        api,
        'The CPU scorer image has no PyTorch package',
        ["ModuleNotFoundError: No module named 'torch'"],
        180,
        760,
        1550,
        170,
        {
          color: themeColors.yellow,
        },
      );
    else
      codeText(
        ctx,
        api,
        'A CUDA workload also needs a compatible framework build',
        960,
        850,
        33,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'gpu',
  draw: drawGpu,
  cues: ['gpu-host', 'gpu-device', 'gpu-visible', 'gpu-framework'],
};
