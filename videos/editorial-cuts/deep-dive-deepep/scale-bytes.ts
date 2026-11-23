import { film, text, rect, fadeIn } from 'vizmatic/stage';

export default film({ title: 'What travels with an FP8 row?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('What travels with an FP8 row?', { size: 74, font: 'text-serif' }).at(0, -375));
  s.add(label('7,168 one-byte values', -255, -225, 48, 'blue'));
  s.add(rect(940, 105, { fill: 'surface', stroke: 'blue', width: 4 }).at(-255, -85));
  s.add(label('56 groups × 128 values', -255, -85, 45));
  s.wait(4.2);
  s.play(fadeIn(label('One float per group', 525, -225, 40, 'yellow')), { duration: 0.3 });
  s.add(rect(405, 105, { fill: 'surface', stroke: 'yellow', width: 4 }).at(525, -85));
  s.add(label('56 × 4 bytes', 525, -85, 44, 'yellow'));
  s.wait(3.3);
  s.add(label('7,168 + 224 = 7,392 bytes', 0, 100, 56));
  s.wait(2.5);
  s.add(label('BF16: 14,336 bytes   ÷   FP8 with scales: 7,392 bytes   ≈   1.94×', 0, 235, 40, 'teal'));
  s.wait(3.4);
  s.add(label('Payload only. Routing and protocol bytes are extra.', 0, 340, 34));
  s.wait(4.3);
});
