import { clamp } from './arithmetic.mjs';
export function chapterText(ctx, api, v, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    /[_{}<>"=]/u.test(String(v)) ? 'mono' : 'sans',
  );
}
export function chapterBox(ctx, api, v, x, y, w = 400, h = 85, color = api.C.blue, size = 28) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 3);
  String(v)
    .split('\n')
    .forEach((line, i, rows) =>
      chapterText(
        ctx,
        api,
        line,
        x + w / 2,
        y + h / 2 + (i - (rows.length - 1) / 2) * size * 1.3 + size * 0.3,
        size,
        color,
        'center',
      ),
    );
}
export function subtitle(ctx, api, v) {
  return chapterText(ctx, api, v, 960, 270, 27, api.C.muted, 'center');
}
export function footer(ctx, api, v, color = api.C.muted) {
  return chapterText(ctx, api, v, 960, 1015, 28, color, 'center');
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 3) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function path(ctx, api, points, color = api.C.cyan) {
  return api.path(ctx, points, {
    color,
    width: 3,
  });
}
export function text(ctx, api, v, x, y, size = 26, color = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    String(v).includes('_') || String(v).includes('"') ? 'mono' : 'sans',
  );
}
export function card(ctx, api, label, x, y, width, height = 80, color = api.C.cyan, fontSize = 25) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fill: api.C.panel,
    stroke: color,
    textColor: api.C.ink,
    font: String(label).includes('_') ? 'mono' : 'sans',
    fontSize,
    baselineOffset: fontSize * 0.34 - (String(label).split('\n').length - 1) * fontSize * 0.7,
    padding: 12,
  });
}
export function promptEditor(ctx, api, sections, count = 4, highlight = false, targets = {}) {
  const ys = [345, 485, 635, 785],
    heights = [120, 130, 130, 205];
  for (let i = 0; i < count; i++) {
    const block = sections[i],
      x = 170,
      y = ys[i],
      active = i === targets.activeIndex;
    const drawSection = () => {
      api.components.panel({
        x,
        y,
        width: 1240,
        height: heights[i],
        fill: api.C.panel,
        stroke: highlight && i === 3 ? api.C.yellow : active ? api.C.cyan : api.C.blue,
        radius: 14,
      });
      text(ctx, api, block.label, x + 24, y + 30, 21, api.C.cyan);
      block.lines.forEach((line, j) => {
        const drawLine = () =>
          text(
            ctx,
            api,
            line,
            x + 24,
            y + 65 + j * 34,
            active ? 26 : 23,
            highlight && i === 3 && j === 1 ? api.C.yellow : active ? api.C.ink : api.C.muted,
          );
        const lineTarget = targets.lineTargets?.[`${i}:${j}`];
        if (lineTarget) api.focus.target(lineTarget, drawLine);
        else drawLine();
      });
    };
    const sectionTarget = targets.sectionTargets?.[i];
    if (sectionTarget) api.focus.target(sectionTarget, drawSection);
    else drawSection();
  }
}

export const pointOnPath = (points, p) => {
  const lengths = points.slice(1).map((q, i) => Math.hypot(q.x - points[i].x, q.y - points[i].y)),
    length = lengths.reduce((a, v) => a + v, 0);
  let d = clamp(p) * length;
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? d / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
    d -= lengths[i];
  }
  return points.at(-1);
};
