import { assertEqual } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import { comparisonRow } from '../parts.mjs';
import { poolPicture, removeCopy } from '../pool.mjs';

export default function falseNegatives(s, c) {
  const scores = [0.8, 0.8, 0.1],
    tau = 0.2;
  const full = comparisonRow(scores, tau);
  const masked = comparisonRow(scores, tau, 0, [true, false, true]);
  const p = poolPicture(
    'How do I rotate an API key?',
    ['A · rotation guide', 'B · same guide', 'C · KMS guide'],
    ['green', 'pink', 'blue'],
    scores,
    full,
    tau,
  );
  const before = p.strip(p.first, 'Target A · all three entries compete', full);
  const working = p.strip(p.second, 'Working row', full);
  const after = p.strip(p.second, 'Target A · copy B excluded', masked);
  const question = p.footer('Will a step try to raise or lower B’s score?', 'yellow');
  const direction = p.footer('Descent tries to lower the score of copy B.', 'pink');
  const wrong = p.footer(
    'Before masking B:  ' +
      full.probs[1].toFixed(4) +
      ' / 0.20 = +' +
      full.gradients[1].toFixed(3) +
      '    →    lower B',
    'pink',
  );
  const repaired = p.footer(
    'B: ∂L/∂score = 0     ·     loss ' +
      full.loss.toFixed(4) +
      ' → ' +
      masked.loss.toFixed(4) +
      ' nats',
    'green',
  );
  assertEqual(masked.gradients[1], 0, 'the excluded copy has zero direct score derivative');
  s.add(heading(c.title), p.header, p.inputs);
  c.show('duplicate-columns', [p.weights, before.frame, before.pieces, before.result]);
  c.show('duplicate-predict', question);
  c.swap('duplicate-lower', question, direction, { after: true });
  c.show('duplicate-lower', [working.frame, working.pieces], { after: true });
  c.swap('duplicate-direction', direction, wrong, { after: true });
  c.on('duplicate-mask', () => removeCopy(s, working));
  c.swap('duplicate-new-share', working.frame[0], after.frame[0]);
  c.show('duplicate-new-share', after.result, { after: true });
  c.swap('duplicate-zero', wrong, repaired, { after: true });
}
