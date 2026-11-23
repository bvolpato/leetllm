// Scene `steering`: an edit along one column moves every readout that overlaps it.
//
// The picture: a dot, and three rulers through the origin. The edit lifts the dot along the
// vertical column. Its shadow on the horizontal ruler stays, and its shadow on the tilted ruler
// slides: the collateral change is the overlap of that ruler with the column, times the edit.
import { dotProduct } from 'vizmatic';
import { angleMark, assertEqual, column, decimal, place, tex } from 'vizmatic/stage';
import {
  steeringBaseline,
  steeringDirection,
  steeringReadouts,
} from '../../../films/sparse-autoencoders/fixtures.mjs';
import { chipRow, heading, label, note } from '../../kit-narrated.mjs';
import { COLOR, SIDE, board, readoutBars, slider, vec } from '../parts.mjs';

/** The largest edit of the scene. */
const ALPHA = 1;
/** The row of the encoder that the next scene uses: it reads x1 + 2 x2. */
const READER = [1, 2];

export default function steering(s, c) {
  const b = board();
  const [candidate, orthogonal, overlapping] = steeringReadouts;
  const cached = dotProduct(READER, steeringBaseline);
  assertEqual(Number(cached.toFixed(2)), 0.4, 'cached coefficient');
  assertEqual(Number((cached + 0.7).toFixed(2)), 1.1, 'requested coefficient');
  assertEqual(
    Number(
      dotProduct(vec.add(steeringBaseline, vec.scale(steeringDirection, 0.7)), READER).toFixed(2),
    ),
    1.8,
    're-encoded coefficient',
  );
  const alpha = s.value(0);
  const edited = () => vec.add(steeringBaseline, vec.scale(steeringDirection, alpha.value));
  const readout = (direction) => () => dotProduct(edited(), direction);
  // The readouts of the model of the lesson: one follows the edit, one stays, one moves by the overlap.
  assertEqual(
    dotProduct(orthogonal, steeringDirection),
    0,
    'the horizontal readout is orthogonal to the edit',
  );
  assertEqual(
    dotProduct(overlapping, steeringDirection),
    0.8,
    'the overlap of the tilted readout with the edit',
  );

  const [formulaBand, sliderBand, barsBand, noteBand] = SIDE.rows([2, 1.2, 5, 2], 'normal');
  const formula = place(tex("x' = x + \\alpha\\,d_f", { size: 54 }), formulaBand);
  formula.part('\\alpha\\,d_f').forEach((glyph) => glyph.color(COLOR.other));
  const [railBand, alphaBand] = sliderBand.inset('normal', 'none').columns(2, 'wide');
  const knob = slider(railBand, alpha, { min: 0, max: ALPHA, color: COLOR.other });
  const reading = place(
    decimal(() => alpha.value, { digits: 2, size: 44, prefix: 'α = ', color: COLOR.other }),
    alphaBand,
    'left',
  );

  const base = b.ringOf(steeringBaseline, 'faint', 15);
  const point = b.dotOf(edited, COLOR.activation);
  const edit = b.arrowOf(steeringBaseline, edited, COLOR.other);
  s.add(heading(c.title), b.plane, base, edit, point, formula, knob.rail, knob.knob, reading);
  const move =
    (to, duration = 1.6) =>
    () =>
      s.play(alpha.to(to, { duration }));

  // The three rulers, and the shadow of the dot on each one.
  const rulers = {
    candidate: [
      b.rulerOf(candidate, COLOR.other, -0.3, 1.8, { width: 4 }),
      b.shadowOf(edited, candidate, COLOR.other),
    ],
    orthogonal: [
      b.rulerOf(orthogonal, COLOR.first, -0.3, 1.8, { width: 5 }),
      b.shadowOf(edited, orthogonal, COLOR.first),
    ],
    overlapping: [
      b.rulerOf(overlapping, COLOR.second, -0.3, 1.9, { width: 4 }),
      b.shadowOf(edited, overlapping, COLOR.second),
    ],
  };
  s.add(rulers.candidate, rulers.orthogonal, rulers.overlapping);

  // Beat 1. The three readouts as bars. The edit grows, and two of them grow with it.
  const bars = readoutBars(
    barsBand,
    [
      { name: 'Vertical ruler', color: COLOR.other, read: readout(candidate) },
      { name: 'Horizontal ruler', color: COLOR.first, read: readout(orthogonal) },
      { name: 'Tilted ruler', color: COLOR.second, read: readout(overlapping) },
    ],
    dotProduct(vec.add(steeringBaseline, vec.scale(steeringDirection, ALPHA)), candidate),
  );
  s.add(bars.names, bars.bars);
  c.on('steer-add', move(ALPHA, 2.4));
  c.on('steer-rewind', move(0, 1));
  c.on('steer-grow', move(ALPHA, 2.6));
  const angle = angleMark(b.P([0, 0]), b.P(candidate), b.P(overlapping), {
    radius: 120,
    color: COLOR.mark,
    width: 5,
  });
  const collateral = place(
    tex('\\Delta\\,\\text{readout} = \\alpha\\,(r \\cdot d_f)', { size: 44 }),
    noteBand,
  );
  c.show('steer-collateral', [angle, collateral]);
  const tests = [
    note('measure on held-out prompts'),
    chipRow(['the target behavior', 'what else moved'], { color: COLOR.mark, stroke: COLOR.mark }),
  ];
  place(column(tests, { gap: 'tight', align: 'center' }), noteBand);
  c.swap('steer-heldout', collateral, tests);
  // Beat 2. A clamp: what the edit asks for, and what the encoder reads back.
  const reader = b.rulerOf(READER, COLOR.mark, -0.3, 2.1, { width: 4, dash: [14, 10] });
  const reread = b.shadowOf(edited, READER, COLOR.mark);
  const cachedLabel = place(
    note(`Starting coefficient  ${cached.toFixed(2)}`),
    formulaBand,
    'bottom',
  );
  c.show('steer-clamp', cachedLabel);
  const asked = readoutBars(
    barsBand,
    [
      {
        name: 'requested coefficient',
        color: COLOR.other,
        read: () => dotProduct(READER, steeringBaseline) + alpha.value,
      },
      {
        name: 're-encoded coefficient',
        color: COLOR.mark,
        read: readout(READER),
      },
    ],
    cached + ALPHA * dotProduct(READER, steeringDirection),
  );
  c.swap(
    'steer-clamp',
    [
      ...rulers.orthogonal,
      ...rulers.overlapping,
      ...rulers.candidate,
      angle,
      tests,
      bars.names,
      bars.bars,
    ],
    [reader, reread, asked.names, asked.bars],
  );
  c.on('steer-clamp', move(0, 0.8));
  c.on('steer-smaller', move(0.7, 1.5));
  const gap = angleMark(b.P([0, 0]), b.P(steeringDirection), b.P(READER), {
    radius: 150,
    color: COLOR.mark,
    width: 5,
  });
  const differ = place(
    label('Encoder reads x₁ + 2x₂', { size: 43 }),
    noteBand,
  );
  c.show('steer-differ', [gap, differ]);
  const switches = place(note('a threshold can switch a slot on or off'), noteBand, 'bottom');
  c.show('steer-switch', switches);
  c.keep(b.plane);
}
