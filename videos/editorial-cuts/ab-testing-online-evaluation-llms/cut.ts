import { film, text, line, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'Can this worksheet clear release?', look: 'midnight' }, (s) => {
  const t = (v: string, x: number, y: number, size = 48, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const x = (percent: number) => percent * 14000 + 215;
  s.add(
    text('Can this worksheet clear release?', { font: 'text-serif', size: 84 }).at(0, -380),
    t('Safety difference · percentage points', 0, -226),
    line([-725, -61], [735, -61], { stroke: 'dim', width: 3 }),
    line([x(-0.05), -142], [x(-0.05), 4], { stroke: 'yellow', width: 6 }),
    t('margin −0.05', x(-0.05), 54, 43, 'yellow'),
  );
  s.wait(2);
  s.play(fadeIn(line([x(-0.03), -62], [x(0.01), -62], { stroke: 'teal', width: 19 })), {
    duration: 0.45,
  });
  for (const [v, label] of [
    [-0.03, '−0.03'],
    [0.01, '+0.01'],
  ] as const)
    s.add(
      rect(8, 57, { fill: 'teal', stroke: null }).at(x(v), -62),
      t(label, x(v), -123, 40, 'teal'),
    );
  s.wait(4.6);
  s.add(t('First-token time', -480, 215), t('3.0 s limit', 410, 215, 43, 'dim'));
  s.wait(3.8);
  s.play(fadeIn(t('3.2 s in both arms', -400, 325, 61, 'yellow')), { duration: 0.45 });
  s.wait(6.6);
});
