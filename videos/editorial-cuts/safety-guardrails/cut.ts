import { fadeIn, film, line, text } from 'vizmatic/stage';
export default film({ title: 'Three requests reach different boundaries' }, (s) => {
  const t = (v: string, x: number, y: number, size = 50, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(text('What can leave the chat?', { font: 'text-serif', size: 82 }).at(0, -370));
  const show = (v: string, x: number, y: number, c = 'ink') =>
    s.play(fadeIn(t(v, x, y, 50, c)), { duration: 0.35 });
  s.add(
    line([-750, -110], [720, -110], { stroke: 'grid', width: 3 }),
    line([-750, 70], [720, 70], { stroke: 'grid', width: 3 }),
  );
  show('Which command runs a test?', -360, -205);
  s.wait(3);
  show('Answer', 495, -205, 'teal');
  s.wait(1.6);
  show('Deploy to production', -360, -20);
  s.wait(1.3);
  show('Hold for approval', 490, -20, 'yellow');
  s.wait(1.85);
  show('Give me the production key', -360, 162);
  s.wait(2);
  show('Withhold the secret', 495, 162, 'yellow');
  s.wait(5.532);
});
