import { film, text, fadeIn, rect } from 'vizmatic/stage';

export default film({ title: 'Which questions did they miss?', look: 'midnight', fps: 30 }, (s) => {
  const caption = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color, font: 'mono' }).at(x, y);
  s.add(text('Did they miss the same questions?', { size: 88, font: 'text-serif' }).at(0, -355));
  for (const [i, name] of ['Assistant A', 'Assistant B'].entries()) {
    s.add(
      caption(name, -630, i * 160 - 52, 51),
      caption('90 / 100', -630, i * 160 + 13, 47, 'blue'),
    );
  }
  s.wait(5);
  const columns = Array.from({ length: 10 }, (_, i) => -340 + i * 119);
  s.play(fadeIn(caption('Ten renewal questions', 200, -203, 49)), { duration: 0.45 });
  columns.forEach((x, i) => s.add(caption('Q' + (91 + i), x, -120, 36)));
  s.wait(2.5);
  for (const [i, x] of columns.entries()) {
    for (const [row, passed] of [i < 2, i < 9].entries()) {
      const tone = passed ? 'teal' : 'pink';
      s.add(
        rect(103, 87, { radius: 6, stroke: tone, fill: 'surface', width: 3 }).at(x, row * 160 - 19),
        caption(passed ? '✓' : '×', x, row * 160 - 19, 60, tone),
      );
    }
    s.wait(0.19);
  }
  s.wait(2);
  s.play(fadeIn(caption('Renewals passed:   A  2 / 10     B  9 / 10', 0, 300, 50)), {
    duration: 0.45,
  });
  s.wait(5.7);
});
