// Source coordinates stay fixed even when the budget or the returned spans change.
export function drawPacking(ctx, api, {
  run, page, maximum, sourceHits, rows, charged, message, resultColor,
  overlapEmphasis = 0, candidate, pending = false,
}) {
  const { C, rect, line, text } = api;
  const left = 325;
  const right = 1800;
  const weights = run.words.map(word => Math.max(4, word.length + 2));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const edges = [left];
  for (const weight of weights) edges.push(edges.at(-1) + (right - left) * weight / total);
  const x = (i) => edges[i];
  const center = (i) => (x(i) + x(i + 1)) / 2;
  const color = (span) => span.start === 0 && span.end === run.words.length
    ? C.green : span.start === 0 ? C.blue : C.cyan;

  text(ctx, page, 120, 243, 31, C.muted);
  text(ctx, 'Source words', 120, 341, 28, C.muted);
  const commonStart = Math.max(...sourceHits.map(hit => hit.start));
  const commonEnd = Math.min(...sourceHits.map(hit => hit.end));
  run.words.forEach((word, i) => {
    const shared = overlapEmphasis > 0 && i >= commonStart && i < commonEnd;
    text(ctx, word, center(i), 342, 33, shared ? C.yellow : C.ink, 'center');
    text(ctx, i + 1, center(i), 385, 23, shared ? C.yellow : C.muted, 'center');
  });
  if (overlapEmphasis > 0 && commonStart < commonEnd)
    line(ctx, x(commonStart), 355, api.lerp(x(commonStart), x(commonEnd), overlapEmphasis), 355, C.yellow, 3);
  sourceHits.forEach((hit, rank) => {
    const y = 417 + rank * 42;
    const start = x(hit.start) + 2;
    const end = x(hit.end) - 2;
    line(ctx, start, y, end, y, color(hit), 4);
    line(ctx, start, y - 8, start, y + 8, color(hit), 3);
    line(ctx, end, y - 8, end, y + 8, color(hit), 3);
    text(ctx, 'Rank ' + (rank + 1), 217, y + 9, 25, color(hit), 'right');
  });

  const heading = rows.some(row => row.pending) ? 'Packing the two hits'
    : pending ? 'Passage under consideration' : 'Text sent to the model';
  text(ctx, heading, 120, 550, 38, C.ink);
  for (const [index, row] of rows.entries()) {
    const y = 592 + index * 84;
    const undecided = pending || row.pending;
    text(ctx, row.name, 120, y + 42, 29, row.span && !undecided ? color(row.span) : C.muted);
    if (!row.span) {
      line(ctx, left, y + 29, right, y + 29, C.muted, 1);
      continue;
    }
    const span = row.span;
    const progress = row.progress ?? 1;
    // Move the complete strip into place as a unit. It always quotes a real slice.
    api.components.fade(progress, () => {
      const top = y - (1 - progress) * 20;
      const stroke = undecided ? C.muted : color(span);
      rect(ctx, x(span.start) + 2, top, x(span.end) - x(span.start) - 4, 61, C.panel, stroke, 5);
      run.words.slice(span.start, span.end).forEach((word, i) =>
        text(ctx, word, center(span.start + i), top + 41, 30, C.ink, 'center'));
    });
  }

  const meterLeft = 325;
  const unit = (right - meterLeft) / maximum;
  const used = charged.reduce((sum, span) => sum + span.length, 0);
  text(ctx, 'Evidence space', 120, 829, 29, C.muted);
  const budgetLabel = candidate
    ? 'Whole parent: ' + candidate.length + ' words   /   available: ' + run.budget
    : used + ' of ' + run.budget + ' words used';
  text(ctx, budgetLabel, 1800, 828, 32, C.ink, 'right');
  let cursor = 0;
  for (const span of charged) {
    rect(ctx, meterLeft + cursor * unit + 2, 852, span.length * unit - 4, 41, color(span), undefined, 3);
    cursor += span.length;
  }
  for (let i = used; i < run.budget; i++)
    rect(ctx, meterLeft + i * unit + 2, 852, unit - 4, 41, C.panel, C.muted, 3);
  if (candidate) {
    // The neutral ticks show the proposed cost, including any words past the stop.
    for (let i = 0; i < candidate.length; i++)
      rect(ctx, meterLeft + i * unit + 5, 864, unit - 10, 18, C.muted, undefined, 2);
  }
  const stop = meterLeft + run.budget * unit;
  line(ctx, stop, 843, stop, 904, C.yellow, 5);
  if (message) text(ctx, message, 960, 984, 37, resultColor ?? C.ink, 'center');
}
