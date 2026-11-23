import { phase } from '../encoding.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { card, connectShapes, equation, originalText } from '../defaults.mjs';
export function drawTraffic(ctx, scene, state, api) {
  {
    const { C, components: c, teaching: t } = api,
      s = sampleOriginalModel('traffic', state),
      b = s.step;
    {
      originalText(
        ctx,
        api,
        'X-only payload · 64 values · excludes padding, weights and output',
        140,
        260,
        30,
      );
      const packed = api.focus.target('traffic-element-b-scale-b-b', () =>
        card(
          ctx,
          api,
          `${s.elementBytes} element B + ${s.scaleBytes} scale B = ${s.packed} B`,
          150,
          380,
          520,
          C.blue,
          105,
          29,
        ),
      );
      if (b === 0) {
        api.focus.target('traffic-s-elementbytes-s-scalebytes-fp8-elements-e8m0-scales', () =>
          t.bars({
            x: 860,
            y: 400,
            width: 770,
            height: 310,
            values: [s.elementBytes, s.scaleBytes],
            labels: ['FP8 elements', 'E8M0 scales'],
            max: 70,
            colors: [C.blue, C.yellow],
            showValues: true,
            fontSize: 29,
          }),
        );
        api.focus.target('traffic-math-32-imes8-8-32-8-25-mathrm-bits-value', () =>
          equation(ctx, api, String.raw`(32\times8+8)/32=8.25\ \mathrm{bits/value}`, 960, 900, 44),
        );
      } else if (b === 1) {
        const wide = api.focus.target('traffic-fp32-intermediate', () =>
          card(ctx, api, 'FP32 intermediate', 790, 380, 400, C.pink, 105),
        );
        const gemm = api.focus.target('traffic-gemm-reads-it', () =>
          card(ctx, api, 'GEMM reads it', 1370, 380, 400, C.cyan, 105),
        );
        connectShapes(ctx, api, packed, wide, C.pink);
        connectShapes(ctx, api, wide, gemm, C.cyan);
        for (const [i, label, value, color] of [
          [0, 'FP32 write', s.written, C.pink],
          [1, 'FP32 read', s.reread, C.cyan],
        ]) {
          originalText(ctx, api, label, 150, 675 + i * 155, 29, color);
          api.rect(ctx, 430, 620 + i * 155, 1250, 72, C.panel, C.muted, 0);
          if (value > 0)
            api.rect(
              ctx,
              430,
              620 + i * 155,
              (1250 * value) / s.wideBytes,
              72,
              color,
              undefined,
              0,
            );
          originalText(ctx, api, `${value} B`, 1740, 730 + i * 155, 28, color, 'right');
        }
        originalText(
          ctx,
          api,
          `Intermediate traffic so far: ${s.written + s.reread} B`,
          960,
          950,
          32,
          C.yellow,
          'center',
        );
      } else {
        const gemm = api.focus.target('traffic-gemm-consumes-codes-scales', () =>
          card(ctx, api, 'GEMM consumes codes + scales', 1190, 380, 580, C.green, 105),
        );
        connectShapes(ctx, api, packed, gemm, C.green);
        originalText(ctx, api, 'Wide intermediate written: 0 B', 960, 675, 36, C.green, 'center');
        originalText(ctx, api, 'Wide intermediate reread: 0 B', 960, 790, 36, C.green, 'center');
        originalText(
          ctx,
          api,
          `Avoided intermediate traffic: ${2 * s.wideBytes} B in this fixture`,
          960,
          950,
          31,
          C.yellow,
          'center',
        );
      }
    }
  }
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = phase(state.beatP),
    T = (v, x, y, size = 25, color = themeColors.muted, align = 'left') =>
      api.text(ctx, v, x, y, size, color, align);
  if (currentBeat === 1) {
    const transferred =
      sampleOriginalModel('traffic', state).written + sampleOriginalModel('traffic', state).reread;
    for (let i = 0; i < 4; i++) {
      const q = (transferred / 64 + i / 4) % 1;
      if (q >= 0) {
        const x = 670 + 700 * q;
        api.rect(
          ctx,
          x - 9,
          535,
          18,
          18,
          i % 2 ? themeColors.cyan : themeColors.yellow,
          undefined,
          2,
        );
        T('x' + i * 16, x, 585, 18, themeColors.muted, 'center');
      }
    }
  }
  return;
}
export default {
  id: 'traffic',
  draw: drawTraffic,
  cues: [
    'traffic-beat-1-focus-1',
    'traffic-beat-2-focus-1',
    'traffic-beat-2-focus-2',
    'traffic-beat-3-focus-1',
    'traffic-beat-3-focus-2',
  ],
};
