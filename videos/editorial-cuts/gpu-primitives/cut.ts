import { film, text, rect, line, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Who owns the last write?', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color, font: 'mono' }).at(x, y);
  const x = (lane: number) => -580 + 165 * lane;
  s.add(text('Who owns the last write?', { size: 82, font: 'text-serif' }).at(0, -382));
  s.add(label('Input', -796, -110, 40), label('Owner', -796, 85, 40));
  const values = [3, 1, 4, 2, 5];
  values.forEach((v, i) => {
    s.add(
      rect(133, 100, { fill: 'surface', stroke: 'blue', radius: 12 }).at(x(i), -110),
      label(String(v), x(i), -110, 54),
      label('lane ' + i, x(i), 85, 29, 'blue'),
    );
  });
  s.wait(4.4);
  s.play(fadeIn(label('One active lane writes each element.', 0, 245, 43)), { duration: 0.4 });
  s.wait(7.3);
  for (let i = 5; i < 8; i++) {
    s.add(
      rect(133, 100, { fill: null, stroke: 'dim', dash: [10, 8], radius: 12 }).at(x(i), -110),
      line([x(i) - 30, -140], [x(i) + 30, -80], { stroke: 'dim', width: 4 }),
      label('idle', x(i), 85, 29, 'dim'),
    );
  }
  s.play(fadeIn(label('5 elements  /  8 lane positions', 0, -245, 46, 'yellow')), {
    duration: 0.4,
  });
  s.wait(13.3);
});
