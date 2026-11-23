import { eventRoute, formatClock } from '../arithmetic.mjs';
import { countWindow } from '../fixtures.mjs';
import { minuteScale, spoken } from '../request-clock.mjs';

function inputProgress(ctx, api, clock) {
  const { C } = api;
  const x = minuteScale(700, 745, 470, 1730);
  const idle = clock.finished('idle');
  const values = [740, 710];
  const minimum = Math.min(...(idle ? values.slice(0, 1) : values));
  for (const [i, minute] of values.entries()) {
    const y = 382 + 163 * i;
    const active = !(idle && i === 1);
    const color = active ? C.cyan : C.muted;
    api.text(ctx, `Input ${i ? 'B' : 'A'}`, 108, y + 12, 40, color);
    api.line(ctx, x(700), y, x(745), y, '#373a43', 4);
    api.line(ctx, x(700), y, x(minute), y, color, active ? 9 : 3);
    api.circle(ctx, x(minute), y, 12, color);
    api.text(
      ctx,
      `${formatClock(minute)}${active ? '' : '   idle'}`,
      x(minute),
      y - 35,
      36,
      color,
      'center',
    );
  }
  api.text(ctx, 'Downstream', 108, 755, 38, C.yellow);
  api.line(ctx, x(700), 743, x(745), 743, '#373a43', 4);
  if (clock.finished('minimum')) {
    api.line(ctx, x(700), 743, x(minimum), 743, C.yellow, 9);
    api.circle(ctx, x(minimum), 743, 12, C.yellow);
    api.text(ctx, formatClock(minimum), x(minimum), 704, 42, C.yellow, 'center');
  }
  api.text(ctx, 'Progress follows the slowest active input.', 110, 933, 36, C.ink);
}

export function drawWatermarkInputs(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  if (state.beat === 0) {
    api.focus.target('watermark-rule', () => {
      const largest = (12 * 60 + 20) * 60_000;
      const minuteResult = largest - 15 * 60_000;
      const displayTime = (ms) => new Date(ms).toISOString().slice(11, 23);
      api.text(ctx, 'Largest event time', 180, 385, 36, C.muted);
      api.text(ctx, displayTime(largest), 180, 491, 84, C.cyan, 'left', 'mono');
      api.text(ctx, '− 15 min', 1130, 479, 57, C.ink);
      api.line(ctx, 185, 555, 1740, 555, '#555a64', 3);
      if (!clock.finished('minutes')) return;
      api.text(ctx, 'After the 15-minute delay', 185, 669, 35, C.muted);
      api.text(ctx, displayTime(minuteResult), 1720, 670, 52, C.ink, 'right', 'mono');
      if (!clock.started('engine')) return;
      api.text(ctx, 'Flink periodic watermark', 185, 830, 35, C.muted);
      api.text(
        ctx,
        clock.finished('engine')
          ? displayTime(minuteResult - 1)
          : `${displayTime(minuteResult)} − 1 ms`,
        1720,
        834,
        52,
        C.yellow,
        'right',
        'mono',
      );
    });
    return;
  }
  if (state.beat === 1) {
    api.focus.target('input-progress', () => inputProgress(ctx, api, clock));
    return;
  }
  const { start, end, allowance, watermark, replayEvent, members } = countWindow;
  const x = minuteScale(start, end + allowance + 4, 510, 1775);
  const right = x(watermark);
  const routeLimit = watermark - 45;
  const retained = watermark < end + allowance;
  api.focus.target('window-budgets', () => {
    api.text(ctx, 'Window', 108, 360, 38, C.ink);
    api.rect(ctx, x(start), 313, x(end) - x(start), 66, '#233249', undefined, 3);
    api.rect(ctx, x(end), 313, x(end + allowance) - x(end), 66, '#254036', undefined, 3);
    api.text(ctx, '11:00 to 12:00', (x(start) + x(end)) / 2, 356, 32, C.ink, 'center');
    api.text(ctx, 'retain 30 min', (x(end) + x(end + allowance)) / 2, 356, 30, C.ink, 'center');
    api.text(ctx, '12:00 end', x(end) - 12, 432, 30, C.muted, 'right');
    api.text(ctx, '12:30', x(end + allowance), 432, 30, C.muted, 'center');
    api.line(ctx, right, 286, right, 308, C.yellow, 4);
    api.text(ctx, `Watermark ${formatClock(watermark)}`, right, 260, 36, C.yellow, 'center');
    if (clock.started('window-span')) {
      const tip = api.lerp(x(end), right, clock.progress('window-span'));
      api.line(ctx, x(end), 388, tip, 388, C.yellow, 7);
      api.circle(ctx, tip, 388, 8, C.yellow);
    }
    if (clock.finished('retained')) {
      api.text(
        ctx,
        `${watermark - end} min past end   ·   state ${retained ? 'retained' : 'expired'}`,
        110,
        477,
        34,
        C.green,
      );
    } else api.text(ctx, 'State at 12:20   ·   retained or expired?', 110, 477, 34, C.yellow);

    api.text(ctx, 'Accept late records up to 45 min behind the watermark', 110, 575, 32, C.ink);
    const events = [replayEvent, members[2].event];
    events.forEach((minute, i) => {
      if (i && !clock.started('second')) return;
      const y = 686 + i * 183;
      const ready = clock.finished(i ? 'accept' : 'replay');
      const route = eventRoute(minute, watermark);
      api.text(ctx, `Sent ${formatClock(minute)}`, 108, y + 9, 36, C.cyan);
      api.line(ctx, x(start), y, right, y, '#40434c', 3);
      api.line(ctx, x(routeLimit), y + 18, right, y + 18, '#518870', 7);
      const span = i ? clock.progress('second') : clock.progress('record-span');
      if (span > 0) api.line(ctx, x(minute), y, api.lerp(x(minute), right, span), y, C.cyan, 6);
      api.circle(ctx, x(minute), y, 11, C.cyan);
      api.line(ctx, right, y - 20, right, y + 20, C.yellow, 4);
      api.text(ctx, formatClock(routeLimit), x(routeLimit), y + 63, 29, C.muted, 'center');
      const verdict = route === 'replay' ? 'replay' : 'accept';
      api.text(
        ctx,
        ready ? `${watermark - minute} min   ·   ${verdict}` : 'Route  ?',
        1740,
        y + 73,
        37,
        ready ? (route === 'replay' ? C.pink : C.green) : C.yellow,
        'right',
      );
    });
  });
}
export default {
  id: 'watermark-inputs',
  draw: drawWatermarkInputs,
  cues: [
    'minutes',
    'engine',
    'minimum',
    'idle',
    'window-span',
    'retained',
    'record-span',
    'replay',
    'second',
    'accept',
  ].map((id) => 'sf-watermark-inputs-' + id),
};
