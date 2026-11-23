import { arrow, boxOf, dot, fitted, indicate, place, table, to } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { MAIN, FOOT, money, open, original } from '../parts.mjs';
import {
  mergeObservation,
  sampleModel,
} from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function state(s, c) {
  const board = open(s, c, 'channels-and-fences');
  const [records, travel, statusArea] = MAIN.rows([4, 1, 1], 'wide');
  const changed = sampleModel('state', { beat: 1 }).current;
  const stale = sampleModel('state', { beat: 1 });
  const fresh = sampleModel('state', { beat: 2 });
  const comparison = place(
    fitted(records, (width) =>
      table(
        [
          { key: 'field', label: 'field' },
          { key: 'current', label: 'case state', sample: 'A10236', marks: true },
          { key: 'worker', label: 'worker receipt', sample: 'A10236', marks: true },
        ],
        [
          {
            id: 'customer',
            field: 'customer',
            current: original.customer,
            worker: original.customer,
          },
          { id: 'invoice', field: 'invoice', current: original.invoice, worker: original.invoice },
          {
            id: 'revision',
            field: 'revision',
            current: 'R' + original.revision,
            worker: 'R' + original.revision,
          },
          {
            id: 'amount',
            field: 'integer cents',
            current: original.amount,
            worker: original.amount,
          },
          { id: 'success', field: 'successful read', current: 'required', worker: 'yes' },
        ],
        { width, size: 34 },
      ),
    ),
    records,
  );
  const memory = place(
    fitted(records, (width) =>
      table(
        ['store', 'content', 'authority'],
        [
          {
            id: 'dialogue',
            store: 'dialogue summary',
            content: '$90.00',
            authority: { value: 'lossy', state: 'warn' },
          },
          {
            id: 'state',
            store: 'validated state',
            content: money(original.amount),
            authority: { value: 'invoice verified', state: 'pass' },
          },
          {
            id: 'history',
            store: 'retrievable history',
            content: 'prior messages',
            authority: 'context',
          },
        ],
        { width, size: 32 },
      ),
    ),
    records,
  );
  const [left, middle, right] = travel.columns([2, 1, 1], 'loose');
  const rail = arrow(left.point('left'), right.point('right'), { stroke: 'grid', pad: 10 });
  const receipt = dot(16, 'blue').moveTo(left.point('left'));
  const gate = place(
    namedBox('merge check', { width: middle.width, height: 90, color: 'yellow' }),
    middle,
  );
  const denied = place(label('REJECT: stale invoice + revision', { color: 'red' }), statusArea);
  const accepted = place(
    label('ACCEPT: matching successful receipt', { color: 'green' }),
    statusArea,
  );
  const trusted = place(label('Action gate reads $900.00', { color: 'yellow' }), statusArea);
  const snapshot = place(
    note(
      'Separate example · original invoice ' +
        original.invoice +
        ' / R' +
        original.revision +
        ' / ' +
        money(original.amount),
      { color: 'blue' },
    ),
    FOOT,
  );
  const extraction = place(
    fitted(records, (width) =>
      table(
        [
          { key: 'check' },
          { key: 'invoice', label: 'invoice evidence' },
          { key: 'extracted', label: 'extracted amount', sample: 'wrong amount', marks: true },
        ],
        [
          {
            id: 'amount',
            check: 'integer cents',
            invoice: original.amount,
            extracted: original.amount / 10,
          },
          {
            id: 'shape',
            check: 'positive integer',
            invoice: original.amount + ' cents',
            extracted: { value: 'waiting', state: 'pending' },
          },
          {
            id: 'truth',
            check: 'matches invoice',
            invoice: money(original.amount),
            extracted: { value: 'waiting', state: 'pending' },
          },
        ],
        { width, size: 34 },
      ),
    ),
    records,
  );
  const foot = place(note('Read workers return observations. The supervisor updates state.'), FOOT);
  s.add(comparison, rail, gate, foot);
  c.on('typed-invoice', () => s.play(comparison.light('amount')));
  c.on('invoice-switch', () =>
    s.play(
      board.identity.to(1, { duration: 0.1 }),
      comparison.setCell('invoice', 'current', changed.invoice),
      comparison.setCell('revision', 'current', 'R' + changed.revision),
      comparison.setCell('amount', 'current', changed.amount),
    ),
  );
  c.show('invoice-switch', receipt);
  c.on('invoice-switch', () =>
    s.play(to(receipt, (n) => n.moveTo(middle.point('left')), { duration: 1.4 })),
  );
  c.show('reject-stale', denied, { after: true });
  c.after('reject-stale', () => {
    if (mergeObservation(stale.current, stale.receipt)) throw new Error('A stale receipt passed.');
    s.play(
      comparison.setCell('invoice', 'worker', { state: 'fail' }),
      comparison.setCell('revision', 'worker', { state: 'fail' }),
      to(receipt, (n) => n.moveTo(left.point('left')), { duration: 1 }),
    );
  });
  c.hide('fresh-receipt', denied);
  c.on('fresh-receipt', () =>
    s.play(
      comparison.setCell('invoice', 'worker', { value: fresh.receipt.invoice, state: 'pass' }),
      comparison.setCell('revision', 'worker', {
        value: 'R' + fresh.receipt.revision,
        state: 'pass',
      }),
      comparison.setCell('amount', 'worker', { value: fresh.receipt.amount, state: 'pass' }),
      to(receipt, (n) => n.moveTo(right.point('right')), { duration: 1.3 }),
    ),
  );
  c.show('fresh-receipt', accepted, { after: true });
  c.swap('summary-conflict', comparison, memory);
  c.swap('summary-conflict', foot, snapshot);
  c.hide('summary-conflict', [accepted, receipt]);
  c.on(
    'summary-conflict',
    () => s.play(board.identity.to(0, { duration: 0.1 }), memory.light('dialogue')),
    0.6,
  );
  c.show('trusted-amount', trusted, { after: true });
  c.on('trusted-amount', () => s.play(memory.light('state')));
  c.swap('schema-shape', memory, extraction);
  c.after('schema-shape', () =>
    s.play(extraction.setCell('shape', 'extracted', { value: 'valid shape', state: 'pass' })),
  );
  c.after('verify-invoice', () =>
    s.play(extraction.setCell('truth', 'extracted', { value: 'wrong amount', state: 'fail' })),
  );
  c.clear([rail], 0.46, 0.2);
}
