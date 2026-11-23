import { film, text, line, dot, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'Which artifact owns the rule?', look: 'midnight', fps: 30 }, (s) => {
  const x = (days: number) => -720 + days * 20;
  const label = (words: string, size: number, px: number, py: number, color = 'ink') =>
    text(words, { size, color: color as 'ink' }).at(px, py);
  s.add(
    label('Same key. Different policy.', 82, 0, -385),
    line([-720, 10], [720, 10], { stroke: 'dim', width: 4 }),
  );
  for (const days of [0, 15, 30, 45, 60, 72]) {
    s.add(
      line([x(days), 10], [x(days), 28], { stroke: 'dim', width: 3 }),
      label(String(days), 33, x(days), 65),
    );
  }
  s.add(
    label('Key age in days', 37, 0, 138),
    dot(17, 'blue').at(x(42), 10),
    label('42-day key', 48, x(42), -125, 'blue'),
  );
  const gate = line([x(30), -75], [x(30), 40], { stroke: 'yellow', width: 7 });
  s.add(gate);
  const now = label('Today: P-7 requires 30 days', 52, 0, 245);
  s.play(fadeIn(now), { duration: 0.3 });
  s.wait(4.9);
  s.remove(now);
  const tomorrow = label('Tomorrow: P-7 requires 60 days', 52, 0, 245);
  s.add(tomorrow);
  s.play(
    to(gate, (n) => n.shift(x(60) - x(30), 0)),
    { duration: 1.1 },
  );
  s.wait(2.6);
  const verdict = label('42 < 60   ·   Ineligible', 55, 0, 345, 'yellow');
  s.play(fadeIn(verdict), { duration: 0.3 });
  s.wait(2.7);
  s.remove(tomorrow, verdict);
  const stale = line([x(30), -75], [x(30), 40], { stroke: 'teal', width: 7 });
  s.play(
    fadeIn([
      stale,
      label('Installed checker', 45, x(30) - 165, -208, 'teal'),
      label('Source policy', 45, x(60), -208, 'yellow'),
      label('Installed   ·   42 ≥ 30   ·   Eligible', 48, 0, 222, 'teal'),
      label('Source   ·   42 < 60   ·   Ineligible', 48, 0, 312, 'yellow'),
    ]),
    { duration: 0.4 },
  );
  s.wait(9.7);
});
