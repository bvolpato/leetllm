import {
  drawAddedAnimate,
  drawAddedArrow,
  drawAddedCell,
  drawAddedCode,
  drawAddedLine,
  drawAddedNote,
  drawAddedP,
  drawAddedText,
} from '../defaults.mjs';
export function drawStackContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawAddedP(ctx, api, id) === 1;
  api.focus.target('stack-contract-construction', () => {
    if (currentBeat === 0) {
      drawAddedText(ctx, api, 'Three tools on the same machine', 160, 285, 34, themeColors.cyan);
      const rows = [
        ['Driver / UMD capability', 'nvidia-smi', 'Latest CUDA version this driver supports'],
        ['Compiler on disk', 'nvcc --version', 'Local CUDA compiler version'],
        ['Python CUDA build', 'torch.version.cuda', 'CUDA version used to build PyTorch'],
      ];
      rows.forEach(([name, command, meaning], i) => {
        const y = 410 + i * 180;
        drawAddedText(ctx, api, name, 180, y, 31, i === 0 ? themeColors.yellow : themeColors.muted);
        drawAddedText(ctx, api, command, 760, y, 31, themeColors.blue, 'left', true);
        if (done(['stack-driver', 'stack-compiler', 'stack-build'][i])) {
          drawAddedLine(ctx, api, 180, y + 35, 1720, y + 35, '#343943', 2);
          drawAddedText(ctx, api, meaning, 760, y + 100, 29, themeColors.ink);
        }
      });
      drawAddedNote(
        ctx,
        api,
        'Read the driver version, compiler version and package build separately.',
      );
    } else if (currentBeat === 1) {
      drawAddedText(
        ctx,
        api,
        'Two Python environments on the same host',
        160,
        285,
        33,
        themeColors.cyan,
      );
      const noBuild = drawAddedP(ctx, api, 'stack-no-build'),
        unavailable = drawAddedP(ctx, api, 'stack-unavailable');
      drawAddedCode(
        ctx,
        api,
        [
          'torch.version.cuda  →  ' + (unavailable > 0 ? '12.x' : noBuild > 0 ? 'None' : '?'),
          'torch.cuda.is_available()  →  False',
        ],
        180,
        420,
        34,
        noBuild === 1 ? 0 : 1,
      );
      if (noBuild === 1 && unavailable === 0) {
        drawAddedLine(ctx, api, 1070, 370, 1070, 720, '#343943', 3);
        drawAddedText(ctx, api, 'Missing CUDA package build', 1180, 435, 31, themeColors.pink);
        drawAddedText(ctx, api, 'Choose a CUDA-enabled build', 1180, 520, 28, themeColors.muted);
      }
      if (unavailable > 0) {
        drawAddedCode(ctx, api, ['CUDA build present, device unavailable'], 180, 720, 31, 0);
        const checks = ['driver compatibility', 'container access', 'device visibility'];
        checks.forEach((s, i) => {
          if (drawAddedAnimate(ctx, api, unavailable, i, 3) > 0)
            drawAddedText(ctx, api, '→ ' + s, 270 + i * 490, 845, 29, themeColors.yellow);
        });
      }
      drawAddedNote(
        ctx,
        api,
        'Once a device is visible, run a kernel and check its output.',
      );
    } else {
      drawAddedText(
        ctx,
        api,
        'Host inventory → selected process → tensor device',
        160,
        285,
        33,
        themeColors.cyan,
      );
      for (let i = 0; i < 4; i++) {
        drawAddedCell(
          ctx,
          api,
          'physical ' + i,
          170 + i * 390,
          385,
          300,
          110,
          i === 3 ? themeColors.yellow : themeColors.muted,
          32,
        );
      }
      api.rect(ctx, 610, 655, 700, 170, themeColors.panel, themeColors.blue, 3);
      drawAddedText(
        ctx,
        api,
        'Process: only physical GPU 3 exposed',
        960,
        705,
        30,
        themeColors.blue,
        'center',
      );
      if (drawAddedP(ctx, api, 'stack-logical') > 0) {
        drawAddedArrow(ctx, api, 1490, 515, 1120, 635, themeColors.yellow);
        if (done('stack-logical'))
          drawAddedText(ctx, api, 'cuda:0', 960, 790, 48, themeColors.green, 'center', true);
        else drawAddedText(ctx, api, 'logical index ?', 960, 790, 35, themeColors.yellow, 'center');
      }
      drawAddedText(ctx, api, 'Hardware compute capability', 240, 930, 28, themeColors.muted);
      drawAddedText(ctx, api, 'Build architecture targets', 1200, 930, 28, themeColors.muted);
      drawAddedNote(
        ctx,
        api,
        'Read the device name and tensor.device inside this process.',
      );
    }
  });
}
export default {
  id: 'stack-contract',
  draw: drawStackContract,
  cues: ['stack-driver', 'stack-compiler', 'stack-build', 'stack-no-build', 'stack-unavailable', 'stack-logical'],
};
