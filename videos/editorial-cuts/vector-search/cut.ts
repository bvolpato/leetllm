import { film, text, line, dot, fadeIn, draw } from 'vizmatic/stage';

export default film({ title: 'Measure one neighbor', look: 'midnight', fps: 30 }, (s) => {
  const heading = text('How far is A from the query?', { font: 'text-serif', size: 82 }).at(
    0,
    -355,
  );
  const q: [number, number] = [-300, 165],
    a: [number, number] = [-580, -115],
    corner: [number, number] = [-580, 165];
  s.add(
    heading,
    dot(11, 'blue').at(...q),
    dot(11, 'teal').at(...a),
    text('query (4.8, 5.0)', { font: 'mono', size: 39, color: 'blue' }).at(-265, 250),
    text('A (4.6, 5.2)', { font: 'mono', size: 39, color: 'teal' }).at(-555, -183),
  );
  s.wait(2);
  s.play(draw(line(q, corner, { stroke: 'blue', width: 6 })), { duration: 0.55 });
  s.play(draw(line(corner, a, { stroke: 'teal', width: 6 })), { duration: 0.55 });
  s.play(
    fadeIn(text('−0.2', { font: 'mono', size: 41, color: 'blue' }).at(-440, 110)),
    fadeIn(text('+0.2', { font: 'mono', size: 41, color: 'teal' }).at(-665, 20)),
    { duration: 0.3 },
  );
  s.wait(1.5);
  s.play(fadeIn(text('d² = (−0.2)² + (+0.2)²', { font: 'mono', size: 52 }).at(375, -100)), {
    duration: 0.4,
  });
  s.wait(1.4);
  s.play(fadeIn(text('= 0.04 + 0.04', { font: 'mono', size: 52 }).at(375, 10)), { duration: 0.4 });
  s.play(
    draw(line(q, a, { stroke: 'yellow', width: 5 })),
    fadeIn(text('d² = 0.08', { font: 'mono', size: 78, color: 'yellow' }).at(375, 145)),
    { duration: 0.7 },
  );
  s.wait(8.7);
});
