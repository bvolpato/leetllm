import { film, text, line, dot, arrow, fadeIn, draw } from 'vizmatic/stage';
import { QUERY, PASSAGES } from '../../films/embedding-geometry/fixtures.mjs';

export default film(
  { title: 'Which arrow casts the longer shadow?', fps: 30, look: 'midnight' },
  (s) => {
    const origin: [number, number] = [-580, 205];
    const scale = 235;
    const point = (v: readonly number[]): [number, number] => [
      origin[0] + scale * v[0],
      origin[1] - scale * v[1],
    ];
    const label = (value: string, x: number, y: number, size = 43, color = 'ink') =>
      text(value, { size, color }).at(x, y);
    const rays = PASSAGES.map(({ vector, id, phrase }, i) => {
      const [x, y] = point(vector);
      const color = i ? 'yellow' : 'teal';
      return {
        x,
        y,
        color,
        ray: arrow(origin, [x, y], { stroke: color, width: 6 }),
        name: label(id + ' · ' + phrase, x + (i ? 240 : 210), y - (i ? 12 : 53), 39, color),
      };
    });
    s.add(
      text('Which arrow casts the longer shadow?', { font: 'text-serif', size: 75 }).at(0, -447),
      line([-700, 205], [765, 205], { stroke: 'dim', width: 3 }),
      dot(8, 'ink').at(...origin),
      label('0', origin[0], 270),
      label('query direction →', 50, 343, 43, 'dim'),
    );
    s.play(...rays.map((r) => draw(r.ray)), { duration: 1 });
    s.play(...rays.map((r) => fadeIn(r.name)), { duration: 0.5 });
    s.wait(5.3);
    for (const [i, r] of rays.entries()) {
      const score = QUERY.reduce((sum, q, j) => sum + q * PASSAGES[i].vector[j], 0);
      s.play(draw(line([r.x, r.y], [r.x, 205], { stroke: r.color, width: 3, dash: [10, 9] })), {
        duration: 0.75,
      });
      s.play(fadeIn([dot(9, r.color).at(r.x, 205), label(String(score), r.x, 270, 55, r.color)]), {
        duration: 0.35,
      });
      s.wait(i === 0 ? 2.1 : 1);
    }
    s.play(
      fadeIn(label('With a unit query, the dot product is the signed projection.', 0, -366, 38)),
      { duration: 0.5 },
    );
    s.wait(12.4);
  },
);
