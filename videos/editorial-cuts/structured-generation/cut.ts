import { fadeIn, film, line, text } from 'vizmatic/stage';
export default film({ title: 'Two legal completions' }, (s) => {
  const t = (v: string, x: number, y: number, size = 54, color = 'ink') =>
    text(v, { font: 'mono', size, color }).at(x, y);
  s.add(
    text('Which completions are still possible?', { font: 'text-serif', size: 72 }).at(0, -380),
    t('{"status":"', -450, -30),
    line([-190, -30], [130, -160], { stroke: 'dim', width: 4 }),
    line([-190, -30], [130, 100], { stroke: 'dim', width: 4 }),
  );
  const open = t('open"}', 335, -160, 68, 'teal'),
    closed = t('closed"}', 340, 100, 68, 'teal');
  s.play(fadeIn(open), fadeIn(closed), { duration: 0.6 });
  s.wait(8.2);
  s.play(fadeIn(t('accepted prefix', -450, 92, 35, 'blue')), { duration: 0.4 });
  s.wait(10.8);
  s.play(fadeIn(t('next character: c', 0, 300, 52, 'blue')), { duration: 0.45 });
  s.wait(3.0);
  s.add(line([175, -160], [500, -160], { stroke: 'yellow', width: 5 }));
  s.wait(6.117);
});
