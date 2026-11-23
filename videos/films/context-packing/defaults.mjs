import { exchanges } from './fixtures.mjs';
export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function card(ctx, api, label, x, y, width, color = api.C.cyan, height = 88) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    baselineOffset: label.includes('\n') ? -15 : 0,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function allocationStrip(ctx, api, sceneId, items, y = 690) {
  if (sceneId === 'budget')
    api.components.panel({
      x: 140,
      y: y - 8,
      width: 1600,
      height: 126,
      fill: 'rgba(0,0,0,0)',
      stroke: api.C.muted,
    });
  let cursor = 140;
  const all = [
    {
      id: 'Instructions',
      units: 4,
      color: api.C.blue,
    },
    {
      id: 'Question',
      units: 4,
      color: api.C.cyan,
    },
    ...items.map((item) => ({
      ...item,
      color: item.id.startsWith('D1') ? api.C.yellow : api.C.green,
    })),
  ];
  const used = all.reduce((sum, item) => sum + item.units, 0);
  if (used < 24 && sceneId === 'budget') {
    api.rect(
      ctx,
      140 + used * 50 + 6,
      y + 8,
      (24 - used) * 50 - 12,
      94,
      api.C.panel,
      api.C.muted,
      0,
    );
    api.focus.target('budget-readout', () =>
      text(
        ctx,
        api,
        `${24 - used} free input units`,
        140 + (used + 24) * 25,
        y + 66,
        25,
        api.C.muted,
        'center',
      ),
    );
  }
  all.forEach((item) => {
    const paint = () =>
      card(
        ctx,
        api,
        `${item.id.startsWith('D1') ? 'D1 note' : item.id}\n${item.units} units`,
        cursor + 6,
        y,
        item.units * 50 - 12,
        item.color,
        110,
      );
    api.focus.target(
      item.id === 'Instructions'
        ? 'protected-instructions'
        : item.id === 'Question'
          ? 'current-question'
          : item.id.startsWith('D1')
            ? 'source-note'
            : 'recent-exchanges',
      () => {
        const exchange = exchanges.findIndex((row) => row.id === item.id);
        return exchange < 0 ? paint() : api.focus.target('recent-exchange-' + exchange, paint);
      },
    );
    cursor += item.units * 50;
  });
  api.focus.target('output-reserve', () =>
    card(ctx, api, 'Answer\n8 units', 1346, y, 388, api.C.pink, 110),
  );
  api.focus.target('context-accounting', () =>
    text(
      ctx,
      api,
      `Input ${used} + output reserve 8 = ${used + 8} / 32`,
      140,
      y + 190,
      32,
      api.C.ink,
    ),
  );
  return used;
}
export function contextText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'center') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 44, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function valueBar(ctx, api, x, y, width, value, max, color, height = 60) {
  api.rect(ctx, x, y, width, height, api.C.panel, api.C.muted, 1);
  if (value > 0) api.rect(ctx, x, y, (width * value) / max, height, color, color, 1);
}
export function cellGrid(ctx, api, x, y, rows, cols, cell, fill) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      api.rect(ctx, x + c * cell, y + r * cell, cell - 4, cell - 4, fill(r, c), api.C.muted, 1);
}
export function ring(ctx, api, x, y, r, color) {
  return api.circle(ctx, x, y, r, 'transparent', color, 3);
}
export function radialArrow(ctx, api, x, y, r, angle, color, width = 5) {
  return api.arrow(ctx, x, y, x + r * Math.cos(angle), y - r * Math.sin(angle), color, width);
}
export function footer(ctx, api, v, color = api.C.muted) {
  return contextText(ctx, api, v, 960, 1005, 27, color);
}
export function modelTarget(ctx, api, sceneId, paint) {
  return api.focus.target(sceneId + '-model', paint);
}
