import { place, table } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import {
  VALIDATION_STATES,
  BODY,
  FITTED_ROWS,
  HAND_FAIL,
  open,
  pipelineOffline,
} from '../parts.mjs';
export default function offline(s, c) {
  const [top, rows, gatesRoom] = BODY.rows([1, 4, 3], 'wide');
  const name = place(label('Failed hand fixture • retained separately', { color: 'red' }), top);
  const boundary = place(
    label('Boundary cases • required gates need defined evidence', { color: 'yellow' }),
    top,
  );
  const fittedName = place(
    label('Independently fitted v1 • different rows and cost rules', { color: 'green' }),
    top,
  );
  const t = place(
    table(
      [
        { key: 'id', label: 'request', mono: true },
        { key: 'late', label: 'critical late' },
        { key: 'warn', label: 'warned', marks: true, sample: 'missed' },
        { key: 'cost', label: 'cost' },
        { key: 'base', label: 'baseline' },
      ],
      HAND_FAIL.map((r) => ({
        id: r.id,
        late: r.gold ? 'yes' : 'no',
        warn: { value: r.pred ? 'yes' : 'no', state: r.gold && !r.pred ? 'fail' : null },
        cost: r.cost,
        base: r.baseline,
      })),
      { states: VALIDATION_STATES, size: 34, width: rows.width, leading: 1.8 },
    ),
    rows,
  );
  const fail = pipelineOffline(HAND_FAIL),
    pass = pipelineOffline(FITTED_ROWS);
  const g = place(
    table(
      [
        { key: 'gate', label: 'required gate' },
        { key: 'metric', label: 'row-derived metric', sample: 'undefined', mono: true },
        { key: 'decision', label: 'decision', sample: 'HOLD', marks: true },
      ],
      [
        { id: 'recall', gate: 'critical recall ≥ 0.90', metric: '?', decision: 'pending' },
        { id: 'cost', gate: 'cost change ≤ 0', metric: '?', decision: 'pending' },
        { id: 'overlap', gate: 'shared entity IDs', metric: '?', decision: 'pending' },
      ],
      { states: VALIDATION_STATES, size: 34, width: gatesRoom.width, leading: 1.7 },
    ),
    gatesRoom,
  );
  open(s, c);
  s.add(name, t, g);
  c.after('offline-b1-1', () =>
    s.play(
      g.setCell('recall', 'metric', `${fail.hits} / ${fail.positives}`),
      g.setCell('recall', 'decision', { value: 'HOLD', state: 'fail' }),
      g.light('recall'),
    ),
  );
  c.on('offline-b1-2', () =>
    s.play(
      g.setCell('cost', 'metric', `${fail.cost} / ${fail.base} − 1`),
      g.setCell('cost', 'decision', { value: 'PASS', state: 'pass' }),
      g.light('cost'),
    ),
  );
  c.on('offline-b1-3', () => s.play(g.light('recall')));
  c.on('failed-evaluation-receipt', () => s.play(t.light('eval-2')));
  c.hide('offline-row-build', name);
  c.show('offline-row-build', fittedName, { after: true });
  c.after('offline-b2-1', () =>
    s.play(
      g.light(null),
      ...['recall', 'cost'].flatMap((id) => [
        g.setCell(id, 'metric', '?'),
        g.setCell(id, 'decision', { value: 'pending', state: 'pending' }),
      ]),
      ...FITTED_ROWS.flatMap((r) => [
        t.setCell(r.id, 'warn', { value: r.pred ? 'yes' : 'no', state: 'pass' }),
        t.setCell(r.id, 'cost', r.cost),
        t.setCell(r.id, 'base', r.baseline),
      ]),
    ),
  );
  c.after('offline-b2-2', () =>
    s.play(
      g.setCell('recall', 'metric', `${pass.hits} / ${pass.positives}`),
      g.setCell('recall', 'decision', { value: 'PASS', state: 'pass' }),
      g.setCell('cost', 'metric', `${pass.cost} / ${pass.base} − 1`),
      g.setCell('cost', 'decision', { value: 'PASS', state: 'pass' }),
    ),
  );
  c.swap('offline-extension-3', fittedName, boundary);
  c.on('offline-extension-3', () =>
    s.play(g.light('overlap'), g.setCell('overlap', 'metric', 'intersection')),
  );
  c.on('offline-shared', () =>
    s.play(g.setCell('overlap', 'decision', { value: 'HOLD', state: 'fail' })),
  );
  c.on('offline-no-positive', () =>
    s.play(
      t.setCell('eval-1', 'late', 'no'),
      t.setCell('eval-2', 'late', 'no'),
      g.setCell('recall', 'metric', 'undefined'),
      g.setCell('recall', 'decision', { value: 'HOLD', state: 'warn' }),
      g.light('recall'),
    ),
  );
  c.on('offline-zero-base', () =>
    s.play(
      ...FITTED_ROWS.map((r) => t.setCell(r.id, 'base', 0)),
      g.setCell('cost', 'metric', 'undefined'),
      g.setCell('cost', 'decision', { value: 'HOLD', state: 'warn' }),
      g.light('cost'),
    ),
  );
}
