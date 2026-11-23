export const cohort = Object.freeze({ byTen: 160, byFifteen: 200, size: 250 });
export const targetRank = Math.ceil(0.95 * cohort.size);
const columns = 25;
const firstRowY = 430;
const rowHeight = 36;
const edge = (count) => 192 + (1500 * count) / cohort.size;

export function drawCohort(
  ctx, api, timely, later, unfinished, { includeLater = false, excluded = 0 } = {},
) {
  const { C } = api;
  const groups = [
    [0, cohort.byTen, timely, 'by 10 s', C.cyan],
    [cohort.byTen, cohort.byFifteen, later, 'after 10, by 15 s', includeLater ? C.cyan : C.blue],
    [cohort.byFifteen, cohort.size, unfinished, 'still running at 15 s', C.pink],
  ];
  groups.forEach(([start, end, known, name, color], group) => {
    const shift = start === cohort.byFifteen ? Math.round(260 * excluded) : 0;
    for (let i = start; i < end; i++) {
      const x = 280 + (i % columns) * 50 + shift;
      const y = firstRowY + Math.floor(i / columns) * rowHeight;
      const seen = i - start < known;
      api.circle(
        ctx,
        x,
        y,
        9,
        seen && start !== cohort.byFifteen ? color : null,
        seen ? color : C.muted,
        2,
      );
    }
    if (known === end - start) {
      const mid = 460 + group * 490;
      api.text(ctx, String(known), mid, 311, 47, color, 'center');
      api.text(ctx, name, mid, 373, 28, color, 'center');
    }
  });
}

export function drawCountBracket(ctx, api, count, color) {
  const x = 218;
  const y = firstRowY - rowHeight / 2;
  const bottom = y + (rowHeight * count) / columns;
  api.path(
    ctx,
    [
      { x: x + 32, y },
      { x, y },
      { x, y: bottom },
      { x: x + 32, y: bottom },
    ],
    { color, width: 4 },
  );
}

export function drawRankRuler(ctx, api, known, showRank, lowerBound) {
  const { C } = api;
  const y = 815;
  api.line(ctx, edge(0), y, edge(cohort.size), y, C.muted, 3);
  api.line(ctx, edge(0), y, edge(known), y, C.cyan, 12);
  api.text(
    ctx,
    (lowerBound ? 'at least ' : '') + known + ' finished',
    edge(known) - 13,
    y + 57,
    36,
    C.cyan,
    'right',
  );
  if (showRank) {
    const x = edge(targetRank);
    api.line(ctx, x, y - 43, x, y + 17, C.yellow, 5);
    api.text(ctx, 'rank ' + targetRank, x, y + 57, 37, C.yellow, 'center');
  }
}
