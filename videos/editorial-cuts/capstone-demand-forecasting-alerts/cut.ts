import { fadeIn, film, line, rect, text, type ColorInput } from 'vizmatic/stage';
const label = (value: string, x: number, y: number, color: ColorInput = 'ink') =>
  text(value, { size: 48, color }).at(x, y);
const title = (value: string) => text(value, { font: 'text-serif', size: 75 }).at(0, -350);
export default film({ look: 'midnight', fps: 30 }, (s) => {
  s.add(
    title('Sunday can change Friday’s staffing.'),
    line([-680, 10], [680, 10], { stroke: 'gridStrong', width: 5 }),
    label('Sunday', -540, 105),
    label('Friday', 540, 105),
  );
  s.add(label('Staffing decision', -540, -80, 'blue'));
  s.wait(4);
  s.play(
    fadeIn(label('Forecast   163.3', -540, -175, 'teal')),
    fadeIn(label('Capacity   150', -540, 225)),
    { duration: 0.5 },
  );
  s.wait(4);
  s.play(fadeIn(label('Review staffing now', 0, 255, 'yellow')), { duration: 0.5 });
  s.wait(3);
  s.play(fadeIn(label('Actual   176', 540, -175, 'teal')), { duration: 0.5 });
  s.wait(4.5);
});
