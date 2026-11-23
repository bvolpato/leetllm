import { directed } from '../construction.mjs';
import { drawSqlText } from '../defaults.mjs';

const firstDay = Date.parse('2026-01-01');
const lastDay = Date.parse('2026-10-01');
const xAt = (date) => 420 + (1300 * (Date.parse('2026-' + date) - firstDay)) / (lastDay - firstDay);

export function drawVersionGuard(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const proposal = directed(state, 'add-proposal', 0, 0.1, 0.33);
  const checks = directed(state, 'check-start-key', 0, 0.35, 0.48);
  const june = directed(state, 'probe-june', 0, 0.5, 0.63);
  const july = directed(state, 'probe-july', 0, 0.67, 0.81);
  const replaced = directed(state, 'replace-edition', 1, 0.31, 0.55) === 1;
  const committed = directed(state, 'commit-edition', 1, 0.68, 0.85) === 1;
  const intervals = [
    {
      name: 'January edition',
      start: '01-01',
      end: '07-01',
      label: 'Jan 1 to Jul 1',
      color: C.blue,
    },
    {
      name: 'July edition',
      start: '07-01',
      end: beat === 1 && replaced ? '08-12' : null,
      label: beat === 1 && replaced ? 'Jul 1 to Aug 12' : 'From Jul 1',
      color: C.green,
    },
    beat === 0
      ? { name: 'Proposal', start: '06-15', end: '07-15', label: 'Jun 15 to Jul 15', color: C.pink }
      : { name: 'Replacement', start: '08-12', end: null, label: 'From Aug 12', color: C.cyan },
  ];
  const rowY = (i) => 415 + 182 * i;
  drawSqlText(ctx, api, 'Harbor   /   Return Policy', 140, 263, 36, C.muted);
  intervals.forEach(({ name, start, end, color, label }, i) => {
    api.focus.target(beat === 0 && i === 2 ? 'proposed-interval' : 'replacement-intervals', () => {
      const y = rowY(i),
        left = xAt(start),
        right = xAt(end ?? '10-01');
      drawSqlText(ctx, api, name, 140, y + 12, 33, color);
      if (i === 2 && (beat === 0 ? proposal === 0 : !replaced)) return;
      if (end) {
        api.line(ctx, left, y, right - 9, y, color, 9);
        api.circle(ctx, right, y, 9, C.bg, color, 3);
      } else api.arrow(ctx, left, y, right, y, color, 8);
      api.circle(ctx, left, y, 9, color);
      drawSqlText(ctx, api, label, (left + right) / 2, y - 36, 29, color, 'center');
    });
  });
  if (beat === 0) {
    api.focus.target('overlap-date', () => {
      if (june === 0) return;
      const date = july > 0 ? '07-10' : '06-20';
      intervals.forEach(({ start, end }, i) => {
        if (start <= date && (!end || date < end))
          api.circle(ctx, xAt(date), rowY(i), 14, C.yellow, C.bg, 3);
      });
      drawSqlText(
        ctx,
        api,
        date === '06-20' ? 'June 20' : 'July 10',
        xAt(date),
        281,
        42,
        C.yellow,
        'center',
      );
    });
    if (checks === 1)
      drawSqlText(
        ctx,
        api,
        'Distinct starts     ·     End follows start',
        960,
        946,
        37,
        C.ink,
        'center',
      );
  } else {
    const locked = directed(state, 'take-writer-slot', 1, 0.12, 0.26) === 1;
    api.focus.target('replacement-steps', () => {
      const status = committed
        ? 'Committed   /   August 12'
        : locked
          ? 'Writer holds the slot'
          : 'Ready to publish';
      drawSqlText(ctx, api, status, 960, 946, 39, committed ? C.green : C.yellow, 'center');
    });
  }
}

export default {
  id: 'version-guard',
  draw: drawVersionGuard,
  cues: [
    'add-proposal',
    'check-start-key',
    'probe-june',
    'probe-july',
    'take-writer-slot',
    'replace-edition',
    'commit-edition',
  ],
};
