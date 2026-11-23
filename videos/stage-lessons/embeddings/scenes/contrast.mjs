import { column, indicate, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, V, RIVER, FINANCE, mix, cosine, fmt, angleArc } from '../parts.mjs';
export default function contrast(s, c) {
  const p = plane(s),
    t = s.value(0),
    unit = (v) => v.map((x) => x / Math.hypot(...v));
  const stored = p.vector(() => V.bank, 'blue');
  const a = p.vector(() => mix(RIVER, unit(RIVER), t.value), 'cyan'),
    b = p.vector(() => mix(FINANCE, unit(FINANCE), t.value), 'green');
  const angles = [
    angleArc(
      p,
      () => RIVER,
      () => V.river,
      'cyan',
      0.4,
    ),
    angleArc(
      p,
      () => FINANCE,
      () => V.money,
      'green',
      0.5,
    ),
  ];
  const lookup = place(
    column(
      [
        label('one bank row', { color: 'blue' }),
        mono('[0.5, 0.5]'),
        note('Each score below is cosine to the named clue.'),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const river = place(
    column(
      [
        label('River occurrence', { color: 'cyan' }),
        mono('river ' + fmt(cosine(RIVER, V.river)) + '   money ' + fmt(cosine(RIVER, V.money)), {
          size: 34,
        }),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const finance = place(
    column(
      [
        label('Deposit occurrence', { color: 'green' }),
        mono(
          'river ' + fmt(cosine(FINANCE, V.river)) + '   money ' + fmt(cosine(FINANCE, V.money)),
          { size: 34 },
        ),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const choice = place(
    column(
      [
        label('choose what to compare'),
        note('one subtoken / several states / sentence'),
        note('pooling changes the question'),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  s.add(heading(c.title), p.nodes, stored, a, b, lookup, river, finance);
  c.show('directions', angles);
  c.on('directions', () => s.play(t.to(1, { duration: 1.6 })));
  c.on('river', () => s.play(indicate(a, { scale: 1, color: 'yellow' })));
  c.on('shared', () => s.play(indicate(stored, { scale: 1, color: 'yellow' })));
  c.swap('subwords', finance, choice);
  c.keep(p.frame);
}
