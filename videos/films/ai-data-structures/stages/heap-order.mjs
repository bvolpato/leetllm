import { heapTrace, mix, rank, weaker } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCard, drawText, withFocus } from '../defaults.mjs';

const trace = heapTrace();
const last = trace.at(-1);
const candidates = trace.map((step) => step.incoming).filter((row) => row.score > 0);
const ranked = rank(candidates);

export function drawHeapOrder(ctx, scene, state, api) {
  const { C } = api;
  withFocus(ctx, api, 'ds-heap-order-mechanism', () => {
    if (state.beat < 2) {
      const check = q(state, 'ds-heap-order-0', 1);
      const search = q(state, 'heap-order-left', 1, 0.55, 0.92);
      drawText(ctx, api, 'Storage order    [ 1, 5, 3 ]', 960, 300, 38, C.ink, 'center');
      const links = [
        [620, 5],
        [1300, 3],
      ];
      links.forEach(([x, value], i) => {
        const startX = i === 0 ? 893 : 1027;
        const endX = i === 0 ? x + 47 : x - 47;
        api.line(ctx, startX, 475, endX, 648, C.muted, 4);
        const p = api.clamp(2 * check - i);
        if (p > 0) api.line(ctx, startX, 475, mix(startX, endX, p), mix(475, 648, p), C.cyan, 6);
        if (search > 0 && i === 0)
          api.line(ctx, endX, 648, mix(endX, startX, search), mix(648, 475, search), C.pink, 6);
        drawCard(ctx, api, String(value), x - 115, 650, 230, 105, C.cyan, 1, 51);
      });
      drawCard(ctx, api, '1', 845, 370, 230, 105, C.cyan, 1, 51);
      if (check === 1)
        drawText(ctx, api, 'Min-heap     1 ≤ 5     1 ≤ 3', 960, 849, 38, C.green, 'center');
      if (search === 1)
        drawText(ctx, api, 'Search tree     left child 5 > root 1', 960, 929, 36, C.pink, 'center');
    } else if (state.beat === 2 || state.beat === 3) {
      const swap = q(state, 'ds-heap-order-1', 2);
      const compare = q(state, 'heap-order-guard', 3);
      const p = swap * (1 - compare);
      const root = last.before[0];
      const child = last.before[1];
      const incoming = last.incoming;
      drawText(ctx, api, 'Arrival', 355, 345, 33, C.muted, 'center');
      drawText(ctx, api, 'Root', 965, 345, 33, C.muted, 'center');
      drawText(ctx, api, 'Removed', 1545, 345, 33, C.muted, 'center');
      api.line(ctx, 987, 527, 1140, 675, C.muted, 4);
      const node = (row, x, y, color) =>
        drawCard(
          ctx,
          api,
          'M' + row.id + '   score ' + row.score,
          x - 178,
          y,
          356,
          97,
          color,
          1,
          34,
        );
      node(incoming, mix(355, 965, p), 408, C.pink);
      node(root, mix(965, 1545, p), 408, C.cyan);
      node(child, 1180, 675, C.cyan);
      if (p === 1)
        drawText(
          ctx,
          api,
          'A score of two just left to make room for zero.',
          960,
          917,
          36,
          C.pink,
          'center',
        );
      if (compare === 1)
        drawText(ctx, api, '0 < 2     Keep the root. Discard M1.', 960, 917, 36, C.green, 'center');
    } else {
      const path = q(state, 'ds-heap-order-2', 4);
      const double = q(state, 'heap-order-double', 4, 0.22, 0.29);
      const resize = q(state, 'heap-order-resize', 4, 0.3, 0.41);
      const budget = q(state, 'heap-order-budget', 4, 0.45, 0.58);
      const one = q(state, 'heap-order-one', 4, 0.73, 0.8);
      const sort = q(state, 'heap-order-sort', 4, 0.83, 0.91);
      if (one > 0) {
        const seen = Math.ceil(one * candidates.length);
        const best = candidates.slice(0, seen).reduce((a, b) => (weaker(a, b) ? b : a));
        drawText(ctx, api, 'Scored notes', 155, 308, 40, C.ink);
        candidates.forEach(({ id, score }, i) =>
          drawCard(
            ctx,
            api,
            'M' + id + '    score ' + score,
            570 + i * 408,
            243,
            345,
            94,
            i < seen ? C.cyan : C.muted,
            1,
            37,
          ),
        );
        drawText(ctx, api, 'Best so far', 155, 544, 42, C.ink);
        drawCard(ctx, api, 'M' + best.id, 570, 475, 215, 100, C.green, 1, 46);
        if (sort > 0) {
          drawText(ctx, api, 'Full ranking', 155, 783, 42, C.ink);
          ranked.forEach(({ id }, i) =>
            drawCard(ctx, api, 'M' + id, 570 + i * 408, 715, 215, 100, C.green, 1, 46),
          );
        }
        return;
      }
      const levels = [[960], [595, 1325], [415, 775, 1145, 1505]];
      const ys = [305, 435, 565, 695];
      const edges = levels.length - 1;
      const slots = levels.flat().length;
      const added = Math.floor(double * slots);
      if (added) levels.push([325, 505, 685, 865, 1055, 1235, 1415].slice(0, added));
      drawText(ctx, api, slots + added + ' slots', 155, 302, 42, C.ink);
      drawText(ctx, api, levels.length + ' levels', 155, 365, 37, C.cyan);
      if (path > 0 && added === 0)
        drawText(
          ctx,
          api,
          Math.floor(path * edges) + ' / ' + edges + ' edges',
          155,
          428,
          37,
          C.yellow,
        );
      levels.forEach((xs, level) => {
        xs.forEach((x, i) => {
          if (level) {
            const fromX = levels[level - 1][Math.floor(i / 2)];
            api.line(ctx, fromX, ys[level - 1] + 36, x, ys[level] - 36, C.muted, 4);
            const p = i === 0 && level <= edges ? api.clamp(edges * path - level + 1) : 0;
            if (p > 0)
              api.line(
                ctx,
                fromX,
                ys[level - 1] + 36,
                mix(fromX, x, p),
                mix(ys[level - 1] + 36, ys[level] - 36, p),
                C.yellow,
                6,
              );
          }
          api.circle(
            ctx,
            x,
            ys[level],
            35,
            C.panel,
            level > edges ? C.cyan : i === 0 && path * edges >= level ? C.yellow : C.muted,
            4,
          );
        });
      });
      if (resize > 0 && budget === 0)
        drawText(
          ctx,
          api,
          'Backing list resize: up to k references copied',
          960,
          805,
          30,
          C.cyan,
          'center',
        );
      drawText(
        ctx,
        api,
        'Inspect root   O(1)      /      Repair one path   O(log k) key comparisons',
        960,
        871,
        36,
        C.ink,
        'center',
      );
      if (budget > 0)
        drawText(
          ctx,
          api,
          'm candidates  ·  2 ≤ k ≤ m  ·  O(m log k) time  ·  O(k) heap space',
          960,
          953,
          30,
          C.muted,
          'center',
        );
    }
  });
}
export default {
  id: 'heap-order',
  draw: drawHeapOrder,
  cues: [
    'ds-heap-order-0',
    'heap-order-left',
    'ds-heap-order-1',
    'heap-order-guard',
    'ds-heap-order-2',
    'heap-order-double',
    'heap-order-resize',
    'heap-order-budget',
    'heap-order-one',
    'heap-order-sort',
  ],
};
