import { artifactDigest, bound, canonicalContent } from './arithmetic.mjs';
export function legacyText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function legacyCard(ctx, api, label, x, y, width = 350, color = api.C.blue, height = 95) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function chapterText(ctx, api, text, x, y, size = 28, color = api.C.ink, align = 'left') {
  return api.text(ctx, text, x, y, size, color, align);
}
export function chip(
  ctx,
  api,
  text,
  x,
  y,
  width = 250,
  color = api.C.blue,
  height = 70,
  size = 26,
) {
  return api.components.card({
    label: text,
    x,
    y,
    width,
    height,
    fontSize: size,
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function flow(ctx, api, a, z, p, color = api.C.cyan) {
  return api.teaching.transfer({
    source: {
      shape: a,
      opacity: 1,
    },
    target: {
      shape: z,
      opacity: 1,
    },
    progress: bound(p),
    color,
    particle: {
      radius: 7,
      fill: color,
    },
    margin: 3,
  });
}
export function footer(ctx, api, text, color = api.C.muted) {
  return chapterText(ctx, api, text, 960, 1010, 27, color, 'center');
}
export function table(ctx, api, x, y, widths, rows, colors = []) {
  return rows.map((row, r) =>
    row.map((value, col) =>
      chip(
        ctx,
        api,
        String(value),
        x + widths.slice(0, col).reduce((a, z) => a + z, 0),
        y + r * 83,
        widths[col] - 12,
        colors[r] ?? (r ? api.C.ink : api.C.muted),
        68,
        r ? 27 : 24,
      ),
    ),
  );
}
export function contentDigest(ctx, api, value) {
  return artifactDigest(typeof value === 'string' ? value : canonicalContent(value)).slice(0, 14);
}
