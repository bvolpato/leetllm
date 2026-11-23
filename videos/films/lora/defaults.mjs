import { num, sum, scale, point, project } from './geometry.mjs';
export function text(
  ctx,
  api,
  s,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, s, x, y, size, color, align, font);
}
export function math(ctx, api, s, x, y, size = 46, color = api.C.ink, align = 'left') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function rect(ctx, api, x, y, w, h, fill = api.C.panel, stroke, radius = 12) {
  return api.rect(ctx, x, y, w, h, fill, stroke, radius);
}
export function line(ctx, api, a, b, color = api.C.muted, width = 3) {
  return api.line(ctx, a.x, a.y, b.x, b.y, color, width);
}
export function arrow(ctx, api, a, b, color = api.C.cyan, width = 5) {
  return api.arrow(ctx, a.x, a.y, b.x, b.y, color, width);
}
export function circle(ctx, api, x, y, r = 8, color = api.C.cyan) {
  return api.circle(ctx, x, y, r, color);
}
export function fade(ctx, api, alpha, fn) {
  return api.components.fade(alpha, fn);
}
export function matrix(ctx, api, values, x, y, cell = 76, color = api.C.cyan, options = {}) {
  const rows = values.length,
    cols = values[0].length;
  const outer = rect(
    ctx,
    api,
    x - 12,
    y - 12,
    cols * cell + 24,
    rows * cell + 24,
    api.C.panel,
    color,
    16,
  );
  api.container(
    ctx,
    outer,
    () => {
      api.components.matrix({
        values,
        x,
        y,
        cellSize: cell,
        gap: 6,
        inset: 3,
        format: num,
        style: {
          radius: 5,
          padding: 3,
          font: 'mono',
          baselineOffset: 11,
        },
        cellStyle: (value, i, j) => {
          const visible =
            options.reveal === undefined || options.reveal >= (i * cols + j + 1) / (rows * cols);
          const active = options.highlight?.[0] === i && options.highlight?.[1] === j;
          const label = num(value);
          return {
            fill: active ? '#f4d47730' : value < 0 ? '#ef9ac81a' : '#63deec14',
            stroke: active ? api.C.yellow : undefined,
            fontSize: Math.min(34, cell * 0.42, (cell - 18) / Math.max(1, label.length) / 0.65),
            textColor: active ? api.C.yellow : color,
            labelOpacity: visible ? 1 : 0,
          };
        },
      });
    },
    {
      padding: 10,
    },
  );
  return outer;
}
export function node(ctx, api, x, y, w, h, title, subtitle, color = api.C.blue) {
  const b = rect(ctx, api, x, y, w, h, api.C.panel, color, 18);
  api.container(
    ctx,
    b,
    () => {
      math(ctx, api, title, x + w / 2, y + h * 0.42, 48, color, 'center');
      if (subtitle) text(ctx, api, subtitle, x + w / 2, y + h * 0.78, 28, api.C.muted, 'center');
    },
    {
      padding: 16,
    },
  );
  return b;
}
export function route(ctx, api, from, to, color, progress = 1) {
  const r = api.connect(ctx, from, to, {
    color,
    width: 4,
    gap: 9,
  });
  api.components.particle({
    points: [r.from, r.to],
    progress,
    radius: 8,
    fill: color,
  });
  return r;
}
export function axes2(ctx, api, origin = point(500, 710), unit = 105) {
  for (let i = -2; i <= 4; i++) {
    line(
      ctx,
      api,
      point(origin.x + i * unit, origin.y + 2 * unit),
      point(origin.x + i * unit, origin.y - 4 * unit),
      '#8d9cb920',
      1,
    );
  }
  for (let i = -2; i <= 4; i++)
    line(
      ctx,
      api,
      point(origin.x - 2 * unit, origin.y - i * unit),
      point(origin.x + 4 * unit, origin.y - i * unit),
      '#8d9cb920',
      1,
    );
  arrow(
    ctx,
    api,
    point(origin.x - 2 * unit, origin.y),
    point(origin.x + 4.2 * unit, origin.y),
    api.C.muted,
    2,
  );
  arrow(
    ctx,
    api,
    point(origin.x, origin.y + 2 * unit),
    point(origin.x, origin.y - 4.2 * unit),
    api.C.muted,
    2,
  );
  return (vector) => point(origin.x + vector[0] * unit, origin.y - vector[1] * unit);
}
export function axes3(ctx, api) {
  const o = project([0, 0, 0]);
  for (let axis = 0; axis < 3; axis++) {
    const a = [0, 0, 0],
      b = [0, 0, 0];
    a[axis] = -2.3;
    b[axis] = 2.6;
    arrow(ctx, api, project(a), project(b), '#8d9cb966', 2);
  }
  circle(ctx, api, o.x, o.y, 5, api.C.ink);
  return o;
}
export function drawPlane(ctx, api, reveal = 1, first, second) {
  const corners = [
    [-1.65, -1.65],
    [1.65, -1.65],
    [1.65, 1.65],
    [-1.65, 1.65],
  ].map(([u, v]) => project(sum(scale(first, u), scale(second, v))));
  fade(ctx, api, reveal, () => {
    api.path(ctx, corners, {
      closed: true,
      color: '#f4d47770',
      width: 2,
      fill: '#f4d47710',
    });
    for (let t = -1.5; t <= 1.5; t += 0.5) {
      line(
        ctx,
        api,
        project(sum(scale(first, -1.65), scale(second, t))),
        project(sum(scale(first, 1.65), scale(second, t))),
        '#f4d47730',
        1,
      );
      line(
        ctx,
        api,
        project(sum(scale(first, t), scale(second, -1.65))),
        project(sum(scale(first, t), scale(second, 1.65))),
        '#f4d47730',
        1,
      );
    }
  });
}
