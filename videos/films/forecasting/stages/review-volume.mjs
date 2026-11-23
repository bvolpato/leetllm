import { timedForecastScene } from '../construction.mjs';
import { text } from '../defaults.mjs';

const clustersPerGroup = 100;
const groupCount = 10;
const expectedMisses = 5;

function dailyForecasts(ctx, api, clock) {
  const { C } = api;
  const groups = 1 + Math.floor((groupCount - 1) * clock.progress('thousand'));
  text(ctx, api, 'One daily forecast per cluster', 200, 275, 44, C.ink, 'left');
  for (let i = 0; i < groups; i++) {
    const x = 200 + (i % 5) * 318;
    const y = 342 + Math.floor(i / 5) * 200;
    const pitchX = 24,
      pitchY = 13;
    api.rect(ctx, x, y, 10 * pitchX, 10 * pitchY, C.blue, undefined, 0);
    api.rect(
      ctx,
      x + (10 - expectedMisses) * pitchX,
      y + 9 * pitchY,
      expectedMisses * pitchX,
      pitchY,
      C.pink,
      undefined,
      0,
    );
    for (let tick = 1; tick < 10; tick++) {
      api.line(ctx, x + tick * pitchX, y, x + tick * pitchX, y + 10 * pitchY, C.bg, 4);
      api.line(ctx, x, y + tick * pitchY, x + 10 * pitchX, y + tick * pitchY, C.bg, 3);
    }
  }
  text(ctx, api, 'Per 100 forecasts', 205, 803, 35, C.ink, 'left');
  text(ctx, api, '95 inside the band', 205, 864, 39, C.blue, 'left');
  text(ctx, api, '5 outside on average', 620, 864, 39, C.pink, 'left');
  if (clock.after('expected'))
    text(
      ctx,
      api,
      groups * expectedMisses +
        ' expected across ' +
        (groups * clustersPerGroup).toLocaleString('en-US') +
        ' clusters',
      1715,
      864,
      39,
      C.yellow,
      'right',
    );
}

function repeatedChecks(ctx, api, clock) {
  const { C } = api;
  const hours = 4;
  const perHour = 60;
  const total = hours * perHour;
  const checked = Math.round(total * clock.progress('evaluations'));
  text(ctx, api, 'One cluster above its band for four hours', 204, 278, 44, C.ink, 'left');
  for (let h = 0; h < hours; h++) {
    const y = 390 + h * 100;
    text(ctx, api, 'Hour ' + (h + 1), 315, y + 11, 34, C.ink, 'right');
    for (let m = 0; m < perHour; m++) {
      const x = 362 + 22 * m;
      const color = h * perHour + m < checked ? C.pink : C.muted;
      api.line(ctx, x, y - 19, x, y + 19, color, 5);
    }
  }
  text(ctx, api, checked + ' checks', 355, 843, 46, C.pink, 'left');
  if (clock.after('separate')) {
    api.line(ctx, 791, 823, 988, 823, C.yellow, 4);
    api.circle(ctx, 988, 823, 10, C.yellow);
    text(ctx, api, '1 open review', 1030, 843, 46, C.yellow, 'left');
  }
}

function thresholdCrossings(ctx, api, clock) {
  const { C } = api;
  const enter = 5,
    clear = 2;
  const y = (value) => 846 - 82 * value;
  const x = (i) => 580 + 380 * i;
  text(ctx, api, 'Jobs above forecast', 200, 270, 42, C.ink, 'left');
  for (const [limit, label, color] of [
    [enter, 'Open above ' + enter, C.pink],
    [clear, 'Clear below ' + clear, C.cyan],
  ]) {
    api.line(ctx, 500, y(limit), 1650, y(limit), color, 3);
    text(ctx, api, label, 463, y(limit) + 12, 32, color, 'right');
  }
  const readings = [6, 4, 1];
  const steps = ['open', 'stay', 'clear'];
  let active = false;
  for (const [i, value] of readings.entries()) {
    const progress = clock.progress(steps[i]);
    if (!progress) break;
    if (i > 0)
      api.line(
        ctx,
        x(i - 1),
        y(readings[i - 1]),
        api.lerp(x(i - 1), x(i), progress),
        api.lerp(y(readings[i - 1]), y(value), progress),
        C.ink,
        4,
      );
    if (!clock.after(steps[i])) break;
    const wasActive = active;
    active = active ? value >= clear : value > enter;
    api.circle(ctx, x(i), y(value), 12, C.ink);
    text(ctx, api, '+' + value, x(i) + 26, y(value) - 21, 40, C.ink, 'left');
    text(
      ctx,
      api,
      active ? (wasActive ? 'Stays open' : 'Opens') : 'Clears',
      x(i),
      934,
      37,
      active ? C.yellow : C.cyan,
    );
  }
}

const scene = timedForecastScene('review-volume', (ctx, api, clock) => {
  api.focus.target('fc-review-volume-mechanism', () => {
    if (clock.beat === 0) dailyForecasts(ctx, api, clock);
    else if (clock.progress('hysteresis') > 0) thresholdCrossings(ctx, api, clock);
    else repeatedChecks(ctx, api, clock);
  });
});

export const drawReviewVolume = scene.draw;
export default scene;
