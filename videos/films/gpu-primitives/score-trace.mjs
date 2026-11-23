import { exclusive } from './arithmetic.mjs';
import { text } from './defaults.mjs';

export const signed = (value) => (value > 0 ? '+' + value : String(value).replace('-', '−'));
export const number = (value) => String(value).replace('-', '−');
export const boundaryX = (index) => 252 + 181 * index;
export const scoreY = (value) => 735 - 28 * value;

// The same vertical scale applies to the opening, both local scans and the replay.
export function boundaries(row) {
  return [...exclusive(row), row.reduce((sum, value) => sum + value, 0)];
}

export function cue(state, id, beat, from, to) {
  if (state.beat < beat) return 0;
  if (state.beat > beat) return 1;
  const measured = state.cues?.[id];
  if (measured) return measured.progress;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - from) / (to - from)));
}

export function after(state, id, beat, fallback) {
  if (state.beat !== beat) return state.beat > beat;
  return state.cues?.[id] ? state.cues[id].phase === 'after' : state.beatP >= fallback;
}

export function plays(ctx, api, row, { marked = [], split = false, pad = false } = {}) {
  const { C } = api;
  text(ctx, api, 'Play', 145, 271, 34, C.muted);
  const slots = pad ? [...row, null] : row;
  slots.forEach((value, i) => {
    const x = boundaryX(i) + 90.5;
    const color = marked.includes(i) ? C.yellow : value === null ? C.muted : C.ink;
    api.rect(ctx, x - 77, 219, 154, 79, C.panel, color, 9);
    text(
      ctx,
      api,
      value === null ? 'pad 0' : signed(value),
      x,
      271,
      value === null ? 30 : 44,
      color,
    );
  });
  if (split) {
    const x = boundaryX(4);
    api.line(ctx, x, 202, x, 306, C.yellow, 3);
    text(ctx, api, 'Block A', boundaryX(2), 200, 30, C.blue);
    text(ctx, api, 'Block B', boundaryX(6), 200, 30, C.cyan);
  }
}

export function axes(ctx, api) {
  const { C } = api;
  text(ctx, api, 'Points', 100, 362, 32, C.muted, 'left');
  for (const tick of [-4, 0, 4, 8, 12]) {
    const y = scoreY(tick);
    api.line(
      ctx,
      boundaryX(0) - 15,
      y,
      boundaryX(8) + 32,
      y,
      tick === 0 ? '#656b77' : '#303642',
      tick === 0 ? 3 : 2,
    );
    text(ctx, api, number(tick), boundaryX(0) - 40, y + 10, 29, C.muted, 'right');
  }
}

// Follow the polyline through completed plays, including a fractional last segment.
export function trace(
  ctx,
  api,
  scores,
  { start = 0, offset = 0, steps = scores.length - 1, color, dots = true },
) {
  const limit = Math.min(steps, scores.length - 1);
  for (let i = 0; i < limit; i++) {
    const part = Math.min(1, limit - i);
    const endScore = scores[i] + part * (scores[i + 1] - scores[i]);
    api.line(
      ctx,
      boundaryX(start + i),
      scoreY(offset + scores[i]),
      boundaryX(start + i + part),
      scoreY(offset + endScore),
      color,
      7,
    );
  }
  if (dots) {
    for (let i = 0; i <= limit; i++) {
      api.circle(ctx, boundaryX(start + i), scoreY(offset + scores[i]), 9, color);
    }
  }
}

export function mark(ctx, api, index, score, label, color, below = false) {
  const x = boundaryX(index),
    y = scoreY(score);
  api.circle(ctx, x, y, 13, api.C.bg, color, 5);
  const baseline = below ? y + 49 : y - 24;
  const width = label.length * 23 + 12;
  api.rect(ctx, x - width / 2, baseline - 33, width, 40, api.C.bg, undefined, 4);
  text(ctx, api, label, x, baseline, 36, color);
}
