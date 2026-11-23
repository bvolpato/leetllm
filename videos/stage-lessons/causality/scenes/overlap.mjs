import { STATE, captions, cells, frame, ledger, nfmt, pct, record } from '../parts.mjs';
import { weightedTicketFixture } from '../../../films/causality/model.mjs';

export default function overlap(s, c) {
  frame(
    s,
    'What can a rare ticket represent?',
    'Observed outcomes with inverse weights',
    'Low-risk assistant assignment',
  );
  const w = weightedTicketFixture()[0].groups[0];
  const log = ledger(s, { ...STATE.strata, total: [0.5, 0.5] });
  const empty = log.missing(0, 0, 0.5);
  const [prob, weight, support] = record(s, [
    ['Logged probability', pct(cells[0][0][0].propensity)],
    ['Inverse weight', '1 / e'],
    ['Observed support', w.count + ' tickets', 'cyan'],
  ]);
  s.add(log.nodes);
  c.after('rare', () => log.move({ easy: STATE.weighted.easy, total: [1, 1] }));
  weight(c, 'rare', nfmt(w.weight), true);
  c.on('impossible', () => log.move({ easy: [0.5, 0.5], total: [1, 1], absent: [0] }, 0.18));
  c.show('impossible', empty, { lead: -0.18 });
  prob(c, 'impossible', '0 in this policy');
  weight(c, 'impossible', null);
  support(c, 'impossible', '0 tickets');
  weight(c, 'missing', 'Undefined', true);
  captions(s, c, 'Each mark is one logged ticket. Its area represents its influence.', [
    [
      'rare',
      'Ten observed easy assistant tickets now represent the same mass as ninety difficult ones.',
      true,
    ],
    [
      'impossible',
      'Separate policy: the missing low-risk assistant outcomes have no weight to expand.',
    ],
    ['inspect', 'Inspect assignment support before trusting a weighted estimate.'],
  ]);
}
