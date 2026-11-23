import { mix } from '../arithmetic.mjs';
import { chapterText, chip } from '../defaults.mjs';
export function drawTraceQueue(ctx, api, colors, model) {
  const gap = 235,
    start = 565,
    y = 500,
    incoming = {
      x: 1650,
      y: 350,
    };
  const moving = model.travel > 0 ? model.next?.event : null;
  const locate = (name, value) => {
    let index = value.queue.indexOf(name);
    if (index >= 0)
      return {
        x: start + index * gap,
        y,
      };
    index = value.sentIds.indexOf(name);
    if (index >= 0)
      return {
        x: 150 + index * 160,
        y: 795,
      };
    index = value.droppedIds.indexOf(name);
    if (index >= 0)
      return {
        x: 1460 + index * 135,
        y: 795,
      };
    return incoming;
  };
  chapterText(ctx, api, `FIFO · capacity ${model.capacity}`, 960, 285, 35, colors.yellow, 'center');
  chapterText(ctx, api, 'front', 465, 545, 25, colors.muted);
  chapterText(ctx, api, 'New arrivals', 1695, 325, 24, colors.blue, 'center');
  for (let i = 0; i < model.capacity; i++)
    api.rect(ctx, start + i * gap - 10, y - 20, 205, 120, colors.panel, colors.muted, 3);
  for (const name of model.arrivedIds) {
    if (moving?.id === name) continue;
    const old = locate(name, model),
      next = model.next ? locate(name, model.next) : old;
    const color = model.droppedIds.includes(name)
      ? colors.pink
      : model.sentIds.includes(name)
        ? colors.green
        : colors.cyan;
    chip(
      ctx,
      api,
      name,
      mix(old.x, next.x, model.travel),
      mix(old.y, next.y, model.travel),
      model.queue.includes(name) ? 180 : 120,
      color,
      75,
      28,
    );
  }
  if (moving) {
    const old = locate(moving.id, model),
      next = locate(moving.id, model.next);
    let x = mix(old.x, next.x, model.travel),
      y = mix(old.y, next.y, model.travel);
    if (moving.kind === 'sent' || moving.kind === 'discarded') {
      const points = [
          old,
          {
            x: old.x,
            y: 690,
          },
          {
            x: next.x,
            y: 690,
          },
          next,
        ],
        lengths = points
          .slice(1)
          .map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y));
      let remaining = model.travel * lengths.reduce((a, z) => a + z, 0),
        edge = 0;
      while (edge < lengths.length - 1 && remaining > lengths[edge]) remaining -= lengths[edge++];
      const fraction = remaining / lengths[edge];
      x = mix(points[edge].x, points[edge + 1].x, fraction);
      y = mix(points[edge].y, points[edge + 1].y, fraction);
    }
    chip(ctx, api, moving.id, x, y, 120, colors.blue, 75, 28);
  }
  chapterText(ctx, api, 'Sent', 165, 930, 28, colors.green);
  chapterText(ctx, api, 'Dropped', 1475, 930, 28, colors.pink);
  if (model.countReady)
    chapterText(
      ctx,
      api,
      `${model.arrivedIds.length} arrivals = ${model.sentIds.length} sent + ${model.queue.length} queued + ${model.droppedIds.length} dropped`,
      960,
      930,
      34,
      colors.yellow,
      'center',
    );
}
