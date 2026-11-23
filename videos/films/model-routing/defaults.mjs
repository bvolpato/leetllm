export function cents(microdollars) {
  return (microdollars / 10000).toFixed(2) + '¢';
}

export function text(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 90) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    padding: 14,
    baselineOffset: label.includes('\n') ? -15 : 0,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
