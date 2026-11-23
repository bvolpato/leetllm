import { arrow, dynamic, fadeIn, indicate, line, place, rect, row } from 'vizmatic/stage';
import { chip, label, mono } from '../../kit-narrated.mjs';
import { frame, fmt, H, WORDS, transform } from '../parts.mjs';

export default function (s, c) {
  const f = frame(c);
  const [left, right] = f.body.columns([1.12, 1], 'loose');
  const [prompt, plot] = left.rows([1, 4], 'normal');
  const words = place(
    row([label(WORDS[0].slice(0, 2).join(' ')), chip(WORDS[0][2], { color: 'cyan' })], {
      gap: 'normal',
    }),
    prompt,
  );
  const base = H[0][2];
  const edit = s.value(0);
  const input = () => [base[0] + edit.value, base[1]];
  const unit = Math.min(plot.width / 2.1, plot.height / 1.35);
  const point = (x, y) => [plot.cx + (x - 0.75) * unit, plot.cy - (y - 0.5) * unit];
  const grid = [];
  for (const x of [0, 0.5, 1, 1.5]) {
    grid.push(
      line(point(x, 0), point(x, 1), { stroke: x === 0 ? 'dim' : 'grid', width: 3 }),
      mono(fmt(x), { size: 32 }).moveTo(point(x, -0.11)),
    );
  }
  for (const y of [0, 0.5, 1]) {
    grid.push(line(point(0, y), point(1.6, y), { stroke: y === 0 ? 'dim' : 'grid', width: 3 }));
    if (y) grid.push(mono(fmt(y), { size: 32 }).moveTo(point(-0.13, y)));
  }

  const origin = point(0, 0);
  const oldTip = point(...base);
  const original = arrow(origin, oldTip, { stroke: 'dim', width: 5, pad: 0 });
  const path = dynamic(() =>
    line(oldTip, point(...input()), { stroke: 'yellow', width: 4, dash: [10, 8] }),
  );
  const vector = dynamic(() =>
    arrow(origin, point(...input()), { stroke: 'cyan', width: 12, pad: 0 }),
  );
  const digits = (v) => fmt(Number(v.toFixed(2)));
  const inputLabel = dynamic(() =>
    place(
      mono('[' + input().map(digits).join(', ') + ']', { size: 48, color: 'cyan' }),
      f.foot.columns([1.12, 1], 'loose')[0],
    ),
  );

  const before = transform(base);
  const after = transform([base[0] + 1, base[1]]);
  const horizontal = s.value(0);
  const average = s.value(0);
  const bars = [horizontal, null, average];
  const [header, ...lanes] = right.rows([1, 1.3, 1.3, 1.3], 'normal');
  const chart = [place(label('Saved outputs for password'), header)];
  const names = ['Horizontal', 'Height', 'Average'];
  const labels = [];
  for (const [j, lane] of lanes.entries()) {
    const [legend, band] = lane.rows([1, 1.2], 'tight');
    const [rail, digit] = band.columns([4, 1], 'normal');
    const value = () => before[j] + (after[j] - before[j]) * (bars[j]?.value ?? 0);
    const width = (v) => (rail.width * v) / 2;
    const mark = rail.left + width(before[j]);
    const name = place(label(names[j], { size: 36 }), legend, 'left');
    labels.push(name);
    chart.push(
      name,
      place(rect(rail.width, rail.height * 0.55, { fill: 'surface', stroke: 'grid' }), rail),
      dynamic(() =>
        rect(width(value()), rail.height * 0.55, {
          fill: 'yellow',
          stroke: 'yellow',
        }).moveTo([rail.left + width(value()) / 2, rail.cy]),
      ),
      line([mark, rail.cy - rail.height * 0.38], [mark, rail.cy + rail.height * 0.38], {
        stroke: 'cyan',
        width: 4,
      }),
      dynamic(() => place(mono(digits(value()), { size: 40 }), digit)),
    );
  }
  const first = [f.title, words, ...grid, original, path, vector, inputLabel, ...chart];
  s.add(...first);
  s.play(fadeIn(first, { duration: 0 }));
  c.on('edit-input', () => s.play(edit.to(1, { duration: 1.4 })));
  for (const [j, cue] of ['read-horizontal', 'read-height', 'read-average'].entries()) {
    c.on(cue, () => s.play(indicate(labels[j], { scale: 1, color: 'yellow', duration: 0.55 })));
  }
  c.after('same-height', () => s.play(indicate(labels[1], { scale: 1, duration: 0.65 })));
  c.after('update-horizontal', () => s.play(horizontal.to(1, { duration: 0.65 })));
  c.after('update-average', () => s.play(average.to(1, { duration: 0.65 })));
  c.on('carry-password', () =>
    s.play(
      edit.to(0, { duration: 1 }),
      horizontal.to(0, { duration: 1 }),
      average.to(0, { duration: 1 }),
    ),
  );
}
