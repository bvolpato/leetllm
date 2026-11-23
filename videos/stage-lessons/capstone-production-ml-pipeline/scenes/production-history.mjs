import { place, table } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import { VALIDATION_STATES, BODY, open } from '../parts.mjs';
export default function productionHistory(s, c) {
  const [top, ledgerRoom, pointersRoom] = BODY.rows([1, 4, 3], 'wide');
  const heading = place(
    label('Monitor history for the selected release v1', { color: 'cyan' }),
    top,
  );
  const ledger = place(
    table(
      [
        { key: 'day', label: 'day', mono: true },
        { key: 'record', label: 'input record' },
        { key: 'metrics', label: 'metrics', sample: 'missing quality' },
        { key: 'decision', label: 'receipt', sample: 'keep production', marks: true },
      ],
      [
        {
          id: 'missing',
          day: '—',
          record: 'accepted window',
          metrics: 'missing quality',
          decision: '?',
        },
        { id: 'valid', day: 9, record: 'accepted window', metrics: 'valid', decision: '?' },
        {
          id: 'invalid',
          day: 10,
          record: 'accepted window',
          metrics: 'invalid fields',
          decision: '?',
        },
        { id: 'older', day: 8, record: 'late arrival', metrics: 'valid but older', decision: '?' },
        {
          id: 'type',
          day: '—',
          record: 'wrong record type',
          metrics: 'not evaluated',
          decision: '?',
        },
      ],
      { states: VALIDATION_STATES, width: ledgerRoom.width, size: 34, leading: 1.5 },
    ),
    ledgerRoom,
  );
  const pointers = place(
    table(
      [
        { key: 'pointer', label: 'retained state' },
        { key: 'value', label: 'current value', sample: 'day 10 • hold' },
      ],
      [
        { id: 'release', pointer: 'production release', value: 'v1' },
        { id: 'valid', pointer: 'latest valid observation', value: 'pending' },
        { id: 'receipt', pointer: 'latest receipt', value: 'pending' },
      ],
      { states: VALIDATION_STATES, width: pointersRoom.width, size: 34, leading: 1.7 },
    ),
    pointersRoom,
  );
  open(s, c);
  s.add(heading, ledger, pointers);
  c.after('production-history-b1', () =>
    s.play(
      ledger.setCell('missing', 'decision', { value: 'hold monitor', state: 'warn' }),
      ledger.light('missing'),
    ),
  );
  c.on('production-breach', () => s.play(ledger.light(null, 'metrics')));
  c.after('production-types', () =>
    s.play(
      ledger.setCell('type', 'decision', { value: 'no receipt', state: 'fail' }),
      ledger.light('type'),
    ),
  );
  c.on('production-history-b2', () => s.play(pointers.light('valid')));
  c.on('production-healthy', () =>
    s.play(ledger.setCell('valid', 'metrics', 'cost Δ −1%'), ledger.light('valid')),
  );
  c.on('production-keep', () =>
    s.play(
      ledger.setCell('valid', 'decision', { value: 'keep production', state: 'pass' }),
      pointers.setCell('valid', 'value', 'day 9'),
      pointers.setCell('receipt', 'value', 'day 9'),
    ),
  );
  c.on('production-history-malformed', () => s.play(ledger.light('invalid')));
  c.after('pipe-result-malformed-observation-hold', () =>
    s.play(
      ledger.setCell('invalid', 'decision', { value: 'hold monitor', state: 'warn' }),
      pointers.setCell('receipt', 'value', 'day 10 • hold'),
      pointers.light('receipt'),
    ),
  );
  c.on('production-history-older', () => s.play(ledger.light('older')));
  c.after('pipe-result-older-observation-hold', () =>
    s.play(
      ledger.setCell('older', 'decision', { value: 'hold rollback', state: 'warn' }),
      pointers.light('valid'),
    ),
  );
  c.on('production-history-b3', () => s.play(pointers.light('receipt')));
  c.on('production-recheck', () => s.play(pointers.light('release')));
  c.on('production-attempt', () => s.play(ledger.light(null, 'day')));
}
