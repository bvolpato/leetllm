import { assertEqual, dynamic, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import {
  MAIN,
  FOOT,
  caseSlip,
  confirmed,
  hash,
  money,
  open,
  original,
  small,
  tuple,
} from '../parts.mjs';
import {
  confirmationFrame,
  decide,
} from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function policy(s, c) {
  open(s, c, 'evidence');
  const changed = confirmationFrame(2, 1).current;
  const atLimit = { ...confirmed, amount: 50000 };
  atLimit.confirmed = hash(tuple(atLimit));
  const requests = [original, small, confirmed, changed, atLimit];
  const expected = ['HANDOFF', 'CONFIRM', 'QUEUE ELIGIBLE', 'CONFIRM', 'HANDOFF'];
  requests.forEach((state, i) =>
    assertEqual(decide(state).outcome, expected[i], 'Disposition for proposal ' + i),
  );
  const [source, desk, decision] = MAIN.rows([0.9, 4.5, 1.2], 'loose');
  const [left, right] = desk.columns(2, 'loose');
  const current = caseSlip(left, 'APP PROPOSAL', 'A10234', 'cyan');
  const saved = caseSlip(right, 'ALEX SIGNED', 'A10234', 'pink');
  const proposal = s.value(0);
  const consent = s.value(0);
  const proposalBody = form(current, () => requests[Math.round(proposal.value)]);
  const consentBody = form(saved, () => (consent.value < 0.5 ? confirmed : atLimit));
  function form(slip, value) {
    const rows = slip.body.rows([1.7, 1, 1, 1], 'tight');
    return [
      dynamic(() =>
        place(mono(money(value().amount), { size: 66, color: 'ink' }), rows[0], 'left'),
      ),
      place(label('Alex  /  GPU usage', { size: 33 }), rows[1], 'left'),
      place(note('Request: duplicate credit', { size: 30 }), rows[2], 'left'),
      place(
        note(original.policy + '  /  case revision ' + original.revision, { size: 30 }),
        rows[3],
        'left',
      ),
    ];
  }
  const absent = place(label('Awaiting Alex’s confirmation', { size: 37, color: 'dim' }), right);
  const rule = place(
    label('Verified duplicate $900   ·   day 9 of 30   ·   review from $500', {
      size: 35,
      color: 'blue',
    }),
    source,
  );
  const verdict = (words, color) => place(label(words, { size: 43, color }), decision);
  const review = verdict('Specialist review required', 'pink');
  const ask = verdict('Ask Alex to confirm the displayed request.', 'yellow');
  const eligible = verdict('Eligible to queue', 'green');
  const question = verdict('Does the signed $35 cover the new amount?', 'yellow');
  const rebind = verdict('Ask Alex to confirm $40.', 'pink');
  const threshold = verdict('At $500, send it for specialist review.', 'pink');
  const partial = place(
    note('Example policy: one partial request per invoice, up to the verified duplicate.'),
    FOOT,
  );
  const full = place(
    note('The reader helper requires the request to equal the whole duplicate.'),
    FOOT,
  );
  s.add(rule, current.paper, proposalBody);
  c.show('specialist-threshold', review, { after: true });
  c.hide('small-proposal', review);
  c.on('small-proposal', () => s.play(proposal.to(1, { duration: 0 })));
  c.show('small-proposal', [absent, partial]);
  c.show('bind-confirmation', ask);
  c.swap('compare-confirmation', absent, [...saved.paper, ...consentBody]);
  c.swap('queue-eligible', ask, eligible, { after: true });
  c.hide('change-proposal', eligible);
  c.on('change-proposal', () => s.play(proposal.to(3, { duration: 0 })));
  c.show('amount-question', question);
  c.swap('new-consent', question, rebind, { after: true });
  c.hide('boundary-input', rebind);
  c.on('boundary-input', () => s.play(proposal.to(4, { duration: 0 })));
  c.swap('boundary-input', [...saved.paper, ...consentBody], absent);
  c.on('boundary-sign', () => s.play(consent.to(1, { duration: 0 })));
  c.swap('boundary-sign', absent, [...saved.paper, ...consentBody], { after: true });
  c.show('inclusive-boundary', threshold, { after: true });
  c.swap('two-amount-contracts', partial, full);
}
