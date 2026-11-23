import { film, text, rect, line, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'One input, two destinations', look: 'midnight', fps: 30 }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color, font: 'mono' }).at(x, y);
  const input = rect(230, 180, { radius: 14, fill: 'surface', stroke: 'teal', width: 4 }).at(
    -545,
    0,
  );
  s.add(
    text('How much work can one load do?', { font: 'text-serif', size: 82 }).at(0, -380),
    input,
    label('A[1,0]', -545, -142, 39, 'teal'),
    label('4', -545, 0, 88, 'teal'),
  );
  s.wait(2);
  for (const [column, y, weight] of [
    [0, -135, 1],
    [1, 135, 2],
  ]) {
    const branch = line([-425, 0], [-75, y], { stroke: 'teal', width: 5 });
    s.play(draw(branch), fadeIn(label('× ' + weight, 12, y, 65)), { duration: 0.55 });
    s.play(
      fadeIn(label('C[1,' + column + ']', 480, y - 63, 37, 'dim')),
      fadeIn(label('+ ' + 4 * weight, 480, y + 12, 70, 'yellow')),
      { duration: 0.45 },
    );
    s.wait(1);
  }
  s.wait(2.2);
  s.play(fadeIn(text('Both columns use the same loaded 4.', { size: 50 }).at(0, 335)), {
    duration: 0.6,
  });
  s.wait(7);
});
