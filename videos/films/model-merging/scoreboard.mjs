export function drawScoreboard(
  ctx,
  api,
  report,
  { showScores, absolute, relative, gap, verdict, previousMath, movingMath },
) {
  const { C } = api;
  const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
  const x = (v) => 400 + (v - 80) * 42;
  const colors = [C.blue, C.pink, C.cyan];
  label('Task mean   ' + report.macro.toFixed(1) + '%', 155, 292, 53, C.ink);
  label('Toy release evaluation', 995, 288, 34, C.muted);
  label('Score (%)', 155, 398, 32, C.muted);
  [80, 85, 90, 95].forEach((v) => label(v, x(v), 398, 30, C.muted, 'center'));
  label('Score', 1128, 398, 34, C.ink, 'center');
  label('Task floor', 1350, 398, 32, C.yellow, 'center');
  label('Specialist − 1 pp', 1620, 398, 32, C.cyan, 'center');
  report.rows.forEach((row, i) => {
    const y = 510 + 137 * i;
    api.focus.target('candidate-scores', () => {
      label(row.task, 155, y + 15, 42, colors[i]);
      api.line(ctx, x(80), y, x(95), y, C.muted, 2);
      if (showScores) {
        const dot = i === 1 ? (movingMath ?? row.score) : row.score;
        if (i === 1 && previousMath !== undefined && previousMath !== dot) {
          api.circle(ctx, x(previousMath), y, 9, C.panel, C.muted, 3);
          if (x(dot) - x(previousMath) > 24)
            api.line(ctx, x(previousMath) + 12, y, x(dot) - 12, y, colors[i], 4);
        }
        api.circle(ctx, x(dot), y, 15, colors[i]);
      }
      label(
        showScores ? row.score.toFixed(1) : '?',
        1128,
        y + 16,
        46,
        showScores ? colors[i] : C.muted,
        'center',
      );
    });
    api.focus.target('floors', () => {
      if (absolute) {
        api.line(ctx, x(row.floor), y + 8, x(row.floor), y + 41, C.yellow, 5);
        label(row.floor.toFixed(1), 1350, y + 15, 38, C.yellow, 'center');
      } else label('·', 1350, y + 10, 32, C.muted, 'center');
      if (relative) {
        api.line(ctx, x(row.retained), y - 8, x(row.retained), y - 41, C.cyan, 5);
        label(
          row.source.toFixed(1) + ' → ' + row.retained.toFixed(1),
          1620,
          y + 15,
          35,
          C.cyan,
          'center',
        );
      } else label('·', 1620, y + 10, 32, C.muted, 'center');
    });
  });
  const math = report.rows[1];
  api.focus.target('math-gap', () => {
    if (gap === 'absolute')
      label(
        'Math   ' +
          math.floor.toFixed(1) +
          ' − ' +
          math.score.toFixed(1) +
          ' = ' +
          (math.floor - math.score).toFixed(1) +
          ' pp below its floor',
        155,
        939,
        38,
        C.pink,
      );
    if (gap === 'relative')
      label(
        'Math   ' +
          math.retained.toFixed(1) +
          ' − ' +
          math.score.toFixed(1) +
          ' = ' +
          (math.retained - math.score).toFixed(1) +
          ' pp below the release minimum',
        155,
        939,
        38,
        C.pink,
      );
    if (gap === 'source')
      label(
        'Math   ' +
          math.source.toFixed(1) +
          ' − ' +
          math.score.toFixed(1) +
          ' = ' +
          (math.source - math.score).toFixed(1) +
          ' pp regression',
        155,
        939,
        38,
        C.pink,
      );
    if (!gap) label('Each task counts once in the mean.', 155, 939, 33, C.muted);
  });
  api.focus.target('decision', () => {
    label(
      verdict ? (report.clear ? '3 score gates clear' : 'Hold the merge') : 'Do all 3 tasks pass?',
      1740,
      1020,
      42,
      verdict ? (report.clear ? C.green : C.red) : C.muted,
      'right',
    );
  });
}
