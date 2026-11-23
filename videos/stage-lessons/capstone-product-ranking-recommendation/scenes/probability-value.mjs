import { dot, place, row } from 'vizmatic/stage';
import { chip, label, mono, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';

export default function probabilityValue(s, c) {
  const [top, board, foot] = open(s, c).rows([1, 5, 1], 'wide');
  const [field, ledger] = board.columns([1, 1.3], 'wide');
  const lines = ledger.rows(5, 'normal');
  const impressions = 100;
  const clickProbability = 0.2, purchaseGivenClick = 0.25, price = 80;
  const clicks = impressions * clickProbability;
  const purchases = clicks * purchaseGivenClick;
  const gross = purchases * price;

  const score = place(chip('Pairwise rank score', { color: 'blue' }), top);
  const order = place(label('Which printer comes first?'), board);
  s.add(score);
  c.show('value-score', order);
  const item = place(label('Label printer   ·   $' + price), top);
  const sale = place(label('Impression  →  click  →  purchase'), board);
  c.swap('value-price', [score, order], [item, sale]);
  const formula = mono('P(click) × P(purchase | click) × price', { size: 38 }).moveTo([foot.cx, foot.top]);
  c.show('value-rule', formula);

  const cells = field.rows(10, 0).flatMap(r => r.columns(10, 0));
  const marks = (count, color) => cells.slice(0, count).map(cell => place(dot(13, color), cell));
  const views = marks(impressions, 'dim');
  const clicked = marks(clicks, 'cyan');
  const bought = marks(purchases, 'green');
  const entry = (i, value, color) => place(mono(value, { color, size: 39 }), lines[i], 'left');
  c.swap('value-example', sale, [...views, entry(0, impressions + ' impressions', 'ink')]);
  c.swap('value-clicks', views.slice(0, clicks), [
    ...clicked, entry(1, '× ' + clickProbability + '   →   ' + clicks + ' clicks', 'cyan'),
  ]);
  c.swap('value-purchases', clicked.slice(0, purchases), [
    ...bought, entry(2, '× ' + purchaseGivenClick + '  →   ' + purchases + ' sales', 'green'),
  ]);
  c.show('value-total', entry(3, purchases + ' × $' + price + '   =   $' + gross, 'ink'));
  c.show('value-unit', entry(4, '$' + gross + ' / ' + impressions + '   =   $' + gross / impressions, 'yellow'));
  const expected = place(note('Expected counts at these probabilities'), top, 'right');
  c.show('value-example', expected);

  const predictedRate = 0.8, outcomes = 10, positives = 6;
  const observedRate = positives / outcomes;
  const bin = place(label('Held-out predictions'), top);
  const [forecast, samples, observed] = board.rows([1, 1.5, 1], 'wide');
  const prediction = place(mono(outcomes + ' predictions at ' + predictedRate.toFixed(2)), forecast);
  c.swapAll('value-bins', [bin, prediction]);
  const dots = Array.from({ length: outcomes }, (_, i) => dot(23, i < positives ? 'green' : 'dim'));
  c.show('value-outcomes', place(row(dots, { gap: 'normal' }), samples));
  c.show('value-ece', place(mono(positives + ' / ' + outcomes + ' = ' + observedRate.toFixed(2)), observed));
  const gap = Math.abs(predictedRate - observedRate);
  c.show('value-gap', mono('Gap   ' + predictedRate.toFixed(2) + ' − ' + observedRate.toFixed(2)
    + ' = ' + gap.toFixed(2), { color: 'yellow' }).moveTo([foot.cx, foot.top]));
}
