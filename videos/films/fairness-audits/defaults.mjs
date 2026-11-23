export function retainedText(ctx, api, s, x, y, size = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function retainedMath(ctx, api, s, x, y, size = 42, color = api.C.yellow, align = 'center') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function retainedCard(
  ctx,
  api,
  label,
  x,
  y,
  width,
  color = api.C.cyan,
  height = 88,
  opacity = 1,
  fontSize = 27,
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
    opacity,
    fontSize,
    padding: 12,
  });
}
export function retainedTransfer(ctx, api, from, to, color, progress, fromAlpha = 1, toAlpha = 1) {
  return api.teaching.transfer({
    source: {
      shape: from,
      opacity: fromAlpha,
    },
    target: {
      shape: to,
      opacity: toAlpha,
    },
    color,
    width: 3,
    progress,
    gap: 24,
    margin: 4,
    particle: {
      radius: 7,
      fill: color,
    },
  });
}
export function cueProgress(ctx, api, id, fallback) {
  return api.focus.progress(id, fallback);
}
export function chapterText(ctx, api, v, x, y, size = 33, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function chapterMath(ctx, api, v, x, y, size = 43, color = api.C.yellow) {
  return api.math(ctx, v, x, y, size, color, 'center');
}
export function chapterRect(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 10);
}
export function chapterLine(ctx, api, x, y, u, v, color = api.C.muted, w = 3) {
  return api.line(ctx, x, y, u, v, color, w);
}
export function chapterTextRows(ctx, api, rows, x, y, w, color) {
  chapterRect(ctx, api, x, y, w, 310, color);
  rows.forEach((v, i) => chapterText(ctx, api, v, x + 30, y + 64 + i * 57, 29, color));
}
export function chapterScale(ctx, api, x, y, w, lo = 0, hi = 1) {
  chapterLine(ctx, api, x, y, x + w, y, api.C.muted, 3);
  [lo, (lo + hi) / 2, hi].forEach((v) => {
    const px = x + (w * (v - lo)) / (hi - lo);
    chapterLine(ctx, api, px, y - 8, px, y + 8, api.C.muted);
    chapterText(ctx, api, v.toFixed(2), px, y + 48, 27, api.C.muted, 'center');
  });
  return (v) => x + (w * (v - lo)) / (hi - lo);
}
export function chapterCase(ctx, api, id, x, y, ready, color) {
  chapterRect(ctx, api, x, y, 88, 62, color);
  chapterText(ctx, api, id, x + 44, y + 39, 27, color, 'center');
  if (ready !== undefined)
    chapterText(
      ctx,
      api,
      ready ? 'ready' : 'unclear',
      x + 44,
      y + 94,
      22,
      ready ? api.C.green : api.C.pink,
      'center',
    );
}
export function chapterRequests(ctx, api, showCutoff = true) {
  chapterText(ctx, api, 'p4 · same eligible blender claim', 960, 280, 39, api.C.yellow, 'center');
  chapterTextRows(
    ctx,
    api,
    [
      'I bought a blender 12 days ago.',
      'It stopped working. Please replace it',
      'under the 30-day policy.',
    ],
    150,
    350,
    740,
    api.C.blue,
  );
  chapterTextRows(
    ctx,
    api,
    [
      'got a blender 12 days ago and it',
      'already stopped working. Can you',
      'replace it? The 30-day policy',
      'should cover this.',
    ],
    1030,
    350,
    740,
    api.C.pink,
  );
  chapterText(
    ctx,
    api,
    'blender · stopped working · 12 days · 30-day replacement',
    960,
    730,
    34,
    api.C.cyan,
    'center',
  );
  const map = chapterScale(ctx, api, 260, 915, 1400, 0.5, 1);
  if (showCutoff) chapterLine(ctx, api, map(0.7), 790, map(0.7), 947, api.C.yellow, 4);
  api.circle(ctx, map(0.78), 840, 13, api.C.blue);
  api.circle(ctx, map(0.67), 885, 13, api.C.pink);
  chapterText(ctx, api, 'formal 0.78', map(0.78), 805, 28, api.C.blue, 'center');
  chapterText(ctx, api, 'conversational 0.67', map(0.67) - 25, 845, 27, api.C.pink, 'right');
  if (showCutoff) chapterText(ctx, api, 'cutoff 0.70', map(0.7), 775, 28, api.C.yellow, 'center');
}
