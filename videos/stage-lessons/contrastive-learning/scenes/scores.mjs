import { assertEqual } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import { COLORS, NAMES, TAU, comparisonRow, evaluate } from '../parts.mjs';
import { poolPicture } from '../pool.mjs';

export default function scores(s, c) {
  const scores = evaluate().scores;
  const all = comparisonRow(scores, TAU);
  const easy = comparisonRow(scores, TAU, 0, [true, false, true]);
  const p = poolPicture('A dog is running', NAMES, COLORS, scores, all, TAU);
  const before = p.strip(p.first, 'Puppy + sky', easy);
  const after = p.strip(p.second, 'Puppy + sleeping dog + sky', all);
  const transform = p.instruction('mass = exp((cosine − highest cosine) / τ)');
  const prediction = p.footer('What happens to the puppy’s share?', 'yellow');
  const reading = p.footer('Same puppy score. More mass in the denominator.');
  assertEqual(easy.masses[0], all.masses[0], 'the target keeps the same exponential weight');
  assertEqual((all.probs[0] * 100).toFixed(1), '57.4', 'full-pool share');
  s.add(heading(c.title), p.header, p.inputs);
  c.show('scores-mass', [transform, p.weights], { after: true });
  c.show('scores-two', [before.frame, before.pieces]);
  c.show('scores-initial-share', before.result, { after: true });
  c.show('scores-admit', after.frame);
  c.swap('scores-predict', transform, prediction);
  c.show('scores-new-mass', after.pieces);
  c.show('scores-answer', after.result, { after: true });
  c.swap('scores-answer', prediction, reading, { after: true });
}
