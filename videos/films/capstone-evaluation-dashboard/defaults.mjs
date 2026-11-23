import { ids } from './fixtures.mjs';
import { sum } from './arithmetic.mjs';
export function originalText(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function originalCard(ctx, api, v, x, y, w = 550, color = api.C.cyan, h = 110) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 28,
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function originalMatrix(ctx, api, x, title, values) {
  originalText(ctx, api, title, x + 330, 300, 33, api.C.ink, 'center');
  api.teaching.grid({
    x,
    cellFocusTarget: (row) =>
      `${x === 170 ? 'baseline' : 'candidate'}-${['policy', 'paraphrase', 'unsupported', 'private-note'][row]}`,
    y: 380,
    width: 660,
    height: 420,
    rows: 4,
    columns: 2,
    labels: ids.map((id, i) => [id, values[i] ? 'PASS' : 'FAIL']),
    fontSize: 26,
    padding: 12,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: api.C.ink,
    highlights: values.map((v, i) => ({
      row: i,
      column: 1,
      fill: api.C.panel,
      stroke: v ? api.C.green : api.C.pink,
    })),
  });
  api.focus.target('run-totals', () =>
    originalText(
      ctx,
      api,
      sum(values) + '/4 = ' + (sum(values) / 4) * 100 + '%',
      x + 330,
      900,
      48,
      api.C.yellow,
      'center',
    ),
  );
}
export function dashboardText(
  ctx,
  api,
  v,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, String(v), x, y, size, color, align, font);
}
export function dashboardBox(ctx, api, x, y, w, h, color = api.C.muted) {
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
export function dashboardCell(ctx, api, v, x, y, w = 240, h = 80, color = api.C.cyan, size = 28) {
  dashboardBox(ctx, api, x, y, w, h, color);
  const parts = String(v).split('\n');
  parts.forEach((part, i) =>
    dashboardText(
      ctx,
      api,
      part,
      x + w / 2,
      y + h / 2 + (i - (parts.length - 1) / 2) * size * 1.35 + size * 0.34,
      size,
      color,
      'center',
    ),
  );
}
export function dashboardLines(ctx, api, values, x, y, size = 30, color = api.C.ink) {
  return values.forEach((v, i) => dashboardText(ctx, api, v, x, y + i * size * 1.5, size, color));
}
export function dashboardNote(ctx, api, v) {
  return dashboardText(ctx, api, v, 960, 1015, 26, api.C.muted, 'center');
}
export function dashboardLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
