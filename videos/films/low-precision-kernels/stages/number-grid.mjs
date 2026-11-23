import { encode8, grids, hexByte, phase } from '../encoding.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { equation, originalText } from '../defaults.mjs';
export function drawNumberGrid(ctx, scene, state, api) {
  {
    const { C, components: c, teaching: t } = api,
      s = sampleOriginalModel('number-grid', state),
      b = s.step;
    const hex = (code) => `0x${code.toString(16).padStart(2, '0')}`;
    {
      const end = s.expanded ? 3 : 2,
        x = (value) => 200 + ((value - 1) / (end - 1)) * 1500;
      originalText(
        ctx,
        api,
        s.expanded
          ? 'OCP E4M3 · cross the exponent boundary at 2'
          : 'OCP E4M3 · spacing in [1, 2] is 0.125',
        140,
        260,
        33,
      );
      api.focus.target('number-grid-representable-values', () => {
        api.line(ctx, x(1), 510, x(end), 510, C.muted, 3);
        grids.ocp
          .filter((item) => item.value >= 1 && item.value <= end)
          .forEach(({ value }) => {
            api.line(ctx, x(value), 495, x(value), 525, value < 2 ? C.blue : C.pink, 3);
            originalText(ctx, api, value.toFixed(3), x(value), 575, 24, C.muted, 'center');
          });
        if (s.expanded) {
          equation(ctx, api, '1\\le x<2:\\quad\\Delta=2^0/8=0.125', 570, 935, 32, C.blue);
          equation(ctx, api, '2\\le x<4:\\quad\\Delta=2^1/8=0.25', 1400, 935, 32, C.pink);
        }
      });
      api.focus.target('number-grid-current-rounding', () => {
        api.circle(ctx, x(s.x), 385, 13, C.yellow);
        api.arrow(ctx, x(s.x), 415, x(s.value), 465, C.yellow, 4);
        originalText(
          ctx,
          api,
          'Input ' + s.x.toFixed(4) + ' → ' + s.value.toFixed(3) + ' · code ' + hex(s.code),
          960,
          675,
          33,
          C.yellow,
          'center',
        );
      });
      api.focus.target('number-grid-s-code-tostring-2-padstart-8-0-split', () =>
        t.grid({
          x: 560,
          y: 780,
          width: 800,
          height: 85,
          rows: 1,
          columns: 8,
          labels: [s.code.toString(2).padStart(8, '0').split('')],
          fontSize: 34,
          textColor: C.ink,
          fill: C.panel,
          stroke: C.blue,
        }),
      );
      originalText(
        ctx,
        api,
        'sign · four exponent bits · three fraction bits',
        960,
        1030,
        27,
        C.muted,
        'center',
      );
    }
  }
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = phase(state.beatP),
    T = (v, x, y, size = 25, color = themeColors.muted, align = 'left') =>
      api.text(ctx, v, x, y, size, color, align);
  if (currentBeat > 0) {
    const pair = currentBeat === 1 ? [1, 1.125] : [1.125, 1.25];
    if (!sampleOriginalModel('number-grid', state).expanded)
      pair.forEach((v, i) => {
        const code = encode8(v).code;
        T(
          v + ' · ' + hexByte(code) + ' · ' + (code % 2 ? 'odd' : 'even') + ' low bit',
          450 + i * 1000,
          625,
          26,
          code % 2 ? themeColors.muted : themeColors.yellow,
          'center',
        );
      });
  }
  return;
}
export default {
  id: 'number-grid',
  draw: drawNumberGrid,
  cues: [
    'number-grid-beat-1-focus-1',
    'number-grid-beat-2-focus-1',
    'number-grid-next-midpoint',
    'number-grid-exponent-spacing',
  ],
};
