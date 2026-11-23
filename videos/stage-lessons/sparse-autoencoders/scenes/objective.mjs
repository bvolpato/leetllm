// Scene `objective`: what training rewards, and what a larger penalty weight changes.
//
// The picture: the rebuilt example, the strip, and two cost bars. A cost bar is made of the same
// colors as the picture: the price of the blue bar, the price of the pink bar, and the green error.
// So the choice between the two candidates is one comparison: the pink price against the green
// error. A slider raises the weight, the pink price grows, and the two bars change places. Then
// the columns grow as the code shrinks, and the rebuilt point does not move.
import {
  assertEqual,
  column,
  decimal,
  dynamic,
  indicate,
  parametric,
  place,
  rect,
  row,
  tex,
  text,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  EXAMPLE_SLOTS,
  NUMBER_SIZE,
  SIDE,
  SLOTS,
  WIDTH,
  board,
  code,
  dictionary,
  objectiveTerms,
  rebuild,
  slider,
  strip,
  vec,
} from '../parts.mjs';

/** The two candidates: the code of the lesson, and the same code without its second entry. */
const DENSE = code,
  SPARSE = [code[0], 0, 0, 0, 0];
/** The penalty weights of the scene: where it starts, where it ends, and where the bars are equal. */
const LAMBDA = { start: 1, end: 4, max: 4 };

export default function objective(s, c) {
  const b = board();
  const crossing = objectiveTerms(SPARSE, 0).error / ((DENSE[1] - SPARSE[1]) / SLOTS);
  assertEqual(
    Number(crossing.toFixed(9)),
    2.5,
    'the weight at which the two candidates cost the same',
  );
  assertEqual(
    objectiveTerms(DENSE, LAMBDA.start).total < objectiveTerms(SPARSE, LAMBDA.start).total,
    true,
    'dense first',
  );
  assertEqual(
    objectiveTerms(SPARSE, LAMBDA.end).total < objectiveTerms(DENSE, LAMBDA.end).total,
    true,
    'sparse last',
  );

  const [stripBand, lower] = SIDE.rows([4, 5], 'normal');
  const [formulaBand, sliderBand, denseBand, sparseBand, noteBand] = lower.rows(
    [3, 2, 3, 3, 2],
    'tight',
  );
  const z = strip(s, stripBand, { max: 2.5, colors: EXAMPLE_SLOTS, start: code });
  const lambda = s.value(LAMBDA.start);
  /** The share of its first size that the code has, while the columns have one over it. */
  const shrink = s.value(1);
  const live = rebuild(b, () => [z.z[0].value / shrink.value, z.z[1].value / shrink.value]);
  s.add(
    heading(c.title),
    live.error,
    live.blue,
    live.pink,
    live.point,
    live.rebuilt,
    z.rail,
    z.glyphs,
    z.bars,
    z.numbers,
  );
  c.take(b.plane);

  // The objective, and the two terms as two pulls on one coefficient.
  const formula = place(
    tex(
      '\\tfrac{1}{D}\\lVert x - \\hat{x} \\rVert^{2} + \\tfrac{\\lambda}{M}\\lVert z \\rVert_{1}',
      { size: 48 },
    ),
    formulaBand,
  );
  const errorTerm = formula.part('\\tfrac{1}{D}\\lVert x - \\hat{x} \\rVert^{2}'),
    penaltyTerm = formula.part('\\tfrac{\\lambda}{M}\\lVert z \\rVert_{1}');
  errorTerm.forEach((glyph) => glyph.color(COLOR.residual));
  s.add(formula);
  const second =
    (value, duration = 1.1) =>
    () =>
      s.play(z.z[1].to(value, { duration }));
  c.on('objective-b1-1', second(0.55));
  c.on('obj-penalty', () =>
    s.play(...penaltyTerm.map((glyph) => indicate(glyph, { color: COLOR.mark, scale: 1.2 }))),
  );
  c.on('obj-first', second(DENSE[1]));
  c.on('obj-second', second(SPARSE[1]));

  // The two candidates as two cost bars, and the slider of the weight.
  const [railBand, weightBand] = sliderBand.inset('normal', 'none').columns(2, 'wide');
  const rail = slider(railBand, lambda, { min: 0, max: LAMBDA.max });
  const weight = place(
    decimal(() => lambda.value, { digits: 2, size: 44, prefix: 'λ = ', color: COLOR.mark }),
    weightBand,
    'left',
  );
  /** The pixels of one unit of cost: the longest bar of the scene fills the band, less the room of its total. */
  const perUnit = (denseBand.width - 130) / objectiveTerms(DENSE, LAMBDA.max).total;
  const costBar = (band, candidate, name, other) => {
    // The columns grow as the code shrinks, so the rebuilt point and its error stay: only the penalty follows `shrink`.
    const terms = () => {
      const { error } = objectiveTerms(candidate, 0);
      const { penalty } = objectiveTerms(
        candidate.map((value) => value * shrink.value),
        lambda.value,
      );
      return { error, penalty, total: error + penalty.reduce((sum, value) => sum + value, 0) };
    };
    const y = band.bottom - 30;
    const bar = dynamic(() => {
      const { error, penalty } = terms();
      let left = band.left;
      return [
        [penalty[0], COLOR.first],
        [penalty[1], COLOR.second],
        [error, COLOR.residual],
      ].flatMap(([value, color]) => {
        const width = value * perUnit;
        const part = rect(width, 44, { fill: color, stroke: null, opacity: 0.9 }).at(
          left + width / 2,
          y,
        );
        left += width;
        return width < 1 ? [] : [part];
      });
    });
    const total = dynamic(() => {
      const value = terms().total;
      return text(value.toFixed(2), { size: NUMBER_SIZE, font: 'mono', anchor: 'left' }).at(
        band.left + value * perUnit + 16,
        y,
      );
    });
    const title = dynamic(() =>
      text(name, {
        size: 36,
        anchor: 'left',
        color: terms().total <= other().total ? COLOR.mark : 'dim',
      }).at(band.left, band.top + 22),
    );
    return { bar, total, title, terms };
  };
  const dense = costBar(denseBand, DENSE, 'two features', () => sparse.terms());
  const sparse = costBar(sparseBand, SPARSE, 'one feature', () => dense.terms());
  const bars = [dense.bar, dense.total, dense.title, sparse.bar, sparse.total, sparse.title];
  c.show('obj-candidates', [...bars, rail.rail, rail.knob, weight]);
  c.on('obj-candidates', second(DENSE[1]), 1.6);

  // The averages of the article, and the pull that the penalty puts on each active latent.
  const sizes = place(mono(`D = ${WIDTH}    M = ${SLOTS}`), noteBand);
  const pull = place(
    tex('\\text{pull on each active } z_i:\\ \\lambda / M', { size: 40 }),
    noteBand,
  );
  const notDecay = place(note('not the same as z − η·λ after each update'), noteBand);
  c.show('obj-div-d', sizes);
  c.on('obj-div-d', () =>
    s.play(
      ...formula
        .part('\\tfrac{1}{D}')
        .map((glyph) => indicate(glyph, { color: COLOR.mark, scale: 1.4 })),
    ),
  );
  c.on('obj-div-m', () =>
    s.play(
      ...formula
        .part('\\tfrac{\\lambda}{M}')
        .map((glyph) => indicate(glyph, { color: COLOR.mark, scale: 1.4 })),
    ),
  );
  c.swap('obj-derivative', sizes, pull);
  c.swap('obj-not-decay', pull, notDecay);

  // Beat 1. The dense candidate, the sparse candidate, and the weight that makes them change places.
  c.hide(1, notDecay);
  c.on('obj-dense', second(DENSE[1], 0.6));
  c.on('obj-sparse', second(SPARSE[1]));
  c.on('obj-raise', () => s.play(lambda.to(crossing, { duration: 1.6 })));
  // The two totals are equal at one weight: the pink price is as long as the green error.
  const equal = place(mono(`equal at λ = ${crossing.toFixed(1)}`, { color: COLOR.mark }), noteBand);
  c.show('objective-b2-1', equal);
  const changed = place(label('the cheaper code changed', { color: COLOR.mark }), noteBand);
  c.on('obj-preferred', () => s.play(lambda.to(LAMBDA.end, { duration: 1.5 })));
  c.hide('obj-preferred', equal);
  c.show('obj-preferred', changed, { after: true });

  // Beat 2. The scale trick: the code shrinks, its columns grow, and the rebuilt point stays.
  // The unit circle, in four arcs that leave room for the numbers of the axes.
  const degrees = Math.PI / 180;
  const unitCircle = [
    [0, 90],
    [108, 180],
    [198, 252],
    [270, 342],
  ].map(([from, to]) =>
    parametric((t) => b.P([Math.cos(t), Math.sin(t)]), from * degrees, to * degrees, {
      stroke: 'dim',
      width: 3,
      dash: [10, 10],
    }),
  );
  const columns = [0, 1].map((i) =>
    b.arrowOf([0, 0], () => vec.scale(dictionary[i], 1 / shrink.value), EXAMPLE_SLOTS[i], {
      width: 4,
      dash: [12, 9],
    }),
  );
  const same = place(label('same rebuilt point, lower penalty', { color: COLOR.wrong }), noteBand);
  const unitNote = place(label('unit columns: no free shrink', { color: COLOR.mark }), noteBand);
  const aware = place(
    tex('\\text{or a penalty of } \\lambda\\,|z_i|\\,\\lVert d_i \\rVert', { size: 40 }),
    formulaBand,
  );
  c.swap(2, [changed, sparse.bar, sparse.total, sparse.title], [...unitCircle, ...columns]);
  c.onBeat(2, () =>
    s.play(z.z[1].to(DENSE[1], { duration: 0.8 }), lambda.to(LAMBDA.start * 2, { duration: 0.8 })),
  );
  c.on('objective-b3-1', () =>
    s.play(
      shrink.to(0.5, { duration: 2.2 }),
      z.z[0].to(DENSE[0] * 0.5, { duration: 2.2 }),
      z.z[1].to(DENSE[1] * 0.5, { duration: 2.2 }),
    ),
  );
  c.on('objective-b3-2', () => s.play(indicate(live.rebuilt, { color: COLOR.mark, scale: 1.5 })));
  c.show('obj-reduce', same);
  c.on('obj-unit', () =>
    s.play(
      shrink.to(1, { duration: 1.2 }),
      z.z[0].to(DENSE[0], { duration: 1.2 }),
      z.z[1].to(DENSE[1], { duration: 1.2 }),
    ),
  );
  c.swap('obj-unit', same, unitNote);
  c.swap('obj-norm-aware', formula, aware);
  c.keep(b.plane);
}
