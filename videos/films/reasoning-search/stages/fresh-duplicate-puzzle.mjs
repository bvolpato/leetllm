import { evaluateTree, valueLabel } from '../arithmetic.mjs';
import { occurrenceExpressionCheck } from '../construction.mjs';
import { cueAt } from '../cue-clock.mjs';
import { FRESH_FRACTION_TREE, FRESH_WRONG_TREE, FRESH_LEAVES } from '../fixtures.mjs';
import { stem, tile } from '../operand-tree.mjs';

const [threeA, threeB, eightA, eightB] = FRESH_LEAVES;
const leaves = [eightA, threeA, threeB, eightB];
const label = (leaf) => leaf.leaf + ' ' + leaf.occurrence.slice(-1).toUpperCase();
const value = (tree) => valueLabel(evaluateTree(tree).value);
const copied = { ...FRESH_FRACTION_TREE, left: eightA };
const quotient = FRESH_FRACTION_TREE.right.right;
const divisor = FRESH_FRACTION_TREE.right;
const right = occurrenceExpressionCheck(FRESH_FRACTION_TREE);
const wrong = occurrenceExpressionCheck(copied);
const miss = occurrenceExpressionCheck(FRESH_WRONG_TREE);
const roots = [220, 471, 798, 1100].map((x) => ({ x, y: 321, w: 172 }));
const first = { x: 347, y: 535, w: 290 };
const second = { x: 615, y: 705, w: 276 };
const last = { x: 863, y: 908, w: 267 };

export function drawFreshDuplicatePuzzle(ctx, scene, state, api) {
  api.focus.target('fresh-duplicate-puzzle-mechanism', () => {
    const { C, text, line } = api;
    const reset = cueAt(state, 'fresh-reset', 1, 0, 0.09).done;
    const copy =
      cueAt(state, 'fresh-copy', 3, 0.09, 0.53).done &&
      !cueAt(state, 'fresh-repair', 4, 0.42, 0.69).done;
    const check = copy ? wrong : right;
    const goal = cueAt(state, 'fresh-goal', 2, 0.06, 0.32).done;
    const eightThirds = cueAt(state, 'fresh-eight-thirds', 1, 0.25, 0.36).done;
    const third = cueAt(state, 'fresh-third', 1, 0.57, 0.7).done;
    const times = (tree) => {
      if (Object.hasOwn(tree, 'leaf')) return [tree.occurrence];
      return [...times(tree.left), ...times(tree.right)];
    };
    const missDone = cueAt(state, 'fresh-wrong', 0, 0.66, 0.84).done;
    const fives = cueAt(state, 'fresh-fives', 0, 0.52, 0.65).done;
    const used = reset
      ? goal
        ? check.occurrences
        : third
          ? times(divisor)
          : eightThirds
            ? times(quotient)
            : []
      : fives
        ? miss.occurrences
        : [];
    line(ctx, 1263, 224, 1263, 966, C.muted, 2);
    text(ctx, 'Tile', 1330, 285, 33, C.muted);
    text(ctx, 'Uses', 1660, 285, 33, C.muted, 'center');
    leaves.forEach((leaf, i) => {
      const count = used.filter((id) => id === leaf.occurrence).length;
      text(ctx, label(leaf), 1330, 387 + 90 * i, 42, C.ink);
      text(ctx, String(count), 1660, 387 + 90 * i, 46, count ? C.cyan : C.muted, 'center');
    });
    if (!reset) {
      const trace = cueAt(state, 'fresh-pairs', 0, 0.31, 0.5);
      const partners = [first, { ...first, x: 952 }];
      roots.forEach((root, i) =>
        stem(ctx, api, root, partners[Math.floor(i / 2)], trace.progress, C.cyan),
      );
      const final = { ...second, x: 651, y: 794, w: 250 };
      partners.forEach((node, i) => {
        if (fives)
          tile(
            ctx,
            api,
            node,
            '8 − 3 = ' + value(i ? FRESH_WRONG_TREE.right : FRESH_WRONG_TREE.left),
            C.cyan,
          );
        stem(ctx, api, node, final, cueAt(state, 'fresh-wrong', 0, 0.66, 0.84).progress, C.cyan);
      });
      if (missDone) {
        tile(ctx, api, final, '5 × 5 = ' + miss.result, C.pink);
        text(ctx, 'Target 24', 1330, 808, 43, C.ink);
        text(ctx, 'Miss by 1', 1330, 883, 43, C.pink);
      }
    } else {
      const divide = cueAt(state, 'fresh-divide', 1, 0.1, 0.24);
      const subtract = cueAt(state, 'fresh-subtract', 1, 0.37, 0.54);
      const finish = cueAt(state, 'fresh-finish', 2, 0, 0.06);
      const finalInput = { x: roots[3].x, y: second.y, w: 185 };
      stem(ctx, api, roots[0], first, divide.progress, C.cyan);
      stem(ctx, api, roots[1], first, divide.progress, C.cyan);
      stem(ctx, api, first, second, subtract.progress, C.cyan);
      stem(ctx, api, roots[2], second, subtract.progress, C.cyan);
      if (!copy) stem(ctx, api, roots[3], finalInput, third ? 1 : 0, C.blue);
      stem(ctx, api, second, last, finish.progress, C.cyan);
      stem(ctx, api, finalInput, last, finish.progress, C.blue);
      if (divide.started)
        tile(ctx, api, first, eightThirds ? '8 ÷ 3 = ' + value(quotient) : '8 ÷ 3', C.cyan);
      if (subtract.started)
        tile(ctx, api, second, third ? '3 − 8/3 = ' + value(divisor) : '3 − 8/3', C.cyan);
      if (third) tile(ctx, api, finalInput, label(copy ? eightA : eightB), C.blue);
      if (finish.done) tile(ctx, api, last, goal ? '8 ÷ ⅓ = ' + check.result : '8 ÷ ⅓', C.cyan);
      const rejected = cueAt(state, 'fresh-reject', 4, 0, 0.11).done;
      const repaired = cueAt(state, 'fresh-verified', 4, 0.7, 0.85).done;
      const pendingRepair = cueAt(state, 'fresh-repair', 4, 0.42, 0.69).done && !repaired;
      if (copy || pendingRepair) {
        text(
          ctx,
          copy && rejected ? 'Reject trace' : copy ? 'Accept this trace?' : 'Checking trace',
          1330,
          850,
          42,
          copy && rejected ? C.pink : C.yellow,
        );
      } else if (goal) {
        text(ctx, 'Value   ' + check.result, 1330, 788, 43, C.ink);
        text(ctx, 'Each tile once', 1330, 860, 42, C.green);
      } else if (third) {
        text(ctx, '8   ?   ⅓  =  24', 1320, 840, 50, C.yellow);
      }
    }
    roots.forEach((node, i) => tile(ctx, api, node, label(leaves[i]), C.blue));
  });
}
export default {
  id: 'fresh-duplicate-puzzle',
  draw: drawFreshDuplicatePuzzle,
  cues: [
    'fresh-pairs',
    'fresh-fives',
    'fresh-wrong',
    'fresh-reset',
    'fresh-divide',
    'fresh-eight-thirds',
    'fresh-subtract',
    'fresh-third',
    'fresh-finish',
    'fresh-goal',
    'fresh-copy',
    'fresh-reject',
    'fresh-repair',
    'fresh-verified',
  ],
};
