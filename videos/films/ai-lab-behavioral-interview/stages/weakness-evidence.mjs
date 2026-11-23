export function drawWeaknessEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  const seen = (id) => focus.visible(id);
  if (state.beat < 2) {
    write('Migration design', 115, 296, 48, C.ink, 'serif');
    const x0 = 369,
      dx = 330,
      y = 521;
    focus.target('late-draft', () => {
      api.line(ctx, x0, y, x0 + 3 * dx, y, C.muted, 4);
      for (let day = 0; day <= 3; day++) {
        const x = x0 + day * dx;
        api.line(ctx, x, y - 16, x, y + 16, C.muted, 3);
        api.text(
          ctx,
          ['Draft due', '+1 day', '+2 days', '+3 days'][day],
          x,
          y + 79,
          33,
          C.muted,
          'center',
        );
      }
      api.circle(ctx, x0 + dx * 3 * focus.progress('weakness-cost'), y, 18, C.pink);
      if (focus.progress('weakness-cost') === 1)
        api.text(ctx, 'Draft shared', x0 + dx * 3, y - 50, 39, C.pink, 'center');
    });
    if (seen('weakness-rework'))
      focus.target('rework', () =>
        write('A teammate had to redo the integration.', 150, 735, 46, C.pink, 'serif'),
      );
    if (seen('weakness-later'))
      focus.target('next-migration', () => {
        write('Next migration', 150, 862, 32, C.muted);
        write('One-page proposal reviewed before coding began.', 150, 936, 45, C.cyan, 'serif');
      });
    return;
  }
  write('Separate rehearsal • three later projects', 116, 266, 35, C.muted);
  const entries = [true, true, false],
    earlyCount = entries.filter(Boolean).length;
  const codingX = 1060;
  write('Coding begins', codingX - 108, 354, 35, C.muted);
  api.line(ctx, codingX, 398, codingX, 763, C.muted, 3);
  entries.forEach((early, i) => {
    const y = 452 + i * 132,
      x = early ? 748 : 1350;
    write('Project ' + (i + 1), 150, y + 14, 40, C.ink, 'serif');
    api.line(ctx, 500, y, 1615, y, '#555961', 2);
    focus.target('review-dates', () => {
      api.circle(ctx, x, y, 16, early ? C.cyan : C.pink);
      api.text(ctx, 'review', x, y - 29, 29, early ? C.cyan : C.pink, 'center');
    });
  });
  focus.target('early-count', () =>
    write(
      seen('weakness-count')
        ? earlyCount + ' of 3 reviews came before coding.'
        : 'How many reviews came before coding?',
      150,
      891,
      46,
      C.yellow,
      'serif',
    ),
  );
  write('Delivery dates were not recorded.', 150, 982, 35, C.muted);
}
export default {
  id: 'weakness-evidence',
  draw: drawWeaknessEvidence,
  cues: ['weakness-cost', 'weakness-rework', 'weakness-later', 'weakness-dates', 'weakness-count'],
};
