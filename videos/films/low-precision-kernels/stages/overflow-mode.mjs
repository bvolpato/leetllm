import { cueProgress, sampleModel } from '../construction.mjs';
import { bar, dot, labelText, line, rectangle } from '../defaults.mjs';
import { roundedOverflow } from '../encoding.mjs';
import { settled } from '../timing.mjs';
export function drawOverflowMode(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('overflow-mode', state),
    currentBeat = modelState.step,
    progress2 = modelState.q;
  const progress = (name) => cueProgress(state, 'lp-overflow-mode-' + name);
  api.focus.target('lp-overflow-mode-trace', () => {
    if (currentBeat === 0) {
      const x = (v) => 250 + ((v - 416) / 64) * 1370;
      for (const [input, res, name, i] of [
        [449, modelState.a, '449', 0],
        [465, modelState.b, '465', 1],
      ]) {
        const y = 420 + i * 300;
        line(ctx, api, x(416), y, x(480), y);
        for (const v of [416, 448, 480]) {
          line(
            ctx,
            api,
            x(v),
            y - 18,
            x(v),
            y + 18,
            v > 448 ? themeColors.pink : themeColors.blue,
            3,
          );
          labelText(
            ctx,
            api,
            v + (v === 480 ? ' precision result' : ''),
            x(v),
            y + 65,
            25,
            v > 448 ? themeColors.pink : themeColors.muted,
            'center',
          );
        }
        const k = progress(name),
          xx = x(input + (res.rounded - input) * k);
        dot(ctx, api, xx, y - 70, themeColors.yellow, 12);
        labelText(ctx, api, input + ' input', 200, y - 100, 31, themeColors.yellow);
        labelText(
          ctx,
          api,
          (i ? modelState.show465 : modelState.show449)
            ? res.overflow
              ? 'rounded 480 > finite 448'
              : 'rounded 448 · no overflow'
            : 'precision rounding pending',
          960,
          y + 145,
          31,
          res.overflow ? themeColors.pink : themeColors.green,
          'center',
        );
      }
      labelText(
        ctx,
        api,
        '480 has destination precision, but no finite E4M3 code',
        960,
        1040,
        25,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      labelText(
        ctx,
        api,
        'E4M3: 465 rounds beyond 448',
        960,
        350,
        43,
        themeColors.yellow,
        'center',
      );
      const y = 600;
      line(ctx, api, 960, 405, 960, 475);
      line(ctx, api, 490, 475, 1430, 475);
      line(ctx, api, 490, 475, 490, y - 65);
      line(ctx, api, 1430, 475, 1430, y - 65);
      rectangle(ctx, api, 200, y - 40, 580, 180, themeColors.green);
      rectangle(ctx, api, 1110, y - 40, 610, 180, themeColors.pink);
      labelText(ctx, api, 'Saturating', 490, y + 20, 34, themeColors.green, 'center');
      labelText(
        ctx,
        api,
        modelState.showModes ? String(modelState.b.result) : 'result ?',
        490,
        y + 98,
        43,
        themeColors.green,
        'center',
      );
      labelText(ctx, api, 'Non-saturating', 1415, y + 20, 34, themeColors.pink, 'center');
      labelText(
        ctx,
        api,
        modelState.showModes ? 'NaN  (0x7F or 0xFF)' : 'result ?',
        1415,
        y + 98,
        33,
        themeColors.pink,
        'center',
      );
      if (settled(state, 'lp-overflow-mode-e5', 1)) {
        const large = roundedOverflow(65536, { format: 'e5m2', saturate: false });
        labelText(
          ctx,
          api,
          'Separate E5M2 case · finite ceiling 57,344',
          960,
          875,
          33,
          themeColors.blue,
          'center',
        );
        labelText(
          ctx,
          api,
          large.input.toLocaleString('en-US') + ' in non-saturating mode → ' + large.result,
          960,
          975,
          37,
          themeColors.ink,
          'center',
        );
      }
    } else {
      labelText(
        ctx,
        api,
        'Actual PyTorch 2.15 CPU · finite input 500',
        960,
        340,
        35,
        themeColors.blue,
        'center',
      );
      for (const [name, i] of [
        ['plain cast', 0],
        ['explicit finite clamp + cast', 1],
      ]) {
        const y = 495 + i * 240;
        labelText(ctx, api, name, 200, y, 31, themeColors.muted);
        bar(ctx, api, 650, y - 48, 960, 72, modelState.showCPU ? 448 / 500 : 0, themeColors.cyan);
        labelText(
          ctx,
          api,
          modelState.showCPU ? '448' : '?',
          1720,
          y + 7,
          40,
          themeColors.yellow,
          'right',
        );
      }
      labelText(
        ctx,
        api,
        'Recorded CPU result · other devices and modes require their own test',
        960,
        1010,
        27,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'overflow-mode',
  draw: drawOverflowMode,
  cues: [
    'lp-overflow-mode-build-0',
    'lp-overflow-mode-449',
    'lp-overflow-mode-465',
    'lp-overflow-mode-build-1',
    'lp-overflow-mode-modes',
    'lp-overflow-mode-e5',
    'lp-overflow-mode-build-2',
    'lp-overflow-mode-cpu',
  ],
};
