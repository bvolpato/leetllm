import {
  arrow,
  assertEqual,
  boxOf,
  column,
  dot,
  fitted,
  line,
  place,
  table,
  to,
} from 'vizmatic/stage';
import { label, namedBox, note, tint } from '../../kit-narrated.mjs';
import { MAIN, FOOT, CASE, hash, money, open, original, tuple } from '../parts.mjs';
import {
  acknowledgmentMatches,
  packet,
} from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function handoff(s, c) {
  const console = open(s, c, 'repair-and-status');
  const value = packet(original),
    restricted = packet({ ...original, authenticated: false });
  const receipt = {
    success: true,
    queue: 'specialist',
    packet: hash(value),
    reference: 'REV-' + original.ticket,
  };
  assertEqual(
    acknowledgmentMatches(value, receipt),
    true,
    'The delivery receipt binds the packet.',
  );
  const [packetArea, deliveryArea] = MAIN.columns([3.2, 2], 'loose');
  const captionY = (boxOf(console.title).bottom + MAIN.top) / 2;
  const retainedLabel = note('SERVER-RETAINED STATE', { size: 26, color: 'blue' }).moveTo([
    CASE.cx,
    captionY,
  ]);
  const outputLabel = note('ALLOWED DESTINATION OUTPUT', { color: 'cyan' }).moveTo([
    packetArea.cx,
    captionY,
  ]);
  const boundaryX = (CASE.right + MAIN.left) / 2;
  const accessBoundary = line([boundaryX, MAIN.top], [boundaryX, MAIN.bottom], {
    stroke: 'blue',
    width: 3,
    dash: [10, 8],
  });
  const rows = Object.entries(value).map(([field, val]) => ({
    id: field,
    field,
    value: field === 'amount' ? money(val) : String(val),
  }));
  const record = place(
    fitted(packetArea, (width) =>
      table([{ key: 'field' }, { key: 'value', sample: 'Identity verification required' }], rows, {
        width,
        size: 30,
        leading: 2.1,
      }),
    ),
    packetArea,
  );
  const [queueArea, acknowledgmentArea, customerArea, reviewArea] = deliveryArea.rows(
    [1, 1, 1, 2],
    'wide',
  );
  const queue = place(
    namedBox('specialist queue', { width: queueArea.width, height: 100, color: 'dim' }),
    queueArea,
  );
  const acknowledgment = place(
    namedBox(receipt.reference, {
      width: acknowledgmentArea.width, height: 100, color: 'pink',
      sub: 'Accepted packet  ' + receipt.packet.slice(0, 8),
    }),
    acknowledgmentArea,
  );
  const customer = place(
    column(
      [label('Specialist review queued.', { size: 32, color: 'cyan' }), note(receipt.reference)],
      { gap: 'tight' },
    ),
    customerArea,
  );
  const review = place(
    fitted(reviewArea, (width) =>
      table(
        [{ key: 'review' }, { key: 'authority', sample: 'recheck live', marks: true }],
        [
          { id: 'task', review: 'task state', authority: { value: 'waiting', state: 'pending' } },
          {
            id: 'approval',
            review: 'exact approval',
            authority: { value: 'required', state: 'pending' },
          },
          {
            id: 'resume',
            review: 'resume',
            authority: { value: 'recheck live', state: 'pending' },
          },
        ],
        { width, size: 28 },
      ),
    ),
    reviewArea,
  );
  const binding = { ...tuple(original), intent: original.intent };
  const exact = place(
    fitted(packetArea, (width) =>
      table(
        [
          { key: 'field' },
          { key: 'action', sample: 'duplicate-credit' },
          { key: 'approval', sample: 'duplicate-credit', marks: true },
        ],
        Object.entries(binding).map(([key, val]) => ({
          id: key,
          field: key === 'intent' ? 'request type' : key,
          action: key === 'amount' ? money(val) : String(val),
          approval: { value: key === 'amount' ? money(val) : String(val), state: 'pending' },
        })),
        { width, size: 30, leading: 2.2 },
      ),
    ),
    packetArea,
  );
  const authorities = place(
    fitted(deliveryArea, (width) =>
      table(
        [{ key: 'check' }, { key: 'current', sample: 'authenticated', marks: true }],
        [
          'service',
          'reviewer',
          'expiry',
          'one-time',
          'ownership',
          'evidence',
          'balance',
          'policy',
          'task',
        ].map((key) => ({
          id: key,
          check: key,
          current: { value: key === 'task' ? 'waiting' : 'required', state: 'pending' },
        })),
        { width, size: 28, leading: 2.0 },
      ),
    ),
    deliveryArea,
  );
  const outboundLane = arrow([packetArea.right, queueArea.cy], [queueArea.left, queueArea.cy], {
    stroke: 'cyan',
  });
  const receiptLane = arrow(
    [acknowledgmentArea.left, acknowledgmentArea.cy],
    [packetArea.right, acknowledgmentArea.cy],
    { stroke: 'pink' },
  );
  const outgoing = dot(16, 'cyan').moveTo([packetArea.right, queueArea.cy]);
  const returning = dot(16, 'pink').moveTo([acknowledgmentArea.left, acknowledgmentArea.cy]);
  const foot = place(
    note('Outgoing packet fingerprint   ' + hash(value).slice(0, 8), { color: 'blue' }),
    FOOT,
  );
  const unknown = place(
    note('Submission timeout: effect unknown until the original operation is reconciled.', {
      color: 'red',
    }),
    FOOT,
  );
  const restrictedDone = place(
    note('Restricted packet complete · identity verification is the next step.', { color: 'pink' }),
    FOOT,
  );
  const authenticatedBranch = place(
    note('Authenticated branch · Alex · A10234 · original $900 action', { color: 'blue' }),
    FOOT,
  );
  s.add(
    record,
    queue,
    review,
    foot,
    outboundLane,
    receiptLane,
    retainedLabel,
    outputLabel,
    accessBoundary,
  );
  c.on('prepare-packet', () => s.play(record.light('reason')));
  c.show('send-packet', outgoing);
  c.on('send-packet', () =>
    s.play(to(outgoing, (n) => n.moveTo([queueArea.left, queueArea.cy]), { duration: 1 })),
  );
  c.show('matching-ack', acknowledgment, { after: true });
  c.show('matching-ack', returning, { after: true });
  c.after('matching-ack', () =>
    s.play(
      tint(queue, 'pink'),
      to(returning, (n) => n.moveTo([packetArea.right, acknowledgmentArea.cy]), { duration: 0.8 }),
    ),
  );
  c.show('review-queued', customer, { after: true });
  c.hide('restrict-output', [acknowledgment, customer, outgoing, returning, foot]);
  c.hide('restrict-output', [outboundLane, receiptLane]);
  c.on('restrict-output', () => {
    const removed = Object.keys(value).filter((key) => !(key in restricted));
    s.play(
      record.remove(removed, { duration: 1 }),
      record.setCell('reason', 'value', restricted.reason),
    );
  });
  c.show('restricted-complete', restrictedDone, { after: true });
  c.swapAll('return-authenticated', [exact, authorities, authenticatedBranch], {
    keep: [console.title, ...console.nodes],
  });
  c.after('return-authenticated', () =>
    s.play(authorities.setCell('service', 'current', { value: 'authenticated', state: 'pass' })),
  );
  c.on('approval-scope', () => s.play(exact.light(null, 'approval')));
  c.after('approval-permissions', () =>
    s.play(
      ...Object.keys(binding).map((key) => exact.setCell(key, 'approval', { state: 'pass' })),
      authorities.setCell('reviewer', 'current', { value: 'permitted', state: 'pass' }),
      authorities.setCell('expiry', 'current', { value: 'current', state: 'pass' }),
      authorities.setCell('one-time', 'current', { value: 'unused', state: 'pass' }),
    ),
  );
  c.after('resume-current', () => {
    s.play(
      ...['ownership', 'evidence', 'balance', 'policy'].map((key) =>
        authorities.setCell(key, 'current', {
          value: key === 'policy' ? original.policy : 'current',
          state: 'pass',
        }),
      ),
    );
    s.play(authorities.setCell('task', 'current', { value: 'accepted', state: 'pass' }));
  });
  c.swap('unknown-effect', authenticatedBranch, unknown);
  c.on('unknown-effect', () =>
    s.play(authorities.setCell('task', 'current', { value: 'unknown', state: 'warn' })),
  );
}
