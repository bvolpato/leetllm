import {
  assertEqual,
  axes,
  column,
  dot,
  dynamic,
  line,
  place,
  polyline,
  rect,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { mixtureEvidence } from '../../../films/ab-testing/model.mjs';

export default function mixture(s, c) {
  const [context, work, reading, foot] = area.rows([0.9, 3, 1, 1], 'wide');
  const alternatives = [0.2, 0.6];
  const nullRate = 0.4;
  const pair = mixtureEvidence([1, 0], nullRate, alternatives);
  const scope = place(
    label('One stream   ·   known null success rate 40%   ·   equal weights'),
    context,
  );
  const slots = work.columns(2, 'wide');
  const ratios = alternatives.map(() => s.value(1));
  const readouts = slots.map((slot, i) => {
    const [name, formula, track, number] = slot.rows([1, 1, 1, 1], 'tight');
    const q = alternatives[i];
    const color = i ? 'blue' : 'cyan';
    const rail = track.inset(72, 0);
    const x = (ratio) => rail.left + (ratio * rail.width) / 2;
    const bar = dynamic(() => [
      line([x(0), rail.cy], [x(ratios[i].value), rail.cy], { stroke: color, width: 18 }),
      dot(14, color).moveTo([x(ratios[i].value), rail.cy]),
      place(mono(ratios[i].value.toFixed(3) + '×', { size: 58, color }), number),
    ]);
    const multiplier = (step, chance, baseline) =>
      place(
        mono(
          pair[step - 1].ratios[i].toFixed(1) +
            ' × (' +
            Math.round(chance * 100) +
            '% / ' +
            Math.round(baseline * 100) +
            '%)',
          { size: 44 },
        ),
        formula,
      );
    return {
      frame: [
        place(label(Math.round(100 * q) + '% success model', { color }), name),
        line([x(0), rail.cy], [x(2), rail.cy], { stroke: 'gridStrong', width: 5 }),
        line([x(1), rail.cy - 25], [x(1), rail.cy + 25], { stroke: 'ink', width: 3 }),
        bar,
      ],
      success: multiplier(1, q, nullRate),
      failure: multiplier(2, 1 - q, 1 - nullRate),
    };
  });
  const names = [
    'Likelihood ratios start at one',
    'Success   ·   the null gave it a 40% chance',
    'Failure   ·   the null gave it a 60% chance',
  ].map((txt) => place(label(txt), reading));
  const mix = (step) =>
    place(
      mono('Equal-weight average   ' + pair[step].current.toFixed(3), {
        size: 48,
        color: 'yellow',
      }),
      foot,
    );
  const meanHit = mix(1),
    meanMiss = mix(2);
  const expectation = place(
    mono('0.4 × (q / 0.4) + 0.6 × [(1 − q) / 0.6] = 1', { size: 45 }),
    foot,
  );
  s.add(
    heading(c.title),
    scope,
    readouts.map((r) => r.frame),
    names[0],
  );
  function update(cue, i, step, formula) {
    c.show(cue, formula);
    c.on(cue, () => s.play(ratios[i].to(pair[step].ratios[i], { duration: 0.9 })));
  }
  c.swap('success', names[0], names[1]);
  update('first-hit', 0, 1, readouts[0].success);
  update('second-hit', 1, 1, readouts[1].success);
  c.show('average', meanHit, { after: true });
  c.swap('failure', [names[1], meanHit, readouts.map((r) => r.success)], names[2]);
  update('first-miss', 0, 2, readouts[0].failure);
  update('second-miss', 1, 2, readouts[1].failure);
  c.show('second-average', meanMiss, { after: true });
  c.swap('expected', meanMiss, expectation);

  const data = mixtureEvidence();
  const threshold = 1 / 0.05;
  const look = s.value(0);
  const prefix = () => Math.round(look.value);
  const axis = place(
    axes({
      x: [0, 21],
      y: [0, 32],
      width: work.width * 0.73,
      height: work.height * 0.95,
      labels: false,
      tips: false,
    }),
    work,
  );
  const cutoff = [
    line(axis.world(0, threshold), axis.world(20.5, threshold), {
      stroke: 'yellow',
      width: 4,
      dash: [10, 9],
    }),
    note('Threshold 20', { color: 'yellow' }).moveTo([
      axis.world(0, threshold)[0] - 104,
      axis.world(0, threshold)[1],
    ]),
    place(note('Likelihood ratio'), work, 'top left'),
  ];
  const plots = dynamic(() => {
    const rows = data.slice(0, prefix() + 1);
    const series = (k) => rows.map((r) => axis.world(r.n, r[k]));
    const current = series('current'),
      maximum = series('maximum');
    return [
      ...(rows.length > 1
        ? [
            polyline(current, { stroke: 'cyan', width: 6 }),
            polyline(maximum, { stroke: 'ink', width: 3, dash: [9, 8] }),
          ]
        : []),
      dot(12, 'cyan').moveTo(current.at(-1)),
    ];
  });
  const [streamName, streamPlot] = context.columns([1, 3], 'normal');
  const outcomes = place(note('Observed outcomes'), streamName);
  const cells = streamPlot.columns(20, 'tight');
  const stream = dynamic(() =>
    cells.map((slot, i) =>
      place(
        rect(33, 33, {
          fill: i >= prefix() ? 'surface' : i < 10 ? 'green' : 'red',
          stroke: i >= prefix() ? 'dim' : i < 10 ? 'green' : 'red',
          width: 2,
        }),
        slot,
      ),
    ),
  );
  const tally = dynamic(() => {
    const r = data[prefix()];
    return place(
      mono(
        'n = ' +
          r.n +
          '     Current ' +
          r.current.toFixed(3) +
          '     Maximum ' +
          r.maximum.toFixed(3),
        { size: 45 },
      ),
      reading,
    );
  });
  const ask = place(
    label('If the ratio falls, what happens to the running maximum?', { color: 'yellow' }),
    foot,
  );
  const p = place(
    mono('Anytime p = min(1, 1 / ' + data[10].maximum.toFixed(3) + ') ≈ ' + data[20].p.toFixed(4), {
      size: 46,
      color: 'yellow',
    }),
    foot,
  );
  assertEqual(data[10].current.toFixed(3), '28.833', 'mixture at ten successes');
  assertEqual(data[20].current.toFixed(3), '0.509', 'mixture at twenty outcomes');
  assertEqual(data[10].maximum, data[20].maximum, 'running maximum after ten failures');
  c.swapAll('restart', [
    heading('How much evidence has this stream reached?'),
    outcomes,
    stream,
    axis,
    cutoff,
    plots,
    tally,
  ]);
  c.on('ten', () => s.play(look.to(10, { duration: 2 })));
  c.show('ask', ask);
  c.on('failures', () => s.play(look.to(20, { duration: 2 })));
  c.swap('anytime', ask, p, { after: true });
  const [known, unknown] = work.columns(2, 'loose');
  const knownRate = place(
    column(
      [
        label('One stream'),
        mono('p₀ = 0.40', { size: 60, color: 'cyan' }),
        note('Probability of each outcome is specified'),
      ],
      { gap: 'normal' },
    ),
    known,
  );
  const unknownRate = place(
    column(
      [
        label('Two-arm experiment'),
        mono('pC = pT = ?', { size: 60, color: 'yellow' }),
        note('Equality leaves the shared rate unknown'),
      ],
      { gap: 'normal' },
    ),
    unknown,
  );
  c.swapAll('two-arms', [heading('Which null does the test cover?'), knownRate, unknownRate]);
}
