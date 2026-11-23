import {
  arrow,
  box,
  codeText,
  detailText,
  focusTarget,
  footer,
  line,
  visible,
} from '../defaults.mjs';
export function drawTritonLowering(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;

  {
    if (currentBeat === 0)
      focusTarget(ctx, api, 'lowering-stages', () => {
        const labels = ['source', 'TTIR', 'TTGIR', 'LLVM IR', 'PTX', 'cubin'];
        labels.forEach((v, i) => {
          const x = 130 + i * 285;
          box(ctx, api, x, 320, 245, 95, i === 1 ? themeColors.yellow : themeColors.cyan);
          detailText(
            ctx,
            api,
            v,
            x + 122,
            380,
            30,
            i === 1 ? themeColors.yellow : themeColors.cyan,
            'center',
          );
          if (i) arrow(ctx, api, x - 35, 367, x - 6, 367, themeColors.cyan);
        });
        if (visible(ctx, api, 'triton-stages')) {
          codeText(ctx, api, 'arith.addf  tensor<256xf32>', 180, 535, 35, themeColors.yellow);
          codeText(
            ctx,
            api,
            'program_id: i32 → i64 → multiply by 256',
            180,
            635,
            30,
            themeColors.cyan,
          );
        }
        focusTarget(ctx, api, 'lowering-mask', () => {
          if (visible(ctx, api, 'triton-mask')) {
            codeText(ctx, api, 'offset < n', 180, 770, 34, themeColors.green);
            ['load x', 'load y', 'store out'].forEach((v, i) => {
              arrow(ctx, api, 620, 760, 900 + i * 270, 760, themeColors.green);
              detailText(ctx, api, v, 900 + i * 270, 850, 29, themeColors.green, 'center');
            });
          }
        });
      });
    else if (currentBeat === 1) {
      const offsetsPerThread = 2;
      const threadsPerWarp = 32;
      const warps = 4;
      const threads = warps * threadsPerWarp;
      const rowY = (offset) => 430 + 114 * offset;
      const layout = visible(ctx, api, 'two-per-thread');
      focusTarget(ctx, api, 'thread-layout', () => {
        detailText(ctx, api, 'Block 0   /   warp 0', 155, 270, 41, themeColors.ink);
        detailText(ctx, api, 'Element offset', 678, 346, 30, themeColors.muted, 'center');
        for (let thread = 0; thread < 2; thread++) {
          const first = thread * offsetsPerThread;
          const color = thread ? themeColors.muted : themeColors.cyan;
          detailText(ctx, api, 'Thread ' + thread, 155, rowY(first) + 72, 46, color);
          if (!layout) continue;
          const last = first + offsetsPerThread - 1;
          line(ctx, api, 448, rowY(first), 448, rowY(last), color, 4);
          for (let offset = first; offset <= last; offset++) {
            const y = rowY(offset);
            line(ctx, api, 448, y, 552, y, color, 4);
            api.rect(ctx, 566, y - 39, 225, 78, themeColors.panel, color, 7);
            detailText(ctx, api, offset, 678, y + 15, 42, color, 'center');
          }
        }
        if (layout)
          detailText(
            ctx,
            api,
            warps +
              ' warps × ' +
              threadsPerWarp +
              ' threads = ' +
              threads +
              ' threads   ·   ' +
              offsetsPerThread +
              ' values each = ' +
              threads * offsetsPerThread +
              ' values',
            155,
            936,
            34,
            themeColors.ink,
          );
      });
      focusTarget(ctx, api, 'thread-loads', () => {
        if (!layout) return;
        detailText(ctx, api, 'Thread 0 reads x', 1040, 346, 35, themeColors.ink);
        ['triton-loads', 'next-float'].forEach((cue, index) => {
          const fraction = api.focus.progress(cue);
          if (fraction <= 0) return;
          const y = rowY(index);
          arrow(ctx, api, 810, y, 820 + fraction * 187, y, themeColors.green);
          codeText(ctx, api, 'ld.global.b32', 1040, y + 13, 36, themeColors.green);
          detailText(
            ctx,
            api,
            '+' + index * Float32Array.BYTES_PER_ELEMENT + ' bytes',
            1470,
            y + 13,
            34,
            themeColors.ink,
          );
        });
        if (api.focus.cue('next-float')?.phase === 'after')
          detailText(
            ctx,
            api,
            'Each load uses the guard for its offset.',
            1040,
            680,
            30,
            themeColors.green,
          );
      });
    } else {
      focusTarget(ctx, api, 'triton-report', () => {
        detailText(
          ctx,
          api,
          'Same arithmetic fixtures · different ownership/layout',
          150,
          300,
          32,
          themeColors.yellow,
        );
        const reports = [
          ['CUDA native build', 12, '0', '0'],
          ['Triton specialization', 14, '0', '0'],
        ];
        reports.forEach(([name, regs, spills, shared], i) => {
          const y = 400 + i * 200;
          box(ctx, api, 170, y, 1450, 150, i ? themeColors.green : themeColors.cyan);
          detailText(ctx, api, name, 200, y + 50, 32, i ? themeColors.green : themeColors.cyan);
          if (visible(ctx, api, 'triton-report'))
            detailText(
              ctx,
              api,
              `${regs} registers · ${spills} spills · ${shared} shared bytes`,
              750,
              y + 50,
              31,
            );
        });
        detailText(
          ctx,
          api,
          'Time both warmed kernels on the same GPU.',
          960,
          880,
          32,
          themeColors.yellow,
          'center',
        );
      });
      focusTarget(ctx, api, 'lowering-stages', () => {
        if (visible(ctx, api, 'toolkit-assembler'))
          codeText(
            ctx,
            api,
            'NVIDIA backend → toolkit ptxas subprocess → cubin',
            270,
            970,
            31,
            themeColors.cyan,
          );
      });
    }
    if (currentBeat === 0) footer(ctx, api, 'Triton 3.9  ·  captured NVIDIA vector-add build');
  }
}
export default {
  id: 'triton-lowering',
  draw: drawTritonLowering,
  cues: [
    'triton-stages',
    'triton-mask',
    'two-per-thread',
    'triton-loads',
    'next-float',
    'triton-report',
    'toolkit-assembler',
  ],
};
