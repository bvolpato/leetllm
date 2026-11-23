import { assertEqual } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import { COLORS, NAMES, TAU, comparisonRow, evaluate } from '../parts.mjs';
import { poolPicture } from '../pool.mjs';

export default function objective(s, c) {
  const scores = evaluate().scores;
  const full = comparisonRow(scores, TAU);
  const noSky = comparisonRow(scores, TAU, 0, [true, true, false]);
  const noDog = comparisonRow(scores, TAU, 0, [true, false, true]);
  const p = poolPicture('A dog is running', NAMES, COLORS, scores, full, TAU);
  const baseline = p.strip(p.first, 'All three captions', full);
  const withoutSky = p.strip(p.second, 'Omit the sky', noSky);
  const withoutDog = p.strip(p.second, 'Restore the sky · omit the sleeper', noDog);
  const loss = (row) =>
    p.footer('L = −ln(target share) = ' + row.loss.toFixed(4) + ' nats', 'yellow');
  const fullLoss = loss(full),
    skyLoss = loss(noSky),
    dogLoss = loss(noDog);
  const gradient = p.footer('∂L/∂cosine = (share − target) / τ');
  const signed = full.gradients.map((v) => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(3));
  const derivatives = p.instruction(
    NAMES.map((name, i) => name + '   ' + signed[i]).join('       '),
  );
  assertEqual(
    noDog.loss < noSky.loss && noSky.loss < full.loss,
    true,
    'removing the close competitor changes the loss more',
  );
  s.add(
    heading(c.title),
    p.header,
    p.inputs,
    p.weights,
    baseline.frame,
    baseline.pieces,
    baseline.result,
  );
  c.show('objective-log', fullLoss, { after: true });
  c.show('objective-sky', [withoutSky.frame, withoutSky.pieces, withoutSky.result]);
  c.swap('objective-sky', fullLoss, skyLoss);
  c.swap(
    'objective-sleeper',
    [withoutSky.frame, withoutSky.pieces, withoutSky.result, skyLoss],
    [withoutDog.frame, withoutDog.pieces, withoutDog.result, dogLoss],
  );
  c.hide('objective-all', [withoutDog.frame, withoutDog.pieces, withoutDog.result, dogLoss]);
  c.show('objective-gradient', gradient);
  c.swap('objective-directions', gradient, derivatives, { after: true });
}
