import { film, text, line, dot, fadeIn, arrow } from 'vizmatic/stage';

export default film({ title: 'One rate, two directions', look: 'midnight' }, (s) => {
  const words = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color, font: 'mono' }).at(x, y);
  s.add(text('Two errors start one unit away.', { font: 'text-serif', size: 76 }).at(0, -360));
  for (const [index, name] of ['a', 'b'].entries()) {
    const y = -100 + 265 * index;
    const tint = index === 0 ? 'blue' : 'teal';
    s.add(
      words(name, -740, y, 64, tint),
      line([-590, y], [530, y], { stroke: 'gridStrong', width: 4 }),
      line([-20, y - 25], [-20, y + 25], { stroke: 'ink', width: 4 }),
      dot(16, tint).at(530, y),
      words('target  0', -20, y + 70, 32),
      words('start  1', 530, y + 70, 32, tint),
    );
  }
  s.wait(3.8);
  s.play(
    fadeIn(words('gradient  100', 265, -175, 47, 'blue')),
    fadeIn(words('gradient  1', 265, 90, 47, 'teal')),
    { duration: 0.4 },
  );
  s.wait(2.6);
  s.play(
    fadeIn(arrow([530, -100], [-460, -100], { stroke: 'blue', width: 6 })),
    fadeIn(arrow([530, 165], [520.1, 165], { stroke: 'teal', width: 6, tip: 8 })),
    { duration: 0.45 },
  );
  s.wait(2.1);
  s.play(fadeIn(words('η = 0.018     Same rate, different steps', 0, 360, 46)), { duration: 0.4 });
  s.wait(2.5);
  s.play(
    fadeIn(words('a = −0.8', -460, -170, 38, 'blue')),
    fadeIn(words('b = 0.982', 270, 245, 35, 'teal')),
    fadeIn(words('Loss   50.5 → 32.4822', 0, -255, 44)),
    { duration: 0.35 },
  );
  s.wait(5.1);
});
