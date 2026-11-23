import { createHash } from 'node:crypto';
import { arrow, dynamic, place, table } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import { VALIDATION_STATES, BODY, FITTED_ROWS, open, RETAINED_RELEASES } from '../parts.mjs';
export default function boundEvidence(s, c) {
  const fingerprint = (rows) =>
    createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 8);
  const original = fingerprint(FITTED_ROWS);
  const replacedRows = FITTED_ROWS.map((r) => (r.id === 'eval-2' ? { ...r, cost: r.cost + 1 } : r));
  const replaced = fingerprint(replacedRows);
  const [main, foot] = BODY.rows([6, 1], 'wide');
  const [objects, links, receiptRoom] = main.columns([4, 1, 3], 'wide');
  const values = place(
    table(
      [
        { key: 'part', label: 'registered values' },
        { key: 'binding', label: 'fingerprint', sample: 'canonical JSON' },
      ],
      [
        { id: 'rows', part: 'eval-2 cost: ' + FITTED_ROWS[1].cost, binding: original },
        { id: 'model', part: 'artifact bytes', binding: RETAINED_RELEASES.v1.sha256.slice(0, 10) },
        { id: 'release', part: 'release v1 / previous v0', binding: 'release digest' },
        { id: 'policy', part: 'promotion policy P1', binding: 'policy digest' },
      ],
      { states: VALIDATION_STATES, size: 34, width: objects.width, leading: 2.3 },
    ),
    objects,
  );
  const r = place(
    table(
      [
        { key: 'part', label: 'evidence receipt' },
        { key: 'status', label: 'binding', sample: 'consistent', marks: true },
      ],
      [
        { id: 'rows', part: 'rows ' + original, status: 'pending' },
        { id: 'model', part: 'artifact', status: 'pending' },
        { id: 'release', part: 'release', status: 'pending' },
        { id: 'policy', part: 'policy', status: 'pending' },
      ],
      { states: VALIDATION_STATES, size: 34, width: receiptRoom.width, leading: 2.3 },
    ),
    receiptRoom,
  );
  const joined = s.value(0);
  const corrected = s.value(0);
  const routes = dynamic(() =>
    ['rows', 'model', 'release', 'policy'].map((id, i) =>
      arrow(values.region(id).point('right'), r.region(id).point('left'), {
        stroke: i === 0 && corrected.value ? 'red' : joined.value > i ? 'pink' : 'grid',
        width: 4,
        pad: 15,
      }),
    ),
  );
  const status = place(label('Registration leaves production on v0', { color: 'blue' }), foot);
  const saved = place(label('Delivery two · compare current cost with the saved receipt'), foot);
  const hold = place(
    label('Hold release · evaluate the corrected rows', { color: 'yellow' }),
    foot,
  );
  const writer = place(
    note('Protect the original receipt · trusted evaluator issues the next one'),
    foot,
  );
  open(s, c);
  s.add(values, r, routes, status);
  c.on('bound-evidence-b1', () => s.play(values.light('model')));
  c.on('bound-evidence-overlap', () => s.play(values.light('rows')));
  c.after('evidence-metrics', () =>
    s.play(r.setCell('rows', 'status', { value: 'derived', state: 'pass' }), joined.to(1)),
  );
  c.on('bound-evidence-b2', () =>
    s.play(
      joined.to(4, { duration: 1.5 }),
      ...['model', 'release', 'policy'].map((id) =>
        r.setCell(id, 'status', { value: 'bound', state: 'pass' }),
      ),
    ),
  );
  c.on('evidence-open', () => s.play(r.light('release')));
  c.on('evidence-missing', () =>
    s.play(r.setCell('rows', 'status', { value: 'HOLD', state: 'warn' }), r.light('rows')),
  );
  c.swap('bound-evidence-b3', status, saved);
  c.on('bound-evidence-b3', () =>
    s.play(
      r.setCell('rows', 'part', 'Cost ' + FITTED_ROWS[1].cost + ' · ' + original),
      r.setCell('rows', 'status', { value: 'matches', state: 'pass' }),
      r.light('rows'),
      values.light('rows'),
    ),
  );
  c.after('evidence-replace', () =>
    s.play(
      corrected.to(1, { duration: 0.1 }),
      values.setCell('rows', 'part', 'eval-2 cost: ' + replacedRows[1].cost),
      values.setCell('rows', 'binding', replaced),
      r.setCell('rows', 'status', { value: 'mismatch', state: 'fail' }),
    ),
  );
  c.swap('evidence-hold', saved, hold, { lead: 0 });
  c.swap('evidence-writer', hold, writer, { lead: 0 });
}
