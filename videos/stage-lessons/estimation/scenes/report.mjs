// Scene `report`: the decision, and then the week.
//
// The picture is the one of the first scene: the covered queue, the tray, the two choices, and the
// axis. The interval of 100 labels crosses the staffing line. 300 more messages fly from the queue
// to the tray, and the interval of 400 labels contracts on its own row. The axis zooms in on the
// line: the upper end is at 19.9%. The choice is the regular team. Then the queue uncovers and
// sorts, and the share of the week drops on the axis at 18%, inside both intervals.
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
  text,
} from 'vizmatic/stage';
import { weeklyQueue, weeklySample } from '../../../films/estimation/fixtures.mjs';
import { count, wilson } from '../../../films/estimation/model.mjs';
import { chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  HEAD_LEFT,
  LEFT_PANEL,
  POINT,
  READOUT,
  RIGHT_PANEL,
  ROWS,
  THRESHOLD,
  TRAY_GRID,
  TRAY_HEAD,
  labelOf,
  mark,
  percent,
  radiusOf,
  rateAxis,
  slots,
  weekQueue,
} from '../parts.mjs';

/** The labels of the first audit, and of the planned one. */
const FIRST = 100,
  PLANNED = 400;
/** The part of the audit that one message takes for its way from the queue to the tray. */
const FLIGHT = 0.35;
/** The rates at the two ends of the axis while it shows the staffing line from near. */
const NEAR = [0.18, 0.22];

export default function report(s, c) {
  const axis = rateAxis(s);
  const before = wilson(count(weeklySample.slice(0, FIRST)), FIRST),
    after = wilson(count(weeklySample.slice(0, PLANNED)), PLANNED);
  const rate = count(weeklySample.slice(0, FIRST)) / FIRST;
  const weekRate = weeklyQueue.specialist / weeklyQueue.size;

  // The values of the scene.
  const planned = s.value(0); // the tray makes room for 400 labels
  const audit = s.value(0); // the draw of the 300 new messages, from 0 to 1
  const reviewed = s.value(FIRST); // the labels that are reviewed
  const endpointReady = s.value(0); // the endpoint readout waits for its result clause
  const second = s.value(0); // the interval of 400 labels is on screen
  // How near the axis looks at the staffing line: 0 at rest, and 1 at the close look.
  const close = () =>
    clamp((0.4 - (axis.max.value - axis.min.value)) / (0.4 - (NEAR[1] - NEAR[0])));

  // The queue of the week. A cell lights when one of its messages leaves for the tray.
  const flight = (index) =>
    clamp((audit.value - ((1 - FLIGHT) * (index - FIRST)) / (PLANNED - FIRST - 1)) / FLIGHT);
  const firstOf = new Map();
  const [queueRoom, queueFoot] = LEFT_PANEL.rows([5, 1], 'tight');
  const queue = weekQueue(s, {
    region: queueRoom,
    lit: (cell) => firstOf.has(cell) && flight(firstOf.get(cell)) > 0,
  });
  const starts = weeklySample.map((message, index) => {
    const cell = queue.cellOf(message.id);
    if (index >= FIRST && !firstOf.has(cell)) firstOf.set(cell, index);
    return queue.place(cell);
  });
  const queueName = label("this week's queue");
  const covered = chip('covered', { color: 'dim' });
  place(row([queueName, covered]), HEAD_LEFT, 'left');
  const share = beside(label('share: ?', { color: COLOR.specialist }), queueName, 'right');
  const outcome = place(
    row(
      [
        mono(weeklyQueue.specialist.toLocaleString('en-US'), { color: COLOR.specialist }),
        label(`of ${weeklyQueue.size.toLocaleString('en-US')}`),
      ],
      { gap: 'tight' },
    ),
    HEAD_LEFT,
    'left',
  );
  // The capacity of the regular team: the first fifth of the sorted cells.
  const room = queue.block(THRESHOLD);
  const capacity = rect(room.right - room.left + 8, room.bottom - room.top + 8, {
    stroke: 'ink',
    width: 4,
    fill: null,
    radius: 6,
    dash: [12, 10],
  }).at((room.left + room.right) / 2, (room.top + room.bottom) / 2);
  const capacityName = place(
    label(`capacity ${weeklyQueue.capacity.toLocaleString('en-US')}`),
    queueFoot,
    'left',
  );

  // The tray: 100 labels, and then the room for 400.
  const small = slots(FIRST, 10),
    large = slots(PLANNED, 20);
  const tray = dynamic(() => {
    const grow = smoothstep(planned.value);
    const marks = [];
    weeklySample.forEach((message, index) => {
      if (index < FIRST) {
        marks.push(
          mark(labelOf(message), lerp(radiusOf(10), radiusOf(20), grow)).at(
            lerp(small[index][0], large[index][0], grow),
            lerp(small[index][1], large[index][1], grow),
          ),
        );
        return;
      }
      const part = flight(index);
      if (part <= 0) {
        if (grow > 0) marks.push(mark('slot', radiusOf(20), grow).at(large[index]));
        return;
      }
      const eased = smoothstep(part);
      marks.push(
        mark(index < done() ? labelOf(message) : 'selected', lerp(6, radiusOf(20), eased)).at(
          lerp(starts[index][0], large[index][0], eased),
          lerp(starts[index][1], large[index][1], eased),
        ),
      );
    });
    return marks;
  });
  const trayName = place(label('100 messages', { color: COLOR.sample }), TRAY_HEAD);
  const planName = place(label('fixed plan: 400 labels', { color: COLOR.larger }), TRAY_HEAD);
  const over = mono('00', { size: 64 }),
    under = mono('000', { size: 64 });
  const stroke = rect(150, 5, { fill: 'ink', stroke: null, radius: 2 });
  place(column([over, stroke, under], { gap: 'tight', align: 'center' }), READOUT, 'top');
  const live = (slot, read, color) =>
    dynamic(() =>
      text(String(read()), { font: 'mono', size: 64, color }).at(slot.get('x'), slot.get('y')),
    );
  const done = () => Math.floor(reviewed.value + 1e-6);
  const auditCount = () => count(weeklySample.slice(0, done()));
  const fraction = [
    live(over, auditCount, COLOR.specialist),
    stroke,
    live(under, done, COLOR.sample),
  ];
  const trayFrame = rect(TRAY_GRID.width, TRAY_GRID.width - 20, {
    stroke: COLOR.mark,
    width: 4,
    fill: null,
    radius: 16,
  }).at(TRAY_GRID.cx, TRAY_GRID.top + (TRAY_GRID.width - 20) / 2);

  // The two intervals: 100 labels on the upper row, and 400 labels on the row at the axis.
  const first = dynamic(() => {
    // The first interval goes quiet when the second one arrives, and it leaves for the close look.
    const opacity = (1 - 0.55 * Math.min(1, second.value)) * (1 - clamp(close() * 3)),
      at = axis.rowY(1);
    if (opacity < 0.02) return [];
    return [
      ...bar(axis, before, at, opacity),
      ...(axis.inside(rate) ? [dot(POINT, COLOR.sample, { opacity }).at(axis.x(rate), at)] : []),
    ];
  });
  const final = dynamic(() => {
    if (second.value < 0.02) return [];
    const range = wilson(auditCount(), done());
    const middle = auditCount() / done();
    return [
      ...bar(axis, range, axis.rowY(0), second.value * (done() < PLANNED ? 1 : endpointReady.value)),
      ...(axis.inside(middle)
        ? [dot(POINT, COLOR.larger, { opacity: second.value }).at(axis.x(middle), axis.rowY(0))]
        : []),
    ];
  });
  // The names of the two rows. They leave while the axis shows the line from near.
  const rowName = (words, color, end, row) => {
    const at = beside(note(words, { color }), [axis.x(end), axis.rowY(row)], 'left', 'wide');
    return dynamic(() =>
      close() > 0.2
        ? []
        : text(words, { size: 29, color })
            .at(at.get('x'), at.get('y'))
            .opacity(1 - close() * 5),
    );
  };
  const names = [
    rowName('100 labels', 'dim', before.low, 1),
    rowName('planned audit', COLOR.larger, after.low, 0),
  ];
  const upperEnd = circle(22, { stroke: COLOR.mark, width: 4, fill: null }).at(
    axis.x(before.high),
    axis.rowY(1),
  );
  // The upper end of the final interval, by its number, while the axis shows the line from near.
  const upperName = dynamic(() =>
    endpointReady.value < 0.5 || close() < 0.8
      ? []
      : text(percent(after.high, 1), { font: 'mono', size: 40, color: COLOR.accepted })
          .at(axis.x(after.high) - 80, axis.rowY(0) - 52)
          .opacity((close() - 0.8) * 5),
  );

  // The rule and the two choices, as in the first scene.
  const ruleName = label('upper end below the line');
  const choiceNames = ['regular team', 'extra shift'];
  const choices = choiceNames.map((name) =>
    namedBox(name, { width: 250, height: 96, color: 'dim', group: choiceNames }),
  );
  const next = note('next: sampling and simulation');
  place(column([ruleName, row(choices), next], { gap: 'wide', align: 'center' }), RIGHT_PANEL);
  const chosen = rect(262, 108, { stroke: COLOR.accepted, width: 6, fill: null, radius: 14 }).at(
    choices[0].center,
  );

  // The share of the week on the axis.
  const week = axis.upright(() => weekRate, { top: ROWS.top });
  const weekName = beside(
    mono(percent(weekRate), { color: COLOR.specialist }),
    [axis.x(weekRate), axis.rowY(2)],
    'left',
    'normal',
  );

  // The first picture: the covered queue, the tray, the two choices, and the interval of 100 labels.
  s.add(
    heading(c.title),
    queue.cells,
    queueName,
    covered,
    tray,
    trayName,
    ...fraction,
    first,
    final,
    names[0],
    ...choices,
    upperName,
  );
  c.take(axis.standing);

  c.show('rule', [ruleName, upperEnd]);
  // Recall the plan fixed before any audit outcomes were inspected. The first 100 stay in the total.
  c.hide('fix-400', upperEnd);
  c.on('fix-400', () => s.play(planned.to(1, { duration: 1.2 })));
  c.swap('fix-400', trayName, planName);
  c.on('much-larger', () => s.play(indicate(queueName, { color: COLOR.mark })));
  c.on('planned-audit', () => s.play(audit.to(1, { duration: 2.4, ease: linear })));

  // The completed audit: 64 specialist cases, and an interval that ends just left of the line.
  c.after('final-interval', () => {
    second.set(1);
    s.play(reviewed.to(PLANNED, { duration: 1.4, ease: linear }));
  });
  c.show('final-interval', names[1], { after: true });
  c.after('upper-bound', () => {
    endpointReady.set(1);
    const zoom = 1.2;
    s.play(
      axis.min.to(NEAR[0], { duration: zoom }),
      axis.max.to(NEAR[1], { duration: zoom }),
    );
    s.wait(Math.max(1.2, c.cue('staffing-choice').end - c.cue('upper-bound').end - zoom + 0.35));
    s.play(axis.min.to(0, { duration: 1 }), axis.max.to(0.4, { duration: 1 }));
  });
  c.show('staffing-choice', chosen, { after: true });
  c.swap('expect', covered, share);

  // The week: it uncovers, it sorts, and its share drops on the axis.
  c.hide('uncover', share);
  c.after('census-rate', () => s.play(queue.uncovered.to(1, { duration: 1.4, ease: linear })));
  c.after('census-rate', () => s.play(queue.sorted.to(1, { duration: 1.8 })));
  c.swap('census-rate', queueName, outcome, { after: true });
  c.show('census-rate', [week, weekName], { after: true });
  c.show('capacity', [capacity, capacityName], { after: true });
  c.after('capacity-payoff', () => s.play(indicate(chosen, { scale: 1.08 })));
  c.on('carry-counts', () =>
    s.play(
      ...fraction.slice(1, 2).map((node) => indicate(node, { color: COLOR.mark, scale: 1.6 })),
    ),
  );
  c.on('carry-interval', () =>
    s.play(second.to(1.6, { duration: 0.3 }), second.to(1, { duration: 0.3 })),
  );
  c.on('carry-plan', () => s.play(indicate(planName, { color: COLOR.mark })));
  c.show('carry-labels', trayFrame);
  c.show('next', next);
  c.hide('next', trayFrame);
  // New traces: the cells of the queue go back to mixed places, and the capacity mark leaves.
  c.hide('new-traces', [capacity, capacityName]);
  c.on('new-traces', () => s.play(queue.sorted.to(0, { duration: 1.4 })));
}

/** An interval with its two caps, as marks of a dynamic drawing. An end outside the axis has no cap. */
function bar(axis, range, at, opacity) {
  const held = (value) => Math.min(axis.max.value, Math.max(axis.min.value, value));
  const marks = [
    line([axis.x(held(range.low)), at], [axis.x(held(range.high)), at], {
      stroke: COLOR.accepted,
      width: 10,
      opacity,
    }),
  ];
  for (const end of [range.low, range.high])
    if (axis.inside(end))
      marks.push(
        line([axis.x(end), at - 16], [axis.x(end), at + 16], {
          stroke: COLOR.accepted,
          width: 4,
          opacity,
        }),
      );
  return marks;
}
