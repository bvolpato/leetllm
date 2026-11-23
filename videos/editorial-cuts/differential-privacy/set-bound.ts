import { film, text, line, circle, arrow, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Set the bound', look: 'midnight' }, (s) => {
  const scale = 133;
  const point = (a: number, b: number): [number, number] => [-575 + a * scale, 270 - b * scale];
  const label = (value: string, x: number, y: number, color = 'ink') =>
    text(value, { font: 'mono', size: 47, color }).at(x, y);
  s.add(
    text('How far can one record move the sum?', { font: 'text-serif', size: 74 }).at(0, -396),
    line(point(-1.2, 0), point(3.65, 0), { stroke: 'gridStrong', width: 3 }),
    line(point(0, -1.1), point(0, 4.35), { stroke: 'gridStrong', width: 3 }),
    arrow(point(0, 0), point(0.4, 0.3), { stroke: 'teal', width: 7, tip: 14 }),
    label('One record: (0.4, 0.3)', 355, -156, 'teal'),
  );
  s.wait(4);
  s.play(fadeIn(circle(scale, { fill: null, stroke: 'yellow', width: 4 }).at(...point(0, 0))),
    fadeIn(label('C = 1', -785, 170, 'yellow')), { duration: 0.5 });
  s.wait(11.5);
});
