import { film, text, line, dot, fadeIn, draw } from 'vizmatic/stage';

export default film({ look: 'midnight' }, (s) => {
  const label = (str: string, x: number, y: number, size = 48, color = 'ink') =>
    text(str, { size, color }).at(x, y);
  s.add(text('What does a miss of ten cost?', { font: 'text-serif', size: 88 }).at(0, -386));
  s.add(label('Forecast: 100 jobs', 0, -240), line([-680, 190], [680, 190], { stroke: 'dim' }));
  const left = [-580, 145] as [number, number],
    right = [580, -215] as [number, number];
  s.add(label('90 jobs', -580, 254), label('100', 0, 254), label('110 jobs', 580, 254));
  s.wait(2);
  s.play(draw(line([0, 190], right, { stroke: 'yellow', width: 6 })), { duration: 1 });
  s.play(fadeIn(label('q × 10', 610, -62, 54, 'yellow')));
  s.wait(3);
  s.play(draw(line(left, [0, 190], { stroke: 'blue', width: 6 })), { duration: 1 });
  s.play(fadeIn(label('(1 − q) × 10', -445, 60, 54, 'blue')));
  s.wait(17.6 - s.duration);
  s.play(fadeIn(label('q = 0.9', -580, -190, 55)));
  s.play(
    fadeIn(dot(11, 'yellow').at(...right)),
    fadeIn(label('9 loss units', 635, -282, 52, 'yellow')),
  );
  s.wait(21.1 - s.duration);
  s.play(fadeIn(dot(11, 'blue').at(...left)), fadeIn(label('1 loss unit', -600, -35, 52, 'blue')));
  s.wait(25.3 - s.duration);
});
