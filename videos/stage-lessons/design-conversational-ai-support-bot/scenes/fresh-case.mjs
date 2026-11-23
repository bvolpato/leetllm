import { assertEqual, dot, dynamic, indicate, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { caseSlip, freshExpectedPayload, hash, money, original, tuple } from '../parts.mjs';
import {
  acknowledgmentMatches,
  decide,
  enqueue,
  packet,
  payload,
} from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function freshCase(s, c) {
  const windowDays = 30;
  const expired = {
    ...original,
    ...freshExpectedPayload,
    owner: 'Maya',
    ticket: 'M240',
    total: freshExpectedPayload.amount,
    age: windowDays + 1,
  };
  expired.confirmed = hash(tuple(expired));
  const current = { ...expired, age: windowDays };
  const unsigned = { ...current, confirmed: null };
  assertEqual(decide(expired).outcome, 'HANDOFF', 'Day 31 exceeds the credit window.');
  assertEqual(
    decide(current).outcome,
    'QUEUE ELIGIBLE',
    'Changing only age to 30 admits the request.',
  );
  assertEqual(
    decide(unsigned).outcome,
    'CONFIRM',
    'The unsigned replay requires exact confirmation.',
  );
  const key = 'credit:' + current.ticket;
  const store = [];
  const first = enqueue(store, key, payload(current));
  const recovered = enqueue(store, key, payload(current));
  assertEqual(first.status, 'INSERTED', 'The signed request opens one pending operation.');
  assertEqual(recovered.status, 'RECOVERED', 'The second call recovers the original record.');
  assertEqual(
    hash(store),
    hash([{ key: 'credit:M240', payload: freshExpectedPayload }]),
    'The full stored effect matches its independent expectation.',
  );
  const alexPacket = packet(original);
  const review = {
    success: true,
    queue: 'specialist',
    packet: hash(alexPacket),
    reference: 'REV-' + original.ticket,
  };
  assertEqual(
    acknowledgmentMatches(alexPacket, review),
    true,
    'Alex has the matching review acknowledgment.',
  );

  const title = heading(c.title);
  const [desk, stage] = area.rows([3.4, 1.6], 'loose');
  const [left, right] = desk.columns(2, 'wide');
  const maya = caseSlip(left, 'MAYA’S REQUEST', current.invoice, 'blue');
  const policy = caseSlip(right, 'PUBLISHED US POLICY', current.policy, 'green');
  const [value, item, consentArea] = maya.body.rows([1.6, 1, 1], 'normal');
  const [limits, labels, ruler] = policy.body.rows([1, 1, 1.6], 'normal');
  const amount = place(mono(money(current.amount), { size: 82 }), value, 'left');
  const owned = place(
    label('Owned invoice  ·  verified GPU duplicate', { size: 36 }),
    item,
    'left',
  );
  const consent = place(
    label('Signed for this exact request', { size: 38, color: 'pink' }),
    consentArea,
    'left',
  );
  const [signatureLabel, signatureLine] = consentArea.columns([1, 1.8], 'normal');
  const noConsent = [
    place(label('Maya’s signature', { size: 35, color: 'dim' }), signatureLabel, 'left'),
    line(signatureLine.point('left'), signatureLine.point('right'), { stroke: 'dim', width: 2 }),
  ];
  const threshold = place(label('Specialist review from $500', { size: 40 }), limits, 'left');
  const limitText = place(label('Through day 30', { size: 36, color: 'yellow' }), labels, 'left');
  const axis = ruler.inset('normal');
  const x = (day) => axis.left + ((day - 27) / 6) * axis.width;
  const y = ruler.cy;
  const ticks = [28, 29, 30, 31, 32].map((day) =>
    mono(String(day), { size: 31, color: day === 30 ? 'yellow' : 'dim' }).moveTo([x(day), y + 43]),
  );
  const windowLine = line([axis.left, y], [x(windowDays), y], { width: 7, stroke: 'green' });
  const beyond = line([x(windowDays), y], [axis.right, y], { width: 4, stroke: 'dim' });
  const cut = line([x(windowDays), y - 18], [x(windowDays), y + 12], {
    width: 4,
    stroke: 'yellow',
  });
  const age = s.value(expired.age);
  const marker = dynamic(() => dot(14, 'blue').moveTo([x(age.value), y]));
  const day = dynamic(() =>
    mono('Day ' + Math.round(age.value), { size: 33, color: 'blue' }).moveTo([
      x(age.value),
      y - 46,
    ]),
  );
  const [result, explanation] = stage.rows(2, 'normal');
  const status = (words, color) => place(label(words, { size: 51, color }), result);
  const question = status('Can the app queue Maya’s request?', 'yellow');
  const refer = status('Send for review: invoice outside the window.', 'pink');
  const passes = status('Day 30 is eligible with her exact confirmation.', 'green');
  const ask = status('Ask Maya to confirm $240 on M240.', 'yellow');
  const eligible = status('Confirmed. Ready for the queue.', 'green');
  const opening = [maya.paper, amount, owned];
  s.add(title, opening, policy.paper, threshold, limitText);
  c.show('maya-rules', [windowLine, beyond, cut, ...ticks]);
  c.show('maya-age', [marker, day]);
  c.show('maya-given-confirmation', consent);
  c.show('maya-predict', question);
  c.swap('maya-expired', question, refer, { after: true });
  c.hide('maya-replay', refer);
  c.on('maya-replay', () => s.play(age.to(current.age, { duration: 0.8 })));
  c.show('maya-eligible', passes, { after: true });
  c.hide('maya-rewind', passes);
  c.swap('maya-rewind', consent, noConsent);
  c.show('maya-confirm', ask, { after: true });
  c.swap('maya-match', noConsent, consent);
  c.swap('maya-match', ask, eligible, { after: true });

  const billing = caseSlip(right, 'CREDIT QUEUE', current.invoice, 'cyan');
  const [moneyRow, keyRow, countRow] = billing.body.rows([1.5, 1, 1], 'normal');
  const pendingAmount = place(
    label(money(first.entry.payload.amount) + '  ·  pending', { size: 58, color: 'cyan' }),
    moneyRow,
    'left',
  );
  const retained = place(mono(recovered.entry.key, { size: 40 }), keyRow, 'left');
  const counts = place(
    label(store.length + ' pending request   ·   0 applied credits', { size: 36 }),
    countRow,
    'left',
  );
  const compared = place(
    note('Independent expected record  =  retained record', { size: 36, color: 'green' }),
    explanation,
  );
  const paymentQuestion = status('Maya asks, “Is the money back?”', 'yellow');
  const answer = status('“Your $240 credit request is pending.”', 'cyan');
  c.swapAll('maya-pending', [...billing.paper, pendingAmount, retained, counts], {
    keep: [title, ...opening.flat(), consent],
  });
  c.on('maya-recover', () => s.play(indicate(retained, { scale: 1, color: 'yellow' })));
  c.show('maya-effects', compared, { after: true });
  c.show('maya-status-question', paymentQuestion);
  c.swap('maya-reply', paymentQuestion, answer, { after: true });

  const alex = caseSlip(left, 'SPECIALIST QUEUE', original.invoice, 'pink');
  const [reviewRow, refRow, zeroRow] = alex.body.rows([1.5, 1, 1], 'normal');
  const alexCounts = place(
    label('0 pending credits   ·   0 applied credits', { size: 36 }),
    zeroRow,
    'left',
  );
  const alexEntry = [
    ...alex.paper,
    place(label('Review queued', { size: 60, color: 'pink' }), reviewRow, 'left'),
    place(mono(review.reference, { size: 40 }), refRow, 'left'),
    alexCounts,
  ];
  const [alexReply, mayaReply] = result.columns(2, 'wide');
  c.swapAll('alex-reference', alexEntry, {
    keep: [title, ...billing.paper, pendingAmount, retained, counts],
  });
  c.show(
    'alex-reference',
    place(
      label('To Alex: “Billing has your case for review.”', { size: 36, color: 'pink' }),
      alexReply,
    ),
    { after: true },
  );
  c.show(
    'maya-reference',
    place(
      label('To Maya: “Your credit request is pending.”', { size: 36, color: 'cyan' }),
      mayaReply,
    ),
  );
  const proofQuestion = place(
    label('Which record would establish payment?', { size: 46, color: 'yellow' }),
    explanation,
  );
  const proof = place(
    label('Billing evidence needed: a posted credit on the invoice.', { size: 44, color: 'blue' }),
    explanation,
  );
  c.show('billing-question', proofQuestion);
  c.swap('billing-proof', proofQuestion, proof, { after: true });
  c.on('applied-counts', () =>
    s.play(...[alexCounts, counts].map((node) => indicate(node, { scale: 1, color: 'yellow' }))),
  );
}
