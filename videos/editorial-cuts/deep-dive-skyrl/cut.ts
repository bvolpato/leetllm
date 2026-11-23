import { fadeIn, film, line, rect, text } from 'vizmatic/stage';
export default film({ title: 'Who wrote each token?', look: 'midnight' }, (s) => {
  const word = (v: string, x: number, y: number, size = 42, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const title = text('Who wrote each token?', { font: 'text-serif', size: 94 }).at(0, -370);
  const lane = (x: number, value: string, id: number, author: string, tone: string) => [
    rect(210, 112, { fill: 'surface', stroke: tone, width: 4, radius: 10 }).at(x, -50),
    word(value, x, -50, 44, tone),
    word('ID ' + id, x, 46, 30, 'dim'),
    word(author, x, 142, 34, tone),
  ];
  s.add(title, line([-720, -50], [720, -50], { stroke: 'gridStrong', width: 3 }));
  s.add(...lane(-610, 'try', 11, 'policy', 'teal'), ...lane(-305, 'query', 12, 'policy', 'teal'));
  s.wait(1.4);
  s.play(...lane(0, 'DB error', 90, 'database', 'yellow').map((n) => fadeIn(n)), { duration: 0.3 });
  s.wait(0.9);
  s.play(
    ...[
      ...lane(305, 'repair', 21, 'policy', 'teal'),
      ...lane(610, 'query', 22, 'policy', 'teal'),
    ].map((n) => fadeIn(n)),
    { duration: 0.4 },
  );
  s.wait(3.7);
  s.play(fadeIn(word('Keep the complete interaction in order.', 0, 280, 52)), { duration: 0.4 });
  s.wait(2.8);
  s.play(
    fadeIn(
      word('Actions are sampled. The database supplies the observation.', 0, 354, 39, 'yellow'),
    ),
    { duration: 0.4 },
  );
  s.wait(6.2);
});
