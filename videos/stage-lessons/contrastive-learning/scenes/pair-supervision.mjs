import { arrow, circle, column, dot, indicate, place, row, to } from 'vizmatic/stage';
import { area, heading, label, namedBox, note } from '../../kit-narrated.mjs';

export default function pairSupervision(s, c) {
  const [left, right] = area.columns([1, 1], 'loose');
  const o = left.point('center'),
    r = left.width * 0.39;
  const animal = circle(r, { stroke: 'blue', width: 3 }).moveTo(o);
  const dogCenter = [o[0] - r * 0.25, o[1] + r * 0.2];
  const dogs = circle(r * 0.48, { stroke: 'green', width: 3 }).moveTo(dogCenter);
  const animalName = label('animals', { color: 'blue' }).moveTo([o[0], o[1] - r + 48]);
  const dogName = label('dogs', { color: 'green' }).moveTo([dogCenter[0], dogCenter[1] + r * 0.26]);
  const member = dot(14, 'yellow').moveTo(dogCenter);
  const rows = right.rows([2, 2, 2], 'loose');
  const implication = place(label('dog → animal', { color: 'green' }), rows[0]);
  const reverse = place(label('animal → dog?', { color: 'red' }), rows[0]);
  const sbert = place(
    column(
      [
        label('Sentence-BERT'),
        namedBox('u, v, |u − v|', { width: 540, height: 96, color: 'cyan' }),
        note('NLI classifier'),
      ],
      { gap: 'normal', align: 'center' },
    ),
    rows[1],
  );
  const simcse = place(
    column(
      [
        label('supervised SimCSE'),
        row([
          label('entailment +', { color: 'green' }),
          label('contradiction −', { color: 'pink' }),
        ]),
      ],
      { gap: 'normal', align: 'center' },
    ),
    rows[2],
  );
  s.add(heading(c.title), animal, dogs, animalName, dogName, member, implication);
  c.on('cl-pair-supervision-entail', () => s.play(indicate(dogs, { scale: 1 })));
  c.swap('cl-pair-supervision-reverse', implication, reverse);
  c.on('cl-pair-supervision-reverse', () =>
    s.play(to(member, (n) => n.moveTo([o[0] + r * 0.55, o[1] + r * 0.15]), { duration: 1.3 })),
  );
  c.show('cl-pair-supervision-sbert', sbert);
  c.show('cl-pair-supervision-simcse', simcse);
}
