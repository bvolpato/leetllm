const number = (value) => value.toLocaleString('en-US');

export function drawLedger(
  ctx,
  api,
  { cap, parts, freeLabel, request, verdict, note, detail, receipt },
) {
  const { C } = api;
  const x = 155,
    end = 1540,
    y = 405,
    h = 128;
  const width = (tokens) => (tokens / cap) * (end - x);
  const used = parts.reduce((sum, part) => sum + part.value, 0);
  const free = cap - used;
  const admitted = parts.some((p) => p.id === request.id && p.held);
  const start = x + width(admitted ? used - request.value : used);
  api.focus.target('ledger', () => {
    api.text(ctx, 'Generated tokens', x, 265, 41, C.ink);
    api.text(ctx, number(cap) + ' cap', end, 267, 48, C.ink, 'right');
    api.rect(ctx, x, y, end - x, h, C.panel, C.muted, 2);
    let left = x;
    for (const p of parts) {
      const w = width(p.value);
      const fill = p.held ? C.blue : C.cyan;
      api.rect(ctx, left + 2, y + 2, w - 4, h - 4, fill, undefined, 1);
      api.text(ctx, p.id + (p.held ? ' held' : ' spent'), left + w / 2, y + 44, 31, C.bg, 'center');
      api.text(ctx, number(p.value), left + w / 2, y + 101, 45, C.bg, 'center');
      left += w;
    }
    if (freeLabel) api.text(ctx, number(free) + ' free', end, y - 30, 36, C.yellow, 'right');
    if (!receipt) api.line(ctx, end, y + h + 12, end, 658, C.muted, 2);
  });
  api.focus.target('request', () => {
    if (receipt) {
      api.text(ctx, receipt, x, 665, 44, C.yellow, 'left', 'mono');
    } else if (request.visible !== false) {
      const right = start + width(request.value);
      const color = admitted ? C.blue : C.yellow;
      api.line(ctx, start, 633, right, 633, color, 6);
      for (const side of [start, right]) api.line(ctx, side, 608, side, 657, color, 5);
      api.text(
        ctx,
        request.id + '   ' + number(request.value),
        (start + right) / 2,
        705,
        39,
        color,
        'center',
      );
    }
    api.text(ctx, verdict, x, 802, 49, C.ink);
    if (note) api.text(ctx, note, x, 906, 37, C.muted);
    if (detail) api.text(ctx, detail, x, 988, 36, C.cyan);
  });
}
