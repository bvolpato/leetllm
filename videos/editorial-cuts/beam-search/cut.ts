import { film, text, line, dot, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'How many complete paths?', look: 'midnight' }, (s) => {
  const words = (label: string, x: number, y: number, size = 48, color = 'ink') =>
    text(label, { size, color }).at(x, y);
  s.add(words('How many complete paths?', 0, -413, 76));
  const positions = [-720, -260, 215, 680];
  const spread = (count: number, i: number) => ((i + 0.5) / count - 0.5) * 646;
  s.add(dot(10, 'yellow').at(positions[0], 0));
  for (let depth = 1; depth <= 3; depth++) {
    const count = 3 ** depth;
    const branches = Array.from({ length: count }, (_, i) =>
      line(
        [positions[depth - 1], spread(count / 3, Math.floor(i / 3))],
        [positions[depth], spread(count, i)],
        { stroke: depth === 3 ? 'teal' : 'blue', width: 3 },
      ),
    );
    s.play(...branches.map((branch) => draw(branch)), { duration: 1 });
    s.add(words(String(count), positions[depth], 395, 54, 'teal'));
    s.wait(1);
  }
  s.wait(3);
  s.play(fadeIn(words('3³ = 27 complete paths', 0, -345, 44)), { duration: 0.4 });
  s.wait(3);
  s.play(fadeIn(words('32,000¹⁰⁰ ≈ 3.27 × 10⁴⁵⁰', 0, 465, 46, 'yellow')), { duration: 0.6 });
  s.wait(7);
});
