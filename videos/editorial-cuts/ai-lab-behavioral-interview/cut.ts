import { film, text, rect, line, fadeIn, fadeOut, to } from 'vizmatic/stage';

export default film({ look: 'midnight', fps: 30 }, (s) => {
  const label = (words: string, x: number, y: number, size = 52, color = 'ink', font = 'mono') =>
    text(words, { size, color, font }).at(x, y);
  const rule = (x1: number, y1: number, x2: number, y2: number, color = 'dim', width = 4) =>
    line([x1, y1], [x2, y2], { stroke: color, width });
  const heading = (words: string) => label(words, 0, -344, 76, 'ink', 'text-serif');
  const reveal = (...nodes: any[]) => s.play(fadeIn(nodes), { duration: 0.45 });
  s.add(
    heading('Friday, 09:12'),
    label('Scheduled', -530, -136, 45, 'dim'),
    label('Broad release', -510, -45, 73),
  );
  s.add(rule(-86, -170, -86, 182));
  const row1 = label('Denied snippet', 342, -145, 50);
  const row2 = label('Denied citation', 347, 12, 50);
  s.wait(3.3);
  reveal(row1);
  reveal(label('restricted text returned', 379, -80, 40, 'yellow'));
  reveal(row2);
  reveal(label('restricted text returned', 379, 77, 40, 'yellow'));
  s.wait(2.1);
  reveal(label('Candidate traffic', -489, 116, 43, 'dim'));
  reveal(label('0%', -505, 225, 104, 'blue'));
  s.wait(11.9);
});
