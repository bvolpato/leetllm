import { clip } from './arithmetic.mjs';
import { CASES, auditFocusRegions } from './fixtures.mjs';
export function auditFocusApi(api, scene) {
  const declarations = scene.beats
    .flatMap((beat) => beat.visual_cues ?? [])
    .filter((cue) => cue.id.startsWith('ba-'));
  const regions = declarations.map((cue) => {
    const name = cue.id.replace('ba-' + scene.id + '-', '');
    return {
      targets: cue.targets,
      bounds: auditFocusRegions[scene.id]?.[name] ?? [140, 250, 1660, 740],
    };
  });
  const paint = (x, y, draw) => {
    const ids = [
      ...new Set(
        regions
          .filter(({ bounds: [rx, ry, w, h] }) => x >= rx && x <= rx + w && y >= ry && y <= ry + h)
          .flatMap((region) => region.targets),
      ),
    ];
    return ids.reduceRight((next, id) => () => api.focus.target(id, next), draw)();
  };
  const wrapped = {
    ...api,
  };
  for (const key of ['text', 'math'])
    wrapped[key] = (...args) => paint(args[2], args[3], () => api[key](...args));
  wrapped.circle = (...args) => paint(args[1], args[2], () => api.circle(...args));
  wrapped.rect = (...args) =>
    paint(args[1] + args[3] / 2, args[2] + args[4] / 2, () => api.rect(...args));
  wrapped.line = (...args) =>
    paint((args[1] + args[3]) / 2, (args[2] + args[4]) / 2, () => api.line(...args));
  wrapped.components = {
    ...api.components,
  };
  for (const key of ['panel', 'card'])
    wrapped.components[key] = (config) =>
      paint(config.x + config.width / 2, config.y + config.height / 2, () =>
        api.components[key](config),
      );
  wrapped.teaching = {
    ...api.teaching,
  };
  for (const key of ['axes', 'grid'])
    wrapped.teaching[key] = (config) =>
      paint(config.x + config.width / 2, config.y + config.height / 2, () =>
        api.teaching[key](config),
      );
  return wrapped;
}
export function visualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function text(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, value, x, y, size, color, align);
}
export function equation(ctx, api, value, x, y, size = 42, color = api.C.yellow) {
  return api.math(ctx, value, x, y, size, color, 'center');
}
export function card(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 86,
  fontSize = 29,
  opacity = 1,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize,
    baselineOffset: label.includes('\n') ? -16 : 0,
    padding: 12,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    opacity,
  });
}
export function caseGrid(ctx, api, model, x, y, width, height, revealed = 100, showIds = true) {
  const rows = revealed === 100 ? CASES.filter((row) => !row[model]) : CASES.slice(0, revealed);
  const grid = api.teaching.grid({
    x,
    y,
    width,
    height,
    rows: 10,
    columns: 10,
    fill: revealed === 100 ? '#8cdeb52b' : api.C.panel,
    stroke: '#526882',
    lineWidth: 1,
    labels: showIds
      ? Array.from(
          {
            length: 10,
          },
          (_, row) =>
            Array.from(
              {
                length: 10,
              },
              (_, column) => (column === 9 ? 'Q' + (91 + row) : ''),
            ),
        )
      : undefined,
    fontSize: 17,
    textColor: api.C.ink,
    highlights: rows.map((row) => {
      const index = CASES.indexOf(row);
      return {
        row: index < 90 ? Math.floor(index / 9) : index - 90,
        column: index < 90 ? index % 9 : 9,
        fill: row[model] ? '#8cdeb52b' : api.C.pink,
      };
    }),
  });
  return grid.shape;
}
export function drawAuditExpansionText(
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
export function drawAuditExpansionBox(
  ctx,
  api,
  x,
  y,
  w,
  h,
  color = api.C.muted,
  fill = api.C.panel,
) {
  return api.components.panel({
    x,
    y,
    width: w,
    height: h,
    fill,
    stroke: color,
    radius: 10,
  });
}
export function drawAuditExpansionCell(
  ctx,
  api,
  v,
  x,
  y,
  w = 420,
  h = 100,
  color = api.C.cyan,
  size = 29,
) {
  drawAuditExpansionBox(ctx, api, x, y, w, h, color);
  const rows = String(v).split('\n');
  rows.forEach((v, i) =>
    drawAuditExpansionText(
      ctx,
      api,
      v,
      x + w / 2,
      y + h / 2 + (i - (rows.length - 1) / 2) * size * 1.35 + size * 0.34,
      size,
      color,
      'center',
    ),
  );
}
export function drawAuditExpansionLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawAuditExpansionNote(ctx, api, v) {
  return drawAuditExpansionText(ctx, api, v, 960, 1015, 25, api.C.muted, 'center');
}
export function drawAuditExpansionBar(ctx, api, value, x, y, width, color, h = 44) {
  drawAuditExpansionBox(ctx, api, x, y, width, h, api.C.muted);
  if (value > 0) api.rect(ctx, x + 3, y + 3, (width - 6) * clip(value), h - 6, color, undefined, 0);
}
export function drawAuditExpansionDots(
  ctx,
  api,
  n,
  x,
  y,
  cols,
  color,
  size = 20,
  gap = 32,
  labels = false,
) {
  for (let i = 0; i < n; i++) {
    api.circle(ctx, x + (i % cols) * gap, y + Math.floor(i / cols) * gap, size / 2, color);
    if (labels)
      drawAuditExpansionText(
        ctx,
        api,
        i + 1,
        x + (i % cols) * gap,
        y + Math.floor(i / cols) * gap + 6,
        15,
        api.C.bg,
        'center',
      );
  }
}
export function drawAuditExpansionArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan) {
  drawAuditExpansionLine(ctx, api, x1, y1, x2, y2, color, 4);
  const a = Math.atan2(y2 - y1, x2 - x1);
  drawAuditExpansionLine(
    ctx,
    api,
    x2,
    y2,
    x2 - 14 * Math.cos(a - 0.5),
    y2 - 14 * Math.sin(a - 0.5),
    color,
    4,
  );
  drawAuditExpansionLine(
    ctx,
    api,
    x2,
    y2,
    x2 - 14 * Math.cos(a + 0.5),
    y2 - 14 * Math.sin(a + 0.5),
    color,
    4,
  );
}
