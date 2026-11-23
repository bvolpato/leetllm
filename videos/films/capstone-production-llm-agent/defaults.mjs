import { operation } from './model.mjs';
export function text(ctx, api, v, x, y, z = 29, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function card(ctx, api, v, x, y, w = 510, color = api.C.cyan, h = 110) {
  return api.components.card({
    label: v,
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    baselineOffset: 29 * (0.34 - 0.7 * (v.split('\n').length - 1)),
    padding: 13,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function formatAgentText(ctx, api, v) {
  return String(v)
    .replace(
      /\b(Attempt|Effects:|effects:|tokens|Latency|Expiry|expiry|Time|time|stage|steps|version)(?=\d)/g,
      '$1 ',
    )
    .replace(/\s*\+\s*/g, ' + ');
}
export function drawAgentUpgradeText(
  ctx,
  api,
  v,
  x,
  y,
  size = 31,
  col = api.C.ink,
  align = 'left',
) {
  return api.text(
    ctx,
    formatAgentText(ctx, api, v),
    x,
    y,
    size,
    col,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function drawAgentUpgradeLines(ctx, api, xs, x, y, size = 30, col = api.C.ink, gap = 55) {
  return xs.forEach((v, i) => drawAgentUpgradeText(ctx, api, v, x, y + i * gap, size, col));
}
export function drawAgentUpgradeBox(ctx, api, v, x, y, w = 450, h = 92, col = api.C.blue) {
  return api.components.card({
    label: formatAgentText(ctx, api, v),
    x,
    y,
    width: w,
    height: h,
    fontSize: 29,
    font: String(v).includes('_') ? 'mono' : 'sans',
    padding: 12,
    textColor: col,
    stroke: col,
    fill: api.C.panel,
  });
}
export function drawAgentUpgradePaper(ctx, api, x, y, w, h, label, col = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, col, 2, 10);
  drawAgentUpgradeText(ctx, api, label, x + 25, y + 45, 30, col);
  api.line(ctx, x + 25, y + 65, x + w - 25, y + 65, col, 2);
}
export function drawAgentUpgradeFooter(ctx, api, v) {
  return drawAgentUpgradeText(ctx, api, v, 960, 1015, 27, api.C.muted, 'center');
}
export function drawAgentUpgradeArrow(ctx, api, x, y, z, w, col = api.C.cyan) {
  return api.arrow(ctx, x, y, z, w, col, 4);
}
export function drawAgentUpgradeProgress(ctx, api, id) {
  return api.focus.progress(id, 0);
}
export function drawAgentUpgradeLedger(ctx, api, x, y, n, pending = 0) {
  drawAgentUpgradePaper(
    ctx,
    api,
    x,
    y,
    650,
    340,
    'SQLite effects ·committed rows',
    n ? api.C.green : api.C.muted,
  );
  if (n) {
    api.rect(ctx, x + 25, y + 110, 600, 94, api.C.panel, api.C.green, 2, 8);
    drawAgentUpgradeLines(
      ctx,
      api,
      [operation.slice(0, 18), 'A300 ·prod-api'],
      x + 45,
      y + 148,
      27,
      api.C.green,
      43,
    );
  } else
    drawAgentUpgradeText(
      ctx,
      api,
      'No committed effect',
      x + 325,
      y + 180,
      33,
      api.C.muted,
      'center',
    );
  if (pending)
    drawAgentUpgradeBox(
      ctx,
      api,
      'Uncommitted insert ·not durable',
      x + 25,
      y + 245,
      600,
      65,
      api.C.yellow,
    );
  drawAgentUpgradeText(
    ctx,
    api,
    `COUNT(*) = ${n}`,
    x + 325,
    y + 400,
    31,
    n ? api.C.green : api.C.muted,
    'center',
  );
}
export function drawAgentUpgradeSubtitle(ctx, api) {
  return drawAgentUpgradeText(
    ctx,
    api,
    'Ticket r-104 ·principal support-1 ·read grant A300',
    960,
    245,
    29,
    api.C.ink,
    'center',
  );
}
