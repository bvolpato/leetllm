import { bound, sum } from '../arithmetic.mjs';
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
export function drawEventOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('event-order', state),
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
  api.focus.target('event-order-operation', () => {
    events(280, -1, true);
    if (currentBeat < 2) {
      incidentMath(ctx, api, String.raw`s_t=0.6s_{t-1}+x_t`, 960, 470, 43, themeColors.cyan);
      const traces = [m.discount, m.reverseDiscount],
        names = [eventNames, eventNames.toReversed()];
      const count = currentBeat === 0 ? Math.floor(4 * cue('discount-construction', progress)) : 3;
      for (let row = 0; row < (currentBeat === 0 ? 1 : 2); row++) {
        const y = 610 + row * 215;
        incidentText(
          ctx,
          api,
          row === 0 ? 'Original order' : 'Reverse the same events',
          120,
          y - 45,
          27,
          row === 0 ? themeColors.blue : themeColors.pink,
        );
        traces[row].slice(1).forEach((value, i) => {
          const x = 390 + i * 520,
            visible = row === 0 ? i < count : started('reverse-' + i, progress > (i + 1) * 0.18);
          incidentText(
            ctx,
            api,
            names[row][i],
            x,
            y - 8,
            26,
            colors[eventNames.indexOf(names[row][i])],
            'center',
          );
          if (i > 0) strokeArrow(ctx, api, x - 370, y + 55, x - 125, y + 55, themeColors.muted, 2);
          const isAnswer = row === 1 && i === 2;
          if (visible && (!isAnswer || started('event-order-reveal', progress > 0.65)))
            incidentText(
              ctx,
              api,
              formatNumber(ctx, api, value, 3),
              x,
              y + 65,
              48,
              row === 0 ? themeColors.blue : themeColors.pink,
              'center',
            );
          else incidentText(ctx, api, '?', x, y + 65, 45, themeColors.muted, 'center');
        });
      }
      if (currentBeat === 1 && started('order-sum', progress > 0.8))
        incidentText(
          ctx,
          api,
          'Same sum: ' +
            formatNumber(ctx, api, sum(inputs), 1) +
            '  ·  different discounted endings',
          960,
          962,
          32,
          themeColors.yellow,
          'center',
        );
    } else {
      incidentMath(
        ctx,
        api,
        String.raw`h_t=\tanh(0.8x_t+0.5h_{t-1})`,
        960,
        470,
        43,
        themeColors.cyan,
      );
      const count = started('scalar-third', progress > 0.7)
        ? 3
        : started('scalar-second', progress > 0.5)
          ? 2
          : started('scalar-first', progress > 0.25)
            ? 1
            : 0;
      scalar.slice(1).forEach((value, i) => {
        const x = 400 + i * 520;
        incidentText(ctx, api, eventNames[i], x, 570, 28, colors[i], 'center');
        incidentText(
          ctx,
          api,
          '0.8×' + inputs[i] + ' + 0.5×' + formatNumber(ctx, api, scalar[i]),
          x,
          635,
          27,
          themeColors.muted,
          'center',
        );
        if (i < count) {
          strokeArrow(ctx, api, x, 675, x, 730, themeColors.cyan);
          incidentText(
            ctx,
            api,
            formatNumber(ctx, api, value),
            x,
            792,
            54,
            themeColors.yellow,
            'center',
          );
        }
        if (i < 2)
          incidentRoute(
            ctx,
            api,
            {
              x: x + 110,
              y: 775,
            },
            {
              x: x + 410,
              y: 665,
            },
            count > i + 1
              ? 1
              : bound(cue('scalar-' + ['first', 'second', 'third'][i], progress) * 2),
            themeColors.cyan,
          );
      });
      incidentNote(
        ctx,
        api,
        'Supplied scalar parameters · tanh bounds each coordinate; it does not force a zero batch mean.',
      );
    }
  });
}
export default {
  id: 'event-order',
  draw: drawEventOrder,
  cues: [
    'event-order-0',
    'discount-construction',
    'event-order-1',
    'event-order-reveal',
    'reverse-0',
    'reverse-1',
    'reverse-2',
    'order-sum',
    'event-order-2',
    'event-scalar-reveal',
    'scalar-first',
    'scalar-second',
    'scalar-third',
  ],
};
