export function cueVisible(ctx, api, id) {
  return api.focus.visible(id);
}
export function cueProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function evidenceText(ctx, api, s, x, y, size = 30, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function evidenceEquation(ctx, api, s, x, y, size = 38, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function evidenceBox(ctx, api, s, x, y, w, h = 100, color = api.C.cyan) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 12);
  s.split('\n').forEach((line, i, a) =>
    evidenceText(
      ctx,
      api,
      line,
      x + w / 2,
      y + h / 2 + (i - (a.length - 1) / 2) * 39 + 10,
      30,
      color,
      'center',
    ),
  );
}
export function evidenceLine(ctx, api, x, y, xx, yy, color = api.C.line, width = 3) {
  return api.line(ctx, x, y, xx, yy, color, width);
}
export function evidenceFootnote(ctx, api, s) {
  return evidenceText(ctx, api, s, 960, 987, 27, api.C.muted, 'center');
}
export function evidenceStamp(ctx, api, s, x, y, color = api.C.cyan) {
  return evidenceBox(ctx, api, s, x, y, 360, 95, color);
}
export function evidenceBook(ctx, api, x, y, tag = 'B7', color = api.C.cyan) {
  api.rect(ctx, x, y, 140, 185, api.C.panel, color, 8);
  evidenceLine(ctx, api, x + 18, y + 8, x + 18, y + 177, color);
  evidenceText(ctx, api, tag, x + 78, y + 84, 39, color, 'center');
  evidenceText(ctx, api, 'Stories', x + 78, y + 133, 24, api.C.muted, 'center');
}
export function evidenceHold(ctx, api, x, y, version = 3, which = 'B7', count = 1) {
  evidenceBox(ctx, api, 'Lena’s account', x, y, 470, 80, api.C.ink);
  for (let i = 0; i < count; i++)
    evidenceBox(
      ctx,
      api,
      'hold-17 · ' + which,
      x + 24,
      y + 106 + i * 80,
      422,
      65,
      which === 'B7' ? api.C.green : api.C.pink,
    );
  evidenceText(
    ctx,
    api,
    'version ' + version + ' · ' + count + ' hold' + (count === 1 ? '' : 's'),
    x + 235,
    y + 315,
    29,
    api.C.muted,
    'center',
  );
}
export function evidenceLane(ctx, api, items, y, colors, progress = 1) {
  items.forEach((s, i) => {
    const x = 190 + i * 375;
    if (i < items.length - 1) evidenceLine(ctx, api, x + 245, y + 47, x + 375, y + 47, api.C.line);
    evidenceBox(ctx, api, s, x, y, 245, 95, colors?.[i] ?? api.C.blue);
    if (i < items.length - 1 && progress > i / (items.length - 1)) {
      const u = Math.min(1, progress * (items.length - 1) - i);
      api.circle(ctx, x + 265 + 90 * u, y + 47, 8, api.C.cyan);
    }
  });
}
export function evidenceMatrix(ctx, api, rows, x, y, w = 1150) {
  rows.forEach((row, i) =>
    row.forEach((s, j) =>
      evidenceText(
        ctx,
        api,
        String(s),
        x + (j * w) / row.length,
        y + i * 65,
        29,
        i === 0 ? api.C.muted : api.C.ink,
      ),
    ),
  );
}
export function originalText(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function originalEquation(ctx, api, s, x, y, size = 42, color = api.C.cyan) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function originalCard(ctx, api, label, x, y, w = 380, color = api.C.cyan, h = 100) {
  return api.components.card({
    label,
    x,
    y,
    width: w,
    height: h,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
    fontSize: 32,
    baselineOffset: 32 * (label.includes('\n') ? -0.36 : 0.34),
    padding: 12,
  });
}
export function originalFootnote(ctx, api, s) {
  return originalText(ctx, api, s, 960, 950, 28, api.C.muted, 'center');
}
