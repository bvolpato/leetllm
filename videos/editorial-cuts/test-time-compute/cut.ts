import { film, text, rect, line, fadeIn, to } from 'vizmatic/stage';
export default film(
  { title: 'Which answer survives the check?', look: 'midnight', fps: 30 },
  (s) => {
    const label = (value: string, x: number, y: number, size = 50, color = 'ink') =>
      text(value, { size, color }).at(x, y);
    s.add(text('Which answer survives the check?', { font: 'text-serif', size: 75 }).at(0, -383));

    for (let i = 0; i < 4; i++) {
      const x = -630 + i * 255;
      s.add(rect(116, 72, { fill: 'surface', stroke: 'dim', radius: 16 }).at(x, -55));
      for (let j = 0; j < 8; j++)
        s.add(
          rect(22, 22, { fill: 'blue', radius: 5 }).at(
            x - 48 + 32 * (j % 4),
            -55 + (j < 4 ? -61 : 61),
          ),
        );
    }
    const chairs = Array.from({ length: 12 }, (_, i) =>
      rect(24, 24, { fill: 'teal', radius: 5 }).at(
        505 + (i % 4) * 36,
        -110 + Math.floor(i / 4) * 42,
      ),
    );
    s.play(fadeIn(chairs), { duration: 0.6 });
    s.add(label('4 tables × 8', -250, 100), label('Along the wall', 560, 100));
    s.wait(5.8);
    s.play(fadeIn(label('32 seated   +   12 extra   =   44 chairs', 0, 248, 63, 'teal')), {
      duration: 0.6,
    });
    s.wait(13);
  },
);
