import { featureFrame, welfordTrace } from '../model.mjs';

const readings = [2, 4, 6];
const steps = welfordTrace(readings);
const x = (n) => 400 + n * 183;

export function drawRunningStatistics(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const t = (s, xx, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, xx, y, size, color, align);
  api.focus.target('running-statistics-operation', () => {
    if (f.b === 0) {
      const fitted = steps.at(-1);
      const sd = Math.sqrt(fitted.population);
      t('Training fold', 150, 320, 38, C.cyan, 'left');
      readings.forEach((n, i) => {
        const xx = 273 + i * 246;
        api.circle(ctx, xx, 522, 66, C.panel, C.cyan, 3);
        t(String(n), xx, 543, 62);
      });
      api.arrow(ctx, 885, 522, 1050, 522, C.muted, 4);
      t('Stored transform', 1410, 435, 39, C.cyan);
      if (f.started('running-statistics-0', 0)) {
        t('Mean  ' + fitted.mean + '     SD  ' + sd.toFixed(4), 1410, 552, 43);
        t('Next reading 8', 480, 834, 43);
        t(
          '(8 − 4) / ' + sd.toFixed(4) + ' ≈ ' + ((8 - fitted.mean) / sd).toFixed(3),
          1330,
          834,
          46,
          C.yellow,
        );
      }
      return;
    }
    const i = f.started('welford-third', 2) ? 2 : f.started('welford-second', 2) ? 1 : 0;
    const step = steps[i];
    const travel = f.progress(
      ['welford-first', 'welford-second-mean', 'welford-third-mean'][i],
      i === 0 ? 1 : 2,
    );
    const posted = f.completed(
      ['welford-first', 'welford-second-product', 'welford-third-product'][i],
      i === 0 ? 1 : 2,
    );
    t('Incoming reading   ' + step.value, 140, 254, 40, C.yellow, 'left');
    t('Reading ' + step.n + ' of 3', 1760, 254, 32, C.muted, 'right');
    api.line(ctx, x(0), 513, x(6), 513, C.muted, 3);
    for (let n = 0; n <= 6; n++) {
      api.line(ctx, x(n), 500, x(n), 528, C.muted, 2);
      t(String(n), x(n), 572, 30, C.muted);
    }
    const span = (start, end, y, color) => {
      api.line(ctx, x(start), y, x(end), y, color, 4);
      api.line(ctx, x(start), y - 10, x(start), y + 10, color, 3);
      api.line(ctx, x(end), y - 10, x(end), y + 10, color, 3);
    };
    span(step.oldMean, step.value, 375, C.pink);
    t('From old mean   ' + step.delta, (x(step.oldMean) + x(step.value)) / 2, 348, 32, C.pink);
    if (travel === 1) {
      span(step.mean, step.value, 453, C.green);
      t('From new mean   ' + step.second, (x(step.mean) + x(step.value)) / 2, 429, 32, C.green);
    }
    api.circle(ctx, x(step.value), 513, 16, C.yellow);
    const meanX = x(step.oldMean + (step.mean - step.oldMean) * travel);
    api.circle(ctx, meanX, 513, 23, null, C.green, 4);
    t('New mean', 201, 689, 32, C.muted, 'left');
    t(
      step.oldMean + ' + ' + step.delta + ' / ' + step.n + ' = ' + (travel < 1 ? '?' : step.mean),
      790,
      692,
      49,
      C.green,
    );
    t('M2', 201, 806, 37, C.muted, 'left');
    const previous = i ? steps[i - 1].m2 : 0;
    t(
      previous +
        ' + ' +
        step.delta +
        ' × ' +
        (travel < 1 ? '?' : step.second) +
        ' = ' +
        (posted ? step.m2 : '?'),
      790,
      810,
      49,
      C.ink,
    );
    if (f.completed('feature-welford-variance', 2))
      t(
        'Population variance   8 / 3                 Sample variance   8 / 2',
        960,
        965,
        39,
        C.yellow,
      );
  });
}

export default {
  id: 'running-statistics',
  draw: drawRunningStatistics,
  cues: [
    'running-statistics-0',
    'welford-first',
    'welford-second',
    'welford-second-mean',
    'welford-second-product',
    'welford-third',
    'welford-third-mean',
    'welford-third-product',
    'feature-welford-variance',
  ],
};
