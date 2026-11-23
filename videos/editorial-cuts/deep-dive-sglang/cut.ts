import { film, text, rect, line, draw, fadeIn, to } from 'vizmatic/stage';

export default film(
  { title: 'Where does the second answer come from?', look: 'midnight', fps: 30 },
  (s) => {
    const t = (v: string, x: number, y: number, size = 49, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const edge = (x: number, y: number, a: number, b: number) =>
      line([x, y], [a, b], { stroke: 'blue', width: 4 });
    s.add(
      text('Where does the second answer come from?', { size: 78, font: 'text-serif' }).at(0, -378),
    );
    s.add(t('Ticket: Add dark mode to settings', 0, -210, 57));
    s.wait(2);
    s.add(t('Choose a category', -455, -35, 50));
    const result = s.add(t('feature', -455, 65, 62, 'yellow'));
    s.wait(2);
    s.play(
      draw(edge(-250, 50, 250, 50)),
      to(result, (n) => n.at(490, 65)),
      { duration: 1 },
    );
    s.add(t('Explain this category', 475, -35, 50));
    s.wait(4);
    s.add(t('Shared instructions', -460, 245, 46, 'blue'));
    s.play(draw(edge(-205, 240, 125, 185)), draw(edge(-205, 240, 125, 290)), { duration: 0.5 });
    s.add(t('Ticket A • own output', 460, 185, 40), t('Ticket B • own output', 460, 290, 40));
    s.wait(10.5);
  },
);
