import { film, text, rect, fadeIn, line } from 'vizmatic/stage';

export default film({ title: 'Ten targets in one update', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size = 48, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  const token = (x: number, loss: number, color: string) => [
    rect(97, 107, { radius: 10, stroke: color, fill: 'surface', width: 4 }).at(x, -75),
    label(String(loss), x, -75, 57, color),
  ];
  s.add(
    text('Which denominator counts the targets?', { font: 'text-serif', size: 75 }).at(0, -370),
  );
  s.add(label('Loss per target', 0, -255, 40, 'dim'));
  s.add(label('A', -716, -165, 46, 'yellow'), ...token(-716, 4, 'yellow'));
  s.wait(3.8);
  const batchB = Array.from({ length: 9 }, (_, i) => token(-449 + 126 * i, 1, 'teal')).flat();
  s.play(fadeIn([label('B', 55, -165, 46, 'teal'), ...batchB]), { duration: 0.5 });
  s.wait(2.9);
  s.add(line([-820, 45], [820, 45], { stroke: 'dim', width: 2 }));
  s.play(fadeIn(label('Equal batch weights      (4 + 1) / 2 = 2.5', 0, 135, 48, 'dim')), {
    duration: 0.45,
  });
  s.wait(2.7);
  s.play(fadeIn(label('Equal target weights      (4 + 9) / 10 = 1.3', 0, 250, 60, 'teal')), {
    duration: 0.55,
  });
  s.wait(5.6);
});
