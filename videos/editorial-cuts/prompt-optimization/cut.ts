import { film, text, line, fadeIn, fadeOut } from 'vizmatic/stage';
export default film({ title: 'Read the scope of the approval', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color, font: 'mono' }).at(x, y);
  s.add(
    text('Does this approval cover the request?', { size: 80, font: 'text-serif' }).at(0, -360),
  );
  s.add(
    label('REQUEST', -520, -190, 42, 'dim'),
    label('deploy', -520, -85, 70),
    label('payment-service', -520, 15, 49),
  );
  s.wait(3);
  s.play(
    fadeIn([
      label('APPROVAL-4412', 470, -190, 42, 'dim'),
      label('roll back', 470, -85, 70, 'yellow'),
      label('payment-tests', 470, 15, 49, 'yellow'),
    ]),
    { duration: 0.4 },
  );
  const wrong = label('A    SERVE', 0, 190, 64, 'yellow');
  s.play(fadeIn(wrong), { duration: 0.35 });
  s.wait(4);
  s.play(
    fadeIn(line([-740, 73], [-300, 73], { stroke: 'blue', width: 5 })),
    fadeIn(line([225, 73], [715, 73], { stroke: 'yellow', width: 5 })),
    { duration: 0.4 },
  );
  const score = label('Score  0', 0, 284, 45);
  s.play(fadeIn(score), { duration: 0.4 });
  s.wait(8.65);
  s.play(fadeOut([wrong, score]), { duration: 0.3 });
  s.play(fadeIn(label('B    ABSTAIN    ·    no record', 0, 190, 58, 'teal')), { duration: 0.35 });
  s.wait(1.2);
  s.play(fadeIn(label('Score  1', 0, 284, 45)), { duration: 0.3 });
  s.wait(2.95);
});
