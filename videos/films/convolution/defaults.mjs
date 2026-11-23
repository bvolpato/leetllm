import { KERNEL } from './fixtures.mjs';
import { MAP } from './model.mjs';
export const formatValue = (v) =>
  typeof v === 'string'
    ? v
    : Math.abs(v - 2 / 3) < 1e-10
      ? '⅔'
      : Number.isInteger(v)
        ? String(v)
        : v.toFixed(1);
export const formatChapterValue = (v, d = 3) =>
  typeof v === 'string'
    ? v
    : Math.abs(v) < 1e-12
      ? '0'
      : Number.isInteger(v)
        ? String(v)
        : Number(v.toFixed(d)).toString();
export function cueProgress(ctx, api, id, fallback = 0) {
  return api.focus.progress(id, fallback);
}
export function text(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(s), x, y, size, color, align);
}
export function equation(ctx, api, s, x, y, size = 44, color = api.C.ink, align = 'center') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function imageGrid(
  ctx,
  api,
  values,
  x,
  y,
  size = 90,
  {
    selected,
    kind = 'image',
    visible = Infinity,
    active,
    reveal = 1,
    borderReveal = 1,
    padded = false,
    opacity = 1,
  } = {},
) {
  const cols = values[0].length;
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: size,
    gap: 7,
    format: formatValue,
    style: {
      fill: api.C.panel,
      stroke: api.C.muted,
      textColor: api.C.ink,
      fontSize: size < 75 ? 27 : 34,
      padding: 8,
      radius: 5,
    },
    cellStyle: (v, r, col) => {
      const hit =
        selected &&
        r >= selected[0] &&
        r < selected[0] + 3 &&
        col >= selected[1] &&
        col < selected[1] + 3;
      const shade = Math.round(24 + Math.max(0, Math.min(1, typeof v === 'number' ? v : 0)) * 185);
      const fill =
        kind === 'image'
          ? 'rgb(' + shade + ',' + shade + ',' + shade + ')'
          : kind === 'feature' && typeof v === 'number'
            ? 'rgba(' +
              (v < 0 ? '240,150,185,' : '90,210,175,') +
              (0.05 + Math.min(1, Math.abs(v) / 3) * 0.22) +
              ')'
            : api.C.panel;
      const accent =
        kind === 'kernel'
          ? v < 0
            ? api.C.pink
            : v > 0
              ? api.C.cyan
              : api.C.muted
          : kind === 'feature'
            ? api.C.green
            : api.C.muted;
      const border =
        padded && (r === 0 || col === 0 || r === values.length - 1 || col === cols - 1);
      return {
        fill: border ? 'rgba(94,214,233,.12)' : fill,
        stroke: hit || active === r * cols + col ? api.C.yellow : border ? api.C.cyan : accent,
        lineWidth: hit ? 4 : 2,
        textColor:
          kind === 'image' ? (typeof v === 'number' && v > 0.5 ? api.C.bg : api.C.ink) : accent,
        opacity:
          opacity *
          api.clamp(reveal * values.length * cols - r * cols - col) *
          (border ? borderReveal : 1),
        labelOpacity: r * cols + col < visible ? 1 : 0,
      };
    },
  });
}
export function featureGrid(ctx, api, values, x, y, size = 105, options = {}) {
  return imageGrid(ctx, api, values, x, y, size, {
    kind: 'feature',
    ...options,
  });
}
export function kernelGrid(ctx, api, values, x, y, size = 85) {
  return imageGrid(ctx, api, values, x, y, size, {
    kind: 'kernel',
  });
}
export function unknownFeatureMap(ctx, api) {
  return MAP.map((row) => row.map(() => '?'));
}
export function box(ctx, api, x, y, w, h, color = api.C.yellow, line = 4) {
  api.line(ctx, x, y, x + w, y, color, line);
  api.line(ctx, x + w, y, x + w, y + h, color, line);
  api.line(ctx, x + w, y + h, x, y + h, color, line);
  api.line(ctx, x, y + h, x, y, color, line);
}
export function cellOutline(ctx, api, cell, color = api.C.yellow) {
  return box(ctx, api, cell.x - 4, cell.y - 4, cell.width + 8, cell.height + 8, color, 5);
}
export function sharedKernel(ctx, api) {
  text(ctx, api, 'SAME NINE WEIGHTS', 980, 310, 26, api.C.cyan, 'center');
  return kernelGrid(ctx, api, KERNEL, 850, 350, 70);
}
export function carry(ctx, api, source, target, progress, value, perpendicular = false) {
  const from = api.anchor(source, target, 13),
    to = api.anchor(target, source, 13);
  const tip = {
    x: api.lerp(from.x, to.x, progress),
    y: api.lerp(from.y, to.y, progress),
  };
  api.line(ctx, from.x, from.y, to.x, to.y, api.C.muted, 2);
  if (progress > 0) api.arrow(ctx, from.x, from.y, tip.x, tip.y, api.C.green, 4);
  if (progress > 0 && progress < 1) {
    const dx = to.x - from.x,
      dy = to.y - from.y,
      len = Math.hypot(dx, dy);
    text(
      ctx,
      api,
      formatValue(value),
      tip.x + (perpendicular ? (-dy / len) * 48 : 40),
      tip.y + (perpendicular ? (dx / len) * 48 : 12),
      32,
      api.C.green,
      'center',
    );
  }
}
export function chapterCueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function chapterFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function chapterText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function chapterEquation(ctx, api, v, x, y, size = 42, color = api.C.ink) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function withOpacity(ctx, api, v, fn) {
  ctx.save();
  ctx.globalAlpha *= v;
  fn();
  ctx.restore();
}
export function chapterOutline(ctx, api, x, y, w, h, color = api.C.yellow, line = 4) {
  api.line(ctx, x, y, x + w, y, color, line);
  api.line(ctx, x + w, y, x + w, y + h, color, line);
  api.line(ctx, x + w, y + h, x, y + h, color, line);
  api.line(ctx, x, y + h, x, y, color, line);
}
export function valueGrid(
  ctx,
  api,
  values,
  x,
  y,
  size = 90,
  {
    kind = 'values',
    active,
    selected,
    show = Infinity,
    opacity = 1,
    font = 29,
    precision = 3,
    formatter,
  } = {},
) {
  return api.components.matrix({
    values,
    x,
    y,
    cellSize: size,
    gap: 7,
    format: (v) => (formatter ? formatter(v) : formatChapterValue(v, precision)),
    style: {
      fill: api.C.panel,
      stroke: api.C.muted,
      textColor: api.C.ink,
      fontSize: font,
      padding: 8,
      radius: 5,
    },
    cellStyle: (v, r, col) => {
      const i = r * values[0].length + col,
        hit = i === active || selected?.some(([a, d]) => a === r && d === col);
      let fill = api.C.panel,
        ink = typeof v === 'number' && v < 0 ? api.C.pink : api.C.ink;
      if (kind === 'image' && typeof v === 'number') {
        const shade = Math.round(24 + Math.max(0, Math.min(1, v)) * 185);
        fill = `rgb(${shade},${shade},${shade})`;
        ink = v > 0.5 ? api.C.bg : api.C.ink;
      }
      if (kind === 'gradient' && v !== 0)
        fill = typeof v === 'number' && v < 0 ? 'rgba(255,143,192,.16)' : 'rgba(143,224,138,.14)';
      return {
        fill,
        stroke: hit ? api.C.yellow : kind === 'kernel' ? api.C.cyan : api.C.muted,
        lineWidth: hit ? 4 : 1.5,
        textColor: ink,
        opacity,
        labelOpacity: i < show ? 1 : 0,
      };
    },
  });
}
export function zeros(ctx, api, r, c = r) {
  return Array.from(
    {
      length: r,
    },
    () => Array(c).fill(0),
  );
}
export function unknownValues(ctx, api, r, c = r) {
  return Array.from(
    {
      length: r,
    },
    () => Array(c).fill('?'),
  );
}
export function cellCenter(ctx, api, cell) {
  return {
    x: cell.x + cell.width / 2,
    y: cell.y + cell.height / 2,
  };
}
export function moveContribution(ctx, api, from, to, t, label, color = api.C.green) {
  const a = {
      x: from.x + from.width / 2,
      y: from.y + from.height + 2,
    },
    z = {
      x: to.x + to.width / 2,
      y: to.y + to.height + 2,
    },
    lane = from.x > to.x ? 1150 : 1190,
    sy = a.y + 1.5,
    ty = z.y + 1.5;
  const points = [
      a,
      {
        x: a.x,
        y: sy,
      },
      {
        x: lane,
        y: sy,
      },
      {
        x: lane,
        y: ty,
      },
      {
        x: z.x,
        y: ty,
      },
      z,
    ],
    lengths = points.slice(1).map((v, i) => Math.hypot(v.x - points[i].x, v.y - points[i].y)),
    total = lengths.reduce((a, b) => a + b, 0);
  let left = t * total,
    tip = a;
  for (let i = 0; i < lengths.length; i++) {
    const start = points[i],
      end = points[i + 1];
    api.line(ctx, start.x, start.y, end.x, end.y, api.C.muted, 1);
    if (left > 0) {
      const f = Math.min(1, left / (lengths[i] || 1));
      tip = {
        x: api.lerp(start.x, end.x, f),
        y: api.lerp(start.y, end.y, f),
      };
      api.line(ctx, start.x, start.y, tip.x, tip.y, color, 3);
      left -= lengths[i];
    }
  }
  if (t > 0 && t < 1) {
    api.circle(ctx, tip.x, tip.y, 3, color);
    if (Math.abs(tip.x - lane) < 1 && Math.abs(tip.y - sy) > 42 && Math.abs(tip.y - ty) > 42)
      chapterText(ctx, api, label, tip.x + 30, tip.y + 10, 28, color);
  }
}
export function chapterRule(ctx, api, v, x = 960, y = 980, size = 36) {
  return chapterEquation(ctx, api, v, x, y, size, api.C.cyan);
}
export function ownerColor(ctx, api, i) {
  return [api.C.blue, api.C.cyan, api.C.green, api.C.pink][i % 4];
}
export function constructionFocus(ctx, api, sceneId, fn) {
  return chapterFocus(ctx, api, sceneId + '-construction', fn);
}
