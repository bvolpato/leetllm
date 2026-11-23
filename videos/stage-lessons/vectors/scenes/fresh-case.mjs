import assert from 'node:assert/strict';
import { dynamic, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame, ownedTable, FRESH_H, transform, fmt, vectorText } from '../parts.mjs';
import { countedRows, tally } from '../counted-rows.mjs';

const inputAt = (edit) => FRESH_H.map(([x, y], i) => [x + (i === 2 ? edit : 0), y]);
const projected = (edit) => inputAt(edit).map(transform);
const counted = (outputs, fourthReal) =>
  outputs.map((values, i) => ({
    name: 'slot ' + i,
    values,
    present: true,
    counted: i < 3 || fourthReal,
  }));
const exact = (v) => (v === 2 / 3 ? '2/3' : v === 5 / 6 ? '5/6' : fmt(v));

export default function (s, c) {
  const f = frame(c);
  const edit = s.value(0),
    ran = s.value(0),
    fourth = s.value(0);
  const [left, right] = f.body.columns(2, 'loose');
  const names = FRESH_H.map((_, i) => 'slot ' + i);
  const input = ownedTable(left, {
    title: 'One prompt',
    rows: names,
    columns: ['x', 'y'],
    values: () => inputAt(edit.value),
    cellColor: (i, j) => (edit.value && i === 2 && j === 0 ? 'yellow' : 'ink'),
  });
  const baseline = projected(0);
  const outputs = projected(1);
  const saved = () => (ran.value ? outputs : baseline);
  const output = ownedTable(right, {
    title: 'Saved projection',
    rows: names,
    columns: ['out 0', 'out 1', 'out 2'],
    values: saved,
    cellColor: (i, j) => (saved()[i][j] !== baseline[i][j] ? 'yellow' : 'dim'),
  });
  const rule = place(mono('P maps [x, y] to [x, y, (x + y)/2]', { size: 40 }), f.foot);
  const shape = place(mono('1 prompt × 4 stored positions × 3 outputs', { size: 38 }), f.foot);
  const rows = () => counted(outputs, Boolean(fourth.value));
  const ledger = countedRows(f.body, {
    rows,
    width: 3,
    max: 1,
    format: exact,
    title: 'Projected rows',
    reference: tally(counted(outputs, false)).mean,
  });
  const validity = dynamic(() =>
    place(
      mono(
        'Mask in use  [' +
          rows()
            .map((r) => Number(r.counted))
            .join(', ') +
          ']',
        {
          size: 36,
          color: 'cyan',
        },
      ),
      f.foot.columns(2, 'normal')[0],
    ),
  );
  const roleSlot = f.foot.columns(2, 'normal')[1];
  const padding = place(label('Slot 3 is padding', { size: 38 }), roleSlot);
  const newPrompt = place(label('Next prompt: slot 3 is a real token', { size: 38 }), roleSlot);
  const division = dynamic(() => {
    const { sum, count } = tally(rows());
    return place(mono(vectorText(sum) + ' ÷ ' + count, { size: 40 }), roleSlot);
  });
  const marks = place(
    label('Ticks mark the three-token mean', { size: 38, color: 'cyan' }),
    roleSlot,
  );
  const question = place(note('What divides this sum?'), f.foot);
  assert.deepEqual(outputs[2], [2, 1, 1.5]);
  assert.deepEqual(tally(counted(outputs, false)).mean, [1, 2 / 3, 5 / 6]);
  assert.deepEqual(tally(counted(outputs, true)).mean, [0.75, 0.5, 0.625]);

  s.add(f.title, input.nodes, output.nodes, rule);
  c.after('fresh-input-change', () => edit.set(1));
  c.after('fresh-token-answer', () => ran.set(1));
  c.swap('fresh-shape', rule, shape, { after: true });
  c.swapAll('pool-slots', [ledger.sheet, question], { keep: [f.title] });
  c.show('fresh-summary', ledger.sum, { after: true });
  c.show('fresh-count', ledger.count, { after: true });
  c.show('fresh-summary-answer', ledger.means, { after: true });
  c.swap('fresh-summary-answer', question, [validity, padding], { after: true });
  c.swap('next-prompt', padding, newPrompt);
  c.show('next-prompt', ledger.referenceMarks);
  c.hide('fresh-padding-answer', ledger.readings);
  c.after('fresh-padding-answer', () => fourth.set(1));
  c.swap('fresh-padding-answer', newPrompt, division, { after: true });
  c.show('fourth-mean', ledger.readings, { after: true });
  c.swap('fourth-mean', division, marks, { after: true });
}
