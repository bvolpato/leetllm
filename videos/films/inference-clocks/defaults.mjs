export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 80) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: height < 60 ? 26 : 29,
    padding: height < 60 ? 6 : 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function timeline(ctx, api, times, y, color, start = 0, maximum = 500) {
  const x = (value) => 190 + ((value - start) / (maximum - start)) * 1500;
  api.line(ctx, x(start), y, x(maximum), y, api.C.muted, 2);
  text(ctx, api, `${start} ms`, x(start), y + 70, 25, api.C.muted, 'center');
  times.forEach((token, i) => {
    api.circle(ctx, x(token.time), y, 10, color);
    text(ctx, api, token.id ?? `T${i + 1}`, x(token.time), y - 40, 26, color, 'center');
    text(ctx, api, String(token.time), x(token.time), y + 70, 24, api.C.muted, 'center');
  });
  return x;
}
export function drawUpgradeText(ctx, api, v, x, y, z = 32, col = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, z, col, align);
}
export function drawUpgradeEquation(ctx, api, v, x, y, z = 44, col = api.C.ink) {
  return api.math(ctx, v, x, y, z, col, 'center');
}
export function drawUpgradeBar(ctx, api, x, y, w, h, color) {
  return api.rect(ctx, x, y, w, h, color);
}
export function drawUpgradeCube(ctx, api, x, y, w, h, depth, color, label) {
  const dx = depth * 0.6,
    dy = -depth;
  api.path(
    ctx,
    [
      {
        x,
        y,
      },
      {
        x: x + dx,
        y: y + dy,
      },
      {
        x: x + w + dx,
        y: y + dy,
      },
      {
        x: x + w,
        y,
      },
    ],
    {
      closed: true,
      fill: api.C.panel,
      color,
      width: 3,
    },
  );
  api.path(
    ctx,
    [
      {
        x: x + w,
        y,
      },
      {
        x: x + w + dx,
        y: y + dy,
      },
      {
        x: x + w + dx,
        y: y + h + dy,
      },
      {
        x: x + w,
        y: y + h,
      },
    ],
    {
      closed: true,
      fill: api.C.panel,
      color,
      width: 3,
    },
  );
  api.rect(ctx, x, y, w, h, api.C.panel, color, 3);
  drawUpgradeText(ctx, api, label, x + w / 2, y + h / 2 + 20, 70, color, 'center');
}
