export const cueBegun = (cues, id, fallback) =>
  cues?.[id] ? cues[id].phase !== 'before' : fallback;

export function phraseProgress(state, id, beat, start = 0.12, end = 0.72) {
  const cue = state.cues?.[id];
  if (cue) {
    if (cue.phase === 'before') return 0;
    if (cue.phase === 'after') return 1;
    return cue.progress;
  }
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return Math.max(0, Math.min(1, ((state.beatP ?? 0) - start) / (end - start)));
}

export function wordShares(ctx, api, probabilities, y, reveal = 1) {
  const { cyan, blue, muted } = api.C;
  const x = 200,
    width = 1520,
    split = width * probabilities[0];
  api.line(ctx, x, y + 32, x + width, y + 32, muted, 2);
  if (reveal > 0) {
    api.rect(ctx, x, y, split * reveal, 64, cyan, undefined, 0);
    api.rect(
      ctx,
      x + width - (width - split) * reveal,
      y,
      (width - split) * reveal,
      64,
      blue,
      undefined,
      0,
    );
  }
  api.line(ctx, x + width / 2, y + 65, x + width / 2, y + 85, muted, 3);
  api.text(ctx, '½', x + width / 2, y + 123, 32, muted, 'center');
  const label = (word, p) => (reveal >= 1 ? word + '   ' + (100 * p).toFixed(1) + '%' : word);
  api.text(ctx, label('reef', probabilities[0]), x, y - 16, 44, cyan);
  api.text(ctx, label('tree', probabilities[1]), x + width, y - 16, 44, blue, 'right');
}
