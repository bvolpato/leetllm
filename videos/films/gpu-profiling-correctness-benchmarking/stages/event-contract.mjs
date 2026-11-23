import { spoken } from '../arithmetic.mjs';
import { drawDeviceTrace, trace } from '../trace.mjs';

export function drawEventContract(ctx, scene, state, api) {
  const { C, text, rect, line } = api;
  api.focus.target('event-contract-mechanism', () => {
    if (state.beat < 2) {
      drawDeviceTrace(ctx, api, trace.wait, {
        events: spoken(state, 'event-marks', 0) > 0,
        measurements: state.beat === 1 && spoken(state, 'event-answer', 1) > 0,
      });
      if (state.beat === 0 && spoken(state, 'event-marks', 0) === 1)
        text(ctx, 'How much time between the marks belongs to the kernel?', 960, 958, 42, C.ink, 'center');
      return;
    }
    const intervals = [[70, 70, 70, 70], [40, 60, 80, 100]];
    const progress = spoken(state, 'batch-contrast', 2);
    text(ctx, 'Two batches   /   four serial operations in each', 140, 264, 37, C.ink);
    intervals.forEach((row, i) => {
      const y = 372 + 200 * i;
      text(ctx, 'Batch ' + (i + 1), 155, y + 65, 36, C.ink);
      if (i === 1 && progress === 0) {
        rect(ctx, 410, y, 1302, 98, C.panel, C.muted, 2);
        text(ctx, '280 µs total', 1061, y + 62, 34, C.ink, 'center');
        return;
      }
      let elapsed = 0;
      row.forEach((us, j) => {
        const x = 410 + elapsed * 4.65;
        const color = j % 2 ? C.cyan : C.blue;
        rect(ctx, x, y, us * 4.65 - 3, 98, color, C.muted, 1);
        text(ctx, us + ' µs', x + us * 4.65 / 2, y + 62, 34, C.bg, 'center');
        elapsed += us;
      });
    });
    line(ctx, 410, 750, 1712, 750, C.yellow, 4);
    text(ctx, 'One event pair per batch   ·   280 µs / 4 = 70 µs per operation', 960, 844, 41, C.yellow, 'center');
    if (progress === 1)
      text(ctx, 'The batch timer cannot recover the individual durations.', 960, 955, 35, C.ink, 'center');
  });
}
export default { id: 'event-contract', draw: drawEventContract, cues: ['event-marks', 'event-answer', 'batch-contrast'] };
