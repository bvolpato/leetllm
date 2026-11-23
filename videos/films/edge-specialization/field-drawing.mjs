import { clamp } from './construction.mjs';

// Production supplies word-timed cues. A storyboard can also sample a beat by fraction.
export function cueProgress(state, id, beat, from = 0.15, until = 0.75) {
  const cue = state.cues?.[id];
  if (cue) return cue.progress;
  const current = state.beat ?? 0;
  if (current !== beat) return current > beat ? 1 : 0;
  return clamp(((state.beatP ?? 0) - from) / (until - from));
}

export function fieldDrawing(ctx, api) {
  const { C } = api;
  return {
    C,
    text: (value, x, y, size = 34, color = C.ink, align = 'left') =>
      api.text(ctx, String(value), x, y, size, color, align),
    rect: (x, y, width, height, fill, stroke, radius = 0) =>
      api.rect(ctx, x, y, width, height, fill, stroke, radius),
    line: (x, y, toX, toY, color = C.muted, width = 2) =>
      api.line(ctx, x, y, toX, toY, color, width),
    dot: (x, y, r, color) => api.circle(ctx, x, y, r, color),
    target: (id, draw) => api.focus.target(id, draw),
  };
}
