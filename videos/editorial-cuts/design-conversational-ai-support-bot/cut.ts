import { film, text, line, rect, fadeIn } from 'vizmatic/stage';

export default film({ title: 'What does Alex’s ticket establish?', look: 'midnight' }, (s) => {
  const words = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color, font: 'text-serif' }).at(x, y);
  const reveal = (...nodes: ReturnType<typeof text>[]) => s.play(fadeIn(nodes), { duration: 0.4 });
  s.add(words('Alex disputes an invoice', 0, -395, 82));
  s.add(rect(1330, 515, { radius: 16, fill: 'surface', stroke: 'gridStrong', width: 3 }).at(0, 0));
  s.add(words('SUPPORT TICKET   ·   48291', 0, -181, 36, 'blue'));
  s.add(line([-585, -122], [585, -122], { stroke: 'gridStrong', width: 2 }));
  s.wait(1.8);
  reveal(words('“I think I was charged twice.”', 0, -27, 72));
  s.wait(5.6);
  reveal(words('Invoice A10234', -305, 140, 43), words('$900.00', 310, 140, 60, 'yellow'));
  s.wait(3.8);
  reveal(words('What can the assistant verify?', 0, 357, 53, 'teal'));
  s.wait(6.6);
});
