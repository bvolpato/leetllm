// A token and its ID share one physical slot. Empty slots keep their position on the ruler.
export function slot(ctx, api, { x, y, width, word, detail, color, height = 112, size = 36 }) {
  const { C } = api;
  if (word === undefined) {
    api.line(ctx, x + 6, y + height - 4, x + width - 12, y + height - 4, C.muted, 2);
    return;
  }
  const bounds = { x: x + 2, y, width: width - 10, height };
  api.container(
    ctx,
    bounds,
    () => {
      api.rect(ctx, bounds.x, y, bounds.width, height, C.panel, undefined, 5);
      api.line(ctx, x + 6, y + height - 4, x + width - 12, y + height - 4, color, 5);
      const middle = bounds.x + bounds.width / 2;
      api.text(
        ctx,
        String(word),
        middle,
        y + (detail ? height * 0.43 : height * 0.61),
        size,
        C.ink,
        'center',
      );
      if (detail) api.text(ctx, detail, middle, y + height * 0.79, 27, color, 'center');
    },
    { padding: 0 },
  );
}

export function ruler(ctx, api, x, y, width, count, start = 0) {
  api.text(ctx, 'Position', 100, y, 28, api.C.muted);
  for (let i = 0; i < count; i++) {
    api.text(ctx, String(start + i), x + (i + 0.5) * width - 3, y, 28, api.C.muted, 'center');
  }
}

export function bracket(ctx, api, x1, x2, y, label, color) {
  api.path(
    ctx,
    [
      { x: x1, y: y - 14 },
      { x: x1, y },
      { x: x2, y },
      { x: x2, y: y - 14 },
    ],
    { color, width: 3 },
  );
  api.text(ctx, label, (x1 + x2) / 2, y + 47, 30, color, 'center');
}
