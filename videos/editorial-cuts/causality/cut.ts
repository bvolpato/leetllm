import { film, text, line, dot, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'What went into each total?', look: 'midnight' }, (s) => {
  const words = (label: string, x: number, y: number, size = 48, color = 'ink') =>
    text(label, { size, color }).at(x, y);
  s.add(words('What went into each total?', 0, -390, 76));
  const left = -640,
    right = 640;
  const rows = [
    { name: 'Assistant', y: -60, easy: 0.1 },
    { name: 'Control', y: 225, easy: 0.9 },
  ];
  for (const r of rows) {
    s.add(words(r.name, left + 105, r.y - 82, 55));
    const boundary = left + (right - left) * r.easy;
    s.play(
      draw(line([left, r.y], [boundary, r.y], { stroke: 'teal', width: 48 })),
      draw(line([boundary, r.y], [right, r.y], { stroke: 'purple', width: 48 })),
      { duration: 0.7 },
    );
    s.add(
      words(String(r.easy * 100) + ' easy', (left + boundary) / 2, r.y + 68, 40, 'teal'),
      words(
        String(Math.round((1 - r.easy) * 100)) + ' difficult',
        (boundary + right) / 2,
        r.y + 68,
        40,
        'purple',
      ),
    );
    s.wait(1.8);
  }
  s.wait(3.5);
  s.play(fadeIn(words('Which workflow wins with the same mix?', 0, -250, 56, 'yellow')), {
    duration: 0.45,
  });
  s.wait(7.81);
});
