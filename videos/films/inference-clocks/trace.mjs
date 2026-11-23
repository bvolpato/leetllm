import { clamp } from './construction.mjs';

// Storyboards use beat fractions. The delivered picture uses the spoken phrase boundaries.
export function passage(state, beat, cue, start = 0.12, end = 0.72) {
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  if (state.cues) return state.cues[cue]?.progress ?? 0;
  return clamp(((state.beatP ?? 0) - start) / (end - start));
}

export function spoken(state, beat, cue, end = 0.72) {
  if (state.beat !== beat) return state.beat > beat;
  return state.cues ? state.cues[cue]?.phase === 'after' : state.beatP >= end;
}

export function scaleTime(start, end, left, right) {
  return (t) => left + ((t - start) / (end - start)) * (right - left);
}

export function bracket(ctx, api, x1, x2, y, color, label, size = 34) {
  api.line(ctx, x1, y, x2, y, color, 4);
  api.line(ctx, x1, y - 14, x1, y + 4, color, 4);
  api.line(ctx, x2, y - 14, x2, y + 4, color, 4);
  if (label) api.text(ctx, label, (x1 + x2) / 2, y + 50, size, color, 'center');
}

export function tokenMark(ctx, api, x, y, name, time, color) {
  api.circle(ctx, x, y, 11, color);
  api.text(ctx, name, x, y - 37, 32, color, 'center');
  api.text(ctx, String(time), x, y + 58, 30, api.C.ink, 'center');
}
