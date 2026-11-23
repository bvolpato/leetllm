export function drawRequestLedger(
  ctx,
  api,
  trace,
  { showLater = true, joint = false, swap = 0, pending = false } = {},
) {
  const { C, rect, text } = api;
  const movingGap = swap > 0 && swap < 1;
  const ticketX = (i) => 170 + (i % 10) * 159;
  const laterX = (i) => ticketX(i) + 112;
  text(ctx, 'First token < 450 ms', 142, 271, 40, C.ink);
  text(ctx, 'Average later gap < 45 ms', 790, 271, 40, C.ink);
  text(ctx, 'Each pair shows first token / later gap, in milliseconds.', 144, 345, 32, C.muted);
  for (const [i, r] of trace.requests.entries()) {
    const x = ticketX(i);
    const y = 389 + Math.floor(i / 10) * 165;
    const firstOK = r.firstMs < 450,
      laterOK = r.laterMs < 45;
    const pass = firstOK && laterOK;
    const showPass = joint && !(pending && i < 2);
    const fill = showPass ? (pass ? '#16382e' : '#462036') : C.panel;
    rect(ctx, x, y, 146, 133, fill, showPass ? (pass ? C.green : C.pink) : C.muted, 8);
    if (showPass && !pass) {
      api.line(ctx, x + 112, y + 17, x + 130, y + 35, C.pink, 4);
      api.line(ctx, x + 130, y + 17, x + 112, y + 35, C.pink, 4);
    }
    text(ctx, 'R' + r.id, x + 73, y + 47, 34, C.ink, 'center');
    text(ctx, String(r.firstMs), x + 47, y + 103, 29, firstOK ? C.muted : C.pink, 'center');
    text(ctx, '/', x + 80, y + 102, 26, C.muted, 'center');
    if (!(movingGap && i === 1)) {
      text(
        ctx,
        showLater ? String(r.laterMs) : '?',
        laterX(i),
        y + 103,
        29,
        showLater && !laterOK ? C.pink : C.muted,
        'center',
      );
    }
  }
  if (movingGap) {
    const x = api.lerp(laterX(1), laterX(0), swap);
    text(ctx, trace.requests[1].laterMs + ' ms', x, 548, 29, C.pink, 'center');
  }
}
