import { film, text, line, fadeIn, fadeOut, rect, to } from 'vizmatic/stage';

export default film(
  { title: 'A restart changes the next batch', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 50, color = 'ink') =>
      text(v, { size, color, font: 'mono' }).at(x, y);
    s.add(
      text('Which update runs after the restart?', { size: 76, font: 'text-serif' }).at(0, -370),
    );
    s.add(label('Consumed examples', -540, -175, 38), label('Next batch', 410, -175, 38));
    s.add(line([-730, 0], [725, 0], { stroke: 'dim', width: 4 }));
    for (let i = 0; i < 4; i++) {
      const x = -560 + i * 330;
      s.add(
        rect(245, 115, {
          radius: 12,
          fill: 'surface',
          stroke: i === 3 ? 'teal' : 'dim',
          width: 3,
        }).at(x, 0),
      );
      s.add(label('Batch ' + String.fromCharCode(65 + i), x, 0, 44));
    }
    const cursor = label('▲', 430, 120, 55, 'teal');
    const note = label('Saved cursor', 430, 190, 38, 'teal');
    s.add(cursor, note);
    s.wait(3.4);
    s.play(
      fadeOut(note),
      to(cursor, (n) => n.at(-560, 120)),
      { duration: 0.7 },
    );
    const repeat = label('Cursor reset: batch A repeats', 0, 250, 48, 'yellow');
    s.play(fadeIn(repeat), { duration: 0.4 });
    s.wait(4.1);
    s.play(fadeOut(repeat), { duration: 0.4 });
    const weights = label('Weights restored', -330, 275, 46, 'teal');
    const wrong = label('Data position lost', 365, 275, 46, 'yellow');
    s.play(fadeIn(weights), fadeIn(wrong), { duration: 0.5 });
    s.wait(9.612);
  },
);
