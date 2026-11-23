import { mix } from './arithmetic.mjs';
import { wrap } from '../../lib/scene.mjs';
export function drawSqlText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align, String(v).includes('_') ? 'mono' : 'sans');
}
export function drawSqlEquation(ctx, api, v, x, y, size = 39, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function withSqlFocus(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function withSqlFade(ctx, api, p, paint) {
  return api.components.fade(p, paint);
}
export function wrapSqlText(ctx, api, v, width, size = 29) {
  ctx.save();
  ctx.font = `500 ${size}px "Lesson Sans"`;
  const out = wrap(ctx, v, width);
  ctx.restore();
  return out.join('\n');
}
export function drawSqlCaption(ctx, api, v) {
  return drawSqlText(ctx, api, v, 960, 1010, 25, api.C.muted, 'center');
}
export function drawSqlBox(ctx, api, x, y, width, height, color = api.C.blue) {
  api.rect(ctx, x, y, width, height, api.C.panel, color, 2, 8);
  return {
    x,
    y,
    width,
    height,
  };
}
export function drawSqlRow(
  ctx,
  api,
  id,
  text,
  x,
  y,
  width = 760,
  color = api.C.cyan,
  height = 136,
) {
  const bounds = drawSqlBox(ctx, api, x, y, width, height, color);
  api.labelScope(
    ctx,
    bounds,
    () => {
      drawSqlText(ctx, api, id, x + 20, y + 34, 24, color);
      drawSqlText(
        ctx,
        api,
        wrapSqlText(ctx, api, text, width - 40, 29),
        x + 20,
        y + 82,
        29,
        api.C.ink,
      );
    },
    {
      padding: 12,
    },
  );
  return bounds;
}
export function drawSqlGrid(
  ctx,
  api,
  values,
  x,
  y,
  width,
  height,
  color = api.C.blue,
  fontSize = 28,
  highlights = [],
  cellFocusTarget,
) {
  return api.teaching.grid({
    x,
    y,
    width,
    height,
    rows: values.length,
    columns: values[0].length,
    labels: values,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize,
    padding: 10,
    highlights,
    cellFocusTarget,
  });
}
export function drawSqlTable(
  ctx,
  api,
  headers,
  values,
  x,
  y,
  widths,
  h = 78,
  color = api.C.blue,
  highlights = [],
  cellTargets,
) {
  let left = x;
  const grids = widths.map((width, j) => {
    drawSqlText(ctx, api, headers[j], left + width / 2, y - 25, 25, color, 'center');
    const grid = drawSqlGrid(
      ctx,
      api,
      values.map((v) => [v[j]]),
      left,
      y,
      width,
      values.length * h,
      color,
      j === values[0].length - 1 ? 27 : 26,
      highlights
        .filter((v) => v.column === j)
        .map((v) => ({
          ...v,
          column: 0,
        })),
      cellTargets ? (r) => cellTargets(r, j) : undefined,
    );
    left += width;
    return grid;
  });
  return {
    cell: (r, c) => grids[c].cell(r, 0),
    bounds: {
      x,
      y,
      width: widths.reduce((a, v) => a + v, 0),
      height: values.length * h,
    },
  };
}
export function drawSqlLink(ctx, api, from, to, p = 1, color = api.C.cyan) {
  if (p <= 0) return;
  const a = {
      x: from.x + from.width + 12,
      y: from.y + from.height / 2,
    },
    z = {
      x: to.x - 12,
      y: to.y + to.height / 2,
    };
  api.arrow(ctx, a.x, a.y, mix(a.x, z.x, p), mix(a.y, z.y, p), color, 4);
}
export function drawExtendedSqlText(
  ctx,
  api,
  v,
  x,
  y,
  size = 29,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function drawExtendedSqlEquation(ctx, api, v, x, y, size = 36, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function drawExtendedSqlBox(ctx, api, x, y, w, h, color = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 2, 8);
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function drawExtendedSqlCard(
  ctx,
  api,
  v,
  x,
  y,
  w = 360,
  h = 80,
  color = api.C.cyan,
  size = 28,
) {
  const r = drawExtendedSqlBox(ctx, api, x, y, w, h, color);
  api.labelScope(
    ctx,
    r,
    () =>
      drawExtendedSqlText(ctx, api, v, x + w / 2, y + h / 2 + size * 0.32, size, color, 'center'),
    {
      padding: 10,
    },
  );
  return r;
}
export function drawExtendedSqlHeading(ctx, api, v) {
  return drawExtendedSqlText(ctx, api, v, 960, 260, 34, api.C.ink, 'center');
}
export function drawExtendedSqlFooter(ctx, api, v) {
  return drawExtendedSqlText(ctx, api, v, 960, 1020, 25, api.C.muted, 'center');
}
export function drawExtendedSqlGrid(
  ctx,
  api,
  labels,
  x,
  y,
  w,
  h,
  color = api.C.blue,
  fontSize = 26,
) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize,
    padding: 9,
  });
}
export function drawExtendedSqlArrow(ctx, api, a, z, p, color = api.C.cyan) {
  if (p > 0) api.arrow(ctx, a.x, a.y, mix(a.x, z.x, p), mix(a.y, z.y, p), color, 4);
}
