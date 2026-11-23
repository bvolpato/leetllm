import { checkpoint } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const phase = (p) => Math.max(0, Math.min(1, (p - 0.1) / 0.72));
export const sum = (xs) => xs.reduce((a, v) => a + v, 0);
export function xor(a, z) {
  assert.equal(a.length, z.length);
  return a.map((v, i) => v ^ z[i]);
}
export function update(s, g) {
  const velocity = 0.9 * s.velocity + g;
  return {
    weight: s.weight - 0.1 * velocity,
    velocity,
    step: s.step + 1,
  };
}
export const uninterrupted = [0.2, -0.5].reduce(update, checkpoint);
export const cueProgress = (state, id, beat, fallback) => {
  if ((state.beat ?? 0) < beat) return 0;
  if ((state.beat ?? 0) > beat) return 1;
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'after'
      ? 1
      : cue.phase === 'before'
        ? 0
        : Math.max(0, Math.min(1, cue.progress))
    : fallback;
};
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const lerp = (a, z, p) => a + (z - a) * clamp(p);
export function momentumTrace(checkpointState, gradients, rate = 0.2, beta = 0.9) {
  const result = [
    {
      ...checkpointState,
    },
  ];
  for (const gradient of gradients) {
    const previous = result.at(-1),
      velocity = beta * previous.velocity + gradient;
    result.push({
      weight: previous.weight - rate * velocity,
      velocity,
      step: previous.step + 1,
      gradient,
    });
  }
  return result;
}
