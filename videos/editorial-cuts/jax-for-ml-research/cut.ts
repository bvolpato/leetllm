import { film, text, rect, fadeIn, fadeOut } from 'vizmatic/stage';

export default film({ title: 'Pad the shape, preserve the mean', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size = 56, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const row = (x: number, value: string, valid: boolean) => [
    rect(245, 150, { radius: 12, fill: 'surface', stroke: valid ? 'teal' : 'dim', width: 3 }).at(
      x,
      0,
    ),
    label(value, x, 0, 78, valid ? 'teal' : 'dim'),
  ];
  s.add(
    label('One short batch, two valid examples', 0, -345, 78),
    label('Squared errors', 0, -170, 48),
    ...row(-465, '4', true),
    ...row(-155, '1', true),
  );
  const incoming = label('Incoming shape [2, 2]', 0, 137, 48);
  s.add(incoming, label('Cached variant [4, 2]', 0, -250, 44, 'blue'));
  s.wait(7.8);
  const pads = [...row(155, '0', false), ...row(465, '0', false)];
  s.play(fadeOut(incoming), { duration: 0.15 });
  s.play(fadeIn(pads), fadeIn(label('Padded shape [4, 2]', 0, 137, 48, 'blue')), { duration: 0.3 });
  const denominator = label('4 slots     (4 + 1) / 4 = 1.25', 0, 292, 58, 'yellow');
  s.play(fadeIn(denominator), { duration: 0.4 });
  s.wait(3.5);
  s.play(fadeOut(denominator), { duration: 0.2 });
  s.play(fadeIn(label('2 valid rows     (4 + 1) / 2 = 2.50', 0, 292, 64, 'teal')), {
    duration: 0.4,
  });
  s.wait(6.25);
});
