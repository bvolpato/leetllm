import { place, table } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { BODY, open, VALIDATION_STATES } from '../parts.mjs';

export default function windowContract(s, c) {
  const [sample, inventory, command, decision, selection] = BODY.rows(
    [1.1, 3.1, 0.9, 1, 1],
    'normal',
  );
  const origin = place(
    label('Canary v1   ·   supplied monitoring windows', { size: 40, color: 'cyan' }),
    sample,
  );
  const call = place(
    mono('evaluate_canary(candidate, offline_id, windows)', { size: 40 }),
    command,
  );
  const t = place(
    table(
      [
        { key: 'record', label: 'Window', sample: 'first-hour' },
        { key: 'day', label: 'Day', mono: true },
        { key: 'count', label: 'Requests', mono: true },
        { key: 'errors', label: 'Errors', mono: true },
        { key: 'p95', label: 'p95', sample: '250 ms', mono: true },
        { key: 'labels', label: 'Labels', sample: 'pending' },
        { key: 'cost', label: 'Cost Δ', sample: 'unknown', mono: true },
      ],
      [
        {
          id: 'first',
          record: 'first-hour',
          day: 0,
          count: 500,
          errors: '0.2%',
          p95: '118 ms',
          labels: 'pending',
          cost: 'unknown',
        },
        {
          id: 'last',
          record: 'day-seven',
          day: 7,
          count: 4200,
          errors: '0.3%',
          p95: '124 ms',
          labels: 'ready',
          cost: '·',
        },
      ],
      { width: inventory.width, size: 38, leading: 2.4, states: VALIDATION_STATES },
    ),
    inventory,
  );
  const state = (words, color) => place(label(words, { size: 39, color }), decision);
  const offline = state('Different offline evaluation   ·   4 / 50 assumed cost units', 'dim');
  const run = state('Start each run with the same accepted offline receipt', 'cyan');
  const ready = state('ready_for_promotion     ·     equality passes', 'green');
  const question = state('Latest labels pending     ·     what happens to the canary?', 'yellow');
  const hold = state('hold_canary     ·     incomplete measurement', 'yellow');
  const invalid = state('New run     ·     both windows supplied', 'cyan');
  const abort = state('abort_canary     ·     invalid_window_metrics', 'red');
  const wrong = state('New run     ·     dictionary supplied for day seven', 'cyan');
  const reject = state('ValueError     ·     no receipt written', 'red');
  const active = place(
    mono('production  v0       canary  v1', { size: 38, color: 'blue' }),
    selection,
  );
  const removed = place(
    mono('production  v0       canary  closed', { size: 38, color: 'blue' }),
    selection,
  );
  const scope = place(note('Observed cost limits apply to each valid mature window'), selection);
  const audit = place(
    table(
      [
        { key: 'id', label: 'Monitor evidence' },
        { key: 'meaning', label: 'What to verify' },
      ],
      [
        { id: 'request', meaning: 'Request ID, served release and prediction time' },
        { id: 'outcome', meaning: 'Label availability and coverage on this cohort' },
        { id: 'history', meaning: 'Complete history for this rollout' },
      ],
      { width: inventory.width, size: 37, leading: 1.75, states: VALIDATION_STATES },
    ),
    inventory,
  );
  const population = state('Coverage, sample size, freshness and uncertainty', 'pink');
  const omitted = state('A missing earlier window has unknown quality', 'yellow');
  open(s, c);
  s.add(origin, t);
  c.on('contract-record', () => s.play(t.light('last')));
  c.on('contract-delta', () => s.play(t.setCell('last', 'cost', '−8%'), t.light('last', 'cost')));
  c.show('contract-offline', offline);
  c.swap('contract-start', offline, [run, call, active]);
  c.on('contract-days', () => s.play(t.light(null, 'day')));
  c.on('contract-count', () => s.play(t.light(null, 'count')));
  c.hide('contract-limits', run);
  c.on('contract-limits', () =>
    s.play(t.setCell('last', 'errors', '1%'), t.setCell('last', 'p95', '250 ms'), t.light('last')),
  );
  c.on('contract-zero', () => s.play(t.setCell('last', 'cost', '0%'), t.light('last', 'cost')));
  c.show('contract-ready', ready);
  c.swap('contract-pending', ready, question);
  c.on('contract-pending', () =>
    s.play(
      t.setCell('last', 'labels', 'pending'),
      t.setCell('last', 'cost', 'unknown'),
      t.light('last', 'labels'),
    ),
  );
  c.swap('contract-hold', question, hold);
  c.swap('contract-invalid', hold, invalid);
  c.on('contract-invalid', () =>
    s.play(
      t.setCell('last', 'labels', 'ready'),
      t.setCell('last', 'cost', '0%'),
      t.setCell('last', 'p95', 'NaN'),
      t.light('last', 'p95'),
    ),
  );
  c.swap('contract-abort', [invalid, active], [abort, removed]);
  c.swap('contract-type', [abort, removed], [wrong, active]);
  c.on('contract-type', () =>
    s.play(
      t.setCell('last', 'p95', '250 ms'),
      t.setCell('last', 'record', 'dict'),
      t.light('last', 'record'),
    ),
  );
  c.swap('contract-reject', wrong, reject);
  c.swap('contract-audit', [t, call, reject, active, origin], [audit, population, scope]);
  c.after('contract-audit', () => s.play(audit.light('request')));
  c.swap('contract-omitted', population, omitted);
  c.on('contract-omitted', () => s.play(audit.light('history')));
}
