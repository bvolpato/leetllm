import { fmt } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawScaleAndDecayMath,
  drawScaleAndDecayTarget,
  drawScaleAndDecayText,
} from '../defaults.mjs';
export function drawObjectiveScale(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    if (currentBeat === 0) {
      drawScaleAndDecayTarget(ctx, api, 'scale-objective', () => {
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          'Same entire history · fixed positive multiplier c = 3',
          170,
          245,
          32,
          themeColors.muted,
        );
        drawScaleAndDecayMath(
          ctx,
          api,
          themeColors,
          'g_t\\mapsto c g_t',
          260,
          360,
          49,
          themeColors.cyan,
        );
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          'SGD displacement scales by c at the same rate.',
          1050,
          350,
          30,
          themeColors.blue,
        );
      });
      const rows = [
        [
          'scale-signed',
          510,
          themeColors.cyan,
          'Signed corrected estimate',
          100,
          300,
          350,
          '\\hat m\\mapsto c\\hat m',
        ],
        [
          'scale-square',
          690,
          themeColors.yellow,
          'Squared corrected estimate',
          10000,
          90000,
          100000,
          '\\hat v\\mapsto c^2\\hat v',
        ],
        [
          'scale-root',
          870,
          themeColors.green,
          'Square-root scale',
          100,
          300,
          350,
          '\\sqrt{\\hat v}\\mapsto c\\sqrt{\\hat v}',
        ],
      ];
      for (const [id, y, color, label, original, final, maximum, formula] of rows)
        drawScaleAndDecayTarget(ctx, api, id, () => {
          const p = phase(id, 0),
            value = original + (final - original) * p;
          drawScaleAndDecayText(ctx, api, themeColors, label, 230, y - 55, 29, color);
          api.line(ctx, 230, y, 880, y, themeColors.muted, 2);
          api.rect(ctx, 230, y - 25, (value / maximum) * 650, 35, color, undefined, 2);
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            fmt(value) + ' · scale 0…' + maximum,
            230,
            y + 55,
            26,
            color,
          );
          if (p > 0) drawScaleAndDecayMath(ctx, api, themeColors, formula, 1050, y, 43, color);
        });
      drawScaleAndDecayTarget(ctx, api, 'scale-cancel', () => {
        if (phase('scale-cancel', 0) === 1)
          drawScaleAndDecayMath(
            ctx,
            api,
            themeColors,
            '\\frac{c\\hat m}{c\\sqrt{\\hat v}}=\\frac{\\hat m}{\\sqrt{\\hat v}}',
            1360,
            1010,
            44,
            themeColors.green,
            'center',
          );
        else
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            'Ratio after scaling = ?',
            1090,
            1010,
            33,
            themeColors.green,
          );
      });
    } else if (currentBeat === 1) {
      drawScaleAndDecayText(
        ctx,
        api,
        themeColors,
        'Cold first step · η = 0.01 · ε = 10⁻⁸ · positive g',
        170,
        245,
        32,
        themeColors.muted,
      );
      const plot = teaching.axes({
        x: 270,
        y: 390,
        width: 1100,
        height: 470,
        xDomain: [-10.5, 0.5],
        yDomain: [0, 0.011],
        xTicks: [-10, -8, 0],
        yTicks: [0, 0.005, 0.01],
        xLabel: 'log₁₀ gradient magnitude',
        yLabel: 'subtracted update',
        fontSize: 26,
        color: themeColors.muted,
      });
      const stages = [
        ['eps-large', 0, 1],
        ['eps-equal', -8, 1e-8],
        ['eps-tiny', -10, 1e-10],
      ];
      const value = (g) => (0.01 * g) / (g + 1e-8);
      for (const [i, [id, log, g]] of stages.entries())
        drawScaleAndDecayTarget(ctx, api, id, () => {
          const p = phase(id, 1),
            from = i ? stages[i - 1][1] : log,
            current = from + (log - from) * p;
          if (p > 0) {
            const points = Array.from(
              {
                length: 41,
              },
              (_, n) => {
                const x = from + ((current - from) * n) / 40;
                return {
                  x,
                  y: value(10 ** x),
                };
              },
            );
            teaching.curve({
              plot,
              points,
              color: [themeColors.cyan, themeColors.yellow, themeColors.green][i],
              width: 5,
            });
            const point = plot.point(current, value(10 ** current));
            api.circle(
              ctx,
              point.x,
              point.y,
              7,
              [themeColors.cyan, themeColors.yellow, themeColors.green][i],
            );
          }
          const y = 440 + i * 165;
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            'g = ' + (i === 0 ? '1' : i === 1 ? '10⁻⁸ = ε' : '10⁻¹⁰'),
            1450,
            y,
            33,
            [themeColors.cyan, themeColors.yellow, themeColors.green][i],
          );
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            p === 1
              ? '≈ ' + Math.round((value(g) / 0.01) * 100) + '% of the rate'
              : 'Share of rate?',
            1450,
            y + 65,
            30,
            [themeColors.cyan, themeColors.yellow, themeColors.green][i],
          );
        });
      drawScaleAndDecayMath(
        ctx,
        api,
        themeColors,
        '\\Delta w=0.01\\frac{g}{|g|+10^{-8}}',
        960,
        1010,
        49,
        themeColors.ink,
        'center',
      );
    } else {
      api.text(
        ctx,
        'Unscaled gradients   100, −80     ·     Multiplier   10',
        170,
        245,
        32,
        themeColors.muted,
      );
      const map = (v) => 300 + ((v + 85) / 195) * 1350;
      for (const [i, old, label, id] of [
        [0, 10, 'Scale changes only on the second input', 'scale-past'],
        [1, 100, 'Whole history was scaled from the start', 'scale-break'],
      ]) {
        drawScaleAndDecayTarget(ctx, api, id, () => {
          const y = 480 + i * 310,
            p = phase(id, 2),
            carry = 0.9 * old,
            incoming = -80 * p;
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            label,
            230,
            y - 100,
            35,
            i ? themeColors.green : themeColors.pink,
          );
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            '0.9 × ' + old + ' + 0.1 × (−800)',
            230,
            y - 45,
            30,
            themeColors.muted,
          );
          api.line(ctx, 300, y, 1650, y, themeColors.muted, 2);
          api.line(ctx, map(0), y - 12, map(0), y + 12, themeColors.ink, 2);
          drawScaleAndDecayText(
            ctx,
            api,
            themeColors,
            '0',
            map(0),
            y + 45,
            25,
            themeColors.muted,
            'center',
          );
          api.arrow(ctx, map(0), y, map(carry), y, themeColors.yellow, 6);
          if (p > 0) api.arrow(ctx, map(carry), y, map(carry + incoming), y, themeColors.cyan, 6);
          if (p === 1)
            drawScaleAndDecayText(
              ctx,
              api,
              themeColors,
              'New m₂ = ' + fmt(carry + incoming),
              230,
              y + 100,
              34,
              i ? themeColors.green : themeColors.pink,
            );
        });
      }
      drawScaleAndDecayText(
        ctx,
        api,
        themeColors,
        phase('scale-break', 2) === 1
          ? 'Negative memory moves the weight right. Positive memory moves it left.'
          : 'Same incoming gradient, different starting memories',
        960,
        980,
        30,
        themeColors.yellow,
        'center',
      );
      drawScaleAndDecayTarget(ctx, api, 'scale-record', () =>
        drawScaleAndDecayText(
          ctx,
          api,
          themeColors,
          'Record reduction, denominator, clipping and penalty path.',
          960,
          1040,
          30,
          themeColors.muted,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'objective-scale',
  draw: drawObjectiveScale,
  cues: [
    'scale-objective',
    'scale-signed',
    'scale-square',
    'scale-root',
    'scale-cancel',
    'eps-large',
    'eps-equal',
    'eps-tiny',
    'scale-past',
    'scale-break',
    'scale-record',
  ],
};
