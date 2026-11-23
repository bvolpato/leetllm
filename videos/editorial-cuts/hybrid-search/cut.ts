import { film, text, rect, line, fadeIn, fadeOut } from 'vizmatic/stage';

export default film({ title: 'What does one more match buy?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  const heading = label('How much does another match add?', 0, -380, 76);
  const axis = line([-680, 175], [680, 175], { stroke: 'dim', width: 3 });
  s.add(heading, axis, label('Term frequency in an equally long book', 0, 320, 44));
  s.add(
    label('BM25 frequency factor   ·   k₁ = 1   ·   average document length', 0, -255, 38, 'dim'),
  );
  for (let count = 1; count <= 4; count++) {
    const factor = (2 * count) / (1 + count);
    const x = -510 + 340 * (count - 1);
    const h = 175 * factor;
    const bar = rect(170, h, { fill: 'teal', stroke: null }).at(x, 175 - h / 2);
    const value = label(factor.toFixed(2), x, 120 - h, 49, 'teal');
    const occurrences = label(String(count), x, 227, 48);
    s.play(fadeIn([bar, value, occurrences]), { duration: 0.36 });
    s.wait(1.14);
  }
  s.wait(1.9);
  s.play(fadeOut(heading), { duration: 0.4 });
  s.play(fadeIn(label('A rare code such as G-14 can carry more weight.', 0, -380, 59, 'yellow')), {
    duration: 0.4,
  });
  s.wait(8.1);
});
