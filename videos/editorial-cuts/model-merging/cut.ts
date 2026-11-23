import { dot, fadeIn, film, line, text } from 'vizmatic/stage';

export default film({ title: 'Measure the merge path', look: 'midnight', fps: 30 }, (s) => {
  const left = -630,
    right = 630,
    floor = 205;
  const caption = (words: string, x: number, y: number, size: number, color = 'ink') =>
    text(words, { size, color }).at(x, y);
  s.add(text('Would you ship the midpoint?', { font: 'text-serif', size: 86 }).at(0, -355));
  s.add(caption('Same base   ·   Matching tensor shapes', 0, -215, 44, 'dim'));
  s.add(line([left, floor], [right, floor], { stroke: 'dim', width: 3 }));
  for (const [i, x] of [left, right].entries()) {
    s.add(
      dot(14, 'teal').at(x, floor),
      caption(i ? 'Checkpoint B' : 'Checkpoint A', x, 285, 44),
      caption('loss 0', x, 135, 40, 'teal'),
    );
  }
  s.wait(3.8);
  const position = (u: number): [number, number] => [
    left + (right - left) * u,
    floor - 310 * 16 * u * u * (1 - u) * (1 - u),
  ];
  const path = Array.from({ length: 64 }, (_, i) =>
    line(position(i / 64), position((i + 1) / 64), { stroke: 'blue', width: 7 }),
  );
  s.play(...path.map((n) => fadeIn(n)), { duration: 0.55 });
  s.wait(1.5);
  s.play(
    fadeIn(dot(18, 'yellow').at(...position(0.5))),
    fadeIn(caption('50% merge   ·   loss 64', 0, -162, 48, 'yellow')),
    { duration: 0.4 },
  );
  s.wait(9.2);
});
