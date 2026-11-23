import { bf16, fp16 } from '../arithmetic.mjs';
import { completed, operation } from '../construction.mjs';
import { equation, text, valueBox, movingValue } from '../defaults.mjs';
function drawAutocastRouting(ctx, scene, state, api) {
  if ((state.beat ?? 0) < 3) return false;
  const { C } = api;
  api.focus.target('formats-extension-4', () => {
    text(ctx, api, 'Follow operation-specific dtype routing', 960, 280, 39, C.cyan, 'center');
    const rows = [
      ['Matrix multiply', 'low-precision operands', 'autocast-matmul', C.blue],
      ['Cross entropy', 'FP32-sensitive loss', 'autocast-loss', C.yellow],
      ['Backward', 'follows forward dtypes', 'autocast-backward', C.pink],
    ];
    rows.forEach(([name, dtype, id, color], i) => {
      const x = 200 + i * 570;
      valueBox(ctx, api, name, x, 400, 430, color, 31);
      valueBox(
        ctx,
        api,
        completed(state, id) ? dtype : 'Operation pending',
        x,
        530,
        430,
        completed(state, id) ? color : C.muted,
        26,
      );
      if (i < 2) {
        api.arrow(ctx, x + 450, 445, x + 545, 445, C.muted, 3);
        movingValue(ctx, api, [x + 450, 445], [x + 545, 445], operation(state, id), color);
      }
    });
    const buffer = operation(state, 'autocast-buffer');
    valueBox(ctx, api, 'FP32 parameter storage', 310, 780, 570, C.green, 31);
    api.arrow(ctx, 910, 825, 1010, 825, C.green, 3);
    movingValue(ctx, api, [910, 825], [1010, 825], buffer, C.green);
    valueBox(
      ctx,
      api,
      completed(state, 'autocast-buffer')
        ? 'FP32 gradient buffer'
        : 'Gradient accumulation pending',
      1040,
      780,
      570,
      completed(state, 'autocast-buffer') ? C.green : C.muted,
      29,
    );
    text(
      ctx,
      api,
      'Explicit dtype and in-place operations have their own eligibility rules',
      960,
      970,
      28,
      C.muted,
      'center',
    );
    text(ctx, api, 'Keep backward outside the autocast region', 960, 1030, 30, C.yellow, 'center');
  });
  return true;
}
export function drawFormats(ctx, scene, state, api) {
  if (drawAutocastRouting(ctx, scene, state, api)) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.9);
  {
    [
      {
        name: 'FP16',
        e: 5,
        f: 10,
        emin: -14,
        emax: 15,
        x: 240,
        color: themeColors.blue,
      },
      {
        name: 'BF16',
        e: 8,
        f: 7,
        emin: -126,
        emax: 127,
        x: 1040,
        color: themeColors.cyan,
      },
    ].forEach((format) => {
      const { x, color } = format;
      text(ctx, api, format.name, x + 290, 365, 39, color, 'center');
      let bx = x + 20;
      [1, format.e, format.f].forEach((count, i) => {
        api.focus.target('format-bits', () =>
          api.rect(
            ctx,
            bx,
            415,
            count * 33 * phaseForBeat(0),
            55,
            [themeColors.pink, themeColors.yellow, color][i],
          ),
        );
        text(
          ctx,
          api,
          ['sign (1)', 'exp (' + format.e + ')', 'fraction (' + format.f + ')'][i],
          bx + count * 16.5,
          515,
          27,
          themeColors.ink,
          'center',
        );
        bx += count * 33 + 26;
      });
      text(ctx, api, 'Normal min / finite max', x + 290, 585, 29, themeColors.muted, 'center');
      api.focus.target('format-range', () =>
        equation(
          ctx,
          api,
          format.name === 'FP16'
            ? String.raw`2^{-14}\quad/\quad65504`
            : String.raw`2^{-126}\quad/\quad(2-2^{-7})2^{127}`,
          x + 290,
          650,
          39,
          color,
          'center',
        ),
      );
      text(
        ctx,
        api,
        'Same visible range: 0.975 to 1.025',
        x + 305,
        735,
        28,
        themeColors.muted,
        'center',
      );
      const gap = 2 ** -format.f,
        center = x + 305,
        scale = 530 / 0.05;
      api.line(ctx, x + 40, 815, x + 570, 815, themeColors.muted, 2);
      for (let i = -Math.floor(0.025 / (gap / 2)); i <= Math.floor(0.025 / gap); i++) {
        const v = 1 + i * (i < 0 ? gap / 2 : gap),
          px = center + (v - 1) * scale;
        api.focus.target('format-grid', () => api.line(ctx, px, 800, px, 830, color, 2));
      }
      if (currentBeat >= 1) {
        const intended = 1 - 0.02 + 0.04 * phaseForBeat(1),
          rounded = format.name === 'FP16' ? fp16(intended) : bf16(intended),
          px = center + (intended - 1) * scale,
          rx = center + (rounded - 1) * scale;
        api.circle(ctx, px, 770, 7, themeColors.yellow);
        api.arrow(ctx, px, 784, rx, 799, themeColors.yellow, 2);
      }
      equation(ctx, api, '1', center, 875, 37, themeColors.ink, 'center');
      equation(ctx, api, '\\Delta_{+}=2^{-' + format.f + '}', x + 290, 945, 40, color, 'center');
    });
  }
}
export default {
  id: 'formats',
  draw: drawFormats,
  cues: [
    'formats-b1-1',
    'formats-b2-1',
    'formats-b2-2',
    'formats-b3-1',
    'formats-extension-4',
    'autocast-matmul',
    'autocast-loss',
    'autocast-backward',
    'autocast-buffer',
  ],
};
