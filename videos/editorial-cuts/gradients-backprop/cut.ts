import { film, text, rect, line, fadeIn, fadeOut, linear, to } from 'vizmatic/stage';

export default film({ title: 'How much does a miss cost?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size = 50, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('Square the miss.', { size: 90, font: 'text-serif' }).at(0, -390));
  const base = -275,
    axisY = 70,
    scale = 155;
  s.add(line([base - scale, axisY], [base + 2.5 * scale, axisY], { width: 4, stroke: 'dim' }));
  for (let i = 4; i <= 7; i++) {
    const x = base + (i - 5) * scale;
    s.add(
      line([x, axisY - 13], [x, axisY + 13], { width: 4, stroke: 'ink' }),
      label(String(i), x, axisY + 61),
    );
  }
  s.add(
    label('Seconds', base + scale * 0.5, axisY + 155),
    label('Observed', base, axisY - 70, 42, 'teal'),
  );
  const square = (n: number) =>
    rect(scale * n, scale * n, { fill: 'blue', stroke: 'blue', width: 3 }).at(
      530,
      135 - (scale * n) / 2,
    );
  const first = square(1),
    four = square(2),
    trial = square(0.8);
  const note = label('1 × 1 = 1', 530, 220),
    next = label('2 × 2 = 4', 530, 220),
    last = label('0.8 × 0.8 = 0.64', 530, 220, 48);
  const marker = rect(12, 58, { fill: 'yellow' }).at(base + scale, axisY);
  const gap = label('Prediction: 6 s', base + scale, axisY - 158, 46, 'yellow');
  s.add(first, note, marker, gap);
  s.wait(4.6);
  const alt = label('Suppose the miss is 2 s', base + scale, axisY - 158, 44, 'yellow');
  s.play(
    fadeOut([first, note, gap]),
    fadeIn([four, next, alt]),
    to(marker, (m) => m.shift(scale, 0)),
    { duration: 0.7 },
  );
  const divisions = [
    line([530 - scale, 135 - scale], [530 + scale, 135 - scale], { stroke: 'ink', width: 4 }),
    line([530, 135 - 2 * scale], [530, 135], { stroke: 'ink', width: 4 }),
  ];
  s.play(fadeIn(divisions), { duration: 0.3 });
  s.wait(5.7);
  const actual = label('2 blocks × 2.9 = 5.8 s', base + scale, axisY - 158, 44, 'yellow');
  s.play(
    fadeOut([four, ...divisions, next, alt]),
    fadeIn([trial, last, actual]),
    to(marker, (m) => m.shift(-1.2 * scale, 0), { ease: linear }),
    { duration: 0.8 },
  );
  s.wait(7.6);
});
