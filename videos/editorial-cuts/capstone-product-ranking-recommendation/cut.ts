import { film, text, rect, line, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'Where did the missing printer go?', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(label('Where did the missing printer go?', 0, -392, 74));
  s.add(label('Eligible listings', -530, -232, 50), label('Ranker input', 450, -232, 50));
  s.add(line([0, -165], [0, 220], { stroke: 'dim', width: 3 }));
  const rows = [
    ['P5', 3],
    ['P6', 2],
    ['P4', 1],
  ] as const;
  const tiles = rows.map(([name, grade], i) => {
    const y = -104 + i * 127;
    const outline = rect(498, 94, {
      fill: 'surface',
      stroke: grade >= 2 ? 'teal' : 'dim',
      width: 3,
      radius: 12,
    }).at(-530, y);
    const caption = label(name + '     grade ' + grade, -530, y, 47, grade >= 2 ? 'teal' : 'dim');
    s.add(outline, caption);
    return [outline, caption];
  });
  s.wait(2.5);
  const survivors = [...tiles[0], ...tiles[2]];
  s.play(...survivors.map((n) => to(n, (m) => m.shift(983, 0))), { duration: 1.3 });
  s.play(fadeIn(label('Dropped', -520, 120, 40, 'yellow')), { duration: 0.5 });
  s.wait(2.4);
  s.play(fadeIn(label('Two relevant printers entered retrieval.', 0, 285, 52)), { duration: 0.5 });
  s.wait(2.6);
  s.play(fadeIn(label('Only P5 reached the ranker.    Recall = 1 / 2', 0, 367, 50, 'teal')), {
    duration: 0.6,
  });
  s.wait(6.4);
});
