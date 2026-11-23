import { film, text, rect, line, draw, fadeIn, to } from 'vizmatic/stage';

export default film(
  { title: 'Why does the old answer survive?', look: 'midnight', fps: 30 },
  (s) => {
    const t = (v: string, x: number, y: number, size = 49, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const edge = (x: number, y: number, a: number, b: number) =>
      line([x, y], [a, b], { stroke: 'blue', width: 4 });
    s.add(text('Why does the old answer survive?', { size: 78, font: 'text-serif' }).at(0, -378));
    s.add(
      t('Example run', -625, -235, 42), t('09:12', -625, -160, 66, 'yellow'),
      t('Trainer', -175, -215, 48),
      t('Sampler', 480, -215, 48),
    );
    s.add(t('loss ↓', -175, -85, 68, 'teal'), t('return x', 480, -85, 64));
    s.wait(4);
    s.play(draw(edge(-175, -10, -175, 120)), draw(edge(480, -10, 480, 120)), { duration: 0.5 });
    s.wait(4.5);
    s.add(t('adapter v2', -175, 180, 55, 'teal'), t('snapshot v1', 480, 180, 55, 'yellow'));
    s.wait(7.0);
  },
);
