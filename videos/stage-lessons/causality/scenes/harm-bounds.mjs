import { decimal, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { captions, frame, measure, pairedOutcomes, plot } from '../parts.mjs';
import { responseTypePairing } from '../../../films/causality/model.mjs';

export default function harmBounds(s, c) {
  frame(
    s,
    'How many tickets could be harmed?',
    'Each pair shows assistant then control',
    'Response types per hundred',
  );
  const initial = responseTypePairing(0);
  const max = Math.min(initial.controlSuccess, initial.total - initial.assistantSuccess);
  const [field, key] = plot.rows([7, 1], 'tight');
  const grid = pairedOutcomes(initial, field);
  const margins = place(
    label(
      initial.assistantSuccess +
        ' assistant successes    ' +
        initial.controlSuccess +
        ' control successes',
      { size: 35 },
    ),
    key,
  );
  s.add(grid.nodes);
  c.show('margins', margins, { after: true, lead: 0 });
  const h = s.value(0);
  const fields = [
    ['Both resolve', initial.counts.always + ' − h', 'always', 'green'],
    ['Only assistant resolves', initial.counts.helped + ' + h', 'helped', 'cyan'],
    ['Only control resolves', 'h', 'harmed', 'pink'],
    ['Neither resolves', initial.counts.never + ' − h', 'never', 'red'],
  ];
  measure.rows(fields.length, 'normal').forEach((band, i) => {
    const [title, formula, type, color] = fields[i];
    const [head, values] = band.rows([1, 1.6], 'tight');
    const [expression, count] = values.columns([1, 1], 'normal');
    const number = decimal(() => responseTypePairing(h.value).counts[type], {
      digits: 0,
      size: 42,
      color,
    });
    s.add(
      place(note(title), head, 'bottom left'),
      place(mono(formula + '  =', { size: 37 }), expression, 'top left'),
      place(number, count, 'top left'),
    );
  });
  const move = (cue, end) =>
    c.after(cue, () =>
      grid.change(s, responseTypePairing(end), (pairing) => h.set(pairing.counts.harmed)),
    );
  move('endpoint', max);
  move('no-harm', 0);
  captions(s, c, 'Green marks a successful outcome. The two halves belong to the same ticket.', [
    ['range', 'Each extra harmed ticket needs an extra helped ticket to preserve the margins.'],
    [
      'no-harm',
      'Ruling out harm fixes the four counts. Individual ticket identities remain unknown.',
      true,
    ],
  ]);
}
