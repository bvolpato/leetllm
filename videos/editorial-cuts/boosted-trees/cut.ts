import { film, text, line, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'One job follows the trees', look: 'midnight' }, (s) => {
  const heading = text('How does a tree change the score?', { font: 'text-serif', size: 79 }).at(
    0,
    -390,
  );
  const label = (v: string, x: number, y: number, color = 'ink', size = 48) =>
    text(v, { size, color }).at(x, y);
  const branch = (x: number) => [
    line([x, -182], [x - 95, -69], { stroke: 'dim', width: 4 }),
    line([x, -182], [x + 95, -69], { stroke: 'teal', width: 8 }),
  ];
  s.add(heading, label('One scheduler job', -580, -230, 'blue'), label('Base score', -580, 60));
  const a = branch(-130),
    b = branch(300);
  s.play(...a.map((n) => draw(n)), { duration: 0.8 });
  s.play(fadeIn(label('+ leaf update', -100, 60, 'teal')), { duration: 0.5 });
  s.wait(1.6);
  s.play(...b.map((n) => draw(n)), { duration: 0.8 });
  s.play(fadeIn(label('+ leaf update', 340, 60, 'teal')), { duration: 0.5 });
  s.wait(4.3);
  s.play(fadeIn(label('Raw score   →   probability', -220, 235, 'ink', 56)), { duration: 0.6 });
  s.wait(1.4);
  s.play(fadeIn(label('→   alert policy', 440, 235, 'yellow', 56)), { duration: 0.6 });
  s.wait(5);
});
