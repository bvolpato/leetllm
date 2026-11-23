import { box, cueProgress, cueVisible, footer, line, rankingText } from '../defaults.mjs';
export function drawProbabilityValue(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  api.focus.target('probability-value-mechanism', () => {
    const { C } = api,
      b = state.beat ?? 0;
    {
      if (b < 2) {
        rankingText(ctx, api, 'Pairwise score orders products', 150, 270, 36, C.blue);
        if (cueVisible(ctx, api, 'value-score') || b > 0)
          rankingText(
            ctx,
            api,
            'A probability needs its own outcome and validation',
            150,
            350,
            31,
            C.yellow,
          );
        const values = b === 1 ? [0.2, 0.25, 80] : null;
        ['P(click)', 'P(purchase | click)', 'price'].forEach((name, i) => {
          box(
            ctx,
            api,
            values ? name + ' =' + values[i] : name,
            170 + i * 560,
            490,
            500,
            100,
            i === 2 ? C.yellow : C.cyan,
            30,
          );
          if (i < 2) rankingText(ctx, api, '×', 700 + i * 560, 555, 40, C.ink, 'center');
        });
        if (b === 0 && cueVisible(ctx, api, 'value-rule'))
          rankingText(
            ctx,
            api,
            'Expected gross value per impression',
            960,
            800,
            37,
            C.green,
            'center',
          );
        if (b === 1 && cueProgress(ctx, api, 'value-example') === 1) {
          rankingText(ctx, api, '0.2×0.25 = 0.05 purchases', 960, 780, 37, C.cyan, 'center');
          rankingText(
            ctx,
            api,
            '0.05×80 = 4 currency units / impression',
            960,
            900,
            38,
            C.green,
            'center',
          );
        }
        footer(
          ctx,
          api,
          'One attributed purchase through the measured click path; fixed price; fees,returns and other paths excluded.',
        );
      } else {
        rankingText(ctx, api, 'Held-out single-bin reliability worksheet', 150, 270, 34);
        const plot = api.teaching.axes({
          x: 260,
          y: 400,
          width: 470,
          height: 470,
          xDomain: [0, 1],
          yDomain: [0, 1],
          xTicks: [0, 0.5, 1],
          yTicks: [0, 0.5, 1],
          xLabel: 'mean predicted probability',
          yLabel: 'observed positive frequency',
          equalUnits: true,
          fontSize: 23,
        });
        const a = plot.point(0, 0),
          z = plot.point(1, 1);
        line(ctx, api, a.x, a.y, z.x, z.y, C.muted, 2);
        for (let i = 0; i < 10; i++)
          api.rect(
            ctx,
            1050 + (i % 5) * 130,
            405 + Math.floor(i / 5) * 145,
            95,
            95,
            i < 6 ? C.green : C.panel,
            i < 6 ? undefined : C.muted,
            0,
          );
        rankingText(ctx, api, '10 predictions at0.8 ·6 positives', 1050, 775, 31, C.cyan);
        if (cueVisible(ctx, api, 'value-bins')) {
          const at = plot.point(0.8, 0.6);
          api.circle(ctx, at.x, at.y, 12, C.cyan);
        }
        if (cueProgress(ctx, api, 'value-ece') === 1)
          rankingText(ctx, api, 'Single-bin gap |0.8−0.6| = 0.2', 960, 965, 37, C.yellow, 'center');
        footer(
          ctx,
          api,
          'General ECE weights each bin by its sample share; binning and finite samples affect the estimate.',
        );
      }
    }
  });
}
export default {
  id: 'probability-value',
  draw: drawProbabilityValue,
  cues: ['value-score', 'value-rule', 'value-example', 'value-bins', 'value-ece'],
};
