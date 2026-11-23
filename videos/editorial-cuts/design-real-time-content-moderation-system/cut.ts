import { film, text, line, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'What the human queue requires', look: 'midnight' }, (s) => {
  const t = (v: string, x: number, y: number, size = 48, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(
    text('What the human queue requires', { font: 'text-serif', size: 84 }).at(0, -376),
    t('Classifier receives 2,000 requests/s', 0, -220, 58),
  );
  s.add(
    rect(900, 90, { fill: 'blue', stroke: null }).at(-150, -54),
    rect(300, 90, { fill: 'yellow', stroke: null }).at(450, -54),
    t('1,500 resolved', -150, 62),
    t('500 escalated', 450, 62),
  );
  s.wait(6.1);
  s.play(
    fadeIn(line([450, 104], [450, 180], { stroke: 'dim', width: 4 })),
    fadeIn(t('Judge resolves 400/s', 450, 213, 39)),
    fadeIn(t('100/s reach people', 450, 277, 47, 'yellow')),
    { duration: 0.4 },
  );
  s.wait(3.8);
  s.add(t('100/s × 120 s', -390, 238, 54), t('12,000 busy reviewers', -390, 329, 46, 'blue'));
  s.wait(3.1);
  s.play(fadeIn(t('At 70% occupancy: 17,143 staff', 351, 373, 44, 'teal')), { duration: 0.45 });
  s.wait(4.69);
});
