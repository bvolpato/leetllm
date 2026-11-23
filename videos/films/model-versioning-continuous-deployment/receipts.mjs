// All counts on a strip use the denominator printed immediately above it.
export function countStrip(ctx, api, { x, y, width, label, reading, value, maximum, color }) {
  api.text(ctx, label, x, y, 32, api.C.muted);
  api.text(ctx, reading, x + width, y, 34, color, 'right');
  api.rect(ctx, x, y + 25, width, 38, api.C.panel, api.C.muted, 3);
  if (value > 0)
    api.rect(ctx, x, y + 25, width * Math.min(1, value / maximum), 38, color, undefined, 3);
}

export function capacityRuler(
  ctx,
  api,
  receipt,
  maximum,
  y,
  previousCapacity = receipt.capacity,
  added = 1,
) {
  const { C } = api;
  const x = 175,
    width = 1530,
    scale = width / maximum;
  const demandX = x + receipt.demand * scale;
  const capacityX = x + (previousCapacity + (receipt.capacity - previousCapacity) * added) * scale;
  api.text(
    ctx,
    'Returning demand ' + receipt.demand + ' requests/s',
    demandX,
    y - 36,
    34,
    C.yellow,
    'right',
  );
  api.rect(ctx, x, y, width, 78, C.panel, C.muted, 4);
  api.rect(
    ctx,
    x,
    y,
    scale * Math.min(previousCapacity, receipt.capacity),
    78,
    C.blue,
    undefined,
    4,
  );
  if (receipt.capacity > previousCapacity && added > 0)
    api.rect(
      ctx,
      x + scale * previousCapacity,
      y,
      scale * (receipt.capacity - previousCapacity) * added,
      78,
      C.green,
      undefined,
      2,
    );
  api.line(ctx, demandX, y - 18, demandX, y + 95, C.yellow, 5);
  api.line(ctx, capacityX, y + 94, capacityX, y + 114, C.blue, 3);
  api.text(
    ctx,
    'ready capacity ' +
      (added < 1 ? previousCapacity + ' → ' : '') +
      receipt.capacity +
      ' requests/s',
    capacityX,
    y + 158,
    37,
    C.blue,
    'right',
  );
}
