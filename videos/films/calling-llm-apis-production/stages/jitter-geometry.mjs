import { jitterWindows, workerDraws } from '../model.mjs';
import { cueClock } from '../cued-trace.mjs';

function drawWorkers(ctx, api, clock) {
  const { C } = api;
  const x = (seconds) => 438 + 429 * seconds;
  const replacing = clock.started('spread-arrivals');
  const elapsed = (replacing ? clock.p('spread-arrivals') : clock.p('fixed-arrivals')) * 3;
  api.text(
    ctx,
    replacing ? 'Replay  /  independent draws' : 'All workers wait 1 s, then 2 s',
    165,
    271,
    44,
    C.ink,
  );
  api.focus.target('arrival-tracks', () => {
    for (const [i, [first, second]] of workerDraws.entries()) {
      const y = 386 + i * 87;
      const times = replacing ? [first, first + 2 * second] : [1, 3];
      api.text(ctx, 'Worker ' + (i + 1), 165, y + 12, 31, C.muted);
      api.line(ctx, x(0), y, x(3.1), y, C.muted, 2);
      if (times[0] <= elapsed) api.circle(ctx, x(times[0]), y, 12, C.bg, C.cyan, 5);
      if (times[1] <= elapsed) api.circle(ctx, x(times[1]), y, 13, C.yellow);
    }
    for (let t = 0; t <= 3; t++) api.text(ctx, t + ' s', x(t), 916, 30, C.ink, 'center');
  });
  api.circle(ctx, 187, 999, 10, C.bg, C.cyan, 4);
  api.text(ctx, 'First retry', 218, 1009, 29, C.cyan);
  api.circle(ctx, 550, 999, 10, C.yellow);
  api.text(ctx, 'Second retry', 582, 1009, 29, C.yellow);
  api.text(ctx, 'Elapsed wait since failure', 1727, 1009, 29, C.muted, 'right');
}

export function drawJitterGeometry(ctx, scene, state, api) {
  const { C } = api;
  const clock = cueClock(scene, state);
  if (state.beat === 0) return drawWorkers(ctx, api, clock);
  const full = state.beat === 1;
  const cues = full ? ['full-first', 'full-second'] : ['decor-first', 'decor-second'];
  const x = (s) => 400 + 168 * s;
  api.text(
    ctx,
    full
      ? 'Full jitter  /  double the ceiling'
      : 'Decorrelated jitter  /  carry the last sleep forward',
    160,
    278,
    44,
    C.ink,
  );
  api.text(ctx, 'Base 1 s     ·     Cap 8 s     ·     Supplied draw ½', 160, 357, 34, C.muted);
  api.focus.target('jitter-windows', () => {
    for (const [i, row] of jitterWindows(full).entries()) {
      const y = 538 + i * 225;
      api.text(ctx, 'Retry ' + (i + 1), 160, y + 12, 36, C.ink);
      api.line(ctx, x(0), y, x(8), y, C.muted, 2);
      if (i === 0 || clock.started(cues[i])) {
        api.line(ctx, x(row.low), y, x(row.high), y, C.blue, 12);
        for (const end of [row.low, row.high])
          api.line(ctx, x(end), y - 17, x(end), y + 17, C.blue, 3);
        api.text(ctx, row.low + ' to ' + row.high + ' s', x(row.low), y - 51, 31, C.blue);
      }
      if (clock.started(cues[i])) {
        api.circle(ctx, x(row.low + (row.wait - row.low) * clock.p(cues[i])), y, 12, C.yellow);
        if (clock.after(cues[i]))
          api.text(ctx, 'Wait ' + row.wait + ' s', x(row.wait), y + 72, 34, C.yellow, 'center');
      }
    }
    for (const t of [0, 2, 4, 6, 8]) api.text(ctx, t + ' s', x(t), 941, 29, C.muted, 'center');
  });
}

export default {
  id: 'jitter-geometry',
  draw: drawJitterGeometry,
  cues: [
    'fixed-arrivals',
    'spread-arrivals',
    'full-first',
    'full-second',
    'decor-first',
    'decor-second',
  ],
};
