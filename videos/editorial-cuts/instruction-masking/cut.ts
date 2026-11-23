import { film, text, line, draw, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Where should the reply stop?', look: 'midnight', fps: 30 }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color, font: 'mono' }).at(x, y);
  s.add(
    text('Where should the reply stop?', { size: 90, font: 'text-serif' }).at(0, -355),
    label('User', -650, -155, 44, 'blue'),
    label('How is my dog?', -115, -155, 66),
  );
  s.wait(1.8);
  s.play(
    fadeIn(label('Assistant', -650, -32, 44, 'teal')),
    fadeIn(label('She is happy.', -115, -32, 66)),
    { duration: 0.45 },
  );
  s.wait(1.75);
  s.play(
    draw(line([225, -92], [225, 55], { stroke: 'yellow', width: 6 })),
    fadeIn(label('Turn end', 225, 104, 40, 'yellow')),
    { duration: 0.55 },
  );
  s.wait(2);
  s.play(fadeIn(label('Missing turn-end target', -355, 263, 45, 'pink')), { duration: 0.4 });
  s.play(
    draw(line([32, 263], [250, 263], { stroke: 'pink', width: 5 })),
    fadeIn(label('<user> Why?', 540, 263, 55, 'pink')),
    { duration: 0.75 },
  );
  s.wait(8.3);
});
