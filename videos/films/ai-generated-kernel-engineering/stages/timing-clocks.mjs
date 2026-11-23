import { sceneClock } from '../worksheet.mjs';

const calls = [
  { name: 'Baseline', kernel: 12, wrapper: 2, color: 'blue' },
  { name: 'Generated', kernel: 9, wrapper: 6, color: 'cyan' },
];

export function drawTimingClocks(ctx, scene, state, api) {
  const { C } = api, { beat } = state;
  const { after, progress } = sceneClock(state);
  const label = (s, x, y, size, color = C.ink, align = 'left') => api.text(ctx, s, x, y, size, color, align);
  api.focus.target('timing-clocks-construction', () => {
    if (beat === 0) {
      const submitted = progress('kg-timing-submit', 0, 0.06, 0.15);
      const running = progress('kg-timing-device', 0, 0.19, 0.35);
      const wait = progress('kg-timing-complete', 0, 0.45, 0.62);
      label('Illustrative submission and completion', 175, 290, 38, C.muted);
      const x = 465, handoff = 687, finish = 1540;
      label('Host', 370, 480, 43, C.blue, 'right');
      label('GPU stream', 370, 678, 43, C.cyan, 'right');
      api.line(ctx, x, 459, 1700, 459, C.muted, 2);
      api.line(ctx, x, 657, 1700, 657, C.muted, 2);
      if (submitted > 0) api.rect(ctx, x, 428, (handoff - x) * submitted, 62, C.blue, undefined, 4);
      if (submitted === 1) label('Launch returns', handoff, 399, 34, C.blue, 'center');
      if (running > 0) api.rect(ctx, handoff, 626, (finish - handoff) * (0.6 * running + 0.4 * wait), 62, C.cyan, undefined, 4);
      if (wait > 0) api.rect(ctx, handoff + 3, 437, (finish - handoff - 3) * wait, 43, C.yellow, undefined, 3);
      if (after('kg-timing-complete', 0, 0.45, 0.62)) {
        api.line(ctx, finish, 391, finish, 729, C.green, 3);
        label('Work complete', finish, 350, 34, C.green, 'center');
        label('Synchronized wall time includes the wait.', 960, 874, 43, C.ink, 'center');
      }
      return;
    }
    if (beat === 1) {
      const times = [45, 23, 9, 9.3, 9.1, 9.2];
      const p = progress('kg-timing-warm', 1, 0.25, 0.55);
      label('Successive calls   ·   illustrative warmup', 175, 290, 38, C.ink);
      const n = Math.max(1, Math.ceil(p * times.length));
      times.slice(0, n).forEach((ms, i) => {
        const x = 300 + 240 * i;
        api.rect(ctx, x, 840 - ms * 9, 105, ms * 9, i < 2 ? C.yellow : C.blue, undefined, 4);
        label(ms + ' ms', x + 52, 808 - ms * 9, 35, C.ink, 'center');
        label('Call ' + (i + 1), x + 52, 907, 32, C.muted, 'center');
      });
      if (after('kg-timing-stable', 1, 0.55, 0.69))
        label('Check this warm range separately from first use.', 960, 997, 36, C.ink, 'center');
      return;
    }
    const start = 425, unit = 71;
    label('Illustrative paired calls   ·   sequential costs', 175, 276, 38, C.ink);
    const showEnds = ['kg-timing-total-a', 'kg-timing-total-b'];
    calls.forEach((call, i) => {
      const p = i ? progress('kg-timing-kernel', 2, 0.36, 0.46) : progress('kg-timing-base', 2, 0.21, 0.35);
      const overhead = progress('kg-timing-wrappers', 2, 0.64, 0.81);
      const k = unit * call.kernel, w = unit * call.wrapper;
      const y = 428 + i * 195;
      const color = C[call.color];
      label(call.name, start - 40, y + 55, 39, color, 'right');
      if (p > 0) api.rect(ctx, start, y, k * p, 78, color, undefined, 4);
      if (p === 1) label('kernel  ' + call.kernel + ' µs', start, y - 20, 32, color);
      if (overhead > 0) api.rect(ctx, start + k, y, w * overhead, 78, C.yellow, undefined, 4);
      if (overhead === 1) label('wrapper +' + call.wrapper + ' µs', start + k + w / 2, y - 20, 32, C.yellow, 'center');
      if (after(showEnds[i], 3, i ? 0.21 : 0.08, i ? 0.3 : 0.21))
        label((call.kernel + call.wrapper) + ' µs', start + k + w + 35, y + 55, 45, color);
    });
    const tY = 795;
    api.line(ctx, start, tY, start + 16 * unit, tY, C.muted, 3);
    for (let t = 0; t <= 16; t += 2) {
      const x = start + t * unit;
      api.line(ctx, x, tY, x, tY + 12, C.muted, 3);
      label(String(t), x, tY + 53, 32, C.muted, 'center');
    }
    label('Elapsed time (µs)', start + 8 * unit, tY + 112, 36, C.ink, 'center');
    if (after('kg-timing-total-b', 3, 0.21, 0.3))
      label('3 µs saved in the kernel   ·   4 µs added in the wrapper', 960, 995, 37, C.yellow, 'center');
    else if (after('kg-timing-wrappers', 2, 0.64, 0.81))
      label('Which call returns first?', 960, 995, 40, C.yellow, 'center');
  });
}
export default {
  id: 'timing-clocks', draw: drawTimingClocks,
  cues: ['kg-timing-submit', 'kg-timing-device', 'kg-timing-complete', 'kg-timing-warm', 'kg-timing-stable',
    'kg-timing-base', 'kg-timing-kernel', 'kg-timing-wrappers', 'kg-timing-total-a', 'kg-timing-total-b'],
};
