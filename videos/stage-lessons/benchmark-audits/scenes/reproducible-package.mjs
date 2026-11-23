import { place, column, indicate, to, boxOf } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function packageRecord(s, c) {
  const board = caseBoard();
  const rows = MAIN.rows(6, 'normal');
  const fields = [
    ['case / source', 'Q91 · library rule'],
    ['input / retrieval', 'top 3 · final context retained'],
    ['model / protocol', 'declared snapshot · fixed settings'],
    ['answer / scorer', 'actual output · scorer version'],
    ['attempt evidence', 'failures · timeouts · cost boundary'],
    ['exposure', 'judge tuned on holdout'],
  ];
  const records = fields.map((v, i) => {
    const [name, value] = rows[i].columns([2, 3], 'wide');
    return {
      name: place(label(v[0], { color: 'dim', size: 34 }), name),
      value: place(label(v[1], { size: 34, color: i === 5 ? 'pink' : 'cyan' }), value),
      slot: value,
    };
  });
  const changed = place(
    label('top 5 · model also changed', { color: 'red', size: 34 }),
    records[1].slot,
  );
  const missing = place(note('A manifest cannot recreate missing outputs'), FOOT);
  const repeated = place(
    note('Dated snapshot + run date + controlled repeats + current baseline'),
    FOOT,
  );
  const repaired = place(
    label('Freeze the system · untouched matched comparison', { color: 'yellow', size: 36 }),
    FOOT,
  );
  s.add(
    heading('Bind the report to retained evidence'),
    records.map((r) => r.name),
    records.filter((_, i) => i !== 3 && i !== 5).map((r) => r.value),
  );
  c.take(board.nodes);
  c.on('reproducible-package-phase-0', () =>
    s.play(indicate(records[0].value, { scale: 1, color: 'yellow' })),
  );
  c.show('ba-reproducible-package-outputs', records[3].value);
  c.show('ba-reproducible-package-missing', missing);
  c.swap('reproducible-package-phase-1', missing, repeated);
  c.on('ba-reproducible-package-repeat', () =>
    s.play(indicate(records[2].value, { scale: 1, color: 'yellow' })),
  );
  c.swap('ba-reproducible-package-changed', records[1].value, changed);
  c.show('judge-exposed', records[5].value);
  c.swap('freeze-repair', repeated, repaired, { after: true });
  c.on('ba-reproducible-package-repair', () =>
    s.play(indicate(records[0].value, { scale: 1, color: 'yellow' })),
  );
}
