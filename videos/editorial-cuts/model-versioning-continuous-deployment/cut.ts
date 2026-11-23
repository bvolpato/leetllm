import { film, text, rect, line, fadeIn } from 'vizmatic/stage';
export default film({ title: 'Two gates before widening', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, z: number, c = 'ink') =>
    text(v, { size: z, color: c, font: 'mono' }).at(x, y);
  s.add(text('Can this release widen?', { size: 93, font: 'text-serif' }).at(0, -364));
  const gate = (y: number, n: number, d: number) => [
    rect(1120, 55, { fill: 'surface', stroke: 'dim' }).at(-100, y),
    rect((1120 * n) / d, 50, { fill: 'blue', stroke: null }).at(-660 + (560 * n) / d, y),
  ];
  s.add(
    label('Reviewed outcomes', -385, -195, 48),
    ...gate(-90, 599, 600),
    label('599 / 600', 660, -90, 44),
  );
  s.wait(1.75);
  s.play(
    fadeIn([
      line([458, -120], [458, -60], { stroke: 'yellow', width: 7 }),
      label('1 pending', 643, -170, 42, 'yellow'),
    ]),
    { duration: 0.4 },
  );
  s.wait(2.9);
  s.play(
    fadeIn([
      label('Requests in this window', -310, 40, 48),
      ...gate(139, 600, 1000),
      label('600 / 1,000', 675, 139, 43),
    ]),
    { duration: 0.4 },
  );
  s.wait(2.25);
  s.play(fadeIn(label('HOLD    ·    keep current exposure', 0, 290, 52, 'yellow')), {
    duration: 0.35,
  });
  s.wait(11.95);
});
