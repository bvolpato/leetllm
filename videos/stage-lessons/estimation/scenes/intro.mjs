// Scene `intro`: one sample of the week, and the choice that it must support.
//
// The picture: the covered queue of the week in the left panel, the empty tray at the left, and the
// rate axis with the 20% staffing line. 100 messages leave their cells of the queue and fill the
// tray. A sweep reviews them, the count becomes a fraction, and the fraction drops on the axis as
// one dot at 16%. A ghost of the dot then slides: another sample could land elsewhere.
import {
  beside,
  circle,
  clamp,
  column,
  dot,
  dynamic,
  group,
  indicate,
  lerp,
  line,
  linear,
  place,
  rect,
  row,
  smoothstep,
} from 'vizmatic/stage';
import { chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  HEAD_LEFT,
  POINT,
  READOUT,
  RIGHT_PANEL,
  SAMPLE,
  TAGGED,
  TRAY_HEAD,
  labelOf,
  mark,
  radiusOf,
  rateAxis,
  slots,
  weekQueue,
} from '../parts.mjs';

/** The part of the draw that one message takes for its way from the queue to the tray. */
const FLIGHT = 0.35;

export default function intro(s, c) {
  const count = SAMPLE.length,
    specialists = SAMPLE.filter((message) => message.specialist).length,
    rate = specialists / count;
  const axis = rateAxis(s);
  const places = slots(count, 10),
    radius = radiusOf(10);

  // The values of the scene. The picture follows them.
  const drawn = s.value(0); // the draw of the 100 messages, from 0 to 1
  const reviewed = s.value(0); // how many labels are reviewed
  const landed = s.value(0); // the way of the estimate from the fraction to the axis
  const ghost = s.value(rate), // where another sample could land
    ghostOn = s.value(0);
  const flight = (index) => clamp((drawn.value - ((1 - FLIGHT) * index) / (count - 1)) / FLIGHT);

  // The queue of the week. A cell lights when one of its messages leaves for the tray.
  const firstOf = new Map();
  const queue = weekQueue(s, {
    lit: (cell) => firstOf.has(cell) && flight(firstOf.get(cell)) > 0,
  });
  const starts = SAMPLE.map((message, index) => {
    const cell = queue.cellOf(message.id);
    if (!firstOf.has(cell)) firstOf.set(cell, index);
    return queue.place(cell);
  });
  const queueName = label("this week's queue");
  const covered = chip('covered', { color: 'dim' });
  const share = label('share: ?', { color: COLOR.specialist });
  place(row([queueName, covered]), HEAD_LEFT, 'left');
  beside(share, queueName, 'right');

  // The tray: 100 empty places, and the messages that arrive.
  const empty = group(...places.map((at) => mark('slot', radius).at(at)));
  const tray = dynamic(() =>
    SAMPLE.flatMap((message, index) => {
      const part = flight(index);
      if (part <= 0) return [];
      const eased = smoothstep(part);
      const kind = index < Math.floor(reviewed.value + 1e-6) ? labelOf(message) : 'selected';
      return [
        mark(kind, lerp(6, radius, eased)).at(
          lerp(starts[index][0], places[index][0], eased),
          lerp(starts[index][1], places[index][1], eased),
        ),
      ];
    }),
  );
  const trayEmpty = place(note('the review tray'), TRAY_HEAD);
  const trayFull = place(label('100 messages', { color: COLOR.sample }), TRAY_HEAD);

  // One message keeps its ID through the lesson.
  const tagged = places[TAGGED];
  const ring = circle(radius + 6, { stroke: COLOR.mark, width: 4, fill: null }).at(tagged);
  const id = beside(
    chip(SAMPLE[TAGGED].id, { color: COLOR.mark }),
    [tagged[0], READOUT.top],
    'under',
    'normal',
  );

  // The count of the tray: the pink labels over all the reviewed ones.
  const over = mono(String(specialists), { size: 64, color: COLOR.specialist }),
    under = mono(String(count), { size: 64, color: COLOR.sample });
  const stroke = rect(150, 5, { fill: 'ink', stroke: null, radius: 2 });
  place(column([over, stroke, under], { gap: 'tight', align: 'center' }), READOUT, 'top');

  // The estimate: it leaves the fraction and lands on the axis.
  const origin = stroke.center;
  const estimate = dynamic(() => {
    const part = smoothstep(landed.value);
    const marks = [];
    if (ghostOn.value > 0.02)
      marks.push(
        dot(POINT, COLOR.sample, { opacity: 0.4 * ghostOn.value }).at(
          axis.x(ghost.value),
          axis.rowY(0),
        ),
      );
    if (landed.value >= 1)
      marks.push(
        line([axis.x(rate), axis.rowY(0)], [axis.x(rate), axis.y], {
          stroke: COLOR.sample,
          width: 3,
          opacity: 0.5,
        }),
      );
    if (landed.value > 0)
      marks.push(
        dot(POINT, COLOR.sample).at(
          lerp(origin[0], axis.x(rate), part),
          lerp(origin[1], axis.rowY(0), part),
        ),
      );
    return marks;
  });
  const estimateName = beside(
    mono('16%', { color: COLOR.sample }),
    [axis.x(rate), axis.rowY(0)],
    'above',
    'normal',
  );

  // The rule of the team, and the choice that the viewer keeps in mind.
  const rule = row(
    Array.from({ length: 5 }, (_, index) => mark(index === 0 ? 'specialist' : 'regular', 26)),
    { gap: 'normal' },
  );
  const ruleName = label('1 in 5');
  const names = ['regular team', 'extra shift'];
  const choices = names.map((name) =>
    namedBox(name, { width: 250, height: 96, color: 'dim', group: names }),
  );
  const ask = label('Your call?', { color: COLOR.mark });
  place(
    column([rule, ruleName, row(choices), ask], { gap: 'normal', align: 'center' }),
    RIGHT_PANEL,
  );

  // The first picture: the covered queue, the empty tray, and the axis with the staffing line.
  s.add(
    heading(c.title),
    ...axis.standing,
    queue.cells,
    queueName,
    empty,
    trayEmpty,
    tray,
    estimate,
  );
  c.keep(axis.standing);

  c.show('one-in-five', [rule, ruleName, choices[0]]);
  c.show('extra-shift', choices[1]);
  c.show('would-you', ask);
  c.show('still-covered', covered);

  // The draw: each message leaves its cell and takes its place in the tray.
  c.on('sample-draw', () => s.play(drawn.to(1, { duration: 3, ease: linear })));
  c.swap('sample-draw', trayEmpty, trayFull, { after: true });
  c.show('same-chance', [ring, id]);
  c.hide('sample-label', [ring, id]);
  // The review: a sweep gives each message its label.
  const labelCue = c.cue('sample-label');
  c.on('sample-label', () =>
    s.play(reviewed.to(count, { duration: labelCue.end - labelCue.start, ease: linear })),
  );
  c.after('sample-label', () => reviewed.set(count));
  c.show('sample-label', over, { after: true });
  c.show('sample-fraction', [stroke, under]);

  // The estimate lands, and the choice comes back.
  c.after('estimate-lands', () => s.play(landed.to(1, { duration: 1.2 })));
  c.show('estimate-lands', estimateName, { after: true });
  c.swap('whole-queue', covered, share);
  c.on('opening-choice', () =>
    s.play(...choices.map((box) => indicate(box, { color: COLOR.mark }))),
  );
  c.on('could-move', () => {
    s.play(ghostOn.to(1, { duration: 0.3 }), ghost.to(0.1, { duration: 0.8 }));
    s.play(ghost.to(0.23, { duration: 1 }));
    s.play(ghost.to(rate, { duration: 0.5 }), ghostOn.to(0, { duration: 0.5 }));
  });
}
