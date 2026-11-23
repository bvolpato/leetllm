import { film, rect, text, fadeIn, draw, line } from 'vizmatic/stage';

export default film({ title: 'Who is in the flagged queue?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('A signup is flagged.', { size: 86, font: 'text-serif' }).at(0, -365));
  const specimen = rect(510, 225, { fill: 'surface', stroke: 'yellow', width: 4, radius: 15 }).at(
    -480,
    -5,
  );
  s.add(
    specimen,
    label('SIGNUP S-001', -480, -50, 33),
    label('Flagged for review', -480, 34, 48, 'yellow'),
  );
  s.wait(1.5);
  const axis = line([20, 14], [745, 14], { stroke: 'gridStrong', width: 26 });
  s.play(fadeIn(label('Among abusive signups', 380, -115, 52)), draw(axis), { duration: 0.45 });
  s.play(draw(line([20, 14], [20 + 725 * 0.95, 14], { stroke: 'yellow', width: 26 })), {
    duration: 0.85,
  });
  s.play(fadeIn(label('95% receive a flag', 380, 95, 46, 'yellow')), { duration: 0.3 });
  s.wait(2.3);
  s.play(
    fadeIn(
      text('Among flagged signups, how many are abusive?', { size: 57, font: 'text-serif' }).at(
        0,
        265,
      ),
    ),
    { duration: 0.4 },
  );
  s.wait(10.6);
});
