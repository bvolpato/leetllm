import { place } from 'vizmatic/stage';
import { chip, label, mono, note } from '../../kit-narrated.mjs';
import { open } from '../parts.mjs';

export default function propensity(s, c) {
  const [stages, evidence, result] = open(s, c).rows([2, 3, 1], 'wide');
  const branches = stages.columns(3, 'wide');
  const names = ['Assign a shopper', 'Choose a slate', 'Examine a position'];
  const decisions = ['P(arm B) = 0.5', 'P(slate | context)', 'P(look | position)'];
  const formulas = [];
  branches.forEach((region, i) => {
    const [head, value] = region.rows(2, 'normal');
    s.add(place(label(names[i]), head));
    formulas.push(place(mono(decisions[i], { size: 32, color: 'cyan' }), value));
  });
  const [left, right] = evidence.columns(2, 'wide');
  const blocked = [place(chip('P(Z displayed) = 0', { color: 'red' }), left), place(label('No observed outcome for Z'), right)];
  const swap = [place(label('Ranker A    P5 → P6'), left), place(label('Ranker B    P6 → P5'), right)];
  const loss = place(mono('a × data loss', { color: 'cyan' }), left);
  c.show('propensity-types', formulas);
  c.show('propensity-zero', blocked);
  c.swap('propensity-relative', blocked, swap);
  c.swap('propensity-scale', swap, loss);
  c.show('propensity-fixed', place(mono('+ λ × penalty', { color: 'yellow' }), right));
  c.show('propensity-unset', place(note('Fixture propensity = unset     ·     Evaluation only'), result));
}
