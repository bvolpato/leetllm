import { clamp } from './arithmetic.mjs';
export function text(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, v, x, y, size, color, align);
}
export function equation(ctx, api, v, x, y, size = 46) {
  return api.math(ctx, v, x, y, size, api.C.yellow, 'center');
}
export function card(ctx, api, label, x, y, width = 370, color = api.C.blue, height = 100) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: 28,
    ...(label.includes('\n')
      ? {
          baselineOffset: -16.24,
        }
      : {}),
    textColor: color,
    fill: api.C.panel,
    stroke: color,
    padding: 12,
  });
}
export function extensionText(ctx, api, v, x, y, size = 31, color = api.C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, size, color, align);
}
export function rectangle(ctx, api, x, y, w, h, fill = api.C.panel, stroke = api.C.muted, r = 8) {
  return api.rect(ctx, x, y, w, h, fill, stroke, r);
}
export function line(ctx, api, x1, y1, x2, y2, color = api.C.muted, width = 2) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function arrow(ctx, api, x1, y1, x2, y2, color = api.C.cyan) {
  return api.arrow(ctx, x1, y1, x2, y2, color, 3);
}
export function box(ctx, api, label, x, y, w = 420, h = 100, color = api.C.blue, size = 29) {
  rectangle(ctx, api, x, y, w, h, api.C.panel, color);
  const lines = String(label).split('\n');
  lines.forEach((v, i) =>
    extensionText(
      ctx,
      api,
      v,
      x + w / 2,
      y + h / 2 + (i - (lines.length - 1) / 2) * 37,
      size,
      color,
      'center',
    ),
  );
  return {
    x,
    y,
    width: w,
    height: h,
  };
}
export function cells(ctx, api, labels, x, y, w, h, color = api.C.cyan, active = labels.length) {
  const gap = 6,
    cw = (w - gap * (labels.length - 1)) / labels.length;
  labels.forEach((v, i) => {
    rectangle(
      ctx,
      api,
      x + i * (cw + gap),
      y,
      cw,
      h,
      api.C.panel,
      i < active ? color : api.C.muted,
      4,
    );
    extensionText(
      ctx,
      api,
      v,
      x + i * (cw + gap) + cw / 2,
      y + h / 2,
      Math.min(30, cw * 0.38, (cw - 22) / (String(v).length * 0.59)),
      i < active ? color : api.C.muted,
      'center',
    );
  });
}
export function table(ctx, api, labels, x = 190, y = 390, w = 1540, rowHeight = 75, size = 28) {
  return api.teaching.grid({
    x,
    y,
    width: w,
    height: labels.length * rowHeight,
    rows: labels.length,
    columns: labels[0].length,
    labels,
    fontSize: size,
    fill: api.C.panel,
    stroke: api.C.muted,
    textColor: api.C.ink,
  });
}
export function bar(ctx, api, label, v, max, x, y, w, color = api.C.cyan, readout = String(v)) {
  extensionText(ctx, api, label, x, y - 28, 29, color);
  rectangle(ctx, api, x, y, w, 24, api.C.panel, api.C.muted, 3);
  rectangle(ctx, api, x, y, Math.max(0.01, w * clamp(v / max)), 24, color, color, 3);
  extensionText(ctx, api, readout, x + w, y - 28, 29, color, 'right');
}
export function footer(ctx, api, v, color = api.C.muted) {
  return extensionText(ctx, api, v, 960, 1015, 28, color, 'center');
}
export function title(ctx, api, v) {
  return extensionText(ctx, api, v, 960, 275, 36, api.C.yellow, 'center');
}

export function slot(ctx, api, label, x, y, width, height, color, size = 36) {
  rectangle(ctx, api, x, y, width, height, api.C.panel, color, 8);
  if (label)
    text(ctx, api, label, x + width / 2, y + height / 2 + size * 0.33, size, color, 'center');
}

// Empty segments are reserved address space. The fill follows the actual byte count.
export function payloadSlots(ctx, api, { x, y, width, height, received, reserved, segments }) {
  const filled = (width * received) / reserved;
  rectangle(ctx, api, x, y, width, height, api.C.panel, api.C.muted, 2);
  if (filled > 0) rectangle(ctx, api, x, y, filled, height, api.C.cyan, api.C.cyan, 2);
  for (let i = 1; i < segments; i++) {
    const cut = x + (width * i) / segments;
    line(ctx, api, cut, y + 1, cut, y + height - 1, api.C.bg, 6);
  }
}
export function clock(ctx, api, lanes, intervals, domain, time, y = 420, h = 320, ticks) {
  return api.teaching.timeline({
    x: 150,
    y,
    width: 1600,
    height: h,
    domain,
    time,
    lanes,
    intervals,
    ticks: ticks ?? [domain[0], domain[1]],
    labelWidth: 310,
    fontSize: 26,
    color: api.C.muted,
    trackColor: api.C.panel,
  });
}
