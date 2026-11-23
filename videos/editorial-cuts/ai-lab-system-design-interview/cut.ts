import { film, text, rect, line, fadeIn, fadeOut, to } from 'vizmatic/stage';

export default film({ look: 'midnight', fps: 30 }, (s) => {
  const label = (words: string, x: number, y: number, size = 52, color = 'ink', font = 'mono') =>
    text(words, { size, color, font }).at(x, y);
  const rule = (x1: number, y1: number, x2: number, y2: number, color = 'dim', width = 4) =>
    line([x1, y1], [x2, y2], { stroke: color, width });
  const heading = (words: string) => label(words, 0, -344, 76, 'ink', 'text-serif');
  const reveal = (...nodes: any[]) => s.play(fadeIn(nodes), { duration: 0.45 });
  s.add(
    heading('Can R-105 start in time?'),
    label('R-105', -625, -145, 88, 'blue'),
    label('valid request', -615, -38, 44),
  );
  reveal(label('quota available', -605, 75, 40, 'teal'));
  s.wait(2.6);
  const x = -210;
  s.add(rule(x, 0, 746, 0), label('arrival', x, 82, 38));
  reveal(
    rule(298, -145, 298, 105, 'yellow', 6),
    label('first-token deadline', 299, -224, 40, 'yellow'),
  );
  s.wait(1.15);
  const queue = rect(700, 54, { fill: 'blue', stroke: null }).at(x + 350, 0);
  reveal(queue, label('shared queue wait', 105, 175, 43));
  s.wait(1.1);
  reveal(label('earliest start', 494, 77, 39, 'blue'));
  s.wait(2.2);
  reveal(label('Which response should the client receive?', 0, 310, 54, 'ink', 'text-serif'));
  s.wait(8.7);
});
