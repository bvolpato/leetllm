import { column, indicate, place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, V, RIVER, FINANCE, mix, accumulation, vec } from '../parts.mjs';

export default function context(s, c) {
  const p = plane(s, {
    title: 'Context at bank',
    xName: 'right toward money',
    yName: 'up toward river',
  });
  const stored = p.vector(() => V.bank, 'blue');
  const riverPath = accumulation(s, p, [
    { values: V.bank, weight: 0.5, color: 'yellow' },
    { values: V.river, weight: 0.4, color: 'cyan' },
    { values: V.water, weight: 0.1, color: 'cyan' },
  ]);
  const moneyPath = accumulation(s, p, [{ values: V.money, weight: 0.5, color: 'green' }], {
    initial: V.bank.map((value) => value * 0.5),
  });

  const shared = place(
    column([label('Stored row for bank', { color: 'blue' }), mono(vec(V.bank))]),
    TOP,
    'left',
  );
  const sentences = [
    { region: MID, text: 'Water reaches the river bank', color: 'cyan', state: RIVER },
    { region: LOW, text: 'Deposit money at the bank', color: 'green', state: FINANCE },
  ].map(({ region, text, color, state }) => {
    const [name, terms, answer] = region.rows([1, 1, 1], 'tight');
    return {
      name: place(label(text, { color }), name, 'left'),
      formula: (words) => place(mono(words, { size: 36 }), terms, 'left'),
      answer: place(mono(vec(state), { color, size: 39 }), answer, 'left'),
    };
  });
  const [river, deposit] = sentences;
  const half = river.formula('0.5 bank');
  const withRiver = river.formula('0.5 bank + 0.4 river');
  const withWater = river.formula('0.5 bank + 0.4 river + 0.1 water');

  c.take(p.frame);
  s.add(heading(c.title), p.nodes, stored, shared, river.name, deposit.name);
  c.show('half', [half, riverPath.drawing]);
  c.on('half', () => s.play(riverPath.progress.to(1, { duration: 0.7 })));
  c.swap('river', half, withRiver);
  c.on('river', () => s.play(riverPath.progress.to(2, { duration: 0.7 })));
  c.swap('water', withRiver, withWater);
  c.on('water', () => s.play(riverPath.progress.to(3, { duration: 0.7 })));
  const sharedHalf = deposit.formula('0.5 bank');
  const withMoney = deposit.formula('0.5 bank + 0.5 money');
  c.show('deposit', sharedHalf);
  c.swap('money', sharedHalf, withMoney);
  c.show('money', moneyPath.drawing);
  c.on('money', () => s.play(moneyPath.progress.to(1, { duration: 0.85 })));

  const progress = s.value(0);
  const copies = [RIVER, FINANCE].map((state, i) =>
    p.vector(() => mix(V.bank, state, progress.value), i === 0 ? 'cyan' : 'green'),
  );
  c.show('separate', copies);
  c.on('separate', () => s.play(progress.to(1, { duration: 1.5 })));
  c.show(
    'mix',
    sentences.map((item) => item.answer),
  );
  c.on('attention', () => s.play(indicate([withWater, withMoney], { scale: 1, color: 'yellow' })));
  c.on('causal', () => s.play(indicate(river.name, { scale: 1, color: 'yellow' })));
  c.keep(p.frame);
}
