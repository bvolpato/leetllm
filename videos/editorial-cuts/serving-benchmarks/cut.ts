import { film, text, line, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'Who sets the arrival clock?', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size = 46, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(text('Who sets the arrival clock?', { font: 'text-serif', size: 85 }).at(0, -378));
  s.add(label('Help desk', -650, -135), label('One waiting client', -650, 140));
  for (const y of [-135, 140]) s.add(line([-355, y], [815, y], { stroke: 'dim', width: 3 }));
  s.add(label('1 second', 20, -266, 42, 'dim'));
  for (const x of [-355, -95, 165]) {
    s.play(fadeIn(rect(15, 100, { fill: 'blue', stroke: null }).at(x, -135)), { duration: 0.3 });
    s.wait(0.65);
  }
  s.add(label('3 questions arrive', 210, -47, 38, 'blue'));
  s.wait(2.15);
  s.add(
    label('send', -355, 240, 39, 'teal'),
    rect(15, 100, { fill: 'teal', stroke: null }).at(-355, 140),
  );
  s.play(fadeIn(rect(690, 24, { fill: 'surface', stroke: 'yellow', width: 3 }).at(0, 140)), {
    duration: 1,
  });
  s.add(label('wait for answer', 0, 70, 40, 'yellow'));
  s.wait(3);
  s.add(
    rect(15, 100, { fill: 'teal', stroke: null }).at(365, 140),
    label('answer → next send', 405, 240, 38, 'teal'),
  );
  s.wait(6.5);
  s.play(fadeIn(label('While the client waits, real questions keep arriving.', 0, 376, 50)), {
    duration: 0.5,
  });
  s.wait(5.5);
});
