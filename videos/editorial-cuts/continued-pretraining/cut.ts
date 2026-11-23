import { film, text, line, dot, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Choose the eligible checkpoint', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const x = (ppl: number) => -615 + (ppl - 19) * 245;
  const gate = x(20.7);
  s.add(
    label('Which checkpoint clears the budget?', 0, -355, 78),
    label('General-text perplexity', 0, -232, 50),
    line([-650, 0], [650, 0], { stroke: 'dim', width: 4 }),
    line([gate, -113], [gate, 129], { stroke: 'yellow', width: 5 }),
    label('Budget 20.7', gate, -157, 43, 'yellow'),
    label('Base 19.2', x(19.2), 169, 45),
    dot(12, 'ink').at(x(19.2), 0),
  );
  const result = (name: string, ppl: number, y: number, color: string) => [
    dot(15, color).at(x(ppl), 0),
    line([x(ppl), 0], [x(ppl), y], { stroke: color, width: 3 }),
    label(name + ' · ' + ppl, x(ppl), y + (y > 0 ? 36 : -36), 39, color),
  ];
  s.wait(2);
  s.play(fadeIn(result('12k', 23.9, 66, 'pink')), { duration: 0.5 });
  s.wait(4);
  s.play(fadeIn([...result('1k', 19.5, -56, 'teal'), ...result('4k', 20.1, 60, 'teal')]), {
    duration: 0.5,
  });
  s.wait(8);
  s.play(
    fadeIn([
      label('Task accuracy among eligible checkpoints', 0, 283, 51),
      label('Base   62%', -445, 389, 57),
      label('1k   68%', 0, 389, 57),
      label('4k   72%', 445, 389, 61, 'teal'),
    ]),
    { duration: 0.5 },
  );
  s.wait(9.5);
});
