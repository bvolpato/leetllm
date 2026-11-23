import { VOCAB } from './fixtures.mjs';
import { clamp } from './arithmetic.mjs';
import { extendedFrame } from './model.mjs';
export function text(ctx, api, C, s, x, y, size = 32, color = C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, C, s, x, y, size = 42, color = C.ink, align = 'center') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function target(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function caption(ctx, api, C, s) {
  return text(ctx, api, C, s, 960, 994, 26, C.muted, 'center');
}
export function row(
  ctx,
  api,
  C,
  f,
  values,
  x,
  y,
  width = 1000,
  color = C.cyan,
  height = 88,
  digits = 2,
) {
  const step = width / values.length;
  values.forEach((v, i) => {
    api.rect(ctx, x + i * step, y, step - 8, height, C.panel, color, 2, 8);
    text(
      ctx,
      api,
      C,
      v === null ? '?' : f(v, digits),
      x + i * step + (step - 8) / 2,
      y + height / 2 + 11,
      values.length > 4 ? 28 : 33,
      color,
      'center',
    );
  });
}
export function tokenCards(ctx, api, C, ids, y, choice = null, selected = 2) {
  const list =
    choice === null
      ? [...ids.map((id) => VOCAB[id]), '?']
      : [...ids.map((id) => VOCAB[id]), VOCAB[choice]];
  const width = 270,
    gap = 22,
    start = 960 - (list.length * (width + gap) - gap) / 2;
  list.forEach((s, i) => {
    const color =
      i === selected
        ? C.yellow
        : i === list.length - 1
          ? choice === null
            ? C.muted
            : C.green
          : C.blue;
    target(
      ctx,
      api,
      i === selected ? 'selected-token' : i === list.length - 1 ? 'chosen-token' : 'prefix-' + i,
      () => {
        api.rect(ctx, start + i * (width + gap), y, width, 88, C.panel, color, 2, 10);
        text(ctx, api, C, s, start + i * (width + gap) + width / 2, y + 57, 34, color, 'center');
      },
    );
  });
}
export function weights(
  ctx,
  api,
  C,
  values,
  labels,
  y,
  id,
  colors = [C.blue, C.pink, C.green, C.muted],
  count = values.length,
) {
  return target(ctx, api, id, () => {
    let left = 240;
    api.rect(ctx, 240, y, 1440, 52, C.panel);
    values.forEach((v, i) => {
      if (i < count && v > 0) api.rect(ctx, left, y, 1440 * v, 52, colors[i % colors.length]);
      text(
        ctx,
        api,
        C,
        labels[i] + (i < count ? ' ' + Math.round(100 * v) + '%' : ' ?'),
        330 + i * (1260 / Math.max(1, labels.length - 1)),
        y + 108,
        26,
        colors[i % colors.length],
        'center',
      );
      left += 1440 * v;
    });
  });
}
export function plane(
  ctx,
  api,
  xDomain,
  yDomain,
  ticks,
  labelX = 'coordinate 1',
  labelY = 'coordinate 4',
) {
  return api.teaching.axes({
    x: 210,
    y: 320,
    width: 720,
    height: 560,
    xDomain,
    yDomain,
    xTicks: ticks[0],
    yTicks: ticks[1],
    xLabel: labelX,
    yLabel: labelY,
    equalUnits: true,
    fontSize: 26,
  });
}
export function vectorArrow(ctx, api, plot, a, z, color, width = 6) {
  const from = plotPoint(ctx, api, plot, a),
    to = plotPoint(ctx, api, plot, z);
  api.arrow(ctx, from.x, from.y, to.x, to.y, color, width);
}
export function pointReference(ctx, api, C, plot, value, from, label, color, id) {
  const p = plotPoint(ctx, api, plot, value),
    a = plotPoint(ctx, api, plot, from),
    length = Math.hypot(p.x - a.x, p.y - a.y);
  const ux = length ? (p.x - a.x) / length : 0,
    uy = length ? (p.y - a.y) / length : -1;
  api.path(
    ctx,
    [
      {
        x: p.x + 10 * ux,
        y: p.y + 10 * uy,
      },
      {
        x: p.x + 25 * ux,
        y: p.y + 25 * uy,
      },
    ],
    {
      id,
      color,
      width: 2,
    },
  );
  text(
    ctx,
    api,
    C,
    label,
    p.x + 39 * ux,
    p.y + 39 * uy + 9,
    26,
    color,
    ux > 0.4 ? 'left' : ux < -0.4 ? 'right' : 'center',
  );
}
export function stateStrip(ctx, api, C, f, from, to, p, y = 735, color = C.green) {
  for (let j = 0; j < 4; j++) {
    const x = 1080 + j * 175,
      changed = from[j] !== to[j];
    api.rect(ctx, x, y, 165, 78, C.panel, changed ? color : C.muted, 7);
    api.teaching.changeCue(
      {
        x,
        y,
        width: 165,
        height: 78,
        from: from[j],
        to: to[j],
        progress: p,
        emphasis: p > 0 && p < 1 ? 1 : 0,
        color,
        restColor: changed ? C.ink : C.muted,
      },
      (v) => text(ctx, api, C, f(v.value, 3), x + 82, y + 51, 29, v.color, 'center'),
    );
    text(
      ctx,
      api,
      C,
      String(j + 1),
      x + 82,
      y + 116,
      25,
      j === 0 || j === 3 ? C.yellow : C.muted,
      'center',
    );
  }
}
export function plotPoint(ctx, api, plot, v) {
  return plot.point(v[0], v[1]);
}
export function stateVector(ctx, api, C, f, values, y, color, id) {
  return target(ctx, api, id, () => row(ctx, api, C, f, values, 420, y, 1100, color));
}
export function drawExtendedText(ctx, api, C, v, x, y, size = 29, color = C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function drawExtendedRow(ctx, api, C, f, values, x, y, w = 1000, color = C.cyan, h = 66) {
  const dx = w / values.length;
  values.forEach((v, i) => {
    api.rect(ctx, x + i * dx, y, dx - 8, h, C.panel, color, 2, 7);
    drawExtendedText(
      ctx,
      api,
      C,
      typeof v === 'number' ? f(v) : v,
      x + i * dx + (dx - 8) / 2,
      y + h / 2 + 10,
      values.length > 5 ? 25 : 29,
      color,
      'center',
    );
  });
}
export function drawExtendedMatrix(
  ctx,
  api,
  C,
  f,
  values,
  x,
  y,
  w,
  h,
  color = C.cyan,
  active = Infinity,
) {
  let n = 0;
  const dy = h / values.length,
    dx = w / values[0].length;
  values.forEach((r, i) =>
    r.forEach((v, j) => {
      const k = n++,
        c = Array.isArray(color) ? color[j % color.length] : color;
      api.rect(
        ctx,
        x + j * dx,
        y + i * dy,
        dx - 7,
        dy - 7,
        C.panel,
        k < active ? c : C.muted,
        1.6,
        5,
      );
      if (k < active)
        drawExtendedText(
          ctx,
          api,
          C,
          typeof v === 'number' ? f(v, v % 1 ? 3 : 0) : v,
          x + j * dx + (dx - 7) / 2,
          y + i * dy + (dy - 7) / 2 + 9,
          25,
          c,
          'center',
        );
    }),
  );
}
export function drawExtendedTitle(ctx, api, C, a, z) {
  drawExtendedText(ctx, api, C, a, 960, 270, 34, C.yellow, 'center');
  if (z) drawExtendedText(ctx, api, C, z, 960, 320, 27, C.muted, 'center');
}
export function drawExtendedNote(ctx, api, C, v) {
  return drawExtendedText(ctx, api, C, v, 960, 948, 27, C.muted, 'center');
}
export function drawExtendedArrow(ctx, api, C, x, y, xx, yy, color = C.cyan) {
  return api.arrow(ctx, x, y, xx, yy, color, 4);
}
export function drawExtendedBars(
  ctx,
  api,
  C,
  f,
  values,
  labels,
  x,
  y,
  w = 650,
  h = 290,
  color = C.cyan,
) {
  const dx = w / values.length,
    max = Math.max(1, ...values.map(Math.abs));
  api.line(ctx, x, y + h, x + w, y + h, C.muted, 1);
  values.forEach((v, i) => {
    const hh = (h * Math.abs(v)) / max;
    if (hh > 0.1) api.rect(ctx, x + i * dx + dx * 0.22, y + h - hh, dx * 0.56, hh, color);
    drawExtendedText(ctx, api, C, labels[i], x + (i + 0.5) * dx, y + h + 42, 25, C.muted, 'center');
    drawExtendedText(ctx, api, C, f(v), x + (i + 0.5) * dx, y + h - hh - 15, 26, color, 'center');
  });
}
export function drawExtendedMaskGrid(ctx, api, C, n, x, y, w, mode, progress = 1) {
  const d = w / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const legal = mode === 'full' || j <= i,
        lit = i * n + j < Math.ceil(n * n * progress);
      api.rect(
        ctx,
        x + j * d,
        y + i * d,
        d - 7,
        d - 7,
        legal && lit ? C.blue : C.panel,
        legal && lit ? C.cyan : C.muted,
        1.5,
        4,
      );
      if (n <= 4)
        drawExtendedText(
          ctx,
          api,
          C,
          legal && lit ? '1' : '0',
          x + (j + 0.5) * d - 3,
          y + (i + 0.5) * d + 8,
          25,
          legal && lit ? C.ink : C.muted,
          'center',
        );
    }
}
export function withTransformerLegacyFrame(ctx, scene, state, api, paint) {
  const { C } = api,
    b = state.beat ?? 0,
    P = state.beatP ?? 0;
  const f = (v, d = 2) =>
    typeof v === 'number' ? (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d) : v;
  paint(ctx, scene, state, api, C, b, P, f);
}
export function withTransformerExtendedFrame(ctx, scene, state, api, paint) {
  const { C } = api,
    id = scene.id,
    s = extendedFrame(id, state),
    b = s.beat,
    p = s.progress;
  const f = (v, d = 3) =>
    Number.isFinite(v) ? (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d) : String(v);
  const mix = (a, z, t) => a + (z - a) * clamp(t),
    known = (key, beat) => s.at(key, beat);
  const colors = [C.blue, C.pink, C.green, C.cyan, C.yellow, C.purple ?? C.blue];
  api.focus.target(`${id}-construction`, () => {
    paint(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  });
}
