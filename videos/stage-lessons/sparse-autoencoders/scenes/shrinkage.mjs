// Scene `shrinkage`: an L1 penalty shrinks a coefficient that is right.
//
// The picture: the second feature of the example has the right direction and the target 1. A
// slider raises the penalty weight. The cost curve of that one coefficient tilts, its lowest point
// slides to the left, the pink arrow shrinks with it, and the rebuilt point leaves the dot. The
// count of active entries stays at 2 until the coefficient is zero.
import {
  assertEqual,
  axes,
  decimal,
  dot,
  dynamic,
  fitted,
  indicate,
  line,
  place,
  polyline,
  row,
  tex,
  text,
} from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { COLOR, EXAMPLE_SLOTS, SIDE, board, code, rebuild, slider, strip } from '../parts.mjs';

/** The target of the coefficient that the penalty acts on: the second entry of the code. */
const TARGET = code[1];
const optimum = (weight) => Math.max(0, TARGET - weight / 2);
const cost = (value, weight) => (TARGET - value) ** 2 + weight * value;
/** The penalty weights of the scene. The coefficient is zero from twice the target. */
const WEIGHT = { nudge: 0.4, half: 1.2, low: 1.9, end: 2.4, max: 2.6 };

export default function shrinkage(s, c) {
  const b = board();
  // The optimum is the lowest point of the cost at each weight of the scene.
  for (const weight of Object.values(WEIGHT)) {
    const best = optimum(weight);
    assertEqual(
      [0, best - 0.01, best + 0.01, 1, 2].every(
        (value) => value < 0 || cost(best, weight) <= cost(value, weight) + 1e-12,
      ),
      true,
      `the optimum at weight ${weight}`,
    );
  }
  const [stripBand, lower] = SIDE.rows([3, 6], 'normal');
  const [ruleBand, sliderBand, curveBand, countBand] = lower.rows([3.2, 1.4, 7, 1.4], 'tight');
  const weight = s.value(0);
  // The second bar of the strip and the pink arrow follow one value: the optimum at the weight.
  const z = strip(s, stripBand, {
    max: 2,
    colors: EXAMPLE_SLOTS,
    start: code,
    read: (i) => (i === 1 ? optimum(weight.value) : undefined),
  });
  const live = rebuild(b, () => [code[0], optimum(weight.value)]);
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

  // The cost of one coefficient, and its lowest point.
  const RANGE = { x: 1.15, y: 2.8 };
  const [costName, plotBand, coefficientName] = curveBand.rows([1, 6, 1], 'none');
  const graph = place(
    fitted(plotBand, (width) =>
      axes({
        x: [0, RANGE.x],
        y: [0, RANGE.y],
        xStep: 0.5,
        yStep: 1,
        width,
        height: plotBand.height - 50,
        labelSize: 28,
      }),
    ),
    plotBand,
    'top',
  );
  graph.numbers.at(0, 12);
  const names = [
    place(note('cost'), costName, 'top left'),
    place(note('coefficient'), coefficientName, 'right'),
  ];
  const curve = dynamic(() =>
    polyline(
      Array.from({ length: 47 }, (_, i) => {
        const value = (i / 46) * RANGE.x;
        return graph.world(value, Math.min(RANGE.y, cost(value, weight.value)));
      }),
      { stroke: COLOR.second, width: 5 },
    ),
  );
  const lowest = dynamic(() => {
    const best = optimum(weight.value);
    const at = graph.world(best, cost(best, weight.value)),
      under = graph.world(best, 0);
    return [
      line(at, under, { stroke: COLOR.mark, width: 3, dash: [8, 8] }),
      dot(12, COLOR.mark).at(...at),
    ];
  });
  const [railBand, weightBand] = sliderBand.inset('normal', 'none').columns(2, 'wide');
  const knob = slider(railBand, weight, { min: 0, max: WEIGHT.max });
  const reading = place(
    decimal(() => weight.value, { digits: 2, size: 36, prefix: 'λ_eff = ', color: COLOR.mark }),
    weightBand,
    'left',
  );
  s.add(graph, names, curve, lowest, knob.rail, knob.knob, reading);

  const move = (to, duration) => () => s.play(weight.to(to, { duration }));
  c.on('shrink-favors', move(WEIGHT.nudge, 1.4));
  const rule = place(
    tex('z^{*} = \\max(0, t - \\lambda_{\\mathrm{eff}}/2)', { size: 40 }),
    ruleBand,
  );
  const scalar = place(
    tex('(t-z)^2 + \\lambda_{\\mathrm{eff}}|z|,\\quad z \\ge 0', { size: 34 }),
    ruleBand,
    'top',
  );
  const convention = place(
    tex('\\lambda_{\\mathrm{eff}} = D\\lambda/M', { size: 34 }),
    ruleBand,
    'bottom',
  );
  s.add(scalar, convention);
  c.show('shrinkage-b1-1', rule);
  c.on('shrink-clip', () =>
    s.play(
      ...rule.part('\\max').map((glyph) => indicate(glyph, { color: COLOR.mark, scale: 1.3 })),
    ),
  );
  c.on('shrinkage-b1-2', move(WEIGHT.half, 2.6));

  // Beat 1. The count of active entries stays, and the size shrinks. At zero, the count falls.
  const count = dynamic(() => {
    const active = code.filter(
      (value, i) => (i === 1 ? optimum(weight.value) : value) > 1e-9,
    ).length;
    return text(`active entries: ${active}`, {
      size: 40,
      color: active === 2 ? COLOR.activation : COLOR.mark,
    }).at(countBand.cx, countBand.cy);
  });
  c.show('shrink-support', count);
  c.on('shrinkage-b2-1', move(WEIGHT.low, 2.2));
  c.on('shrink-count', move(WEIGHT.end, 2.4));
  c.keep(b.plane);
}
