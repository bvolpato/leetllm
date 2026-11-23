import { film, text, line, dot, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'Will the reply beat the timer?', look: 'midnight' }, (s) => {
  const note = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { font: 'mono', size, color }).at(x, y);
  s.add(
    text('Will the reply beat the timer?', { font: 'text-serif', size: 76 }).at(0, -348),
    note('“How do I reset my password?”', 0, -190, 48),
    line([-710, 90], [710, 90], { stroke: 'gridStrong', width: 5 }),
  );
  const x = (seconds: number) => -710 + seconds * 70;
  for (const t of [0, 5, 10, 15, 20])
    s.add(
      line([x(t), 85], [x(t), 110], { stroke: 'dim', width: 3 }),
      note(t + ' s', x(t), 160, 35),
    );
  const clock = dot(14, 'blue').at(x(0), 90);
  s.add(clock);
  s.wait(3.2);
  s.play(
    to(clock, (n) => n.at(x(6), 90)),
    { duration: 0.65 },
  );
  s.play(fadeIn(note('median  6 s', x(6), -10, 47, 'blue')), { duration: 0.3 });
  s.wait(1.25);
  s.play(
    fadeIn(line([x(10), 15], [x(10), 115], { stroke: 'yellow', width: 6 })),
    fadeIn(note('deadline', x(10), -75, 45, 'yellow')),
    { duration: 0.35 },
  );
  s.wait(6.8);
  s.play(
    fadeIn(line([x(0), 230], [x(6), 230], { stroke: 'blue', width: 8 })),
    fadeIn(note('50% finish by here', x(3), 300, 39, 'blue')),
    { duration: 0.45 },
  );
  s.wait(2.2);
  s.play(fadeIn(note('How many finish after 10 s?', 370, 300, 42, 'yellow')), { duration: 0.4 });
  s.wait(9.4);
});
