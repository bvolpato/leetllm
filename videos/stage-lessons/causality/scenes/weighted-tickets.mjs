import {
  ARM,
  COLORS,
  STATE,
  captions,
  frame,
  ledger,
  nfmt,
  pct,
  reportRate,
  scales,
} from '../parts.mjs';
import { weightedTicketFixture } from '../../../films/causality/model.mjs';

export default function weightedTickets(s, c) {
  frame(
    s,
    'Attach weight to each logged ticket',
    'Easy tickets on the left, difficult on the right',
    'Weighted totals by workflow',
  );
  const model = weightedTicketFixture(),
    log = ledger(s, { ...STATE.strata, total: [0.5, 0.5] });
  const bars = scales(
    s,
    ARM.map((name, i) => ({
      name,
      color: COLORS[i],
      max: model[i].mass,
      value: model[i].observed,
    })),
  );
  s.add(
    log.nodes,
    bars.flatMap((b) => b.nodes),
  );
  const a = model[0],
    rare = a.groups[0],
    common = a.groups[1];
  c.after('rare', () =>
    log.move({
      easy: [rare.mass / (rare.mass + common.count), STATE.strata.easy[1]],
      total: [(rare.mass + common.count) / a.mass, 0.5],
    }),
  );
  c.after('common', () => log.move({ easy: [0.5, STATE.strata.easy[1]], total: [1, 0.5] }));
  c.after('control', () => log.move({ easy: [0.5, 0.5], total: [1, 1] }));
  bars.forEach((b, i) => {
    const arm = model[i];
    reportRate(s, c, 'mass', b, arm.mass, nfmt(arm.mass) + ' weight');
    reportRate(s, c, 'success', b, arm.successMass, nfmt(arm.successMass) + ' resolved');
    reportRate(s, c, 'means', b, arm.successMass,
      nfmt(arm.successMass) + ' / ' + nfmt(arm.mass) + ' = ' + pct(arm.rate));
  });
  captions(
    s,
    c,
    'Every mark starts with the same area. Each arm has one hundred observed tickets.',
    [
      [
        'propensity',
        'Assistant assignment probabilities are 0.1 for easy tickets and 0.9 for difficult tickets.',
        true,
      ],
      [
        'rare',
        nfmt(rare.count) +
          ' easy assistant tickets × ' +
          nfmt(rare.weight) +
          ' = ' +
          nfmt(rare.mass) +
          ' weight.',
        true,
      ],
      [
        'common',
        nfmt(common.count) +
          ' difficult assistant tickets × 10/9 = ' +
          nfmt(common.mass) +
          ' weight.',
        true,
      ],
      [
        'control',
        'Control weights are reversed: ninety easy tickets at 10/9 and ten hard tickets at 10.',
        true,
      ],
      [
        'means',
        'Divide each arm’s weighted successes by its total weight at the log’s 50/50 mix.',
        true,
      ],
    ],
  );
}
