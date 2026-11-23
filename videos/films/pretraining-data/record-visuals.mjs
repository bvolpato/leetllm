export function sourceColor(C, source) {
  if (source === 'Code') return C.pink;
  if (source === 'Docs') return C.cyan;
  return C.blue;
}

// All scores and both cutoff choices use the same horizontal scale.
export function scoreRuler(ctx, api, rows, { cutoff, choices = [], statuses = false }) {
  const { C } = api;
  const left = 805,
    width = 935,
    top = 322,
    bottom = 785;
  const at = (score) => left + width * score;
  api.text(ctx, 'Classifier score', left, 243, 35, C.ink);
  api.line(ctx, left, top, at(1), top, C.muted, 3);
  for (const value of [0, 0.25, 0.5, 0.75, 1]) {
    api.line(ctx, at(value), top - 8, at(value), top + 8, C.muted, 3);
    api.text(ctx, value.toFixed(2), at(value), top - 22, 27, C.muted, 'center');
  }
  if (cutoff !== null) {
    api.rect(
      ctx,
      at(cutoff),
      top + 13,
      width * (1 - cutoff),
      bottom - top - 13,
      C.panel,
      undefined,
      0,
    );
    api.line(ctx, at(cutoff), top + 13, at(cutoff), top + 43, C.yellow, 4);
    api.line(ctx, at(cutoff), bottom - 26, at(cutoff), bottom, C.yellow, 4);
    api.text(ctx, 'Cutoff ' + cutoff.toFixed(2), at(cutoff), bottom + 48, 34, C.yellow, 'center');
  } else {
    for (const value of choices) {
      api.line(ctx, at(value), bottom - 38, at(value), bottom, C.yellow, 3);
      api.text(ctx, value.toFixed(2), at(value), bottom + 48, 34, C.yellow, 'center');
    }
  }
  rows.forEach(({ record, label, detail, visible = true }, i) => {
    if (!visible) return;
    const y = 425 + i * (rows.length === 2 ? 200 : 138);
    const color = sourceColor(C, record.source);
    const keep = cutoff === null || record.score >= cutoff;
    const ink = statuses && !keep ? C.muted : color;
    api.text(ctx, label, 145, y - 8, 42, ink);
    api.text(ctx, detail, 145, y + 43, 32, C.ink);
    api.line(ctx, left, y, at(1), y, C.muted, 2);
    if (cutoff !== null) api.line(ctx, at(cutoff), y - 16, at(cutoff), y + 14, C.yellow, 4);
    api.circle(ctx, at(record.score), y, 12, ink);
    api.text(ctx, record.score.toFixed(2), at(record.score), y - 25, 31, ink, 'center');
    if (statuses) {
      api.text(
        ctx,
        keep ? 'Keep' : 'Remove',
        at(record.score),
        y + 48,
        30,
        keep ? C.green : C.muted,
        'center',
      );
    }
  });
}

export function tokenStrip(ctx, api, record, x, y, width, { removed = false, detail } = {}) {
  const { C } = api;
  const color = removed ? C.muted : sourceColor(C, record.source);
  api.rect(ctx, x + 3, y, width - 6, 112, C.panel, color, 7);
  api.rect(ctx, x + 5, y + 2, width - 10, 8, color, undefined, 1);
  const center = x + width / 2;
  const title = record.id === 'C' && record.source === 'Code' ? 'C · code' : record.id;
  api.text(ctx, title, center, y + 56, 39, color, 'center');
  api.text(ctx, detail ?? record.tokens + ' tokens', center, y + 95, 28, C.ink, 'center');
}
