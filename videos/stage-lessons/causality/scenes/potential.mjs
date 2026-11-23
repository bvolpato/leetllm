import { captions, frame, pairedOutcomes, record, signal, vertex, wire } from '../parts.mjs';
import { responseTypePairing } from '../../../films/causality/model.mjs';

export default function potential(s, c) {
  frame(
    s,
    'Which outcome can we observe?',
    'Paired outcomes under both workflows',
    'Evidence from assignment',
  );
  const unit = vertex('Ticket', 'cause'),
    a = vertex('Assistant', 'a', 'cyan'),
    c0 = vertex('Control', 'y', 'pink', { dash: true });
  const wa = wire(unit, a, 'cyan'),
    wc = wire(unit, c0, 'dim', { dash: [8, 8] });
  const initial = [unit, a, c0, wa, wc];
  const first = responseTypePairing(0),
    second = responseTypePairing(10),
    grid = pairedOutcomes(first);
  const slots = grid.nodes.map((mark) => mark.clone().fill('surface').stroke('dim', 2));
  const [who, pair, observed] = record(s, [
    ['Unit', 'One routed ticket'],
    ['Assistant outcome (left half)', 'Possible', 'cyan'],
    ['Control outcome (right half)', 'Possible', 'pink'],
  ]);
  s.add(initial);
  signal(s, c, 'receive', [wa]);
  pair(c, 'observed', 'Observed');
  observed(c, 'missing', 'Missing');
  c.swap('pop', initial, slots);
  pair(c, 'pop', null);
  observed(c, 'pop', null);
  c.swap('first', slots, grid.nodes, { after: true, lead: 0 });
  who(c, 'pop', 'Hypothetical population');
  pair(c, 'assistant-margin', first.assistantSuccess + ' successes', true);
  observed(c, 'margins', first.controlSuccess + ' successes', true);
  c.after('alternative', () => grid.change(s, second));
  captions(s, c, 'A single assignment reveals one potential outcome.', [
    ['pop', 'Each slot represents one ticket. Its two halves hold the two possible outcomes.'],
    [
      'first',
      'One possible pairing helps ' +
        first.counts.helped +
        ' and harms ' +
        first.counts.harmed +
        '.',
      true,
    ],
    [
      'alternative',
      'Another pairing helps ' +
        second.counts.helped +
        ' and harms ' +
        second.counts.harmed +
        ' with identical margins.',
      true,
    ],
    [
      'experiment',
      'Random assignment can identify the marginal rates while the pairings remain hidden.',
    ],
  ]);
}
