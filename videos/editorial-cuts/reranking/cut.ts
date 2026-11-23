import { film, text, rect, line, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Read the selected evidence', look: 'midnight' }, (s) => {
  const words = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(words('Is the library open on Sunday?', 0, -340, 72));
  s.add(rect(1260, 285, { fill: 'surface', stroke: 'teal', radius: 18 }).at(0, -30));
  s.add(words('SELECTED PASSAGE     hours-v7', 0, -112, 32, 'teal'));
  s.add(words('“Sunday: the library is closed.”', 0, 5, 70));
  s.wait(3.6);
  s.play(fadeIn(line([-142, 55], [497, 55], { stroke: 'yellow', width: 5 })), { duration: 0.45 });
  s.wait(3.4);
  s.play(fadeIn(words('Highly relevant', -460, 266, 60, 'teal')), { duration: 0.4 });
  s.wait(1.8);
  s.play(fadeIn(words('Supported answer: No', 305, 266, 60, 'yellow')), { duration: 0.4 });
  s.wait(6.15);
});
