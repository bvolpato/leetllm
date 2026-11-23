import { text } from './defaults.mjs';

export const queueX = (ms) => 160 + (1600 * ms) / 500;

export function queueScale(ctx, api, y, limitMs = 250) {
  const { C } = api;
  api.line(ctx, queueX(0), y, queueX(500), y, C.muted, 3);
  for (let ms = 0; ms <= 500; ms += 50) {
    api.line(ctx, queueX(ms), y, queueX(ms), y + 13, C.muted, 2);
  }
  text(ctx, api, 'Arrival · 0', queueX(0), y + 59, 30, C.muted);
  text(ctx, api, '500 ms', queueX(500), y + 59, 30, C.muted, 'right');
  api.line(ctx, queueX(limitMs), y, queueX(limitMs), y + 25, C.yellow, 5);
  text(ctx, api, limitMs + ' ms queue limit', queueX(limitMs), y + 64, 33, C.yellow, 'center');
}

export function workBlock(ctx, api, fromMs, toMs, y, label, color) {
  const x = queueX(fromMs),
    width = queueX(toMs) - x;
  api.rect(ctx, x + 2, y - 64, width - 4, 62, api.C.panel, color, 5);
  text(ctx, api, label, x + width / 2, y - 21, 32, color, 'center');
}
