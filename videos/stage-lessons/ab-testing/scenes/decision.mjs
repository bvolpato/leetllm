import { assertEqual, dot, dynamic, line, place } from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { BUDGET, lift, liftInterval, report } from '../parts.mjs';

export default function decision(s, c) {
  const [scope, liftLane, speedLane, foot] = area.rows([0.75, 2.6, 2.6, 1], 'wide');
  const [liftName, liftPlot] = liftLane.columns([1, 3.6], 'wide');
  const [speedName, speedPlot] = speedLane.columns([1, 3.6], 'wide');
  const fixture = place(
    note('Practice replays   ·   the original grounding audit still holds the launch'),
    scope,
  );
  const x = (slot, f) => slot.point('left')[0] + slot.width * (0.07 + f * 0.86);
  const liftX = (v) => x(liftPlot, v / 8);
  const speedX = (ms) => x(speedPlot, (ms - 1100) / 450);
  const liftY = liftPlot.point('center')[1];
  const speedY = speedPlot.point('center')[1];
  const ly = (v) => [liftX(v), liftY];
  const lower = liftInterval[0] * 100,
    upper = liftInterval[1] * 100,
    observed = lift * 100;
  const threshold = s.value(BUDGET.observedLift);
  const ms = s.value(report.treatment.p95);
  const limit = report.control.p95 + BUDGET.latency;
  const liftMarks = [
    place(label('Resolution lift'), liftName),
    line(ly(0), ly(8), { stroke: 'grid', width: 4 }),
    line(ly(lower), ly(upper), { stroke: 'cyan', width: 8 }),
    ...[lower, upper].map((n) =>
      line([liftX(n), liftY - 16], [liftX(n), liftY + 16], { stroke: 'cyan', width: 4 }),
    ),
    dot(15, 'cyan').moveTo(ly(observed)),
    mono('+' + observed.toFixed(1) + ' pp', { size: 42, color: 'cyan' }).moveTo([
      liftX(observed),
      liftY + 53,
    ]),
    mono('0', { size: 34 }).moveTo([liftX(0), liftY + 53]),
    mono('+' + lower.toFixed(1), { size: 34 }).moveTo([liftX(lower), liftY + 53]),
  ];
  const cutoff = dynamic(() => [
    line([liftX(threshold.value), liftY - 28], [liftX(threshold.value), liftY + 27], {
      stroke: 'yellow',
      width: 4,
    }),
    mono('Required  +' + threshold.value.toFixed(1) + ' pp', { size: 37, color: 'yellow' }).moveTo([
      liftX(threshold.value),
      liftY - 62,
    ]),
  ]);
  const speedMarks = [
    place(label('First-request p95'), speedName),
    line([speedX(1100), speedY], [speedX(1550), speedY], { stroke: 'grid', width: 4 }),
    line([speedX(limit), speedY - 28], [speedX(limit), speedY + 27], {
      stroke: 'yellow',
      width: 4,
    }),
    mono('Limit  ' + limit + ' ms', { size: 37, color: 'yellow' }).moveTo([
      speedX(limit),
      speedY - 62,
    ]),
    dot(11, 'dim').moveTo([speedX(report.control.p95), speedY]),
    note('Control  1180').moveTo([speedX(report.control.p95), speedY - 57]),
  ];
  const rewrite = dynamic(() => [
    dot(15, 'blue').moveTo([speedX(ms.value), speedY]),
    mono('Rewrite  ' + Math.round(ms.value) + ' ms', { size: 36, color: 'blue' }).moveTo([
      speedX(ms.value),
      speedY + 54,
    ]),
  ]);
  const slow = 1490;
  assertEqual(slow - report.control.p95, 310, 'latency replay');
  const speedQuestion = place(
    label('Which additional condition fails?', { color: 'yellow' }),
    foot,
  );
  const effectQuestion = place(
    label('Does the observed gain meet the new requirement?', { color: 'yellow' }),
    foot,
  );
  const speedFail = place(
    label('Speed fails   ·   ' + (slow - report.control.p95) + ' ms above control', {
      color: 'red',
    }),
    foot,
  );
  const targetFail = place(
    label('Observed lift falls short   ·   its interval still excludes zero', { color: 'yellow' }),
    foot,
  );
  s.add(heading(c.title), fixture, liftMarks, cutoff, speedMarks, rewrite);
  c.on('slow', () => s.play(ms.to(slow, { duration: 1.35 })));
  c.show('ask-speed', speedQuestion);
  c.swap('speed-fail', speedQuestion, speedFail);
  c.hide('restore', speedFail);
  c.on('restore', () => s.play(ms.to(report.treatment.p95, { duration: 1 })));
  c.on('five', () => s.play(threshold.to(5, { duration: 1.1 })));
  c.show('ask-effect', effectQuestion);
  c.swap('effect-fail', effectQuestion, targetFail);
  c.hide('reset', targetFail);
  c.on('reset', () => s.play(threshold.to(BUDGET.observedLift, { duration: 0.8 })));
  const [flag, output, action] = area.rows([1.6, 1.7, 1.5], 'wide');
  const raised = place(chip('srm_alert = True', { color: 'yellow' }), flag);
  const error = place(
    mono('ValueError: Investigate SRM before computing lift', { size: 46, color: 'red' }),
    output,
  );
  const inspect = place(
    label('Trace distinct incident IDs from assignment to the analysis table.'),
    action,
  );
  c.swapAll('flag', [heading('A replay with an allocation alert'), raised]);
  c.show('stop', error);
  c.show('trace', inspect);
}
