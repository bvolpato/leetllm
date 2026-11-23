import { completed } from '../shipment.mjs';
import { L, cue, equation, foot, head, numberLine, text } from '../defaults.mjs';
export function drawArrivalTargets(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors, teaching: teaching } = api;
  const seen = (id) => cue(ctx, api, id) > 0;
  api.focus.target('arrival-targets-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Total duration and remaining hours use different anchors');
      const x = numberLine(ctx, api, 10, 24, 600);
      [
        ['Pickup 10:00', 10, themeColors.blue],
        ['Noon snapshot', 12, themeColors.cyan],
        ['ETA 21:00', 21, themeColors.green],
        ['23:00', 23, themeColors.pink],
      ]
        .slice(0, completed(api, 'wrong-anchor') ? 4 : seen('duration-clock') ? 3 : 2)
        .forEach(([s, v, col]) => {
          L(ctx, api, x(v), 560, x(v), 640, col, 5);
          text(ctx, api, s, x(v), v === 12 ? 810 : 735, 30, col, 'center');
        });
      L(ctx, api, x(10), 420, x(21), 420, themeColors.blue, 6);
      text(ctx, api, '11 hours total', 900, 380, 33, themeColors.blue, 'center');
      if (seen('duration-clock')) {
        L(ctx, api, x(12), 500, x(21), 500, themeColors.cyan, 6);
        text(ctx, api, '9 hours remaining', 1060, 470, 31, themeColors.cyan, 'center');
      }
      if (completed(api, 'wrong-anchor'))
        text(
          ctx,
          api,
          '12:00 + 11 h = 23:00   /   The first two hours were counted twice',
          960,
          920,
          34,
          themeColors.pink,
          'center',
        );
      foot(
        ctx,
        api,
        'Route, tier, in-transit state, delivery time and outcome availability govern eligibility',
      );
    } else if (currentBeat === 1) {
      head(ctx, api, 'Where can the next trip land among four past trips?');
      const x = (i) => 305 + i * 162;
      const inside = completed(api, 'range-ranks');
      api.line(ctx, x(0), 580, x(8), 580, themeColors.muted, 3);
      for (const [i, hours] of [8, 10, 12, 14].entries()) {
        const px = x(2 * i + 1);
        api.circle(ctx, px, 580, 15, themeColors.blue);
        text(ctx, api, hours + ' h', px, 503, 37, themeColors.blue, 'center');
      }
      for (let i = 0; i < 5; i++) {
        const px = x(2 * i),
          col = inside && i > 0 && i < 4 ? themeColors.green : themeColors.muted;
        api.circle(ctx, px, 580, 13, themeColors.bg, col, 4);
        text(ctx, api, 'Rank ' + (i + 1), px, 672, 29, col, 'center');
      }
      if (inside)
        equation(
          ctx,
          api,
          String.raw`P(\min X_i \le X_{new} \le \max X_i)=\frac{3}{5}=0.60`,
          960,
          837,
          49,
          themeColors.green,
        );
      foot(ctx, api, 'Five equally likely ranks require exchangeability and no ties');
    } else {
      head(ctx, api, 'Pinball loss at the 90th percentile');
      const plot = teaching.axes({
        x: 200,
        y: 470,
        width: 1000,
        height: 340,
        xDomain: [-3, 3],
        yDomain: [0, 3],
        xTicks: [-2, 0, 2],
        yTicks: [0, 1, 2, 3],
        xLabel: 'actual − predicted',
        yLabel: 'pinball loss',
        fontSize: 29,
      });
      teaching.curve({
        plot,
        points: Array.from(
          {
            length: 61,
          },
          (_, i) => {
            const x = -3 + i * 0.1;
            return {
              x,
              y: x >= 0 ? 0.9 * x : 0.1 * -x,
            };
          },
        ),
        color: themeColors.cyan,
        width: 4,
      });
      if (completed(api, 'pinball-cost')) {
        text(ctx, api, 'Under by 2 h → loss 1.8', 1500, 570, 31, themeColors.pink, 'center');
        text(ctx, api, 'Over by 2 h → loss 0.2', 1500, 760, 31, themeColors.blue, 'center');
      }
      foot(ctx, api, 'Check the fitted interval on held-out deliveries');
    }
  });
}
export default {
  id: 'arrival-targets',
  draw: drawArrivalTargets,
  cues: ['duration-clock', 'wrong-anchor', 'range-ranks', 'pinball-cost'],
};
