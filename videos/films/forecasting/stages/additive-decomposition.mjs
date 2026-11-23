import { timedForecastScene } from '../construction.mjs';
import { FORECAST_ROWS, weekdayNames } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

const week = FORECAST_ROWS.slice(0, 7);
const level = week.reduce((sum, row) => sum + row.volume, 0) / week.length;
const offset = week[4].volume - level;
const launch = 20,
  predicted = level + offset + launch;
const observed = FORECAST_ROWS[25].volume,
  remainder = observed - predicted;
const bottom = 768,
  scale = 2.8;
const y = (jobs) => bottom - jobs * scale;

const scene = timedForecastScene('additive-decomposition', (ctx, api, clock) => {
  const { C } = api;
  api.focus.target('decomposition-week', () => {
    text(ctx, api, 'First week   ·   batch jobs', 132, 260, 37, C.ink, 'left');
    week.forEach((row, i) => {
      const cx = 198 + i * 136;
      const top = y(row.volume);
      api.rect(ctx, cx - 36, top, 72, bottom - top, i === 4 ? C.blue : '#435978', undefined, 2);
      text(ctx, api, row.volume, cx, bottom + 46, 31, C.ink);
      text(ctx, api, weekdayNames[i], cx, bottom + 92, 26, C.muted);
      if (clock.progress('offsets') > 0 && (i === 4 || i === 6)) {
        const length = (top - y(level)) * clock.progress('offsets');
        api.line(ctx, cx + 47, y(level), cx + 47, y(level) + length, C.yellow, 5);
        if (clock.after('offsets'))
          text(
            ctx,
            api,
            i === 4 ? '+' + offset : row.volume - level,
            cx,
            Math.min(top, y(level)) - 30,
            30,
            C.yellow,
          );
      }
    });
    if (clock.progress('mean') > 0) {
      api.line(ctx, 140, y(level), 1060, y(level), C.cyan, 3);
      if (clock.after('mean')) text(ctx, api, 'Mean  ' + level, 150, 939, 37, C.cyan, 'left');
    }
  });
  api.focus.target('decomposition-friday', () => {
    text(ctx, api, 'Launch Friday', 1222, 260, 37, C.ink, 'left');
    const xx = 1270,
      w = 157;
    api.line(ctx, xx - 38, bottom, xx + w + 38, bottom, C.muted, 3);
    if (clock.beat === 0) return;
    let total = 0;
    const parts = [
      [level, C.cyan],
      [offset, C.blue],
      [launch * clock.progress('launch'), C.yellow],
      [clock.after('remainder') ? remainder : 0, C.pink],
    ];
    for (const [part, color] of parts) {
      total += part;
      if (part > 0) api.rect(ctx, xx, y(total), w, part * scale, color, undefined, 0);
    }
    text(ctx, api, 'Level  ' + level, xx + w + 28, y(level / 2) + 9, 28, C.cyan, 'left');
    text(
      ctx,
      api,
      'Friday  +' + offset,
      xx + w + 28,
      y(level + offset / 2) + 9,
      28,
      C.blue,
      'left',
    );
    if (clock.after('launch'))
      text(
        ctx,
        api,
        'Launch  +' + launch,
        xx + w + 28,
        y(predicted - launch / 2) + 12,
        28,
        C.yellow,
        'left',
      );
    if (clock.after('remainder'))
      text(ctx, api, 'Remainder  +' + remainder, xx + w + 28, y(observed) + 12, 28, C.pink, 'left');
    if (clock.after('sum'))
      text(
        ctx,
        api,
        'Observed ' +
          observed +
          '  −  predicted ' +
          predicted +
          '  =  ' +
          (clock.after('remainder') ? remainder : '?'),
        1440,
        939,
        32,
        C.ink,
      );
  });
});

export const drawAdditiveDecomposition = scene.draw;
export default scene;
