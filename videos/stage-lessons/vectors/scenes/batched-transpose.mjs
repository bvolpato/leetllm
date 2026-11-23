import assert from 'node:assert/strict';
import { dynamic, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import {
  frame,
  ownedTable,
  AXIS_TRAP,
  batchedScoreState,
  fmt,
  gram,
  vectorText,
} from '../parts.mjs';

function fixture(edit) {
  return AXIS_TRAP.map((prompt, b) =>
    prompt.map((row, t) => row.map((v, d) => v + (b === 1 && t === 0 && d === 0 ? edit : 0))),
  );
}

export default function (s, c) {
  const f = frame(c);
  const [tables, calculation] = f.body.rows([3, 2], 'wide');
  const [a, b] = tables.columns(2, 'loose');
  const edit = s.value(0),
    route = s.value(0),
    ready = s.value(0);
  const correct = () => route.value === 2;
  const left = AXIS_TRAP[0][1];
  const expected = left.reduce((total, x) => total + x * x, 0);
  const right = () => (correct() ? left : fixture(edit.value)[1].map((token) => token[0]));
  const score = () => left.reduce((total, v, i) => total + v * right()[i], 0);
  for (const change of [0, 1]) {
    const { wrong, correct } = batchedScoreState(fixture(change));
    assert.deepEqual(
      wrong[0].map((r, i) => r[i]),
      [1, change ? 0.75 : 0.25],
    );
    assert.deepEqual(
      correct[0].map((r, i) => r[i]),
      [1, expected],
    );
  }
  const prompts = [a, b].map((region, i) =>
    ownedTable(region, {
      title: 'Prompt ' + i,
      rows: ['token 0', 'token 1'],
      columns: ['feature 0', 'feature 1'],
      values: () => fixture(edit.value)[i],
      cellColor: (t, d) => {
        if (i === 0 && t === 1) return 'cyan';
        if (i === 1 && d === 0 && route.value === 1) return 'yellow';
        return 'dim';
      },
    }),
  );
  const readRow = (table) => {
    const [first, last] = table.regions[1];
    return line([first.left, first.bottom], [last.right, last.bottom], {
      stroke: 'cyan',
      width: 4,
    });
  };
  const source = prompts[1].regions;
  const readColumn = line(
    [source[0][0].left, source[0][0].top],
    [source[1][0].left, source[1][0].bottom],
    { stroke: 'yellow', width: 4 },
  );
  const [operands, computation] = calculation.rows(2, 'normal');
  const [ls, rs] = operands.columns(2, 'loose');
  const lhs = place(label('Left  ·  prompt 0, token 1', { color: 'cyan' }), ls);
  const rhs = dynamic(() =>
    place(
      label(correct() ? 'Right  ·  prompt 0, token 1' : 'Right  ·  prompt 1, feature 0', {
        color: correct() ? 'cyan' : 'yellow',
      }),
      rs,
    ),
  );
  const equation = dynamic(() => {
    const terms = left.map((v, i) => fmt(v) + ' × ' + fmt(right()[i])).join('  +  ');
    return place(
      mono(terms + '  =  ' + (ready.value ? fmt(score()) : '?'), { size: 52 }),
      computation,
    );
  });
  const [caseSlot, checkSlot] = f.foot.columns([1.4, 1], 'wide');
  const operation = dynamic(() =>
    place(
      mono((correct() ? 'H @ H.swapaxes(-1, -2)' : 'H @ H.T') + '  →  (2, 2, 2)', { size: 34 }),
      caseSlot,
    ),
  );
  const check = place(
    mono('self-score must be ' + fmt(expected), { color: 'cyan', size: 36 }),
    checkSlot,
  );
  const grids = calculation.columns(2, 'loose').map((region, b) =>
    ownedTable(region, {
      title: 'Scores for prompt ' + b,
      rows: ['token 0', 'token 1'],
      columns: ['token 0', 'token 1'],
      values: () => gram(fixture(edit.value)[b]),
      colors: b ? ['yellow', 'yellow'] : ['cyan', 'cyan'],
    }),
  );
  const contract = place(mono('(B, T, D) @ (B, D, T)  →  (B, T, T)', { size: 38 }), f.foot);
  const question = place(
    label('What should this token score against itself?', { color: 'cyan' }),
    computation,
  );
  const input = place(note('H[0, 1, :] = ' + vectorText(left)), ls);
  s.add(
    f.title,
    prompts.map((p) => p.nodes),
    readRow(prompts[0]),
    input,
    question,
  );
  c.show('expected-self', check, { after: true });
  c.on('batch-reverse', () => route.set(1));
  c.swap('batch-reverse', [input, question], [lhs, rhs, readColumn, operation, equation]);
  c.after('batch-diagonal', () => ready.set(1));
  c.on('other-prompt', () => {
    ready.set(0);
    edit.set(1);
  });
  c.after('cross-prompt-score', () => ready.set(1));
  c.on('batch-repair', () => {
    ready.set(0);
    route.set(2);
  });
  c.hide('batch-repair', readColumn, { fade: 0.1 });
  c.after('same-self', () => ready.set(1));
  c.swap(
    'both-grids',
    [lhs, rhs, equation],
    grids.map((g) => g.nodes),
  );
  c.after('restore-control', () => edit.set(0));
  c.swap('score-contract', [check, operation], contract);
}
