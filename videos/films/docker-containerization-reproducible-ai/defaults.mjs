import { normalized } from './arithmetic.mjs';
import { FIXTURE, OBSERVED_IMAGE_ID } from './fixtures.mjs';
import { drawConcept } from '../../lib/concepts.mjs';
export function codeText(
  ctx,
  api,
  value,
  x,
  y,
  size = 32,
  color = api.C.ink,
  align = 'left',
  font = 'sans',
) {
  return api.text(ctx, value, x, y, size, color, align, font);
}
export function equation(ctx, api, value, x, y, size = 44, color = api.C.ink, align = 'left') {
  return api.math(ctx, value, x, y, size, color, align);
}
export function panel(ctx, api, x, y, width, height, color = api.C.muted, draw) {
  return api.components.panel(
    {
      x,
      y,
      width,
      height,
      fill: api.C.panel,
      stroke: color,
      radius: 14,
      padding: 22,
    },
    draw,
  );
}
export function codeCard(ctx, api, label, x, y, width, color = api.C.blue, height = 64) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    fontSize: 30,
    padding: 12,
  });
}
export function codeBlock(
  ctx,
  api,
  title,
  lines,
  x,
  y,
  width,
  height,
  { color = api.C.blue, active = -1, ids = [] } = {},
) {
  return panel(ctx, api, x, y, width, height, color, () => {
    codeText(
      ctx,
      api,
      title,
      x + 26,
      y + 47,
      30,
      color,
      'left',
      title.includes('_') ? 'mono' : 'sans',
    );
    lines.forEach((line, i) => {
      const paint = () => {
        if (i === active)
          api.rect(ctx, x + 24, y + 67 + i * 43, width - 48, 40, '#20334a', null, 0, 5);
        codeText(
          ctx,
          api,
          line,
          x + 30,
          y + 96 + i * 43,
          28,
          i === active ? api.C.yellow : api.C.ink,
          'left',
          'mono',
        );
      };
      if (ids[i]) focusTarget(ctx, api, ids[i], paint);
      else paint();
    });
  });
}
export function fixtureRows(
  ctx,
  api,
  x,
  y,
  width,
  read = 3,
  { predictions = true, idPrefix = '' } = {},
) {
  const columns = [0, 0.16, 0.54, 0.9];
  codeText(ctx, api, 'Row', x + 20, y, 29, api.C.muted);
  codeText(ctx, api, 'Expected', x + width * columns[1], y, 29, api.C.muted);
  codeText(ctx, api, 'Prediction', x + width * columns[2], y, 29, api.C.muted);
  FIXTURE.forEach((row, i) => {
    const shown = i < read,
      match = normalized(row.expected) === normalized(row.prediction);
    const paint = () => {
      api.rect(
        ctx,
        x,
        y + 20 + i * 83,
        width,
        68,
        api.C.panel,
        shown ? (match ? api.C.green : api.C.pink) : api.C.muted,
        2,
        8,
      );
      codeText(ctx, api, String(row.id), x + 20, y + 64 + i * 83, 31, api.C.blue, 'left', 'mono');
      codeText(ctx, api, row.expected, x + width * columns[1], y + 64 + i * 83, 31);
      codeText(
        ctx,
        api,
        predictions ? row.prediction : '?',
        x + width * columns[2],
        y + 64 + i * 83,
        31,
        shown ? (match ? api.C.green : api.C.pink) : api.C.ink,
      );
      if (shown && predictions)
        codeText(
          ctx,
          api,
          match ? '=' : '≠',
          x + width * columns[3],
          y + 64 + i * 83,
          34,
          match ? api.C.green : api.C.pink,
        );
    };
    if (idPrefix) focusTarget(ctx, api, idPrefix + row.id, paint);
    else paint();
  });
}
export function imageFiles(ctx, api, x, y, width = 700, height = 390) {
  return panel(ctx, api, x, y, width, height, api.C.blue, () => {
    drawConcept(ctx, api, 'docker-image-layers', x + 28, y + 85, 145, {
      label: 'Image I1',
      labelSize: 28,
    });
    codeText(ctx, api, 'Stored user-space files', x + 210, y + 55, 30, api.C.blue);
    ['Python 3.12', '/opt/venv', 'scorer + 3 eval rows'].forEach((value, i) =>
      codeText(ctx, api, value, x + 210, y + 130 + i * 73, 29, i === 2 ? api.C.green : api.C.ink),
    );
    codeText(
      ctx,
      api,
      'ID prefix: ' + OBSERVED_IMAGE_ID.slice(7, 19),
      x + 28,
      y + height - 35,
      27,
      api.C.muted,
      'left',
      'mono',
    );
  });
}
export function text(ctx, api, v, x, y, z = 31, col = api.C.ink, a = 'center', font) {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    z,
    col,
    a,
    font ?? (String(v).includes('_') ? 'mono' : 'sans'),
  );
}
export function rectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.border) {
  return api.rect(ctx, x, y, w, h, fill, stroke, 2, 9);
}
export function line(ctx, api, x, y, u, v, col = api.C.border, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function pill(ctx, api, v, x, y, w = 650, col = api.C.blue, h = 80, z = 29) {
  rectangle(ctx, api, x - w / 2, y - h / 2, w, h, api.C.panel, col);
  text(ctx, api, v, x, y + z * 0.34, z, col);
}
export function note(ctx, api, v, col = api.C.muted) {
  return text(ctx, api, v, 960, 1015, 26, col);
}
export function arrow(ctx, api, x, y, u, v, col = api.C.blue) {
  return api.arrow(ctx, x, y, u, v, col, 4);
}
export function focusTarget(ctx, api, id, paint) {
  return api.focus.target(id, paint);
}
export function comparisonPair(ctx, api, left, right, y = 520) {
  pill(ctx, api, left, 500, y, 710, api.C.blue);
  pill(ctx, api, right, 1420, y, 710, api.C.cyan);
}
export function imageLayer(ctx, api, x, y, w, label, col = api.C.blue) {
  api.path(
    ctx,
    [
      {
        x,
        y,
      },
      {
        x: x + w - 35,
        y,
      },
      {
        x: x + w,
        y: y + 18,
      },
      {
        x: x + 35,
        y: y + 18,
      },
      {
        x,
        y,
      },
    ],
    {
      color: col,
      width: 2,
    },
  );
  rectangle(ctx, api, x + 35, y + 18, w - 35, 75, api.C.panel, col);
  text(ctx, api, label, x + w / 2 + 16, y + 66, 29, col);
}
