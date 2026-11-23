// Each lane follows one draft across the serving gate to the operator's receipt.
export function drawDeliveryLanes(ctx, api, rows) {
  const { C, focus } = api;
  const text = (value, x, y, size, color, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  text('Request', 120, 375, 31, C.muted);
  text('Model draft', 630, 375, 31, C.muted, 'center');
  text('Serving gate', 1060, 375, 31, C.muted, 'center');
  text('Operator received', 1510, 375, 31, C.muted, 'center');

  rows.forEach((row, i) => {
    const y = 494 + 225 * i;
    const p = row.progress;
    const atGate = Math.min(1, p / 0.45);
    const beyondGate = Math.max(0, (p - 0.45) / 0.55);
    const x = 630 + 252 * atGate + (row.served ? 628 * beyondGate : 0);
    const ticketWidth = 268;
    focus.target('request-' + row.id, () => {
      text(row.id, 120, y + 4, 62, C.ink);
      text(row.detail, 122, y + 55, 30, C.muted);
    });
    focus.target('gate-' + row.id, () => {
      const gap = row.served ? 62 * Math.min(1, beyondGate * 3) : 0;
      api.line(ctx, 1060, y - 85, 1060, y - gap, C.blue, 7);
      api.line(ctx, 1060, y + gap, 1060, y + 85, C.blue, 7);
    });
    focus.target('output-' + row.id, () => {
      api.rect(ctx, 1250, y - 83, 520, 166, C.panel, C.muted, 12);
      if (p >= 1 && !row.served) text('Withheld', 1510, y + 15, 43, C.ink, 'center');
    });
    if (row.showDraft) {
      focus.target('draft-' + row.id, () => {
        api.rect(ctx, x - ticketWidth / 2, y - 44, ticketWidth, 88, C.bg, C.cyan, 8);
        text(row.draft, x, y + 13, 37, C.cyan, 'center');
      });
    }
  });
}
