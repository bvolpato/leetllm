import { fadeIn, fadeOut, film, line, text } from 'vizmatic/stage';

export default film({ title: 'Keep the integer counts', look: 'midnight' }, (s) => {
  const term = (value: string, x: number, y: number, color = 'ink', size = 65) =>
    text(value, { size, font: 'mono', color }).at(x, y);
  s.add(text('Does the score reach the floor?', { size: 80, font: 'text-serif' }).at(0, -397));
  const fraction = (numerator: string, denominator: string, x: number, color: string) => [
    term(numerator, x, -165, color),
    line([x - 165, -102], [x + 165, -102], { stroke: color, width: 4 }),
    term(denominator, x, -38, color),
  ];
  s.add(
    ...fraction('matches', 'total', -440, 'blue'),
    term('≥', 0, -102),
    ...fraction('a', 'b', 440, 'yellow'),
  );
  s.add(term('total > 0     b > 0', 0, 362, 'dim', 40));
  s.wait(3.88);
  const products = [
    term('b × matches', -440, 180, 'blue'),
    term('≥', 0, 180),
    term('a × total', 440, 180, 'yellow'),
  ];
  s.play(fadeIn(products), { duration: 0.4 });
  s.wait(8.05);
  const factor = term('Multiply both sides by b × total', 0, 60, 'dim', 41);
  s.play(fadeIn(factor), { duration: 0.4 });
  s.wait(1.72);
  s.play(fadeOut(products), fadeOut(factor), { duration: 0.24 });
  s.play(
    fadeIn([
      term('3 × matches', -440, 180, 'blue'),
      term('≥', 0, 180),
      term('2 × total', 440, 180, 'yellow'),
      term('For a floor of 2/3', 0, 60, 'dim', 41),
    ]),
    { duration: 0.36 },
  );
  s.wait(4.62);
});
