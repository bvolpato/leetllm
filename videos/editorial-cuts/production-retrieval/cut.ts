import { film, text, rect, line, fadeIn, fadeOut } from 'vizmatic/stage';

export default film({ title: 'What does E1 actually support?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  const question = label('Can a stale service key rotate automatically?', 0, -325, 72);
  const rule = rect(1180, 310, { fill: 'surface', stroke: 'dim', width: 3, radius: 20 }).at(0, 40);
  const divider = line([-540, -4], [540, -4], { stroke: 'grid', width: 2 });
  s.add(question);
  s.wait(3.6);
  s.play(fadeIn([rule, divider, label('Claim and evidence', -315, -62, 48, 'dim')]), {
    duration: 0.4,
  });
  const claim = label('30 days', -228, 89, 100);
  const citation = label('E1', 392, 89, 76, 'blue');
  s.play(fadeIn(claim), { duration: 0.4 });
  s.wait(2.8);
  s.play(fadeIn(citation), { duration: 0.4 });
  s.wait(3.3);
  const evidence = label('E1', -443, 89, 76, 'blue');
  const scope = label('Browser sessions', 100, 89, 76, 'yellow');
  s.play(fadeOut([claim, citation]), { duration: 0.3 });
  s.play(fadeIn([evidence, scope]), { duration: 0.5 });
  s.wait(2.8);
  s.play(fadeIn(label('Requested scope: service keys', 0, 250, 52, 'blue')), { duration: 0.4 });
  s.wait(5.6);
});
