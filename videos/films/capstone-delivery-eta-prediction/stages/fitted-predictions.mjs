import { clock } from '../arithmetic.mjs';
import { dimension, completed } from '../shipment.mjs';
import { fittedEtaFixture } from '../fixtures.mjs';
import { L, box, costBars, foot, head, rectangle, text } from '../defaults.mjs';
export function drawFittedPredictions(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors } = api;
  const done = (id) => completed(api, id);
  api.focus.target('fitted-predictions-construction', () => {
    const f = fittedEtaFixture();
    head(
      ctx,
      api,
      currentBeat < 2
        ? 'S-133   /   Expedited   /   Warn at 40% risk'
        : '24 synthetic test shipments   /   Frozen decisions',
    );
    if (currentBeat === 0) {
      const names = ['scan age', 'backlog', 'expedited', 'elapsed', 'to promise'],
        ids = [
          'fitted-contribution-scan',
          'fitted-contribution-backlog',
          'fitted-contribution-tier',
          'fitted-contribution-elapsed',
          'fitted-contribution-promise',
        ];
      for (let i = 0; i < 5; i++) {
        const y = 380 + i * 98;
        text(ctx, api, names[i], 170, y + 35, 28, themeColors.blue);
        const v = f.contributions[i],
          zero = 1120,
          w = v * 430;
        L(ctx, api, zero, y, zero, y + 55, themeColors.muted, 2);
        if (done(ids[i])) {
          rectangle(
            ctx,
            api,
            Math.min(zero, zero + w),
            y,
            Math.abs(w),
            55,
            v < 0 ? themeColors.pink : themeColors.cyan,
          );
          text(
            ctx,
            api,
            v.toFixed(3),
            1780,
            y + 37,
            30,
            v < 0 ? themeColors.pink : themeColors.cyan,
            'right',
          );
        } else text(ctx, api, 'pending', 1780, y + 37, 28, themeColors.muted, 'right');
      }
      if (done('fitted-logit'))
        text(
          ctx,
          api,
          'intercept−0.832 → logit ' + f.logit.toFixed(6),
          960,
          925,
          31,
          themeColors.yellow,
          'center',
        );
      else text(ctx, api, 'Logit pending', 960, 925, 29, themeColors.muted, 'center');
      if (done('fitted-probability'))
        text(
          ctx,
          api,
          'sigmoid ' + f.probability.toFixed(6) + (done('fitted-action') ? ' <0.4 → SILENT' : ''),
          960,
          995,
          31,
          themeColors.pink,
          'center',
        );
      else
        text(ctx, api, 'Probability and action pending', 960, 995, 29, themeColors.muted, 'center');
    } else if (currentBeat === 1) {
      const promise = f.input[4],
        actual = 11.513977618576238;
      const x = (hours) => 360 + hours * 101;
      const tx = (s, px, y, n, color, align = 'left') => text(ctx, api, s, px, y, n, color, align);
      const time = (h) => clock(12 + h);
      const arrival = done('fitted-arrival'),
        delivered = done('fitted-door');
      tx('May 14   /   Hours after the noon snapshot', 155, 344, 32, themeColors.muted);
      for (const [i, [name, h, visible, col]] of [
        ['Predicted', f.eta, arrival, themeColors.blue],
        ['Promised', promise, true, themeColors.yellow],
        ['Delivered', actual, delivered, themeColors.pink],
      ].entries()) {
        const y = 446 + i * 147;
        tx(name, 145, y + 11, 31, col);
        api.line(ctx, x(0), y, x(12.5), y, themeColors.muted, 2);
        if (visible) {
          api.line(ctx, x(0), y, x(h), y, col, 7);
          api.circle(ctx, x(h), y, 13, col);
          tx(time(h), x(h), y - 26, 38, col, 'center');
          tx(h.toFixed(3) + 'h', 1775, y + 12, 32, col, 'right');
        }
      }
      if (delivered) {
        const y = 803;
        dimension(ctx, api, x(promise), x(actual), y, themeColors.pink);
        tx(
          Math.round(60 * (actual - promise)) + ' min late',
          x(actual) + 34,
          y + 10,
          31,
          themeColors.pink,
        );
      }
      if (done('fitted-error')) {
        dimension(ctx, api, x(f.eta), x(actual), 851, themeColors.blue);
        tx(
          (actual - f.eta).toFixed(3) + ' h forecast error',
          x(f.eta) - 27,
          861,
          31,
          themeColors.blue,
          'right',
        );
      }
      if (done('missed-expedited'))
        tx('S-133 missed expedited warning:150', 150, 933, 34, themeColors.pink);
      if (done('final-cost-sum'))
        tx('S-126 false warning:8 → final total158', 985, 933, 34, themeColors.pink);
      if (api.focus.progress('test-cohort', 0) > 0)
        tx(
          '11 on-time orders   ×   8 units per false warning   =   ?',
          960,
          1023,
          35,
          themeColors.yellow,
          'center',
        );
    } else if (currentBeat === 2) {
      costBars(ctx, api, {
        x: 180,
        y: 430,
        width: 1150,
        height: 410,
        values: [
          done('age-rule-baseline') ? 1410 : null,
          done('silent-rule-baseline') ? 1410 : null,
          158,
          done('always-warn-baseline') ? 88 : null,
        ],
        labels: ['age rule', 'always silent', 'fitted', 'always warn'],
        max: 1500,
        colors: [themeColors.muted, themeColors.blue, themeColors.pink, themeColors.green],
      });
      text(ctx, api, '24 test orders', 1570, 440, 35, themeColors.yellow, 'center');
      text(ctx, api, '13 late / 11 on time', 1570, 570, 29, themeColors.blue, 'center');
      if (done('fitted-slice-results')) {
        text(ctx, api, 'missed expedited1/7', 1570, 720, 29, themeColors.pink, 'center');
        text(ctx, api, 'missed standard0/6', 1570, 850, 29, themeColors.green, 'center');
      } else
        text(ctx, api, 'Slice miss counts pending', 1570, 770, 27, themeColors.muted, 'center');
      foot(ctx, api, 'Small denominators limit slice conclusions');
    } else if (currentBeat === 3) {
      costBars(ctx, api, {
        x: 220,
        y: 430,
        width: 1050,
        height: 390,
        values: done('eta-error-comparison') ? [4.203, 2.479] : [null, null],
        labels: ['train-tier median MAE', 'fitted ETA MAE'],
        max: 5,
        colors: [themeColors.blue, themeColors.cyan],
        format: (v) => v.toFixed(3),
      });
      if (done('failed-cost-gate'))
        box(ctx, api, 'HOLD: warning cost gate failed', 1300, 500, 500, themeColors.pink, 155);
      text(
        ctx,
        api,
        'Arrival error and warning penalty are separate objectives',
        960,
        930,
        32,
        themeColors.yellow,
        'center',
      );
      foot(
        ctx,
        api,
        'Do not retune on the revealed final test; develop and evaluate on separate new evidence',
      );
    } else {
      const price = 20,
        miss = 150,
        falseWarnings = [1, 11];
      text(ctx, api, 'Price of one false warning', 155, 398, 37, themeColors.muted);
      text(ctx, api, '8  →  20 units', 850, 401, 49, themeColors.yellow);
      for (const [i, name] of ['Fitted policy', 'Warn everyone'].entries()) {
        const y = 575 + i * 179;
        text(ctx, api, name, 165, y, 42, themeColors.ink);
        const fixed = i === 0 ? miss : 0;
        text(
          ctx,
          api,
          fixed + '  +  ' + falseWarnings[i] + ' × ' + price,
          726,
          y,
          43,
          themeColors.blue,
        );
        const show = done(i === 0 ? 'repriced-fitted' : 'repriced-all');
        text(
          ctx,
          api,
          show ? fixed + falseWarnings[i] * price + ' units' : '?',
          1645,
          y,
          52,
          show ? themeColors.cyan : themeColors.muted,
          'right',
        );
      }
      text(
        ctx,
        api,
        'Same 24 outcomes   /   Same warnings   /   Only the assumed penalty changes',
        960,
        955,
        32,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'fitted-predictions',
  draw: drawFittedPredictions,
  cues: [
    'fitted-contribution-scan',
    'fitted-contribution-backlog',
    'fitted-contribution-tier',
    'fitted-contribution-elapsed',
    'fitted-contribution-promise',
    'fitted-logit',
    'fitted-probability',
    'fitted-action',
    'fitted-arrival',
    'fitted-door',
    'fitted-error',
    'test-cohort',
    'missed-expedited',
    'final-cost-sum',
    'age-rule-baseline',
    'silent-rule-baseline',
    'always-warn-baseline',
    'fitted-slice-results',
    'eta-error-comparison',
    'failed-cost-gate',
    'repriced-fitted',
    'repriced-all',
  ],
};
