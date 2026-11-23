import { completed } from '../shipment.mjs';
import { L, box, cue, equation, foot, head, numberLine, text } from '../defaults.mjs';
export function drawConformalCalibration(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors } = api;
  const seen = (id) => cue(ctx, api, id) > 0,
    done = (id) => completed(api, id);
  api.focus.target('conformal-calibration-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'One frozen prediction on a separate calibration delivery');
      box(
        ctx,
        api,
        'Predicted 9 h, delivered in 12 h   →   absolute error 3 h',
        220,
        390,
        1480,
        themeColors.blue,
      );
      equation(ctx, api, String.raw`k=\left\lceil(n+1)(1-\alpha)\right\rceil`, 960, 660, 57);
      box(
        ctx,
        api,
        'Sort the absolute errors and look up rank k',
        220,
        820,
        1480,
        themeColors.yellow,
      );
      foot(ctx, api, 'n counts calibration deliveries   /   1 − α is the coverage target');
    } else if (currentBeat === 1) {
      const nine = seen('conformal-nine-inputs'),
        n = nine ? 9 : 4,
        rankReady = nine ? done('conformal-nine-rank') : done('conformal-five-rank'),
        radiusReady = nine ? done('conformal-nine') : done('conformal-infinite');
      head(ctx, api, 'Target90% · α=0.1 · n=' + n + ' calibration scores');
      for (let i = 0; i < n; i++)
        box(
          ctx,
          api,
          String(i + 1),
          150 + i * 180,
          430,
          140,
          i === n - 1 ? themeColors.yellow : themeColors.blue,
          95,
        );
      if (!nine && rankReady) {
        const x = 150 + n * 180;
        api.rect(ctx, x, 430, 140, 95, null, themeColors.pink, 5);
        text(ctx, api, '?', x + 70, 492, 42, themeColors.pink, 'center');
        text(ctx, api, 'Rank ' + (n + 1), x + 70, 590, 30, themeColors.pink, 'center');
      }
      if (rankReady)
        equation(
          ctx,
          api,
          String.raw`k=\lceil(${n}+1)0.9\rceil=${Math.ceil((n + 1) * 0.9)}`,
          960,
          690,
          51,
        );
      else text(ctx, api, 'Corrected rank pending', 960, 690, 33, themeColors.muted, 'center');
      if (radiusReady)
        box(
          ctx,
          api,
          nine ? 'rank9 exists → radius9h' : 'rank5 absent → radius∞',
          380,
          820,
          1160,
          nine ? themeColors.green : themeColors.pink,
        );
      else box(ctx, api, 'Radius selection pending', 380, 820, 1160, themeColors.muted);
      foot(
        ctx,
        api,
        'Clamping a missing order statistic to the largest score changes the finite-sample guarantee',
      );
    } else {
      const center = 11,
        radius = 9,
        x = numberLine(ctx, api, 0, 22, 597);
      head(ctx, api, 'Apply the nine-hour radius to an eleven-hour prediction');
      const mark = (h, label, col) => {
        api.circle(ctx, x(h), 597, 15, col);
        text(ctx, api, label, x(h), 506, 37, col, 'center');
        text(ctx, api, h + ' h', x(h), 710, 42, col, 'center');
      };
      for (const [id, direction, label] of [
        ['conformal-lower', -1, 'Lower'],
        ['conformal-upper', 1, 'Upper'],
      ]) {
        const progress = cue(ctx, api, id);
        if (progress > 0)
          L(
            ctx,
            api,
            x(center),
            597,
            x(center + direction * radius * progress),
            597,
            themeColors.cyan,
            9,
          );
        if (done(id)) mark(center + direction * radius, label, themeColors.cyan);
      }
      mark(center, 'Predicted', themeColors.blue);
      if (done('conformal-upper'))
        text(
          ctx,
          api,
          'Coverage is marginal over exchangeable calibration and future scores.',
          960,
          871,
          35,
          themeColors.ink,
          'center',
        );
      foot(ctx, api, 'Check route-level coverage, width and the number of mature labels');
    }
  });
}
export default {
  id: 'conformal-calibration',
  draw: drawConformalCalibration,
  cues: [
    'conformal-rank',
    'conformal-five-rank',
    'conformal-infinite',
    'conformal-nine-inputs',
    'conformal-nine-rank',
    'conformal-nine',
    'conformal-lower',
    'conformal-upper',
  ],
};
