import { sampleModel } from '../model.mjs';
import { thermalTraces } from '../fixtures.mjs';
import { fieldDrawing } from '../field-drawing.mjs';

export function drawThermal(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api),
    { C, text, line, dot, target } = p;
  const m = sampleModel('thermal', state);
  const second = m.step === 2;
  const floor = 18;
  const samples = m.trace.filter(({ minute }) => minute <= m.minute);
  const latest = samples.at(-1);
  const x = (minute) => 240 + 103 * minute;
  const y = (rate) => 813 - 47 * (rate - 15);
  text('Synthetic readings  /  generated tokens per second', 154, 282, 35, C.muted);
  text(
    second ? 'Run B   /   comparing the same sampling times' : 'Run A',
    154,
    350,
    39,
    second ? C.yellow : C.cyan,
  );
  for (const tick of [15, 18, 21, 24]) text(tick, 185, y(tick) + 12, 30, C.muted, 'right');
  line(x(0), 830, x(10), 830, C.muted);
  for (const [minute, label] of [
    [0, 'Start'],
    [1.5, '90 sec'],
    [10, '10 min'],
  ]) {
    line(x(minute), 831, x(minute), 848, C.muted);
    text(label, x(minute), 891, 33, C.muted, 'center');
  }
  target('thermal-rate-target', () => {
    line(x(0), y(floor), x(10) + 52, y(floor), C.pink, 3);
    text('18 required', 1344, y(floor) + 12, 32, C.pink);
  });

  function readings(points, color) {
    // The gaps between samples were never measured.
    for (const point of points) dot(x(point.minute), y(point.rate), 12, color);
  }
  target('thermal-rate-curve', () => {
    if (second) readings(thermalTraces[0], C.cyan);
    readings(samples, second ? C.yellow : C.cyan);
    line(x(m.minute), 810, x(m.minute), 828, C.yellow, 5);
    if (m.minute < 10) {
      line(x(10), 781, x(10), 815, C.muted, 3);
      text('?', x(10), 763, 44, C.muted, 'center');
    }
  });
  target('thermal-readout', () => text(latest.minute.toFixed(1) + ' min', 1475, 399, 40, C.ink));
  target('thermal-readout-2', () =>
    text(latest.rate.toFixed(1) + ' current', 1475, 477, 39, second ? C.yellow : C.cyan),
  );
  target('thermal-readout-3', () =>
    text(m.minimum.toFixed(1) + ' sampled min', 1475, 556, 34, m.passes ? C.ink : C.pink),
  );
  if (second) text('Run A   16.8 at 10 min', 1390, 806, 29, C.cyan);
  target('thermal-readout-4', () =>
    text(
      'Observed-sample gate: ' +
        (m.passes ? (m.minute === 10 ? 'pass' : 'pass so far') : 'fail') +
        ' · target 18 tokens/s',
      960,
      997,
      38,
      m.passes ? C.ink : C.pink,
      'center',
    ),
  );
}
export default {
  id: 'thermal',
  draw: drawThermal,
  cues: [
    'sustained-trace',
    'lowest-sample',
    'sample-failure',
    'trace-fails',
    'second-candidate',
    'same-rate-target',
  ],
};
