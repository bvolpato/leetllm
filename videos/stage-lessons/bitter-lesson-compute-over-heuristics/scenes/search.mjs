import { place, row, table, assertEqual } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { BODY } from '../parts.mjs';
import { candidates } from '../../../films/bitter-lesson-compute-over-heuristics/fixtures.mjs';
import { verifierScore } from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';

export default function search(s, c) {
  const [caseBand, main, ruleBand, decisionBand] = BODY.rows([0.8, 3.5, 0.65, 0.8], 'wide');
  const sources = place(
    row(
      [
        note('Trusted record', { size: 36 }),
        label('run R42', { color: 'cyan' }),
        label('citation_precision', { color: 'cyan' }),
      ],
      { gap: 'wide' },
    ),
    caseBand,
  );
  const resolution = { ...candidates[3], action: 'Mark the issue resolved' };
  const rows = [...candidates, resolution].map((item, i) => ({
    id: 'A' + i,
    action: item.action,
    ids: item.evidence.length ? item.evidence.join(' + ') : 'none',
    score: verifierScore(item),
  }));
  const ledger = place(
    table(
      [
        { key: 'action', label: 'Proposed action', sample: candidates[3].action },
        { key: 'ids', label: 'Cited IDs', sample: rows[3].ids },
        { key: 'score', label: 'Score', sample: '−1' },
      ],
      [],
      { width: main.width, size: 35, leading: 1.6, maxRows: 5 },
    ),
    main,
  );
  const choose = (options) => options.reduce((best, row) => (row.score > best.score ? row : best));
  const first = choose(rows.slice(0, 2)),
    fourth = choose(rows.slice(0, 4));
  const last = choose(rows),
    reordered = choose([rows[4], ...rows.slice(0, 4)]);
  assertEqual(
    [first.id, fourth.id, last.id, reordered.id],
    ['A0', 'A3', 'A3', 'A4'],
    'first maximum in each ordering',
  );
  const rule = place(
    note('Highest score wins. On a tie, keep the first candidate.', { size: 36 }),
    ruleBand,
  );
  const selection = (key) =>
    place(label('Selected: ' + key.action, { size: 42, color: 'yellow' }), decisionBand);
  const retry = selection(first),
    block = selection(fourth),
    resolved = selection(reordered);
  const question = place(
    label('Which action wins in this order?', { size: 43, color: 'yellow' }),
    decisionBand,
  );
  s.add(heading(c.title), sources, ledger, rule);
  c.on('budget-two', () => s.play(ledger.append(rows.slice(0, 2), { duration: 0.6 })));
  c.show('retry-wins', retry, { after: true });
  c.on('budget-four', () => s.play(ledger.append(rows.slice(2, 4), { duration: 0.7 })));
  c.swap('trace-wins', retry, block, { after: true });
  c.on('extra-candidate', () => s.play(ledger.append(rows[4], { duration: 0.6 })));
  c.hide('new-order', block);
  c.on('new-order', () => s.play(ledger.moveRow('A4', 0, { duration: 1.0 })));
  c.show('predict-order', question);
  c.swap('tie-winner', question, resolved, { after: true });
  c.after('tie-winner', () => s.play(ledger.light('A4', null, { duration: 0.5 })));
}
