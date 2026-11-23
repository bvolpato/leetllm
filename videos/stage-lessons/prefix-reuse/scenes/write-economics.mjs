import { assertEqual, beside } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { priceInput } from '../../../films/prefix-reuse/arithmetic.mjs';
import { board, body, caption, fmt, foot, gauge, guide, inputRates, longWriteRate, priceStrip } from '../parts.mjs';

export default function writeEconomics(s, c) {
  const price = (field, rates = inputRates) =>
    priceInput([{ ordinary: 0, write: 0, read: 0, [field]: guide }], rates);
  const cold = price('ordinary'), write = price('write'), read = price('read');
  const higher = { ...inputRates, write: longWriteRate };
  const higherWrite = price('write', higher);
  const saving = cold - read;
  const reads = Math.ceil((higherWrite - cold) / saving);
  assertEqual(reads, 2, 'Two full reads recover the higher write premium.');
  assertEqual(write + read, 8100, 'The short write and one full read cost 8,100 units.');
  const max = (reads + 1) * cold;
  board(s, c, 'When does writing the guide pay?', 'Example prices · input only');
  const [, a, b] = body.rows(3, 'wide');
  const legend = priceStrip([inputRates.ordinary, inputRates.write, inputRates.read]);
  c.keep(legend);
  const one = gauge(a, 'Ordinary input', [['ordinary', cold, 'cyan']], max);
  const two = gauge(b, 'Cached input', [['write', write, 'blue'], ['reads', 0, 'green'], ['second read', 0, 'green']], max);
  const charge = (chart, value, requests) =>
    beside(mono(requests + (requests === 1 ? ' request' : ' requests') + ' · ' + fmt(value) + ' units',
      { size: 35 }), chart.bar, 'under', 'tight', 'right');
  const ordinary = [cold, 2 * cold, max].map((value, i) => charge(one, value, i + 1));
  const cached = [write, write + read, higherWrite + read, higherWrite + reads * read]
    .map((value, i) => charge(two, value, [1, 2, 2, 3][i]));
  const status = (words, color = 'ink') => caption(words, foot, { size: 42, color });
  const first = status('First request   ·   ' + fmt(guide) + ' guide tokens');
  const premium = status('Extra cost to write   ·   ' + fmt(write - cold), 'pink');
  const readSaving = status(fmt(saving) + ' saved on the read   >   ' + fmt(write - cold) + ' extra to write', 'green');
  const rule = status('Extra write cost ÷ saving per full read');
  const quotient = (write - cold) / saving;
  const division = fmt(write - cold) + ' ÷ ' + fmt(saving);
  const fraction = status(division + ' ≈ ' + quotient.toFixed(2) + ' reads');
  const whole = status(division + '   →   ' + Math.ceil(quotient) + ' full read', 'green');
  const high = status('Same two requests   ·   higher write price');
  const gap = fmt(higherWrite + read - 2 * cold) + ' behind';
  const shortfall = status(gap + ' after one read', 'pink');
  const ask = status(gap + '   ·   ' + fmt(saving) + ' saved per read   ·   Will one more do it?', 'yellow');
  const next = status('Third request   ·   add one pass to each bill');
  const paid = status(reads + ' reads   ·   ' + fmt(max - higherWrite - reads * read) + ' units ahead', 'green');
  function updateBill(cue, previous, next, ...bars) {
    c.hide(cue, previous, { after: true, lead: 0, fade: 0.1 });
    c.after(cue, () => s.play(...bars, { duration: 0.55 }));
    c.show(cue, next, { after: true, lead: -0.55 });
  }
  s.add(legend, one.nodes, two.nodes, ordinary[0], cached[0], first);
  c.swap('cost-premium', first, premium, { after: true });
  updateBill('cost-second-cold', ordinary[0], ordinary[1], one.bar.resize('ordinary', 2 * cold));
  updateBill('cost-read', cached[0], cached[1], two.bar.resize('reads', read));
  c.swap('cost-saving', premium, readSaving, { after: true });

  c.swap('cost-rule', readSaving, rule);
  c.swap('cost-quotient', rule, fraction, { after: true, lead: 0 });
  c.swap('cost-whole-read', fraction, whole, { after: true, lead: 0 });
  c.hide('cost-higher', cached[1], { fade: 0.1 });
  c.on('cost-higher', () => s.play(legend.setValue('rate', 1, higher.write),
    two.bar.resize('write', higherWrite),
    { duration: 0.55 }));
  c.show('cost-higher', cached[2], { lead: -0.55 });
  c.swap('cost-higher', whole, high);
  c.swap('cost-shortfall', high, shortfall, { after: true, lead: 0 });
  c.swap('cost-predict', shortfall, ask);
  c.swap('cost-answer', ask, next, { after: true, lead: 0 });
  updateBill('cost-long', cached[2], cached[3], two.bar.resize('second read', read));
  updateBill('cost-last-cold', ordinary[1], ordinary[2], one.bar.resize('ordinary', max));
  c.swap('cost-paid', next, paid, { after: true, lead: 0 });
}
