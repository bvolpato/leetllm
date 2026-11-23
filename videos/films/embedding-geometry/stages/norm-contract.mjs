import { dot, robustUnit } from '../arithmetic.mjs';
import { PASSAGES } from '../fixtures.mjs';
import { cell, geometryText, heading, line } from '../defaults.mjs';
export function drawNormContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'A direction requires finite coordinates and a nonzero length');
      const inputs = [
        ['[0, 0]', 'zero norm', themeColors.pink],
        ['[NaN, 1]', 'nonfinite', themeColors.pink],
        ['[3, 4]', 'valid direction', themeColors.green],
      ];
      inputs.forEach(([v, why, col], i) => {
        const y = 410 + i * 210;
        cell(ctx, api, v, 260, y, 420, 100, themeColors.blue);
        api.arrow(ctx, 710, y + 50, 1050, y + 50, themeColors.muted, 3);
        if (cueProgress() > (i + 1) / 4) {
          cell(ctx, api, why, 1110, y, 530, 100, col);
          geometryText(
            ctx,
            api,
            col === themeColors.green ? 'normalize' : 'explicit failure',
            960,
            y + 135,
            28,
            col,
            'center',
          );
        }
      });
    }
    if (currentBeat === 1) {
      heading(ctx, api, 'Equal-coordinate directions · scale before squaring');
      const q = cueProgress();
      [
        ['1e300', themeColors.blue],
        ['1e−300', themeColors.cyan],
      ].forEach(([label, col], i) => {
        const y = 410 + i * 260;
        cell(ctx, api, '[' + label + ', ' + label + ']', 170, y, 430, 95, col);
        api.arrow(ctx, 620, y + 47, 800, y + 47, themeColors.muted, 3);
        cell(ctx, api, q > 0.25 ? '[1, 1]' : 'divide by max |x|', 830, y, 350, 95, col);
        api.arrow(ctx, 1200, y + 47, 1380, y + 47, themeColors.muted, 3);
        cell(
          ctx,
          api,
          q > 0.65 ? '[0.7071, 0.7071]' : 'divide by √2',
          1410,
          y,
          350,
          95,
          themeColors.green,
        );
      });
      geometryText(
        ctx,
        api,
        'The ratios survive both huge and tiny finite magnitudes',
        960,
        1000,
        34,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      heading(ctx, api, 'Fixed query q = [0, 2] · unit documents A and B');
      const q = [0, 2],
        rows = PASSAGES.map((r) => ({
          ...r,
          v: robustUnit(r.vector),
        }));
      rows.forEach((r, i) => {
        const y = 430 + i * 220;
        geometryText(ctx, api, r.id, 200, y + 40, 37, i ? themeColors.pink : themeColors.green);
        const raw = dot(q, r.v),
          cos = dot(robustUnit(q), r.v);
        line(ctx, api, 360, y, 360 + raw * 600, y, i ? themeColors.pink : themeColors.green, 16);
        geometryText(
          ctx,
          api,
          'raw ' + raw.toFixed(3),
          1530,
          y + 12,
          34,
          themeColors.ink,
          'center',
        );
        line(ctx, api, 360, y + 90, 360 + cos * 600, y + 90, themeColors.blue, 16);
        geometryText(
          ctx,
          api,
          'cos ' + cos.toFixed(3),
          1530,
          y + 102,
          34,
          themeColors.blue,
          'center',
        );
      });
      geometryText(
        ctx,
        api,
        'One shared positive query norm preserves exact rank; it changes score values',
        960,
        930,
        31,
        themeColors.yellow,
        'center',
      );
      geometryText(
        ctx,
        api,
        'Exact-arithmetic identity · finite inputs can still overflow floating dot scores',
        960,
        1020,
        29,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'norm-contract',
  draw: drawNormContract,
  cues: [],
};
