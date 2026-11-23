import { film, text, line, circle, dot, arrow, fadeIn, fadeOut, to } from 'vizmatic/stage';

export default film({ title: 'Clip one vector', look: 'midnight' }, (s) => {
  const title = text('What survives a unit clipping bound?', { font: 'text-serif', size: 77 }).at(
    0,
    -396,
  );
  const x = -575,
    y = 270,
    scale = 133;
  const p = (a: number, b: number): [number, number] => [x + a * scale, y - b * scale];
  const label = (v: string, a: number, b: number, color = 'ink') =>
    text(v, { size: 47, font: 'mono', color }).at(a, b);
  s.add(
    title,
    line(p(-1.2, 0), p(3.65, 0), { stroke: 'gridStrong', width: 3 }),
    line(p(0, -1.1), p(0, 4.35), { stroke: 'gridStrong', width: 3 }),
    circle(scale, { fill: null, stroke: 'yellow', width: 4 }).at(x, y),
    label('C = 1', x - 210, y - 100, 'yellow'),
  );
  s.add(
    arrow(p(0, 0), p(0.4, 0.3), { stroke: 'teal', width: 7, tip: 14 }),
    label('(0.4, 0.3) stays inside', 355, -156, 'teal'),
  );
  s.wait(4.1);
  const endpoint = dot(13, 'pink').at(...p(3, 4));
  const trail = line(p(0, 0), p(3, 4), { stroke: 'pink', width: 4 });
  s.play(fadeIn([trail, endpoint, label('(3, 4) has length 5', 350, -40, 'pink')]), {
    duration: 0.45,
  });
  s.wait(2.95);
  s.play(to(endpoint, (n) => n.at(...p(0.6, 0.8)), { duration: 1.5 }));
  s.play(
    fadeOut(trail),
    fadeIn(arrow(p(0, 0), p(0.6, 0.8), { stroke: 'pink', width: 7, tip: 14 })),
    fadeIn(label('÷ 5  →  (0.6, 0.8)', 355, 85, 'pink')),
    { duration: 0.45 },
  );
  s.wait(5.75);
});
