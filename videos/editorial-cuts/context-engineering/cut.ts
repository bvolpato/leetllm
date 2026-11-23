import { film, text, rect, line, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'What fits and what is missing?', look: 'midnight', fps: 30 }, (s) => {
  const caption = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('What can this packet prove?', { font: 'text-serif', size: 85 }).at(0, -370));
  s.add(
    rect(1480, 290, { fill: 'surface', stroke: 'gridStrong', width: 4, radius: 12 }).at(0, -18),
  );
  s.add(caption('Next model call', -515, -215, 43), caption('128k token limit', 530, -215, 43));
  const used = rect(300, 150, { fill: 'blue', stroke: null, radius: 7 }).at(-540, -18);
  s.play(fadeIn(used), { duration: 0.6 });
  s.add(caption('old lock theory', -540, -18, 35, 'surface'));
  s.wait(5.2);
  s.play(draw(line([-350, 107], [690, 107], { stroke: 'teal', width: 4 })), { duration: 0.8 });
  s.play(fadeIn(caption('Still room for more input', 180, 186, 51, 'teal')), { duration: 0.4 });
  s.wait(2.1);
  s.play(
    fadeIn(caption('Checked trace', -533, 305, 49, 'yellow')),
    fadeIn(caption('outside the packet', 26, 305, 44)),
    { duration: 0.5 },
  );
  s.wait(9.4);
});
