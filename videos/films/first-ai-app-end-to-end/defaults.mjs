import { request } from './fixtures.mjs';
export function text(
  ctx,
  api,
  v,
  x,
  y,
  size = 26,
  color = api.C.ink,
  align = 'left',
  mono = false,
) {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    mono || String(v).includes('_') ? 'mono' : 'sans',
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
    font: String(label).includes('_') ? 'mono' : 'sans',
    textColor: api.C.ink,
    fontSize,
    baselineOffset: fontSize * 0.34 - (String(label).split('\n').length - 1) * fontSize * 0.7,
    padding: 12,
  });
}
export function browser(ctx, api, mode, x = 180, width = 780, fields = 3) {
  api.components.panel({
    x,
    y: 345,
    width,
    height: 600,
    fill: api.C.panel,
    stroke: api.C.blue,
    radius: 18,
  });
  text(ctx, api, 'Policy check · simulated browser', x + 35, 392, 29, api.C.cyan);
  text(ctx, api, 'Account', x + 35, 455, 23, api.C.muted);
  card(ctx, api, 'acct_10234', x + 35, 475, width - 70, 66, api.C.blue, 27);
  text(ctx, api, 'Report', x + 35, 580, 23, api.C.muted);
  card(ctx, api, request.credential_report, x + 35, 600, width - 70, 80, api.C.blue, 26);
  card(
    ctx,
    api,
    mode === 'waiting' ? 'Checking policy…' : 'Check policy P-7',
    x + 35,
    715,
    width - 70,
    70,
    mode === 'waiting' ? api.C.yellow : api.C.cyan,
    27,
  );
  if (mode === 'completed') {
    if (fields > 0)
      text(
        ctx,
        api,
        fields > 1 ? 'ELIGIBLE · 30-day rule · P-7' : 'ELIGIBLE',
        x + 35,
        842,
        28,
        api.C.green,
      );
    if (fields > 2)
      text(ctx, api, 'Trace T-001 · checked response received', x + 35, 902, 24, api.C.green);
  } else
    text(
      ctx,
      api,
      mode === 'reloaded'
        ? 'Reloaded · outcome unknown to this page'
        : mode === 'waiting'
          ? 'Waiting for a server response'
          : 'Ready to submit',
      x + 35,
      860,
      25,
      api.C.muted,
    );
}
export function tracePanel(ctx, api, record, calls = 1) {
  const row = record ?? null;
  api.components.panel({
    x: 1100,
    y: 365,
    width: 650,
    height: 565,
    fill: api.C.panel,
    stroke: row?.status === 'completed' ? api.C.green : api.C.yellow,
    radius: 18,
  });
  text(ctx, api, 'SQLite trace · diagram state model', 1130, 410, 25, api.C.cyan);
  const lines = row
    ? [
        ['Trace', row.id],
        ['Account', row.account_id],
        ['Policy', row.policy],
        ['Status', row.status],
        ['Version', row.version],
        ['Provider invocations', calls],
        ['Saved decision', row.result?.decision ?? 'pending'],
      ]
    : [
        ['Stored rows', '0'],
        ['Provider invocations', calls],
        ['Status', 'no trace'],
      ];
  lines.forEach(([key, value], i) => {
    text(ctx, api, key, 1130, 475 + i * 59, 23, api.C.muted);
    text(
      ctx,
      api,
      value,
      1705,
      475 + i * 59,
      25,
      key === 'Status' ? api.C.yellow : api.C.ink,
      'right',
    );
  });
}
export function extensionText(ctx, api, v, x, y, size = 32, color = api.C.ink, align = 'left') {
  return api.text(
    ctx,
    String(v),
    x,
    y,
    size,
    color,
    align,
    String(v).includes('_') ? 'mono' : 'sans',
  );
}
export function outline(ctx, api, x, y, w, h, color = api.C.muted) {
  return api.rect(ctx, x, y, w, h, api.C.panel, color, 2);
}
export function focusTarget(ctx, api, name, fn) {
  return api.focus.target(name, fn);
}
export function traceStack(
  ctx,
  api,
  x,
  y,
  status,
  version,
  color = api.C.green,
  identity = 'T-001',
) {
  for (const offset of [20, 10, 0]) outline(ctx, api, x + offset, y + offset, 620, 240, color);
  extensionText(ctx, api, 'SQLite · one logical record', x + 25, y + 50, 31, color);
  api.line(ctx, x + 25, y + 75, x + 595, y + 75, api.C.muted, 2);
  extensionText(ctx, api, identity, x + 25, y + 130, 37, color);
  extensionText(ctx, api, 'version ' + version, x + 570, y + 130, 29, api.C.muted, 'right');
  extensionText(ctx, api, status, x + 25, y + 195, 36, color);
}
export function packet(ctx, api, x, y, label, color = api.C.cyan) {
  outline(ctx, api, x, y, 300, 90, color);
  extensionText(ctx, api, label, x + 150, y + 57, 29, color, 'center');
}
export function browserReceipt(ctx, api, x, y, outcome, color = api.C.yellow) {
  outline(ctx, api, x, y, 660, 390, api.C.blue);
  extensionText(ctx, api, 'Browser · received evidence', x + 25, y + 53, 31, api.C.blue);
  api.line(ctx, x + 25, y + 78, x + 635, y + 78, api.C.muted, 2);
  extensionText(ctx, api, 'Account 10234 · report text', x + 25, y + 140, 28);
  extensionText(ctx, api, outcome, x + 25, y + 235, 31, color);
  extensionText(ctx, api, 'Rotation jobs created: 0', x + 25, y + 330, 29, api.C.muted);
}
