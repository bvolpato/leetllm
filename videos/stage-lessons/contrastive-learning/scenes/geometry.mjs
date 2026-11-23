import { arrow, assertEqual, circle, dot, dynamic, line, linear, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { ANGLES, COLORS, NAMES, START, evaluate } from '../parts.mjs';
import { steps } from '../../../films/contrastive-learning/arithmetic.mjs';

export default function geometry(s, c) {
  const [plot, table] = area.columns([6, 5], 'wide');
  const [drawing, legend] = plot.rows([8, 1], 'normal');
  const origin = drawing.point('center'),
    radius = Math.min(drawing.height, drawing.width) * 0.37;
  const tip = (a) => [origin[0] + radius * Math.cos(a), origin[1] - radius * Math.sin(a)];
  const ring = circle(radius, { stroke: 'dim', width: 3 }).moveTo(origin);
  const candidates = ANGLES.flatMap((a, i) => {
    const end = tip(a);
    const [dx, dy] = [
      [-108, 76],
      [2, -46],
      [-58, -65],
    ][i];
    return [
      line(origin, end, { stroke: COLORS[i], width: 4 }),
      dot(10, COLORS[i]).moveTo(end),
      label(NAMES[i], { size: 34, color: COLORS[i] }).moveTo([end[0] + dx, end[1] + dy]),
    ];
  });
  const path = steps(30),
    position = s.value(0);
  const angle = () => {
    const i = Math.floor(position.value),
      fraction = position.value - i;
    return path[i] + ((path[i + 1] ?? path[i]) - path[i]) * fraction;
  };
  const initial = line(origin, tip(START), { stroke: 'dim', width: 3, dash: [10, 8] });
  const anchor = dynamic(() => arrow(origin, tip(angle()), { stroke: 'cyan', width: 9 }));
  const key = place(label('A dog is running', { size: 42, color: 'cyan' }), legend);
  const rows = table.rows([1, 1, 1, 1, 1, 1.5], 'normal');
  const cells = rows.map((row) => row.columns([1.8, 1, 1], 'tight'));
  const headings = [
    place(note('Start'), cells[0][1]),
    place(note('Now', { color: 'cyan' }), cells[0][2]),
  ];
  const metrics = [
    ['Steps finished', () => String(Math.floor(position.value + 1e-7))],
    ['Angle', () => ((angle() * 180) / Math.PI).toFixed(1) + '°'],
    ['Puppy share', () => (100 * evaluate(angle()).probs[0]).toFixed(1) + '%'],
    ['Loss (nats)', () => evaluate(angle()).loss.toFixed(3)],
  ];
  const readings = metrics.flatMap(([name, format], i) => [
    place(label(name, { size: 34 }), cells[i + 1][0], 'left'),
    place(mono(format(), { size: 38, color: 'dim' }), cells[i + 1][1]),
    dynamic(() => place(mono(format(), { size: 38, color: 'cyan' }), cells[i + 1][2])),
  ]);
  const update = place(note('angle ← angle − 0.03 × slope (radians)', { size: 32 }), rows[5]);
  assertEqual((evaluate(path[1]).probs[0] * 100).toFixed(1), '68.2', 'first updated share');
  assertEqual((evaluate(path.at(-1)).probs[0] * 100).toFixed(1), '96.4', 'thirtieth updated share');
  s.add(heading(c.title), ring, candidates, anchor, key, headings, readings);
  c.show('geometry-slope', update);
  c.after('geometry-first', () => s.play(position.to(1, { duration: 1 })));
  c.show('geometry-first', initial, { after: true });
  c.on('geometry-continue', () =>
    s.play(position.to(path.length - 1, { duration: 5, ease: linear })),
  );
}
