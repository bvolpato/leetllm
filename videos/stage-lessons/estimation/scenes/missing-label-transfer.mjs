// Scene `missing-label-transfer`: the viewer predicts the bounds of a new sample.
//
// The picture: a tray of 60 selected labels. 45 get an answer, and 15 stay unknown. Two questions
// stand in the panels. Then the answers arrive: the resolved labels alone give 20%. For all 60, the
// unknown ones turn pink one by one, and the estimate slides from 15% to 40% and leaves the bar of
// its bounds.
import {
  beside,
  circle,
  column,
  dynamic,
  grid,
  indicate,
  linear,
  place,
  rect,
  row,
  text,
} from 'vizmatic/stage';
import { missingLabelBounds } from '../../../films/estimation/model.mjs';
import { display, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  LEFT_PANEL,
  POINT,
  READOUT,
  RIGHT_PANEL,
  THRESHOLD,
  TRAY_HEAD,
  mark,
  percent,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The new sample: 60 selected, 45 resolved, 9 of them positive. */
const SELECTED = 60,
  RESOLVED = 45,
  POSITIVE = 9;
/** A specialist case at each seventh place of the tray, so the nine are spread. */
const EVERY = 7,
  OFFSET = 3;

export default function missingLabelTransfer(s, c) {
  const axis = rateAxis(s);
  const bounds = missingLabelBounds(SELECTED, RESOLVED, POSITIVE);
  const unknown = bounds.unknown;

  // The tray: nine specialist cases at spread places, and the last 15 regular places stay unknown.
  const specialist = (index) => index % EVERY === OFFSET;
  const regular = Array.from({ length: SELECTED }, (_, index) => index).filter(
    (index) => !specialist(index),
  );
  const unknownRank = new Map(regular.slice(-unknown).map((index, rank) => [index, rank]));
  const places = slots(SELECTED, 10),
    radius = radiusOf(10);

  // The values of the scene.
  const answered = s.value(0); // the places of the tray that showed their answer, or their lack of one
  const flipped = s.value(0); // the unknown labels that count as specialist cases now
  const completed = s.value(0); // retain the completed bounds when the unknown labels return
  const sliding = s.value(0); // the estimate of all 60 is on the axis

  const flippedCount = () => Math.max(0, Math.min(unknown, Math.floor(flipped.value + 1e-6)));

  const tray = dynamic(() =>
    places.map((at, index) => {
      if (index >= answered.value) return mark('selected', radius).at(at);
      const rank = unknownRank.get(index);
      if (rank !== undefined)
        return mark(rank < flippedCount() ? 'specialist' : 'unknown', radius).at(at);
      return mark(specialist(index) ? 'specialist' : 'regular', radius).at(at);
    }),
  );
  const trayName = place(label('60 selected', { color: COLOR.sample }), TRAY_HEAD);
  const counts = [
    [mono(String(POSITIVE), { color: COLOR.specialist }), label('positive')],
    [mono(String(RESOLVED - POSITIVE), { color: COLOR.sample }), label('negative')],
    [mono(String(unknown), { color: 'dim' }), label('unknown')],
  ];
  place(
    grid(counts.flat(), { columns: 2, gap: 'tight', align: ['right', 'left'] }),
    READOUT,
    'top',
  );
  const rings = [...unknownRank.keys()].map((index) =>
    circle(radius + 4, { stroke: COLOR.mark, width: 3, fill: null }).at(places[index]),
  );

  // The two questions, each in its panel: a fraction, and a result that waits.
  const fraction = (over, under) => {
    const stroke = rect(170, 5, { fill: 'ink', stroke: null, radius: 2 });
    return {
      over,
      under,
      stroke,
      block: column([over, stroke, under], { gap: 'tight', align: 'center' }),
    };
  };
  const only = fraction(
    mono(String(POSITIVE), { size: 64, color: COLOR.specialist }),
    mono(String(RESOLVED), { size: 64, color: COLOR.sample }),
  );
  // The count of all 60 is a question at first, and then it follows the unknown labels.
  const allSlot = mono('00', { size: 64 }),
    allAsk = mono('?', { size: 64, color: COLOR.mark });
  const all = fraction(
    [allSlot, allAsk],
    mono(String(SELECTED), { size: 64, color: COLOR.sample }),
  );
  const ask = [display('?', { color: COLOR.mark }), display('?', { color: COLOR.mark })];
  const answers = [
    mono(`= ${percent(bounds.resolvedRate)}`, { size: 56, color: COLOR.sample }),
    mono(`${percent(bounds.low)} to ${percent(bounds.high)}`, { size: 48, color: COLOR.mark }),
  ];
  const titles = [label('resolved cases only'), label('all 60 selected')];
  place(
    column([titles[0], only.block, [ask[0], answers[0]]], { gap: 'normal', align: 'center' }),
    LEFT_PANEL,
  );
  place(
    column([titles[1], all.block, [ask[1], answers[1]]], { gap: 'normal', align: 'center' }),
    RIGHT_PANEL,
  );
  const liveAll = dynamic(() =>
    text(String(POSITIVE + flippedCount()).padStart(2), {
      font: 'mono',
      size: 64,
      color: COLOR.specialist,
    }).at(allSlot.get('x'), allSlot.get('y')),
  );

  // The axis: the fraction of the resolved labels, and the estimate of all 60 with its bounds.
  const resolvedPoint = axis.point(() => bounds.resolvedRate, { row: 1 });
  const resolvedName = beside(
    note('resolved cases only'),
    [axis.x(bounds.resolvedRate), axis.rowY(1)],
    'right',
    'normal',
  );
  const estimate = axis.point(
    () => (sliding.value > 0.5 ? (POSITIVE + flippedCount()) / SELECTED : null),
    { stem: true },
  );
  const range = axis.bar(
    () =>
      flippedCount() > 0 || completed.value > 0.5
        ? {
            low: bounds.low,
            high: bounds.low + (completed.value > 0.5 ? unknown : flippedCount()) / SELECTED,
          }
        : null,
    { color: COLOR.mark },
  );
  const ends = [
    beside(
      mono(percent(bounds.low), { color: COLOR.mark }),
      [axis.x(bounds.low), axis.rowY(0)],
      'above',
      'normal',
    ),
    beside(
      mono(percent(bounds.high), { color: COLOR.mark }),
      [axis.x(bounds.high), axis.rowY(0)],
      'above',
      'normal',
      'right',
    ),
  ];
  const kind = beside(
    label('bounds from missing labels', { color: COLOR.mark }),
    [axis.x(THRESHOLD), axis.rowY(2)],
    'right',
    'normal',
  );

  // The first picture: 60 selected places with no answer yet, and the axis.
  s.add(heading(c.title), tray, trayName);
  c.take([axis.rule, axis.title]);
  s.add(axis.threshold);
  c.keep(axis.standing);

  // 45 answers arrive, and 15 places stay unknown.
  c.on('sixty', () => s.play(indicate(trayName, { color: COLOR.mark })));
  c.on('resolved', () => s.play(answered.to(SELECTED, { duration: 2, ease: linear })));
  c.show('resolved', [...counts[0], ...counts[1]], { after: true });
  c.show('unknown', counts[2], { after: true });
  c.show('predict', [
    titles[0],
    only.block,
    ask[0],
    titles[1],
    allAsk,
    all.stroke,
    all.under,
    ask[1],
  ]);
  c.show('keep-visible', rings);

  // The answers.
  c.swap('resolved-answer', ask[0], [answers[0], resolvedPoint, resolvedName], { after: true });
  c.swap('bounds', allAsk, liveAll, { after: true });
  c.on('high-bound', () => s.play(indicate(all.under, { scale: 1, color: COLOR.mark })));
  c.after('bounds', () => {
    completed.set(1);
    sliding.set(1);
    s.play(flipped.to(unknown, { duration: 1.6, ease: linear }));
  });
  c.show('bounds', [range, estimate], { after: true });
  c.hide('bounds', rings, { after: true });
  c.swap('bounds', ask[1], [answers[1], ...ends], { after: true });
  c.show('not-ci', kind);
  c.on('repair', () => s.play(flipped.to(0, { duration: 1 })));
  c.show('repair', rings);
}
