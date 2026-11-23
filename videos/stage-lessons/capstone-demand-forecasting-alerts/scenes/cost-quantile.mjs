import { dynamic, group } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { area, begin, capacityBreakdown, number, stroke, tableRows, words } from '../parts.mjs';

export default function cost(s, c) {
  const title = begin(s, c);
  const [rule, sheet, ruler, totals, foot] = area.rows([1, 4, 1.6, 1, 1], 'normal');
  const rows = tableRows(sheet, 4, [2, 2, 2, 3, 3]);
  const head = ['Demand', 'Chance', 'Cumulative', 'Gap at booking', 'Weighted cost'];
  const draw = (r, j, v, color) => number(rows[r][j], v, color, 39);
  s.add(words(rule, 'One booking   ·   shortage costs 3 per parcel   ·   spare capacity costs 1', 'dim', 34));
  const first = capacityBreakdown(100);
  const headers = head.map((v, j) => words(rows[0][j], v, 'dim', 32));
  s.add(headers[0], ...first.map(({ demand }, i) => draw(i + 1, 0, demand, 'green')));
  c.show('distribution', [headers[1], ...first.map(({ probability }, i) => draw(i + 1, 1, probability.toFixed(2), 'ink'))]);
  let mass = 0;
  const cdf = first.map(({probability}, i) => draw(i + 1, 2, (mass += probability).toFixed(2), 'cyan'));
  c.show('cumulative', [headers[2], ...cdf]);
  const target = words(foot, '3 / (3 + 1) = 0.75     ·     Which demand level reaches it first?', 'yellow', 39);
  c.show('quantile', target);
  const picked = rows[2][2];
  c.show('choose', stroke(picked.left + 45, picked.bottom - 9, picked.right - 45, picked.bottom - 9, 'yellow', 5), { after: true });
  function booking(a) {
    const items = capacityBreakdown(a);
    const cells = items.flatMap(({shortage, spare, contribution}, i) => [
      draw(i + 1, 3, shortage ? shortage + ' short' : spare ? spare + ' spare' : 'exact fit', shortage ? 'red' : spare ? 'blue' : 'dim'),
      draw(i + 1, 4, contribution.toFixed(0), 'yellow'),
    ]);
    const error = items.reduce((n, r) => n + r.probability * (r.spare + r.shortage), 0);
    const cost = items.reduce((n, r) => n + r.contribution, 0);
    return [...cells, words(totals, 'Book ' + a + '    ·    Mean absolute gap ' + error.toFixed(0) + ' parcels    ·    Expected cost ' + cost + ' units', 'ink', 39)];
  }
  const median = booking(100), chosen = booking(160), full = booking(240);
  const booked = s.value(100);
  const x = v => ruler.left + 160 + (v - 100) / 140 * (ruler.width - 320);
  const y = ruler.cy - 12;
  const axis = group(stroke(x(100), y, x(240), y, 'grid', 4), ...first.flatMap(({demand}) => [
    stroke(x(demand), y - 8, x(demand), y + 10, 'dim'),
    mono(String(demand), {size: 29, color: 'green'}).moveTo([x(demand), y + 36]),
  ]));
  const cursor = dynamic(() => [stroke(x(booked.value), y - 32, x(booked.value), y + 12, 'pink', 8)]);
  c.hide('median', target);
  s.add(axis);
  c.show('median', [headers[3], headers[4], ...median, cursor]);
  c.on('book-more', () => s.play(booked.to(160), {duration: 0.65}));
  c.hide('book-more', median);
  c.show('new-booking', chosen, { after: true });
  c.on('book-all', () => s.play(booked.to(240), {duration: 0.75}));
  c.hide('book-all', chosen);
  c.show('max-booking', full, { after: true });
  const comparison = tableRows(sheet, 4, [1, 1, 1]);
  const costs = first.map(({ demand }) =>
    capacityBreakdown(demand).reduce((sum, row) => sum + row.contribution, 0));
  const best = Math.min(...costs);
  c.swapAll('scope', [
    words(rule, 'Divide expected booking cost by 3 + 1', 'ink', 41),
    ...['Places booked', 'Expected cost', 'Expected pinball loss'].map((name, j) => words(comparison[0][j], name, 'dim', 39)),
    ...first.flatMap(({ demand }, i) => [demand, costs[i].toFixed(0), (costs[i] / 4).toFixed(2)]
      .map((value, j) => number(comparison[i + 1][j], value, costs[i] === best ? 'green' : 'ink', 48))),
    words(totals, 'The same booking minimizes both columns', 'green', 41),
  ], { keep: [title] });
}
