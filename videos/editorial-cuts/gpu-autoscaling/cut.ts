import { film, text, rect, line, fadeIn, to } from 'vizmatic/stage';
export default film(
  { title: 'Who gets a slot before the deadline?', look: 'midnight', fps: 30 },
  (s) => {
    const label = (value: string, x: number, y: number, size = 50, color = 'ink') =>
      text(value, { size, color }).at(x, y);
    s.add(
      text('Who gets a slot before the deadline?', { font: 'text-serif', size: 75 }).at(0, -383),
    );

    const pools = [1, 3, 20],
      admitted = [20, 60, 100];
    const rows = pools.map((pool, i) => {
      const y = -185 + 168 * i;
      s.add(label(pool + ' warm', -670, y, 57));
      const marks = Array.from({ length: 100 }, (_, n) =>
        rect(11, 47, { fill: n < admitted[i] ? 'teal' : 'gridStrong' }).at(-410 + n * 11.2, y),
      );
      return [...marks, label(admitted[i] + ' / 100', 220, y + 58, 40)];
    });
    s.add(label('Requests in arrival order', 130, -287, 40));
    for (const row of rows) {
      s.play(fadeIn(row), { duration: 0.6 });
      s.wait(1.9);
    }
    s.wait(2);
    s.play(
      fadeIn(
        label(
          'Start deadline   30 s                     Cold capacity ready   207 s',
          0,
          300,
          44,
          'yellow',
        ),
      ),
      { duration: 0.5 },
    );
    s.wait(8);
  },
);
