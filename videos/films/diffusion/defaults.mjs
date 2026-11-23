import { forwardValue, mixture, unit } from './arithmetic.mjs';
import { MAX_ADDED_VARIANCE, TOP_PIXEL } from './fixtures.mjs';
import { densityContours, image, imageNoise, trajectories, trajectoryPoint } from './model.mjs';
export function valueColor(value) {
  const p = unit((value + 1.8) / 3.6);
  const a = p < 0.5 ? [13, 25, 43] : [66, 103, 114];
  const b = p < 0.5 ? [66, 103, 114] : [255, 225, 166];
  const f = p < 0.5 ? p * 2 : (p - 0.5) * 2;
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',')})`;
}
export function drawOriginalText(ctx, api, s, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawOriginalMath(
  ctx,
  api,
  s,
  x,
  y,
  size = 45,
  color = api.C.ink,
  align = 'center',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawOriginalRect(ctx, api, x, y, w, h, fill = api.C.panel, stroke, r = 16) {
  return api.rect(ctx, x, y, w, h, fill, stroke, r);
}
export function drawOriginalLine(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawOriginalArrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan, width = 4) {
  return api.arrow(ctx, x1, y1, x2, y2, color, width);
}
export function drawOriginalCircle(ctx, api, x, y, r, color = api.C.cyan, stroke, width = 3) {
  return api.circle(ctx, x, y, r, color, stroke, width);
}
export function drawOriginalTarget(ctx, api, id, painter) {
  return api.focus.target(id, painter);
}
export function drawOriginalSpoken(ctx, api, id, fallback) {
  return api.focus.progress(id, fallback);
}
export function drawOriginalPanel(
  ctx,
  api,
  x,
  y,
  w,
  h,
  painter,
  color = api.C.muted,
  id = 'panel',
) {
  return api.components.panel(
    {
      x,
      y,
      width: w,
      height: h,
      fill: api.C.panel,
      stroke: color,
      radius: 20,
      id,
      padding: 20,
    },
    painter,
  );
}
export function drawOriginalTile(ctx, api, x, y, size, alphaBar, mode = 'mix', padding = 5) {
  const pixels = mode === 'noise' ? imageNoise : mode === 'clean' ? image
    : image.map((clean, i) => forwardValue(clean, imageNoise[i], alphaBar));
  return drawPixelTile(ctx, api, x, y, size, pixels, TOP_PIXEL, padding);
}
export function drawPixelTile(ctx, api, x, y, size, pixels, selected, padding = 5) {
  const box = drawOriginalRect(ctx, api, x, y, size, size, api.C.bg, api.C.muted, 5);
  api.container(
    ctx,
    box,
    () => {
      const side = Math.sqrt(pixels.length);
      const pitch = (size - 2 * padding) / side;
      for (let i = 0; i < pixels.length; i++) {
        drawOriginalRect(
          ctx,
          api,
          x + padding + (i % side) * pitch,
          y + padding + Math.floor(i / side) * pitch,
          pitch + 0.05,
          pitch + 0.05,
          valueColor(pixels[i]),
          undefined,
          0,
        );
      }
      if (selected != null) {
        const left = x + padding + (selected % side) * pitch;
        const top = y + padding + Math.floor(selected / side) * pitch;
        drawOriginalRect(ctx, api, left, top, pitch, pitch, 'transparent', api.C.bg, 0);
        const inset = Math.min(2, pitch / 6);
        drawOriginalRect(ctx, api, left + inset, top + inset, pitch - 2 * inset, pitch - 2 * inset, 'transparent', api.C.yellow, 0);
        if (pitch >= 14) {
          const middle = top + pitch / 2;
          for (const [a, b] of [[left - pitch * 0.6, left - 2], [left + pitch + 2, left + 1.6 * pitch]]) {
            api.line(ctx, a, middle, b, middle, api.C.bg, 6);
            api.line(ctx, a, middle, b, middle, api.C.yellow, 3);
          }
        }
      }
    },
    {
      padding: padding - 1,
      id: `tile-${x}-${y}`,
    },
  );
  return box;
}
export function drawOriginalField(
  ctx,
  api,
  x,
  y,
  w,
  progress,
  { arrows = true, particles = true, trails = false, selected = false, probe } = {},
  resolveSelectedProbe,
) {
  const h = (w * 5.5) / 8.8,
    scale = w / 8.8;
  const bounds = drawOriginalRect(ctx, api, x, y, w, h, api.C.panel, '#566984', 16);
  const inside = (q) => Math.abs(q[0]) < 4.4 - 23 / scale && Math.abs(q[1]) < 2.75 - 23 / scale;
  const screen = (q) => ({
    x: x + w / 2 + q[0] * scale,
    y: y + h / 2 - q[1] * scale,
  });
  const variance = MAX_ADDED_VARIANCE * (1 - progress);
  api.container(
    ctx,
    bounds,
    () => {
      for (const contour of densityContours(variance)) {
        const alpha = Math.min(0.62, 0.2 + contour.level);
        api.path(ctx, contour.points.map(screen), {
          color: `rgba(99,222,236,${alpha})`,
          width: 2,
          clip: {
            x: x + 22,
            y: y + 22,
            width: w - 44,
            height: h - 44,
          },
        });
      }
      if (arrows)
        for (let row = 0; row < 5; row++)
          for (let col = 0; col < 9; col++) {
            const q = [-3.55 + col * 0.89, -1.95 + row * 0.97],
              s = mixture(q, variance).score;
            const norm = Math.hypot(...s),
              length = Math.min(27, norm * 18),
              start = screen(q);
            drawOriginalArrow(
              ctx,
              api,
              start.x,
              start.y,
              start.x + (s[0] / norm) * length,
              start.y - (s[1] / norm) * length,
              '#8d9cb977',
              2,
            );
          }
      if (trails && progress > 0)
        trajectories.forEach((path, index) => {
          if (index % 3 !== 0) return;
          const last = Math.floor(progress * 720);
          const points = [];
          for (let i = Math.max(0, last - 180); i <= last; i += 9) points.push(screen(path[i]));
          api.path(ctx, points, {
            color: index === 0 ? '#ffffffbb' : '#f4d47766',
            width: index === 0 ? 4 : 2,
            clip: {
              x: x + 22,
              y: y + 22,
              width: w - 44,
              height: h - 44,
            },
          });
        });
      if (particles)
        trajectories.forEach((_, index) => {
          const q = trajectoryPoint(index, progress);
          if (inside(q)) {
            const a = screen(q);
            drawOriginalCircle(
              ctx,
              api,
              a.x,
              a.y,
              4.7,
              index % 3 === 0 ? api.C.yellow : api.C.cyan,
            );
            if (
              index === 0 &&
              trails &&
              a.x > x + 29 &&
              a.x < x + w - 29 &&
              a.y > y + 29 &&
              a.y < y + h - 29
            ) {
              const v = mixture(q, variance).score,
                n = Math.hypot(...v);
              drawOriginalArrow(
                ctx,
                api,
                a.x,
                a.y,
                Math.max(x + 30, Math.min(x + w - 30, a.x + (v[0] / n) * 20)),
                Math.max(y + 30, Math.min(y + h - 30, a.y - (v[1] / n) * 20)),
                api.C.ink,
                3,
              );
              drawOriginalCircle(ctx, api, a.x, a.y, 9, 'rgba(0,0,0,0)', api.C.ink, 3);
            }
          }
        });
      if (selected) {
        const q = probe ?? resolveSelectedProbe(),
          s = mixture(q, variance).score,
          a = screen(q);
        const n = Math.hypot(...s),
          length = Math.min(100, n * 240);
        drawOriginalArrow(
          ctx,
          api,
          a.x,
          a.y,
          a.x + (s[0] / n) * length,
          a.y - (s[1] / n) * length,
          api.C.yellow,
          6,
        );
        drawOriginalCircle(ctx, api, a.x, a.y, 10, api.C.yellow, api.C.bg, 3);
      }
    },
    {
      padding: 17,
      id: 'mixture-field',
    },
  );
  return bounds;
}
export function drawConstructionText(
  ctx,
  api,
  v,
  x,
  y,
  size = 30,
  col = api.C.ink,
  align = 'left',
) {
  return api.text(ctx, String(v), x, y, size, col, align);
}
export function drawConstructionEquation(ctx, api, v, x, y, size = 42, col = api.C.yellow) {
  return api.math(ctx, v, x, y, size, col, 'center');
}
export function drawConstructionFocus(ctx, api, name, fn) {
  return api.focus.target(name, fn);
}
export function drawConstructionBox(
  ctx,
  api,
  v,
  x,
  y,
  w = 600,
  col = api.C.blue,
  h = 100,
  size = 28,
) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: size,
    textColor: col,
    fill: api.C.panel,
    stroke: col,
    padding: 12,
  });
}
export function drawConstructionGrid(ctx, api, v, x, y, w, h, col = api.C.blue, size = 28) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: h,
    rows: v.length,
    columns: v[0].length,
    labels: v,
    fontSize: size,
    fill: api.C.panel,
    stroke: col,
    textColor: api.C.ink,
  });
}
export function drawConstructionTitle(ctx, api, v) {
  return drawConstructionText(ctx, api, v, 960, 285, 35, api.C.yellow, 'center');
}
export function drawConstructionFooter(ctx, api, v) {
  return drawConstructionText(ctx, api, v, 960, 1035, 25, api.C.muted, 'center');
}
export function drawConstructionArrow(ctx, api, x, y, z, w, col = api.C.cyan, width = 4) {
  return api.arrow(ctx, x, y, z, w, col, width);
}
export function drawConstructionRows(ctx, api, v, y = 385, dy = 175) {
  return v.forEach(([k, val, col = api.C.cyan], i) => {
    drawConstructionBox(ctx, api, k, 170, y + i * dy, 520, api.C.blue, 100, 27);
    drawConstructionText(ctx, api, val, 770, y + 63 + i * dy, 29, col);
  });
}
export function drawConstructionRoute(ctx, api, points, q, col = api.C.yellow) {
  api.path(ctx, points, {
    color: col,
    width: 3,
  });
  api.components.particle({
    points,
    progress: unit(q),
    fill: col,
    radius: 6,
  });
}
