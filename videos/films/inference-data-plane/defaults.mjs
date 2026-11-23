export function retainedDrawCueProgress(ctx, api, id, fallback) {
  return api.focus.progress(id, fallback);
}
export function retainedDrawText(
  ctx,
  api,
  v,
  x,
  y,
  size = 34,
  color = api.C.ink,
  align = 'center',
) {
  return api.text(ctx, v, x, y, size, color, align);
}
export function retainedDrawEquation(
  ctx,
  api,
  v,
  x,
  y,
  size = 44,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, v, x, y, size, color, align);
}
export function retainedDrawRoute(ctx, api, a, z, color, progress) {
  if (progress <= 0.25) return;
  api.components.fade(progress, () => {
    const line = api.connect(ctx, a, z, {
      color,
      width: 3,
      fromGap: 20,
      toGap: 20,
    });
    api.components.particle({
      points: [line.from, line.to],
      progress,
      fill: color,
      radius: 8,
    });
  });
}
export function text(ctx, api, v, x, y, size = 33, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 8);
}
export function L(ctx, api, x, y, u, v, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function memory(ctx, api, x, y, cols, rows, ready, owner, color, scale = 52) {
  for (let i = 0; i < cols * rows; i++) {
    const xx = x + (i % cols) * scale,
      yy = y + Math.floor(i / cols) * scale,
      full = typeof ready === 'function' ? ready(i) : i < ready;
    rectangle(
      ctx,
      api,
      xx,
      yy,
      scale - 8,
      scale - 8,
      full ? color : api.C.muted,
      full ? api.C.panel : api.C.bg,
    );
    text(
      ctx,
      api,
      String(i + 1),
      xx + (scale - 8) / 2,
      yy + (scale - 8) * 0.71,
      Math.max(19, scale * 0.43),
      full ? color : api.C.muted,
      'center',
    );
  }
  if (owner) text(ctx, api, owner, x + (cols * scale) / 2, y - 25, 29, color, 'center');
}
export function tensor(ctx, api, x, y, progress, owner) {
  text(ctx, api, owner, x + 255, y - 37, 34, api.C.yellow, 'center');
  ['K', 'V'].forEach((name, k) => {
    const xx = x + k * 275;
    text(ctx, api, name, xx + 115, y + 15, 33, k ? api.C.green : api.C.blue, 'center');
    for (let t = 0; t < 4; t++)
      for (let d = 0; d < 4; d++) {
        const ready = t < Math.ceil(progress * 4),
          value = (k + 1) * 10 + t * 4 + d;
        rectangle(
          ctx,
          api,
          xx + d * 57,
          y + 45 + t * 58,
          49,
          49,
          ready ? (k ? api.C.green : api.C.blue) : api.C.muted,
        );
        text(
          ctx,
          api,
          ready ? String(value) : '·',
          xx + d * 57 + 24,
          y + 79 + t * 58,
          25,
          ready ? (k ? api.C.green : api.C.blue) : api.C.muted,
          'center',
        );
      }
    text(ctx, api, 't1  t2  t3  t4 own rows', xx + 115, y + 325, 23, api.C.muted, 'center');
  });
}
