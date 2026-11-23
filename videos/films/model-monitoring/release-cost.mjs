import { line, text } from './defaults.mjs';
import { delayedErrorCostLimit } from './fixtures.mjs';
import { simulateRelease } from './model.mjs';

export function releaseWindow(mature, joined, fp, fn) {
  const raw = 2 * fp + 10 * fn;
  const perThousand = (raw * 1000) / mature;
  return {
    mature,
    joined,
    fp,
    fn,
    raw,
    perThousand,
    receipt: simulateRelease({ mature, joined, cost: perThousand }),
  };
}

// A tile is one error. Its width is the number of cost units charged for that error.
export function errorTiles(ctx, api, window, alerts, misses) {
  const { C } = api;
  const costs = [
    [window.fp, 2, 'false alerts', C.pink, alerts],
    [window.fn, 10, 'unflagged misses', C.yellow, misses],
  ];
  costs.forEach(([n, weight, name, color, progress], i) => {
    if (progress === 0) return;
    const y = 333 + i * 82;
    text(ctx, api, `${n} ${name}`, 155, y + 17, 35, C.ink, 'left');
    const width = weight * 26;
    for (let j = 0; j < n; j++) {
      const amount = Math.max(0, Math.min(1, progress * n - j));
      const left = 640 + j * width;
      api.rect(ctx, left, y - 14, width, 38, C.panel, C.muted, 0);
      if (amount > 0) api.rect(ctx, left, y - 14, width * amount, 38, color, undefined, 0);
      if (j > 0) line(ctx, api, left, y - 14, left, y + 24, C.bg, 3);
    }
    text(ctx, api, `${weight} cost units each`, 1480, y + 17, 31, color);
  });
}

export function costRuler(ctx, api, tracks) {
  const { C } = api;
  const x = (value) => 510 + 11.6 * value;
  const y = (i) => 686 + i * 112;
  text(ctx, api, 'Error cost per 1,000 predictions', 155, 599, 32, C.ink, 'left');
  text(ctx, api, `Limit  ${delayedErrorCostLimit}`, x(delayedErrorCostLimit), 599, 34, C.yellow);
  line(
    ctx,
    api,
    x(delayedErrorCostLimit),
    620,
    x(delayedErrorCostLimit),
    y(tracks.length - 1) + 36,
    C.yellow,
    4,
  );
  for (const value of [0, 100]) text(ctx, api, value, x(value), 650, 27, C.muted);
  tracks.forEach(({ n, value, progress = 1, label, color }, i) => {
    const rowY = y(i);
    text(ctx, api, `${n} predictions`, 155, rowY + 11, 31, C.blue, 'left');
    line(ctx, api, x(0), rowY, x(100), rowY, C.muted, 3);
    if (value == null) return;
    const end = x(value * progress);
    line(ctx, api, x(0), rowY, end, rowY, color, 7);
    api.circle(ctx, end, rowY, 13, color);
    if (label) text(ctx, api, value, x(value), rowY + 49, 34, color);
  });
}
