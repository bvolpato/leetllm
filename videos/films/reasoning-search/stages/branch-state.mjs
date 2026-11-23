import { cueAt } from '../cue-clock.mjs';
import { combine, numberValue, valueLabel } from '../arithmetic.mjs';
import { stem, tile } from '../operand-tree.mjs';

const inputs = [6, 4, 5, 7];
const branches = [
  {
    name: 'A',
    op: '×',
    pair: [0, 1],
    x: 228,
    select: 'branch-select-a',
    move: 'branch-a-move',
    carry: 'branch-a-carry',
    result: 'branch-a-result',
  },
  {
    name: 'B',
    op: '+',
    pair: [2, 3],
    x: 1145,
    select: 'branch-select-b',
    move: 'branch-b-move',
    carry: 'branch-b-carry',
    result: 'branch-b-result',
  },
];
export function drawBranchState(ctx, scene, state, api) {
  api.focus.target('branch-state-mechanism', () => {
    const { C, text } = api;
    for (const [i, branch] of branches.entries()) {
      const chosen = cueAt(state, branch.select, 0, 0.2 + 0.38 * i, 0.32 + 0.38 * i).done;
      const moving = cueAt(state, branch.move, 1, i * 0.49, i * 0.49 + 0.1);
      const result = cueAt(state, branch.result, 1, i * 0.49 + 0.1, i * 0.49 + 0.25).done;
      const carry = cueAt(state, branch.carry, 1, i * 0.49 + 0.26, i * 0.49 + 0.42);
      const roots = inputs.map((_, j) => ({ x: branch.x + 183 * j, y: 400 }));
      const pair = branch.pair.map((j) => roots[j]);
      const join = { x: (pair[0].x + pair[1].x) / 2, y: 720, w: 152 };
      const color = i === 1 && cueAt(state, 'branch-trace', 2, 0, 0.3).started ? C.yellow : C.cyan;
      text(ctx, 'Tray ' + branch.name, branch.x - 68, 272, 42, C.ink);
      roots.forEach((r, j) => {
        const active = branch.pair.includes(j);
        const child = active ? join : { ...r, y: join.y };
        stem(ctx, api, r, child, active ? moving.progress : carry.progress, active ? color : C.muted);
        tile(ctx, api, r, inputs[j], chosen && active ? color : C.blue);
        if (!active && carry.done) tile(ctx, api, child, inputs[j], C.blue);
      });
      if (moving.started) text(ctx, branch.op, join.x, 550, 44, C.ink, 'center');
      if (result) {
        const [a, b] = branch.pair.map((j) => numberValue(inputs[j]));
        tile(ctx, api, join, valueLabel(combine(a, b, branch.op)), color);
      }
    }
    const trace = cueAt(state, 'branch-trace', 2, 0, 0.3);
    if (cueAt(state, 'branch-b-carry', 1, 0.75, 0.91).done) {
      text(
        ctx,
        trace.done ? 'B carries 5 and 7 inside its 12.' : 'Which two originals are inside B’s 12?',
        960,
        932,
        42,
        trace.done ? C.cyan : C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'branch-state',
  draw: drawBranchState,
  cues: [
    'branch-select-a',
    'branch-select-b',
    'branch-a-move',
    'branch-a-result',
    'branch-a-carry',
    'branch-b-move',
    'branch-b-result',
    'branch-b-carry',
    'branch-trace',
  ],
};
