import { weeklySample } from '../fixtures.mjs';
import { afterCue, event, priorFrame } from '../construction.mjs';
import { count, wilson } from '../model.mjs';
import { axes, equation, focusTarget, interval, labelGrid, text, percent } from '../defaults.mjs';
const smallCount = count(weeklySample.slice(0, 5));
const smallMle = smallCount / 5;
const smallMode = (smallCount + 1) / 7;
const rateX = (rate) => 590 + ((rate - 0.1) / 0.25) * 1120;

function shiftRow(ctx, api, y, n, mle, mode, progress) {
  const { C } = api;
  const start = rateX(mle);
  const tip = api.lerp(start, rateX(mode), progress);
  text(ctx, api, n + ' reviews', 400, y + 11, 34, C.ink, 'right');
  api.line(ctx, rateX(0.1), y, rateX(0.35), y, C.muted, 2);
  if (progress > 0) api.line(ctx, start, y, tip, y, C.yellow, 7);
  api.circle(ctx, start, y, 11, C.blue);
  text(ctx, api, 'MLE ' + percent(mle), start - 15, y - 22, 27, C.blue, 'right');
  if (progress > 0) api.circle(ctx, tip, y, 10, C.yellow);
  if (progress === 1) text(ctx, api, 'MAP ' + percent(mode), tip + 15, y - 22, 27, C.yellow);
}

export function drawPriorAndCalibration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat < 2) {
      const f = priorFrame(state);
      const small = event(state, 0, 'small-peak', 0.73, 0.83);
      const large = event(state, 1, 'large-peak', 0.4, 0.57);
      const prior = event(state, 0, 'prior-shape', 0.4, 0.49);
      const terms = event(state, 0, 'prior-terms', 0.61, 0.71);
      focusTarget(ctx, api, 'prior-data', () => {
        text(ctx, api, f.n + ' reviewed messages', 522, 277, 35, themeColors.ink, 'center');
        labelGrid(ctx, api, weeklySample, f.n, f.n, 370, 320, 32, 10);
        text(
          ctx,
          api,
          f.k + ' specialist / ' + f.n + ' reviewed',
          518,
          669,
          29,
          themeColors.blue,
          'center',
        );
      });
      focusTarget(ctx, api, 'prior-contribution', () => {
        text(
          ctx,
          api,
          prior > 0 ? 'Beta(2,2) prior' : 'Observed fraction',
          1370,
          277,
          35,
          themeColors.ink,
          'center',
        );
        if (prior > 0 && terms === 0) {
          const plot = axes(
            ctx,
            api,
            1080,
            365,
            570,
            175,
            [0, 1],
            [0, 1.6],
            [0, 0.5, 1],
            [],
            'candidate rate',
          );
          const points = Array.from({ length: 101 }, (_, i) => {
            const x = i / 100;
            return { x, y: 6 * x * (1 - x) };
          });
          api.teaching.curve({
            plot,
            points,
            color: themeColors.yellow,
            width: 5,
            progress: prior,
          });
          return;
        }
        if (terms > 0) {
          for (const [i, label] of ['+1 success term', '+1 failure term'].entries()) {
            const x = 1055 + i * 335;
            const color = i === 0 ? themeColors.pink : themeColors.blue;
            api.rect(ctx, x, 327, 288, 88, themeColors.panel, color, 3, 7);
            text(ctx, api, label, x + 144, 382, 31, color, 'center');
          }
        }
        const reveal = currentBeat === 0 ? small : large;
        const formula = f.priorKnown
          ? '\\frac{' +
            f.k +
            '+1}{' +
            f.n +
            '+2}' +
            (reveal === 1 ? '=\\frac{' + (f.k + 1) + '}{' + (f.n + 2) + '}' : '')
          : '\\frac{' + f.k + '}{' + f.n + '}';
        equation(ctx, api, formula, 1370, 573, 62, themeColors.ink, 'center');
      });
      focusTarget(ctx, api, 'five-shift', () =>
        shiftRow(ctx, api, 770, 5, smallMle, smallMode, small),
      );
      focusTarget(ctx, api, 'hundred-shift', () => {
        if (currentBeat === 1 && f.n === 100) shiftRow(ctx, api, 890, f.n, f.mle, f.map, large);
      });
      for (const tick of [0.1, 0.15, 0.2, 0.25, 0.3, 0.35]) {
        const x = rateX(tick);
        api.line(ctx, x, 932, x, 943, themeColors.muted, 2);
        text(ctx, api, Math.round(tick * 100) + '%', x, 984, 26, themeColors.muted, 'center');
      }
    } else {
      const forecast = event(state, 2, 'bucket-forecast', 0.15, 0.29);
      const sample = event(state, 2, 'bucket-sample', 0.52, 0.68);
      const observed = currentBeat > 2 || afterCue(state, 'bucket-outcomes', 0.71, 0.81);
      const n = 100,
        k = 16;
      text(ctx, api, 'Compare a held-out forecast', 960, 264, 42, themeColors.ink, 'center');
      focusTarget(ctx, api, 'bucket-count', () => {
        if (sample > 0) {
          const x = 480,
            y = 340,
            width = 960;
          api.rect(ctx, x, y, width, 36, themeColors.panel, themeColors.muted, 3);
          api.rect(ctx, x, y, width * sample, 36, observed ? themeColors.blue : themeColors.muted);
          if (observed) api.rect(ctx, x, y, (width * k) / n, 36, themeColors.pink);
          text(
            ctx,
            api,
            observed
              ? '16 specialist / 100 held-out messages'
              : Math.round(n * sample) + ' held-out messages drawn at random',
            960,
            433,
            33,
            observed ? themeColors.pink : themeColors.blue,
            'center',
          );
        }
      });
      const plot = axes(
        ctx,
        api,
        280,
        576,
        1360,
        208,
        [0, 0.4],
        [0, 1],
        [0, 0.1, 0.16, 0.2, 0.3, 0.4],
        [],
        'specialist rate in this bucket',
        '',
      );
      focusTarget(ctx, api, 'forecast-marker', () => {
        if (forecast === 0) return;
        const p = plot.point(0.2, 0);
        api.line(ctx, p.x, p.y - 210 * forecast, p.x, p.y, themeColors.yellow, 4);
        text(ctx, api, 'Forecast 20%', p.x, 530, 32, themeColors.yellow, 'center');
      });
      focusTarget(ctx, api, 'calibration-comparison', () => {
        const q = event(state, 3, 'calibration-forecast', 0.01, 0.24);
        const rate = k / n;
        if (q > 0) {
          const v = wilson(k, n);
          interval(
            ctx,
            api,
            plot,
            {
              low: api.lerp(rate, v.low, q),
              high: api.lerp(rate, v.high, q),
            },
            0.5,
            themeColors.green,
            1,
          );
        }
        if (observed) {
          const p = plot.point(rate, 0.5);
          api.circle(ctx, p.x, p.y, 10, themeColors.pink);
        }
        if (currentBeat === 3 && afterCue(state, 'forecast-fits', 0.25, 0.34))
          text(
            ctx,
            api,
            '20% fits the observed rate’s 95% Wilson interval',
            960,
            959,
            36,
            themeColors.green,
            'center',
          );
      });
    }
  }
}
export default {
  id: 'prior-and-calibration',
  draw: drawPriorAndCalibration,
  cues: [
    'prior-shape',
    'prior-terms',
    'small-peak',
    'prior-data',
    'large-peak',
    'bucket-forecast',
    'bucket-sample',
    'bucket-outcomes',
    'calibration-forecast',
    'forecast-fits',
  ],
};
