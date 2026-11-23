import { cueProgress } from '../defaults.mjs';

const replies = [[120, 25], [450, 22], [180, 42], [190, 27]];
const firstLimit = 300;
const meanLimit = 30;
const windowSeconds = 10;
const passes = replies.filter(([first, mean]) => first <= firstLimit && mean <= meanLimit).length;

export function drawSloCompletions(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const reached = (id, fraction) => cueProgress(state, id, fraction, fraction + 0.1) > 0;
  api.focus.target('slo-completions-mechanism', () => {
    if (beat === 1) {
      const times = [0, 50, 100, 300, 350];
      const gaps = times.slice(1).map((time, i) => time - times[i]);
      const limit = 100;
      const mean = (times.at(-1) - times[0]) / gaps.length;
      const p99 = [...gaps].sort((a, b) => a - b)[Math.ceil(0.99 * gaps.length) - 1];
      const within = gaps.filter(gap => gap <= limit).length;
      const reveal = reached('slo-completions-b2', 0.13);
      const rule = reached('slo-gap-limit', 0.49);
      const x = (ms) => 275 + ms * 3.85;
      api.text(ctx, 'Another reply  ·  time since its first token', 960, 285, 39, C.ink, 'center');
      api.line(ctx, x(0), 473, x(350), 473, C.muted, 3);
      times.forEach((ms, i) => {
        api.circle(ctx, x(ms), 473, 11, C.cyan);
        api.text(ctx, ms + ' ms', x(ms), 425, 31, C.ink, 'center');
        if (i > 0 && reveal) {
          const color = rule && gaps[i - 1] > limit ? C.yellow : C.cyan;
          api.line(ctx, x(times[i - 1]) + 5, 542, x(ms) - 5, 542, color, 5);
          api.text(ctx, gaps[i - 1] + ' ms', x((times[i - 1] + ms) / 2), 611, 34, color, 'center');
        }
      });
      if (reveal)
        api.text(ctx, 'Mean gap   350 ms ÷ 4 = ' + mean + ' ms', 960, 751, 44, C.ink, 'center');
      if (rule) {
        api.text(ctx, within + ' of ' + gaps.length + ' gaps ≤ ' + limit + ' ms', 960, 859, 41, C.yellow, 'center');
        if (reached('slo-gap-rank', 0.73))
          api.text(ctx, 'Nearest-rank p99   ·   4th of 4 sorted gaps = ' + p99 + ' ms', 960, 955, 34, C.muted, 'center');
      }
      return;
    }

    const joint = beat === 2 || reached('slo-joint', 0.68);
    const misses = beat === 2 || reached('slo-misses', 0.43);
    const third = beat === 2 || reached('slo-third', 0.54);
    const expired = beat === 2 && reached('slo-expired', 0.13);
    const x = [290, 735, 1170, 1575];
    ['Reply', 'First token ≤ 300 ms', 'Mean gap ≤ 30 ms', 'Both limits'].forEach((v, i) =>
      api.text(ctx, v, x[i], 297, 36, C.muted, 'center'));
    replies.forEach(([first, mean], i) => {
      const y = 398 + i * 99;
      api.line(ctx, 193, y + 29, 1750, y + 29, C.muted, 1);
      const ok = first <= firstLimit && mean <= meanLimit;
      api.text(ctx, 'R' + (i + 1), x[0], y, 42, C.ink, 'center');
      api.text(ctx, first + ' ms', x[1], y, 42, misses && first > firstLimit ? C.yellow : C.ink, 'center');
      api.text(ctx, mean + ' ms', x[2], y, 42, third && mean > meanLimit ? C.yellow : C.ink, 'center');
      if (joint) api.text(ctx, ok ? 'met' : 'missed', x[3], y, 37, ok ? C.green : C.yellow, 'center');
    });
    if (expired) {
      api.text(ctx, 'R5', x[0], 806, 42, C.ink, 'center');
      api.text(ctx, 'Expired in queue', x[1], 806, 37, C.yellow, 'center');
      api.text(ctx, 'missed', x[3], 806, 37, C.yellow, 'center');
      const offered = replies.length + 1;
      api.text(ctx, passes + ' successes ÷ ' + offered + ' offered = ' + Math.round(100 * passes / offered) + '%',
        960, 950, 46, C.ink, 'center');
    } else if (beat === 2 || reached('slo-rates', 0.87)) {
      api.text(ctx, 'Completed   ' + replies.length / windowSeconds + ' req/s      Within both limits   ' +
        passes / windowSeconds + ' req/s', 960, 914, 44, C.ink, 'center');
    }
  });
}
export default {
  id: 'slo-completions',
  draw: drawSloCompletions,
  cues: ['slo-completions-b1', 'slo-misses', 'slo-third', 'slo-joint', 'slo-rates',
    'slo-completions-b2', 'slo-gap-limit', 'slo-gap-rank', 'slo-completions-b3', 'slo-expired'],
};
