export function drawText(ctx, api, C, v, x, y, size = 31, col = C.ink, a = 'center') {
  return api.text(ctx, String(v), x, y, size, col, a);
}
export function equation(ctx, api, C, v, x, y, size = 42, col = C.ink) {
  return api.math(ctx, v, x, y, size, col, 'center');
}
export function rectangle(ctx, api, C, x, y, w, h, col = C.panel, stroke) {
  return api.rect(ctx, x, y, w, h, col, stroke, 8);
}
export function line(ctx, api, C, x, y, u, v, col = C.border, w = 3) {
  return api.line(ctx, x, y, u, v, col, w);
}
export function note(ctx, api, C, v, col = C.muted) {
  return drawText(ctx, api, C, v, 960, 1015, 27, col);
}
export function pill(ctx, api, C, v, x, y, w = 360, col = C.blue) {
  rectangle(ctx, api, C, x - w / 2, y - 32, w, 64, C.panel, col);
  drawText(ctx, api, C, v, x, y + 10, 29, col);
}
export function bar(ctx, api, C, x, y, w, value, max, col, label) {
  rectangle(ctx, api, C, x, y, w, 40, C.panel);
  if (value > 0) rectangle(ctx, api, C, x, y, (w * value) / max, 40, col);
  drawText(ctx, api, C, label, x, y - 18, 27, C.muted, 'left');
}
export function tokenCells(ctx, api, C, values, x, y, w = 170, col = C.blue) {
  return values.forEach((v, i) => {
    rectangle(ctx, api, C, x + i * w, y, w - 14, 65, C.panel, col);
    drawText(ctx, api, C, v, x + i * w + (w - 14) / 2, y + 43, 28, col);
  });
}
export function legacyText(ctx, api, C, v, x, y, z = 32, col = C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function legacyEquation(ctx, api, C, v, x, y, z = 43, col = C.ink, a = 'left') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function legacyCard(ctx, api, C, c, v, x, y, w = 270, col = C.cyan) {
  return c.card({
    label: v,
    x,
    y,
    width: w,
    height: 86,
    fontSize: 30,
    fill: C.panel,
    stroke: col,
    textColor: col,
  });
}
export function documentCard(ctx, api, C, c, record, x, y, alpha = 1) {
  return c.panel(
    {
      x,
      y,
      width: 270,
      height: 220,
      fill: C.panel,
      stroke: record.source === 'Code' ? C.pink : C.blue,
      padding: 18,
      opacity: alpha,
    },
    () => {
      legacyText(
        ctx,
        api,
        C,
        record.id +
          ' · ' +
          record.source +
          ' · ' +
          (record.id === 'B' ? 'P2' : record.id === 'D' ? 'P3' : 'P1'),
        x + 22,
        y + 42,
        27,
        C.cyan,
      );
      legacyText(ctx, api, C, record.text.split(' ').slice(0, 2).join(' '), x + 22, y + 94, 28);
      legacyText(ctx, api, C, record.text.split(' ').slice(2).join(' '), x + 22, y + 132, 28);
      legacyText(ctx, api, C, `${record.tokens} tokens`, x + 22, y + 170, 26, C.muted);
      legacyText(ctx, api, C, 'Score ' + record.score.toFixed(2), x + 22, y + 202, 26, C.yellow);
    },
  );
}
export function withPretrainingOriginalFrame(ctx, scene, state, api, paint) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0, 0, 1),
    s = (i) => (b < i ? 0 : b > i ? 1 : api.phase(p, 0.04, 0.9));
  paint(ctx, scene, state, api, C, c, t, b, p, s);
}
export function withPretrainingMainFrame(ctx, scene, state, api, paint) {
  const { C, components: c } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0, 0, 1),
    cue = (k) => state.cues?.['pt-' + scene.id + '-' + k],
    P = (k) => {
      const q = cue(k);
      return !q || q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress;
    },
    D = (k) => cue(k)?.phase === 'after',
    beg = (k) => {
      const q = cue(k);
      return q && q.phase !== 'before';
    };
  api.focus.target(scene.id + '-mechanism', () => {
    paint(ctx, scene, state, api, C, c, b, p, cue, P, D, beg);
  });
}
