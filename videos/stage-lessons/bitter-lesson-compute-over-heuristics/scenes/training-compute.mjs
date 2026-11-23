import { place, tex, assertEqual, indicate } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { BODY, budgetRectangle, trainingTotal } from '../parts.mjs';
import { fixedBudgetPlans } from '../../../films/bitter-lesson-compute-over-heuristics/arithmetic.mjs';
export default function training(s, c) {
  const plans = fixedBudgetPlans();
  assertEqual(plans[0].flops, plans[1].flops, 'equal training work');
  const [main, foot] = BODY.rows([5, 1], 'wide');
  const [left, right] = main.columns([1, 1], 'loose');
  const picture = budgetRectangle(s, left);
  const equation = place(tex('C \\approx 6ND', { size: 76 }), right, 'top');
  const work = place(trainingTotal(), right);
  const units = place(label('total operations', { color: 'dim' }), right, 'bottom');
  const [base, other] = plans.map((p) => ({ n: p.parameters / 1e9, d: p.tokens / 1e9 }));
  const fixed = base.n + 'B × ' + base.d + 'B = ' + other.n + 'B × ';
  const question = place(mono(fixed + '? training tokens', { color: 'yellow', size: 45 }), foot);
  const constant = place(mono(fixed + other.d + 'B', { color: 'yellow', size: 45 }), foot);
  const premise = place(label('N × D: parameters × training tokens', { color: 'dim' }), foot);
  s.add(heading(c.title), picture.frame, picture.body, premise);
  c.show('training-compute-beat-1-focus-1', equation);
  c.show('training-compute-beat-2-focus-1', picture.values, { after: true });
  c.show('train-work', work, { after: true });
  c.show('train-unit', units);
  c.swap('training-compute-beat-3-focus-1', premise, question);
  c.on('fixed-question', () => s.play(indicate(question, { scale: 1, color: 'yellow' })));
  c.hide('training-compute-beat-3-focus-2', picture.values, { after: true, fade: 0.08 });
  c.after('training-compute-beat-3-focus-2', () =>
    s.play(picture.n.to(plans[1].parameters / 1e9, { duration: 1.1 })),
  );
  c.show('training-compute-beat-3-focus-2', picture.values, { after: true, lead: -1.1 });
  c.swap('training-compute-beat-3-focus-2', question, constant, { after: true });
}
