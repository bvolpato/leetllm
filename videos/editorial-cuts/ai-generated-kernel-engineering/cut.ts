import { film, text, rect, fadeIn, to, line } from 'vizmatic/stage';
export default film(
  { title: 'Five features in an eight-lane tile', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const bar = (w: number, h: number, x: number, y: number, color: string) =>
      rect(w, h, { fill: color, stroke: null, radius: 4 }).at(x, y);
    s.add(label('Which lanes belong in the mean?', 0, -345, 79));
    const xs = Array.from({ length: 8 }, (_, i) => -665 + i * 190);
    s.add(label('Squared features', -270, -172, 50, 'teal'));
    [1, 4, 9, 16, 25].forEach((v, i) =>
      s.add(bar(155, 140, xs[i], 0, 'surface'), label(String(v), xs[i], 0, 64, 'teal')),
    );
    s.wait(3);
    const pads = xs
      .slice(5)
      .map((x) => rect(155, 140, { fill: null, stroke: 'dim', width: 3, dash: [12, 8] }).at(x, 0));
    s.play(fadeIn(pads), { duration: 0.6 });
    s.wait(3);
    s.play(
      fadeIn([
        label('Padding', 476, -172, 50, 'yellow'),
        label('55 ÷ 5 = 11', -270, 205, 68, 'teal'),
      ]),
      { duration: 0.45 },
    );
    s.wait(3.7);
    s.play(fadeIn(xs.slice(5).map((x) => label('1', x, 0, 64, 'yellow'))), { duration: 0.5 });
    s.wait(1.35);
    s.play(fadeIn(label('(55 + 3) ÷ 5 = 11.6', 305, 310, 65, 'yellow')), { duration: 0.45 });
    s.wait(6.675);
  },
);
