import { film, text, line, rect, fadeIn, fadeOut } from 'vizmatic/stage';
export default film({ title: 'Which answers survive the cutoff?', look: 'midnight' }, (s) => {
  const title = (v: string) => text(v, { size: 72, font: 'text-serif' }).at(0, -365);
  const label = (v: string, x: number, y: number, c = 'ink') =>
    text(v, { size: 40, font: 'mono', color: c as any }).at(x, y);
  const early = title('The leaked rule copies the audit label.');
  const late = title('Score the same eight requests at opening time.');
  const truth = [1, 0, 1, 0, 1, 0, 0, 1],
    x = (i: number) => -380 + i * 157;
  s.add(
    early,
    label('Request', -690, -180),
    label('Audit label', -690, -35),
    label('Prediction', -690, 120),
    line([-835, 42], [820, 42], { stroke: 'dim', width: 2 }),
  );
  const predictions = truth.map((n, i) => label(String(n), x(i), 120, 'teal'));
  truth.forEach((n, i) =>
    s.add(label('r' + i, x(i), -180, 'dim'), label(String(n), x(i), -35), predictions[i]),
  );
  s.wait(5);
  s.play(fadeOut([early, ...predictions]), { duration: 0.35 });
  s.play(fadeIn(late), { duration: 0.35 });
  const actual = truth.map((_, i) => label(String(1 - (i % 2)), x(i), 120, 'blue'));
  s.wait(6.8);
  s.play(fadeIn(actual), { duration: 0.55 });
  s.wait(4.95);
  const wrong = [6, 7].map((i) =>
    rect(112, 250, { fill: null, stroke: 'yellow', width: 4, radius: 12 }).at(x(i), 44),
  );
  s.play(fadeIn(wrong), { duration: 0.4 });
  s.wait(2.3);
  s.play(fadeIn(label('6 of 8 match   ·   75%', 140, 310, 'yellow')), { duration: 0.3 });
  s.wait(5);
});
