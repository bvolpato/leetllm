import { arrow, boxOf, circle, dot, dynamic, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT } from '../parts.mjs';
import { batchWaitSnapshot } from '../../../films/algorithm-complexity/model.mjs';
export default function queue(s, c) {
  const [rulerBand, laneBand] = PICTURE.inset('normal').rows([1, 5], 'wide');
  const [rulerName, ruler] = rulerBand.columns([1, 4], 'wide');
  const lineY = ruler.top + 16,
    timePoint = (t, y) => [ruler.left + (ruler.width * t) / 50, y];
  const axis = line(timePoint(0, lineY), timePoint(50, lineY), { stroke: 'dim', width: 3 });
  const ticks = [0, 10, 20, 30, 40, 50].map((t) =>
    mono(String(t), { size: 34, color: 'dim' }).moveTo(timePoint(t, ruler.bottom - 20)),
  );

  const laneRows = laneBand.rows(3, 'wide'),
    lanes = laneRows.map((b) => b.columns([1, 4], 'wide'));
  const names = ['batch formation', 'execution queue', 'executor'];
  const laneNames = lanes.map((b, i) => place(label(names[i], { size: 36 }), b[0], 'right'));
  const frames = lanes.map((b) =>
    rect(b[1].width, b[1].height, { fill: 'surface', stroke: 'dim', width: 2 }).moveTo(
      b[1].point('center'),
    ),
  );
  const now = s.value(0),
    timeout = s.value(0),
    busy = s.value(0);
  const wait = batchWaitSnapshot({ beat: 1, cues: { 'batch-busy': { phase: 'after' } } });
  const intervals = dynamic(() => {
    const end = now.value,
      start = now.value + wait.executionQueue * busy.value;
    return [
      rect(Math.max(1, (ruler.width * end) / 50), lanes[0][1].height * 0.65, {
        fill: 'blue',
        stroke: null,
      }).moveTo(timePoint(end / 2, lanes[0][1].cy)),
      ...(busy.value
        ? [
            rect((ruler.width * wait.executionQueue * busy.value) / 50, lanes[1][1].height * 0.65, {
              fill: 'yellow',
              stroke: null,
            }).moveTo(timePoint(10 + 10 * busy.value, lanes[1][1].cy)),
            rect((ruler.width * wait.busyUntil * busy.value) / 50, lanes[2][1].height * 0.65, {
              fill: 'grid',
              stroke: null,
            }).moveTo(timePoint(15 * busy.value, lanes[2][1].cy)),
          ]
        : []),
      ...(busy.value >= 0.999
        ? [note('R0: another job', { color: 'ink' }).moveTo(timePoint(15, lanes[2][1].cy))]
        : []),
      ...(busy.value === 0 || busy.value >= 0.999
        ? [
            note('R1', { color: 'cyan' }).moveTo(
              timePoint(
                (timeout.value ? start : now.value) + 1.8,
                lanes[0][1].cy + busy.value * (lanes[1][1].cy - lanes[0][1].cy),
              ),
            ),
          ]
        : []),
      dot(13, 'cyan').moveTo(
        timePoint(
          timeout.value ? start : now.value,
          lanes[0][1].cy + busy.value * (lanes[1][1].cy - lanes[0][1].cy),
        ),
      ),
    ];
  });
  const r1 = place(note('R1 arrives: 0 ms', { color: 'cyan' }), rulerName, 'bottom');
  const r2 = place(note('R2 arrives: 40 ms', { color: 'cyan' }), rulerName, 'top');
  const replay = place(note('Timeout replay · ms', { color: 'yellow' }), rulerName, 'top');
  const prediction = place(label('Waiting for 8 arrivals: predict a 10 ms timeout'), FOOT);
  const formation = place(label('Formation: 10 ms · total latency can include more waiting'), FOOT);
  const separate = place(label('Measure preprocessing, queueing, and execution separately'), FOOT);
  const gc = place(label('CPython keeps reference counting active'), FOOT);
  const [timings, cycles] = PICTURE.columns([2, 1], 'loose');
  const allTimingRows = timings.rows(5, 'tight');
  const timingTitle = place(note('Separate example · overlapping two requests'), allTimingRows[0]);
  const timingRegions = allTimingRows.slice(1);
  const timerData = [
    { name: 'R1 preprocess', from: 0, to: 8, color: 'cyan' },
    { name: 'R1 queue', from: 8, to: 25, color: 'yellow' },
    { name: 'R1 execute', from: 25, to: 50, color: 'blue' },
    { name: 'R2 preprocess', from: 25, to: 40, color: 'cyan' },
  ];
  const bars = timingRegions.flatMap((b, i) => {
    const [name, span] = b.columns([1, 2], 'normal');
    const timer = timerData[i];
    return [
      place(note(timer.name), name, 'right'),
      rect((span.width * (timer.to - timer.from)) / 50, 20, {
        fill: timer.color,
        stroke: null,
      }).moveTo([span.left + (span.width * (timer.from + timer.to)) / 100, span.cy]),
    ];
  });
  const cycleSlots = cycles.columns(2, 'loose');
  const circles = cycleSlots.map((b) =>
    place(circle(36, { fill: 'surface', stroke: 'blue', width: 3 }), b),
  );
  const links = [
    arrow(boxOf(circles[0]).point('right'), boxOf(circles[1]).point('left'), {
      stroke: 'blue',
      bend: 50,
      width: 4,
      pad: 10,
    }),
    arrow(boxOf(circles[1]).point('left'), boxOf(circles[0]).point('right'), {
      stroke: 'blue',
      bend: 50,
      width: 4,
      pad: 10,
    }),
  ];
  const title = heading(c.title);
  s.add(title, axis, ticks, laneNames, frames, intervals, r1, r2, prediction);
  c.on('batch-wait', () => s.play(now.to(40), { duration: 2 }));
  c.swap('batch-timeout', r2, replay);
  c.on(
    'batch-timeout',
    () => {
      timeout.set(1);
      now.set(0);
      s.play(now.to(10), { duration: 2 });
    },
    0.5,
  );
  c.swap('batch-timeout', prediction, formation, { after: true });
  c.on('batch-busy', () => s.play(busy.to(1), { duration: 2 }));
  c.swapAll('batch-measure', [timingTitle, bars, separate], { keep: [title] });
  c.show('batch-gc', place(note('Unreachable reference cycle'), cycles, 'top'));
  c.show('batch-gc', circles);
  c.show('batch-gc', links);
  c.swap('batch-cpython', separate, gc, { after: true });
}
