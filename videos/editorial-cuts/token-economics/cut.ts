import { film, text, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'Room in the monthly budget', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color, font: 'mono' }).at(x, y);
  const from = -770,
    width = 1540,
    forecast = 717.18,
    budget = 750;
  s.add(
    text('How much room is left?', { size: 92, font: 'text-serif' }).at(0, -360),
    label('Monthly budget', -475, -180, 52),
    label('$750.00', 590, -180, 68),
  );
  s.add(rect(width, 76, { stroke: 'dim', fill: 'surface' }).at(0, 90));
  s.wait(4.4);
  s.play(fadeIn(label('One answer   $0.00720', 0, -30, 63, 'teal')), { duration: 0.35 });
  s.wait(9.3);
  const used = (width * forecast) / budget;
  s.play(
    fadeIn(rect(used, 70, { fill: 'teal', stroke: null }).at(from + used / 2, 90)),
    fadeIn(label('Monthly forecast   $717.18', -310, 215, 48)),
    { duration: 0.7 },
  );
  s.wait(1.55);
  s.play(fadeIn(label('$32.82 left', 590, 215, 48, 'yellow')), { duration: 0.4 });
  s.wait(5.0);
});
