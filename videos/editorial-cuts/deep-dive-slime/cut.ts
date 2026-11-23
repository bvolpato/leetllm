import { film, text, rect, line, draw, fadeIn, to } from 'vizmatic/stage';

export default film(
  { title: 'A perfect reward. Which tokens train?', look: 'midnight', fps: 30 },
  (s) => {
    const t = (v: string, x: number, y: number, size = 49, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const edge = (x: number, y: number, a: number, b: number) =>
      line([x, y], [a, b], { stroke: 'blue', width: 4 });
    s.add(
      text('A perfect reward. Which tokens train?', { size: 78, font: 'text-serif' }).at(0, -378),
    );
    s.add(t('Example rollout 7', -520, -205, 56), t('Reward  1.0', 475, -205, 60, 'teal'));
    s.wait(4);
    s.add(t('Recorded response', 0, -75, 48));
    const fields = ['act', 'act', 'tool', 'tool', 'act', 'act'];
    fields.forEach((v, i) => s.add(t(v, -525 + i * 210, 35, 56, v === 'tool' ? 'yellow' : 'blue')));
    s.wait(5);
    s.play(fadeIn(t('Loss mask', -715, 155, 40)), { duration: 0.5 });
    fields.forEach((v, i) =>
      s.add(t(v === 'tool' ? '0' : '1', -525 + i * 210, 155, 60, v === 'tool' ? 'yellow' : 'blue')),
    );
    s.wait(3);
    s.add(t('Also check the policy version that sampled this response.', 0, 295, 41));
    s.wait(6.5);
  },
);
