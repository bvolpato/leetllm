import { assertEqual, dynamic, line } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { correctedThreshold } from '../parts.mjs';
import { deadlinePlot } from '../deadline-plot.mjs';

const center = 52;
const deadline = 55;
const scoreSets = [7, 8].map((eighteenth) => [...Array(17).fill(6), eighteenth, 12]);
const cuts = scoreSets.map((scores) => correctedThreshold(scores, 0.9));
const upper = center + cuts[0].threshold;
const replay = upper + 1;
for (const [i, q] of cuts.entries()) {
  assertEqual(q.rank, 18, 'nineteen scores at 90%');
  assertEqual(center - q.threshold, [45, 44][i], 'lower bound');
  assertEqual(center + q.threshold, [59, 60][i], 'upper bound');
  assertEqual(Math.abs(replay - center) <= q.threshold, i === 1, 'same replay arrival');
}
assertEqual(replay - deadline, 5, 'caller overrun');

export default function freshDeadline(s, c) {
  const clock = deadlinePlot(s, { prediction: center, deadline });
  const [header] = area.inset('normal').rows([2, 5], 'wide');
  const [calculation, records] = header.columns([1.2, 1.8], 'loose');
  const slots = records.columns(3, 'normal');
  const [band, caller] = area.inset('normal').columns(2, 'loose');
  const y = area.bottom - 83;
  const trial = s.value(0);
  const showRank = s.value(0);
  const phase = s.value(0);
  const coverageOn = s.value(0);
  const deadlineOn = s.value(0);
  const evidence = dynamic(() => {
    const q = cuts[trial.value];
    const data = scoreSets[trial.value];
    const marks = [
      label('19 held-out errors · target 90%', { size: 35 }).moveTo([
        calculation.cx,
        header.cy - 64,
      ]),
      mono('⌈(19 + 1) × .90⌉ = ' + (showRank.value ? q.rank : '?'), {
        size: 39,
        color: 'yellow',
      }).moveTo([calculation.cx, header.cy + 4]),
    ];
    for (const [i, group] of ['ranks 1–17', 'rank 18', 'rank 19'].entries()) {
      const color = i === 1 && showRank.value ? 'yellow' : 'dim';
      marks.push(
        label(group, { size: 34, color }).moveTo([slots[i].cx, header.cy - 66]),
        mono(['≤ 6 ms', data[17] + ' ms', data[18] + ' ms'][i], {
          size: 48,
          color: color === 'yellow' ? color : 'ink',
        }).moveTo([slots[i].cx, header.cy + 4]),
      );
      if (i === 1 && showRank.value)
        marks.push(
          line([slots[i].cx - 70, header.cy + 48], [slots[i].cx + 70, header.cy + 48], {
            stroke: 'yellow',
            width: 5,
          }),
        );
    }
    return marks;
  });
  const record = dynamic(() => {
    if (phase.value === 0)
      return [label('What are the rank and both endpoints?', { size: 46 }).moveTo([area.cx, y])];
    if (phase.value === 1) return [];
    if (phase.value === 3)
      return [
        label('Previous interval [45, 59] ms · what changes for the 60 ms arrival?', {
          size: 39,
        }).moveTo([area.cx, y]),
      ];
    const q = cuts[trial.value].threshold;
    const value = clock.observed.value;
    const hi = center + q;
    const covered = Math.abs(value - center) <= q;
    const late = value - deadline;
    return [
      label('Inside the interval?', { size: 34, color: 'dim' }).moveTo([band.cx, y - 39]),
      label('By the deadline?', { size: 34, color: 'dim' }).moveTo([caller.cx, y - 39]),
      mono(
        coverageOn.value
          ? value + (covered ? ' ≤ ' : ' > ') + hi + (covered ? '   covered' : '   outside')
          : '?',
        { size: 41, color: coverageOn.value ? (covered ? 'green' : 'red') : 'ink' },
      ).moveTo([band.cx, y + 19]),
      mono(deadlineOn.value ? value + ' − ' + deadline + ' = ' + late + ' ms late' : '?', {
        size: 41,
        color: deadlineOn.value ? 'red' : 'ink',
      }).moveTo([caller.cx, y + 19]),
    ];
  });
  const setBand = () => {
    clock.endpoints.set(0);
    s.play(clock.radius.to(cuts[trial.value].threshold, { duration: 0.65 }));
    clock.endpoints.set(1);
  };
  function observe(value) {
    coverageOn.set(0);
    deadlineOn.set(0);
    clock.observed.set(value);
    clock.observedOn.set(1);
    phase.set(2);
  }
  s.add(heading(c.title), clock.frame, clock.marks, evidence, record);
  c.after('rank', () => showRank.set(1));
  c.after('range', () => {
    setBand();
    phase.set(1);
  });
  c.after('arrival', () => observe(upper));
  c.after('covered', () => coverageOn.set(1));
  c.after('late', () => deadlineOn.set(1));
  c.after('replay', () => observe(replay));
  c.after('outside', () => coverageOn.set(1));
  c.after('five-late', () => deadlineOn.set(1));
  c.after('change', () => {
    trial.set(1);
    clock.priorBand.set(1);
    phase.set(3);
  });
  c.after('new-range', () => {
    clock.priorBand.set(0);
    coverageOn.set(0);
    deadlineOn.set(0);
    setBand();
    phase.set(2);
  });
  c.after('new-hit', () => coverageOn.set(1));
  c.after('still-late', () => deadlineOn.set(1));
}
