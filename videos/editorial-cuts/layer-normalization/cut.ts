import { film, text, line, dot, fadeIn, fadeOut } from 'vizmatic/stage';

export default film(
  { title: 'Where the differences disappear', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 52, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const xs = [-570, -190, 190, 570];
    const values = [10000, 10001, 9999, 10002];
    const mean = values.reduce((a, b) => a + b) / values.length;
    s.add(
      label('Four inputs, one rounding boundary', 0, -390, 82),
      label('Input values', -685, -260, 46, 'dim'),
    );
    const baseline = 110;
    s.add(line([-790, baseline], [790, baseline], { width: 3, stroke: 'dim' }));
    const original = [];
    for (let i = 0; i < 4; i++) {
      const h = (values[i] - mean) * 95;
      original.push(
        label(String(values[i]), xs[i], -165),
        line([xs[i], baseline], [xs[i], baseline - h], { width: 13, stroke: 'teal' }),
        dot(13, 'teal').at(xs[i], baseline - h),
      );
    }
    s.add(...original);
    const first = label('Centering on 10000.5 preserves four differences.', 0, 310, 49);
    s.add(first);
    s.wait(4.9);
    s.play(fadeOut([first, ...original]), { duration: 0.2 });
    const cover = label('After FP16 rounding', 0, -48, 53, 'yellow');
    s.add(cover, ...xs.map((x) => label('10000', x, -165)));
    const zeros = xs.map((x) => label('0', x, 109, 66, 'yellow'));
    s.play(fadeIn(zeros), { duration: 0.45 });
    s.add(label('All four round to 10000. Each centered difference is zero.', 0, 308, 49));
    s.wait(10.775);
  },
);
