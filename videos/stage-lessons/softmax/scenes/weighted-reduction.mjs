// The same weighted numerator splits into six equal shares or two equal shares.
import {
  assertEqual,
  barChart,
  boxOf,
  column,
  dynamic,
  fade,
  fitted,
  place,
  rect,
  row,
  tex,
  to,
} from 'vizmatic/stage';
import { completeModel } from '../../../films/softmax/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR } from '../parts.mjs';

const WEIGHTS = [2, 4];
const COLORS = ['blue', 'pink'];

export default function weightedReduction(s, c) {
  const model = completeModel();
  const positions = WEIGHTS.length;
  const weightSum = WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  const ordinaryLoss = -Math.log(1 / 2); // Each binary prediction is uniform.
  assertEqual(weightSum * ordinaryLoss, model.weightNumerator, 'weighted numerator');
  assertEqual(model.weightNumerator / weightSum, model.integerWeighted, 'class-index mean');
  assertEqual(model.weightNumerator / positions, model.floatWeighted, 'one-hot mean');

  const [inputs, ...lanes] = area.rows([1.2, 1, 1, 1], 'normal');
  // Every length below uses this common scale, including the moving partitions.
  const regions = lanes.map((lane) => lane.columns([2.6, 6.5, 2.4], 'normal'));
  const barWidth = regions[0][1].width * 0.88;
  const height = 64;
  const names = ['Weighted sum', 'Integer target', 'Float one-hot'].map((name, i) =>
    place(label(name, { size: 45 }), regions[i][0], 'left'),
  );
  const [predictions, contributions] = inputs.columns([2, 3], 'loose');
  const predictionSlots = predictions.columns(2, 'wide');
  const binary = predictionSlots.map((slot, i) =>
    place(
      fitted(slot, (width) =>
        barChart(
          [
            { label: 'class 0', value: 0.5, color: 'blue' },
            { label: 'class 1', value: 0.5, color: 'pink' },
          ],
          { width, height: slot.height * 0.35, max: 1, labelSize: 34, showValues: false },
        ),
      ),
      slot,
    ),
  );
  const rowNames = binary.map((chart, i) =>
    place(note(i === 0 ? 'row A' : 'row B'), predictionSlots[i], 'top'),
  );
  const halves = binary.map((chart, i) =>
    place(mono('½     ½', { size: 34 }), predictionSlots[i], 'bottom'),
  );
  const laneFrames = regions.map((cells) =>
    rect(barWidth + 48, height + 24, { stroke: 'dim', width: 2, fill: null, opacity: 0.3 }).moveTo([
      cells[1].left + barWidth / 2,
      cells[1].cy,
    ]),
  );
  const sourceTitle = place(note('Loss at each observed class'), contributions, 'top left');
  const pair = (values) =>
    place(
      row(
        values.map((value, i) => mono(value, { size: 46, color: COLORS[i] })),
        { gap: 'loose' },
      ),
      contributions,
    );
  const symbolic = pair(['A   weight × loss', 'B   weight × loss']);
  const uniform = pair(['A   weight × ln 2', 'B   weight × ln 2']);
  const weighted = pair(WEIGHTS.map((w, i) => `${i === 0 ? 'A' : 'B'}   ${w} × ln 2`));

  const rule = (words, i) => place(label(words, { size: 44, color: 'dim' }), regions[i][1], 'left');
  const sumRule = rule('Add both weighted losses', 0);
  const pending = [1, 2].map((i) => rule('Divide by …', i));
  const divisors = [rule('Sum of target-class weights', 1), rule('Number of positions', 2)];
  const example = place(note('Uniform binary predictions'), contributions, 'top left');
  s.add(heading(c.title), laneFrames, sourceTitle, names, pending, binary, rowNames);
  c.onBeat(0, () => s.play(...binary.map((chart) => fade(chart, 0.35)), { duration: 0.1 }));
  c.show('weighted-reduction-0', [symbolic, sumRule]);
  c.swap('weighted-contract', pending[0], divisors[0]);
  c.swap('weighted-count', pending[1], divisors[1]);
  c.swap('weighted-reduction-1', sourceTitle, example);
  c.on('weighted-uniform', () =>
    s.play(...binary.map((chart) => fade(chart, 1)), { duration: 0.5 }),
  );
  c.show('weighted-uniform', halves, { after: true });
  c.swap('weighted-uniform', symbolic, uniform, { after: true });
  c.swap('weighted-weights', uniform, weighted, { after: true });

  const segments = WEIGHTS.map((w, i) =>
    rect((barWidth * w) / weightSum, height, { fill: COLORS[i], stroke: null }),
  );
  place(row(segments, { gap: 'none' }), regions[0][1], 'left');
  const sum = place(
    mono(`${weightSum} ln 2`, { size: 53, color: MARK_COLOR }),
    regions[0][2],
    'left',
  );
  const destinations = segments.map((segment) => boxOf(segment).point('center'));
  segments.forEach((segment, i) => {
    const source = boxOf(weighted.nodes[i]).point('bottom');
    segment.moveTo([source[0], source[1] + height]);
  });
  c.hide('weighted-numerator', sumRule, { fade: 0.15 });
  c.show('weighted-numerator', segments, { lead: -0.2, fade: 0.1 });
  c.on(
    'weighted-numerator',
    () =>
      s.play(
        ...segments.map((segment, i) =>
          to(segment, (n) => n.moveTo(destinations[i]), { duration: 1.4 }),
        ),
      ),
    0.2,
  );
  c.show('weighted-numerator', sum, { after: true });

  // Open seams in a copy of the full bar. Each piece keeps its width throughout the cut.
  const divide = (cue, i, count, color, answer) => {
    const part = barWidth / count;
    const gap = (regions[i][1].width - barWidth) / (weightSum - 1);
    const spread = s.value(0);
    const strip = dynamic(() =>
      Array.from({ length: count }, (_, piece) =>
        rect(part, height, {
          fill: piece === 0 ? color : 'dim',
          stroke: null,
          opacity: piece === 0 ? 1 : 0.55,
        }).at(
          regions[i][1].left + part / 2 + piece * (part + spread.value * gap),
          regions[i][1].cy,
        ),
      ),
    );
    const caption = place(note(`÷ ${count} equal parts`), regions[i][1], 'bottom left');
    const exact = weightSum / count === 1 ? 'ln 2' : `${weightSum / count} ln 2`;
    const result = place(
      column(
        [
          mono(exact, { size: 52, color }),
          mono(`≈ ${answer.toFixed(3)}`, { size: 35, color: 'dim' }),
        ],
        { gap: 'tight', align: 'left' },
      ),
      regions[i][2],
      'left',
    );
    c.swap(cue, divisors[i - 1], [strip, caption], { after: true });
    c.after(cue, () => s.play(spread.to(1, { duration: 0.9 })), 0.25);
    c.show(cue, result, { after: true, lead: -0.9 });
  };
  c.hide('weighted-integer', laneFrames[1], { after: true, fade: 0.15 });
  c.hide('weighted-float', laneFrames[2], { after: true, fade: 0.15 });
  divide('weighted-integer', 1, weightSum, 'ink', model.integerWeighted);
  divide('weighted-float', 2, positions, 'cyan', model.floatWeighted);

  const keep = place(
    label('Combine weighted sums and denominators across shards.', { size: 47 }),
    inputs,
  );
  const combine = place(
    tex('L = \\frac{S_1 + S_2}{D_1 + D_2}', { size: 56, color: MARK_COLOR }),
    inputs,
  );
  c.swap('weighted-reduction-2', [example, weighted, binary, rowNames, halves], keep);
  c.swap('weighted-combine', keep, combine);
}
