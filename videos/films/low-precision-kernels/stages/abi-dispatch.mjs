import { sampleModel } from '../construction.mjs';
import { bits, labelText, rectangle } from '../defaults.mjs';
export function drawAbiDispatch(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('abi-dispatch', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  api.focus.target('lp-abi-dispatch-trace', () => {
    if (currentBeat === 0) {
      labelText(
        ctx,
        api,
        'One actual teaching operand: 2 × 32',
        960,
        305,
        33,
        themeColors.blue,
        'center',
      );
      teaching.grid({
        x: 250,
        y: 365,
        width: 1350,
        height: 170,
        rows: 2,
        columns: 32,
        fill: themeColors.panel,
        stroke: themeColors.blue,
      });
      labelText(
        ctx,
        api,
        'TE nonfinal dimension: 2 is not a multiple of 32',
        960,
        610,
        34,
        themeColors.pink,
        'center',
      );
      bits(ctx, api, 0x38, 260, 720, 650);
      labelText(
        ctx,
        api,
        'OCP decode 1 ≠ FNUZ decode 0.5',
        1340,
        780,
        32,
        themeColors.pink,
        'center',
      );
      labelText(
        ctx,
        api,
        'Encoding / scale axes / orientation / padding / architecture / arithmetic',
        960,
        1010,
        26,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const rows = [
        ['TE MXFP8/NVFP4 training', 'SM 10.0 / SM 10.3', themeColors.blue],
        ['TE NVFP4 inference', 'SM 10.0 and later', themeColors.cyan],
        ['ROCm CDNA3', 'FNUZ', themeColors.pink],
        ['ROCm CDNA4 / supported RDNA4', 'OCP paths', themeColors.green],
      ];
      rows.forEach(([name, what, color], i) => {
        const y = 365 + i * 155;
        rectangle(ctx, api, 180, y, 1550, 110, color);
        labelText(ctx, api, name, 220, y + 65, 29, themeColors.muted);
        labelText(ctx, api, what, 1660, y + 65, 31, color, 'right');
      });
      labelText(
        ctx,
        api,
        'Article hardware table · October 10, 2026',
        960,
        1030,
        25,
        themeColors.yellow,
        'center',
      );
    } else {
      labelText(
        ctx,
        api,
        'FP32 operands keep 32-bit storage',
        960,
        325,
        34,
        themeColors.blue,
        'center',
      );
      for (const [name, i] of [
        ['Matmul FP32 precision', 0],
        ['Convolution FP32 precision', 1],
      ]) {
        const y = 465 + i * 230;
        rectangle(ctx, api, 200, y, 1530, 160, themeColors.blue);
        labelText(ctx, api, name, 250, y + 55, 30, themeColors.muted);
        labelText(ctx, api, 'ieee', 1160, y + 62, 30, themeColors.blue);
        labelText(ctx, api, 'tf32', 1510, y + 62, 30, themeColors.cyan);
        labelText(ctx, api, '23 read fraction bits', 1130, y + 122, 25, themeColors.blue, 'center');
        labelText(ctx, api, '10 read fraction bits', 1510, y + 122, 25, themeColors.cyan, 'center');
      }
      labelText(
        ctx,
        api,
        'Launch symbol and reduction mode require the actual device',
        960,
        1030,
        28,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'abi-dispatch',
  draw: drawAbiDispatch,
  cues: ['lp-abi-dispatch-build-0', 'lp-abi-dispatch-build-1', 'lp-abi-dispatch-build-2'],
};
