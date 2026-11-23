import { film, line, dot, text, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'One probe at a cell boundary', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  const x = (v: number) => (v - 5) * 152;
  s.add(label('Which list will one probe open?', 0, -405, 80));
  s.add(line([x(0), 0], [x(10), 0], { stroke: 'dim', width: 4 }));
  s.add(line([0, -140], [0, 165], { stroke: 'dim', width: 3 }), label('Boundary  5', 0, 215, 38));
  for (const [value, color] of [
    [0, 'teal'],
    [10, 'purple'],
  ] as const) {
    s.add(dot(12, color).at(x(value), 0), label('Center ' + value, x(value), 75, 48, color));
  }
  const query = dot(17, 'yellow').at(x(4.9), 0);
  s.add(query, label('Query moves from 4.9 to 5.2', 0, -235, 50, 'yellow'));
  s.wait(2);
  s.play(
    to(query, (n) => n.at(x(5.2), 0)),
    { duration: 1 },
  );
  s.wait(3.8);
  s.play(
    fadeIn([label('5.2 away', -400, -70, 47, 'dim'), label('4.8 away', 420, -70, 47, 'purple')]),
    { duration: 0.5 },
  );
  s.wait(2);
  s.play(fadeIn(label('Open center 10', 615, 165, 46, 'purple')), { duration: 0.5 });
  s.wait(3);
  s.play(fadeIn(label('key_rotation  5.1      •      quota_page  9', 0, 340, 49)), {
    duration: 0.5,
  });
  s.wait(6.7);
});
