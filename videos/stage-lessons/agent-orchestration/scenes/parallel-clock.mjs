// Scene `parallel-clock`: the read phase waits for its longest branch.
//
// The picture: the lanes of the board are a clock. Three bars of 2 s, 3 s and 1 s stand one after
// another, and the wall time reads 6 s. They slide to one start, and the wall time falls to 3 s
// while the read work stays 6 s. Then one clock runs all three bars, the two early receipts wait,
// and the merge step adds its half second. The last beat pushes every start late.
import { dynamic, indicate, linear, place, rect, row } from 'vizmatic/stage';
import { readSchedule } from '../../../films/agent-orchestration/arithmetic.mjs';
import { chip, heading, label, mono } from '../../kit-narrated.mjs';
import { BAND, BRANCH_COLOR, MARK, board, clock, mix } from '../parts.mjs';

/** The seconds of each read, from the model: eval, health, policy. */
const SECONDS = readSchedule(0).branches.map((branch) => branch.duration);
const LONGEST = Math.max(...SECONDS);
/** The first half second at which the model says that the merge is complete. */
const TOTAL = Array.from({ length: 20 }, (_, half) => half / 2).find(
  (time) => readSchedule(time).mergeComplete,
);
const MERGE = TOTAL - LONGEST;
/** The start of each bar when the reads run one after another. */
const SERIAL = SECONDS.map((_, i) =>
  SECONDS.slice(0, i).reduce((sum, seconds) => sum + seconds, 0),
);

/** A time as the board writes it: whole when it is whole, and with one decimal while it moves. */
const seconds = (time) =>
  `${Math.abs(time - Math.round(time)) < 0.05 ? Math.round(time) : time.toFixed(1)} s`;
const clamp = (low, high, x) => Math.max(low, Math.min(high, x));

export default function parallelClock(s, c) {
  const b = board(s);
  const k = clock(
    s,
    SECONDS.map((length, lane) => ({
      lane,
      length,
      start: SERIAL[lane],
      color: 'dim',
      label: `${length} s`,
    })),
    { quantum: 0.1 },
  );
  k.now.set(0);
  const readinessFromClock = s.value(0);
  // During the replay, each lamp uses the completed span that draws its bar.
  b.gate.forEach((gate, i) => {
    gate.readiness = () =>
      readinessFromClock.value > 0.5 ? Number(k.complete(i)) : gate.lamp.value;
  });
  b.card.forEach((card) => card.pos.set(2));

  // The band: the wall time of the schedule, the read work, and what the clock does not show.
  const [wallRow, workRow, causeRow] = BAND.rows(3, 'normal');
  const mergeCost = place(mono('merge ' + seconds(MERGE)), causeRow, 'left');
  const durationLabels = SECONDS.map((length, i) =>
    mono(seconds(length), { anchor: 'left', color: BRANCH_COLOR[i] }).at(k.x(0), k.laneY(i)),
  );
  const wallName = place(label('wall time', { size: 36 }), wallRow, 'left');
  const workName = place(label('read work', { size: 36 }), workRow, 'left');
  const ROW_HEIGHT = 48;
  /** The merge step on the lanes, and the part of it that the wall time counts: the voice says the total. */
  const merge = s.value(0),
    counted = s.value(0),
    wallShown = s.value(0),
    wallHot = s.value(0),
    number = s.value(1),
    sum = s.value(0),
    idle = s.value(0),
    serialActive = s.value(1);

  const wall = dynamic(() => {
    const opacity = wallShown.value;
    if (opacity < 0.02) return [];
    const late = k.late.value;
    const base =
      serialActive.value > 0.5 ? Math.round(sum.value * 10) / 10 : k.end() - late + counted.value;
    const awaitingTotal = merge.value > 0 && counted.value < 0.001;
    const width = base * k.scale;
    const parts = [
      rect(width, ROW_HEIGHT, { radius: 8, stroke: null, fill: MARK, opacity: 0.92 * opacity }).at(
        k.x(0) + width / 2,
        wallRow.cy,
      ),
      mono(awaitingTotal ? '?' : number.value > 0.5 ? seconds(base) : `${seconds(base)} + ?`, {
        anchor: 'left',
        color: mix('ink', MARK, wallHot.value),
      })
        .at(k.x(base + late) + 18, wallRow.cy)
        .opacity(opacity),
    ];
    if (late * k.scale > 8)
      parts.push(
        rect(late * k.scale - 6, ROW_HEIGHT, {
          radius: 8,
          stroke: MARK,
          width: 3,
          dash: [10, 8],
          fill: null,
        }).at(k.x(base + late / 2) + 3, wallRow.cy),
      );
    return parts;
  });
  const work = dynamic(() => {
    const done = Math.round(sum.value * 10) / 10;
    if (done < 0.02) return [];
    const parts = SECONDS.flatMap((length, i) => {
      const part = clamp(0, length, done - SERIAL[i]);
      if (part * k.scale < 1) return [];
      return [
        rect(part * k.scale, ROW_HEIGHT, {
          radius: 8,
          stroke: null,
          fill: BRANCH_COLOR[i],
          opacity: 0.92,
        }).at(k.x(SERIAL[i] + part / 2), workRow.cy),
      ];
    });
    return [...parts, mono(seconds(done), { anchor: 'left' }).at(k.x(done) + 18, workRow.cy)];
  });

  // On the lanes: the waiting of an early receipt, the merge step across all lanes, a late start.
  const onLanes = dynamic(() => {
    const late = k.late.value;
    const parts = [];
    SECONDS.forEach((length, i) => {
      const elapsed = k.current();
      const waited = clamp(0, LONGEST - length, elapsed - late - length);
      const from = k.x(late + length) + 6,
        to = k.x(late + length + waited * idle.value) - 6;
      if (to - from > 4)
        parts.push(
          rect(to - from, k.barHeight, {
            radius: 8,
            stroke: BRANCH_COLOR[i],
            width: 3,
            dash: [10, 8],
            fill: null,
          }).at((from + to) / 2, k.laneY(i)),
        );
      if (late * k.scale > 12)
        parts.push(
          rect(late * k.scale - 8, k.barHeight, {
            radius: 8,
            stroke: MARK,
            width: 3,
            dash: [10, 8],
            fill: null,
          }).at(k.x(late / 2), k.laneY(i)),
        );
    });
    const width = merge.value * k.scale;
    if (width > 1) {
      parts.push(
        rect(width, k.bottom - k.top, { radius: 8, stroke: null, fill: 'ink', opacity: 0.88 }).at(
          k.x(late + LONGEST) + width / 2,
          (k.top + k.bottom) / 2,
        ),
      );
      if (merge.value > MERGE - 0.01)
        parts.push(
          mono(seconds(MERGE), { anchor: 'left' }).at(k.x(late + LONGEST + MERGE) + 16, k.laneY(1)),
        );
    }
    return parts;
  }).zIndex(2);

  s.add(heading(c.title), k.axis, ...k.numbers, k.bars, onLanes, wallName, workName, wall, work);
  b.enter(c);

  // Beat 0. The three durations, one after another, and then from one start.
  ['eval-two', 'health-three', 'policy-one'].forEach((cue, i) => {
    c.show(cue, durationLabels[i]);
    c.on(cue, () => s.play(k.spans[i].shown.to(1, { duration: 0.4 })));
  });
  c.hide('serial-reads', durationLabels, { lead: 0.2, fade: 0.2 });
  const serial = c.cue('serial-reads');
  const serialTotal = SERIAL.at(-1) + SECONDS.at(-1);
  c.on('serial-reads', () =>
    s.play(
      wallShown.to(1, { duration: 0.4 }),
      sum.to(serialTotal - 0.1, { duration: serial.end - serial.start, ease: linear }),
      k.now.to(serialTotal - 0.1, { duration: serial.end - serial.start, ease: linear }),
    ),
  );
  c.after('serial-reads', () => {
    sum.set(serialTotal);
    k.now.set(serialTotal);
  });
  const together = c.cue('parallel-result');
  const startTogether = c.cue('parallel-run');
  c.on('parallel-run', () => {
    serialActive.set(0);
    s.play(
      ...k.spans.map((span, i) =>
        span.start.to(SERIAL[i] === 0 ? 0 : 0.2, {
          duration: together.end - startTogether.start,
          ease: linear,
        }),
      ),
    );
  });
  c.after('parallel-result', () => k.spans.forEach((span) => span.start.set(0)));
  c.on('health-answer', () => s.play(k.spans[1].hot.to(1, { duration: 0.25 })));

  // Beat 1. One clock runs every bar. The lamps light at 1 s, 2 s and 3 s.
  c.on('one-clock', () =>
    s.play(
      k.spans[1].hot.to(0, { duration: 0.3 }),
      wallHot.to(0, { duration: 0.3 }),
      k.now.to(0, { duration: 0.6 }),
    ),
  );
  c.show('one-clock', k.marker);
  const run = c.cue('parallel-reads');
  const span = run.end - run.start;
  c.on('parallel-reads', () => {
    readinessFromClock.set(1);
    s.play(idle.to(1, { duration: 0.15 }), k.now.to(LONGEST, { duration: span, ease: linear }));
  });
  c.on('merge-waits', () => s.play(indicate(b.nodes.checks[1], { color: MARK, scale: 1 })));
  c.show('merge-overhead', mergeCost);
  c.on('merge-overhead', () => s.play(...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 }))));
  c.on('merge-overhead', () => s.play(merge.to(MERGE, { duration: 0.5 })));
  c.after('parallel-total', () => {
    counted.set(MERGE);
    k.now.set(TOTAL);
    s.play(
      wallHot.to(1, { duration: 0.3 }),
      ...b.card.map((card) => card.shown.to(1, { duration: 0.4 })),
    );
  });
  c.hide('overhead', mergeCost, { lead: 0.4, fade: 0.2 });

  // Beat 2. The work is the same. What the clock leaves out makes every start late.
  c.on('same-total-work', () =>
    s.play(wallHot.to(0, { duration: 0.3 }), indicate(workName, { color: MARK })),
  );
  // From here the lanes show the whole schedule again, and not one moment of the clock.
  c.hide('overhead', k.marker);
  c.on('overhead', () => {
    // Keep the computed readiness when the picture returns to the whole schedule.
    b.gate.forEach((gate, i) => gate.lamp.set(Number(k.complete(i))));
    readinessFromClock.set(0);
    s.play(k.now.to(99, { duration: 0.2 }));
  });
  const causes = ['dispatch', 'rate limits', 'contention', 'queueing'].map((words) => chip(words));
  place(row(causes, { gap: 'normal' }), causeRow, 'left');
  ['overhead', 'rate-limits', 'contention', 'queueing'].forEach((cue, i) => {
    c.show(cue, causes[i]);
    c.on(cue, () =>
      s.play(number.to(0, { duration: 0.2 }), k.late.to((i + 1) / 4, { duration: 0.6 })),
    );
  });
  c.on('measure-wall', () => s.play(indicate([wallName, workName], { color: MARK })));

  b.leave(c);
}
