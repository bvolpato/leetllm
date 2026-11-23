import { fadeIn, film, rect, text } from 'vizmatic/stage';
export default film({ title: 'Who gets the next GPU step?', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const position = (x: number, y: number, color: string) =>
    rect(67, 67, { fill: color, stroke: null, radius: 9 }).at(x, y);
  s.add(text('Who gets the next GPU step?', { font: 'text-serif', size: 90 }).at(0, -380));
  s.add(
    label('R0 · decoding', -560, -150, 50, 'teal'),
    label('existing history', 10, -220, 35, 'dim'),
  );
  for (let i = 0; i < 5; i++) s.add(position(-270 + i * 74, -145, 'gridStrong'));
  s.add(rect(67, 67, { fill: null, stroke: 'teal', width: 4, radius: 9 }).at(100, -145));
  s.wait(2);
  const prompt = Array.from({ length: 9 }, (_, i) => position(-270 + i * 74, 60, 'purple'));
  s.play(fadeIn(label('R1 · prompt', -560, 60, 50, 'purple')), ...prompt.map((x) => fadeIn(x)), {
    duration: 0.4,
  });
  s.wait(2.3);
  s.play(
    fadeIn(position(100, -145, 'teal')),
    fadeIn(label('1 next token', 410, -145, 42, 'teal')),
    { duration: 0.3 },
  );
  s.wait(2);
  s.play(fadeIn(label('9 prompt tokens', 50, 149, 42, 'purple')), { duration: 0.35 });
  s.wait(2.6);
  s.play(fadeIn(label('One scheduler must budget both work and KV space.', 0, 316, 52)), {
    duration: 0.4,
  });
  s.wait(5.65);
});
