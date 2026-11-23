import { film, text, line, fadeIn, draw } from 'vizmatic/stage';

export default film({ look: 'midnight' }, (s) => {
  s.add(text('How old is the reading?', { font: 'text-serif', size: 88 }).at(0, -385));
  const mark = (v: string, x: number, y: number, col = 'ink') =>
    text(v, { font: 'mono', size: 45, color: col }).at(x, y);
  const x0 = -758,
    x1 = 535,
    x2 = 643;
  s.add(line([x0, 0], [x2, 0], { stroke: 'dim', width: 3 }));
  for (const x of [x0, x1, x2]) s.add(line([x, -15], [x, 15], { stroke: 'ink', width: 4 }));
  s.add(mark('09:50', x0, 75), mark('Heartbeat', x0, 141));
  s.play(
    draw(line([x0, -80], [x1, -80], { stroke: 'yellow', width: 7 })),
    fadeIn(mark('11:50 snapshot', 390, -208, 'yellow')),
    { duration: 1.3 },
  );
  s.play(fadeIn(mark('2 hours since heartbeat', -167, -142, 'yellow')));
  s.wait(3.6 - s.duration);
  s.play(
    draw(line([x1, 88], [x2, 88], { stroke: 'blue', width: 7 })),
    fadeIn(mark('12:00 score', 620, 170, 'blue')),
    { duration: 0.7 },
  );
  s.play(fadeIn(mark('10 minutes since snapshot', 388, 249, 'blue')));
  s.wait(12 - s.duration);
  s.play(fadeIn(text('Save both times with the prediction.', { size: 53 }).at(-156, 342)));
  s.wait(22.8 - s.duration);
});
