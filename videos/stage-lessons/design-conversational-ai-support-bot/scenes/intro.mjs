import {
  assertEqual,
  dot,
  draw,
  fadeIn,
  group,
  line,
  linear,
  place,
  polygon,
  rect,
  to,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { caseSlip, money, original } from '../parts.mjs';
import { decide } from '../../../films/design-conversational-ai-support-bot/model.mjs';

function chargeSlip(width, height) {
  const half = width / 2;
  const bottom = height / 2;
  const teeth = Array.from({ length: 41 }, (_, i) => [
    half - (width * i) / 40,
    bottom - (i % 2) * 10,
  ]);
  return group(
    polygon([[-half, -bottom], [half, -bottom], ...teeth], { fill: 'ink', stroke: null }),
    label('GPU usage', { size: 48, color: 'bg' }).at(-width * 0.25, 0),
    line([0, -bottom + 16], [0, bottom - 24], { stroke: 'dim', width: 2, dash: [7, 7] }),
    mono(money(original.amount), { size: 62, color: 'bg' }).at(width * 0.24, 0),
  );
}

export default function intro(s, c) {
  const [desk, outcome] = area.rows([3.3, 1], 'loose');
  const [left, right] = desk.columns(2, 'wide');
  const invoice = caseSlip(left, 'BILLING · OWNED INVOICE', original.invoice, 'blue');
  const policy = caseSlip(right, 'PUBLISHED US POLICY', original.policy, 'green');
  const [item, amount, verified] = invoice.body.rows([1, 2, 1], 'normal');
  const [window, boundary, scaleArea, legend] = policy.body.rows([1, 1, 1, 0.9], 'tight');
  const [decision, status] = outcome.rows(2, 'tight');
  const threshold = 50000;
  const x = (cents) => scaleArea.left + (cents / (threshold * 2)) * scaleArea.width;
  const rule = line(scaleArea.point('left'), scaleArea.point('right'), { stroke: 'dim', width: 4 });
  const limit = line([x(threshold), scaleArea.cy - 20], [x(threshold), scaleArea.cy + 20], {
    stroke: 'yellow',
    width: 5,
  });
  const pin = dot(12, 'blue').moveTo([x(0), scaleArea.cy]);
  const receiptHeight = left.height * 0.31;
  const rows = left.inset('wide').rows(2, 'normal');
  const charges = rows.map((row) => chargeSlip(row.width, receiptHeight).at(row.cx, row.cy));
  const [first, second] = charges;
  second.at(rows[1].cx, rows[0].cy + receiptHeight * 0.8);

  const bubbleHeight = right.height * 0.48;
  const bubbleWidth = right.width - 64;
  const bubbleLeft = -bubbleWidth / 2;
  const request = group(
    polygon(
      [
        [bubbleLeft + 8, 12],
        [bubbleLeft - 28, 43],
        [bubbleLeft + 8, 42],
      ],
      {
        fill: 'cyan',
        stroke: null,
      },
    ),
    rect(bubbleWidth, bubbleHeight, { fill: 'surface', stroke: 'cyan', width: 4, radius: 28 }),
    note(original.customer, { size: 37, color: 'cyan' }).at(0, -bubbleHeight * 0.29),
    label('“Can you credit', { size: 57 }).at(0, -1),
    label('the second one?”', { size: 57 }).at(0, 72),
  ).at(right.cx, right.cy);
  const question = place(
    label('Queue the credit or send it for review?', { size: 48, color: 'yellow' }),
    decision,
  );
  const verdict = decide(original);
  assertEqual(verdict.outcome, 'HANDOFF', 'The original charge goes to a specialist.');
  const disposition = place(
    label('Specialist review required', { size: 54, color: 'pink' }),
    decision,
  );
  const reply = place(
    label('“Your invoice shows a duplicate. A billing specialist needs to review it.”', {
      size: 34,
    }),
    status,
  );

  const opening = [heading(c.title), second, first, request];
  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(to(second, (n) => n.at(rows[1].cx, rows[1].cy), { duration: 0.85, ease: linear }));
  c.swap('invoice-read', charges, [
    ...invoice.paper,
    place(note(original.customer + '  /  GPU usage'), item, 'left'),
  ]);
  c.show('verified-duplicate', [
    place(mono(money(original.amount), { size: 88, color: 'blue' }), amount, 'left'),
    place(
      label('Verified duplicate  ·  ' + original.age + ' days old', { size: 38 }),
      verified,
      'left',
    ),
  ]);
  c.swap('policy-window', request, [
    ...policy.paper,
    place(label('Credit window     30 days', { size: 40 }), window, 'left'),
  ]);
  c.show('review-limit', [
    place(label('Review begins at $500', { size: 40, color: 'yellow' }), boundary, 'left'),
    draw(rule, { duration: 0.45 }),
    limit,
    mono('$500', { size: 31, color: 'yellow' }).moveTo([x(threshold), legend.cy]),
    mono('$900', { size: 31, color: 'blue' }).moveTo([x(original.amount), legend.cy]),
    pin,
  ]);
  c.on('review-limit', () =>
    s.play(to(pin, (n) => n.moveTo([x(original.amount), scaleArea.cy]), { duration: 0.95 })),
  );
  c.show('choose-route', question);
  c.swap('review-answer', question, disposition, { after: true });
  c.show('customer-reply', reply);
}
