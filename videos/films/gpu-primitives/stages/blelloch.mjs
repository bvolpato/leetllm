import { BLELLOCH, ARTICLE_INPUT } from '../fixtures.mjs';
import { drawExtendedBox as box, text } from '../defaults.mjs';
import { after, number } from '../score-trace.mjs';

const leaves = ARTICLE_INPUT.slice(0, 4);
const sums = BLELLOCH.states[1].values.filter((_, i) => i % 2 === 1);
const prefixes = BLELLOCH.states.at(-1).values;
const xs = [[960], [590, 1330], [405, 775, 1145, 1515]];
const ys = [314, 510, 701];

export function drawBlelloch(ctx, scene, state, api) {
  const { C } = api;
  const pairs = after(state, 'sweep-pairs', 0, 0.26);
  const root = after(state, 'sweep-sum', 0, 0.42);
  const saved = after(state, 'sweep-save', 0, 0.58);
  const zero = after(state, 'sweep-zero', 0, 0.73);
  const halves = after(state, 'sweep-halves', 1, 0.48);
  const end = after(state, 'sweep-leaves', 1, 0.78);
  const inclusive = after(state, 'sweep-inclusive', 2, 0.65);
  const stage = [pairs, root, zero, halves, end].filter(Boolean).length;
  api.focus.target('sweep-tree', () => {
    if (zero) {
      text(ctx, api, 'Saved subtree sum', 688, 219, 32, C.blue);
      text(ctx, api, 'Starting score', 1219, 219, 32, C.green);
    } else text(ctx, api, 'Up-sweep   ·   sum of plays', 960, 219, 36, C.blue);
    for (let level = 1; level <= 2; level++) {
      xs[level].forEach((x, i) => {
        const parent = xs[level - 1][Math.floor(i / 2)];
        const color = (level === 1 ? halves : end)
          ? C.green
          : (level === 1 ? root : pairs)
            ? C.blue
            : '#4e5460';
        // Stop at the edges of the two node labels.
        const topX = parent + (x - parent) * 0.21;
        const bottomX = x + (parent - x) * 0.21;
        if (zero) api.arrow(ctx, topX, ys[level - 1] + 44, bottomX, ys[level] - 47, color, 4);
        else api.arrow(ctx, bottomX, ys[level] - 47, topX, ys[level - 1] + 44, color, 4);
      });
    }
    const rows = [
      [zero ? 0 : root ? BLELLOCH.total : '·'],
      halves ? [0, sums[0]] : pairs ? sums : ['·', '·'],
      end ? prefixes : leaves,
    ];
    rows.forEach((values, level) =>
      values.forEach((v, i) => {
        const isPrefix = [zero, halves, end][level];
        box(
          ctx,
          api,
          number(v),
          xs[level][i] - 79,
          ys[level] - 40,
          158,
          80,
          isPrefix ? C.green : C.blue,
          44,
        );
      }),
    );
    if (saved) {
      text(ctx, api, 'Block total', 1510, 281, 30, C.muted);
      box(ctx, api, String(BLELLOCH.total), 1427, 301, 166, 78, C.yellow, 43);
    }
    text(ctx, api, 'Shared slots', 168, 891, 31, C.muted, 'left');
    BLELLOCH.states[stage].values.forEach((v, i) => {
      box(ctx, api, number(v), 443 + i * 275, 828, 197, 79, end ? C.green : C.cyan, 40);
    });
    text(
      ctx,
      api,
      inclusive
        ? 'Exclusive + play → inclusive     3, 2, 6, 7'
        : end
          ? 'Last play starts at 2 + 4 = 6'
          : halves
            ? 'Right pair starts at 0 + 2 = 2'
            : zero
              ? 'What starting score should the right pair get?'
              : 'Each parent covers both of its children.',
      960,
      987,
      39,
      C.ink,
    );
  });
}
export default {
  id: 'blelloch',
  draw: drawBlelloch,
  cues: [
    'sweep-pairs',
    'sweep-sum',
    'sweep-save',
    'sweep-zero',
    'sweep-halves',
    'sweep-leaves',
    'sweep-storage',
    'sweep-inclusive',
  ],
};
