export function drawAdjacency(ctx, scene, state, api) {
  const { C, focus } = api;
  const stages = [
    { title: 'One message', id: 'one-message', count: 1 },
    { title: 'One ticket', id: 'one-ticket', count: 4 },
    { title: 'One customer', id: 'one-customer', count: 12 },
  ];
  const phase = Math.min(state.beat ?? 0, 2);
  const rule = stages[phase];
  const removal = focus.progress(rule.id, 0);
  focus.target('message-grid', () => {
    api.text(ctx, 'Alice', 535, 290, 42, C.cyan);
    api.text(ctx, 'Bao', 1558, 290, 42, C.green, 'center');
    for (let t = 0; t < 4; t++) {
      const start = 520 + t * 295 + (t === 3 ? 95 : 0);
      api.text(ctx, t < 3 ? 'Ticket ' + (t + 1) : 'Ticket 4', start + 90, 360, 30, C.muted, 'center');
      for (let row = 0; row < 2; row++) {
        for (let m = 0; m < (t < 3 ? 4 : 2); m++) {
          const x = start + (m % 2) * 90, y = 410 + row * 250 + Math.floor(m / 2) * 67;
          const color = t === 3 ? C.green : C.cyan;
          const i = t * 4 + m;
          const gone = row === 1 && t < 3 && i >= 12 - rule.count;
          api.rect(ctx, x, y, 76, 51, C.panel, C.muted, 1);
          api.components.fade(gone ? 1 - removal : 1, () => {
            api.rect(ctx, x, y, 76, 51, color);
            api.line(ctx, x + 14, y + 20, x + 62, y + 20, C.bg, 3);
            api.line(ctx, x + 14, y + 33, x + 47, y + 33, C.bg, 3);
          });
        }
      }
    }
    api.text(ctx, 'Original', 365, 475, 38, C.ink, 'right');
    api.text(ctx, rule.title, 365, 700, 39, C.yellow, 'right');
    api.text(ctx, 'removed', 365, 748, 30, C.muted, 'right');
    const label = removal === 1 ? rule.count + ' of Alice’s 12 messages removed' : '12 messages across 3 tickets';
    api.text(ctx, label, 960, 950, 43, C.ink, 'center');
  });
}
export default { id: 'adjacency', draw: drawAdjacency, cues: ['one-message', 'one-ticket', 'one-customer'] };
