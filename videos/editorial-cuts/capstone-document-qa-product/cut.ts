import { fadeIn, film, line, rect, text, type ColorInput } from 'vizmatic/stage';
const label = (value: string, x: number, y: number, color: ColorInput = 'ink') =>
  text(value, { size: 48, color }).at(x, y);
const title = (value: string) => text(value, { font: 'text-serif', size: 75 }).at(0, -350);
export default film({ look: 'midnight' }, (s) => {
  s.add(
    title('Who can admit this note?'),
    label('Private note', -465, -180, 'blue'),
    label('Registry', 465, -180, 'teal'),
  );
  s.add(label('approved = true', -465, 0), label('Written inside the note', -465, 110, 'dim'));
  s.wait(4.2);
  s.play(
    fadeIn(line([-75, 0], [75, 0], { stroke: 'gridStrong', width: 5 })),
    fadeIn(label('Look up the grant', 460, 0)),
    { duration: 0.5 },
  );
  s.wait(3.8);
  s.play(fadeIn(label('No publication grant', 465, 110, 'yellow')), { duration: 0.45 });
  s.wait(3.5);
  s.play(fadeIn(label('Keep the note outside the index', 0, 305, 'yellow')), { duration: 0.45 });
  s.wait(4.417);
});
