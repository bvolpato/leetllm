import { film, text, rect, line, dot, fadeIn, fadeOut, to } from 'vizmatic/stage';
export default film(
  { title: 'Can the same seed resume this sample?', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const title = text('Can the same seed resume this sample?', {
      font: 'text-serif',
      size: 75,
    }).at(0, -375);
    s.add(title);
    // Two continuations of the same latent expose which random draw is consumed next.
    s.add(
      label('Saved latent', -620, -145, 51, 'blue'),
      label('step k', -620, -65, 45),
      line([-430, -65], [-260, -65], { stroke: 'blue', width: 4 }),
    );
    s.wait(2);
    s.play(fadeIn(label('Restore generator state', 185, -170, 54, 'teal')));
    s.play(fadeIn(label('draw k + 1', 185, -64, 70, 'teal')));
    s.wait(3.5);
    s.play(fadeIn(label('Restart original seed', 185, 110, 54, 'yellow')));
    s.play(fadeIn(label('draw 1', 185, 213, 70, 'yellow')));
    s.wait(1);
    s.play(fadeIn(label('Same latent. Different next update.', 0, 335, 46)));
    s.wait(5);
  },
);
