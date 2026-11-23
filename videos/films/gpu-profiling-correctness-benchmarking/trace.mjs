export const trace = Object.freeze({ hostA: 5.4, hostB: 3, start: 5, kernelStart: 10, stop: 75, wait: 78 });

// Both chapters use the same ruler when they follow candidate B.
export function drawDeviceTrace(ctx, api, time, { events = false, measurements = false } = {}) {
  const { C, text, rect, line } = api;
  const x = (us) => 370 + 16.6 * us;
  const bar = (label, y, start, end, color) => {
    text(ctx, label, 130, y + 48, 33, color);
    line(ctx, x(0), y + 74, x(80), y + 74, C.muted, 1);
    const width = x(Math.min(time, end)) - x(start);
    if (width > 0) rect(ctx, x(start), y + 14, width, 50, color);
  };
  text(ctx, 'Candidate B   /   constructed trace', 130, 247, 32, C.ink);
  text(ctx, 'time from host call (µs)', x(80), 247, 30, C.muted, 'right');
  for (const tick of [0, 20, 40, 60, 80]) {
    line(ctx, x(tick), 345, x(tick), 804, C.muted, 1);
    text(ctx, String(tick), x(tick), 313, 30, C.muted, 'center');
  }
  bar('CPU launch', 360, 0, trace.hostB, C.blue);
  if (time >= trace.hostB) text(ctx, 'returns at 3', x(3) + 22, 405, 32, C.blue);
  bar('Kernel', 504, trace.kernelStart, trace.stop, C.cyan);
  if (time >= trace.stop) {
    text(ctx, '10 to 75 µs', (x(10) + x(75)) / 2, 552, 34, C.bg, 'center');
  }
  bar('Host timer', 648, 0, trace.wait, C.yellow);
  if (time >= trace.wait) text(ctx, 'wait returns at 78', x(78) - 20, 696, 32, C.bg, 'right');
  if (events) {
    for (const [at, label, align] of [[trace.start, 'start at 5', 'left'], [trace.stop, 'stop at 75', 'right']]) {
      line(ctx, x(at), 753, x(at), 800, C.pink, 5);
      text(ctx, label, x(at), 849, 33, C.pink, align);
    }
    line(ctx, x(trace.start), 777, x(trace.stop), 777, C.pink, 4);
  }
  if (measurements) {
    text(ctx, '75 − 5 = 70 µs between events', 130, 959, 40, C.pink);
    text(ctx, '75 − 10 = 65 µs in kernel', 1790, 959, 40, C.cyan, 'right');
  }
}
