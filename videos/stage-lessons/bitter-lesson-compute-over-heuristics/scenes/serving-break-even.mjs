import { place, column, assertEqual } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { workChart, plans, checkWork, lifetimeWork } from '../lifetime-work.mjs';

export default function serving(s, c) {
  const chart = workChart(s);
  const premium = (plans.small.train - plans.large.train) / 1e21;
  const largeAt100 = lifetimeWork(plans.large, 100);
  const smallAt100 = lifetimeWork(plans.small, 100);
  const gap = smallAt100 - largeAt100;
  const saving = plans.savedPerServingToken / 1e9;
  const crossing = plans.breakEven / 1e9;
  const remaining = Math.round((gap * 1e21) / plans.savedPerServingToken / 1e9);
  assertEqual(remaining, crossing - 100, 'traffic needed after 100B tokens');
  assertEqual(crossing, 165, 'equal-volume crossing in billions of processed tokens');
  for (const [q, large, small] of [
    [100, '7.28', '7.80'],
    [crossing, '8.19', '8.19'],
    [200, '8.68', '8.40'],
  ]) {
    checkWork(plans.large, q, large);
    checkWork(plans.small, q, small);
  }
  const advance = (q) => s.play(...chart.large.advance(q, 1.15), ...chart.small.advance(q, 1.15));
  const text = (words) => place(label(words, { size: 43 }), chart.foot);
  const assumption = text('Assume both plans meet the same quality target.');
  const costs = text('Forward work per token ≈ 14B operations for 7B parameters, 6B for 3B');
  const at100 = text(
    'Remaining gap: ' +
      smallAt100.toFixed(2) +
      ' − ' +
      largeAt100.toFixed(2) +
      ' = ' +
      gap.toFixed(2) +
      ' zettaFLOPs',
  );
  const ratio = place(
    column(
      [
        mono(gap.toFixed(2) + ' × 10²¹ FLOPs   ÷   ' + saving + ' × 10⁹ FLOPs/token', {
          size: 40,
        }),
        note('How many more tokens must each model process to close the gap?', {
          size: 37,
          color: 'yellow',
        }),
      ],
      { gap: 'normal' },
    ),
    chart.foot,
  );
  const tie = text('100B + ' + remaining + 'B = ' + crossing + 'B processed tokens per model');
  const fromZero = text(
    'From zero: ' +
      premium.toFixed(2) +
      ' × 10²¹ ÷ (' +
      saving +
      ' × 10⁹) = ' +
      crossing +
      'B tokens per model',
  );
  const high = text('At 200B tokens each, the 3B model uses less estimated work.');

  s.add(heading(c.title), chart.legend, chart.scale, assumption);
  c.show('large-training', chart.large.nodes);
  c.show('small-training', chart.small.nodes);
  c.swap('forward-rates', assumption, costs);
  c.on('first-traffic', () => advance(100));
  c.swap('first-ranking', costs, at100, { after: true });
  c.swap('repayment', at100, ratio);
  c.after('crossing', () => advance(crossing));
  c.swap('crossing', ratio, tie, { after: true, lead: -1.15 });
  c.swap('from-zero', tie, fromZero);
  c.hide('later-traffic', fromZero);
  c.on('later-traffic', () => advance(200));
  c.show('later-ranking', high, { after: true });
}
