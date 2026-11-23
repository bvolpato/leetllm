import { film, text, rect, fadeIn, line } from 'vizmatic/stage';

export default film({ title: 'A full window with no history', look: 'midnight', fps: 30 }, (s) => {
  const caption = (v: string, x: number, y: number, size = 48, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const left = -800,
    pitch = 46;
  const cell = (i: number, color: string) =>
    rect(43, 104, { fill: color, radius: 3 }).at(left + i * pitch, 0);
  s.add(caption('Will the required request fit?', 0, -365, 80));
  for (let i = 0; i < 32; i++) s.add(cell(i, 'surface'));
  s.add(
    line([left + 31.5 * pitch, -125], [left + 31.5 * pitch, 120], { stroke: 'red', width: 5 }),
    caption('32-unit limit', left + 29 * pitch, -165, 42, 'red'),
  );
  const segment = (from: number, n: number, c: string) =>
    Array.from({ length: n }, (_, i) => cell(from + i, c));
  s.play(
    fadeIn(segment(0, 14, 'blue')),
    fadeIn(caption('Instructions · 14', left + 6.5 * pitch, 130, 44, 'blue')),
    { duration: 0.65 },
  );
  s.wait(2);
  s.play(
    fadeIn(segment(14, 12, 'teal')),
    fadeIn(caption('Question · 12', left + 19.5 * pitch, 130, 44, 'teal')),
    { duration: 0.65 },
  );
  s.wait(1.7);
  s.play(
    fadeIn(segment(26, 8, 'yellow')),
    fadeIn(caption('Answer reserve · 8', left + 27 * pitch, 228, 44, 'yellow')),
    { duration: 0.65 },
  );
  s.wait(2);
  s.play(fadeIn(caption('34 required units. Two sit outside the window.', 0, -233, 54)), {
    duration: 0.45,
  });
  s.wait(3.5);
  s.play(fadeIn(caption('Optional history already uses zero units.', 0, 340, 47)), {
    duration: 0.4,
  });
  s.wait(6.95);
});
