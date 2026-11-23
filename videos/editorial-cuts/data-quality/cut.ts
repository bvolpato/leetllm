import { film, text, line, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'One message in both splits', look: 'midnight' }, (s) => {
  const title = text('Could the classifier have seen this before?', {
    font: 'text-serif',
    size: 77,
  }).at(0, -375);
  const label = (v: string, x: number, y: number, color = 'ink', size = 44) =>
    text(v, { size, color }).at(x, y);
  const divider = line([0, -240], [0, 240], { stroke: 'gridStrong', width: 3 });
  const left = label('Build is still failing', -470, -75),
    right = label('BUILD  is still failing', 470, -75);
  s.add(
    title,
    divider,
    label('TRAINING  ·  101', -470, -190, 'blue'),
    label('EVALUATION  ·  102', 470, -190, 'teal'),
    left,
    right,
  );
  s.wait(4.5);
  const key = label('build is still failing', -470, 68, 'yellow'),
    copied = label('build is still failing', 470, 68, 'yellow');
  s.play(fadeIn([key, copied]), { duration: 0.65 });
  s.wait(2.3);
  const verdict = label('escalate', -470, 217, 'blue', 52);
  s.play(fadeIn(verdict), { duration: 0.45 });
  const replay = label('escalate', -470, 217, 'blue', 52);
  s.add(replay);
  s.play(
    to(replay, (n) => n.at(470, 217)),
    { duration: 1.25 },
  );
  s.wait(2.4);
  s.play(fadeIn(label('Unfamiliar message  →  standard', 0, 342, 'dim', 42)), { duration: 0.45 });
  s.wait(4.5);
});
