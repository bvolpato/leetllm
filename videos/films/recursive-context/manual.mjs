const day = (iso) => Date.parse(iso + 'T00:00:00Z') / 86400000;
const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
});
const dateLabel = (iso) => dateFormat.format(new Date(iso + 'T00:00:00Z'));

export const legacyRuns = {
  start: '2026-09-27',
  end: '2026-10-03',
  jobs: ['2026-09-29', '2026-10-01'],
};

// The cases straddle the expiry. The manual gives no time-of-day convention.
export function compareRun(date, expiry) {
  if (!expiry) return 'Date unknown';
  if (date === expiry) return 'Check the cutoff time';
  return date < expiry ? 'Before expiry' : 'After expiry';
}

export function drawCalendar(
  ctx,
  api,
  range,
  { expiry, showResult = false, markerLabel = 'Expiry', y = 728 } = {},
) {
  const { C } = api;
  const x = (iso) =>
    230 + (1460 * (day(iso) - day(range.start))) / (day(range.end) - day(range.start));
  api.line(ctx, 230, y, 1690, y, C.muted, 4);
  for (let d = day(range.start); d <= day(range.end); d++) {
    const iso = new Date(d * 86400000).toISOString().slice(0, 10);
    api.line(ctx, x(iso), y - 9, x(iso), y + 13, C.muted, 3);
  }
  api.text(ctx, dateLabel(range.start), 230, y + 60, 30, C.muted, 'center');
  api.text(ctx, dateLabel(range.end), 1690, y + 60, 30, C.muted, 'center');
  if (expiry) {
    const pos = x(expiry);
    api.line(ctx, pos, y - 125, pos, y + 14, C.yellow, 6);
    api.text(ctx, markerLabel + ' · ' + dateLabel(expiry), pos, y - 144, 35, C.yellow, 'center');
  }
  for (const job of range.jobs) {
    const pos = x(job);
    const relation = compareRun(job, expiry);
    const color =
      showResult && expiry ? (job < expiry ? C.green : job > expiry ? C.pink : C.yellow) : C.cyan;
    api.circle(ctx, pos, y, 13, color);
    api.text(ctx, dateLabel(job) + ' run', pos, y + 65, 37, color, 'center');
    if (showResult) api.text(ctx, relation, pos, y + 123, 32, color, 'center');
  }
}

export function drawPage(ctx, api, { page, x = 105, y = 262, width = 790, height = 354 }) {
  const { C } = api;
  api.rect(ctx, x + 14, y + 14, width, height, C.bg, C.muted, 9);
  api.rect(ctx, x, y, width, height, C.panel, C.blue, 9);
  api.text(ctx, page.id, x + 44, y + 67, 34, C.blue);
  api.line(ctx, x + 44, y + 98, x + width - 44, y + 98, C.muted, 2);
  const [, first, second] = page.text.match(/^(.+(?:requires|expires)) (.+)$/);
  api.text(ctx, first, x + 44, y + 186, 46, C.ink);
  api.text(ctx, second, x + 44, y + 250, 49, C.ink);
}
