import {
  film,
  text,
  rect,
  line,
  circle,
  fadeIn,
  fadeOut,
  to,
  type ColorInput,
} from 'vizmatic/stage';
export default film({ title: 'Can two workspaces share a replica?', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color: ColorInput) =>
    text(value, { size, color }).at(x, y);
  const box = (x: number, y: number, w: number, h: number, color: ColorInput) =>
    rect(w, h, { radius: 18, fill: null, stroke: color, width: 4 }).at(x, y);
  s.add(label('Can two workspaces share a replica?', 0, -405, 74, 'ink'));

  const requests = [
    ['A', 'Design review', -210, 'blue'],
    ['B', 'Incident summary', 90, 'teal'],
  ] as const;
  for (const [id, name, y, color] of requests) {
    s.add(
      label(name, -540, y - 60, 52, color),
      box(-540, y + 50, 480, 105, color),
      label('Workspace ' + id, -540, y + 50, 42, color),
    );
  }
  const replica = box(460, -50, 560, 430, 'purple');
  s.play(fadeIn(replica), fadeIn(label('Shared replica', 460, -55, 56, 'purple')), {
    duration: 0.5,
  });
  for (const [id, , y, color] of requests) {
    const token = label(id, -240, y + 50, 62, color);
    s.add(token);
    s.play(
      to(token, (n) => n.shift(650, 0)),
      { duration: 1.1 },
    );
  }
  s.wait(2.8);
  s.play(
    fadeIn(label('A history   ·   A budget', -540, -60, 32, 'blue')),
    fadeIn(label('B history   ·   B budget', -540, 250, 32, 'teal')),
    { duration: 0.5 },
  );
  s.wait(16);
});
