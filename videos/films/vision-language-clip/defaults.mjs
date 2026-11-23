export function drawMatchText(ctx, api, value, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(value), x, y, size, color, align);
}
export function drawMatchEquation(
  ctx,
  api,
  value,
  x,
  y,
  size = 40,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, value, x, y, size, color, align);
}
export function drawMatchCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  height = 88,
  color = api.C.cyan,
  fontSize = 30,
  opacity = 1,
) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    radius: 14,
    padding: 12,
    fontSize,
    opacity,
  });
}
export function drawClipText(ctx, api, v, x, y, size = 31, col = api.C.ink) {
  return api.text(ctx, String(v), x, y, size, col, 'center');
}
export function drawClipEquation(ctx, api, v, x, y, size = 43, col = api.C.yellow) {
  return api.math(ctx, v, x, y, size, col, 'center');
}
export function drawClipRectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 2);
}
export function drawClipLine(ctx, api, x, y, u, v, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function withClipFocus(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function inspectionCueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function inspectionCueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function drawInspectionText(ctx, api, s, x, y, size = 30, color = api.C.ink) {
  return api.text(ctx, String(s), x, y, size, color, 'center');
}
export function drawInspectionRectangle(
  ctx,
  api,
  x,
  y,
  w,
  h,
  fill = api.C.panel,
  stroke = api.C.line,
) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 10);
}
export function drawInspectionLine(ctx, api, x, y, u, v, color = api.C.line, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function drawInspectionEquation(ctx, api, s, x, y, size = 40, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawInspectionBox(ctx, api, s, x, y, w, h = 100, color = api.C.cyan) {
  drawInspectionRectangle(ctx, api, x, y, w, h, api.C.panel, color);
  const lines = String(s).split('\n');
  lines.forEach((z, i) =>
    drawInspectionText(
      ctx,
      api,
      z,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * 38 + 10,
      29,
      color,
    ),
  );
}
export function drawVent(ctx, api, x, y, w, h, obstruction) {
  const { C } = api;
  api.rect(ctx, x, y, w, h, C.muted, undefined, h * 0.045);
  for (const sx of [x + w * 0.045, x + w * 0.955]) {
    for (const sy of [y + h * 0.105, y + h * 0.895]) {
      const radius = Math.min(h * 0.048, w * 0.019);
      api.circle(ctx, sx, sy, radius, C.panel);
      api.line(
        ctx,
        sx - radius / 2,
        sy + radius / 2,
        sx + radius / 2,
        sy - radius / 2,
        C.muted,
        radius / 3,
      );
    }
  }
  for (let j = 0; j < 5; j++) {
    const sy = y + (0.15 + 0.15 * j) * h;
    api.rect(ctx, x + w * 0.095, sy, w * 0.81, h * 0.105, C.bg, undefined, h * 0.04);
    api.line(ctx, x + w * 0.115, sy + h * 0.116, x + w * 0.885, sy + h * 0.116, C.ink, h * 0.015);
  }
  if (obstruction) {
    const corner = (u, v) => ({ x: x + u * w, y: y + v * h });
    api.path(
      ctx,
      [
        corner(0.5, 0.08),
        corner(0.86, 0.04),
        corner(0.89, 0.76),
        corner(0.83, 0.92),
        corner(0.53, 0.96),
      ],
      { fill: C.pink, width: 0, closed: true },
    );
    api.path(ctx, [corner(0.89, 0.76), corner(0.83, 0.92), corner(0.82, 0.77)], {
      fill: C.ink,
      width: 0,
      closed: true,
    });
  }
}

export function rackPhoto(
  ctx,
  api,
  x,
  y,
  w,
  h,
  {
    tag = true,
    vent = true,
    grid = 0,
    selected,
    obstruction = true,
    tagText = 'RACK-17',
    taped = false,
  } = {},
) {
  const { C } = api,
    R = (u, v, a, b, c, s) => api.rect(ctx, u, v, a, b, c, s, 2);
  R(x, y, w, h, C.panel, C.muted);
  R(x + w * 0.17, y + h * 0.08, w * 0.66, h * 0.84, C.bg, C.cyan);
  // The grille occupies the two middle rack units.
  for (const k of [0, 3, 4]) {
    const sy = y + h * (0.16 + k * 0.1);
    R(x + w * 0.25, sy, w * 0.5, h * 0.055, C.panel, C.muted);
    for (let j = 0; j < 5; j++)
      R(x + w * (0.32 + j * 0.065), sy + h * 0.014, w * 0.035, h * 0.018, C.cyan);
  }
  if (vent) drawVent(ctx, api, x + w * 0.25, y + h * 0.27, w * 0.5, h * 0.16, obstruction);
  if (tag) {
    R(x + w * 0.29, y + h * 0.68, w * 0.4, h * 0.09, C.ink);
    if (taped) {
      api.text(ctx, 'R', x + w * 0.34, y + h * 0.745, w * 0.038, C.bg, 'center');
      api.text(ctx, tagText.slice(-1), x + w * 0.64, y + h * 0.745, w * 0.038, C.bg, 'center');
      R(x + w * 0.39, y + h * 0.663, w * 0.2, h * 0.125, C.yellow);
    } else {
      api.text(ctx, tagText, x + w * 0.49, y + h * 0.745, Math.max(12, w * 0.038), C.bg, 'center');
    }
  }
  R(x + w * 0.72, y + h * 0.12, w * 0.08, h * 0.13, C.yellow);
  if (grid)
    for (let k = 1; k < grid; k++) {
      const v = k / grid;
      if (tag && v > 0.27 && v < 0.71) {
        api.line(ctx, x + w * v, y, x + w * v, y + h * 0.66, C.muted, 1);
        api.line(ctx, x + w * v, y + h * 0.79, x + w * v, y + h, C.muted, 1);
      } else api.line(ctx, x + w * v, y, x + w * v, y + h, C.muted, 1);
      if (tag && v > 0.66 && v < 0.79) {
        api.line(ctx, x, y + h * v, x + w * 0.27, y + h * v, C.muted, 1);
        api.line(ctx, x + w * 0.71, y + h * v, x + w, y + h * v, C.muted, 1);
      } else api.line(ctx, x, y + h * v, x + w, y + h * v, C.muted, 1);
    }
  const areas = {
    vent: [0.25, 0.27, 0.5, 0.16],
    tag: [0.29, 0.68, 0.4, 0.09],
    layout: [0.17, 0.08, 0.66, 0.84],
    decoration: [0.72, 0.12, 0.08, 0.13],
  };
  if (selected) {
    const r = areas[selected];
    R(x + w * r[0], y + h * r[1], w * r[2], h * r[3], 'transparent', C.yellow);
  }
  return areas;
}

export function libraryPhoto(ctx, api, index, x, y, width, height) {
  return rackPhoto(ctx, api, x, y, width, height, {
    obstruction: index === 0,
    taped: index === 1,
    tagText: ['RACK-17', 'RACK-08', 'RACK-42'][index],
  });
}
