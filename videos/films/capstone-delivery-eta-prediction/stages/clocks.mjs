import { clock } from '../arithmetic.mjs';
import { scans } from '../fixtures.mjs';
import { completed, scanAt } from '../shipment.mjs';

export function drawClocks(ctx, scene, state, api) {
  const { C } = api,
    cutoff = 12;
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  const move = api.focus.progress('clocks-move', 0);
  const rows = scans.map((r, i) =>
    i === 1 ? { ...r, available: r.available + (11.75 - r.available) * move } : r,
  );
  const chosen = scanAt(rows, cutoff);
  const named = state.beat <= 1 ? completed(api, 'clocks-first') : completed(api, 'clocks-second');
  const ageReady = state.beat <= 1 ? completed(api, 'clocks-hour') : completed(api, 'clocks-half');
  const x = (h) => 525 + (h - 10.5) * 258;
  api.focus.target('scan-log', () => {
    tx('O-201    /    Carrier scans, May 1 UTC', 135, 247, 31, C.muted);
    tx('Noon cutoff', x(cutoff), 317, 36, C.yellow, 'center');
    for (const [top, bottom] of [
      [348, 610],
      [661, 817],
    ])
      api.line(ctx, x(cutoff), top, x(cutoff), bottom, C.yellow, 4);
    rows.forEach((row, i) => {
      const y = 432 + i * 158,
        chosenRow = named && row.name === chosen.name;
      const color = chosenRow ? C.green : C.cyan;
      tx(row.name, 140, y + 11, 37, chosenRow ? C.green : C.ink);
      api.line(ctx, 440, y, 1770, y, C.muted, 2);
      api.line(ctx, x(row.event), y, x(row.available), y, color, 5);
      // Separate the marks vertically so even a three-minute reporting lag is visible.
      api.line(ctx, x(row.event), y - 12, x(row.event), y, color, 3);
      api.line(ctx, x(row.available), y, x(row.available), y + 12, color, 3);
      api.circle(ctx, x(row.event), y - 12, 9, color);
      api.circle(ctx, x(row.available), y + 12, 10, C.bg, color, 4);
      tx('Scan ' + clock(row.event), x(row.event) - 12, y - 35, 29, C.blue, 'right');
      tx(
        'Online ' + clock(row.available),
        x(row.available) + (i === 2 ? -6 : 18),
        y + 54,
        29,
        color,
        i === 2 ? 'right' : 'left',
      );
    });
    const caption = named
      ? chosen.name +
        ' at ' +
        clock(chosen.event) +
        (ageReady ? '     /     Scan age  ' + chosen.age + ' h' : '')
      : 'Which event supplies the scan age at 12:00?';
    tx(caption, 960, 951, 45, named ? C.green : C.ink, 'center');
  });
}
export default {
  id: 'clocks',
  draw: drawClocks,
  cues: [
    'clocks-ring',
    'clocks-first',
    'clocks-hour',
    'clocks-move',
    'clocks-second',
    'clocks-half',
  ],
};
