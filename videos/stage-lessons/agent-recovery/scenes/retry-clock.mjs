// Scene `retry-clock`: when the next try may go.
//
// The picture: a seconds axis with the deadline of the caller. Each retry has a window that
// doubles, and a wait that is sampled in the window. Each wait starts where the wait before it
// ends. The Retry-After floor then pushes every wait to the right, live, until the third one
// ends after the deadline. That try does not go.
import {
  arrow,
  assertEqual,
  beside,
  dot,
  dynamic,
  fadeIn,
  indicate,
  lagged,
  line,
  place,
  rect,
  row,
  seededRandom,
  seq,
} from 'vizmatic/stage';
import { DEADLINE, RETRY_AFTER, RETRY_FRACTIONS } from '../../../films/agent-recovery/fixtures.mjs';
import { retrySchedule } from '../../../films/agent-recovery/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, OP, secondsAxis, token } from '../parts.mjs';

/** The height of a bar, and the last second of the axis. */
const BAR = 56;
const LAST = 8;

export default function retryClock(s, c) {
  const free = retrySchedule(false);
  const held = retrySchedule(true);
  assertEqual(
    held.map((entry) => entry.admitted),
    [true, true, false],
    'the tries that fit before the deadline',
  );

  const [head, chart] = area.rows([1, 8], 'tight');
  const axis = secondsAxis(chart, { max: LAST, rows: 4 });
  const middle = (index) => axis.rows[index].cy;

  // The state: the floor of the service in seconds, the share of each window that the client
  // sampled, and if the deadline was checked.
  const floor = s.value(0);
  const sample = free.map(() => s.value(0));
  const judged = s.value(0);
  const waits = () => {
    let time = 0;
    return free.map((entry, index) => {
      const begin = time;
      time += floor.value + entry.cap * sample[index].value;
      return { begin, end: time };
    });
  };
  const bars = dynamic(() =>
    waits().flatMap(({ begin, end }, index) => {
      const y = middle(index);
      const cap = free[index].cap;
      const late = judged.value > 0.5 && end > DEADLINE;
      const bar = (from, to, color) =>
        rect(axis.span(to - from), BAR, {
          radius: 6,
          fill: late ? COLOR.fail : color,
          stroke: null,
          opacity: late ? 0.5 : 0.9,
        }).at(axis.x((from + to) / 2), y);
      // A window that passes the last second of the axis is drawn to that second.
      const opens = begin + floor.value;
      const shuts = Math.min(opens + cap, LAST);
      const window = rect(axis.span(shuts - opens), BAR + 20, {
        radius: 8,
        stroke: 'dim',
        fill: null,
        width: 2,
        dash: [8, 8],
      }).at(axis.x((opens + shuts) / 2), y);
      const sent = line([axis.x(end), y - BAR / 2 - 16], [axis.x(end), y + BAR / 2 + 16], {
        stroke: late ? COLOR.fail : 'ink',
        width: 4,
      });
      return [
        window,
        floor.value > 0.02 && bar(begin, begin + floor.value, COLOR.controller),
        end - begin - floor.value > 0.01 && bar(begin + floor.value, end, COLOR.attempt),
        sample[index].value > 0 && sent,
      ].filter(Boolean);
    }),
  );

  // The names of the rows, of the window and of the floor, and the deadline.
  const names = free.map((entry, index) =>
    place(label(`retry ${entry.attempt}`), axis.side[index], 'left'),
  );
  const over = (from, to, index, words, color) =>
    beside(
      note(words, { color }),
      [axis.x((from + to) / 2), middle(index) - BAR / 2 - 10],
      'above',
      'tight',
    );
  const windowName = over(0, free[0].cap, 0, 'window', 'dim');
  const floorName = over(0, RETRY_AFTER, 0, 'Retry-After', COLOR.controller);
  const offsetName = beside(
    note('random offset', { color: COLOR.attempt }),
    [axis.x(RETRY_AFTER + free[0].jitter / 2), middle(0) + BAR / 2 + 10],
    'under',
    'tight',
  );
  const limit = line([axis.x(DEADLINE), axis.body.top], [axis.x(DEADLINE), axis.body.bottom], {
    stroke: 'ink',
    width: 3,
    dash: [10, 8],
  });
  const limitName = beside(
    label('5 s deadline'),
    [axis.x(DEADLINE), axis.body.top],
    'above',
    'tight',
  );
  const late = beside(
    note('ends after the deadline', { color: COLOR.fail }),
    [axis.x(held[2].elapsedAfter), middle(2) - BAR / 2 - 10],
    'above',
    'tight',
    'right',
  );
  const last = held[2];
  const operands =
    last.elapsedBefore.toFixed(1) +
    ' s + ' +
    last.floor.toFixed(1) +
    ' s + ' +
    last.jitter.toFixed(1) +
    ' s';
  const clockLine = (words, color) => place(mono(words, { size: 38, color }), axis.rows[3], 'left');
  const question = [
    clockLine(operands + ' = ?', COLOR.mark),
    place(label('Fits before 5 s?', { size: 38, color: COLOR.mark }), axis.rows[3], 'right'),
  ];
  const answer = clockLine(operands + ' = ' + last.elapsedAfter.toFixed(1) + ' s', COLOR.fail);
  // Other clients with the same policy: their waits are at other places of the same windows.
  const random = seededRandom(11);
  const others = free.flatMap((entry, index) =>
    Array.from({ length: 9 }, () =>
      dot(7, COLOR.attempt, { opacity: 0.7 }).at(
        axis.x(entry.elapsedBefore + entry.cap * random()),
        middle(index) + BAR / 2 + 30,
      ),
    ),
  );
  // The whole task, from its start to its deadline, in the last row.
  const whole = arrow([axis.x(0), middle(3)], [axis.x(DEADLINE), middle(3)], {
    stroke: COLOR.mark,
    width: 4,
    both: true,
  });
  const wholeName = beside(note('the whole task', { color: COLOR.mark }), whole, 'above', 'tight');

  // What is retried: a read. At the end, the write of the lesson takes its place.
  const read = place(row([token('status?'), note('a transient read')]), head, 'left');
  const write = place(
    row([token(OP.key, COLOR.op), note('a write with an unknown outcome', { color: COLOR.op })]),
    head,
    'left',
  );
  const stop = place(
    chip('stop: report the unresolved state', { color: COLOR.fail, stroke: COLOR.fail }),
    axis.rows[3].columns([5, 3], 'none')[1],
    'right',
  );

  s.add(heading(c.title), axis.nodes, names, bars, windowName, limit, limitName, read);

  // Full jitter: each wait is sampled in its window, and the next window starts where it ends.
  const start = c.cue('sample-full-jitter').start;
  const pace = (c.cue('sample-full-jitter').end - start) / 3;
  RETRY_FRACTIONS.forEach((share, index) =>
    s.at(start + index * pace, () =>
      s.play(
        seq(
          sample[index].to(1, { duration: pace * 0.45 }),
          sample[index].to(share, { duration: pace * 0.45 }),
        ),
      ),
    ),
  );
  c.on('spread-clients', () =>
    s.play(
      lagged(
        others.map((mark) => fadeIn(mark, { duration: 0.3 })),
        { lag: 0.15 },
      ),
    ),
  );

  // The floor of the service: every wait gets it first, and all the waits after it move.
  c.hide('retry-after-floor', others);
  c.swap('retry-after-floor', windowName, floorName);
  c.on('retry-after-floor', () => s.play(floor.to(RETRY_AFTER, { duration: 2.6 })));
  c.show('bounded-offset', offsetName);
  c.on('combined-deadline', () =>
    s.play(
      indicate(limit, { color: COLOR.mark, scale: 1 }),
      indicate(limitName, { color: COLOR.mark, scale: 1 }),
    ),
  );
  c.show('combined-deadline', question);
  c.swap('read-clock', question, answer);
  c.on('read-clock', () => s.play(judged.to(1, { duration: 0.3 })));
  c.show('read-clock', late);

  // The deadline is for the whole task. The try that does not fit does not go.
  c.swap('whole-deadline', answer, [whole, wholeName]);
  c.show('stop-retry', stop);
  c.swap('not-safe', read, write);
}
