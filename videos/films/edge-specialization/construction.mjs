import { createHash } from 'node:crypto';
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function edgeCue(state, id, kind = 'progress') {
  const c = state.cues?.[id];
  if (c)
    return kind === 'done'
      ? c.phase === 'after'
      : c.phase === 'before'
        ? 0
        : c.phase === 'after'
          ? 1
          : clamp(c.progress ?? 0);
  return kind === 'done' ? (state.beatP ?? 0) > 0.85 : clamp(((state.beatP ?? 0) - 0.08) / 0.8);
}
