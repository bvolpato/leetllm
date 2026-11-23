import { cueProgress, servingClock } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawGeneratorClock(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const shift = cueProgress(
    state.cues,
    'generator-send-delay',
    beat === 1 ? api.phase(p, 0.18, 0.55) : Number(beat > 1),
  );
  const g = servingClock(shift);
  const x = (t) => 375 + (t - g.scheduled) * 4.1;
  const revealed = state.cues?.['generator-verdict']
    ? state.cues['generator-verdict'].phase === 'after'
    : beat > 2 || (beat === 2 && p > 0.7);
  const showNumbers = beat === 0 || revealed;
  text(ctx, api, 'r04    ·    milliseconds on the client clock', 125, 283, 34, C.muted, 'left');
  text(ctx, api, 'Allowed send lag   20 ms', 1790, 283, 34, C.yellow, 'right');
  focus.target('generator-ruler', () => {
    api.line(ctx, x(g.scheduled), 566, x(g.first), 566, C.muted, 3);
    api.line(ctx, x(g.scheduled), 541, x(g.scheduled), 591, C.yellow, 5);
    text(ctx, api, 'Due ' + g.scheduled, x(g.scheduled), 655, 35, C.yellow);
    api.circle(ctx, x(g.sent), 566, 13, C.cyan);
    text(ctx, api, 'Sent ' + g.sent, x(g.sent), 505, 35, C.cyan);
    api.circle(ctx, x(g.first), 566, 13, C.pink);
    text(ctx, api, 'First token ' + g.first, x(g.first), 505, 35, C.pink);
    const spans = [
      [g.scheduled, g.sent, 721, C.yellow],
      [g.sent, g.first, 809, C.cyan],
    ];
    for (const [a, b, y, color] of spans) {
      api.line(ctx, x(a), y, x(b), y, color, 5);
      for (const xx of [x(a), x(b)]) api.line(ctx, xx, y - 9, xx, y + 9, color, 3);
    }
    text(
      ctx,
      api,
      showNumbers ? 'Send lag   ' + g.lag + ' ms' : 'Send lag',
      130,
      733,
      30,
      C.yellow,
      'left',
    );
    text(
      ctx,
      api,
      showNumbers ? 'First-token wait   ' + g.ttft + ' ms' : 'First-token wait',
      1050,
      878,
      37,
      C.cyan,
    );
  });
  if (revealed)
    text(ctx, api, 'Schedule failed   ·   ' + g.lag + ' ms exceeds 20 ms', 960, 1001, 37, C.red);
}
export default {
  id: 'generator-clock',
  draw: drawGeneratorClock,
  cues: ['generator-base', 'generator-send-delay', 'generator-verdict', 'generator-backpressure'],
};
