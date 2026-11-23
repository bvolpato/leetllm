import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawIntervalMath(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const left = 530,
    unit = 117;
  const ruler = (domain, label) => {
    api.line(ctx, left, 343, left + unit * 10, 343, C.muted, 2);
    for (const n of domain) {
      api.line(ctx, left + unit * n, 337, left + unit * n, 355, C.muted, 2);
      txt(n, left + unit * n, 398, 34, C.muted, 'center');
    }
    txt(label, 150, 356, 34, C.muted);
  };

  if (state.beat === 2) {
    api.focus.target('mean-rows', () => {
      const runs = 200;
      txt('Clock', 150, 329, 34, C.muted);
      txt('Loop total', 641, 329, 34, C.muted);
      txt('Divide by ' + runs, 1015, 329, 34, C.muted);
      txt('Mean per run', 1470, 329, 34, C.muted);
      const rows = [
        ['Host enqueue', 2, C.blue],
        ['Stream events', 3, C.cyan],
        ['Completed wall', 4, C.green],
      ];
      rows.forEach(([label, ms, color], i) => {
        const y = 471 + 162 * i;
        const ready = p('interval-receipt') >= (i + 1) / rows.length;
        const convert = p('interval-divide') >= 1;
        const result = p('interval-values') >= (i + 1) / rows.length;
        txt(label, 150, y, 42, color);
        txt(ready ? ms + ' ms' : '·', 641, y, 48, color);
        txt(convert ? ms * 1000 + ' µs ÷ ' + runs : '·', 1015, y, 38, C.ink);
        txt(result ? (ms * 1000) / runs + ' µs' : '?', 1470, y, 49, result ? color : C.muted);
      });
      txt(
        'Same run and iteration count for all three observations',
        960,
        975,
        35,
        C.muted,
        'center',
      );
    });
    return;
  }
  if (p('interval-gap') > 0) {
    api.focus.target('interval-gap', () => {
      ruler([0, 3, 8, 10], 'Microseconds');
      txt('Device stream', 150, 564, 39, C.cyan);
      for (const [a, b] of [
        [0, 3],
        [8, 10],
      ]) {
        api.rect(ctx, left + a * unit, 493, (b - a) * unit, 110, C.panel, C.cyan, 8);
        txt('kernel', left + ((a + b) * unit) / 2, 562, 44, C.cyan, 'center');
      }
      const x = left + 3 * unit,
        right = left + 8 * unit;
      api.line(ctx, x, 646, right, 646, C.yellow, 4);
      for (const edge of [x, right]) api.line(ctx, edge, 619, edge, 647, C.yellow, 4);
      txt(
        p('interval-gap-span') >= 1 ? '8 − 3 = 5 µs idle' : 'gap inside the events',
        (x + right) / 2,
        733,
        42,
        C.yellow,
        'center',
      );
      txt(
        'Illustrative device trace   ·   inspect the host and other streams to explain the gap',
        960,
        931,
        32,
        C.muted,
        'center',
      );
    });
    return;
  }
  api.focus.target('interval-bars', () => {
    ruler([0, 2, 4, 6, 8, 10], 'Logical tick');
    const bars = [
      ['Host enqueue', 4, C.blue, 'interval-host'],
      ['Stream events', 10, C.cyan, 'interval-events'],
      ['Completed wall', 10, C.green, 'interval-wall'],
    ];
    bars.forEach(([name, end, color, id], i) => {
      const y = 450 + i * 145;
      txt(name, 150, y + 52, 39, color);
      api.rect(ctx, left, y, unit * 10, 66, C.panel, undefined, 8);
      const w = unit * end * p(id);
      if (w > 0) api.rect(ctx, left, y, w, 66, color, undefined, 7);
    });
    txt(
      p('interval-overlap') >= 1
        ? 'Host ticks 0–4 are inside the 0–10 wall interval'
        : 'One run, three observations',
      960,
      959,
      41,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'interval-math',
  draw: drawIntervalMath,
  cues: [
    'interval-host',
    'interval-events',
    'interval-wall',
    'interval-ask',
    'interval-overlap',
    'interval-gap',
    'interval-gap-span',
    'interval-receipt',
    'interval-divide',
    'interval-values',
  ],
};
