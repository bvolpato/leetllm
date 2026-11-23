import { film, text, rect, fadeIn, fadeOut, line, arrow, draw } from 'vizmatic/stage';

export default film({ title: 'Find the rule on the page', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(0, y).alignTo([x, y], 'left');
  const page = rect(1090, 550, { fill: 'surface', stroke: 'dim', radius: 9 }).at(-285, 35);
  const title = text('Where on the page is the rule?', { size: 74, font: 'text-serif' }).at(
    0,
    -380,
  );
  const heading = label('Release runbook', -765, -156, 51);
  const headings = [
    label('Event', -760, -62, 37, 'dim'),
    label('Action and deadline', -305, -62, 37, 'dim'),
  ];
  const row1 = [
    label('Rollback failure', -760, 35, 40),
    label('Page within 15 minutes', -305, 35, 40),
  ];
  const row2 = [
    label('Routine notes', -760, 142, 40),
    label('Archive within 14 days', -305, 142, 40),
  ];
  const rules = [-15, 90, 196].map((y) => line([-770, y], [190, y], { stroke: 'grid', width: 3 }));
  s.add(title, page, heading, ...headings, ...row1, ...row2, ...rules);
  s.wait(5.3);
  const prompt = [
    label('Extracted values', 330, -90, 40, 'dim'),
    label('15 minutes', 330, -10, 50),
    label('14 days', 330, 69, 50),
  ];
  s.play(fadeIn(prompt), { duration: 0.45 });
  s.wait(4.8);
  s.play(fadeOut(prompt), { duration: 0.4 });
  const query = label('“fifteen minutes”', 330, 35, 46, 'yellow');
  const frame = rect(1010, 92, { fill: null, stroke: 'yellow', width: 5, radius: 6 }).at(-286, 35);
  const link = arrow([315, 35], [235, 35], { stroke: 'yellow', width: 4 });
  s.play(fadeIn([label('Query', 330, -47, 38, 'dim'), query]), { duration: 0.4 });
  s.play(draw(link), fadeIn(frame), { duration: 0.55 });
  s.wait(6.1);
});
