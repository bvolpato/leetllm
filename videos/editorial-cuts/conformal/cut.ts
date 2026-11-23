import { film, rect, text, fadeIn, line } from 'vizmatic/stage';

export default film({ title: 'Whose requests get covered?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('Whose requests get covered?', { font: 'text-serif', size: 82 }).at(0, -360));
  const left = -510,
    width = 1320;
  const group = (name: string, n: number, covered: number, y: number) => {
    const total = (width * n) / 750,
      success = (width * covered) / 750;
    return {
      base: [
        label(name, -700, y, 47),
        rect(total, 78, { fill: 'gridStrong', stroke: null }).at(left + total / 2, y),
        label(n + ' requests', left + total / 2, y - 88, 39),
      ],
      fill: [
        rect(success, 78, { fill: 'teal', stroke: null }).at(left + success / 2, y),
        label(covered + ' covered', left + success / 2, y + 88, 41, 'teal'),
      ],
    };
  };
  const a = group('Short', 750, 720, -135),
    b = group('Long', 250, 135, 123);
  s.add(...a.base);
  s.wait(4.2);
  s.play(fadeIn(a.fill), { duration: 0.4 });
  s.wait(1.3);
  s.play(fadeIn(b.base), { duration: 0.4 });
  s.wait(2.6);
  s.play(fadeIn(b.fill), { duration: 0.4 });
  s.wait(6.5);
  s.play(
    fadeIn([
      line([-810, 305], [810, 305], { stroke: 'gridStrong' }),
      label('720 + 135 = 855 covered out of 1,000', 0, 370, 53, 'teal'),
    ]),
    { duration: 0.4 },
  );
  s.wait(5.1);
});
