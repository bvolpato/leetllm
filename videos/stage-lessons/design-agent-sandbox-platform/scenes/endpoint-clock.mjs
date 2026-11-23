import { assertEqual, dot, dynamic, line, linear, place, row } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';

export default function scene(s, c) {
  const accepted = 0,
    placed = 3,
    loaded = 7,
    ready = 16,
    entry = 17;
  const target = 15;
  const latency = entry - accepted;
  assertEqual(latency - target, 2, 'time over the startup target');
  assertEqual(entry - loaded, 10, 'startup time after snapshot load');

  const [targetRow, plot, result, detail] = area.rows([1, 3.6, 1.3, 1], 'normal');
  const rail = plot.inset(155);
  const x = (ms) => rail.left + (rail.width * ms) / entry;
  const y = plot.cy;
  const threshold = line([x(target), plot.top + 20], [x(target), y + 28], {
    stroke: 'yellow',
    width: 4,
    dash: [9, 9],
  });
  const targetLabel = mono(target + ' ms target', { color: 'yellow', size: 42 }).moveTo([
    x(target),
    targetRow.cy,
  ]);
  const axis = line([x(accepted), y], [x(entry), y], { stroke: 'dim', width: 5 });
  const elapsed = s.value(accepted);
  const track = dynamic(() => {
    const tip = [x(elapsed.value), y];
    return [line([x(accepted), y], tip, { stroke: 'cyan', width: 8 }), dot(14, 'cyan').moveTo(tip)];
  });
  const mark = (name, ms, above) => {
    const side = above ? -1 : 1;
    const anchor = [x(ms), y + side * 63];
    return [
      line([x(ms), y + side * 16], anchor, { stroke: 'dim', width: 3 }),
      label(name, { size: 38 }).moveTo([x(ms), y + side * 96]),
      mono(ms + ' ms', { color: 'cyan', size: 40 }).moveTo([x(ms), y + side * 150]),
    ];
  };
  const stages = [
    ['start', 'Accepted', accepted, false],
    ['placement', 'Placed', placed, true],
    ['load', 'Snapshot loaded', loaded, false],
    ['ready', 'Checks passed', ready, false],
    ['user', 'Script starts', entry, true],
  ];
  s.add(heading(c.title), targetLabel, threshold, axis, track);
  for (const [cue, name, ms, above] of stages) {
    const { start, end } = c.cue(cue);
    if (ms > accepted)
      c.on(cue, () => s.play(elapsed.to(ms, { duration: end - start, ease: linear })));
    c.show(cue, mark(name, ms, above), { after: true, lead: 0 });
  }

  const resultLine = place(
    row(
      [
        label('Accept to first instruction', { size: 44 }),
        mono(latency + ' ms', { size: 59, color: 'cyan' }),
        label(latency - target + ' ms over target', { size: 44, color: 'yellow' }),
      ],
      { gap: 'wide' },
    ),
    result,
  );
  const gap = place(
    mono('Snapshot load to first instruction   ' + (entry - loaded) + ' ms', {
      size: 39,
      color: 'cyan',
    }),
    detail,
  );
  const sampling = place(
    label('Across requests: p99 startup, rejection rate, timeout rate', {
      size: 38,
    }),
    detail,
  );
  c.show('miss', resultLine, { after: true, lead: 0 });
  c.show('gap', gap, { after: true, lead: 0 });
  c.swap('percentile', gap, sampling);
}
