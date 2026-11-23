import { film, text, line, fadeIn } from 'vizmatic/stage';

export default film({ look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, color = 'ink', size = 48) =>
    text(value, { font: 'mono', size, color }).at(x, y);
  s.add(text('What did the tests establish?', { font: 'text-serif', size: 80 }).at(0, -360));
  s.add(label('Contract: double the input', 0, -220));
  const xs = [-300, -35, 230, 580];
  s.add(label('input', -645, -45), label('expected', -645, 65), label('observed', -645, 175));
  for (const [i, x] of xs.entries()) {
    s.add(label(String(i + 1), x, -45), label(String(2 * (i + 1)), x, 65));
    if (i < 3) s.add(label(String(2 * (i + 1)), x, 175, 'teal'));
  }
  s.add(line([405, -110], [405, 235], { stroke: 'dim' }));
  s.add(label('untested', xs[3], -125, 'yellow', 36));
  s.wait(5.7);
  s.play(fadeIn(label('0', xs[3], 175, 'yellow')), { duration: 0.6 });
  s.play(fadeIn(label('Candidate doubles x ≤ 3. For x > 3 it returns 0.', 0, 345, 'ink', 42)),
    { duration: 0.5 });
  s.wait(17.675 - s.duration);
});
