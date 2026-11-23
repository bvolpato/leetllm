import {
  appear,
  arrow,
  assertEqual,
  barChart,
  beside,
  boxOf,
  column,
  dot,
  draw,
  fitted,
  group,
  indicate,
  line,
  place,
  rect,
  row,
} from 'vizmatic/stage';
import { chip, label, mono, note } from '../../kit-narrated.mjs';
import { footer, open, picture } from '../parts.mjs';
export default function selectorTrial(s, c) {
  open(s, c);
  const inputs = { labels: 400, baseline: 61, random: 64, hybrid: 68 };
  const gain = { random: inputs.random - inputs.baseline, hybrid: inputs.hybrid - inputs.baseline };
  const efficiency = [inputs.labels / gain.random, inputs.labels / gain.hybrid];
  assertEqual(gain.random, 3, 'random percentage-point gain');
  assertEqual(gain.hybrid, 7, 'hybrid percentage-point gain');
  assertEqual(
    efficiency.map((v) => v.toFixed(1)).join(','),
    '133.3,57.1',
    'labels per percentage point',
  );
  const [left, right] = picture.columns([2, 1], 'loose');
  const plot = left.inset('loose');
  const low = inputs.baseline - 1,
    high = inputs.hybrid + 1;
  const pos = (labels, score) => [
    plot.left + (labels / inputs.labels) * plot.width,
    plot.bottom - ((score - low) / (high - low)) * plot.height,
  ];
  const axes = [
    line(plot.point('bottom left'), plot.point('top left'), { stroke: 'dim', width: 3 }),
    line(plot.point('bottom left'), plot.point('bottom right'), { stroke: 'dim', width: 3 }),
  ];
  const chartFrame = place(
    rect(plot.width, plot.height, { stroke: 'dim', width: 3, radius: 8 }),
    plot,
  ).zIndex(-1);
  const gridLines = [
    ...plot
      .rows(3, 'none')
      .slice(0, 2)
      .map((r) =>
        line(r.point('bottom left'), r.point('bottom right'), { stroke: 'grid', width: 3 }),
      ),
    ...plot
      .columns(3, 'none')
      .slice(0, 2)
      .map((r) =>
        line(r.point('top right'), r.point('bottom right'), { stroke: 'grid', width: 3 }),
      ),
  ];
  const yTitle = beside(note('Validation %'), plot, 'above', 'normal');
  const xTitle = beside(note('Accepted labels'), plot, 'under', 'normal');
  const zero = beside(mono('0', { size: 34 }), plot, 'under', 'tight', 'left');
  const last = beside(mono(String(inputs.labels), { size: 34 }), plot, 'under', 'tight', 'right');
  const checkpoint = dot(12, 'ink').moveTo(pos(0, inputs.baseline));
  const baseLabel = beside(
    mono(String(inputs.baseline) + '%', { size: 34 }),
    checkpoint,
    'above',
    'wide',
    'left',
  );
  const randomPoint = dot(12, 'blue').moveTo(pos(inputs.labels, inputs.random));
  const hybridPoint = dot(12, 'cyan').moveTo(pos(inputs.labels, inputs.hybrid));
  const randomGuide = line(pos(0, inputs.baseline), pos(inputs.labels, inputs.random), {
    stroke: 'blue',
    width: 6,
  });
  const hybridGuide = line(pos(0, inputs.baseline), pos(inputs.labels, inputs.hybrid), {
    stroke: 'cyan',
    width: 6,
  });
  const randomLabel = beside(
    label(inputs.random + '% · random', { color: 'blue' }),
    randomPoint,
    'under',
    'normal',
    'right',
  );
  const hybridLabel = beside(
    label(inputs.hybrid + '% · hybrid', { color: 'cyan' }),
    hybridPoint,
    'above',
    'normal',
    'right',
  );
  const [branchArea, budgetArea, costArea, testArea] = right.rows([1, 1, 4, 1], 'normal');
  const [costHead, costPlot] = costArea.rows([1, 4], 'normal');
  const branches = place(
    row([chip('random', { color: 'blue' }), chip('hybrid', { color: 'cyan' })], { gap: 'wide' }),
    branchArea,
  );
  const budget = place(chip(inputs.labels + ' accepted labels', { color: 'yellow' }), budgetArea);
  const cost = place(
    fitted(costPlot, (w) =>
      barChart(
        [
          { label: 'random', value: 0, color: 'blue' },
          { label: 'hybrid', value: 0, color: 'cyan' },
        ],
        {
          width: w,
          height: costPlot.height * 0.6,
          max: Math.ceil(Math.max(...efficiency) / 50) * 50,
          ticks: [0],
          labelSize: 34,
          showValues: false,
        },
      ),
    ),
    costPlot,
  );
  const costTitle = place(note('Labels per percentage point'), costHead);
  const costs = efficiency.map((v, i) =>
    beside(
      mono(inputs.labels + '/' + [gain.random, gain.hybrid][i] + ' = ' + v.toFixed(1), {
        size: 29,
        color: i ? 'cyan' : 'blue',
      }),
      cost,
      'under',
      'tight',
      cost.bar(i),
    ),
  );
  const sealed = place(chip('Private test: sealed', { color: 'pink' }), testArea);
  const [originalTestArea, freshTestArea] = testArea.rows(2, 'tight');
  const checkingTest = place(
    note('Suppose the team rechecks the private test.', { color: 'yellow' }),
    originalTestArea,
  );
  const tunedOnTest = place(
    note('Original test used for tuning', { color: 'red' }),
    originalTestArea,
  );
  const freshTest = place(
    note('Use a fresh independent test for the claim.', { color: 'pink' }),
    freshTestArea,
  );
  const plotLabels = [baseLabel, randomLabel, hybridLabel].map((words) => {
    const b = boxOf(words);
    return group(
      rect(b.width + 32, b.height + 28, { fill: 'bg', stroke: 'bg' }).moveTo(b.point('center')),
      words,
    ).zIndex(3);
  });
  const caution = place(
    note('Example validation scores at the start and after 400 labels.'),
    footer,
  );
  const gains = place(
    row(
      [
        mono(inputs.random + ' − ' + inputs.baseline + ' = +' + gain.random + ' pp', {
          color: 'blue',
        }),
        mono(inputs.hybrid + ' − ' + inputs.baseline + ' = +' + gain.hybrid + ' pp', {
          color: 'cyan',
        }),
      ],
      { gap: 'loose' },
    ),
    footer,
  );
  const allCost = place(
    note('Include review time for rejected cases, adjudication and compute.'),
    footer,
  );
  const validationTuning = place(
    note('Tune selector weights and checkpoints on validation.'),
    footer,
  );
  const lossOfIndependence = place(
    note(
      'The original test influenced the weight choice, so it can no longer give an independent estimate.',
    ),
    footer,
  );
  const sampling = place(
    note('Store sampling policy and inclusion information with each training row.'),
    footer,
  );
  const designRows = left.inset('normal').rows(4, 'wide');
  const commonCheckpoint = place(
    chip('One checkpoint · same training settings', { color: 'ink' }),
    designRows[0],
  );
  const designColumns = designRows.slice(1).map((r) => r.columns(2, 'wide'));
  const trainingBranches = ['Random training', 'Hybrid training'].map((name, i) =>
    place(chip(name, { color: i ? 'cyan' : 'blue' }), designColumns[0][i]),
  );
  const budgetSlots = designColumns[1].map((r, i) => {
    const [head, slots] = r.rows([1, 1], 'tight');
    return [
      place(note('Equal accepted-label budget', { color: i ? 'cyan' : 'blue' }), head),
      ...slots
        .columns(4, 'tight')
        .map((slot) =>
          place(
            rect(slot.width - 8, slot.height - 8, { stroke: i ? 'cyan' : 'blue', radius: 8 }),
            slot,
          ),
        ),
    ];
  });
  const validation = ['Random → validation', 'Hybrid → validation'].map((name, i) =>
    place(chip(name, { color: i ? 'cyan' : 'blue' }), designColumns[2][i]),
  );
  const designLinks = trainingBranches.flatMap((node, i) => [
    arrow(boxOf(commonCheckpoint).point('bottom'), boxOf(node).point('top'), {
      stroke: i ? 'cyan' : 'blue',
      width: 4,
      pad: 12,
    }),
    arrow(designColumns[1][i].point('bottom'), boxOf(validation[i]).point('top'), {
      stroke: i ? 'cyan' : 'blue',
      width: 4,
      pad: 8,
    }),
  ]);
  const design = [commonCheckpoint, trainingBranches, budgetSlots, validation, designLinks];
  const partitions = place(
    note('Split source families: training / validation / sealed private test.'),
    footer,
  );
  const shared = place(note('Paired seeds · same rubric and reviewers'), budgetArea);
  s.add(design, shared, cost, costTitle, sealed, partitions);
  c.on('paired-experiment', () =>
    s.play(indicate([commonCheckpoint, trainingBranches], { color: 'yellow', scale: 1 })),
  );
  c.on('seed-differences', () => s.play(indicate(shared, { color: 'yellow', scale: 1 })));
  c.swap('trial-inputs', design, [chartFrame, gridLines, axes, yTitle, xTitle, zero, branches]);
  c.swap('trial-inputs', shared, budget);
  c.swap('trial-inputs', partitions, caution);
  c.show('trial-inputs', last);
  c.show('trial-inputs', [checkpoint, appear(plotLabels[0])], { after: true });
  c.show('trial-random', [randomPoint, appear(plotLabels[1])], { after: true });
  c.show('trial-hybrid', [hybridPoint, appear(plotLabels[2])], { after: true });
  c.show(
    'score-gain',
    [draw(randomGuide, { duration: 1.5 }), draw(hybridGuide, { duration: 1.5 })],
    { after: true },
  );
  c.swap('score-gain', caution, gains, { after: true });
  c.after('label-efficiency', () => s.play(cost.update(efficiency, { duration: 1.5 })));
  c.show('label-efficiency', costs, { after: true, lead: -1.6 });
  c.swap('full-cost', gains, allCost);
  c.swap(2, allCost, validationTuning, { lead: 0 });
  c.swap('private-test-tuning', sealed, checkingTest, { lead: 0, fade: 0.2 });
  c.swap('private-test-tuning', checkingTest, tunedOnTest, { after: true, fade: 0.2 });
  c.swap('test-adaptation', validationTuning, lossOfIndependence, { after: true });
  c.show('fresh-independent-test', freshTest, { after: true });
  c.swap('sampling-record', lossOfIndependence, sampling);
  c.clear([chartFrame, randomGuide, hybridGuide, ...axes, ...gridLines], 0.8, 0.2);
}
