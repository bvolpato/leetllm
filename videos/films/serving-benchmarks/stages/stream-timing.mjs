import { tokenTimes, tokenTerminalMs, gaps } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawStreamTiming(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const phase = (id, i, a, b) =>
    cueProgress(state.cues, id, beat === i ? api.phase(state.beatP ?? 0, a, b) : Number(beat > i));
  const first = tokenTimes[0],
    last = tokenTimes.at(-1);
  const elapsed =
    first * phase('stream-first', 0, 0.15, 0.72) +
    (last - first) * phase('stream-rest', 1, 0.01, 0.55) +
    (tokenTerminalMs - last) * phase('stream-done', 2, 0.15, 0.55);
  const x = (time) => 250 + time * 2.81;
  const y = 550;
  text(ctx, api, 'r01    ·    client clock (ms)', 125, 283, 35, C.muted, 'left');
  api.line(ctx, x(0), y, x(tokenTerminalMs), y, C.muted, 3);
  api.line(ctx, x(0), y, x(elapsed), y, C.cyan, 6);
  focus.target('stream-start', () => {
    api.circle(ctx, x(0), y, 11, C.cyan);
    text(ctx, api, 'Send', x(0), y - 48, 34, C.cyan);
    text(ctx, api, '0', x(0), y + 63, 33, C.ink);
  });
  focus.target('stream-arrivals', () => {
    text(ctx, api, 'Observed tokens', 1220, 363, 35, C.cyan);
    tokenTimes.forEach((t, i) => {
      if (elapsed < t) return;
      if (i > 0)
        text(
          ctx,
          api,
          gaps[i - 1] + ' ms',
          (x(t) + x(tokenTimes[i - 1])) / 2,
          y - 95,
          28,
          C.yellow,
        );
      api.circle(ctx, x(t), y, 13, C.cyan);
      text(ctx, api, 'T' + (i + 1), x(t), y - 34, 29, C.cyan);
      text(ctx, api, String(t), x(t), y + 63, 33, C.ink);
    });
  });
  if (elapsed >= tokenTerminalMs) {
    api.line(ctx, x(tokenTerminalMs), y - 25, x(tokenTerminalMs), y + 42, C.pink, 5);
    text(ctx, api, 'Terminal', x(tokenTerminalMs) + 22, y + 22, 31, C.pink, 'left');
    text(ctx, api, tokenTerminalMs + ' ms', x(tokenTerminalMs), y + 125, 32, C.pink);
  }
  const metrics = [
    ['First token', first + ' ms', phase('stream-first', 0, 0.15, 0.72) >= 1],
    [
      'Mean of four gaps',
      (last - first) / gaps.length + ' ms',
      phase('stream-mean', 1, 0.7, 0.9) >= 1,
    ],
    ['Terminal completion', tokenTerminalMs + ' ms', elapsed >= tokenTerminalMs],
  ];
  metrics.forEach(([label, value, show], i) => {
    if (!show) return;
    const xx = 365 + 580 * i;
    text(ctx, api, label, xx, 849, 32, C.muted);
    text(ctx, api, value, xx, 930, 52, i === 2 ? C.pink : C.ink);
  });
}
export default {
  id: 'stream-timing',
  draw: drawStreamTiming,
  cues: ['stream-first', 'stream-rest', 'stream-mean', 'stream-done'],
};
