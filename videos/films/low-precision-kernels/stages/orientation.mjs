import { hexByte, roundTrip } from '../encoding.mjs';
import { cueDone, sampleModel } from '../construction.mjs';
import { labelText, line } from '../defaults.mjs';
export function drawOrientation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('orientation', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const ready = (name) => cueDone(state, 'lp-orientation-' + name);
  api.focus.target('lp-orientation-trace', () => {
    labelText(
      ctx,
      api,
      'One fixed logical 32 × 32 matrix',
      460,
      295,
      31,
      themeColors.blue,
      'center',
    );
    labelText(
      ctx,
      api,
      currentBeat === 0 ? 'Changed group ownership' : 'Fresh columnwise quantization',
      1390,
      295,
      31,
      themeColors.cyan,
      'center',
    );
    const size = 17,
      xs = [190, 1150],
      y = 355;
    for (let panel = 0; panel < 2; panel++) {
      const x = xs[panel];
      api.rect(ctx, x, y, 544, 544, themeColors.panel, themeColors.muted, 0);
      const scanned = panel ? Math.min(32, Math.floor(progress2 * 64)) : 32;
      api.rect(
        ctx,
        x + (panel ? size : 0),
        y,
        panel ? size : 544,
        panel ? scanned * size : size,
        themeColors.blue,
        undefined,
        0,
      );
      api.rect(ctx, x, y, size, size, themeColors.pink, undefined, 0);
      api.rect(ctx, x + size, y, size, size, themeColors.yellow, undefined, 0);
      for (let k = 0; k <= 32; k++) {
        line(ctx, api, x + k * size, y, x + k * size, y + 544, themeColors.muted, 1);
        line(ctx, api, x, y + k * size, x + 544, y + k * size, themeColors.muted, 1);
      }
    }
    labelText(ctx, api, 'x[0,0] = 700 · x[0,1] = 0.001', 460, 955, 26, themeColors.muted, 'center');
    labelText(ctx, api, 'row 0 S = 2 · tiny → 0', 460, 1025, 31, themeColors.pink, 'center');
    labelText(
      ctx,
      api,
      currentBeat === 1 && modelState.fresh
        ? 'column 1 S = 2^−8 · tiny → 0.00097656'
        : 'column 1 owns 0.001 and thirty-one ones',
      1430,
      955,
      25,
      themeColors.green,
      'center',
    );
    const scan = Math.min(32, Math.floor(progress2 * 64));
    labelText(
      ctx,
      api,
      'column 1 admitted: ' + scan + '/32',
      930,
      440,
      23,
      themeColors.cyan,
      'center',
    );
    if (scan > 0)
      labelText(
        ctx,
        api,
        'amax = ' + (scan === 1 ? '.001' : '1'),
        930,
        520,
        27,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 1 && progress2 > 0.5) {
      const row = Math.min(31, Math.floor((progress2 - 0.5) * 64)),
        raw = modelState.matrix[row][1],
        rt = roundTrip(raw, modelState.columnScales[1]);
      labelText(ctx, api, 'read row ' + row + ': ' + raw, 930, 610, 24, themeColors.blue, 'center');
      labelText(ctx, api, 'S = 2^−8', 930, 680, 27, themeColors.yellow, 'center');
      labelText(ctx, api, 'code ' + hexByte(rt.code), 930, 750, 26, themeColors.cyan, 'center');
      labelText(
        ctx,
        api,
        'decode ' + rt.reconstructed.toFixed(8),
        930,
        820,
        22,
        themeColors.green,
        'center',
      );
    } else
      labelText(ctx, api, 'Row code retains old scale', 930, 700, 21, themeColors.muted, 'center');
    if (currentBeat === 0 && ready('transpose'))
      labelText(
        ctx,
        api,
        'Old row codes are not fresh column codes',
        1430,
        1025,
        26,
        themeColors.pink,
        'center',
      );
  });
}
export default {
  id: 'orientation',
  draw: drawOrientation,
  cues: [
    'lp-orientation-build-0',
    'lp-orientation-transpose',
    'lp-orientation-build-1',
    'lp-orientation-fresh',
  ],
};
