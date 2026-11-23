import { clamp } from './arithmetic.mjs';

export function sceneClock(state) {
  function progress(id, beat, from = 0, until = 1) {
    if (state.beat < beat) return 0;
    if (state.beat > beat) return 1;
    return state.cues?.[id]?.progress ?? clamp((state.beatP - from) / (until - from));
  }
  function after(id, beat, from, until) {
    if (state.beat !== beat) return state.beat > beat;
    const cue = state.cues?.[id];
    return cue?.phase ? cue.phase === 'after' : progress(id, beat, from, until) >= 1;
  }
  return { progress, after };
}

// Each cell keeps its physical location when a view changes.
export function storageStrip(ctx, api, values, selected, cursor) {
  const left = 355, width = 1380, cell = width / values.length;
  const center = (index) => left + (index + 0.5) * cell;
  api.text(ctx, 'Offset', left - 30, 365, 31, api.C.muted, 'right');
  api.text(ctx, 'Storage', left - 30, 460, 35, api.C.blue, 'right');
  values.forEach((value, i) => {
    const used = selected.includes(i);
    api.text(ctx, String(i), center(i), 365, 30, api.C.muted, 'center');
    api.rect(ctx, left + i * cell + 3, 391, cell - 6, 110, api.C.panel, used ? api.C.cyan : api.C.blue, 5);
    api.text(ctx, String(value), center(i), 464, 48, used ? api.C.cyan : api.C.ink, 'center');
  });
  if (cursor !== undefined) {
    const x = center(cursor);
    api.arrow(ctx, x, 564, x, 513, api.C.yellow, 5);
  }
}

export function worksheetRow(ctx, api, values, { x, y, width, color, selected = -1 }) {
  const cell = width / values.length;
  values.forEach((value, i) => {
    const stroke = i === selected ? api.C.yellow : color;
    api.rect(ctx, x + i * cell + 4, y, cell - 8, 86, api.C.panel, stroke, 6);
    api.text(ctx, String(value), x + (i + 0.5) * cell, y + 57, 40, stroke, 'center');
  });
}
