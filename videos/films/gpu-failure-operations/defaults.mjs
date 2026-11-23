import { gpuReceiptFixtures } from './fixtures.mjs';
import { gpuFrame, memoryReceipt } from './arithmetic.mjs';
import { sampleModel } from './model.mjs';
export function text(ctx, api, C, v, x, y, z = 30, color = C.ink, align = 'left') {
  return api.text(ctx, String(v), x, y, z, color, align);
}
export function equation(ctx, api, C, v, x, y, z = 44) {
  return api.math(ctx, v, x, y, z, C.yellow, 'center');
}
export function card(ctx, api, C, c, label, x, y, width, color = C.cyan, height = 95, z = 30) {
  return c.card({
    label,
    x,
    y,
    width,
    height,
    fontSize: z,
    baselineOffset: z * (0.34 - 0.7 * (label.split('\n').length - 1)),
    fill: C.panel,
    stroke: color,
    textColor: color,
    padding: 14,
  });
}
export function connectCards(ctx, api, C, source, target, color = C.cyan) {
  return api.connect(ctx, source, target, {
    color,
    gap: 16,
  });
}
export function constructionText(ctx, api, C, s, x, y, size = 30, color = C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align, String(s).includes('_') ? 'mono' : 'sans');
}
export function constructionEquation(ctx, api, C, s, x, y, size = 42, color = C.ink) {
  return api.math(ctx, s, x, y, size, color, 'center');
}
export function constructionLine(ctx, api, C, x, y, xx, yy, c = C.muted, w = 2) {
  return api.line(ctx, x, y, xx, yy, c, w);
}
export function constructionArrow(ctx, api, C, x, y, xx, yy, c = C.cyan) {
  return api.arrow(ctx, x, y, xx, yy, c, 3);
}
export function constructionHeading(ctx, api, C, s) {
  return constructionText(ctx, api, C, s, 960, 255, 34, C.ink, 'center');
}
export function constructionNote(ctx, api, C, s) {
  return constructionText(ctx, api, C, s, 960, 1030, 25, C.muted, 'center');
}
export function constructionBox(ctx, api, C, s, x, y, w = 400, h = 80, c = C.cyan, size = 30) {
  api.rect(ctx, x - w / 2, y - h / 2, w, h, C.panel, c, 2);
  constructionText(ctx, api, C, s, x, y + size * 0.34, size, c, 'center');
}
export function memoryBudget(ctx, api, C, row, y = 430, width = 1480) {
  const x = 210,
    scale = width / row.capacity_gib,
    v = memoryReceipt(row),
    parts = [
      [row.pytorch_allocated_gib, C.blue],
      [v.gap, C.cyan],
      [v.outside, C.pink],
      [v.free, C.yellow],
    ];
  let left = x;
  for (const [value, color] of parts) {
    if (value !== null) {
      api.rect(ctx, left, y, value * scale, 110, color);
      left += value * scale;
    }
  }
  if (row.pytorch_reserved_gib !== null) {
    constructionLine(
      ctx,
      api,
      C,
      x,
      y - 20,
      x + row.pytorch_reserved_gib * scale,
      y - 20,
      C.cyan,
      4,
    );
    constructionLine(ctx, api, C, x, y - 20, x, y - 5, C.cyan, 4);
    constructionLine(
      ctx,
      api,
      C,
      x + row.pytorch_reserved_gib * scale,
      y - 20,
      x + row.pytorch_reserved_gib * scale,
      y - 5,
      C.cyan,
      4,
    );
  }
  return v;
}
export function memoryReceiptRow(ctx, api, C, row, y = 360) {
  const items = [
    ['capacity', row.capacity_gib],
    ['allocated', row.pytorch_allocated_gib],
    ['reserved', row.pytorch_reserved_gib],
    ['device used', row.nvml_device_used_gib],
    ['inactive total', row.inactive_split_block_total_gib],
    ['largest hole', row.largest_inactive_split_block_gib],
    ['request', row.oom_request_gib],
  ];
  items.forEach(([name, value], i) => {
    const x = 260 + i * 228;
    constructionText(ctx, api, C, name, x, y, 24, C.muted, 'center');
    constructionText(
      ctx,
      api,
      C,
      value === null ? 'unknown' : value.toFixed(2) + ' GiB',
      x,
      y + 65,
      30,
      i === 6 ? C.yellow : C.cyan,
      'center',
    );
  });
  constructionText(
    ctx,
    api,
    C,
    'captured result: ' + row.cuda_error + ' · backend: ' + row.allocator_backend,
    960,
    y + 160,
    31,
    C.ink,
    'center',
  );
}
export function withGpuLegacyFrame(ctx, scene, state, api, paint) {
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state),
    b = s.step;
  paint(ctx, scene, state, api, C, c, t, s, b);
}
export function withGpuConstructionFrame(ctx, scene, state, api, paint) {
  const { C } = api,
    f = gpuFrame(state),
    b = f.b,
    p = f.p,
    show = (id, beat) => f.started(id, beat),
    prog = (id, beat) => f.progress(id, beat),
    done = (id, beat) => f.completed(id, beat);
  const original = gpuReceiptFixtures[0];
  api.focus.target(scene.id + '-operation', () => {
    paint(ctx, scene, state, api, C, f, b, p, show, prog, done, original);
  });
}
