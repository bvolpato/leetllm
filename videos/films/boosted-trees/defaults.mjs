export const formatNumber = (n, places = 3) => Number(n.toFixed(places)).toString();
export function chapterText(ctx, api, s, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function chapterEquation(ctx, api, s, x, y, size = 38, color = api.C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function line(ctx, api, x, y, xx, yy, col = api.C.muted, w = 3) {
  return api.line(ctx, x, y, xx, yy, col, w);
}
export function arrow(ctx, api, x, y, xx, yy, col = api.C.cyan, w = 3) {
  return api.arrow(ctx, x, y, xx, yy, col, w);
}
export function dot(ctx, api, x, y, col = api.C.yellow, r = 10) {
  return api.circle(ctx, x, y, r, col);
}
export function outlineBox(ctx, api, x, y, w, h, col = api.C.muted, width = 2) {
  return api.path(
    ctx,
    [
      {
        x,
        y,
      },
      {
        x: x + w,
        y,
      },
      {
        x: x + w,
        y: y + h,
      },
      {
        x,
        y: y + h,
      },
      {
        x,
        y,
      },
    ],
    {
      color: col,
      width,
    },
  );
}
export function withOpacity(ctx, api, opacity, paint) {
  ctx.save();
  try {
    ctx.globalAlpha *= opacity;
    paint();
  } finally {
    ctx.restore();
  }
}
export function heading(ctx, api, s) {
  return chapterText(ctx, api, s, 960, 270, 33, api.C.ink, 'center');
}
export function footer(ctx, api, s) {
  return chapterText(ctx, api, s, 960, 1030, 24, api.C.muted, 'center');
}
export function cellText(ctx, api, value, x, y, col = api.C.ink, size = 31) {
  return chapterText(ctx, api, value, x, y, size, col, 'center');
}
export function valueBar(ctx, api, x, y, width, value, max, col, height = 24) {
  api.rect(ctx, x, y, width, height, api.C.grid);
  if (value > 0) api.rect(ctx, x, y, width * Math.min(1, value / max), height, col);
}
export function rowBins(ctx, api, model, y = 360) {
  const xs = [420, 760, 1100, 1440];
  model.rows.forEach((r, i) => {
    outlineBox(ctx, api, xs[i] - 125, y - 42, 250, 235, api.C.muted);
    cellText(ctx, api, r.id + ' · bin ' + r.bin, xs[i], y, api.C.cyan, 27);
    cellText(ctx, api, 'y = ' + r.label, xs[i], y + 63, r.label ? api.C.pink : api.C.blue);
    cellText(
      ctx,
      api,
      'g = ' + formatNumber(r.g),
      xs[i],
      y + 120,
      r.g < 0 ? api.C.pink : api.C.blue,
      29,
    );
    cellText(ctx, api, 'h = ' + r.h, xs[i], y + 170, api.C.yellow, 27);
  });
  return xs;
}
export function splitGains(ctx, api, model, x = 1280, y = 740, revealed = true, scale = 200) {
  const base = y + 125;
  line(ctx, api, x - 150, base, x + 340, base, api.C.muted, 2);
  model.cuts.forEach((c, i) => {
    const xx = x - 80 + i * 160;
    if (revealed) {
      const yy = base - c.gain * scale;
      api.rect(
        ctx,
        xx - 35,
        Math.min(yy, base),
        70,
        Math.max(2, Math.abs(base - yy)),
        c.gain > 0 ? api.C.green : api.C.pink,
      );
      cellText(
        ctx,
        api,
        formatNumber(c.gain, 4),
        xx,
        c.gain >= 0 ? yy - 20 : yy + 34,
        c.gain > 0 ? api.C.green : api.C.pink,
        25,
      );
    } else cellText(ctx, api, '?', xx, base - 90, api.C.muted);
    cellText(ctx, api, 'cut ' + c.cut, xx, base - 150, api.C.muted, 24);
  });
}
export function focusScope(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function legacyText(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function legacyEquation(ctx, api, value, x, y, size = 43, color = api.C.ink) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function recordCard(
  ctx,
  api,
  sceneId,
  label,
  x,
  y,
  width,
  height = 82,
  color = api.C.cyan,
  opacity = 1,
  fontSize = 27,
) {
  return api.components.card({
    id: `${sceneId}-${String(label).slice(0, 15)}-${x}-${y}`,
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    radius: 14,
    padding: 10,
    fontSize,
    opacity,
  });
}
