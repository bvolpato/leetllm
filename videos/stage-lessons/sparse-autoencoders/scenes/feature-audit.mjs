import { arrow, assertEqual, boxOf, column, place, row } from 'vizmatic/stage';
import { area, heading, label, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, vec } from '../parts.mjs';
import { requestMeters, resetState } from '../reset-example.mjs';

const weights = [1, 2];
const error = 0.1;

export default function featureAudit(s, c) {
  const title = heading(c.title);
  const [top, middle, lower] = area.rows([2, 4, 2], 'normal');
  const [left, right] = middle.columns(2, 'wide');
  const candidate = place(
    label('Proposed label    “credential”', { color: COLOR.first, size: 54 }),
    top,
  );
  const observed = [
    note('Same SAE evaluation'),
    label('Trained Pythia'),
    label('Randomized Pythia'),
  ];
  place(column(observed, { gap: 'normal', align: 'left' }), left, 'left');
  const measures = [
    label('Aggregate explanation scores'),
    label('Reconstruction metrics'),
    note('Often similar in this study', { color: COLOR.mark }),
  ];
  place(column(measures, { gap: 'normal', align: 'left' }), right, 'left');
  s.add(title, candidate, observed);
  c.show('audit-aggregate', measures);
  const stages = ['activation', 'text', 'reconstruction'].map((name, i) =>
    namedBox(name, { width: 320, height: 108, color: i === 1 ? COLOR.mark : COLOR.other }),
  );
  place(row(stages, { gap: 120 }), middle);
  const links = [0, 1].map((i) =>
    arrow(boxOf(stages[i]).point('right'), boxOf(stages[i + 1]).point('left'), {
      stroke: 'dim',
      width: 5,
      pad: 12,
      tip: 22,
    }),
  );
  c.swap('audit-verbalize', [observed, measures], [stages[0], links[0], stages[1]]);
  c.show('audit-roundtrip', [links[1], stages[2]]);
  const translated = [label('Reset my password'), label('Réinitialise mon mot de passe')];
  const outcomes = [label('Legitimate reset completed?'), label('Unauthorized reset declined?')];
  place(column(translated, { gap: 'wide', align: 'left' }), left, 'left');
  place(column(outcomes, { gap: 'wide', align: 'left' }), right, 'left');
  const matched = place(note('Same checkpoint, hook and token positions'), lower);
  c.swap('audit-heldout', [stages, links], [translated, matched]);
  c.show('audit-behavior', outcomes);

  // Both rows retain the same residual as the decoder contributions change.
  const blue = s.value(1);
  const pink = s.value(1);
  const residual = s.value(0);
  const read = (i) => resetState(i, { blue: blue.value, pink: pink.value, error: residual.value });
  const scores = (changes) =>
    [0, 1].map((i) =>
      Number(vec.dot(resetState(i, { error, ...changes }).activation, weights).toFixed(2)),
    );
  const baseline = scores({});
  assertEqual(baseline, [1.7, 3.7], 'original refusal scores');
  assertEqual(scores({ blue: 0 }), [0.2, 2.2], 'credential removed from both originals');
  assertEqual(scores({ pink: 0 }), [1.7, 1.7], 'urgency removed, originals otherwise intact');

  const meters = requestMeters({
    read,
    weights,
    max: 4,
    quantity: 'Toy refusal score    S = x₁ + 2x₂',
    original: baseline,
  });
  const rows = meters.rows.flatMap((r) => [r.base, r.input, r.stack, r.end]);
  const legend = meters.legend(true);
  const ghosts = meters.rows.map((r) => r.previous);
  const residualNote = meters.caption('Add the same unexplained part   [0, 0.10]', COLOR.residual);
  const ask = meters.caption('Remove [1.50, 0] from both. What happens to the gap?', COLOR.mark);
  const firstResult = meters.caption('Both scores fall by 1.50.');
  const rewind = meters.caption('Back to both original activations');
  const next = meters.caption('Remove urgency. What gap will remain?', COLOR.mark);
  const gapWithout = (changes) => {
    const [plain, urgent] = scores(changes);
    return (urgent - plain).toFixed(2);
  };
  const result = row([
    label(`Gap without credential   ${gapWithout({ blue: 0 })}`, { color: COLOR.first, size: 43 }),
    label(`Gap without urgency   ${gapWithout({ pink: 0 })}`, { color: COLOR.second, size: 43 }),
  ], { gap: 'loose' });
  place(result, meters.footer);
  c.swapAll('audit-pair', [meters.headText, ...rows, legend], { keep: [title] });
  c.show('audit-residual', residualNote);
  c.on('audit-residual', () => s.play(residual.to(error, { duration: 1.25 })));
  c.show('audit-gap', meters.gap);
  c.swap('audit-predict', residualNote, ask);
  c.hide('audit-minus-blue', ask, { lead: 0 });
  c.show('audit-minus-blue', ghosts);
  c.on('audit-minus-blue', () => s.play(blue.to(0, { duration: 1.65 })));
  c.show('audit-fall', firstResult, { after: true });
  c.swap('audit-rewind', firstResult, rewind);
  c.on('audit-rewind', () => s.play(blue.to(1, { duration: 1.1 })));
  c.swap('audit-pink-question', rewind, next);
  c.hide('audit-minus-pink', next, { lead: 0 });
  c.on('audit-meet', () =>
    s.play(pink.to(0, { duration: c.cue('audit-verdict').end - c.cue('audit-meet').start })),
  );
  c.show('audit-verdict', result, { after: true });
}
