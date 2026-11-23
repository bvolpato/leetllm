import { assertEqual, column, linear, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { modelMix, riskDesk } from '../desk.mjs';
import { evidenceValue, indifferenceProbability, reviewValue, returns } from '../parts.mjs';

export default function uncertain(s, c) {
  const b = riskDesk(s, { initial: 0, min: 27, max: 63, ticks: [30, 40, 50, 60] });
  const key = place(note('Each mark is 1% of the possible outcomes.'), b.foot);
  const payoff = (lines) => place(column(lines, { gap: 'normal' }), b.arithmetic);
  const success = mono('Verified reply  ' + returns.evidence, { size: 44, color: 'green' });
  const successOnly = payoff([success]);
  const costs = payoff([
    mono('Verified reply  ' + returns.evidence, { color: 'green' }),
    mono('Leave  −4 − 50', { color: 'pink' }),
  ]);
  const outcomes = payoff([
    mono('Verified reply  ' + returns.evidence, { color: 'green' }),
    mono('Leave  −54', { color: 'pink' }),
  ]);
  const mix = payoff([mono(modelMix(25), { size: 41 }), note('Expected return for asking')]);
  const choose = place(label('Ask for proof or send to review?', { color: 'yellow' }), b.foot);
  const verdict = place(label('Send to review  ·  54 points', { color: 'blue' }), b.foot);
  const swing = payoff([
    mono('Reply  +59     Leave  −54', { size: 39 }),
    note('Difference per changed outcome'),
  ]);
  const gain = place(
    mono('One fewer abandonment per hundred adds 1.13 points to the mean.'),
    b.foot,
  );
  const headStart = payoff([
    mono('Ask  59      Review  54'),
    note('5-point lead when everyone replies'),
  ]);
  const law = payoff([
    mono('Ask = 59 − 113 × p', { size: 51, color: 'green' }),
    note('p is the fraction who leave.'),
  ]);
  const tie = place(mono('Tie at p = 5 / 113 ≈ 4.42%', { color: 'yellow' }), b.foot);
  const sides = place(label('Below the tie, ask for proof. Above it, send to review.'), b.foot);
  assertEqual(evidenceValue(1), -54, 'unresolved closure on the opening transition');
  assertEqual(evidenceValue(0.25), 30.75, '25 percent leave');
  assertEqual(
    Number(evidenceValue(indifferenceProbability).toFixed(8)),
    reviewValue,
    'break-even return',
  );

  s.add(heading(c.title), b.nodes, successOnly);
  c.show('certain', key);
  c.show('review-line', b.fixed, { after: true });
  c.after('quarter', () => s.play(b.p.to(25, { duration: 1.1 })));
  c.swap('costs', successOnly, costs);
  c.swap('abandoned', costs, outcomes, { after: true });
  c.swap('weigh', outcomes, mix);
  c.swap('predict', key, choose);
  c.show('mean', b.marker, { after: true });
  c.swap('winner', choose, verdict, { after: true });
  c.swap('sweep', mix, swing);
  c.hide('sweep', verdict);
  c.on('sweep', () => {
    const duration = c.cue('gain').start - c.cue('sweep').start;
    s.play(b.p.to(0, { duration, ease: linear }));
  });
  c.show('gain', gain, { after: true });
  c.swap('lead', swing, headStart, { after: true });
  c.swap('equation', headStart, law);
  c.after('tie', () => s.play(b.p.to(indifferenceProbability * 100, { duration: 0.85 })));
  c.swap('tie', gain, tie, { after: true });
  c.swap('regions', tie, sides, { after: true });
}
