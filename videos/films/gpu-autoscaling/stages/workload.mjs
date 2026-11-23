import { GiB, autoscaleMemory } from '../arithmetic.mjs';
import { afterClause, cueProgress } from '../timing.mjs';

const { bytesPerToken } = autoscaleMemory();
const pool = 8 * GiB;
const count = 5;
const x = (bytes) => 155 + (bytes / GiB) * 156;

export function drawWorkload(ctx, scene, state, api) {
  const { C } = api;
  const grow = cueProgress(state, 'extend-history', 1, 0.2, 0.7);
  const history = Math.round(4096 * (1 + 3 * grow));
  const perRequest = history * bytesPerToken;
  const consumed = count * perRequest;
  const fit = Math.floor(pool / perRequest);
  api.focus.target('history-length', () => {
    api.text(
      ctx,
      '5 requests  ·  ' + history.toLocaleString('en-US') + ' retained tokens each',
      155,
      259,
      42,
      C.ink,
    );
    api.text(
      ctx,
      'K and V × 32 layers × 8 KV heads × 128 values × 2 bytes = 128 KiB per token',
      155,
      357,
      32,
      C.muted,
    );
  });
  api.focus.target('cache-pool', () => {
    api.text(ctx, 'Available for KV', 155, 493, 32, C.muted);
    api.rect(ctx, x(0), 521, x(pool) - x(0), 162, C.panel, undefined, 3);
    for (let i = 0; i < count; i++) {
      const left = x(i * perRequest);
      const right = x((i + 1) * perRequest);
      const split = Math.min(right, Math.max(x(pool), left));
      if (split - left > 3)
        api.rect(ctx, left + 2, 564, split - left - 3, 76, C.cyan, undefined, 2);
      if (right - split > 3)
        api.rect(ctx, split + 2, 564, right - split - 3, 76, C.pink, undefined, 2);
      api.text(ctx, 'R' + (i + 1), (left + right) / 2, 614, 29, C.bg, 'center');
    }
    api.line(ctx, x(pool), 471, x(pool), 558, C.yellow, 4);
    api.line(ctx, x(pool), 646, x(pool), 720, C.yellow, 4);
    api.text(ctx, '8 GiB', x(pool), 443, 40, C.yellow, 'center');
    api.text(
      ctx,
      (consumed / GiB).toFixed(1) + ' GiB required',
      x(consumed),
      788,
      36,
      C.ink,
      'right',
    );
  });
  api.focus.target('cache-decision', () => {
    const settled = afterClause(state, 'four-fit', 2, 0.24);
    const question = grow > 0;
    const message = settled
      ? fit + ' of the ' + count + ' long histories fit in the same pool'
      : question
        ? 'How many of the five longer requests still fit?'
        : 'Each short history needs half a GiB';
    api.text(ctx, message, 960, 942, 42, C.ink, 'center');
  });
}
export default {
  id: 'workload',
  draw: drawWorkload,
  cues: ['kv-bytes', 'extend-history', 'four-fit'],
};
