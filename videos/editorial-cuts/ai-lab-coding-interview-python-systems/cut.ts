import { film, text, rect, line, fadeIn, fadeOut, to } from 'vizmatic/stage';

export default film({ look: 'midnight', fps: 30 }, (s) => {
  const label = (words: string, x: number, y: number, size = 52, color = 'ink', font = 'mono') =>
    text(words, { size, color, font }).at(x, y);
  const rule = (x1: number, y1: number, x2: number, y2: number, color = 'dim', width = 4) =>
    line([x1, y1], [x2, y2], { stroke: color, width });
  const heading = (words: string) => label(words, 0, -344, 76, 'ink', 'text-serif');
  const reveal = (...nodes: any[]) => s.play(fadeIn(nodes), { duration: 0.45 });
  s.add(
    heading('Who has claimed /guide?'),
    label('Worker A', -605, -125),
    label('Worker B', -605, 125),
  );
  s.add(rule(-365, -125, 705, -125), rule(-365, 125, 705, 125));
  const first = label('absent', -200, -192, 49, 'blue');
  const second = label('absent', -200, 57, 49, 'blue');
  reveal(first);
  s.wait(1.75);
  reveal(second);
  s.wait(1.6);
  reveal(label('fetch /guide', 388, -192, 48, 'yellow'));
  reveal(label('fetch /guide', 388, 57, 48, 'yellow'));
  s.wait(2.25);
  reveal(label('1 page', -245, 310, 65), label('2 requests', 250, 310, 65, 'yellow'));
  s.wait(12.15);
});
