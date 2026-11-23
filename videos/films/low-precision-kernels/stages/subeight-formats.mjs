import { cueDone, sampleModel } from '../construction.mjs';
import { labelText, line, rectangle, vector } from '../defaults.mjs';
export function drawSubeightFormats(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('subeight-formats', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-subeight-formats-' + name);
  api.focus.target('lp-subeight-formats-trace', () => {
    if (currentBeat === 0) {
      [
        ['MXFP6 E3M2', 3, 2, 28],
        ['MXFP6 E2M3', 2, 3, 7.5],
        ['MXFP4 E2M1', 2, 1, 6],
      ].forEach(([name, e, f, max], i) => {
        const y = 360 + i * 210;
        labelText(ctx, api, name, 150, y + 40, 31, themeColors.blue);
        vector(ctx, api, ['s', ...Array(e).fill('e'), ...Array(f).fill('f')], 630, y, 650, 70);
        labelText(ctx, api, 'max ' + max, 1520, y + 45, 34, themeColors.yellow, 'center');
      });
      labelText(
        ctx,
        api,
        'Each MX group: 32 elements + E8M0 scale',
        960,
        1030,
        30,
        themeColors.cyan,
        'center',
      );
    } else {
      for (const [name, group, i, color] of [
        ['MXFP4', 32, 0, themeColors.blue],
        ['NVFP4', 16, 1, themeColors.pink],
      ]) {
        const y = 365 + i * 300;
        labelText(ctx, api, name, 150, y - 35, 34, color);
        for (let j = 0; j < 32; j++)
          api.rect(ctx, 320 + j * 40, y, 37, 80, themeColors.panel, color, 0);
        for (let g = 0; g < 32 / group; g++) {
          line(
            ctx,
            api,
            320 + g * group * 40,
            y + 110,
            320 + (g + 1) * group * 40 - 4,
            y + 110,
            themeColors.yellow,
            4,
          );
          rectangle(
            ctx,
            api,
            320 + g * group * 40 + 40,
            y + 135,
            group * 40 - 80,
            55,
            themeColors.yellow,
          );
          labelText(
            ctx,
            api,
            name === 'MXFP4' ? 'one E8M0 scale' : 'one E4M3 scale',
            320 + (g + 0.5) * group * 40,
            y + 173,
            25,
            themeColors.yellow,
            'center',
          );
        }
        if (name === 'NVFP4')
          labelText(ctx, api, '+ FP32 tensor scale', 620, y + 245, 26, themeColors.cyan, 'center');
        if (currentBeat === 2)
          labelText(
            ctx,
            api,
            (name === 'MXFP4' ? ready('mx') : ready('nv'))
              ? name === 'MXFP4'
                ? '16 + 1 = 17 B'
                : '16 + 2 + 4 = 22 B'
              : 'payload pending',
            1320,
            y + 245,
            29,
            themeColors.green,
            'center',
          );
      }
      labelText(
        ctx,
        api,
        '32-value one-dimensional activation · no padding · two values per byte',
        960,
        1040,
        26,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'subeight-formats',
  draw: drawSubeightFormats,
  cues: [
    'lp-subeight-formats-build-0',
    'lp-subeight-formats-build-1',
    'lp-subeight-formats-build-2',
    'lp-subeight-formats-mx',
    'lp-subeight-formats-nv',
  ],
};
