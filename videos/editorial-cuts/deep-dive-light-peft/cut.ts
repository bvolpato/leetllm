import { film, text, rect, line, draw, fadeIn, to } from 'vizmatic/stage';

export default film(
  { title: 'Which weights does one token touch?', look: 'midnight', fps: 30 },
  (s) => {
    const t = (v: string, x: number, y: number, size = 49, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const edge = (x: number, y: number, a: number, b: number) =>
      line([x, y], [a, b], { stroke: 'blue', width: 4 });
    s.add(
      text('Which weights does one token touch?', { size: 78, font: 'text-serif' }).at(0, -378),
    );
    s.add(t('One token', -685, -210, 48, 'yellow'));
    for (let i = 0; i < 6; i++)
      s.add(rect(95, 88, { fill: 'surface', stroke: 'blue', width: 3 }).at(-320 + i * 130, -120));
    s.add(t('Frozen backbone', 55, -230), t('Adapter', -255, 130, 46, 'teal'));
    const token = s.add(rect(27, 27, { fill: 'yellow', stroke: null }).at(-685, -120));
    s.wait(2);
    s.play(
      to(token, (n) => n.at(385, -120)),
      { duration: 3.5 },
    );
    s.add(t('Forward pass reads every block', 50, -15, 48, 'blue'));
    s.wait(2.4);
    s.play(draw(edge(-125, 132, 160, 132)), fadeIn(t('Update', 295, 132, 50, 'teal')), {
      duration: 0.6,
    });
    s.wait(6.5);
  },
);
