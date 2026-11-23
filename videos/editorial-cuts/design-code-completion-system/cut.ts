import { film, text, rect, fadeIn, fadeOut } from 'vizmatic/stage';
export default film({ title: 'Does this reply still fit the editor?', look: 'midnight' }, (s) => {
  const mono = (v: string, x: number, y: number, size = 58, color = 'ink') =>
    text(v, { font: 'mono', size, color }).at(x, y);
  s.add(
    text('Does this reply still fit the editor?', { font: 'text-serif', size: 83 }).at(0, -375),
    rect(1560, 278, { fill: 'surface', stroke: 'dim', width: 3, radius: 16 }).at(0, -90),
  );
  const first = mono('is_allowed = ▏', -360, -92);
  const rev = mono('buffer 41', 518, -177, 37, 'blue');
  s.add(first, rev);
  s.wait(2);
  s.play(fadeIn(mono('request · buffer 41', -322, 140, 42, 'blue')), { duration: 0.45 });
  s.wait(2);
  s.play(fadeOut(first), fadeOut(rev), { duration: 0.2 });
  s.add(mono('is_allowed = graph.▏', -272, -92), mono('buffer 42', 518, -177, 37, 'teal'));
  s.wait(2.8);
  s.play(fadeIn(mono('reply · buffer 41', 341, 140, 42, 'blue')), { duration: 0.4 });
  s.wait(2.2);
  s.add(mono('41 ≠ 42', 0, 268, 75, 'yellow'));
  s.wait(1.3);
  s.add(mono('Discard the stale suggestion.', 0, 379, 47));
  s.wait(3.65);
});
