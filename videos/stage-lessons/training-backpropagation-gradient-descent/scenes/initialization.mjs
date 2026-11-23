import {
  arrow,
  boxOf,
  column,
  decimal,
  dot,
  dynamic,
  indicate,
  numberLine,
  place,
  rect,
  row,
  tex,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { symmetric } from '../../../films/training-backpropagation-gradient-descent/fixtures.mjs';
import { rms } from '../../../films/training-backpropagation-gradient-descent/construction.mjs';
import { sampleModel } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
export default function initialization(s, c) {
  const full = sampleModel('initialization', { beat: 2, beatP: 1 });
  const [head, layers, body, foot] = area.rows([1, 3, 4, 1], 'wide');
  const variance = s.value(1),
    negative = s.value(1),
    he = s.value(1),
    included = s.value(0);
  const groups = 4,
    inputsPerGroup = full.count / groups;
  const title = place(label('One layer: independent input variances add'), head);
  const [contributions, sumRegion] = layers.columns([4, 2], 'loose');
  const layerRegions = contributions.rows(groups, 'tight');
  const frames = [];
  const sources = layerRegions.map((r, i) => {
    const [name, value, mark] = r.columns([2, 2, 1], 'normal');
    const count = place(note(inputsPerGroup + ' inputs'), name);
    const readout = place(
      decimal(
        () =>
          Math.min(1, Math.max(0, included.value - i)) * inputsPerGroup * variance.value * he.value,
        { prefix: 'Var ', digits: 2, size: 34, color: 'cyan' },
      ),
      value,
    );
    const frame = place(rect(mark.width, 22, { fill: 'surface', stroke: 'grid' }), mark);
    frames.push(frame);
    const bar = dynamic(() => {
      const width = Math.max(
        2,
        mark.width * Math.min(1, Math.max(0, included.value - i)) * variance.value * he.value,
      );
      return rect(width, 20, { fill: 'cyan', stroke: 'cyan' }).moveTo([
        boxOf(frame).left + width / 2,
        boxOf(frame).point('center')[1],
      ]);
    });
    return [count, readout, frame, bar];
  });
  const [sumHead, sumMark, sumReadout] = sumRegion.rows([1, 2, 1], 'tight');
  const sumName = place(note('One preactivation z'), sumHead);
  const totalFrame = place(
    rect(sumMark.width * 0.75, sumMark.height, { fill: 'surface', stroke: 'grid' }),
    sumMark,
  );
  const totalBar = dynamic(() => {
    const width = Math.max(
      2,
      ((boxOf(totalFrame).width * included.value) / groups) * variance.value * he.value,
    );
    return rect(width, sumMark.height * 0.7, { fill: 'yellow', stroke: 'yellow' }).moveTo([
      boxOf(totalFrame).left + width / 2,
      boxOf(totalFrame).point('center')[1],
    ]);
  });
  const total = place(
    decimal(() => included.value * inputsPerGroup * variance.value * he.value, {
      prefix: 'Var(z) ',
      digits: 2,
      size: 34,
      color: 'yellow',
    }),
    sumReadout,
  );
  const sumEdges = frames.map((f) =>
    arrow(boxOf(f).point('right'), boxOf(totalFrame).point('left'), { stroke: 'dim', pad: 16 }),
  );
  const bars = [sources, sumName, totalFrame, totalBar, total, sumEdges];
  const [left, right] = body.columns([3, 2], 'loose');
  const ruler = place(
    numberLine({ range: [-3, 3], ticks: [-2, 0, 2], length: left.width * 0.85, labelSize: 34 }),
    left,
  );
  const activation = (v) => (v / rms) * Math.sqrt(he.value) * (v < 0 ? negative.value : 1);
  const dots = dynamic(() =>
    symmetric.map((v, i) =>
      dot(8, v < 0 ? 'blue' : 'cyan').moveTo([
        ruler.get('x') + (activation(v) / 6) * ruler.length,
        ruler.get('y') - 50 - (i % 8) * 16,
      ]),
    ),
  );
  const rules = place(
    column(
      [
        tex('\\mathrm{Var}(w)\\propto 1/n_{in}', { size: 34 }),
        tex('\\mathrm{Xavier}:\\;2/(n_{in}+n_{out})', { size: 34 }),
        tex('\\sigma = \\sqrt{\\mathrm{Var}(w)}', { size: 34 }),
        tex('\\mathrm{uniform}:\\;\\pm\\sqrt{6/(n_{in}+n_{out})}', { size: 34 }),
        tex('\\mathrm{He}:\\;2/n_{in}', { size: 34 }),
      ],
      { gap: 'tight' },
    ),
    right,
  );
  const caption = place(
    row(
      [
        note('Fixed axis: blue negative inputs · cyan positive inputs'),
        decimal(
          () => symmetric.reduce((sum, v) => sum + activation(v) ** 2, 0) / symmetric.length,
          { prefix: 'E[h²] = ', digits: 2, size: 40, color: 'yellow' },
        ),
      ],
      { gap: 'loose' },
    ),
    foot,
  );
  s.add(heading(c.title), title, frames, bars, ruler, dots, caption);
  c.on('init-sum', () => s.play(included.to(groups, { duration: 2 })));
  c.on('init-scale', () => s.play(variance.to(1 / full.count, { duration: 2 })));
  c.show('init-scale', rules.nodes[0]);
  c.show('init-xavier', rules.nodes[1]);
  c.on('init-random', () =>
    s.play(
      ...frames.filter((_, i) => i % 2 === 0).map((n) => indicate(n, { scale: 1, color: 'blue' })),
    ),
  );
  c.show('init-normal', rules.nodes[2]);
  c.show('init-uniform', rules.nodes[3]);
  c.on('init-relu', () => s.play(negative.to(0, { duration: 1.5 })));
  c.show('init-he', rules.nodes[4]);
  c.on('init-he-points', () => {
    s.play(negative.to(1, { duration: 0.3 }));
    s.play(he.to(2, { duration: 1.2 }));
    s.play(negative.to(0, { duration: 1.2 }));
  });
  c.on('init-moment', () => s.play(indicate(caption, { scale: 1, color: 'yellow' })));
}
