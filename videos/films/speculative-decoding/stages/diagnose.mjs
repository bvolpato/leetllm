import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawDiagnose(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const vec = (s, v, x, y, color) => {
    drawConstructionsText(ctx, api, s, x, y, 29, color);
    drawConstructionsText(
      ctx,
      api,
      '[' + v.map((n) => (typeof n === 'number' ? n.toFixed(3) : n)).join(', ') + ']',
      x,
      y + 46,
      31,
      color,
    );
  };
  api.focus.target('sd-diagnose-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      'Isolate the earliest divergence using matched probability and state inputs',
      245,
    );
    if (currentBeat === 0) {
      const cases = [
        ['p = q', [0.2, 0.3, 0.5], [0.2, 0.3, 0.5]],
        ['disjoint', [0, 1, 0], [1, 0, 0]],
        ['first rejection', [0.4, 0.5, 0.1], [0.6, 0.3, 0.1]],
      ];
      cases.forEach(([name, pv, qv], i) => {
        const y = 365 + i * 205;
        drawConstructionsBox(ctx, api, name, 160, y, 430, themeColors.blue);
        vec('p', pv, 710, y + 5, themeColors.blue);
        vec('q', qv, 1240, y + 5, themeColors.cyan);
      });
      drawConstructionsCenter(
        ctx,
        api,
        'Test every rejection position, joint paths, EOS and caps',
        1010,
        themeColors.yellow,
      );
    } else {
      drawConstructionsCenter(
        ctx,
        api,
        'Separate supplied row-shift probe · target prefix is [noon]',
        335,
        themeColors.blue,
        31,
      );
      drawConstructionsBox(ctx, api, 'row 0: empty prefix', 160, 430, 630, themeColors.muted);
      vec('p0', [0.4, 0.5, 0.1], 1060, 445, themeColors.muted);
      drawConstructionsBox(ctx, api, 'row 1: after noon', 160, 655, 630, themeColors.blue);
      vec('p1', [0.1, 0.6, 0.3], 1060, 670, themeColors.blue);
      api.arrow(ctx, 845, 690, 1010, 690, themeColors.green, 4);
      drawConstructionsText(
        ctx,
        api,
        'Serial selects p1',
        490,
        850,
        31,
        themeColors.green,
        'center',
      );
      drawConstructionsText(
        ctx,
        api,
        'Wrong shifted verification selects p0',
        1390,
        850,
        29,
        themeColors.pink,
        'center',
      );
      drawConstructionsCenter(
        ctx,
        api,
        'This controlled mismatch changes the row; real model-only drift needs its own isolation',
        1010,
        themeColors.yellow,
        27,
      );
    }
  });
  return;
}
export default {
  id: 'diagnose',
  draw: drawDiagnose,
  cues: ['sd-diagnose-b0', 'sd-diagnose-b1'],
};
