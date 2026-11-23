import { film, text, line, rect, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Two clocks in one reply', look: 'midnight' }, (s) => {
  const label = (v: string, x: number, y: number, size: number, color = 'ink') =>
    text(v, { size, color: color as 'ink' }).at(x, y);
  s.add(label('When does the answer feel slow?', 0, -375, 74));
  const start = -550,
    end = 710;
  for (const [y, title] of [
    [-110, 'Reply A'],
    [150, 'Reply B'],
  ] as const) {
    s.add(
      label(title, -735, y, 48),
      line([start, y], [end, y], { stroke: 'gridStrong', width: 4 }),
    );
    s.add(line([start, y - 22], [start, y + 22], { stroke: 'ink', width: 4 }));
  }
  s.add(label('Request arrives', start, -210, 32, 'dim'));
  const marks = (xs: number[], y: number, color: 'teal' | 'yellow') =>
    xs.map((x) => rect(34, 34, { radius: 17, fill: color }).at(x, y));
  const slow = marks([140, 265, 390, 515], -110, 'teal');
  const quick = marks([-420, -110, 245, 615], 150, 'yellow');
  const show = (nodes: ReturnType<typeof rect>[], wait: number) =>
    nodes.forEach((n) => {
      s.play(fadeIn(n), { duration: 0.18 });
      s.wait(wait);
    });
  s.wait(0.7);
  show(slow, 0.27);
  s.wait(1.3);
  show(quick, 0.56);
  s.wait(0.95);
  s.add(
    label('Wait for the first token', -220, -185, 36, 'teal'),
    line([start, -150], [140, -150], { stroke: 'teal', width: 3 }),
  );
  s.wait(2.15);
  s.add(label('Gaps between later tokens', 155, 249, 36, 'yellow'));
  for (const x of [-110, 245, 615]) s.add(line([x, 174], [x, 200], { stroke: 'yellow', width: 3 }));
  s.wait(5.44);
});
