import { film, text, line, dot, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'Can the backup carry R900?', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(label('Can the backup carry R900?', 0, -385, 76));
  const wire = line([-680, -95], [650, -95], { stroke: 'dim', width: 4 });
  const request = dot(20, 'teal').at(-680, -95);
  s.add(wire, request, label('R900', -680, -165, 42, 'teal'));
  s.play(
    to(request, (n) => n.at(-200, -95)),
    { duration: 2.5 },
  );
  s.add(label('Primary timed out', -200, 0, 48, 'yellow'));
  s.wait(1);
  s.play(
    fadeIn(label('Backup F', 585, -180, 53)),
    fadeIn(label('Healthy · low cost', 585, 0, 42, 'teal')),
    { duration: 0.5 },
  );
  s.wait(3);
  s.add(label('R900 requires', -640, 175, 40));
  const checks = ['Private data', 'Citations', 'Schema', 'Review'];
  checks.forEach((v, i) => {
    s.play(fadeIn(label(v, -305 + i * 325, 174, 44, i === 0 ? 'teal' : 'yellow')), {
      duration: 0.45,
    });
    s.wait(0.35);
  });
  s.wait(1.8);
  s.play(
    fadeIn(line([280, -160], [280, -30], { stroke: 'yellow', width: 9 })),
    fadeIn(label('F lacks citations, schema, and review.', 0, 310, 53, 'yellow')),
    { duration: 0.6 },
  );
  s.wait(4.9);
});
