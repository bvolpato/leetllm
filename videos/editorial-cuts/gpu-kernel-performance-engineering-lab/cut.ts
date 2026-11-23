import { film, text, rect, fadeIn, fadeOut } from 'vizmatic/stage';

export default film({ title: 'What did padding actually fix?', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, font: 'mono', color }).at(x, y);
  const title = s.add(
    text('What did padding actually fix?', { font: 'text-serif', size: 78 }).at(0, -390),
  );
  const bankX = (i: number) => -530 + i * 38;
  s.add(label('Shared bank', -725, -208, 34, 'dim'));
  for (const b of [0, 8, 16, 24, 31]) s.add(label(String(b), bankX(b), -208, 33));
  const row = (stride: number, y: number) => {
    s.add(label('Stride ' + stride, -730, y, 37));
    for (let b = 0; b < 32; b++) {
      const words = Array.from({ length: 32 }, (_, lane) => lane).filter(
        (lane) => (lane * stride) % 32 === b,
      ).length;
      s.add(
        rect(32, 74, {
          fill: words === 32 ? 'orange' : words ? 'teal' : 'surface',
          stroke: 'dim',
          width: 1,
        }).at(bankX(b), y),
      );
    }
  };
  row(32, -105);
  s.add(label('32 distinct words in bank 0', 0, -18, 38, 'orange'));
  s.wait(3.8);
  row(33, 112);
  s.play(fadeIn(label('1 word per bank', 0, 204, 38, 'teal')), { duration: 0.5 });
  s.wait(4.8);
  s.play(fadeOut(title), { duration: 0.25 });
  s.add(text('What must the run record?', { font: 'text-serif', size: 78 }).at(0, -390));
  s.play(fadeIn(label('Check   exact outputs + sanitizer logs', 0, 285, 38)), { duration: 0.25 });
  s.wait(1.6);
  s.play(fadeIn(label('Measure   profile + raw timing samples', 0, 350, 38, 'yellow')), {
    duration: 0.25,
  });
  s.wait(1.6);
  s.play(fadeIn(label('Identify   device + source hash', 0, 415, 38)), { duration: 0.25 });
  s.wait(3.7);
  s.play(fadeIn(label('Keep the change only if measurements support it.', 0, -295, 38, 'yellow')), {
    duration: 0.25,
  });
  s.wait(3.95);
});
