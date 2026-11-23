import { film, text, line, fadeIn } from 'vizmatic/stage';

export default film({ look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, color = 'ink', size = 46) =>
    text(value, { font: 'mono', size, color }).at(x, y);
  const values = ['+5', '∅', '+6', '+7', '+1', '∅', '0', '−2'];
  const x = (i: number) => -670 + i * 190;
  s.add(text('When does the alert change state?', { font: 'text-serif', size: 76 }).at(0, -365));
  s.add(label('Two consecutive breaches open it. Two clean readings clear it.', 0, -225, 'ink', 38));
  for (let i = 0; i < values.length; i++) {
    s.add(label(values[i], x(i), -45), label(i * 5 + 'm', x(i), 45, 'dim', 35));
  }
  const note = (str: string, xPos: number, y: number, col: string) =>
    fadeIn(label(str, xPos, y, col, 36));
  s.wait(1);
  s.play(note('reset', x(1), 140, 'yellow'), { duration: 0.35 });
  s.wait(5.2 - s.duration);
  s.play(fadeIn(line([x(2), 107], [x(3), 107], { stroke: 'yellow', width: 6 })),
    note('open at 15m', (x(2) + x(3)) / 2, 215, 'yellow'), { duration: 0.45 });
  s.wait(11.4 - s.duration);
  s.play(note('reset', x(5), 140, 'yellow'), { duration: 0.35 });
  s.wait(16.5 - s.duration);
  s.play(fadeIn(line([x(6), 107], [x(7), 107], { stroke: 'teal', width: 6 })),
    note('clear at 35m', (x(6) + x(7)) / 2, 215, 'teal'), { duration: 0.45 });
  s.wait(20.931 - s.duration);
  s.play(note('Delivery requires its own receipt.', 0, 345, 'ink'), { duration: 0.5 });
  s.wait(25.038 - s.duration);
});
