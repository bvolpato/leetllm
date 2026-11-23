import { lessonFont } from '../../lib/fonts.mjs';
export function drawGovernanceBodyVisualFocus(ctx, api, id, paint) {
  return api.focus ? api.focus.target(id, paint) : paint();
}
export function drawGovernanceBodyText(
  ctx,
  api,
  value,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, value, x, y, size, color, align);
}
export function drawGovernanceBodyEquation(ctx, api, value, x, y, size = 46) {
  return api.math(ctx, value, x, y, size, api.C.yellow, 'center');
}
export function drawGovernanceBodyCard(
  ctx,
  api,
  label,
  x,
  y,
  width = 440,
  color = api.C.blue,
  height = 100,
) {
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
export function drawGovernanceConstructionText(
  ctx,
  api,
  v,
  x,
  y,
  size = 30,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, v, x, y, size, color, align);
}
export function drawGovernanceConstructionBox(
  ctx,
  api,
  v,
  x,
  y,
  w = 440,
  color = api.C.blue,
  h = 100,
) {
  const size = 28,
    lines = [];
  ctx.save();
  ctx.font = lessonFont(size);
  for (const paragraph of String(v).split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? line + ' ' + word : word;
      if (line && ctx.measureText(candidate).width > w - 32) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    lines.push(line);
  }
  ctx.restore();
  return api.components.panel(
    {
      x,
      y,
      width: w,
      height: h,
      padding: 10,
      fill: api.C.panel,
      stroke: color,
    },
    () => {
      const first = y + h / 2 - (lines.length - 1) * size * 0.65 + size * 0.34;
      lines.forEach((line, i) =>
        drawGovernanceConstructionText(
          ctx,
          api,
          line,
          x + w / 2,
          first + i * size * 1.3,
          size,
          color,
          'center',
        ),
      );
    },
  );
}
export function drawGovernanceConstructionRows(
  ctx,
  api,
  values,
  x,
  y,
  color = api.C.ink,
  gap = 65,
  size = 29,
) {
  return values.forEach((v, i) =>
    drawGovernanceConstructionText(ctx, api, v, x, y + gap * i, size, color),
  );
}
export function drawGovernanceConstructionFooter(ctx, api, v) {
  return drawGovernanceConstructionText(ctx, api, v, 960, 1020, 26, api.C.muted, 'center');
}
export function drawGovernanceConstructionFlight(ctx, api, from, to, progress, color = api.C.cyan) {
  api.arrow(ctx, ...from, ...to, color, 3);
  if (progress > 0 && progress < 1)
    api.circle(
      ctx,
      api.lerp(from[0], to[0], progress),
      api.lerp(from[1], to[1], progress),
      11,
      color,
    );
}
export function drawGovernanceConstructionBadge(ctx, api, label, value, x, y, w = 650) {
  return drawGovernanceConstructionBox(
    ctx,
    api,
    `${label}: ${value === null ? 'establish facts' : value ? 'yes' : 'no'}`,
    x,
    y,
    w,
    value === null ? api.C.muted : value ? api.C.cyan : api.C.pink,
    90,
  );
}
export function drawGovernanceExpansionText(
  ctx,
  api,
  v,
  x,
  y,
  size = 31,
  color = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, formatGovernanceLabel(ctx, api, v), x, y, size, color, align);
}
export function drawGovernanceExpansionLines(
  ctx,
  api,
  values,
  x,
  y,
  size = 30,
  color = api.C.ink,
  gap = 48,
) {
  return values.forEach((v, i) =>
    drawGovernanceExpansionText(ctx, api, v, x, y + i * gap, size, color),
  );
}
export function drawGovernanceExpansionFooter(ctx, api, v) {
  return drawGovernanceExpansionText(ctx, api, v, 960, 1015, 27, api.C.muted, 'center');
}
export function drawGovernanceExpansionBox(
  ctx,
  api,
  label,
  x,
  y,
  w = 400,
  h = 86,
  color = api.C.blue,
) {
  return api.components.card({
    label: formatGovernanceLabel(ctx, api, label),
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    padding: 12,
    textColor: color,
    stroke: color,
    fill: api.C.panel,
  });
}
export function drawGovernanceExpansionLink(ctx, api, a, z, color = api.C.cyan) {
  return api.connect(ctx, a, z, {
    color,
    width: 3,
    gap: 14,
  });
}
export function drawGovernanceExpansionMark(ctx, api, x, y, ok, label) {
  api.circle(ctx, x, y, 27, api.C.bg, ok ? api.C.green : api.C.pink, 3);
  drawGovernanceExpansionText(
    ctx,
    api,
    ok ? '✓' : '×',
    x,
    y + 10,
    29,
    ok ? api.C.green : api.C.pink,
    'center',
  );
  drawGovernanceExpansionText(ctx, api, label, x + 48, y + 11, 29, ok ? api.C.green : api.C.pink);
}
export function drawGovernanceExpansionDocument(ctx, api, x, y, w, h, label, color = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 2, 12);
  drawGovernanceExpansionText(ctx, api, label, x + 25, y + 45, 31, color);
  api.line(ctx, x + 25, y + 65, x + w - 25, y + 65, color, 2);
}
export function formatGovernanceLabel(ctx, api, v) {
  return String(v)
    .replace(
      /\b(Target|target|original|larger|effects:|reviewed|Reviewed|assessed|apply|fixture|Article|Articles|point)(?=\d)/g,
      '$1 ',
    )
    .replace(/\bAnnex(?=[IVX])/g, 'Annex ')
    .replace(/\bSection(?=[AB])/g, 'Section ')
    .replace(/\s*\+\s*/g, ' + ');
}
