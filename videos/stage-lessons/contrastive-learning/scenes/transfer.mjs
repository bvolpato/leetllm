import { assertEqual, place } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { captionMatch } from '../caption-match.mjs';
import { TAU, comparisonRow, evaluate } from '../parts.mjs';

export default function transfer(s, c) {
  const p = captionMatch();
  const row = comparisonRow(evaluate().scores, TAU);
  const action = p.rule('Match the action', 'Find footage of a dog running.');
  const subject = p.rule('Index by animal', 'Find every clip with a dog in it.');
  const first = p.link(0, 'green'),
    second = p.link(1, 'green');
  const shares = row.probs.map((v, i) => p.readings[i]((100 * v).toFixed(1) + '%'));
  const key = place(note('Right column: original softmax shares', { size: 29 }), p.requestFoot);
  const largerSet = place(label('Which other caption now belongs?', { color: 'yellow' }), p.footer);
  const old = place(
    label('Sleeping dog · old target 0 · score derivative +' + row.gradients[1].toFixed(3), {
      color: 'pink',
      size: 40,
    }),
    p.footer,
  );
  const target = 1 / 2,
    derivative = (row.probs[1] - target) / TAU;
  const fixed = place(
    label(
      'Sleeping dog · target ½ · score derivative ' +
        derivative.toFixed(3) +
        '    →    raise its score',
      { color: 'green', size: 40 },
    ),
    p.footer,
  );
  assertEqual(derivative.toFixed(3), '-0.379', 'mean-log loss on the two verified dog clips');
  s.add(heading(c.title), p.queryLabel, p.query, p.captions, shares, key, action, first);
  c.swap('transfer-purpose', action, subject);
  c.show('transfer-which', largerSet);
  c.show('transfer-sleeper', second, { after: true });
  c.swap('transfer-old', largerSet, old, { after: true });
  c.swap('transfer-new', old, fixed, { after: true });
}
