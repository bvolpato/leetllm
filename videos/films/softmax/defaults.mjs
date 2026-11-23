import { WORDS } from './fixtures.mjs';
import { begun, bound, cue, phase } from './arithmetic.mjs';
import { completeFrame, completeModel } from './model.mjs';
export function drawText(ctx, api, C, s, x, y, size = 34, color = C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function equation(ctx, api, C, s, x, y, size = 42, color = C.ink, align = 'center') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function target(ctx, api, id, draw) {
  return api.focus.target(id, draw);
}
export function header(ctx, api, C, s) {
  return drawText(ctx, api, C, s, 960, 265, 37, C.ink, 'center');
}
export function card(
  ctx,
  api,
  C,
  s,
  x,
  y,
  color = C.cyan,
  width = 340,
  height = 100,
  fontSize = 40,
) {
  return api.components.card({
    label: s,
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
    fill: C.panel,
    stroke: color,
    textColor: color,
    fontSize,
    font: 'sans',
    padding: 14,
    radius: 14,
    baselineOffset: fontSize * 0.32,
  });
}
export function strip(ctx, api, C, colors, probabilities, y, assigned = 3, width = 1320) {
  api.rect(ctx, 300, y, width, 86, C.panel, C.muted, 2);
  let left = 300;
  probabilities.forEach((probability, i) => {
    if (i < assigned)
      target(ctx, api, 'probability-share-' + i, () =>
        api.rect(ctx, left, y, probability * width, 86, colors[i]),
      );
    left += probability * width;
  });
}
export function bars(ctx, api, colors, probabilities, y = 475) {
  return api.teaching.bars({
    values: probabilities,
    labels: WORDS,
    x: 420,
    y,
    width: 1080,
    height: 300,
    max: 1,
    colors,
    gap: 100,
    showValues: true,
    format: (n) => n.toFixed(3),
    fontSize: 33,
  });
}
export function drawCompleteText(ctx, api, C, s, x, y, size = 32, color = C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawCompleteEquation(ctx, api, C, s, x, y, size = 39, color = C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function drawCompleteArrow(ctx, api, C, x1, y1, x2, y2, c = C.muted, w = 3) {
  return api.arrow(ctx, x1, y1, x2, y2, c, w);
}
export function drawCompleteLine(ctx, api, C, x1, y1, x2, y2, c = C.muted, w = 2) {
  return api.line(ctx, x1, y1, x2, y2, c, w);
}
export function drawCompleteBox(ctx, api, C, s, x, y, w = 340, h = 80, color = C.cyan, size = 32) {
  api.rect(ctx, x - w / 2, y - h / 2, w, h, C.panel, color, 2);
  drawCompleteText(ctx, api, C, s, x, y + size * 0.34, size, color, 'center');
}
export function drawCompleteHead(ctx, api, C, s) {
  return drawCompleteText(ctx, api, C, s, 960, 265, 35, C.ink, 'center');
}
export function drawCompleteNote(ctx, api, C, s) {
  return drawCompleteText(ctx, api, C, s, 960, 1030, 27, C.muted, 'center');
}
export function drawCompleteRow(
  ctx,
  api,
  C,
  colors,
  xs,
  values,
  y,
  labels = WORDS,
  height = 150,
  maximum = 1,
) {
  values.forEach((value, i) => {
    const x = xs[i];
    drawCompleteText(ctx, api, C, labels[i], x, y - 25, 30, colors[i], 'center');
    drawCompleteLine(ctx, api, C, x - 150, y + height, x + 150, y + height);
    api.rect(
      ctx,
      x - 75,
      y + height - (height * value) / maximum,
      150,
      (height * value) / maximum,
      colors[i],
    );
    drawCompleteText(ctx, api, C, value.toFixed(4), x, y + height + 46, 30, colors[i], 'center');
  });
}
export function drawCompleteSigned(ctx, api, C, colors, xs, values, y, scale = 150) {
  return values.forEach((value, i) => {
    const x = xs[i];
    drawCompleteLine(ctx, api, C, x - 160, y, x + 160, y);
    api.rect(ctx, x - 35, Math.min(y, y - value * scale), 70, Math.abs(value * scale), colors[i]);
    drawCompleteText(
      ctx,
      api,
      C,
      (value >= 0 ? '+' : '') + value.toFixed(6),
      x,
      y + Math.max(40, -value * scale + 40),
      30,
      colors[i],
      'center',
    );
  });
}
export function withSoftmaxOriginalFrame(ctx, scene, state, api, paint) {
  const { C } = api,
    b = state.beat ?? 0,
    p = bound(state.beatP ?? 0),
    cues = state.cues;
  const colors = [C.blue, C.green, C.pink],
    xs = [450, 960, 1470];
  const amount = (id, fallback = phase(p)) => cue(cues, id, fallback);
  const starts = (id, fallback = p > 0.1) => begun(cues, id, fallback);
  paint(ctx, scene, state, api, C, b, p, cues, colors, xs, amount, starts);
}
export function withSoftmaxCompleteFrame(ctx, scene, state, api, paint) {
  const { C } = api,
    m = completeModel(),
    f = completeFrame(scene.id, state),
    b = f.beat;
  const colors = [C.blue, C.green, C.pink],
    xs = [450, 960, 1470];
  const started = (id) => f.started(id),
    progress = (id) => f.progress(id);
  api.focus.target(scene.id + '-operation', () => {
    paint(ctx, scene, state, api, C, m, f, b, colors, xs, started, progress);
  });
}
