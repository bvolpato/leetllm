export function graphText(ctx, api, s, x, y, size = 34, color = api.C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function receiptCard(ctx, api, label, x, y, w = 360, color = api.C.cyan, h = 100) {
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
    padding: 12,
  });
}
export function focusTarget(ctx, api, id, draw) {
  return api.focus.target(id, draw);
}
export function cueProgress(ctx, api, id, f) {
  return api.focus.progress(id, f);
}
export function text(ctx, api, v, x, y, size = 33, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function rectangle(ctx, api, x, y, w, h, color = api.C.blue, fill = api.C.panel) {
  return api.rect(ctx, x, y, w, h, fill, color, 8);
}
export function line(ctx, api, x, y, u, v, color = api.C.muted, width = 3) {
  return api.line(ctx, x, y, u, v, color, width);
}
export function cell(ctx, api, v, x, y, w = 420, color = api.C.blue, h = 100) {
  rectangle(ctx, api, x, y, w, h, color);
  text(ctx, api, v, x + w / 2, y + h * 0.65, 31, color, 'center');
}
export function requestIdentity(ctx, api, revision = 3) {
  return text(
    ctx,
    api,
    `tenant7 · release-17 · r17/v${revision} · requested traffic 25%`,
    960,
    280,
    33,
    api.C.yellow,
    'center',
  );
}
export function evidenceReceipt(ctx, api, row, x, y, w = 460, version = 3) {
  const color = row === 'Eval' ? api.C.blue : row === 'Health' ? api.C.pink : api.C.green;
  rectangle(ctx, api, x, y, w, 135, color);
  text(ctx, api, row + ' · r17/v' + version, x + w / 2, y + 45, 31, color, 'center');
  text(
    ctx,
    api,
    row === 'Eval' ? '2/100 regressions' : row === 'Health' ? '4/10,000 errors' : 'max traffic 25%',
    x + w / 2,
    y + 100,
    30,
    color,
    'center',
  );
}
