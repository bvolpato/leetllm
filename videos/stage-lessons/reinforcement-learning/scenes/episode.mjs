import { assertEqual, boxOf, place, row, to } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { routeSlip, sign } from '../desk.mjs';
import { gamma, REWARD, returns } from '../parts.mjs';

export default function episode(s, c) {
  const desk = routeSlip();
  const totals = [returns.evidence, returns.review];
  const calculations = desk.rows.map(({ total, reward, cost, next, color }, i) => {
    const discounted = gamma * next;
    assertEqual(cost + discounted, totals[i], 'discounted route');
    const expression = place(mono(sign(cost) + ' + ' + discounted, { size: 49, color }), total);
    const result = place(mono(String(totals[i]), { size: 68, color }), total);
    const terms = place(
      row(
        [
          mono(sign(cost) + ' + ' + gamma + ' ×', { size: 40, color }),
          mono(String(next), { size: 40, color }),
        ],
        { gap: 12 },
      ),
      total,
    );
    const factor = terms.nodes[0];
    const slot = boxOf(terms.nodes[1]).point('center');
    const printed = boxOf(reward.nodes[0]);
    const copy = mono(String(next), { size: 40, color });
    const start = [printed.right + boxOf(copy).width / 2 + 16, printed.cy];
    copy.moveTo(start);
    const rail = total.top + 27;
    return { expression, result, factor, copy, start, slot, rail };
  });
  const win = place(label('Ask for proof  ·  5 more points', { color: 'green' }), desk.foot);
  const unsafe = place(
    label('Immediate unsupported approval  ' + sign(REWARD.approve) + '  ·  simulator only', {
      color: 'pink',
    }),
    desk.assumptions,
  );
  const series = place(mono('Return = r₁ + γ × r₂ + γ² × r₃ + …'), desk.rule);
  const bound = place(
    mono('|return| ≤ largest |reward| / (1 − γ)     for 0 ≤ γ < 1', { size: 36 }),
    desk.rule,
  );
  const waiting = place(note('If waiting changes the outcome, model that branch.'), desk.foot);
  s.add(heading(c.title));
  c.take([...desk.skeleton, ...desk.filled]);
  for (const [i, id] of ['ask', 'review'].entries()) {
    const row = desk.rows[i];
    const calc = calculations[i];
    c.swap(id + '-back', row.open, calc.factor, { fade: 0.12 });
    c.on(id + '-back', () => {
      s.add(calc.copy);
      s.play(to(calc.copy, (n) => n.moveTo([calc.start[0] + 95, calc.rail]), { duration: 0.32 }));
      s.play(to(calc.copy, (n) => n.moveTo([calc.slot[0], calc.rail]), { duration: 0.48 }));
      s.play(to(calc.copy, (n) => n.moveTo(calc.slot), { duration: 0.28 }));
    });
    c.swap(id + '-now', [calc.copy, calc.factor], calc.expression, { after: true });
    c.swap(id + '-total', calc.expression, calc.result, { after: true });
  }
  c.show('choose', win, { after: true });
  c.swap('unsafe', desk.certain, unsafe, { after: true });
  c.swap('return-rule', desk.discount, series);
  c.swap('bound', series, bound);
  c.swap('wait', win, waiting);
}
