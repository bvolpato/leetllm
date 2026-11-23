import { tokenTiming } from '../arithmetic.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const times = [300, 340, 380, 500];
const { ttft, tpot, gaps } = tokenTiming(0, times);
const x = (time) => 165 + time * 3.04;

export function drawTokenClocks(ctx, scene, state, api) {
  const { C } = api;
  const now =
    300 * cueProgress(state, 'first-delivery', 0, 0.3, 0.77) +
    200 * cueProgress(state, 'later-deliveries', 1, 0.05, 0.52);
  api.focus.target('request-clock', () => {
    api.text(ctx, 'Server trace for one admitted request', 145, 256, 38, C.ink);
    for (const [start, end, label, color] of [
      [0, 180, 'Waiting for a slot', C.yellow],
      [180, 300, 'Processing the prompt', C.blue],
    ]) {
      api.text(ctx, label, x((start + end) / 2), 400, 29, color, 'center');
      api.rect(ctx, x(start), 425, x(end) - x(start) - 3, 52, C.panel, color, 3);
      if (now > start)
        api.rect(ctx, x(start), 425, x(Math.min(end, now)) - x(start), 52, color, undefined, 3);
    }
    api.line(ctx, x(0), 575, x(500), 575, C.muted, 3);
    api.text(ctx, '0 ms', x(0), 635, 31, C.muted);
    api.text(ctx, '180 ms', x(180), 635, 31, C.muted, 'center');
    for (let i = 0; i < times.length; i++) {
      if (now < times[i]) continue;
      const at = x(times[i]);
      api.circle(ctx, at, 575, 11, C.cyan);
      api.text(ctx, times[i] + ' ms', at, 635 + (i % 2) * 56, 29, C.ink, 'center');
      if (i) {
        api.line(ctx, x(times[i - 1]) + 14, 770, at - 14, 770, C.cyan, 4);
        api.text(
          ctx,
          gaps[i - 1] + ' ms',
          x((times[i] + times[i - 1]) / 2),
          829,
          30,
          C.cyan,
          'center',
        );
      }
    }
  });
  api.focus.target('clock-result', () => {
    const mean = afterClause(state, 'mean-gap', 2, 0.63);
    const first = afterClause(state, 'first-delivery', 0, 0.77);
    const message = mean
      ? 'Mean gap  =  (500 − 300) / 3  =  ' + tpot.toFixed(1) + ' ms'
      : first
        ? 'Time to first token  =  ' + ttft + ' ms'
        : 'Time from server arrival to first token';
    api.text(ctx, message, 960, 948, 43, C.ink, 'center');
  });
}
export default {
  id: 'token-clocks',
  draw: drawTokenClocks,
  cues: ['first-delivery', 'later-deliveries', 'mean-gap'],
};
