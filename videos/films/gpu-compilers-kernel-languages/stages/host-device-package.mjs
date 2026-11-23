import {
  arrow,
  box,
  codeText,
  cueProgress,
  detailText,
  focusTarget,
  footer,
  line,
  visible,
} from '../defaults.mjs';
export function drawHostDevicePackage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      focusTarget(ctx, api, 'package-paths', () => {
        box(ctx, api, 120, 310, 460, 420, themeColors.blue);
        codeText(ctx, api, 'vector_add.cu', 150, 360, 32, themeColors.blue);
        codeText(ctx, api, 'CPU: main()', 150, 455, 32);
        codeText(ctx, api, '__global__ void add_kernel', 150, 565, 23, themeColors.cyan);
        detailText(ctx, api, 'one translation unit', 150, 670, 27, themeColors.muted);
        const split = cueProgress(ctx, api, 'split-host-device');
        if (split > 0) {
          arrow(ctx, api, 590, 445, 810, 370, themeColors.blue);
          arrow(ctx, api, 590, 575, 810, 675, themeColors.cyan);
          box(ctx, api, 830, 300, 420, 140, themeColors.blue);
          detailText(ctx, api, 'supported C++ compiler', 1040, 355, 28, themeColors.blue, 'center');
          detailText(ctx, api, 'host object', 1040, 405, 28, themeColors.ink, 'center');
          box(ctx, api, 830, 600, 420, 170, themeColors.cyan);
          detailText(ctx, api, 'device compilation', 1040, 650, 28, themeColors.cyan, 'center');
          codeText(ctx, api, 'compute_90 → PTX', 875, 705, 28);
          codeText(ctx, api, 'sm_90 → cubin', 875, 748, 28);
        }
        if (visible(ctx, api, 'package-images')) {
          box(ctx, api, 1440, 350, 330, 410, themeColors.green);
          codeText(ctx, api, 'host object', 1470, 400, 28, themeColors.green);
          box(ctx, api, 1470, 440, 270, 260, themeColors.cyan);
          detailText(ctx, api, 'fatbinary', 1605, 480, 30, themeColors.cyan, 'center');
          codeText(ctx, api, 'PTX compute_90', 1490, 550, 24);
          codeText(ctx, api, 'cubin sm_90', 1490, 620, 24);
          arrow(ctx, api, 1265, 370, 1410, 400, themeColors.blue);
          arrow(ctx, api, 1265, 680, 1410, 680, themeColors.cyan);
        }
      });
    } else if (currentBeat === 1) {
      focusTarget(ctx, api, 'artifact-boundaries', () => {
        const labels = [
          [
            'PTX file',
            ['.version 9.2', '.target sm_90', 'virtual values %f1,%f2'],
            themeColors.cyan,
          ],
          [
            'target cubin',
            ['ELF container', 'encoded instructions', 'physical allocation'],
            themeColors.green,
          ],
          [
            'SASS view',
            ['native opcodes', 'byte offsets', 'register operands'],
            themeColors.pink,
          ],
        ];
        labels.forEach(([title, rows, color], i) => {
          const x = 110 + i * 600;
          box(ctx, api, x, 340, 500, 350, color);
          detailText(ctx, api, title, x + 250, 400, 35, color, 'center');
          rows.forEach((v, j) => codeText(ctx, api, v, x + 25, 490 + j * 70, 24));
          if (i > 0 && visible(ctx, api, i === 1 ? 'assemble-target' : 'disassemble-view'))
            arrow(ctx, api, x - 80, 520, x - 15, 520, color);
        });
        if (visible(ctx, api, 'assemble-target'))
          detailText(
            ctx,
            api,
            'assembler allocates target registers',
            960,
            780,
            31,
            themeColors.yellow,
            'center',
          );
        if (visible(ctx, api, 'disassemble-view')) {
          codeText(ctx, api, 'constrained NVVM IR → libNVVM → PTX', 440, 875, 31, themeColors.cyan);
          detailText(
            ctx,
            api,
            'libNVVM accepts modules that follow the NVVM IR rules.',
            960,
            940,
            27,
            themeColors.muted,
            'center',
          );
        }
      });
      footer(ctx, api, 'Concrete headers shown here match the captured virtual file.');
    } else {
      focusTarget(ctx, api, 'compatibility-header', () => {
        codeText(ctx, api, '.version 9.2', 180, 350, 42, themeColors.yellow);
        codeText(ctx, api, '.target sm_90', 180, 440, 42, themeColors.cyan);
        detailText(ctx, api, 'PTX ISA syntax', 1040, 350, 34, themeColors.yellow);
        detailText(ctx, api, 'virtual feature target', 1040, 440, 34, themeColors.cyan);
        line(ctx, api, 700, 285, 700, 530, themeColors.muted, 2);
        const rows = [
          ['ordinary virtual target', 'later GPU + driver support required'],
          ['architecture-specific a', 'restricted architecture scope'],
          ['family-specific f', 'restricted family scope'],
        ];
        rows.forEach(([a, z], i) => {
          detailText(ctx, api, a, 180, 625 + i * 100, 30, i ? themeColors.pink : themeColors.green);
          detailText(ctx, api, z, 760, 625 + i * 100, 29);
        });
        if (visible(ctx, api, 'ptx-driver-version')) {
          box(ctx, api, 170, 900, 1500, 70, themeColors.yellow);
          detailText(
            ctx,
            api,
            'Driver must understand the PTX ISA version too.',
            920,
            946,
            31,
            themeColors.yellow,
            'center',
          );
        }
      });
    }
  }
}
export default {
  id: 'host-device-package',
  draw: drawHostDevicePackage,
  cues: [
    'split-host-device',
    'package-images',
    'assemble-target',
    'disassemble-view',
    'ptx-driver-version',
  ],
};
