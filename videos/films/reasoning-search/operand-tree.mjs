import { drawCard } from './defaults.mjs';

export function tile(ctx, api, node, label, color) {
  const { x, y, w = 132, h = 84, size = 42 } = node;
  return drawCard(ctx, api, label, x - w / 2, y - h / 2, w, h, color, size);
}

// Grow from the edge of the spent tile to the edge of the resulting tile.
export function stem(ctx, api, source, target, progress, color) {
  if (progress <= 0) return;
  const fromY = source.y + (source.h ?? 84) / 2 + 5;
  const toY = target.y - (target.h ?? 84) / 2 - 5;
  api.line(
    ctx,
    source.x,
    fromY,
    source.x + (target.x - source.x) * progress,
    fromY + (toY - fromY) * progress,
    color,
    4,
  );
}
