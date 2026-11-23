// Scene `resampling`: the bootstrap copies the labels that we have.
//
// The picture: our 100 labels in the tray, and an empty resample in the left panel. A draw copies a
// label from the tray: the source stays, and one pink message lands two times. A complete resample
// gives one fraction, and the fraction drops into its bin on the axis. 400 resamples build a
// histogram there, and a bracket closes in on its middle. With ten clean labels, every resample is
// clean, and the histogram is one bar at 0%.
import {
  beside,
  boxOf,
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
  text,
} from 'vizmatic/stage';
import {
  bootstrapRange,
  bootstrapRates,
  bootstrapSamples,
} from '../../../films/estimation/fixtures.mjs';
import { bootstrapBin } from '../../../films/estimation/model.mjs';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  HEAD_LEFT,
  HEAD_RIGHT,
  LEFT_PANEL,
  READOUT,
  RIGHT_PANEL,
  ROWS,
  SAMPLE,
  TAGGED,
  TRAY_GRID,
  TRAY_HEAD,
  labelOf,
  mark,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The labels of the clean sample of the last beat. */
const TEN = 10;
/** The resamples that drop into the histogram one by one, before the fast ones. */
const SLOW = 3;

export default function resampling(s, c) {
  const axis = rateAxis(s);
  const labels = SAMPLE.length,
    resamples = bootstrapSamples.length;

  // The two trays: our labels at the left, and the resample in a square of the left panel.
  const square = LEFT_PANEL.inset((LEFT_PANEL.width - LEFT_PANEL.height) / 2 + 10, 'none');
  const ours = slots(labels, 10),
    copies = slots(labels, 10, square);
  const radius = radiusOf(10),
    copyRadius = radiusOf(10, square);
  const tenRoom = TRAY_GRID.inset('normal', 'loose'),
    tenCopyRoom = square.inset('normal', 'loose');
  const tenOurs = slots(TEN, 5, tenRoom),
    tenCopies = slots(TEN, 5, tenCopyRoom);

  // The values of the scene.
  const draws = s.value(0); // the draws of the first resample, from 0 to 100
  const firstFlight = s.value(0), // the two copies of the tagged message on their way
    secondFlight = s.value(0);
  const deposited = s.value(0); // the resamples that are in the histogram. A part is one on its way
  const closed = s.value(0); // the bracket closes in on the middle of the histogram
  const clean = s.value(0); // from our 100 labels to ten clean labels
  const zero = s.value(0); // the complete zero-only result is available
  const zeroReveal = s.value(0); // opacity of its fixed histogram geometry
  const fallen = s.value(0); // the bracket of the clean labels has no width

  const view = () => Math.min(resamples - 1, Math.floor(deposited.value + 1e-6));
  const tray = dynamic(() => {
    const marks = [];
    if (clean.value < 1)
      SAMPLE.forEach((message, index) =>
        marks.push(mark(labelOf(message), radius, 1 - clean.value).at(ours[index])),
      );
    if (clean.value > 0)
      tenOurs.forEach((at) =>
        marks.push(mark('regular', radiusOf(5, tenRoom), clean.value).at(at)),
      );
    return marks;
  });
  const emptySlots = group(...copies.map((at) => mark('slot', copyRadius).at(at)));
  const resample = dynamic(() => {
    const marks = [];
    if (clean.value < 1) {
      const picks = bootstrapSamples[view()];
      const shown = view() === 0 ? draws.value : labels;
      picks.forEach((source, slot) => {
        if (slot >= shown) return;
        // The first two draws fly from their source, which is the tagged message both times.
        const part = view() === 0 && slot < 2 ? [firstFlight, secondFlight][slot].value : 1;
        const eased = smoothstep(part);
        marks.push(
          mark(labelOf(SAMPLE[source]), lerp(radius, copyRadius, eased), 1 - clean.value).at(
            lerp(ours[source][0], copies[slot][0], eased),
            lerp(ours[source][1], copies[slot][1], eased),
          ),
        );
      });
    }
    if (clean.value > 0)
      tenCopies.forEach((at, index) => {
        const part = clamp(zero.value * 2 - index / TEN);
        marks.push(
          mark(part > 0 ? 'regular' : 'slot', radiusOf(5, tenCopyRoom), clean.value).at(at),
        );
      });
    return marks;
  });

  // The count of the resample that is in the left panel.
  const count = () => Math.round(bootstrapRates[view()] * labels);
  const over = mono('00', { size: 64 }),
    under = mono(String(labels), { size: 64, color: COLOR.sample });
  const stroke = rect(150, 5, { fill: 'ink', stroke: null, radius: 2 });
  const equals = mono('= 00%', { size: 64 });
  const fraction = column([over, stroke, under], { gap: 'tight', align: 'center' });
  place(row([fraction, equals], { gap: 'wide', align: 'center' }), RIGHT_PANEL);
  const readoutBounds = boxOf([over, stroke, under, equals]);
  const live = (slot, read, color) =>
    dynamic(() => text(read(), { font: 'mono', size: 64, color }).at(slot.get('x'), slot.get('y')));
  const liveCount = live(over, () => String(count()).padStart(2), COLOR.specialist),
    liveRate = live(equals, () => `= ${String(count()).padStart(2)}%`, COLOR.sample);
  const total = mono('000');
  const totalRow = place(row([total, label('histogram entries')], { gap: 'tight' }), HEAD_RIGHT, 'right');
  const liveTotal = dynamic(() =>
    text(String(Math.floor(deposited.value + 1e-6)).padStart(3), {
      font: 'mono',
      size: 40,
    }).at(total.get('x'), total.get('y')),
  );

  // The histogram on the axis: one entry for each resample, in the bin of its fraction.
  const BAR = 24;
  const histogram = dynamic(() => {
    const marks = [];
    const landed = Math.floor(deposited.value + 1e-6),
      part = deposited.value - landed;
    const bins = new Map();
    for (const rate of bootstrapRates.slice(0, landed)) {
      const bin = bootstrapBin(rate);
      bins.set(bin, (bins.get(bin) ?? 0) + 1);
    }
    const tallest = Math.max(1, ...bins.values());
    // One entry is as high as a bar is wide, until the highest bin fills the room over the axis.
    const room = ROWS.height - 40;
    const unit = Math.min(BAR, room / tallest);
    const keep = clean.value > 0 ? 0 : 1;
    for (const [bin, entries] of bins) {
      const height = entries * unit * keep;
      if (height > 0.5)
        marks.push(
          rect(BAR, height, { fill: COLOR.sample, stroke: null, radius: 3, opacity: 0.9 }).at(
            axis.x(bin / 100),
            axis.y - height / 2,
          ),
        );
    }
    if (zero.value > 0)
      marks.push(
        rect(BAR, room, { fill: COLOR.sample, stroke: null, radius: 3, opacity: zeroReveal.value }).at(
          axis.x(0) + BAR / 2,
          axis.y - room / 2,
        ),
      );
    // The entry on its way: from the fraction of the resample down to the top of its bin.
    if (part > 0 && landed < SLOW) {
      const bin = bootstrapBin(bootstrapRates[landed]);
      const eased = smoothstep(part);
      const from = [equals.get('x'), readoutBounds.bottom + BAR + 16],
        to = [axis.x(bin / 100), axis.y - ((bins.get(bin) ?? 0) + 0.5) * unit];
      marks.push(
        rect(BAR, unit, { fill: COLOR.mark, stroke: null, radius: 3 }).at(
          lerp(from[0], to[0], eased),
          lerp(from[1], to[1], eased),
        ),
      );
    }
    return marks;
  });
  const sorted = [...bootstrapRates].sort((a, b) => a - b);
  const bracket = dynamic(() => {
    const part = smoothstep(closed.value);
    const zeroCase = clean.value > 0;
    if (zeroCase && fallen.value < 0.02) return [];
    const low = zeroCase ? 0 : lerp(sorted[0], bootstrapRange[0], part),
      high = zeroCase ? 0 : lerp(sorted.at(-1), bootstrapRange[1], part);
    const opacity = zeroCase ? fallen.value : 1;
    const at = axis.rowY(2),
      color = zeroCase ? COLOR.failure : COLOR.mark;
    return [
      line([axis.x(low), at], [axis.x(high), at], { stroke: color, width: 6, opacity }),
      ...[low, high].map((end) =>
        line([axis.x(end), at - 14], [axis.x(end), at + 14], { stroke: color, width: 4, opacity }),
      ),
    ];
  });
  const bracketName = beside(
    note('percentile interval', { color: COLOR.mark }),
    [axis.x(bootstrapRange[1]), axis.rowY(2)],
    'right',
    'normal',
  );

  // The names, and the message that the film follows by its ID.
  const trayName = place(label('our 100 labels', { color: COLOR.sample }), TRAY_HEAD);
  const cleanName = place(label('10 clean labels', { color: COLOR.sample }), TRAY_HEAD);
  const resampleName = place(label('one resample'), HEAD_LEFT, 'left');
  const source = circle(radius + 6, { stroke: COLOR.mark, width: 4, fill: null }).at(ours[TAGGED]);
  const id = beside(
    chip(SAMPLE[TAGGED].id, { color: COLOR.mark }),
    [ours[TAGGED][0], READOUT.top],
    'under',
    'normal',
  );
  const twice = [0, 1].map((slot) =>
    circle(copyRadius + 5, { stroke: COLOR.mark, width: 4, fill: null }).at(copies[slot]),
  );
  const ourFrame = rect(TRAY_GRID.width, TRAY_GRID.height, {
    stroke: COLOR.mark,
    width: 4,
    fill: null,
    radius: 16,
  }).at(TRAY_GRID.cx, TRAY_GRID.cy);

  // The first picture: our labels, the empty resample, and the axis.
  s.add(heading(c.title), tray, trayName, emptySlots, resample, histogram);
  c.take(axis.standing);
  c.keep(axis.standing);

  c.show('reuse', [resampleName, source, id]);
  // The same pink message arrives two times, and its source stays.
  c.on('bootstrap-duplicate', () => {
    draws.set(1);
    s.play(firstFlight.to(1, { duration: 1 }));
    draws.set(2);
    s.play(secondFlight.to(1, { duration: 1 }));
  });
  c.show('bootstrap-duplicate', twice, { after: true });
  c.on('stays-put', () => s.play(indicate(source, { scale: 1.5 })));
  c.hide('bootstrap-complete', twice);
  c.on('bootstrap-complete', () => s.play(draws.to(labels, { duration: 1.4, ease: linear })));
  c.show('count-outcomes', [liveCount, stroke, under], { after: true });
  c.show('one-fraction', liveRate, { after: true });

  // One entry for each resample: three slow ones, and then the rest.
  c.hide('bootstrap-histogram', [source, id]);
  c.on('bootstrap-histogram', () => s.play(deposited.to(1, { duration: 1.2, ease: linear })));
  c.show('bootstrap-histogram', [liveTotal, ...totalRow.nodes.filter((node) => node !== total)]);
  c.on('repeat', () => {
    for (let next = 2; next <= SLOW; next++)
      s.play(deposited.to(next, { duration: 1.3, ease: linear }));
  });
  c.on('adds-one', () => s.play(deposited.to(resamples, { duration: 2.2, ease: linear })));
  c.show('spread', bracket, { after: true });
  c.show('spread', bracketName, { after: true, lead: -1.4 });
  c.after('spread', () => s.play(closed.to(1, { duration: 1.4 })));
  c.show('stand-in', ourFrame);
  c.hide('refine', ourFrame);
  c.on('refine', () => s.play(indicate(trayName, { color: COLOR.mark })));

  // Ten clean labels: every resample is clean, and the histogram is one bar at 0%.
  c.hide('ten-zeros', [liveCount, stroke, under, liveRate, emptySlots, bracketName, liveTotal, ...totalRow.nodes.filter((node) => node !== total)]);
  c.on('ten-zeros', () => s.play(clean.to(1, { duration: 0.8 })));
  c.swap('ten-zeros', trayName, cleanName);
  c.after('bootstrap-zero', () => {
    zero.set(1);
    s.play(zeroReveal.to(1, { duration: 0.4 }));
  });
  c.show('bootstrap-zero', [liveTotal, ...totalRow.nodes.filter((node) => node !== total)], { after: true });
  c.after('collapses', () => s.play(fallen.to(1, { duration: 0.4 })));
  const only = place(label('no pink label to copy', { color: COLOR.failure }), RIGHT_PANEL);
  c.show('recombine', only, { after: true });
  const thread = (room) => {
    const three = slots(TEN, 5, room).slice(0, 3);
    const pitch = three[1][0] - three[0][0];
    return rect(pitch * 3 - 8, pitch - 8, {
      stroke: COLOR.mark,
      width: 4,
      fill: null,
      radius: 18,
    }).at(three[1]);
  };
  const threadName = beside(
    note('one thread stays one unit', { color: COLOR.mark }),
    [tenCopyRoom.cx, slots(TEN, 5, tenCopyRoom)[5][1]],
    'under',
    'loose',
  );
  c.show('grouped', [thread(tenRoom), thread(tenCopyRoom), threadName]);
}
