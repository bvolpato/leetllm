import { captions, cells, diff, pct, rate, raw, tally } from '../parts.mjs';
import { riskBoard } from '../risk-board.mjs';

export default function simpson(s, c) {
  const board = riskBoard(s, c.title);
  const easy = board.equations(cells.map(([g]) => 'Easy: ' + tally(g) + '/' + g.length + ' = ' + pct(rate(g))));
  const hard = board.readings(cells.map(([, g]) => 'Hard: ' + tally(g) + '/' + g.length + ' = ' + pct(rate(g))));
  c.show('easy', easy);
  c.show('hard', hard);
  const observed = board.equations(cells.map(([lo, hi]) => tally(lo) + ' + ' + tally(hi) + ' resolved'));
  const totals = board.readings(raw.map((v) => pct(v) + ' overall'));
  c.swap('count', easy, observed);
  c.swap('count', hard, totals);
  const target = board.guides(0.5);
  const operands = board.equations(cells.map((pair) => pair.map((g) => '½ × ' + pct(rate(g))).join(' + ')));
  c.show('target', target);
  c.swap('target', observed, operands);
  c.hide('target', totals);
  c.hide('move', target);
  c.on('move', () => board.move([0.5, 0.5]));
  const shared = cells.map((pair) => (rate(pair[0]) + rate(pair[1])) / 2);
  c.show('result', board.readings(shared.map((v) => pct(v) + ' at the shared mix')), { after: true, lead: 0 });
  captions(s, c, 'Green height measures the fraction resolved within each risk group.', [
    ['count', 'With one vote per ticket, the wider group counts more in each total.'],
    ['target', 'At half easy and half hard, which workflow leads?'],
    ['result', 'Assistant minus control at the shared mix: ' + diff(shared[0] - shared[1]) + '.', true],
  ]);
}
