import { assertEqual, dot, indicate, line, place, rect, row } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { binaryMeasures } from '../../../films/active-labeling/model.mjs';
import { pool } from '../../../films/active-labeling/fixtures.mjs';
import { footer, picture, sourceBand } from '../parts.mjs';

export default function selectionScore(s, c) {
  const title = heading(c.title);
  const probabilities = [pool[0].probability, pool.at(-1).probability];
  const [chanceTitle, splitArea, formulasArea] = picture.rows([1, 2, 4], 'wide');
  const headingP = place(label('Probability that a reviewer prefers A'), chanceTitle);
  const split = (p) => {
    const [band, readouts] = splitArea.inset('wide', 0).rows([3, 2], 'normal');
    const x = band.left + band.width * p;
    const mid = band.point('center')[1];
    return [
      line([band.left, mid], [x, mid], { stroke: 'blue', width: 36 }),
      line([x, mid], [band.right, mid], { stroke: 'cyan', width: 36 }),
      place(mono('A   ' + p.toFixed(2), { color: 'blue' }), readouts, 'left'),
      place(mono('B   ' + (1 - p).toFixed(2), { color: 'cyan' }), readouts, 'right'),
    ];
  };
  const hist = probabilities.map(split);
  const measures = probabilities.map(binaryMeasures);
  const columns = formulasArea.columns(3, 'wide');
  const metric = (i, title, formula, key) => {
    const [name, rule, numbers] = columns[i].rows([1, 1, 2], 'normal');
    const numbersAt = numbers.rows(2, 'tight');
    return {
      label: [place(label(title, { size: 38 }), name), place(mono(formula, { size: 30 }), rule)],
      values: measures.map((m, j) =>
        place(
          row(
            [
              note('p = ' + probabilities[j].toFixed(2)),
              mono(key === 'entropy' ? m.entropy.toFixed(4) + ' bits' : m[key].toFixed(3), {
                size: 34,
                color: 'yellow',
              }),
            ],
            { gap: 'normal' },
          ),
          numbersAt[j],
        ),
      ),
    };
  };
  const metrics = [
    metric(0, 'Least confidence', '1 − max(p, 1−p)', 'least'),
    metric(1, 'Margin uncertainty', '1 − |p − (1−p)|', 'margin'),
    metric(2, 'Entropy', '−Σ q log₂ q', 'entropy'),
  ];
  const legend = place(note('q runs over the two probabilities above.'), footer);

  const seed = { name: 'seed', x: 0 };
  const appeal = { name: 'appeal', x: 1, u: 0.95 };
  const handoff = { name: 'handoff', x: 5, u: 0.2 };
  const remaining = [appeal, handoff];
  const nearest = (record, centers) =>
    Math.min(...centers.map((center) => Math.abs(record.x - center.x)));
  const max = Math.max(...remaining.map((p) => nearest(p, [seed])));
  const score = (p) => 0.6 * p.u + (0.4 * nearest(p, [seed])) / max;
  const weighted = remaining.reduce((a, b) => (score(a) >= score(b) ? a : b));
  const farthest = remaining.reduce((a, b) => (nearest(a, [seed]) >= nearest(b, [seed]) ? a : b));
  const radius = (centers) => Math.max(...remaining.map((p) => nearest(p, centers)));
  assertEqual(weighted.name, 'appeal', 'weighted choice');
  assertEqual(farthest.name, 'handoff', 'farthest-first choice');
  assertEqual(score(appeal).toFixed(2), '0.65', 'appeal score');
  assertEqual(score(handoff).toFixed(2), '0.52', 'handoff score');
  const rWeighted = radius([seed, weighted]),
    rFarthest = radius([seed, farthest]);
  assertEqual(rWeighted, 4, 'weighted covering radius');
  assertEqual(rFarthest, 1, 'farthest-first covering radius');
  const [ruleArea, rulerArea, calcArea] = picture.rows([1, 3, 3], 'wide');
  const [names, axis, ticks, gap] = rulerArea.inset(100, 0).rows([1.3, 0.6, 1, 1.2], 'tight');
  const x = (v) => axis.left + (v / max) * axis.width;
  const y = axis.point('center')[1];
  const axisLine = line([x(0), y], [x(max), y], { stroke: 'dim', width: 4 });
  const marks = Array.from({ length: max + 1 }, (_, i) => [
    line([x(i), y - 9], [x(i), y + 9], { stroke: 'dim', width: 3 }),
    mono(String(i), { size: 30, color: 'dim' }).moveTo([x(i), ticks.point('center')[1]]),
  ]);
  const point = (item, color) => [
    dot(14, color).moveTo([x(item.x), y]),
    label(item.name, { size: 39, color }).moveTo([x(item.x), names.point('center')[1]]),
  ];
  const ring = (p) => rect(48, 48, { radius: 24, stroke: 'yellow', width: 4 }).moveTo([x(p.x), y]);
  const pts = [point(seed, 'yellow'), point(appeal, 'blue'), point(handoff, 'blue')];
  const centerMarks = [ring(appeal), ring(handoff)];
  const rulerTitle = place(
    note('New pool  ·  one additional review  ·  embedding distance in units'),
    sourceBand,
    'left',
  );
  const formulas = place(
    label('Score = 0.6 × uncertainty + 0.4 × (distance / longest distance)', { size: 39 }),
    ruleArea,
  );
  const statsRows = calcArea
    .rows(2, 'wide')
    .map((region) => region.columns([1.1, 1.25, 1.35, 1.75, 1], 'normal'));
  const namesAndU = remaining.map((p, i) => [
    place(label(p.name), statsRows[i][0], 'left'),
    place(mono('U = ' + p.u.toFixed(2), { size: 35 }), statsRows[i][1]),
  ]);
  const inputs = remaining.map((p, i) => [
    place(mono('D = ' + nearest(p, [seed]) + '/' + max, { size: 35 }), statsRows[i][2]),
    place(
      mono((0.6 * p.u).toFixed(2) + ' + ' + ((0.4 * nearest(p, [seed])) / max).toFixed(2), {
        size: 35,
      }),
      statsRows[i][3],
    ),
  ]);
  const totals = remaining.map((p, i) =>
    place(mono(score(p).toFixed(2), { color: 'yellow' }), statsRows[i][4]),
  );
  const question = place(label('Which record gets the place?', { color: 'yellow' }), footer);
  const winner = place(label('One review goes to the appeal.', { color: 'yellow' }), footer);
  const span = (a, b) => {
    const yGap = gap.point('center')[1];
    return [
      line([x(a), yGap], [x(b), yGap], { stroke: 'cyan', width: 6 }),
      ...[a, b].map((v) =>
        line([x(v), yGap - 10], [x(v), yGap + 10], { stroke: 'cyan', width: 4 }),
      ),
    ];
  };
  const largeGap = span(weighted.x, handoff.x),
    smallGap = span(seed.x, appeal.x);
  const covRule = place(label('Minimize the longest distance to a selected record.'), ruleArea);
  const radiusLine = (name, r, region) =>
    place(
      row([note(name), mono('Gap  ' + r + (r === 1 ? ' unit' : ' units'), { size: 43, color: 'cyan' })], {
        gap: 'wide',
      }),
      region,
    );
  const radiusRows = calcArea.rows(2, 'normal');
  const large = radiusLine('Weighted pick  ·  appeal', rWeighted, radiusRows[0]);
  const small = radiusLine('Farthest pick  ·  handoff', rFarthest, radiusRows[1]);
  const sample = place(
    note(
      'Population rate  ·  probability sample with known positive inclusion chances and weights',
    ),
    footer,
  );
  s.add(title, headingP, hist[0]);
  c.show('binary-scores', metrics[0].label);
  c.show('margin-rule', metrics[1].label);
  c.show('entropy-rule', [metrics[2].label, legend]);
  for (const [i, cue] of ['uncertain-least', 'uncertain-margin', 'uncertain-entropy'].entries())
    c.show(cue, metrics[i].values[0], { after: true });
  c.swap('confident-input', hist[0], hist[1], { after: true });
  for (const [i, cue] of ['confident-least', 'confident-margin', 'confident-entropy'].entries())
    c.show(cue, metrics[i].values[1], { after: true });
  c.swapAll('ruler', [rulerTitle, axisLine, marks, pts[0]], { keep: [title] });
  c.show('appeal-input', [pts[1], namesAndU[0]]);
  c.show('handoff-input', [pts[2], namesAndU[1]]);
  c.show('weight-input', [formulas, inputs]);
  c.show('ask-next', question);
  c.swap('appeal-result', question, winner, { after: true });
  c.show('appeal-score', totals[0], { after: true });
  c.show('handoff-score', totals[1], { after: true });
  c.show('add-appeal', centerMarks[0]);
  c.swap('radius-four', [formulas, namesAndU, inputs, totals, winner], [largeGap, large], {
    after: true,
  });
  c.swap('rewind', [largeGap, centerMarks[0]], covRule);
  c.show('add-farthest', centerMarks[1], { after: true });
  c.show('radius-one', [smallGap, small], { after: true });
  c.after('compare-radii', () => s.play(indicate([large, small], { scale: 1 })));
  c.show('sampling', sample);
}
