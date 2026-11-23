import { deliveryState } from './arithmetic.mjs';
import { scaleTime, tokenMark } from './trace.mjs';

export const deliveryX = scaleTime(300, 480, 325, 1730);
export const serverY = 388;
export const clientY = 725;
export const clientEvents = deliveryState(Infinity).events;

export function eventRail(ctx, api, side, events) {
  const server = side === 'Server';
  const y = server ? serverY : clientY;
  const color = server ? api.C.cyan : api.C.pink;
  api.text(ctx, side, 102, y + 14, 42, color);
  api.line(ctx, deliveryX(300), y, deliveryX(480), y, api.C.muted, 3);
  for (const event of events) {
    tokenMark(ctx, api, deliveryX(event.time), y, event.ids.join(' + '), event.time, color);
  }
}

// Leave a gap for the timestamp below the server mark and for the token ID above the client mark.
export function transportPath(ctx, api, from, to, progress, color) {
  if (progress <= 0) return;
  const startY = serverY + 82;
  const endY = clientY - 90;
  const x = deliveryX(from + (to - from) * progress);
  const y = startY + (endY - startY) * progress;
  api.line(ctx, deliveryX(from), startY, x, y, color, 4);
  if (progress < 1) api.circle(ctx, x, y, 9, color);
}
