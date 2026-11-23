import { film, text, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'Keep the fraction', look: 'midnight' }, (s) => {
  const term = (value: string, x: number, y: number, color = 'ink') =>
    text(value, { size: 74, font: 'mono', color }).at(x, y);
  s.add(text('Four operands. Keep the fraction.', { size: 80, font: 'text-serif' }).at(0, -395));
  const a = term('8₁', -640, -170, 'blue'),
    b = term('3₁', -250, -170, 'yellow'),
    c = term('3₂', 150, -170, 'yellow'),
    d = term('8₂', 640, -170, 'blue');
  s.add(a, b, c, d);
  s.wait(0.4);
  s.play(
    to(a, (n) => n.at(-560, 0)),
    to(b, (n) => n.at(-285, 0)),
    fadeIn(term('÷', -423, 0)),
    { duration: 1 },
  );
  s.play(fadeIn(term('8/3', -425, 145, 'teal')), { duration: 0.6 });
  s.wait(1.6);
  s.play(
    to(c, (n) => n.at(-745, 145)),
    fadeIn(term('−', -575, 145)),
    { duration: 1 },
  );
  s.wait(2);
  s.play(fadeIn(term('1/3', -555, 300, 'teal')), { duration: 0.5 });
  s.wait(1.1);
  s.play(
    to(d, (n) => n.at(90, 300)),
    fadeIn(term('÷ 1/3', 335, 300)),
    { duration: 0.9 },
  );
  s.wait(1);
  s.play(fadeIn(term('= 24', 675, 300, 'teal')), { duration: 0.6 });
  s.wait(8.3);
});
