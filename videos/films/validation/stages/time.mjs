export function drawTime(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const xs = months.map((_, i) => 443 + i * 183);
  const rows = [
    ['First fit', 2, 4],
    ['Next fit', 4, 6],
    ['Release', 6, 8],
  ];
  const rowCount = Math.min(3, beat + 1);
  months.forEach((m, i) => api.text(ctx, m, xs[i], 315, 36, C.ink, 'center'));
  rows.slice(0, rowCount).forEach(([name, endFit, endScore], j) => {
    const y = 367 + j * 116;
    api.text(ctx, name, 120, y + 57, 36, C.ink);
    for (let i = 0; i < endScore; i++) {
      const fit = i < endFit;
      const label = fit ? 'fit' : j !== 2 ? 'score' : i === 6 ? 'choose' : 'report';
      const color = fit ? C.blue : i === 7 ? C.green : C.yellow;
      api.rect(ctx, xs[i] - 79, y, 158, 82, C.panel, color, 6);
      api.text(ctx, label, xs[i], y + 54, 34, color, 'center');
    }
  });
  if (beat >= 3) {
    const left = 190,
      mid = 950,
      right = 1650;
    const y = 833;
    api.line(ctx, left, y, right, y, C.muted, 3);
    [left, mid, right].forEach((x, i) => api.circle(ctx, x, y, 12, [C.blue, C.yellow, C.pink][i]));
    ['June 20', 'July 1', 'August 2'].forEach((label, i) =>
      api.text(ctx, label, [left, mid, right][i], y - 44, 34, C.ink, 'center'),
    );
    ['Request opens', 'Fit begins', 'Label arrives'].forEach((label, i) =>
      api.text(ctx, label, [left, mid, right][i], y + 67, 31, C.ink, 'center'),
    );
    api.text(
      ctx,
      beat === 3
        ? 'Does this June request enter the July fit?'
        : 'Exclude this row from the labeled fit on July 1.',
      960,
      1000,
      40,
      C.yellow,
      'center',
    );
  } else {
    const note = [
      'The first score uses March and April.',
      'Refit through April, then score May and June.',
      'Fit candidate parameters through June. Freeze the July choice for August.',
    ][beat];
    api.text(ctx, note, 960, 892, 38, C.ink, 'center');
  }
}

export default { id: 'time', draw: drawTime };
