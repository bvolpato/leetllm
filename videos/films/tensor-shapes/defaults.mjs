import { sentenceWords } from './fixtures.mjs';
export function text(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 42, color = api.C.ink, align = 'center') {
  return api.math(ctx, v, x, y, size, color, align);
}
export function target(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function caption(ctx, api, v) {
  return text(ctx, api, v, 960, 1010, 25, api.C.muted, 'center');
}
export function card(ctx, api, label, x, y, width = 500, color = api.C.blue) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height: 84,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 29,
    padding: 12,
  });
}
export function numberGrid(
  ctx,
  api,
  rows,
  x,
  y,
  width,
  height,
  color = api.C.blue,
  id = 'grid',
  extra = {},
) {
  return target(ctx, api, id, () =>
    api.teaching.grid({
      x,
      y,
      width,
      height,
      rows: rows.length,
      columns: rows[0].length,
      labels: rows,
      fill: api.C.panel,
      stroke: color,
      textColor: api.C.ink,
      fontSize: 31,
      padding: 8,
      cellFocusTarget: (r, c) => id + '-' + r + '-' + c,
      ...extra,
    }),
  );
}
export function wordNames(ctx, api, words, x, y, rowHeight, color) {
  return words.forEach((word, i) =>
    text(ctx, api, word, x, y + rowHeight * (i + 0.5) + 10, 27, color, 'right'),
  );
}
export function brace(ctx, api, x, y, width, label, color) {
  api.line(ctx, x, y, x + width, y, color, 3);
  api.line(ctx, x, y - 10, x, y + 10, color, 3);
  api.line(ctx, x + width, y - 10, x + width, y + 10, color, 3);
  equation(ctx, api, label, x + width / 2, y + 48, 32, color);
}
export function vertical(ctx, api, x, y, height, label, color) {
  api.line(ctx, x, y, x, y + height, color, 3);
  api.line(ctx, x - 10, y, x + 10, y, color, 3);
  api.line(ctx, x - 10, y + height, x + 10, y + height, color, 3);
  text(ctx, api, label, x - 18, y + height / 2 + 8, 25, color, 'right');
}
export function drawScoreMatrix(
  ctx,
  api,
  x,
  y,
  cellWidth,
  cellHeight,
  visibleCells,
  focusTarget,
  words = sentenceWords[0],
  highlightedRow = 1,
) {
  return target(ctx, api, focusTarget, () => {
    const values = new Map(visibleCells.map((cell) => [cell.row + '-' + cell.column, cell.value]));
    text(ctx, api, 'query ↓', x - 76, y - 28, 23, api.C.blue, 'center');
    text(ctx, api, 'key →', x + cellWidth * 1.5, y - 73, 23, api.C.pink, 'center');
    words.forEach((word, c) =>
      text(
        ctx,
        api,
        word,
        x + c * cellWidth + (cellWidth - 8) / 2,
        y - 34,
        24,
        api.C.pink,
        'center',
      ),
    );
    words.forEach((word, r) => {
      text(
        ctx,
        api,
        word,
        x - 24,
        y + r * cellHeight + (cellHeight - 8) / 2 + 8,
        24,
        r === highlightedRow ? api.C.yellow : api.C.blue,
        'right',
      );
      for (let c = 0; c < 3; c++)
        api.components.card({
          label: String(values.get(r + '-' + c) ?? ''),
          x: x + c * cellWidth,
          y: y + r * cellHeight,
          width: cellWidth - 8,
          height: cellHeight - 8,
          fill: api.C.panel,
          stroke: r === highlightedRow ? api.C.yellow : api.C.blue,
          textColor: r === highlightedRow ? api.C.yellow : api.C.ink,
          fontSize: 28,
          padding: 8,
        });
    });
  });
}

// Keep the input at one address on screen when the head experiment returns.
export function wordTable(
  ctx,
  api,
  batch,
  rows,
  { pairs = [], split = 0, visibleFeatures = 4 } = {},
) {
  const { C } = api;
  const x = 305,
    y = 405,
    width = 520,
    rowHeight = 110;
  text(ctx, api, 'Sentence ' + batch + '  ·  input', x + width / 2, 310, 33, C.ink, 'center');
  wordNames(ctx, api, sentenceWords[batch], x - 25, y, rowHeight, C.ink);
  const labels = rows.map((row) =>
    row.map((value, column) => (column < visibleFeatures ? value : '')),
  );
  numberGrid(ctx, api, labels, x, y, width, rowHeight * rows.length, C.blue, 'word-features', {
    fontSize: 40,
    highlights: pairs.flatMap(({ row, first, color }) =>
      [first, first + 1].map((column) => ({ row, column, fill: C.panel, stroke: color })),
    ),
  });
  if (split > 0) {
    const seam = x + width / 2;
    api.line(ctx, seam, y - 14, seam, y - 14 + split * (rowHeight * rows.length + 28), C.yellow, 5);
  }
}
