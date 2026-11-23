const passages = [
  ['Access', 'Temporary admin roles', 'Manager approval'],
  ['Incidents', 'Incident commander', 'Service owner'],
  ['Admins', 'Privileged role appeal', 'Audit decision'],
];

export function drawDocuments(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const move = beat === 0 ? 0 : beat === 1 ? api.phase(state.beatP ?? 0, 0.12, 0.48) : 1;
  api.text(ctx, 'Manual', 132, 304, 34, C.muted);
  api.text(ctx, 'Tuning', 744, 304, 38, C.blue, 'center');
  api.text(ctx, 'Test', 1470, 304, 38, C.pink, 'center');
  // Each excerpt has its own vertical track, so siblings can share a side without covering one another.
  const sides = [[], []];
  passages.forEach(([source, ...chunks], i) => {
    const y = 373 + i * 182;
    api.text(ctx, source, 130, y + 75, 41, C.ink);
    chunks.forEach((chunk, j) => {
      const start = j;
      const end = Number(i === 2);
      const x = api.lerp(470 + 735 * start, 470 + 735 * end, move);
      const cy = y + 68 * j;
      const assigned = move === 0 ? start : move === 1 ? end : null;
      if (assigned !== null) sides[assigned].push(source);
      const color = assigned === null ? C.muted : assigned ? C.pink : C.blue;
      api.rect(ctx, x, cy, 551, 62, C.panel, color, 7);
      api.text(ctx, chunk, x + 275, cy + 42, 32, C.ink, 'center');
    });
  });
  if (beat === 0) {
    api.text(
      ctx,
      'How many test manuals has tuning already seen?',
      960,
      1000,
      41,
      C.yellow,
      'center',
    );
  } else if (move === 0 || move === 1) {
    const overlap = [...new Set(sides[0].filter((s) => sides[1].includes(s)))];
    const label = overlap.length ? overlap.join(', ') : 'None';
    api.text(
      ctx,
      'Manuals on both sides (' + overlap.length + ')',
      695,
      1000,
      36,
      C.muted,
      'right',
    );
    api.text(ctx, label, 779, 1000, 42, C.yellow);
  }
}

export default { id: 'documents', draw: drawDocuments };
