import { drawText } from './defaults.mjs';

// Storyboard samples use the order of cues within a beat. Delivery supplies word timing.
export function sceneCues(scene, state) {
  function read(id) {
    if (state.cues) {
      const cue = state.cues[id];
      if (!cue) throw new Error(`Missing cue ${scene.id}/${id}`);
      return cue;
    }
    for (const [beat, entry] of scene.beats.entries()) {
      const cues = entry.visual_cues ?? [];
      const index = cues.findIndex((cue) => cue.id === id);
      if (index < 0) continue;
      const position = ((state.beat ?? 0) - beat + (state.beatP ?? 0)) * cues.length - index;
      return {
        phase: position < 0 ? 'before' : position >= 1 ? 'after' : 'during',
        progress: Math.max(0, Math.min(1, position)),
      };
    }
    throw new Error(`Unknown cue ${scene.id}/${id}`);
  }
  return {
    at: (id) => read(id).phase !== 'before',
    done: (id) => read(id).phase === 'after',
    p: (id) => read(id).progress,
  };
}

const left = 145;
const right = 1775;
export const replyX = (ms, duration) => left + (ms / duration) * (right - left);

function wrapChunk(chunk) {
  const words = chunk.text.trim().split(' ');
  if (words.length < 4 && chunk.text.trim().length < 20) return words.join(' ');
  const split = Math.ceil(words.length / 2);
  return words.slice(0, split).join(' ') + '\n' + words.slice(split).join(' ');
}

export function replyStrip(
  ctx,
  api,
  chunks,
  { y, available = chunks.at(-1).endMs, keptThrough, offsets = false },
) {
  const duration = chunks.at(-1).endMs;
  const { C } = api;
  let start = 0;
  for (const chunk of chunks) {
    const x = replyX(start, duration);
    const end = replyX(chunk.endMs, duration);
    const width = end - x;
    const received = Math.max(0, Math.min(available, chunk.endMs) - start);
    const decided = keptThrough !== undefined;
    const color = decided ? (chunk.endMs <= keptThrough ? C.green : C.muted) : C.cyan;
    api.line(ctx, x + 3, y + 120, end - 3, y + 120, C.panel, 13);
    if (received > 0) {
      const head = x + (received / (chunk.endMs - start)) * (width - 6);
      api.line(ctx, x + 3, y + 120, head + 3, y + 120, color, 12);
    }
    if (available >= chunk.endMs) {
      const label = wrapChunk(chunk);
      drawText(
        ctx,
        api,
        label,
        (x + end) / 2,
        y + (label.includes('\n') ? 43 : 67),
        38,
        decided ? color : C.ink,
        'center',
      );
    }
    if (available >= chunk.endMs) {
      api.line(ctx, end, y + 134, end, y + 152, C.muted, 2);
      const seam = offsets ? `${chunk.endMs} ms / char ${chunk.endChar}` : `${chunk.endMs} ms`;
      drawText(ctx, api, seam, end, y + 191, 28, C.muted, 'right');
    }
    start = chunk.endMs;
  }
}

export function receiptLane(ctx, api, { y, duration, cursor, label, color = api.C.green }) {
  api.line(ctx, left, y, right, y, api.C.panel, 10);
  drawText(ctx, api, label, left, y - 29, 32, color);
  if (cursor === null) return;
  const x = replyX(cursor, duration);
  if (cursor > 0) api.line(ctx, left, y, x, y, color, 10);
  api.circle(ctx, x, y, 10, color);
  drawText(
    ctx,
    api,
    `${Math.round(cursor)} ms`,
    x,
    y + 58,
    32,
    color,
    x < left + 90 ? 'left' : 'center',
  );
}

export function stopMark(ctx, api, ms, duration, y, text) {
  const x = replyX(ms, duration);
  api.line(ctx, x, y, x, y + 30, api.C.pink, 5);
  api.circle(ctx, x, y, 8, api.C.pink);
  drawText(ctx, api, text, x + 18, y + 27, 29, api.C.pink);
}
