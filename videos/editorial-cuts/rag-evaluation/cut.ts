import { film, text, rect, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Three evidence checks', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(label('How do I return a book on Sunday?', 0, -350, 72));
  const row = (y: number, claim: string, test: string) => [
    rect(1540, 120, { fill: 'surface', stroke: 'grid', radius: 12 }).at(0, y),
    label(claim, -325, y, 48),
    label(test, 415, y, 45, 'yellow'),
  ];
  s.wait(2.3);
  s.play(fadeIn(row(-150, '“Receipt arrives immediately.”', 'Unsupported time')), {
    duration: 0.4,
  });
  s.wait(2.8);
  s.play(fadeIn(row(12, '“Use the return box.” [B]', 'Wrong source: use A')), { duration: 0.4 });
  s.wait(3.15);
  s.play(fadeIn(row(174, '“The library is closed.”', 'Missing instruction')), { duration: 0.4 });
  s.wait(6.55);
});
