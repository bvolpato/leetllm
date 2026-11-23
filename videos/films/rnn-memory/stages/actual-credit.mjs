import { bound } from '../arithmetic.mjs';
import { eventNames, inputs, scalar } from '../fixtures.mjs';
import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  formatNumber,
  incidentMath,
  incidentNote,
  incidentRoute,
  incidentText,
  strokeArrow,
} from '../defaults.mjs';
export function drawActualCredit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('actual-credit', state),
    { b: currentBeat, p: progress, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  const events = (y = 282, active = -1, scalarValues = false) => {
    eventNames.forEach((name, i) => {
      const x = 440 + i * 510;
      api.circle(ctx, x, y, 28, active === i ? colors[i] : themeColors.panel, colors[i], 3);
      incidentText(
        ctx,
        api,
        i + 1,
        x,
        y + 10,
        26,
        active === i ? themeColors.panel : colors[i],
        'center',
      );
      incidentText(ctx, api, name, x, y + 60, 27, colors[i], 'center');
      incidentText(
        ctx,
        api,
        scalarValues ? 'signal ' + inputs[i] : ['[1, 0, 0]', '[0, 1, 0]', '[0, 0, 1]'][i],
        x,
        y + 101,
        26,
        themeColors.muted,
        'center',
      );
      if (i < 2) strokeArrow(ctx, api, x + 85, y, x + 420, y, themeColors.muted, 2);
    });
  };
  api.focus.target('actual-credit-operation', () => {
    events(270, -1, true);
    const xs = [210, 700, 1190, 1680],
      y = 500;
    scalar.forEach((value, i) => {
      incidentText(
        ctx,
        api,
        'h' + i + ' = ' + formatNumber(ctx, api, value),
        xs[i],
        y,
        33,
        i ? colors[i - 1] : themeColors.muted,
        'center',
      );
      if (i)
        strokeArrow(ctx, api, xs[i - 1] + 125, y - 12, xs[i] - 125, y - 12, themeColors.muted, 2);
    });
    m.factors.forEach((value, i) => {
      incidentText(
        ctx,
        api,
        '0.5(1 − h' + (i + 1) + '²)',
        (xs[i] + xs[i + 1]) / 2,
        585,
        26,
        themeColors.pink,
        'center',
      );
      if (started('credit-factors', progress > 0.2) || currentBeat > 0)
        incidentText(
          ctx,
          api,
          formatNumber(ctx, api, value, 6),
          (xs[i] + xs[i + 1]) / 2,
          635,
          31,
          themeColors.pink,
          'center',
        );
    });
    if (currentBeat === 0)
      incidentMath(
        ctx,
        api,
        String.raw`\frac{\partial h_t}{\partial h_{t-1}}=(1-h_t^2)\,0.5`,
        960,
        805,
        42,
        themeColors.ink,
      );
    else if (currentBeat === 1) {
      const count = started('credit-all', progress > 0.65)
        ? 3
        : started('credit-second', progress > 0.4)
          ? 2
          : started('credit-last', progress > 0.12)
            ? 1
            : 0;
      incidentText(ctx, api, 'Unit final sensitivity', 1680, 735, 27, themeColors.yellow, 'center');
      for (let i = 0; i <= count; i++) {
        const x = xs[3 - i];
        incidentText(
          ctx,
          api,
          formatNumber(ctx, api, m.sensitivities[i], 6),
          x,
          803,
          40,
          themeColors.yellow,
          'center',
        );
        if (i < count) {
          strokeArrow(ctx, api, x - 125, 790, xs[2 - i] + 125, 790, themeColors.yellow, 3);
          incidentRoute(
            ctx,
            api,
            {
              x: x - 130,
              y: 835,
            },
            {
              x: xs[2 - i] + 130,
              y: 835,
            },
            bound(cue(['credit-last', 'credit-second', 'credit-all'][i], progress) * 2),
            themeColors.yellow,
          );
        }
      }
      incidentNote(
        ctx,
        api,
        'Vector Jacobian: diag(1 − h²) Wₕ. Backward gradient columns multiply transposed Jacobians, last first.',
      );
    } else {
      incidentText(
        ctx,
        api,
        'Each local use contributes to one shared weight',
        960,
        735,
        31,
        themeColors.yellow,
        'center',
      );
      m.weightTerms.forEach((value, i) => {
        const x = 440 + i * 510;
        incidentText(ctx, api, formatNumber(ctx, api, value, 6), x, 803, 37, colors[i], 'center');
        incidentRoute(
          ctx,
          api,
          {
            x,
            y: 825,
          },
          {
            x: 960,
            y: 905,
          },
          cue('credit-weight-sum', progress),
          colors[i],
        );
      });
      if (started('credit-weight-total', progress > 0.5))
        incidentText(
          ctx,
          api,
          'd h₃ / d w = ' + formatNumber(ctx, api, m.weightGradient, 6),
          960,
          951,
          41,
          themeColors.yellow,
          'center',
        );
    }
  });
}
export default {
  id: 'actual-credit',
  draw: drawActualCredit,
  cues: [
    'actual-credit-0',
    'credit-factors',
    'actual-credit-1',
    'credit-last',
    'credit-second',
    'credit-all',
    'actual-credit-2',
    'credit-weight-sum',
    'credit-weight-total',
  ],
};
