import {
  assertEqual,
  arrow,
  boxOf,
  column,
  indicate,
  numberLine,
  place,
  table,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { REWARD, requestGraph, SIDE, gamma, returns, ACTIONS } from '../parts.mjs';
export default function qLearning(s, c) {
  const b = requestGraph(s);
  const [record, cellArea, ruler, foot] = SIDE.rows([2, 1.7, 2, 1.3], 'normal');
  const cells = place(
    table(
      ACTIONS.map((key) => ({ key, sample: '29.5', marks: key === 'Evidence' })),
      [{ id: 'new', Approve: '0', Evidence: '0', Review: '0' }],
      {
        width: cellArea.width,
        size: 34,
        maxRows: 1,
        states: { updated: { color: 'green', mark: 'dot' } },
      },
    ),
    cellArea,
  );
  const tuple = place(
    column(
      [
        label('One observed transition', { color: 'cyan' }),
        mono('New → ask → evidence'),
        mono(`r = ${REWARD.ask}; next max = ${REWARD.evidence}`),
      ],
      { gap: 'normal' },
    ),
    record,
  );
  const q = place(
    numberLine({
      range: [0, 60],
      length: ruler.width - 90,
      ticks: [0, 30, 60],
      size: 34,
      labelSize: 34,
      format: (v) => String(v),
      points: [{ name: 'Q', value: 0, color: 'green' }],
    }),
    ruler,
  );
  for (const action of ['Approve', 'Review']) {
    cells.cell('new', action).opacity(0.45);
    cells.header(action).opacity(0.6);
  }
  const link = arrow([boxOf(cells).cx, boxOf(cells).bottom + 12], ruler.point('top'), {
    stroke: 'green',
  });
  const rule = place(
    column(
      [
        mono(`${REWARD.ask} + ${gamma} × ${REWARD.evidence}`),
        note('Opening estimates on a new ticket.'),
      ],
      { gap: 'normal' },
    ),
    foot,
  );
  const result = place(
    mono(`Target = ${returns.evidence}`, { color: 'yellow' }),
    foot.rows([1, 1], 'normal')[0],
  );
  const question = place(
    mono('0 + 0.5 × (59 − 0) = ?', { size: 36, color: 'yellow' }),
    foot.rows([1, 1], 'normal')[1],
  );
  const halfway = place(mono('Q = 29.5', { color: 'green' }), foot.rows([1, 1], 'normal')[1]);
  assertEqual(0.5 * returns.evidence, 29.5, 'one Q update');
  s.add(heading(c.title), b.nodes, tuple.nodes[0], cells, link, q, rule.nodes[1]);
  c.show('record', tuple.nodes[1]);
  c.on('sample', () => s.play(b.g.go('evidence', { duration: 1.3 })));
  c.show('sample', tuple.nodes[2]);
  c.show('target-rule', rule.nodes[0]);
  c.hide('target', rule.nodes[1]);
  c.swap('target', rule.nodes[0], result, { after: true });
  c.after('target', () =>
    s.play(
      q.insert({ name: 'Target', value: returns.evidence, color: 'yellow' }, { duration: 0.4 }),
    ),
  );
  c.after('half', () =>
    s.play(
      q.move('Q', returns.evidence * 0.5, { duration: 0.35 }),
      cells.setCell('new', 'Evidence', { value: String(returns.evidence * 0.5), state: 'updated' }),
    ),
  );
  c.show('ask-step', question);
  c.swap('half', question, halfway, { after: true, lead: 0 });
  c.on('one-cell', () =>
    s.play(indicate(cells.cell('new', 'Evidence'), { scale: 1, color: 'green' })),
  );
  c.on('off-policy', () => s.play(indicate(tuple.nodes[2], { scale: 1 })));
}
