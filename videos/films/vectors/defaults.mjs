import { WORDS } from './fixtures.mjs';
export const formatNumber = (value) => Number(value.toFixed(2)).toString();
export const outputPlaneCoordinates = (values) => [values[0], values[2]];
export const formatExtendedNumber = (v) => Number(v.toFixed(2)).toString();
export const formatVectorValue = (v) =>
  [
    [1 / 3, '1/3'],
    [2 / 3, '2/3'],
    [1 / 6, '1/6'],
    [5 / 6, '5/6'],
  ].find(([n]) => Math.abs(n - v) < 1e-10)?.[1] ?? formatExtendedNumber(v);
export function drawText(ctx, api, value, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function drawEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 44,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawCaption(ctx, api, value) {
  return drawText(ctx, api, value, 960, 1010, 27, api.C.muted, 'center');
}
export function drawMatrix(
  ctx,
  api,
  values,
  x,
  y,
  color = api.C.cyan,
  cell = 112,
  visible = () => true,
  style = () => ({}),
) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap: 8,
    format: (value, r, c) => (visible(r, c) ? formatNumber(value) : '?'),
    style: {
      fill: api.C.panel,
      stroke: color,
      textColor: color,
      fontSize: 34,
      padding: 8,
      radius: 8,
      font: 'mono',
    },
    cellStyle: style,
  });
}
export function drawRow(
  ctx,
  api,
  values,
  x,
  y,
  color = api.C.cyan,
  cell = 130,
  visible = () => true,
) {
  return drawMatrix(ctx, api, [values], x, y, color, cell, (_r, c) => visible(c));
}
export function outputAxes(
  ctx,
  api,
  x = 1050,
  y = 330,
  width = 660,
  height = 430,
  xLabel = 'first output',
  yLabel = 'third output',
  max = 1.25,
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain: [-0.2, max],
    yDomain: [-0.2, max],
    xTicks: max > 1.5 ? [0, 0.5, 1, 1.5] : [0, 0.5, 1],
    yTicks: max > 1.5 ? [0, 0.5, 1, 1.5] : [0, 0.5, 1],
    xLabel,
    yLabel,
    equalUnits: true,
    fontSize: 25,
    gridColor: '#8d9cb91a',
  });
}
export function outputArrow(ctx, api, axes, from, to, color, width = 7) {
  if (Math.hypot(to[0] - from[0], to[1] - from[1]) < 1e-9) return;
  const a = axes.point(...from),
    z = axes.point(...to);
  api.arrow(ctx, a.x, a.y, z.x, z.y, color, width);
}
export function outputMarker(ctx, api, axes, value, color, radius = 13) {
  const p = axes.point(...value);
  return api.circle(ctx, p.x, p.y, radius, color);
}
export function drawWords(ctx, api, b, y, selected = false) {
  drawText(ctx, api, 'Message ' + (b ? 'B' : 'A'), 210, y + 55, 30, api.C.muted);
  WORDS[b].forEach((word, t) =>
    drawTarget(ctx, api, b === 0 && t === 2 ? 'password-word' : 'word-' + b + '-' + t, () => {
      const x = 510 + t * 350,
        color = selected && b === 0 && t === 2 ? api.C.yellow : api.C.cyan;
      api.components.card({
        label: word,
        x,
        y,
        width: 300,
        height: 88,
        fill: api.C.panel,
        stroke: color,
        textColor: color,
        fontSize: 34,
        padding: 12,
      });
    }),
  );
}
export function drawOwnedMatrix(
  ctx,
  api,
  b,
  values,
  x,
  y,
  { id, visible, selected = false, controls = false } = {},
) {
  const cell = 112,
    output = values[0].length === 3;
  drawText(
    ctx,
    api,
    'Message ' + (b ? 'B' : 'A') + ' · ' + WORDS[b].join(' '),
    x + (cell * values[0].length) / 2,
    y - 65,
    31,
    b ? api.C.pink : api.C.blue,
    'center',
  );
  for (let t = 0; t < 3; t++) {
    const color =
      selected && b === 0 && t === 2 ? api.C.yellow : controls ? api.C.muted : api.C.ink;
    const drawRow = () => {
      drawText(ctx, api, WORDS[b][t], x - 30, y + t * cell + 70, 31, color, 'right');
      return drawMatrix(
        ctx,
        api,
        [values[t]],
        x,
        y + t * cell,
        api.C.cyan,
        cell,
        (_r, c) => (visible ? visible(t, c) : true),
        (_v, _r, c) => ({
          stroke:
            selected && b === 0 && t === 2 ? (c === 1 ? api.C.muted : api.C.green) : api.C.muted,
          textColor:
            selected && b === 0 && t === 2 ? (c === 1 ? api.C.muted : api.C.green) : api.C.ink,
        }),
      );
    };
    const targetId =
      b === 0 && t === 2 && output
        ? 'password-output'
        : b === 1 && t === 2
          ? 'address-row'
          : (id ?? 'owned') + '-' + t;
    drawTarget(ctx, api, targetId, drawRow);
  }
}
export function drawExtendedText(ctx, api, s, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function drawExtendedEquation(ctx, api, s, x, y, size = 44, color = api.C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawExtendedTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawFooter(ctx, api, s) {
  return drawExtendedText(ctx, api, s, 960, 1010, 25, api.C.muted, 'center');
}
export function drawLine(ctx, api, a, b, color = api.C.muted, width = 2) {
  return api.line(ctx, ...a, ...b, color, width);
}
export function drawMatrixBlock(
  ctx,
  api,
  values,
  x,
  y,
  {
    cell = 100,
    fontSize = 32,
    color = api.C.ink,
    visible = () => true,
    select = () => false,
    label,
    rowNames,
    columnNames,
  } = {},
) {
  const rows = values.length,
    cols = values[0].length,
    gap = 8,
    width = cols * cell - gap,
    height = rows * cell - gap;
  if (label)
    drawExtendedText(
      ctx,
      api,
      label,
      x + width / 2,
      y - (columnNames ? 75 : 35),
      31,
      color,
      'center',
    );
  rowNames?.forEach((name, i) =>
    drawExtendedText(
      ctx,
      api,
      name,
      x - 24,
      y + i * cell + (cell - gap) / 2 + 29 * 0.34,
      29,
      api.C.muted,
      'right',
    ),
  );
  columnNames?.forEach((name, i) =>
    drawExtendedText(
      ctx,
      api,
      name,
      x + i * cell + (cell - gap) / 2,
      y - 22,
      27,
      api.C.muted,
      'center',
    ),
  );
  const drawn = api.components.matrix({
    values,
    x,
    y,
    cellSize: cell,
    gap,
    format: (v, r, c) =>
      visible(r, c) ? (typeof v === 'number' ? formatVectorValue(v) : String(v)) : '?',
    style: {
      fill: 'transparent',
      stroke: 'transparent',
      textColor: color,
      fontSize,
      padding: 8,
      font: 'mono',
    },
    cellStyle: (_v, r, c) => ({
      fill: select(r, c) ? api.C.yellow + '16' : 'transparent',
      textColor: select(r, c) ? api.C.yellow : color,
    }),
  });
  for (const side of [x - 7, x + width + 7]) {
    const inward = side < x ? 9 : -9;
    drawLine(ctx, api, [side + inward, y + 2], [side, y + 2]);
    drawLine(ctx, api, [side, y + 2], [side, y + height - 2]);
    drawLine(ctx, api, [side, y + height - 2], [side + inward, y + height - 2]);
  }
  return {
    ...drawn,
    x,
    y,
    width,
    height,
  };
}
export function coordinateAxes(
  ctx,
  api,
  x,
  y,
  width,
  height,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  ticks,
) {
  return api.teaching.axes({
    x,
    y,
    width,
    height,
    xDomain,
    yDomain,
    equalUnits: true,
    xLabel,
    yLabel,
    xTicks: ticks,
    yTicks: ticks,
    fontSize: 26,
    gridColor: api.C.muted + '18',
  });
}
export function coordinateArrow(ctx, api, p, from, to, color = api.C.cyan, width = 6) {
  if (Math.hypot(to[0] - from[0], to[1] - from[1]) > 1e-9) {
    const a = p.point(...from),
      b = p.point(...to);
    api.arrow(ctx, a.x, a.y, b.x, b.y, color, width);
  }
}
export function coordinateDot(ctx, api, p, point, color = api.C.green, radius = 8) {
  const a = p.point(...point);
  api.circle(ctx, a.x, a.y, radius, color);
}
export function drawResult(ctx, api, value, x, y, reveal, color = api.C.green, size = 48) {
  return drawExtendedText(
    ctx,
    api,
    reveal ? value : '?',
    x,
    y,
    size,
    reveal ? color : api.C.muted,
    'center',
  );
}
export function drawDuration(
  ctx,
  api,
  x,
  y,
  contributions,
  labels,
  colors,
  width = 1050,
  maximum = 8,
) {
  drawLine(ctx, api, [x, y + 90], [x + width, y + 90]);
  for (let n = 0; n <= maximum; n++) {
    const px = x + (n / maximum) * width;
    drawLine(ctx, api, [px, y + 85], [px, y + 99]);
    drawExtendedText(ctx, api, n, px, y + 136, 27, api.C.muted, 'center');
  }
  let prefix = 0;
  contributions.forEach((v, i) => {
    if (v > 0) {
      const left = x + (prefix / maximum) * width,
        w = (v / maximum) * width;
      api.rect(ctx, left, y + 25, w, 40, colors[i]);
      if (w > 120)
        drawExtendedText(
          ctx,
          api,
          formatVectorValue(v),
          left + w / 2,
          y + 53,
          27,
          api.C.bg,
          'center',
        );
    }
    prefix += v;
  });
  labels.forEach((label, i) =>
    drawExtendedText(ctx, api, label, x + (i * width) / 2, y - 14, 29, colors[i]),
  );
}
