import { film, text, rect, line, draw, fadeIn, to } from 'vizmatic/stage';

export default film(
  { title: 'Can a valid shape hide a wrong token?', look: 'midnight', fps: 30 },
  (s) => {
    const t = (v: string, x: number, y: number, size = 49, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const edge = (x: number, y: number, a: number, b: number) =>
      line([x, y], [a, b], { stroke: 'blue', width: 4 });
    s.add(
      text('Can a valid shape hide a wrong token?', { size: 78, font: 'text-serif' }).at(0, -378),
    );
    s.add(t('Source row a', -620, -120), t('[1, 0]', -620, -30, 66, 'yellow'));
    s.wait(3);
    s.play(draw(edge(-465, -55, -180, -160)), draw(edge(-465, -55, -180, 85)), { duration: 0.7 });
    s.add(t('GPU 0 · expert 0', 45, -165), t('GPU 1 · expert 3', 45, 85));
    s.wait(3);
    s.play(draw(edge(280, -165, 515, -55)), draw(edge(280, 85, 515, -55)), { duration: 1 });
    s.add(t('Return to', 650, -140), t('row a', 650, -40, 64, 'teal'));
    s.wait(4);
    s.play(fadeIn(t('A return to row b has the same shape.', 0, 250, 50, 'yellow')), {
      duration: 0.5,
    });
    s.wait(7.3);
  },
);
