import { axes, beside, column, indicate, dynamic, dot, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
import { adam, saved, trajectory } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';
export default function checkpoint(s, c) {
  const b = open(s, c, 'checkpoint'),
    [plot, side] = WORK.columns([3, 2], 'wide');
  const full = adam(saved, 0.4, trajectory.length),
    reset = adam([saved[0], 0, 0], 0.4, trajectory.length);
  const history = trajectory.map((v, i) => [i, v[0]]),
    next = history.length;
  const all = [...history.map((p) => p[1]), full[0], reset[0]];
  const graph = place(
    axes({
      x: [0, next],
      y: [Math.min(...all) - 0.005, 1.005],
      width: plot.width - 160,
      height: plot.height - 130,
      xLabel: 'step',
      yLabel: 'W0',
      xStep: 1,
      yStep: 0.01,
      labelSize: 34,
      grid: true,
      tips: false,
    }),
    plot,
  );
  const step = s.value(0),
    branch = s.value(trajectory.length - 1);
  const at = (points, t) => {
    const i = Math.min(points.length - 2, Math.floor(t)),
      f = t - i;
    return points[i][1] + f * (points[i + 1][1] - points[i][1]);
  };
  const main = graph.plot(history, { to: () => step.value, stroke: 'blue', width: 5 });
  const marker = dynamic(() =>
    dot(11, 'yellow').moveTo(
      graph.world(step.value, at(history, Math.min(step.value, history.length - 1))),
    ),
  );
  const a = [
      [history.length - 1, saved[0]],
      [history.length, full[0]],
    ],
    z = [
      [history.length - 1, saved[0]],
      [history.length, reset[0]],
    ];
  const reference = graph.plot(a, {
    from: a[0][0],
    to: () => branch.value,
    stroke: 'blue',
    width: 5,
  });
  const alternate = graph.plot(z, {
    from: z[0][0],
    to: () => branch.value,
    stroke: 'red',
    width: 5,
  });
  const [sharedArea, fullArea, resetArea, zoomArea, read] = side.rows(
    [1, 1.3, 1.3, 1.8, 1.2],
    'normal',
  );
  const shared = place(
    mono('next g = +0.4 · step = ' + trajectory.length, { size: 34, color: 'cyan' }),
    sharedArea,
  );
  const moments = 'm = ' + saved[1].toFixed(4) + ' · v = ' + saved[2].toFixed(5);
  const good = place(
    column(
      [
        label('Full restore', { size: 34, color: 'blue' }),
        mono(moments, { size: 31, color: 'pink' }),
      ],
      { gap: 'none' },
    ),
    fullArea,
  );
  const bad = place(
    column(
      [
        label('Weights only', { size: 34, color: 'red' }),
        mono(moments, { size: 31, color: 'pink' }),
      ],
      { gap: 'none' },
    ),
    resetArea,
  );
  const cleared = place(
    column(
      [
        label('Weights only', { size: 34, color: 'red' }),
        mono('m = 0 · v = 0', { size: 31, color: 'red' }),
      ],
      { gap: 'none' },
    ),
    resetArea,
  );
  const values = place(
    mono('full: ' + full[0].toFixed(6) + '\nweights: ' + reset[0].toFixed(6), { size: 30 }),
    read,
  );
  const savedPoint = dot(8, 'pink').moveTo(graph.world(history.length - 1, saved[0]));
  const saveName = beside(note('save: step 5', { color: 'pink' }), savedPoint, 'above', 'normal');
  const zoom = place(
    axes({
      x: [reset[0] - 0.0001, full[0] + 0.0001],
      y: [0, 1],
      width: zoomArea.width - 50,
      height: 80,
      labels: false,
      grid: false,
      tips: false,
    }),
    zoomArea,
    'bottom',
  );
  const zoomLabel = place(note('next W: zoom'), zoomArea, 'top');
  const spots = [
    dot(10, 'blue').moveTo(zoom.world(full[0], 0.5)),
    dot(10, 'red').moveTo(zoom.world(reset[0], 0.5)),
  ];
  const gap = line(zoom.world(reset[0], 0.5), zoom.world(full[0], 0.5), {
    stroke: 'yellow',
    width: 4,
  });
  const fullName = place(label('Full restore', {size: 34, color: 'blue'}), fullArea, 'top');
  const weightsName = place(label('Weights only', {size: 34, color: 'red'}), resetArea, 'top');
  s.add(graph, main, marker, fullName, weightsName);
  c.swap('trajectory', [fullName, weightsName], [good, bad], {after: true});
  c.show('trajectory', [savedPoint, saveName], { after: true });
  c.swap('reset', bad, cleared, { after: true });
  c.show('common', shared);
  c.on('trajectory', () => s.play(step.to(history.length - 1, { duration: 5 })));
  c.on('branch', () => s.play(indicate(good, { scale: 1, color: 'yellow' })));
  c.after('separate', () => s.play(branch.to(history.length, { duration: 2 })));
  c.show('gap', [values, zoom, zoomLabel, gap, spots], { after: true });
  finish(c, b, 'checkpoint');
}
