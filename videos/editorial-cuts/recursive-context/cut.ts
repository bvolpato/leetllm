import { film, text, rect, line, fadeIn, fadeOut, to } from 'vizmatic/stage';
export default film({ title: 'Find the missing expiry', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  s.add(label('When does the exception expire?', 0, -370, 78));
  const page = rect(800, 480, { fill: 'surface', stroke: 'gridStrong', width: 3, radius: 13 }).at(
    -450,
    8,
  );
  const p5 = label('Manual  /  page 5', -450, -145, 45, 'dim');
  const condition = label('Require audit logging.', -450, 20, 59);
  const record = label('Evidence', 445, -143, 44);
  const saved = label('Audit logging  ·  p. 5', 445, -40, 53);
  const missing = label('Expiry   ?', 445, 95, 63, 'yellow');
  s.add(page, p5, condition, record, saved, missing);
  s.wait(4.3);
  s.play(fadeOut([p5, condition]), { duration: 0.3 });
  const p6 = label('Manual  /  page 6', -450, -145, 45, 'dim');
  const date = label('2026-09-30', -450, 46, 70, 'blue');
  s.play(fadeIn([p6, label('This exception expires', -450, -48, 46), date]), { duration: 0.48 });
  s.wait(1.7);
  const copy = label('2026-09-30', -450, 46, 70, 'blue');
  s.add(copy);
  s.play(
    fadeOut(missing),
    to(copy, (n) => n.at(445, 95)),
    { duration: 1.1 },
  );
  s.play(fadeIn(label('source  ·  page 6', 445, 185, 37, 'dim')), { duration: 0.4 });
  s.wait(9.72);
});
