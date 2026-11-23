import { film, text, line, dot, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'Does zero mean skip?', look: 'midnight' }, (s) => {
  const words = (label: string, x: number, y: number, size = 48, color = 'ink') =>
    text(label, { size, color }).at(x, y);
  s.add(words('Does zero mean skip?', 0, -399, 78));
  const x = (weight: number) => -620 + (weight - 0.8) * 6000;
  for (const [y, name] of [
    [-90, 'No gradient'],
    [210, 'Zero gradient'],
  ] as const) {
    s.add(words(name, -590, y - 85, 49), line([-620, y], [580, y], { stroke: 'dim', width: 4 }));
    for (const w of [0.81, 0.9, 1]) s.add(words(w.toFixed(2), x(w), y + 57, 38));
  }
  s.add(words('First update: w = 1 − 0.1 × 1', 0, -285, 48));
  s.wait(5);
  const track = (y: number, from: number, to: number, color: string) =>
    line([x(from), y], [x(to), y], { stroke: color, width: 13 });
  s.play(draw(track(-90, 1, 0.9, 'blue')), draw(track(210, 1, 0.9, 'teal')), { duration: 1 });
  s.add(dot(13, 'blue').at(x(0.9), -90), dot(13, 'teal').at(x(0.9), 210));
  s.wait(4);
  s.add(words('Skip update', 375, -176, 47, 'blue'));
  s.wait(3);
  s.play(draw(track(210, 0.9, 0.81, 'teal')), { duration: 1 });
  s.add(dot(13, 'teal').at(x(0.81), 210), words('Momentum still moves w', 300, 128, 46, 'teal'));
  s.wait(5.2);
});
