import { cueDone, cueProgress, sampleModel } from '../construction.mjs';
import { bits, dot, labelText, line, rectangle } from '../defaults.mjs';
export function drawSubnormalGrid(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('subnormal-grid', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-subnormal-grid-' + name),
    progress = (name) => cueProgress(state, 'lp-subnormal-grid-' + name);
  api.focus.target('lp-subnormal-grid-trace', () => {
    if (currentBeat === 0) {
      bits(ctx, api, 0x01, 230, 330, 650);
      bits(ctx, api, 0x08, 1040, 330, 650);
      labelText(ctx, api, '0.001₂ × 2^(1 − 7)', 555, 535, 32, themeColors.cyan, 'center');
      labelText(ctx, api, '1.000₂ × 2^(1 − 7)', 1365, 535, 32, themeColors.blue, 'center');
      labelText(ctx, api, 'd = 2^−9', 555, 620, 42, themeColors.cyan, 'center');
      labelText(ctx, api, 'smallest normal = 2^−6', 1365, 620, 34, themeColors.blue, 'center');
      const y = 795;
      line(ctx, api, 240, y, 1680, y);
      for (let i = 0; i <= 8; i++) {
        line(
          ctx,
          api,
          240 + i * 180,
          y - 18,
          240 + i * 180,
          y + 18,
          i === 8 ? themeColors.blue : themeColors.cyan,
          3,
        );
        labelText(ctx, api, i + 'd', 240 + i * 180, y + 65, 24, themeColors.muted, 'center');
      }
      labelText(
        ctx,
        api,
        ready('floor')
          ? 'E5M2 subnormal floor: 2^−16'
          : 'Leading zero extends the grid toward zero',
        960,
        990,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const x = (v) => 300 + v * 1100;
      for (const [v, target, name, anchor, i] of [
        [0.75, 1, '0.75d', 'up', 0],
        [0.5, 0, '+0.5d', 'zero', 1],
        [-0.5, 0, '−0.5d', 'zero', 2],
      ]) {
        const y = 370 + i * 185;
        line(ctx, api, 260, y, 1650, y);
        for (const k of [0, 1]) {
          line(ctx, api, x(k), y - 18, x(k), y + 18, themeColors.blue, 4);
          labelText(
            ctx,
            api,
            k === 0 ? 'signed zero' : 'd',
            x(k),
            y + 60,
            28,
            themeColors.muted,
            'center',
          );
        }
        const initial = v < 0 ? 0.5 : v,
          xx = x(initial + (target - initial) * progress(anchor));
        dot(ctx, api, xx, y - 55, themeColors.yellow, 13);
        labelText(ctx, api, name + ' input', 1700, y - 45, 27, themeColors.yellow, 'right');
        labelText(
          ctx,
          api,
          ready(anchor) ? (v < 0 ? '−0' : target === 1 ? 'd' : '+0') : 'result ?',
          1700,
          y + 65,
          32,
          themeColors.green,
          'right',
        );
      }
      labelText(
        ctx,
        api,
        'OCP signed-zero contract · negative half-step shares magnitude decision',
        960,
        1020,
        25,
        themeColors.muted,
        'center',
      );
    } else {
      labelText(ctx, api, 'Instruction and mode own flush-to-zero behavior', 150, 310, 34);
      [
        ['CPU fixture', 'half d → signed zero', '0.75d → d', themeColors.blue],
        [
          'MI200 documented matrix paths',
          'FP16/BF16 denormal flushing',
          'separate FP16 backward alternatives',
          themeColors.pink,
        ],
      ].forEach(([name, a, z, color], i) => {
        const y = 420 + i * 260;
        rectangle(ctx, api, 200, y, 1510, 190, color);
        labelText(ctx, api, name, 240, y + 55, 33, color);
        labelText(ctx, api, a, 240, y + 115, 29);
        labelText(ctx, api, z, 240, y + 160, 27, themeColors.muted);
      });
      labelText(
        ctx,
        api,
        'Run the small input through the selected matrix instruction',
        960,
        1010,
        28,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'subnormal-grid',
  draw: drawSubnormalGrid,
  cues: [
    'lp-subnormal-grid-build-0',
    'lp-subnormal-grid-floor',
    'lp-subnormal-grid-build-1',
    'lp-subnormal-grid-up',
    'lp-subnormal-grid-zero',
    'lp-subnormal-grid-build-2',
  ],
};
