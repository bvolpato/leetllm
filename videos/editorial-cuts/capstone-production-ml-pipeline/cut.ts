import { fadeIn, film, line, rect, text, type ColorInput } from 'vizmatic/stage';
const label = (value: string, x: number, y: number, color: ColorInput = 'ink') =>
  text(value, { size: 48, color }).at(x, y);
const title = (value: string) => text(value, { font: 'text-serif', size: 75 }).at(0, -350);
export default film({ look: 'midnight' }, (s) => {
  s.add(title('Should the cheaper model ship?'), label('Evaluation cost', -450, -185));
  s.add(label('100  →  96', -450, 0, 'teal'));
  s.wait(4.5);
  s.play(fadeIn(label('Actual late deliveries', 390, -185)), { duration: 0.4 });
  s.play(fadeIn(label('eval-1', 210, -35)), fadeIn(label('eval-2', 610, -35)), { duration: 0.4 });
  s.wait(2.6);
  s.play(fadeIn(label('Warned', 210, 72, 'teal')), fadeIn(label('Missed', 610, 72, 'yellow')), {
    duration: 0.4,
  });
  s.wait(2.2);
  s.play(fadeIn(label('1 of 2 late cases caught', 390, 205)), { duration: 0.4 });
  s.wait(2.3);
  s.play(fadeIn(label('Hold release', 0, 335, 'yellow')), { duration: 0.4 });
  s.wait(3.4);
});
