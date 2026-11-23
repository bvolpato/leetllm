export const CARD_GB = 80;
const start = 420;
const pixelsPerGB = 9;

export function gbX(gigabytes) {
  return start + gigabytes * pixelsPerGB;
}

// The storyboard uses the fallback only when a measured narration clock is absent.
export function onWords(state, api, beat, cue, from = 0.1, to = 0.6) {
  if (state.beat < beat) return 0;
  if (state.beat > beat) return 1;
  return api.focus.progress(cue, api.phase(state.beatP ?? 0, from, to));
}

export function memoryAxis(ctx, api, y, bottom) {
  const { C } = api;
  api.line(ctx, start, y, gbX(150), y, C.muted, 2);
  for (const value of [0, 40, 80, 120]) {
    const x = gbX(value);
    const isLimit = value === CARD_GB;
    api.line(ctx, x, y - 9, x, y + 9, isLimit ? C.yellow : C.muted, 3);
    api.text(ctx, isLimit ? '80 GB per card' : value + ' GB', x, y - 27, isLimit ? 34 : 27,
      isLimit ? C.yellow : C.muted, 'center');
  }
  api.line(ctx, gbX(CARD_GB), y + 10, gbX(CARD_GB), bottom, C.yellow, 3);
}

// A bar is the requested allocation. The usable memory track stops at the device limit.
export function memoryRow(ctx, api, y, label, segments) {
  const { C } = api;
  api.text(ctx, label, start - 35, y + 53, 37, C.ink, 'right');
  api.rect(ctx, start, y, pixelsPerGB * CARD_GB, 80, C.panel, undefined, 0);
  api.line(ctx, start, y + 80, gbX(CARD_GB), y + 80, C.muted, 2);
  let used = 0;
  for (const [gb, color] of segments) {
    if (gb > 0) {
      api.rect(ctx, gbX(used), y + 11, pixelsPerGB * gb, 58, color, undefined, 0);
      used += gb;
    }
  }
  const limit = gbX(CARD_GB);
  api.line(ctx, limit, y - 5, limit, y + 85, C.yellow, 4);
}
