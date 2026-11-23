// Positions in these strips count tokens from the start of a single request.
export function pageGeometry(pages, pageSize) {
  const left = 130;
  const gap = 54;
  const pageWidth = (1660 - (pages.length - 1) * gap) / pages.length;
  const slotWidth = pageWidth / pageSize;
  const start = (entry) => left + entry * (pageWidth + gap);
  const slot = (index) => start(Math.floor(index / pageSize)) + (index % pageSize) * slotWidth;
  return { start, slot, slotWidth, pageWidth };
}

export function tile(api, label, x, y, width, height, stroke, ink = api.C.ink, size = 36) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: size,
    padding: 6,
    fill: api.C.panel,
    stroke,
    textColor: ink,
  });
}

export function bracket(ctx, api, left, right, y, color) {
  api.path(
    ctx,
    [
      { x: left, y: y - 13 },
      { x: left, y },
      { x: right, y },
      { x: right, y: y - 13 },
    ],
    { color, width: 4 },
  );
}

export function cachePicture(ctx, api, { pages, pageSize, length, y = 415, style, pageLabel }) {
  const { C } = api;
  const geometry = pageGeometry(pages, pageSize);
  pages.forEach((page, entry) => {
    const x = geometry.start(entry);
    api.text(
      ctx,
      pageLabel?.(page) ?? `Page ${page}`,
      x + geometry.pageWidth / 2,
      y - 37,
      37,
      C.blue,
      'center',
    );
    for (let slot = 0; slot < pageSize; slot++) {
      const index = entry * pageSize + slot;
      const occupied = index < length;
      const {
        label = occupied ? `k${index}` : '·',
        color = occupied ? C.blue : C.muted,
        ink = occupied ? C.ink : C.muted,
      } = style?.(index, { page, slot, occupied }) ?? {};
      tile(api, label, geometry.slot(index) + 3, y, geometry.slotWidth - 6, 88, color, ink);
    }
  });
  return geometry;
}

export function clauseEnded(state, id, beat, fallback = 0.75) {
  if (state.beat !== beat) return state.beat > beat;
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : state.beatP >= fallback;
}
