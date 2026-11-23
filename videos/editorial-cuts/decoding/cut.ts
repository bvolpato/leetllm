import { film, text, line, dot, fadeIn, fadeOut } from 'vizmatic/stage';

export default film({ title: 'Change the edge', look: 'midnight', fps: 30 }, (s) => {
  const word = (a: string, x: number, y: number, size = 54, color = 'ink') =>
    text(a, { size, color }).at(x, y);
  const title = word('Can the second token overturn the first?', 0, -380, 78);
  const branches = [
    word('The dog', -710, -15),
    word('ran  ·  .60', -240, -140),
    word('slept  ·  .40', -240, 125),
    line([-540, -10], [-425, -135], { stroke: 'dim' }),
    line([-540, 0], [-425, 120], { stroke: 'dim' }),
    word('home or outside  ·  .35', 230, -140, 40),
    word('soundly  ·  .90', 200, 125),
    word('.21', 665, -140, 76, 'teal'),
    word('.36', 665, 125, 76, 'blue'),
  ];
  s.add(title, ...branches);
  s.wait(3.4);
  s.play(fadeOut([branches[6], branches[8]]), { duration: 0.25 });
  const change = [
    word('soundly  ·  .50', 200, 125),
    word('.20', 665, 125, 76, 'dim'),
    word('Both slept paths now score .40 × .50 = .20.', 0, 294, 46),
  ];
  s.play(fadeIn(change), { duration: 0.4 });
  s.wait(3.35);
  s.play(fadeOut([title, ...branches.filter((_, i) => i !== 6 && i !== 8), ...change]), {
    duration: 0.3,
  });
  const rail = line([-685, 95], [685, 95], { stroke: 'dim', width: 5 });
  s.add(word('Which word crosses the nucleus threshold?', 0, -375, 72), rail);
  const marks = [
    ['ran', 0.45],
    ['slept', 0.7],
    ['played', 0.85],
  ] as const;
  for (const [name, p] of marks) {
    const x = -685 + 1370 * p;
    s.add(dot(10, 'teal').at(x, 95), word(name, x, 10, 40), word(p.toFixed(2), x, 159, 38));
  }
  const target = word('▼ .70', 274, -98, 48, 'yellow');
  s.add(target);
  s.wait(2.75);
  s.play(fadeOut(target), { duration: 0.2 });
  s.add(
    word('▼ .80', 411, -98, 48, 'yellow'),
    word('Include played to reach .85.', 0, 310, 54, 'teal'),
  );
  s.wait(4.6);
});
