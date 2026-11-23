import { cueFraction } from '../cues.mjs';

export function drawLivePeak(ctx, scene, state, api) {
  const { C } = api,
    start = 165,
    unit = 38,
    limit = 36;
  const position = (n) => start + unit * n;
  const count = (n, id, beat, a, b) => Math.floor(n * cueFraction(state, id, beat, a, b));
  const shard = count(16 / 4, 'peak-shard', 0, 0.26, 0.4);
  const full = count(16, 'peak-full', 0, 0.43, 0.6);
  const acts = count(12, 'peak-acts', 0, 0.64, 0.83);
  const prefetch = count(8, 'peak-prefetch', 1, 0.14, 0.37) - count(8, 'peak-delay', 2, 0.08, 0.28);
  const pieces = [
    ['Owned shard', shard, C.blue],
    ['Full compute', full, C.pink],
    ['Activations', acts, C.green],
    ['Next block', prefetch, C.cyan],
  ];
  const total = pieces.reduce((n, [, value]) => n + value, 0);
  api.focus.target('live-set', () => {
    api.text(ctx, 'One rank at module entry', 165, 280, 43, C.ink);
    const limitX = position(limit);
    api.text(ctx, limit + ' elements available', limitX, 409, 41, C.yellow, 'right');
    api.line(ctx, limitX, 431, limitX, 630, C.yellow, 4);
    let offset = 0;
    pieces.forEach(([label, n, color], i) => {
      for (let j = 0; j < n; j++)
        api.rect(ctx, position(offset + j) + 2, 484, unit - 4, 102, color, undefined, 3);
      const x = 165 + (i % 2) * 815,
        y = 740 + Math.floor(i / 2) * 87;
      api.circle(ctx, x + 12, y - 13, 12, color);
      api.text(ctx, label + '    ' + n, x + 43, y, 38, n ? C.ink : C.muted);
      offset += n;
    });
    api.line(ctx, position(0), 615, position(40), 615, C.muted, 3);
    for (const n of [0, 8, 16, 24, 32, 40]) {
      api.line(ctx, position(n), 615, position(n), 631, C.muted, 3);
      api.text(ctx, String(n), position(n), 669, 30, C.muted, 'center');
    }
  });
  api.focus.target('peak-verdict', () => {
    const picking = state.beat === 0 && acts === 12;
    const message = picking
      ? '32 used. How much room is left?'
      : state.beat === 2 && prefetch === 0
        ? total + ' used   •   ' + (limit - total) + ' slots free'
        : total > limit
          ? total + ' used   •   ' + (total - limit) + ' over the allowance'
          : total + ' elements in use';
    api.text(ctx, message, 960, 974, 53, total > limit ? C.pink : C.ink, 'center');
  });
}
export default {
  id: 'live-peak',
  draw: drawLivePeak,
  cues: [
    'peak-shard',
    'peak-full',
    'peak-acts',
    'peak-prefetch',
    'peak-over',
    'peak-delay',
    'peak-room',
  ],
};
