import { cueAmount } from '../construction.mjs';
import { target, text } from '../defaults.mjs';

export function drawGreedyBranch(ctx, scene, state, api) {
  const { C } = api,
    x = 300,
    width = 1300;
  const paths = [
    { token: 'A', p: 0.6, conditional: 0.1, color: C.blue, y: 420 },
    { token: 'B', p: 0.4, conditional: 0.9, color: C.green, y: 730 },
  ];
  const parts = [
    cueAmount(state, 0, 'greedy-split-a', 0.29, 0.57),
    cueAmount(state, 0, 'greedy-split-b', 0.61, 0.8),
  ];
  const pick = cueAmount(state, 1, 'greedy-pick', 0.02, 0.32);
  const compare = cueAmount(state, 1, 'greedy-compare', 0.42, 0.64);
  text(ctx, api, 'Share of paths from the original prefix', x, 242, 34, C.muted);
  for (const [i, path] of paths.entries()) {
    const { color, token, p, conditional, y } = path;
    const branch = width * p,
      best = branch * conditional;
    target(ctx, api, 'greedy-' + token.toLowerCase(), () => {
      text(ctx, api, 'First token   ' + token, x, y - 47, 43, color);
      text(ctx, api, p.toFixed(2), x + branch, y - 47, 41, color, 'right');
      api.rect(ctx, x, y, width, 85, C.panel, C.muted, 1);
      api.rect(ctx, x, y, branch, 85, color);
      if (parts[i] > 0) {
        const boundaries =
          i === 0 ? Array.from({ length: 9 }, (_, j) => (j + 1) / 10) : [conditional];
        for (const [j, fraction] of boundaries.entries()) {
          const amount = Math.max(0, Math.min(1, parts[i] * boundaries.length - j));
          if (amount > 0)
            api.line(
              ctx,
              x + branch * fraction,
              y,
              x + branch * fraction,
              y + 85 * amount,
              C.bg,
              5,
            );
        }
      }
      if (parts[i] === 1)
        text(
          ctx,
          api,
          i === 0 ? 'Ten equal continuations' : 'One continuation takes nine tenths',
          x,
          y + 145,
          34,
          C.ink,
        );
      if (pick > 0) api.line(ctx, x, y + 96, x + best * pick, y + 96, C.yellow, 7);
      if ((i === 0 ? pick : compare) === 1)
        text(
          ctx,
          api,
          p.toFixed(2) + ' × ' + conditional.toFixed(2) + ' = ' + (p * conditional).toFixed(2),
          x + width,
          y + 145,
          36,
          C.yellow,
          'right',
        );
    });
  }
}

export default {
  id: 'greedy-branch',
  draw: drawGreedyBranch,
  cues: ['greedy-split-a', 'greedy-split-b', 'greedy-pick', 'greedy-compare'],
};
