// Scene `sample-design`: a sample that leaves two slices out, and the mix that repairs the estimate.
//
// The picture: a toy queue of 1,000 messages, one dot for each, in three slices. Only routine dots
// go to the tray without replacement. The uncorrected binomial Wilson illustration tightens at
// 12%; it is not a finite-queue confidence interval. Then the pink dots of each slice
// leave the queue and gather in the right panel: 84, 50 and 42. They join into one block of 176 per
// 1,000, which is 17.6% on the axis, outside the interval of the tray.
import {
  arrow,
  assertEqual,
  beside,
  between,
  boxOf,
  clamp,
  column,
  dot,
  dynamic,
  fade,
  group,
  indicate,
  lerp,
  line,
  linear,
  place,
  recolor,
  rect,
  row,
  seededRandom,
  smoothstep,
  text,
} from 'vizmatic/stage';
import { sliceModel } from '../../../films/estimation/fixtures.mjs';
import { wilson } from '../../../films/estimation/model.mjs';
import { heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  HEAD_LEFT,
  HEAD_RIGHT,
  LEFT_PANEL,
  POINT,
  READOUT,
  RIGHT_PANEL,
  ROWS,
  TRAY_HEAD,
  mark,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The messages of the toy queue, and the dots in one row of it. */
const MESSAGES = 1000,
  COLUMNS = 25;
/** The room between two slices, in rows of dots. */
const BETWEEN = 1.5;
/** The dots in one row of the block of each slice, and of the joined block. */
const BLOCK = [12, 10, 7],
  JOINED = 16;
/** The pitch of the dots of a block. */
const BLOCK_PITCH = 16;
/** The labels of the tray: 100 at first, and 400 at the end, in steps of 25. */
const FIRST = 100,
  LAST = 400,
  STEP = 25;

export default function sampleDesign(s, c) {
  const axis = rateAxis(s);
  const routine = sliceModel[0];
  const total = sliceModel.reduce((sum, slice) => sum + slice.expected, 0);
  const wholeRate = total / MESSAGES;

  // The toy queue: one dot for each message, slice under slice. The pink ones are at mixed places.
  const rows = MESSAGES / COLUMNS + BETWEEN * (sliceModel.length - 1);
  const room = LEFT_PANEL.inset('none', 'tight');
  const pitch = room.height / rows,
    small = pitch * 0.38;
  const dots = [];
  const sliceBox = [];
  let top = room.top;
  sliceModel.forEach((slice, index) => {
    const size = Math.round(slice.share * MESSAGES);
    const random = seededRandom(31 + index);
    const order = Array.from({ length: size }, (_, at) => at);
    for (let at = size - 1; at > 0; at--) {
      const other = Math.floor(random() * (at + 1));
      [order[at], order[other]] = [order[other], order[at]];
    }
    const pink = new Set(order.slice(0, slice.expected));
    let rank = 0;
    for (let at = 0; at < size; at++)
      dots.push({
        slice: index,
        home: [
          LEFT_PANEL.left + pitch * ((at % COLUMNS) + 0.5),
          top + pitch * (Math.floor(at / COLUMNS) + 0.5),
        ],
        pink: pink.has(at),
        rank: pink.has(at) ? rank++ : -1,
      });
    const height = (size / COLUMNS) * pitch;
    sliceBox.push({ top, bottom: top + height, cy: top + height / 2 });
    top += height + BETWEEN * pitch;
  });
  const queueRight = LEFT_PANEL.left + pitch * COLUMNS;

  // The block of each slice in the right panel, and the place of each pink dot in the joined block.
  const blockWidth = BLOCK.reduce((sum, columns) => sum + columns * BLOCK_PITCH, 0),
    blockGap = (RIGHT_PANEL.width - blockWidth) / (BLOCK.length + 1);
  const blockLeft = [];
  BLOCK.reduce((left, columns) => {
    blockLeft.push(left);
    return left + columns * BLOCK_PITCH + blockGap;
  }, RIGHT_PANEL.left + blockGap);
  const blockTop = RIGHT_PANEL.inset('none', 'normal').top;
  const inBlock = (slice, rank) => [
    blockLeft[slice] + BLOCK_PITCH * ((rank % BLOCK[slice]) + 0.5),
    blockTop + BLOCK_PITCH * (Math.floor(rank / BLOCK[slice]) + 0.5),
  ];
  const before = sliceModel.map((_, index) =>
    sliceModel.slice(0, index).reduce((sum, slice) => sum + slice.expected, 0),
  );
  const joinedLeft = RIGHT_PANEL.cx - (JOINED * BLOCK_PITCH) / 2;
  const inJoined = (slice, rank) => {
    const at = before[slice] + rank;
    return [
      joinedLeft + BLOCK_PITCH * ((at % JOINED) + 0.5),
      blockTop + BLOCK_PITCH * (Math.floor(at / JOINED) + 0.5),
    ];
  };
  const joinedBottom = blockTop + Math.ceil(total / JOINED) * BLOCK_PITCH;

  // The sample of the tray: routine messages only, with the share of specialist cases of that slice.
  const routineDots = dots.filter((entry) => entry.slice === 0);
  const perStep = Math.round(routine.rate * STEP);
  const specialists = routineDots.filter((entry) => entry.pink),
    others = routineDots.filter((entry) => !entry.pink);
  // Three specialist cases in each 25 labels, at spread places.
  const spots = new Set(
    Array.from({ length: perStep }, (_, k) => Math.floor(((k + 0.5) * STEP) / perStep)),
  );
  const sample = [];
  let nextSpecialist = 0,
    nextOther = 0;
  for (let at = 0; at < LAST; at++) {
    const specialist = spots.has(at % STEP);
    const from = specialist ? specialists[nextSpecialist++] : others[nextOther++];
    sample.push({ source: from, home: from.home, specialist });
  }
  const trayFirst = slots(FIRST, 10),
    trayLast = slots(LAST, 20);
  assertEqual(routineDots.length, 700, 'routine messages in the fixed queue');
  assertEqual(new Set(sample.map((entry) => entry.source)).size, LAST, 'distinct sampled messages');

  // A proportional sample of half the toy queue has exact integer slice counts.
  const repairedSize = MESSAGES / 2;
  const repairedSample = sample.slice(0, repairedSize * routine.share).map((entry) => entry.source);
  for (let slice = 1; slice < sliceModel.length; slice++) {
    const size = repairedSize * sliceModel[slice].share;
    const positive = size * sliceModel[slice].rate;
    repairedSample.push(
      ...dots.filter((entry) => entry.slice === slice && entry.pink).slice(0, positive),
      ...dots.filter((entry) => entry.slice === slice && !entry.pink).slice(0, size - positive),
    );
  }
  const repairedPlaces = slots(repairedSize, 25);
  const repairedIndex = new Map(repairedSample.map((entry, index) => [entry, index]));
  const repairedPositive = repairedSample.filter((entry) => entry.pink).length;
  assertEqual(repairedSample.length, repairedSize, 'proportional sample size');
  assertEqual(
    repairedPositive / repairedSize,
    wholeRate,
    'the repaired sample matches the target mix',
  );
  // The values of the scene.
  const selected = s.value(0); // the routine slice is the only one that the sample takes
  const drawn = s.value(0); // the first 100 routine messages go to the tray
  const more = s.value(0); // the next 300 routine messages go to the tray
  const sent = sliceModel.map(() => s.value(0)); // the pink dots of a slice go to their block
  const joined = s.value(0); // the three blocks join
  const wrong = s.value(0); // the interval of the tray is the answer to another question
  const repaired = s.value(0); // the selection takes all three slices

  const flight = (value, index, count, part = 0.4) =>
    clamp((value - ((1 - part) * index) / Math.max(1, count - 1)) / part);
  const sampleProgress = (index) =>
    index < FIRST
      ? flight(drawn.value, index, FIRST)
      : flight(clamp((more.value - 1 / 6) / (5 / 6)), index - FIRST, LAST - FIRST);
  const sourceIndex = new Map(sample.map((entry, index) => [entry.source, index]));
  const queue = dynamic(() => {
    const marks = [];
    for (const entry of dots) {
      const index = sourceIndex.get(entry);
      const previous = index === undefined ? 0 : smoothstep(sampleProgress(index));
      const taken = lerp(previous, repairedIndex.has(entry) ? 1 : 0, smoothstep(repaired.value));
      const available = 1 - 0.88 * taken;
      if (entry.pink) {
        const count = sliceModel[entry.slice].expected;
        const go = smoothstep(flight(sent[entry.slice].value, entry.rank, count));
        const join = smoothstep(joined.value);
        const block = inBlock(entry.slice, entry.rank),
          joint = inJoined(entry.slice, entry.rank);
        const to = [lerp(block[0], joint[0], join), lerp(block[1], joint[1], join)];
        marks.push(
          dot(lerp(small, BLOCK_PITCH * 0.38, go), COLOR.specialist, {
            opacity: lerp(available, 1, go),
          }).at(lerp(entry.home[0], to[0], go), lerp(entry.home[1], to[1], go)),
        );
        if (go > 0) marks.push(dot(small, COLOR.specialist, { opacity: 0.25 }).at(entry.home));
      } else {
        const lit = entry.slice === 0 ? selected.value : repaired.value;
        marks.push(
          dot(small, lit > 0.5 ? COLOR.sample : 'dim', {
            opacity: (lit > 0.5 ? 0.75 : 0.5) * available,
          }).at(entry.home),
        );
      }
    }
    return marks;
  });
  const tray = dynamic(() => {
    const marks = [];
    const repair = smoothstep(repaired.value);
    if (repair > 0) {
      sample.forEach((entry, index) => {
        if (repairedIndex.has(entry.source)) return;
        const from = trayLast[index];
        marks.push(
          mark(entry.specialist ? 'specialist' : 'regular', radiusOf(20), 1 - repair).at(
            lerp(from[0], entry.home[0], repair),
            lerp(from[1], entry.home[1], repair),
          ),
        );
      });
      repairedSample.forEach((entry, index) => {
        const previous = sourceIndex.get(entry);
        const from =
          previous === undefined
            ? entry.pink
              ? inJoined(entry.slice, entry.rank)
              : entry.home
            : trayLast[previous];
        const to = repairedPlaces[index];
        marks.push(
          mark(
            'unknown',
            lerp(previous === undefined ? small : radiusOf(20), radiusOf(25), repair),
          ).at(lerp(from[0], to[0], repair), lerp(from[1], to[1], repair)),
        );
      });
      return marks;
    }
    const grow = smoothstep(clamp(more.value * 6));
    const radius = lerp(radiusOf(10), radiusOf(20), grow);
    sample.forEach((entry, index) => {
      const part = sampleProgress(index);
      if (part <= 0) return;
      const eased = smoothstep(part);
      const to =
        index < FIRST
          ? [
              lerp(trayFirst[index][0], trayLast[index][0], grow),
              lerp(trayFirst[index][1], trayLast[index][1], grow),
            ]
          : trayLast[index];
      marks.push(
        mark(entry.specialist ? 'specialist' : 'regular', lerp(small, radius, eased)).at(
          lerp(entry.home[0], to[0], eased),
          lerp(entry.home[1], to[1], eased),
        ),
      );
    });
    return marks;
  });
  // The frame of the selection: around the routine slice, and then around the whole queue.
  const frame = dynamic(() => {
    if (selected.value < 0.02) return [];
    const bottom = lerp(sliceBox[0].bottom, sliceBox.at(-1).bottom, smoothstep(repaired.value));
    return rect(queueRight - LEFT_PANEL.left + 12, bottom - sliceBox[0].top + 12, {
      stroke: COLOR.sample,
      width: 4,
      fill: null,
      radius: 8,
      opacity: selected.value,
    }).at((queueRight + LEFT_PANEL.left) / 2, (bottom + sliceBox[0].top) / 2);
  });

  // The names of the queue and of its slices.
  const queueName = place(label('fixed queue: 1,000', { size: 34 }), HEAD_LEFT, 'left');
  const names = sliceModel.map((slice, index) =>
    beside(
      label(`${slice.name.toLowerCase()}: ${Math.round(slice.share * MESSAGES)}`, {
        size: 30,
      }),
      [queueRight, sliceBox[index].cy],
      'right',
      'normal',
    ),
  );
  const trayName = place(
    label('routine · no replacement', { color: COLOR.sample, size: 30 }),
    TRAY_HEAD,
  );
  // The tray is empty at first, and two slices stay out of it.
  const emptyTray = group(...trayFirst.map((at) => mark('slot', radiusOf(10)).at(at)));
  const emptyName = place(note('the review tray'), TRAY_HEAD);
  const leftOut = sliceModel.slice(1).map((slice) =>
    namedBox(slice.name.toLowerCase(), {
      width: 250,
      height: 96,
      color: 'dim',
      group: ['account access'],
    }),
  );
  const leftOutName = label('never in the tray', { color: COLOR.failure });
  place(
    column([leftOutName, row(leftOut, { gap: 'normal' })], { gap: 'normal', align: 'center' }),
    RIGHT_PANEL,
  );

  // The count of the tray and its interval, which follow the labels in the tray.
  const arrived = (value, count) =>
    value < 0.4
      ? 0
      : Math.min(count, Math.floor(((value - 0.4) * (count - 1)) / 0.6 + 1 + 1e-6));
  const labels = () =>
    arrived(drawn.value, FIRST) +
    arrived(clamp((more.value - 1 / 6) / (5 / 6)), LAST - FIRST);
  const positiveLabels = () => sample.slice(0, labels()).filter((entry) => entry.specialist).length;
  const over = mono('00', { size: 64 }),
    under = mono('000', { size: 64 });
  const stroke = rect(150, 5, { fill: 'ink', stroke: null, radius: 2 });
  place(column([over, stroke, under], { gap: 'tight', align: 'center' }), READOUT, 'top');
  const live = (slot, read, color) =>
    dynamic(() =>
      text(String(read()), { font: 'mono', size: 64, color }).at(slot.get('x'), slot.get('y')),
    );
  const fraction = [
    live(over, positiveLabels, COLOR.specialist),
    stroke,
    live(under, labels, COLOR.sample),
  ];
  const interval = dynamic(() => {
    const now = labels();
    if (now === 0) return [];
    const range = wilson(positiveLabels(), now);
    const color = wrong.value > 0.5 ? COLOR.failure : COLOR.accepted,
      at = axis.rowY(0);
    return [
      line([axis.x(range.low), at], [axis.x(range.high), at], { stroke: color, width: 10 }),
      ...[range.low, range.high].map((end) =>
        line([axis.x(end), at - 16], [axis.x(end), at + 16], { stroke: color, width: 4 }),
      ),
      dot(POINT, COLOR.sample).at(axis.x(positiveLabels() / now), at),
    ];
  });
  const rateName = beside(
    mono('12%', { color: COLOR.specialist, size: 30 }),
    names[0],
    'under',
    'tight',
  );
  const intervalName = beside(
    column([note('binomial Wilson'), note('uncorrected illustration')], {
      gap: 'tight',
      align: 'center',
    }),
    under,
    'under',
    'normal',
  );

  // The contributions of the slices, and their sum.
  const perName = place(note('specialist cases per 1,000 messages'), HEAD_RIGHT, 'right');
  const parts = sliceModel.map((slice, index) =>
    beside(
      mono(String(slice.expected), { color: COLOR.specialist }),
      [
        RIGHT_PANEL.left + ((index + 0.5) * RIGHT_PANEL.width) / sliceModel.length,
        joinedBottom + 100,
      ],
      'under',
      'tight',
    ),
  );
  const products = sliceModel.map((slice, index) => {
    const population = Math.round(slice.share * MESSAGES);
    assertEqual(population * slice.rate, slice.expected, `${slice.name} contribution`);
    return beside(
      note(`${population} × ${Math.round(slice.rate * 100)}%`, { size: 34 }),
      parts[index],
      'above',
      'normal',
    );
  });
  const pluses = parts.slice(1).map((part, index) => place(mono('+'), between(parts[index], part)));
  const sum = beside(
    row([mono(`= ${total}`, { color: COLOR.specialist }), label('per 1,000')], { gap: 'tight' }),
    [RIGHT_PANEL.cx, boxOf(parts[0]).bottom],
    'under',
    'none',
  );
  const share = beside(mono('= 17.6%', { color: COLOR.specialist }), sum, 'under', 'none');
  const whole = axis.upright(() => wholeRate, { top: ROWS.inset('none', 'normal').top });
  const wholeName = beside(
    mono('17.6%', { color: COLOR.specialist }),
    [axis.x(wholeRate), axis.rowY(1)],
    'left',
    'normal',
  );
  const gapY = (axis.rowY(0) + axis.y) / 2 + 6;
  const gap = arrow([axis.x(routine.rate), gapY], [axis.x(wholeRate), gapY], {
    stroke: COLOR.failure,
    width: 4,
    both: true,
    tip: 14,
  });
  const each = place(note('each slice rate needs its own interval'), HEAD_RIGHT, 'right');

  const repairedName = place(
    label('sample across all slices', { color: COLOR.sample, size: 34 }),
    TRAY_HEAD,
  );
  const oldName = place(note('routine-only result, dim'), READOUT, 'bottom');
  // The first picture: the toy queue with its three slices, and the empty tray.
  s.add(heading(c.title), queue, queueName, emptyTray, emptyName, tray, frame);
  c.take(axis.standing);
  c.keep(axis.standing);

  c.show('mixes', names, { stagger: true });
  // Only routine messages go to the tray.
  c.on('biased-selection', () => {
    s.play(selected.to(1, { duration: 0.4 }));
    s.play(drawn.to(1, { duration: 2, ease: linear }));
  });
  c.swap('biased-selection', emptyName, trayName);
  c.on('never-enter', () => s.play(...names.slice(1).map((name) => recolor(name, COLOR.failure))));
  c.show('never-enter', [leftOutName, ...leftOut]);
  c.show('never-enter', fraction, { after: true });
  c.show('binomial-illustration', [interval, intervalName], { after: true });
  c.hide('biased-precision', emptyTray);
  c.on('biased-precision', () => s.play(more.to(1, { duration: 2.6, ease: linear })));
  c.show('slice-rate', rateName, { after: true });

  // The known mix: each slice sends its specialist cases, and the three blocks join.
  c.on('known-mix', () => s.play(...names.slice(1).map((name) => recolor(name, 'ink'))));
  c.swap('known-mix', [leftOutName, ...leftOut], perName);
  c.hide('known-mix', [...names, rateName]);
  ['weight-routine', 'weight-billing', 'weight-account'].forEach((cue, index) => {
    c.after(cue, () => s.play(sent[index].to(1, { duration: 1.2, ease: linear })));
    c.show(cue, products[index]);
    c.show(cue, parts[index], { after: true });
  });
  c.show('weighted-total', pluses);
  c.on('weighted-total', () =>
    s.play(...parts.map((part) => indicate(part, { color: COLOR.mark, scale: 1 }))),
  );
  c.after('total-percent', () => s.play(joined.to(1, { duration: 1 })));
  c.show('total-percent', sum, { after: true });
  c.show('total-percent', [share, whole, wholeName], { after: true });
  c.show('total-percent', [...names, rateName], { after: true });

  // The gap, and the repair.
  c.after('gap', () => s.play(wrong.to(1, { duration: 0.3 })));
  // Let the arrow finish fading in when the two phrases run together.
  const gapFade = 0.3;
  const pause = c.cue('design-repair').start - c.cue('gap').end;
  c.show('gap', gap, { after: true, fade: gapFade });
  c.hide('design-repair', gap, { lead: Math.min(0.1, pause - gapFade) });
  c.hide('design-repair', [
    ...fraction,
    intervalName,
    ...parts,
    ...products,
    ...pluses,
    share,
  ]);
  c.hide('design-repair', [...names, rateName]);
  c.swap('design-repair', trayName, repairedName);
  c.show('design-repair', oldName);
  c.on('design-repair', () => s.play(repaired.to(1, { duration: 1.6 }), fade(interval, 0.25)));
  // The new selection shows unknown outcomes without an unspoken numerical answer.
  c.swap('uncertainty-too', perName, each);
  c.show('uncertainty-too', [...names, rateName], { after: true });
  c.on('separate', () => s.play(indicate(queueName, { color: COLOR.mark })));
}
