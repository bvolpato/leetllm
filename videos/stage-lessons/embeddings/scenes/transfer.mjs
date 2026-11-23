import { assertEqual, column, dynamic, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { LOW, MID, TOP, V, maskedMean, mix, plane, vec } from '../parts.mjs';

export default function transfer(s, c) {
  const p = plane(s);
  const replacement = s.value(0),
    normalize = s.value(0);
  const clue = () => mix(V.river, V.money, replacement.value);
  const calculate = (v) => V.bank.map((b, i) => 0.5 * b + 0.4 * v[i] + 0.1 * V.water[i]);
  const state = () => calculate(clue());
  const unit = (v) => v.map((x) => x / Math.hypot(...v));
  const current = () => mix(state(), unit(state()), normalize.value);
  const pooled = () => maskedMean([V.bank, state(), V.water], [1, 1, 1]);
  assertEqual(vec(calculate(V.money)), '[0.67, 0.38]', 'replaced clue');
  const bank = p.vector(() => V.bank, 'blue');
  const old = p.vector(() => calculate(V.river), 'cyan');
  const moving = p.vector(current, 'yellow');
  const settled = dynamic(
    () =>
      place(
        column(
          [label('Occurrence state', { color: 'yellow' }), mono(vec(state()), { color: 'yellow' })],
          { gap: 'normal' },
        ),
        MID,
        'left',
      ).nodes,
  );
  const inputs = place(
    column(
      [
        mono('0.5 bank + 0.4 clue + 0.1 water', { size: 37 }),
        mono('river ' + vec(V.river) + '  →  money ' + vec(V.money), { size: 31 }),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const ask = place(label('Will the tip move up or down?', { color: 'yellow' }), LOW, 'left');
  const delta = V.money.map((v, i) => 0.4 * (v - V.river[i]));
  const difference = place(mono('Change  ' + vec(delta), { size: 42 }), LOW, 'left');
  const unitState = dynamic(() =>
    place(mono('Unit direction  ' + vec(current()), { size: 37, color: 'yellow' }), LOW, 'left'),
  );
  const sentence = dynamic(
    () =>
      place(
        column(
          [
            label('Mean of bank, new state and water', { size: 37, color: 'pink' }),
            mono(vec(pooled()), { size: 40, color: 'pink' }),
          ],
          { gap: 'normal' },
        ),
        MID,
        'left',
      ).nodes,
  );
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, bank, old, moving, inputs, settled);
  c.show('predict', ask);
  c.swap('replace', ask, difference);
  c.on('replace', () => s.play(replacement.to(1, { duration: 1.8 })));
  c.swap('normalize', difference, unitState);
  c.on('normalize', () => s.play(normalize.to(1, { duration: 1.4 })));
  c.swap('pool', settled, sentence);
  c.show('pool', p.vector(pooled, 'pink'));
}
