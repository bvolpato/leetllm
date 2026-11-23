export function text(ctx, api, v, a, y, n = 36, k = api.C.ink, align = 'left') {
  return api.text(ctx, v, a, y, n, k, align);
}
export function equation(ctx, api, v, a, y, n = 48, k = api.C.ink, align = 'left') {
  return api.math(ctx, v, a, y, n, k, align);
}
export function vector(ctx, api, a, px, py, k = api.C.cyan) {
  return api.components.matrix({
    values: [a.map((v) => v.toFixed(3))],
    x: px,
    y: py,
    cellSize: 155,
    gap: 8,
    style: {
      fill: api.C.panel,
      stroke: k,
      textColor: k,
      fontSize: 36,
      padding: 10,
      font: 'mono',
    },
  });
}
export function featureChart(ctx, api, vals, color = api.C.cyan) {
  const q = api.teaching.axes({
    x: 260,
    y: 390,
    width: 1000,
    height: 360,
    xDomain: [0.5, 4.5],
    yDomain: [-4, 6],
    xTicks: [1, 2, 3, 4],
    yTicks: [-3, 0, 3, 6],
    xLabel: 'feature coordinate',
    yLabel: 'value',
    fontSize: 34,
  });
  api.teaching.curve({
    plot: q,
    points: vals.map((y, i) => ({
      x: i + 1,
      y,
    })),
    color,
    width: 5,
  });
  api.teaching.scatter({
    plot: q,
    points: vals.map((y, i) => ({
      x: i + 1,
      y,
    })),
    color,
    radius: 10,
  });
  return q;
}
