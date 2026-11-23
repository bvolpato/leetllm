import { fadeIn, film, rect, text } from 'vizmatic/stage';

export default film({ title: 'Which responses beat their peers?', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('Four answers to one prompt', { font: 'text-serif', size: 85 }).at(0, -350));
  const rewards = [1, 0, 1, 0];
  const mean = rewards.reduce((sum, reward) => sum + reward, 0) / rewards.length;
  const centered = [];
  for (const [index, reward] of rewards.entries()) {
    const x = -495 + 330 * index;
    s.add(rect(285, 200, { fill: null, stroke: 'gridStrong', width: 2, radius: 12 }).at(x, -100));
    s.add(label('Response ' + (index + 1), x, -150, 36, 'dim'), label(String(reward), x, -70, 63));
    const difference = reward - mean;
    centered.push(label((difference > 0 ? '+' : '−') + Math.abs(difference).toFixed(1), x, 185, 66, difference > 0 ? 'teal' : 'purple'));
  }
  s.wait(7.5);
  s.play(fadeIn(label('Group mean  =  (1 + 0 + 1 + 0) / 4  =  0.5', 0, 75, 44)), { duration: 0.4 });
  s.wait(3.8);
  s.play(...centered.map((value) => fadeIn(value)), { duration: 0.4 });
  s.wait(3.9);
});
