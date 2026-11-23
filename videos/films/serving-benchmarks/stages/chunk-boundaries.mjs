import { tokenTimes, tokenTerminalMs } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawChunkBoundaries(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat ?? 0;
  const motion = (id, i, a, b) =>
    cueProgress(state.cues, id, beat === i ? api.phase(state.beatP ?? 0, a, b) : Number(beat > i));
  const firstChunk = tokenTimes[2],
    lastChunk = tokenTimes.at(-1);
  const origin = 200;
  const now =
    origin +
    (firstChunk - origin) * motion('chunk-first', 0, 0.2, 0.75) +
    (lastChunk - firstChunk) * motion('chunk-next', 1, 0.05, 0.5) +
    (tokenTerminalMs - lastChunk) * motion('chunk-end', 2, 0.02, 0.42);
  const x = (t) => 480 + (t - origin) * 4;
  const words = ['The', 'answer', 'is', '42', '.'];
  for (const y of [443, 686]) {
    api.line(ctx, x(origin), y, x(tokenTerminalMs), y, C.muted, 2);
    api.line(ctx, x(origin), y, x(now), y, C.ink, 3);
  }
  focus.target('chunk-tokens', () => {
    text(ctx, api, 'Token trace', 125, 454, 38, C.cyan, 'left');
    tokenTimes.forEach((t, i) => {
      if (t > now) return;
      text(ctx, api, words[i], x(t), 397, 38, C.cyan);
      api.circle(ctx, x(t), 443, 12, C.cyan);
      text(ctx, api, String(t), x(t), 503, 32, C.ink);
    });
  });
  focus.target('chunk-client', () => {
    text(ctx, api, 'Client stream', 125, 698, 38, C.yellow, 'left');
    for (const [t, label] of [
      [firstChunk, '“The answer is”'],
      [lastChunk, '“42.”'],
    ]) {
      if (t > now) continue;
      api.circle(ctx, x(t), 686, 12, C.yellow);
      text(ctx, api, label, x(t), 633, 38, C.yellow);
      text(ctx, api, String(t), x(t), 750, 32, C.ink);
    }
    if (now >= tokenTerminalMs) {
      api.line(ctx, x(now), 657, x(now), 723, C.pink, 5);
      text(ctx, api, '500 ms · done', x(now), 811, 31, C.pink);
    }
  });
  text(ctx, api, 'Time since send (ms)', 125, 278, 32, C.muted, 'left');
  text(ctx, api, 'Visible reply', 125, 946, 32, C.muted, 'left');
  text(
    ctx,
    api,
    now < firstChunk ? '…' : now < lastChunk ? 'The answer is' : 'The answer is 42.',
    480,
    950,
    51,
    C.ink,
    'left',
  );
}
export default {
  id: 'chunk-boundaries',
  draw: drawChunkBoundaries,
  cues: ['chunk-first', 'chunk-next', 'chunk-end'],
};
