import {
  assertEqual,
  barChart,
  column,
  dot,
  dynamic,
  group,
  indicate,
  line,
  place,
  rect,
  table,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame } from '../parts.mjs';
export default function weighted(s, c) {
  const f = frame(c);
  const [left, right] = f.body.columns([1, 1.3], 'loose');
  const weight = 0.7,
    dense = 0.8,
    lexical = 0.2,
    score = weight * dense + (1 - weight) * lexical;
  assertEqual(score.toFixed(2), '0.62', 'convex mixture');
  const chart = place(
    barChart(
      [
        { label: 'dense part', value: weight * dense, color: 'pink' },
        { label: 'lexical part', value: (1 - weight) * lexical, color: 'cyan' },
        { label: 'mixture', value: score, color: 'yellow' },
      ],
      {
        width: left.width,
        height: left.height * 0.65,
        max: 1,
        labelSize: 34,
        showValues: true,
        format: (v) => v.toFixed(2),
      },
    ),
    left,
  );
  const tab = place(
    table(
      [
        { key: 'case', sample: 'unknown score' },
        { key: 'low', sample: 'unknown' },
        { key: 'high', sample: 100 },
        { key: 'normalized', sample: 'undefined' },
      ],
      [
        { id: 'range', case: 'ordinary', low: 0, high: null, normalized: null },
        { id: 'flat', case: 'constant', low: 5, high: 5, normalized: '?' },
        { id: 'missing', case: 'truncated', low: '?', high: '?', normalized: 'unknown' },
      ],
      { width: right.width, size: 34, leading: 2.8 },
    ),
    right,
  );
  const rawScore = 5,
    minimum = 0,
    maximum = s.value(10);
  assertEqual((rawScore - minimum) / (100 - minimum), 0.05, 'outlier compression');
  const [rulerHead, rulerRegion, rulerNote] = left.rows([1, 3, 1], 'normal');
  const raw = place(label('raw score = 5 · minimum = 0', { color: 'cyan' }), rulerHead);
  const normalized = dynamic(() => {
    const max = maximum.value,
      n = (rawScore - minimum) / (max - minimum);
    const start = rulerRegion.point('left'),
      end = rulerRegion.point('right');
    const width = rulerRegion.width * 0.86,
      x = start[0] + rulerRegion.width * 0.07;
    const y = rulerRegion.point('center')[1],
      point = [x + width * n, y];
    return group(
      line([x, y], [x + width, y], { stroke: 'dim', width: 3 }),
      rect(width * n, 26, { fill: 'cyan', stroke: 'cyan', width: 0 }).moveTo([
        x + (width * n) / 2,
        y,
      ]),
      dot(10, 'yellow').moveTo(point),
      mono('0', { size: 34 }).moveTo([x, y + rulerRegion.height * 0.3]),
      mono(max.toFixed(1), { size: 34 }).moveTo([x + width, y + rulerRegion.height * 0.3]),
      mono('5', { size: 34, color: 'cyan' }).moveTo([point[0], y - rulerRegion.height * 0.3]),
    );
  });
  const compression = place(note('Same raw score · expanding observed range'), rulerNote);
  const calculation = dynamic(() =>
    place(
      mono(
        '(5 − 0) / (' +
          maximum.value.toFixed(1) +
          ' − 0) ≈ ' +
          (rawScore / maximum.value).toFixed(2),
        { color: 'yellow' },
      ),
      f.foot,
    ),
  );
  const rangeHigh = tab.cell('range', 'high'),
    rangeNorm = tab.cell('range', 'normalized');
  const highBox = rangeHigh.box,
    normBox = rangeNorm.box;
  // Live values replace static cells so the ruler and arithmetic share one state.
  rangeHigh.add(
    dynamic(() =>
      mono(maximum.value.toFixed(1), { size: 34 }).moveTo([(highBox[0] + highBox[2]) / 2, 0]),
    ),
  );
  rangeNorm.add(
    dynamic(() =>
      mono((rawScore / maximum.value).toFixed(2), { size: 34 }).moveTo([
        (normBox[0] + normBox[2]) / 2,
        0,
      ]),
    ),
  );
  const formula = place(mono('0.7 × 0.8 + 0.3 × 0.2'), f.foot);
  const result = place(mono(`weighted score = ${score.toFixed(2)}`, { color: 'yellow' }), f.foot);
  s.add(f.title, f.shelf.nodes, tab, formula);
  c.show('weighted-terms', chart);
  c.onBeat(0, () => s.play(chart.update([0, 0, 0], { duration: 0.01 })), 0.01);
  c.on('weighted-terms', () => s.play(chart.update([weight * dense, (1 - weight) * lexical, 0])));
  c.after('weighted-answer', () =>
    s.play(chart.update([weight * dense, (1 - weight) * lexical, score])),
  );
  c.swap('weighted-answer', formula, result, { after: true });
  c.swapAll(1, [raw, normalized, compression, calculation], {
    keep: [f.title, f.shelf.nodes, tab],
  });
  c.on('minmax-outlier', () => s.play(maximum.to(100, { duration: 2.4 })));
  c.on('constant-lane', () => s.play(tab.setCell('flat', 'normalized', 'undefined')));
  c.on('rescore-union', () => s.play(tab.light('missing')));
  c.keep(f.shelf.nodes);
}
