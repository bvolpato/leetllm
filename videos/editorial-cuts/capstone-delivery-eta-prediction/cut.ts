import { film, text, line, dot, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Which scan was visible at noon?', look: 'midnight' }, (s) => {
  const t = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const show = (...nodes: any[]) => s.play(fadeIn(nodes), { duration: 0.4 });
  s.add(t('Which scan did the service know about at noon?', 0, -391, 65));
  const noon = 190;
  s.add(
    line([noon, -239], [noon, 187], { stroke: 'yellow', width: 4 }),
    t('12:00 cutoff', noon, -274, 42, 'yellow'),
  );
  s.add(t('Transit scan', -705, -101, 43), t('Hub scan', -705, 116, 43));
  s.wait(3.6);
  show(dot(14, 'blue').at(-430, -100), t('11:00  happened', -430, -163, 34, 'blue'));
  s.wait(1.8);
  show(
    line([-430, -100], [-398, -100], { stroke: 'teal', width: 5 }),
    dot(13, 'teal').at(-398, -100),
    t('11:03  readable', -398, -43, 34, 'teal'),
  );
  s.wait(2.6);
  show(dot(14, 'blue').at(-120, 110), t('11:30  happened', -120, 52, 34, 'blue'));
  s.wait(1.3);
  show(
    line([-120, 110], [500, 110], { stroke: 'gridStrong', width: 5 }),
    dot(14, 'teal').at(500, 110),
    t('12:30  readable', 500, 168, 34, 'teal'),
  );
  s.wait(3.4);
  show(
    t('Available at noon', 510, -101, 42, 'teal'),
    t('Too late for this prediction', 0, 290, 49, 'yellow'),
  );
  s.wait(5.5);
});
