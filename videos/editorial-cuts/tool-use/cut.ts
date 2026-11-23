import { film, text, rect, line, draw, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Is River Walk on the shelf?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('Can I borrow River Walk today?', { size: 82, font: 'text-serif' }).at(0, -365));
  const book = rect(220, 310, { fill: 'surface', stroke: 'blue', width: 5, radius: 12 }).at(
    -535,
    5,
  );
  s.add(book, label('River', -535, -40, 57), label('Walk', -535, 32, 57));
  s.wait(4);
  s.play(draw(line([-390, 4], [80, 4], { stroke: 'gridStrong', width: 5 })), { duration: 0.65 });
  s.add(
    label('Library catalog', 420, -148, 58),
    rect(600, 185, { fill: 'surface', stroke: 'teal', width: 4, radius: 10 }).at(420, 4),
  );
  s.play(
    fadeIn(label('Copies available', 420, -30, 45)),
    fadeIn(label('?', 420, 42, 74, 'yellow')),
    { duration: 0.45 },
  );
  s.wait(6.9);
  s.play(fadeIn(label('Read the current catalog record.', 80, 265, 57, 'teal')), { duration: 0.5 });
  s.wait(5.5);
});
