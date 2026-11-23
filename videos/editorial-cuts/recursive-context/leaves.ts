import { film, text, rect, fadeIn, fadeOut } from 'vizmatic/stage';

export default film({ title: 'Count completed leaf requests', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);

  s.add(label('One request per manual page', 0, -323, 74));
  const position = (i: number) => -600 + (i % 4) * 400;
  const row = (i: number) => -88 + Math.floor(i / 4) * 154;
  for (let i = 0; i < 8; i++) {
    s.add(
      rect(320, 104, { stroke: 'gridStrong', fill: 'surface', width: 3, radius: 12 }).at(position(i), row(i)),
      label('Page ' + (i + 1), position(i), row(i), 43, 'dim'),
    );
  }
  let counter = label('0 of 8 completed', 0, 304, 62);
  s.add(counter);
  s.wait(4.8);
  for (let i = 0; i < 8; i++) {
    const next = label((i + 1) + ' of 8 completed', 0, 304, 62);
    const received = rect(320, 104, { stroke: 'blue', fill: 'surface', width: 4, radius: 12 }).at(position(i), row(i));
    s.play(fadeOut(counter), fadeIn([received, label('Page ' + (i + 1) + '  ✓', position(i), row(i), 43, 'blue'), next]), { duration: 0.25 });
    counter = next;
    s.wait(0.72);
  }
  s.wait(4.128);
});
