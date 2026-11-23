import { mix } from './arithmetic.mjs';
export function drawTenantText(ctx, api, v, x, y, z = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function drawTenantEquation(ctx, api, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, api.C.yellow, 'center');
}
export function drawTenantCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 95,
  z = 30,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function drawConstructionText(
  ctx,
  api,
  v,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawConstructionCenter(ctx, api, v, x, y, size = 32, color = api.C.ink) {
  return drawConstructionText(ctx, api, v, x, y, size, color, 'center');
}
export function wrapConstructionText(ctx, api, v, max) {
  const lines = [];
  let row = '';
  for (const word of String(v).split(/\s+/)) {
    if ((row + ' ' + word).trim().length > max) {
      if (row) lines.push(row);
      row = word;
    } else row = (row + ' ' + word).trim();
  }
  if (row) lines.push(row);
  return lines;
}
export function drawConstructionPanel(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    radius: 10,
  });
}
export function drawConstructionBox(
  ctx,
  api,
  v,
  x,
  y,
  w = 450,
  h = 100,
  color = api.C.cyan,
  size = 28,
) {
  const r = drawConstructionPanel(ctx, api, x, y, w, h, color),
    rows = String(v)
      .split('\n')
      .flatMap((z) => wrapConstructionText(ctx, api, z, Math.floor((w - 44) / (size * 0.59))));
  rows.forEach((z, i) =>
    drawConstructionCenter(
      ctx,
      api,
      z,
      x + w / 2,
      y + h / 2 + (i - (rows.length - 1) / 2) * size * 1.34 + size * 0.33,
      size,
      color,
    ),
  );
  return r;
}
export function drawConstructionLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawConstructionArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  if (Math.hypot(x2 - x1, y2 - y1) > 0.5) api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function drawConstructionFoot(ctx, api, v) {
  return drawConstructionCenter(ctx, api, v, 960, 1030, 25, api.C.muted);
}
export function formatConstructionNumber(ctx, api, v, d = 3) {
  return Number(v.toFixed(d)).toString();
}
export function drawConstructionPacket(
  ctx,
  api,
  sceneId,
  v,
  x0,
  y0,
  x1,
  y1,
  p,
  color = api.C.cyan,
  w = 250,
  h = 66,
) {
  return api.focus.target(sceneId + '-packet', () =>
    drawConstructionBox(ctx, api, v, mix(x0, x1, p), mix(y0, y1, p), w, h, color, 25),
  );
}
export function drawConstructionPage(
  ctx,
  api,
  sceneId,
  id,
  x,
  y,
  { used = 16, owner = 'A', refs, fill = api.C.blue, reserved = false, small = false } = {},
) {
  return api.focus.target(sceneId + '-pages', () => {
    const cell = small ? 15 : 28,
      gap = small ? 3 : 5,
      w = 8 * (cell + gap) + 14,
      h = 2 * (cell + gap) + 70;
    drawConstructionPanel(ctx, api, x, y, w, h, fill);
    drawConstructionCenter(ctx, api, id, x + w / 2, y + 26, small ? 21 : 25, fill);
    drawConstructionCenter(ctx, api, owner, x + w / 2, y + h - 7, small ? 17 : 22, fill);
    for (let j = 0; j < 16; j++) {
      const xx = x + 10 + (j % 8) * (cell + gap),
        yy = y + 46 + Math.floor(j / 8) * (cell + gap);
      api.rect(ctx, xx, yy, cell, cell, j < used ? fill : api.C.panel, api.C.muted, 0);
      if (reserved && j >= used)
        drawConstructionLine(
          ctx,
          api,
          xx + 3,
          yy + cell - 3,
          xx + cell - 3,
          yy + 3,
          api.C.yellow,
          1,
        );
    }
    if (refs !== undefined)
      drawConstructionCenter(
        ctx,
        api,
        'live refs ' + refs,
        x + w / 2,
        y + h + 32,
        26,
        refs ? api.C.yellow : api.C.green,
      );
    return {
      x,
      y,
      width: w,
      height: h,
    };
  });
}
export function drawConstructionLedger(
  ctx,
  api,
  sceneId,
  balance,
  total,
  x = 140,
  y = 540,
  w = 1640,
) {
  return api.focus.target(sceneId + '-ledger', () => {
    drawConstructionCenter(ctx, api, 'Available', x + w * 0.16, y - 70, 29, api.C.muted);
    drawConstructionCenter(ctx, api, 'Held reservation', x + w * 0.5, y - 70, 29, api.C.yellow);
    drawConstructionCenter(ctx, api, 'Settled usage', x + w * 0.84, y - 70, 29, api.C.blue);
    [balance.available, balance.held, balance.settled].forEach((n, i) =>
      drawConstructionCenter(
        ctx,
        api,
        n,
        x + w * [0.16, 0.5, 0.84][i],
        y,
        48,
        [api.C.ink, api.C.yellow, api.C.blue][i],
      ),
    );
    api.rect(ctx, x, y + 55, w, 75, api.C.panel, api.C.muted, 0);
    let xx = x;
    for (const [key, color] of [
      ['available', api.C.muted],
      ['held', api.C.yellow],
      ['settled', api.C.blue],
    ]) {
      const width = (w * balance[key]) / total;
      if (width > 0) api.rect(ctx, xx, y + 55, width, 75, color, undefined, 0);
      xx += width;
    }
    drawConstructionCenter(
      ctx,
      api,
      balance.available + ' + ' + balance.held + ' + ' + balance.settled + ' = ' + total,
      x + w / 2,
      y + 195,
      34,
      api.C.green,
    );
  });
}
export function withConstructionFocus(ctx, api, sceneId, fn) {
  return api.focus.target(sceneId + '-mechanism', fn);
}
