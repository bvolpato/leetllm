import { scalarEncode } from '../arithmetic.mjs';
import { cell, geometryText, heading, line } from '../defaults.mjs';
export function drawScalarCodec(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Supplied zoom · bound 1.27 · scale 0.01 · x 0.376');
      const q = cueProgress(),
        from = 0.376,
        to = scalarEncode(from, 1.27) * 0.01,
        at = from + (to - from) * q,
        x = (v) => 300 + ((v - 0.34) / 0.08) * 1250;
      line(ctx, api, 300, 700, 1550, 700);
      for (let i = 0; i <= 8; i++) {
        const v = 0.34 + i * 0.01;
        line(ctx, api, x(v), 680, x(v), 720, themeColors.blue, 3);
        geometryText(ctx, api, v.toFixed(2), x(v), 790, 27, themeColors.muted, 'center');
      }
      api.circle(ctx, x(at), 580, 20, themeColors.yellow);
      geometryText(ctx, api, 'x = ' + at.toFixed(3), x(at), 510, 34, themeColors.yellow, 'center');
      line(ctx, api, x(at), 610, x(at), 670, themeColors.yellow, 3);
      geometryText(
        ctx,
        api,
        q > 0.8
          ? 'round(0.376 / 0.01) = 38 → reconstruct 0.38'
          : 'Divide, round and clip in the stated code range',
        960,
        960,
        38,
        themeColors.ink,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Signed −127..127 · 255 levels · −128 unused',
        960,
        1040,
        29,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1) {
      heading(ctx, api, 'Fitted calibration is frozen before later rows are encoded');
      const q = cueProgress(),
        codes = [38, -42, 0, 127];
      codes.forEach((v, i) => {
        const x = 260 + i * 400;
        cell(ctx, api, v, x, 430, 300, 100, themeColors.blue);
        if (q > (i + 1) / 5) {
          const bits = (v & 255).toString(2).padStart(8, '0');
          bits.split('').forEach((bit, j) => {
            api.rect(
              ctx,
              x + j * 37,
              650,
              32,
              50,
              bit === '1' ? themeColors.cyan : themeColors.panel,
              themeColors.muted,
              1,
            );
            geometryText(
              ctx,
              api,
              bit,
              x + j * 37 + 16,
              685,
              22,
              bit === '1' ? themeColors.bg : themeColors.muted,
              'center',
            );
          });
          geometryText(ctx, api, 'one signed byte', x + 150, 800, 27, themeColors.cyan, 'center');
        }
      });
      geometryText(
        ctx,
        api,
        'Stored dtype + range + scale + rounding + clipping + offset define the codec',
        960,
        1020,
        30,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      heading(ctx, api, 'Different codec · range-offset [2,3] · unsigned codes 0..255');
      const q = cueProgress(),
        x = 350 + q * 1200;
      line(ctx, api, 350, 650, 1550, 650, themeColors.blue, 4);
      line(ctx, api, 350, 630, 350, 670, themeColors.blue, 4);
      line(ctx, api, 1550, 630, 1550, 670, themeColors.blue, 4);
      geometryText(ctx, api, '2 ↔ code0', 350, 770, 34, themeColors.blue, 'center');
      geometryText(ctx, api, '3 ↔ code255', 1550, 770, 34, themeColors.blue, 'center');
      api.circle(ctx, x, 650, 17, themeColors.yellow);
      geometryText(
        ctx,
        api,
        'step = 1/255 · x̂ = 2 + code × step',
        960,
        430,
        40,
        themeColors.yellow,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Real offset 2 ≠ byte zero-point −510',
        960,
        920,
        40,
        themeColors.pink,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Including zero expands the interval to [0,3] and makes the step 3/255',
        960,
        1030,
        30,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 3) {
      heading(ctx, api, 'Fixed q=[1,2] · shared offset[2,3] · scales[0.1,0.2]');
      const q = cueProgress();
      [
        ['A', [3, 1]],
        ['B', [1, 2]],
      ].forEach(([name, codes], i) => {
        const y = 470 + i * 250,
          variable = codes[0] * 0.1 + 2 * 0.2 * codes[1];
        geometryText(
          ctx,
          api,
          name + ' code[' + codes.join(',') + ']',
          210,
          y + 35,
          32,
          themeColors.blue,
        );
        api.rect(ctx, 650, y, 720 * (1 - q), 70, themeColors.muted);
        api.rect(ctx, 650 + 720 * (1 - q), y, variable * 90, 70, themeColors.cyan);
        geometryText(
          ctx,
          api,
          q > 0.95
            ? 'residual = ' + variable.toFixed(2)
            : '8 + ' + variable.toFixed(2) + ' = ' + (8 + variable).toFixed(2),
          1530,
          y + 45,
          33,
          themeColors.cyan,
          'center',
        );
      });
      geometryText(
        ctx,
        api,
        'Only the same query-specific constant cancels from a fixed-query ranking',
        960,
        1030,
        31,
        themeColors.yellow,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'scalar-codec',
  draw: drawScalarCodec,
  cues: [],
};
