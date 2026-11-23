import {
  axes,
  column,
  dot,
  dynamic,
  group,
  place,
  polyline,
  rect,
  seq,
  tokens,
} from 'vizmatic/stage';
import { area, label, mono, note } from '../../kit-narrated.mjs';
import { frame, postingIndex } from '../parts.mjs';
import { bm25Term } from '../../../films/hybrid-search/model.mjs';
import { assertEqual } from 'vizmatic/stage';
export default function bm25(s, c) {
  const f = frame(c);
  const [left, right] = f.body.columns([2, 1], 'loose');
  const postings = postingIndex(left);
  const raw = place(
    column([note('Query text'), tokens(['KROT-14'], { size: 40 })], { gap: 'normal' }),
    right,
  );
  const analyzed = place(
    column([note('Query tokens · lowercase'), tokens(['krot-14'], { size: 34 })], {
      gap: 'normal',
    }),
    right,
  );
  const mismatch = place(
    column(
      [
        note('Query tokens'),
        tokens(['krot', '14'], { size: 34 }),
        note('Index tokens'),
        tokens(['krot-14'], { size: 34 }),
        label('Different token streams', { color: 'red', size: 34 }),
      ],
      { gap: 'normal' },
    ),
    right,
  );
  const [plot, readout] = f.body.columns([2, 1], 'loose');
  const ax = place(
    axes({
      x: [0, 8],
      y: [0, 2.4],
      width: plot.width - 240,
      height: plot.height - 100,
      xTicks: [0, 1, 2, 4, 8],
      yTicks: [0, 1, 2.2],
      labelSize: 34,
      xStep: 2,
      yStep: 0.5,
      xLabel: 'term frequency',
      grid: true,
    }),
    plot,
  );
  const settled = s.value(1);
  const frequency = s.value(0),
    length = s.value(1),
    b = s.value(0.75);
  const curve = dynamic(() =>
    polyline(
      Array.from({ length: 81 }, (_, i) =>
        ax.world(i / 10, bm25Term(i / 10, length.value, 1.2, b.value)),
      ),
      { stroke: 'cyan', width: 5 },
    ),
  );
  const marker = dynamic(() =>
    dot(12, 'yellow').moveTo(
      ax.world(frequency.value, bm25Term(frequency.value, length.value, 1.2, b.value)),
    ),
  );
  const regions = readout.rows(4, 'normal');
  const idf = Math.log(1 + 2.5 / 1.5);
  assertEqual(idf.toFixed(3), '0.981', 'positive IDF');
  assertEqual(bm25Term(2).toFixed(3), '1.375', 'frequency two');
  assertEqual(bm25Term(4).toFixed(3), '1.692', 'frequency four');
  const idfText = place(mono(`IDF = ${idf.toFixed(3)}`, { color: 'yellow' }), regions[0]);
  const rarity = place(mono('IDF = ln(1 + (3 − 1 + 0.5) / (1 + 0.5))', { size: 39 }), f.foot);
  const atAverage = place(
    mono('Average length:  factor = 2.2 × tf / (tf + 1.2)', { size: 39 }),
    f.foot,
  );
  const values = dynamic(() => {
    const block = place(
      column(
        [
          ...(settled.value > 0.99
            ? [
                mono(`f = ${frequency.value.toFixed(0)}`),
                mono(`factor ${bm25Term(frequency.value, length.value, 1.2, b.value).toFixed(3)}`, {
                  color: 'yellow',
                }),
              ]
            : []),
          note(`L / avg = ${length.value.toFixed(2)}`),
          note(`b = ${b.value.toFixed(2)}`),
        ],
        { gap: 'normal' },
      ),
      readout,
    );
    return group(...block.nodes);
  });
  const formula = place(mono('tf × (k₁ + 1) / [tf + k₁(1 − b + bL/avg)]', { size: 34 }), f.foot);
  const math = [ax, curve, marker, values];
  s.add(f.title, f.shelf.nodes, postings, raw);
  c.swap('analyze-code', raw, analyzed);
  c.on('code-posting', () => s.play(postings.light('code')));
  c.swap('analyzer-mismatch', analyzed, mismatch);
  c.swapAll(1, [math, rarity], { keep: [f.title, f.shelf.nodes] });
  c.show('term-idf', idfText, { after: true });
  c.swap('repeat-term', rarity, atAverage);
  const moveFrequency = (value, duration = 1.1) =>
    seq(
      settled.to(0, { duration: 0.01 }),
      frequency.to(value, { duration }),
      settled.to(1, { duration: 0.01 }),
    );
  c.after('frequency-one', () => s.play(moveFrequency(1)));
  c.after('frequency-two', () => s.play(moveFrequency(2)));
  c.after('frequency-four', () => s.play(moveFrequency(4)));
  c.onBeat(2, () => s.play(moveFrequency(1, 1)));
  c.swap(2, atAverage, formula);
  c.after('half-length', () => s.play(length.to(0.5, { duration: 1.1 })));
  c.after('double-length', () => s.play(length.to(2, { duration: 1.1 })));
  c.after('length-off', () => s.play(b.to(0, { duration: 1.1 })));
  c.keep(f.shelf.nodes);
}
