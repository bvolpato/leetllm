import { indicate, place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import {
  frame,
  ownedTable,
  vectorPlane,
  H,
  WORDS,
  transformBatch,
  BASE_OUTPUT,
  P,
} from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    [inputRegion, left, right] = f.body.columns([1, 1, 1.25], 'normal');
  const edit = s.value(0);
  const hidden = () =>
    H.map((m, b) => m.map((r, t) => (b === 0 && t === 2 ? [r[0] + edit.value, r[1]] : r)));
  const p = vectorPlane(left, { title: 'password output', x: 'out 0', y: 'out 2', max: 2 });
  const inputPlane = vectorPlane(inputRegion, {
    title: 'password input',
    x: 'in 0',
    y: 'in 1',
    max: 2,
  });
  const inputOriginal = inputPlane.mark(() => [H[0][2][0], H[0][2][1]], 'dim');
  const inputMoving = inputPlane.mark(() => [H[0][2][0] + edit.value, H[0][2][1]], 'cyan');
  const inputStep = inputPlane.mark(
    () => [H[0][2][0] + edit.value, H[0][2][1]],
    'yellow',
    () => H[0][2],
  );
  const oldTip = () => [BASE_OUTPUT[0][2][0], BASE_OUTPUT[0][2][2]];
  const newTip = () => [
    BASE_OUTPUT[0][2][0] + P[0][0] * edit.value,
    BASE_OUTPUT[0][2][2] + P[0][2] * edit.value,
  ];
  const original = p.mark(oldTip, 'dim');
  const moving = p.mark(newTip);
  const outputStep = p.mark(newTip, 'yellow', oldTip);
  const table = ownedTable(right, {
    title: 'Projected rows',
    rows: WORDS.flat(),
    columns: ['out 0', 'out 1', 'out 2'],
    values: () => transformBatch(hidden()).flat(),
    colors: ['green', 'green', 'cyan', 'green', 'green', 'green'],
    cellColor: (i, j) => (i === 2 && edit.value * P[0][j] !== 0 ? 'yellow' : undefined),
  });
  const question = place(
    mono('Add 1 to the first input. Which output stays put?', { size: 36, color: 'yellow' }),
    f.foot,
  );
  const answer = place(mono('Change in password = 1 × [1, 0, 0.5]', { color: 'yellow' }), f.foot);
  s.add(
    f.title,
    p.nodes,
    inputPlane.nodes,
    inputOriginal,
    inputMoving,
    table.nodes,
    original,
    moving,
    question,
  );
  c.on('predict-local-edit', () => s.play(indicate(table.rows[2], { scale: 1, duration: 1 })));
  c.show('change-password', [inputStep, outputStep], { lead: 0 });
  c.on('change-password', () => s.play(edit.to(1, { duration: 2 })));
  c.swap('check-locality', question, answer, { after: true });
  c.clear([...p.lines, ...inputPlane.lines], 0.46, 0.2);
}
