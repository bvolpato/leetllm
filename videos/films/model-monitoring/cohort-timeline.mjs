import { predictionRows } from './fixtures.mjs';
import { line, text } from './defaults.mjs';

const x = (hour) => 405 + 170 * (hour + 5);

// Hours are relative to noon. The same marks and time scale carry across the cut.
export function cohortTimeline(ctx, api, { mature, arrivals, delay = 0, ask = false }) {
  const { C } = api;
  api.circle(ctx, 247, 251, 11, C.bg, C.blue, 4);
  text(ctx, api, 'Outcome window closes', 274, 261, 32, C.blue, 'left');
  if (arrivals > 0) {
    api.rect(ctx, 805, 241, 21, 21, C.pink, undefined, 2);
    text(ctx, api, 'Label enters storage', 845, 261, 32, C.pink, 'left');
  }
  text(ctx, api, 'Known at noon', 1600, 332, 29, C.ink);
  for (let hour = -5; hour <= 1; hour++) {
    text(
      ctx,
      api,
      `${String(12 + hour).padStart(2, '0')}:00`,
      x(hour),
      334,
      29,
      hour === 0 ? C.yellow : C.muted,
    );
  }
  line(ctx, api, x(0), 357, x(0), 794, C.yellow, 4);
  predictionRows.forEach((row, i) => {
    const y = 391 + i * 75;
    const due = row.dueHours <= 0;
    text(ctx, api, row.id, 152, y + 11, 33, C.ink, 'left');
    line(ctx, api, x(-5) - 25, y, x(1) + 25, y, C.muted, 2);
    api.circle(ctx, x(row.dueHours), y, 12, C.bg, mature ? (due ? C.blue : C.muted) : C.blue, 4);
    if (arrivals > 0 && row.arrivalHours !== null) {
      const arrival = row.id === 'p-005' ? -1 + (row.arrivalHours + 1) * delay : row.arrivalHours;
      const end = x(arrival);
      api.components.fade(arrivals, () => {
        line(ctx, api, x(row.dueHours), y + 18, end, y + 18, C.pink, 3);
        api.rect(ctx, end - 10, y + 10, 20, 20, C.pink, undefined, 2);
      });
      const displayed =
        ask && row.id === 'p-005'
          ? '?'
          : arrival <= 0
            ? row.label
              ? 'Missed deadline'
              : 'Met deadline'
            : 'Label missing';
      text(
        ctx,
        api,
        displayed,
        1600,
        y + 12,
        29,
        (ask && row.id === 'p-005') || arrival > 0 ? C.yellow : C.ink,
      );
    } else if (mature) {
      text(
        ctx,
        api,
        due ? 'Window closed' : 'Still open',
        1600,
        y + 12,
        29,
        due ? C.blue : C.muted,
      );
    }
  });
}
