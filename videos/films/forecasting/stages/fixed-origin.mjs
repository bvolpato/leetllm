import { timedForecastScene } from '../construction.mjs';
import { FORECAST_ROWS } from '../fixtures.mjs';
import { weeklyLookup } from '../model.mjs';
import { text } from '../defaults.mjs';

const origin = 20,
  first = 14,
  last = 28;
const seven = weeklyLookup(origin + 7, origin);
const x = (index) => 175 + (index - first) * 111;

const scene = timedForecastScene('fixed-origin', (ctx, api, clock) => {
  const { C } = api;
  const advance = clock.progress('future');
  const repair = clock.progress('repair');
  const source = api.lerp(seven.source + advance, first, repair);
  const target = seven.target + advance;
  api.focus.target('fixed-calendar', () => {
    text(ctx, api, 'Observed history', x(17), 290, 35, C.cyan);
    text(ctx, api, 'Future at Sunday issuance', x(24.5), 290, 35, C.muted);
    text(ctx, api, 'Index', 119, 386, 24, C.muted, 'right');
    for (let i = first; i <= last; i++) {
      const row = FORECAST_ROWS[i];
      const cx = x(i);
      api.rect(ctx, cx - 47, 429, 94, 141, C.panel, i <= origin ? C.cyan : C.muted, 4);
      text(ctx, api, i, cx, 386, 28, C.muted);
      text(ctx, api, row ? row.date.slice(5).replace('-', '/') : '02/02', cx, 473, 24, C.muted);
      text(ctx, api, i <= origin ? row.volume : '?', cx, 540, 31, i <= origin ? C.ink : C.muted);
    }
    const boundary = x(origin + 0.5);
    api.line(ctx, boundary, 320, boundary, 578, C.yellow, 4);
    text(ctx, api, 'Last observed index 20', boundary, 239, 30, C.yellow);
    const left = x(source),
      right = x(target);
    const color = clock.after('reject') && repair === 0 ? C.pink : C.blue;
    const span = (right - left) * clock.progress('h7');
    if (span > 0) {
      api.line(ctx, left, 615, left, 653, color, 4);
      api.line(ctx, left, 653, left + span, 653, color, 4);
      api.line(ctx, left + span, 653, left + span, 615, color, 4);
      text(ctx, api, 'Source', left, 712, 31, color);
      if (clock.after('h7')) text(ctx, api, 'Target', right, 712, 31, color);
    }
  });
  api.focus.target('fixed-result', () => {
    if (repair > 0) {
      text(ctx, api, 'Repeat the last observed Monday', 960, 842, 42, C.cyan);
      if (clock.after('repeated'))
        text(
          ctx,
          api,
          '19 Jan  →  2 Feb     Monday forecast  ' + FORECAST_ROWS[first].volume + ' jobs',
          960,
          940,
          34,
          C.ink,
        );
      return;
    }
    const call = 'weekly_lag(' + (advance > 0 ? last : seven.target) + ', origin=20)';
    api.text(ctx, call, 960, 842, 41, C.ink, 'center', 'mono');
    const answer =
      advance > 0
        ? clock.after('reject')
          ? 'Rejected   ·   source index 21 is after origin 20'
          : 'Can Sunday read this source?'
        : clock.after('seven')
          ? seven.value + ' jobs'
          : 'Read the count seven rows before the target.';
    text(ctx, api, answer, 960, 935, 36, C.yellow);
  });
});

export const drawFixedOrigin = scene.draw;
export default scene;
