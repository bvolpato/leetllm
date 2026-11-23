import { film, text, rect, line, fadeIn, fadeOut, to } from 'vizmatic/stage';

export default film({ look: 'midnight', fps: 30 }, (s) => {
  const label = (words: string, x: number, y: number, size = 52, color = 'ink', font = 'mono') =>
    text(words, { size, color, font }).at(x, y);
  const rule = (x1: number, y1: number, x2: number, y2: number, color = 'dim', width = 4) =>
    line([x1, y1], [x2, y2], { stroke: color, width });
  const heading = (words: string) => label(words, 0, -344, 76, 'ink', 'text-serif');
  const reveal = (...nodes: any[]) => s.play(fadeIn(nodes), { duration: 0.45 });
  s.add(
    heading('What did the connector change?'),
    label('Source onboarding', -463, -205, 52),
    label('Lookup p95', 456, -205, 52),
  );
  s.add(rule(0, -230, 0, 251, 'dim', 3));
  const bar = (x: number, y: number, w: number, color: string) =>
    rect(w, 52, { fill: color, stroke: null }).at(x + w / 2, y);
  reveal(bar(-796, -76, 610, 'dim'), label('20 days', -550, -76, 41, 'bg'));
  s.wait(1.7);
  reveal(bar(-796, 68, 183, 'teal'), label('6 days', -499, 68, 43, 'teal'));
  s.wait(2);
  reveal(bar(109, -76, 522, 'dim'), label('720 ms', 370, -76, 40, 'bg'));
  reveal(bar(109, 68, 493, 'blue'), label('680 ms', 354, 68, 40, 'bg'));
  reveal(rule(689, -140, 689, 145, 'yellow', 5), label('800 ms target', 570, 205, 38, 'yellow'));
  s.wait(2);
  reveal(label('Synthetic comparison', -470, 313, 43, 'dim'));
  s.wait(11.8);
});
