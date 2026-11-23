import { combine, initialItems, numberValue, stateKey, valueLabel } from '../arithmetic.mjs';
import { cueAt } from '../cue-clock.mjs';
import { stem, tile } from '../operand-tree.mjs';

const original = [6, 4, 5, 7];
const pair = original.slice(0, 2).map(numberValue);
const product = combine(...pair, '×');
const host = [{ value: product }, ...initialItems(original.slice(2))];
const proposals = [[24], [24, 5, 7]];
const name = (values) => '[ ' + values.join(',  ') + ' ]';
const sum = (a, b) => valueLabel(combine(numberValue(a), numberValue(b), '+'));

export function drawArithmeticControllerContract(ctx, scene, state, api) {
  api.focus.target('arithmetic-controller-contract-mechanism', () => {
    const { C, text, line } = api;
    if ((state.beat ?? 0) < 2) {
      text(ctx, 'Host tray', 160, 316, 37, C.muted);
      const replay = cueAt(state, 'contract-replay', 0, 0.34, 0.7);
      const result = { x: 784, y: 465, w: 310 };
      original.forEach((n, i) => {
        const input = { x: 677 + i * 215, y: 305 };
        if (i < 2) stem(ctx, api, input, result, replay.progress, C.cyan);
        tile(ctx, api, input, n, i < 2 ? C.cyan : C.blue);
      });
      if (replay.started) {
        tile(ctx, api, result, replay.done ? '6 × 4 = ' + valueLabel(product) : '6 × 4', C.cyan);
      }
      line(ctx, 158, 528, 1752, 528, C.muted, 2);
      const graded = cueAt(state, 'contract-verdict', 1, 0, 0.2).done;
      proposals.forEach((values, i) => {
        const y = 656 + i * 160;
        text(ctx, 'Proposal ' + (i + 1), 160, y, 38, C.muted);
        text(ctx, name(values), 620, y, 54, C.ink);
        if (graded) {
          const legal = stateKey(initialItems(values)) === stateKey(host);
          text(
            ctx,
            legal ? 'Admit move' : 'Reject: missing 5 and 7',
            1750,
            y,
            38,
            legal ? C.green : C.pink,
            'right',
          );
        }
      });
      if (!graded)
        text(ctx, 'Which remaining list can enter the search?', 960, 954, 42, C.yellow, 'center');
      return;
    }
    const key = cueAt(state, 'contract-key', 2, 0.36, 0.5);
    const sums = [sum(4, 5), sum(6, 7)];
    text(ctx, 'First addition', 428, 335, 35, C.muted, 'center');
    text(ctx, 'Second addition', 935, 335, 35, C.muted, 'center');
    const orders = [
        [0, 1],
        [1, 0],
      ],
      ops = ['4 + 5', '6 + 7'];
    for (const [i, order] of orders.entries()) {
      const y = 465 + 265 * i;
      const progress = cueAt(
        state,
        i === 0 ? 'contract-add-one' : 'contract-add-two',
        2,
        i * 0.2,
        i * 0.2 + 0.17,
      ).progress;
      const color = i === 0 ? C.blue : C.cyan;
      text(ctx, i === 0 ? 'A' : 'B', 134, y + 14, 47, color);
      order.forEach((index, j) => {
        if (progress <= j * 0.5) return;
        if (j === 1) line(ctx, 605, y, 759, y, color, 4);
        tile(ctx, api, { x: j ? 935 : 428, y, w: 344 }, ops[index] + ' = ' + sums[index], color);
      });
      if (key.progress > 0) {
        const joinY = (465 + 730) / 2;
        line(ctx, 1112, y, 1112 + 232 * key.progress, y + (joinY - y) * key.progress, color, 5);
      }
    }
    if (key.done) {
      tile(ctx, api, { x: 1510, y: 598, w: 330, h: 120, size: 57 }, name(sums), C.yellow);
      if (cueAt(state, 'contract-expand-once', 2, 0.72, 0.82).done) {
        text(ctx, 'Expand once', 1510, 730, 45, C.yellow, 'center');
      }
    }
  });
}
export default {
  id: 'arithmetic-controller-contract',
  draw: drawArithmeticControllerContract,
  cues: [
    'contract-replay',
    'contract-verdict',
    'contract-add-one',
    'contract-add-two',
    'contract-key',
    'contract-expand-once',
    'contract-oracle',
  ],
};
