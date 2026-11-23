import { film, text, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'Count the errors in the observed sample', look: 'midnight' }, (s) => {
  const words = (v: string, x: number, y: number, size: number, c = 'ink') =>
    text(v, { size, color: c as any, font: 'mono' }).at(x, y);
  s.add(text('How often did this router miss?', { size: 78, font: 'text-serif' }).at(0, -365));
  s.add(words('40 observed tickets', -400, -218, 45));
  const misses = [0, 5, 10, 15];
  const marks = Array.from({ length: 40 }, (_, i) =>
    rect(66, 66, { radius: 9, fill: 'surface', stroke: 'dim', width: 2 }).at(
      -775 + (i % 10) * 84,
      -90 + Math.floor(i / 10) * 88,
    ),
  );
  s.add(...marks);
  s.wait(1.8);
  s.play(
    fadeIn(misses.map((i) => words('1', marks[i].center[0], marks[i].center[1], 48, 'yellow'))),
    { duration: 0.45 },
  );
  s.wait(0.7);
  s.play(
    fadeIn(
      marks.flatMap((m, i) =>
        misses.includes(i) ? [] : [words('0', m.center[0], m.center[1], 32, 'dim')],
      ),
    ),
    { duration: 0.4 },
  );
  s.wait(2.2);
  s.play(fadeIn(words('4 misses', 490, -70, 72, 'yellow')), { duration: 0.45 });
  s.wait(0.7);
  s.play(fadeIn(words('÷ 40 tickets', 490, 45, 58)), { duration: 0.4 });
  s.wait(0.95);
  s.play(fadeIn(words('= 0.10', 490, 188, 82, 'blue')), { duration: 0.4 });
  s.wait(6.55);
});
