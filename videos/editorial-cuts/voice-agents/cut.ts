import { film, text, rect, line, dot, fadeIn, fadeOut, to } from 'vizmatic/stage';
export default film(
  { title: 'How much of the answer did Alex hear?', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const title = text('How much of the answer did Alex hear?', {
      font: 'text-serif',
      size: 75,
    }).at(0, -375);
    s.add(title);
    // The caller’s correction stops playback before the queued tail reaches the listener.
    const x = -650;
    s.add(
      label('Alex', x, -190, 52, 'blue'),
      label('Incident 4219?', x, -115),
      line([-680, 70], [680, 70], { stroke: 'dim', width: 4 }),
    );
    s.wait(4);
    s.play(fadeIn(label('Agent reply', -520, -50, 42)));
    const queued = rect(1160, 54, { fill: 'surface', stroke: 'dim', width: 2 }).at(0, 35);
    s.add(queued);
    const sound = Array.from({ length: 15 }, (_, i) =>
      rect(52, 54, { fill: 'teal' }).at(-550 + i * 79, 35),
    );
    for (const beat of sound.slice(0, 7)) s.play(fadeIn(beat), { duration: 0.22 });
    s.wait(0.46);
    s.play(
      fadeIn(label('Alex interrupts', -60, -145, 64, 'yellow')),
      fadeIn(line([-48, -65], [-48, 100], { stroke: 'yellow', width: 5 })),
      { duration: 0.4 },
    );
    s.wait(1.6);
    s.play(
      fadeIn(label('Heard', -330, 180, 54, 'teal')),
      fadeIn(label('Still queued', 320, 180, 54, 'dim')),
      { duration: 0.5 },
    );
    s.wait(6.7);
  },
);
