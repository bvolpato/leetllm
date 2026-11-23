// Scene `bias-and-prior`: three reasons for a center that is not the fraction of the sample.
//
// The picture changes two times, in one frame. First the bell of routine-only estimates stands at
// 12%, left of the target population rate. These are independent population draws, not distinct
// messages from the earlier fixed queue. As the sample grows, the bell gets narrow and the block of
// variance shrinks, and the block of squared bias does not: a floor. Then five labels and a
// Beta(2,2) prior give a posterior with a mode and a mean at two places. Last, one bucket is
// compatible with its forecast, and 24 preselected bins compare each interval with its own forecast.
import {
  arrow,
  assertEqual,
  beside,
  boxOf,
  circle,
  clamp,
  column,
  dot,
  draw,
  dynamic,
  fade,
  indicate,
  line,
  linear,
  place,
  polyline,
  rect,
  row,
  seededRandom,
  tex,
  text,
} from 'vizmatic/stage';
import { sliceModel } from '../../../films/estimation/fixtures.mjs';
import { biasVarianceState, wilson } from '../../../films/estimation/model.mjs';
import { chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  FIELD,
  HEAD_LEFT,
  HEAD_RIGHT,
  PANELS,
  POINT,
  READOUT,
  RIGHT_PANEL,
  ROWS,
  SAMPLE,
  HELD_OUT,
  THRESHOLD,
  TRAY_GRID,
  TRAY_HEAD,
  labelOf,
  mark,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The sample sizes of the sweep of the first beat. */
const FIRST = 25,
  LAST = 10000;
/** The labels of the second beat: one specialist case in five, and a Beta(2,2) prior. */
const FEW = 5,
  PRIOR = 1;
/** Constructed held-out buckets have forecasts fixed before their binary outcomes are drawn. */
const random = seededRandom(92);
const BUCKETS = Array.from({ length: 24 }, (_, index) => {
  const forecast = (8 + (index % 7) * 2) / 100;
  const n = 100;
  const k = Array.from({ length: n }, () => random() < forecast).filter(Boolean).length;
  const interval = wilson(k, n);
  return {
    forecast,
    n,
    k,
    interval,
    covers: interval.low <= forecast && forecast <= interval.high,
  };
});

export default function biasAndPrior(s, c) {
  const axis = rateAxis(s);
  const routine = sliceModel[0].rate,
    whole = sliceModel.reduce((sum, slice) => sum + slice.expected, 0) / 1000;
  const peakY = PANELS.inset('none', 'loose').top;
  const curveY = (value) => axis.y - value * (axis.y - peakY);
  // The x of a rate when the axis ends at 100%, and at rest.
  const wide = (rate) => FIELD.left + rate * FIELD.width;
  const near = (rate) => FIELD.left + (rate / 0.4) * FIELD.width;

  // The values of the scene.
  const size = s.value(Math.log(FIRST)); // the logarithm of the routine-only sample size
  const repaired = s.value(0); // the omitted slices come into the sample: the bias goes to zero
  const bias = s.value(1), // which of the three pictures is on screen
    bayes = s.value(0),
    bins = s.value(0);
  const hump = s.value(0), // the prior curve, and the posterior curve
    posterior = s.value(0);
  const built = s.value(0); // the 24 bins that are drawn
  const selectedMiss = s.value(0); // the searched-for miss is emphasized after all comparisons appear
  const flow = s.value(0); // fresh draws leave a population source that stays full
  const sourceVisible = s.value(0);

  const state = () => biasVarianceState(Math.round(Math.exp(size.value)));
  const center = () => routine + (whole - routine) * repaired.value;
  const samplingVariance = () =>
    repaired.value === 0 ? state().variance : (center() * (1 - center())) / state().n;
  assertEqual(
    biasVarianceState(LAST).variance,
    (routine * (1 - routine)) / LAST,
    'independent routine-draw variance',
  );
  assertEqual(
    biasVarianceState(LAST).squaredBias,
    (routine - whole) ** 2,
    'squared bias relative to the target population',
  );

  // A population model supplies fresh independent labels. It has no finite stock to exhaust.
  const sourceTitle = place(
    label('independent draws', { color: COLOR.sample, size: 34 }),
    HEAD_RIGHT,
    'left',
  );
  const source = place(
    namedBox('routine population', {
      width: RIGHT_PANEL.width - 40,
      height: 90,
      color: COLOR.sample,
    }),
    RIGHT_PANEL,
    'top',
  );
  const sourceRate = beside(note('12% specialist'), source, 'under', 'tight');
  const streamTop = boxOf(sourceRate).bottom + 24,
    streamBottom = RIGHT_PANEL.bottom - 116;
  const streamArrow = arrow([RIGHT_PANEL.cx, streamTop], [RIGHT_PANEL.cx, streamBottom], {
    stroke: 'dim',
    width: 3,
    tip: 12,
  });
  const stream = dynamic(() => {
    if (sourceVisible.value < 0.02) return [];
    return Array.from({ length: 5 }, (_, index) => {
      const progress = (flow.value + index / 5) % 1;
      const drawIndex = Math.floor(flow.value + index / 5) * 5 + index;
      return mark(
        (drawIndex * 37) % 100 < routine * 100 ? 'specialist' : 'regular',
        8,
        sourceVisible.value,
      ).at(RIGHT_PANEL.cx, streamTop + progress * (streamBottom - streamTop));
    });
  });
  const replenished = beside(
    note('source stays full'),
    [RIGHT_PANEL.cx, streamBottom],
    'under',
    'normal',
  );
  const mix = beside(
    column([note('same slice rates and mix'), note('shares: 70% / 20% / 10%')], {
      gap: 'tight',
      align: 'center',
    }),
    replenished,
    'under',
    'normal',
  );
  const sourceNodes = [sourceTitle, source, sourceRate, streamArrow, replenished];

  // The left column of the first beat: the mean squared error as two blocks, to one scale.
  const bar = TRAY_GRID.columns([2, 3], 'normal')[0];
  const scale = TRAY_GRID.height / biasVarianceState(FIRST).mse;
  const blocks = dynamic(() => {
    if (bias.value < 0.02) return [];
    const now = state(),
      opacity = bias.value;
    const squared = now.squaredBias * (1 - repaired.value) ** 2 * scale,
      variance = samplingVariance() * scale;
    const marks = [];
    if (squared > 0.5)
      marks.push(
        rect(bar.width, squared, { fill: COLOR.failure, stroke: null, radius: 4, opacity }).at(
          bar.cx,
          bar.bottom - squared / 2,
        ),
      );
    if (variance > 0.5)
      marks.push(
        rect(bar.width, variance, { fill: COLOR.sample, stroke: null, radius: 4, opacity }).at(
          bar.cx,
          bar.bottom - squared - variance / 2,
        ),
      );
    return marks;
  });
  const squaredTop = bar.bottom - biasVarianceState(FIRST).squaredBias * scale;
  const formula = place(
    tex('\\text{MSE} = \\text{bias}^2 + \\text{variance}', { size: 38 }),
    TRAY_HEAD,
  );
  const nameSlots = [
    beside(
      label('variance', { color: COLOR.sample }),
      [bar.right, squaredTop - 60],
      'right',
      'normal',
    ),
    beside(
      label('squared bias = 0', { color: COLOR.failure }),
      [bar.right, (squaredTop + bar.bottom) / 2 + 30],
      'right',
      'normal',
    ),
  ];
  const blockNames = dynamic(() => {
    const squared = state().squaredBias * (1 - repaired.value) ** 2 * scale;
    const variance = samplingVariance() * scale;
    const squaredY = Math.min(bar.bottom - squared / 2 + 30, bar.bottom - 30);
    const varianceY = Math.min(bar.bottom - squared - Math.max(variance / 2, 45), squaredY - 78);
    const names = ['variance', repaired.value >= 1 - 1e-6 ? 'squared bias = 0' : 'squared bias'];
    return names.flatMap((name, index) => {
      const color = index ? COLOR.failure : COLOR.sample;
      const segmentY = index ? bar.bottom - squared / 2 : bar.bottom - squared - variance / 2;
      const labelY = index ? squaredY : varianceY;
      const left = boxOf(nameSlots[index]).left;
      return [
        polyline(
          [
            [bar.right, segmentY],
            [left - 20, segmentY],
            [left - 20, labelY],
          ],
          {
            stroke: color,
            width: 2,
          },
        ),
        label(name, { color }).at(nameSlots[index].get('x'), labelY),
      ];
    });
  });
  const floorValue = beside(
    mono('0.003136', { color: COLOR.failure }),
    [bar.right, (squaredTop + bar.bottom) / 2 - 30],
    'right',
    'normal',
  );
  const floor = line([bar.left - 10, squaredTop], [TRAY_GRID.right, squaredTop], {
    stroke: COLOR.mark,
    width: 4,
    dash: [10, 8],
  });
  const sizeSlot = mono('00,000', { size: 56 });
  const sizeRow = place(
    row([label('independent draws', { size: 30 }), sizeSlot], { gap: 'normal' }),
    READOUT,
    'top',
  );
  const liveSize = dynamic(() =>
    bias.value < 0.02
      ? []
      : text(Math.round(Math.exp(size.value)).toLocaleString('en-US').padStart(6), {
          font: 'mono',
          size: 56,
          color: COLOR.sample,
        })
          .at(sizeSlot.get('x'), sizeSlot.get('y'))
          .opacity(bias.value),
  );

  // The plot of the first beat: the bell of the estimates, and the rate of the full queue.
  const trace = (at, style) => {
    const points = [];
    for (let step = 0; step <= 200; step++) {
      const rate = clamp(
        axis.min.value + ((axis.max.value - axis.min.value) * step) / 200,
        1e-6,
        1 - 1e-6,
      );
      points.push([axis.x(rate), curveY(at(rate))]);
    }
    return polyline(points, style);
  };
  const bell = dynamic(() => {
    if (bias.value < 0.02) return [];
    const spread = Math.sqrt(samplingVariance()),
      middle = center();
    // The bell is narrow at the end of the sweep: its points are at steps of its own width.
    const rates = [axis.min.value];
    for (let step = -40; step <= 40; step++) {
      const rate = middle + (step / 10) * spread;
      if (rate > axis.min.value && rate < axis.max.value) rates.push(rate);
    }
    rates.push(axis.max.value);
    const points = rates.map((rate) => [
      axis.x(rate),
      curveY(Math.exp(-((rate - middle) ** 2) / (2 * spread ** 2))),
    ]);
    return [
      polyline(points, { stroke: COLOR.sample, width: 5, opacity: bias.value }),
      dot(POINT, COLOR.sample, { opacity: bias.value }).at(axis.x(middle), axis.y),
    ];
  });
  const bellName = beside(
    label('routine only: 12%', { color: COLOR.sample }),
    [near(routine), curveY(1)],
    'above',
    'normal',
  );
  const matchedName = place(
    label('target mix matched', { color: COLOR.accepted, size: 32 }),
    HEAD_RIGHT,
    'left',
  );
  const schematic = place(note('distribution shape: schematic'), READOUT, 'bottom');
  const truth = axis.upright(() => whole);
  const truthName = label('target mix: 17.6%', { color: COLOR.specialist, size: 34 }).at(
    RIGHT_PANEL.cx,
    axis.rowY(1),
  );
  const gapY = curveY(0.75);
  const gap = dynamic(() => {
    const from = axis.x(center()),
      to = axis.x(whole);
    if (to - from < 30) return [];
    return arrow([from, gapY], [to, gapY], {
      stroke: COLOR.failure,
      width: 5,
      both: true,
      tip: 16,
    });
  });
  const gapName = beside(
    label('-5.6 points', { color: COLOR.failure }),
    [near(THRESHOLD), gapY],
    'right',
    'normal',
  );

  // The second beat: five labels with two prior terms, the prior, and the posterior with its centers.
  const fewRoom = TRAY_GRID.inset('normal', 'loose');
  const few = slots(FEW, FEW, fewRoom),
    full = slots(SAMPLE.length, 10);
  const labels = dynamic(() => {
    const marks = [];
    if (bayes.value > 0.02)
      few.forEach((at, index) =>
        marks.push(mark(labelOf(SAMPLE[index]), radiusOf(FEW, fewRoom), bayes.value).at(at)),
      );
    if (bins.value > 0.02)
      HELD_OUT.forEach((message, index) =>
        marks.push(mark(labelOf(message), radiusOf(10), bins.value).at(full[index])),
      );
    return marks;
  });
  const fewName = place(label('1 of 5 labels'), TRAY_HEAD);
  const ring = (color) => circle(26, { stroke: color, width: 5, fill: null });
  const priorMarks = [ring(COLOR.specialist), ring(COLOR.sample)];
  const priorTerms = place(
    column([row(priorMarks, { gap: 'normal' }), note('two prior terms, not labels')], {
      gap: 'tight',
      align: 'center',
    }),
    READOUT,
    'top',
  );
  const curves = dynamic(() => {
    if (bayes.value < 0.02) return [];
    const marks = [];
    if (hump.value > 0.02)
      marks.push(
        trace((rate) => 4 * rate * (1 - rate), {
          stroke: 'dim',
          width: 4,
          dash: [10, 8],
          opacity: bayes.value * hump.value,
        }),
      );
    if (posterior.value > 0.02) {
      // Beta(3,6): one success and four failures, with one prior term on each side.
      const a = 1 + PRIOR,
        b = FEW - 1 + PRIOR;
      const mode = a / (a + b);
      const log = (rate) => a * Math.log(rate) + b * Math.log(1 - rate);
      marks.push(
        trace((rate) => Math.exp(log(rate) - log(mode)), {
          stroke: 'ink',
          width: 5,
          opacity: bayes.value * posterior.value,
        }),
      );
    }
    return marks;
  });
  const centers = [
    { name: 'mode 2/7', rate: 2 / 7, row: 2, color: 'ink' },
    { name: 'mean 3/9', rate: 3 / 9, row: 1, color: 'ink' },
    { name: 'Wilson center', rate: wilson(1, FEW).center, row: 0, color: COLOR.accepted },
  ].map((entry) => [
    dot(POINT - 2, entry.color).at(wide(entry.rate), axis.rowY(entry.row)),
    beside(
      note(entry.name, { color: entry.color }),
      [wide(entry.rate), axis.rowY(entry.row)],
      'right',
      'normal',
    ),
  ]);
  const raw = [
    dot(POINT, COLOR.sample).at(wide(1 / FEW), axis.y),
    beside(mono('1/5', { color: COLOR.sample }), [wide(1 / FEW), axis.rowY(0)], 'left', 'normal'),
  ];
  const priorName = beside(note('prior'), [wide(0.5), curveY(1)], 'above', 'tight');

  // The third beat compares each preselected bucket with its own fixed forecast.
  const bucketName = place(label('one score bucket: 100'), TRAY_HEAD);
  const interval = wilson(16, 100);
  const forecast = line([near(THRESHOLD), ROWS.top], [near(THRESHOLD), axis.y], {
    stroke: COLOR.mark,
    width: 6,
  });
  const forecastName = beside(
    label('forecast 20%', { color: COLOR.mark }),
    [near(THRESHOLD), axis.rowY(2)],
    'right',
    'normal',
  );
  const bucket = [axis.bar(() => interval), axis.point(() => 16 / 100)];
  const fits = beside(
    label('compatible', { color: COLOR.accepted }),
    [near(interval.high), axis.rowY(0)],
    'right',
    'normal',
  );
  const oneOnly = place(note('one bucket, not the whole model'), HEAD_RIGHT, 'right');
  const rowAt = (index) => axis.rowY(1) - index * 20;
  const stack = dynamic(() =>
    BUCKETS.slice(0, Math.ceil(built.value)).flatMap((entry, index) => {
      const color = entry.covers ? COLOR.accepted : COLOR.failure,
        opacity = Math.min(1, built.value - index);
      return [
        line(
          [axis.x(entry.interval.low), rowAt(index)],
          [axis.x(entry.interval.high), rowAt(index)],
          {
            stroke: color,
            width: 6,
            opacity,
          },
        ),
        dot(5, COLOR.sample, { opacity }).at(axis.x(entry.k / entry.n), rowAt(index)),
        line(
          [axis.x(entry.forecast), rowAt(index) - 8],
          [axis.x(entry.forecast), rowAt(index) + 8],
          { stroke: COLOR.mark, width: 4, opacity },
        ),
      ];
    }),
  );
  const misses = BUCKETS.filter((entry) => !entry.covers).length;
  assertEqual(misses > 0, true, 'the constructed search contains a chance miss');
  const honestName = place(label('24 preselected bins', { size: 34 }), HEAD_LEFT, 'left');
  const forecastKey = place(note('yellow tick: forecast'), HEAD_RIGHT, 'right');
  const missed = BUCKETS.findIndex((entry) => !entry.covers);
  const selected = dynamic(() => {
    if (selectedMiss.value < 0.02) return [];
    const entry = BUCKETS[missed];
    const left = axis.x(Math.min(entry.interval.low, entry.forecast)) - 12;
    const right = axis.x(Math.max(entry.interval.high, entry.forecast)) + 12;
    return rect(right - left, 18, {
      stroke: COLOR.failure,
      width: 3,
      fill: null,
      radius: 5,
      opacity: selectedMiss.value,
    }).at((left + right) / 2, rowAt(missed));
  });
  const selectedName = place(
    note('selected miss after searching', { color: COLOR.failure }),
    READOUT,
    'bottom',
  );
  const checks = ['sampling uncertainty', 'ambiguous labels', 'unfamiliar traffic'].map((name) =>
    chip(name),
  );
  place(column(checks, { gap: 'tight', align: 'center' }), READOUT, 'top');

  // The first picture: the bell of routine-only estimates, and the two blocks of its error.
  s.add(heading(c.title), blocks, bell, labels, curves, stack, selected, liveSize, stream);
  c.take([axis.rule]);
  s.add(axis.title, axis.threshold);
  c.keep([axis.rule, axis.title]);
  s.add(sizeRow.nodes.filter((node) => node !== sizeSlot));

  c.show('independent-draws', [...sourceNodes, schematic]);
  c.on('independent-draws', () => {
    s.play(sourceVisible.to(1, { duration: 0.3 }));
    s.play(
      flow.to(12, {
        duration: c.cue('repair').start - c.cue('independent-draws').start,
        ease: linear,
      }),
    );
  });
  c.show('same-mix', mix);
  c.show('mse-parts', [formula, blockNames]);
  c.show('routine-center', bellName);
  c.show('full-rate', [truth, truthName]);
  c.show('bias-gap', gap);
  c.show('bias-gap', gapName, { after: true });
  // The sample grows: the bell and the variance get small, and the squared bias stays.
  const grow = c.cue('variance-shrinks'),
    fixed = c.cue('bias-fixed');
  c.on('variance-shrinks', () =>
    s.play(size.to(Math.log(LAST), { duration: fixed.end - grow.start, ease: linear })),
  );
  c.show('bias-fixed', floorValue, { after: true });
  c.show('floor', draw(floor));
  c.hide('repair', [gapName, floor, floorValue]);
  c.hide('repair', [...sourceNodes, mix]);
  c.on('repair', () => s.play(sourceVisible.to(0, { duration: 0.3 })));
  c.hide('repair', bellName);
  c.show('repair', matchedName, { after: true });
  c.on('repair', () => s.play(repaired.to(1, { duration: 2 })));

  // Another reason for a center that moves: a prior.
  const first = [formula, blockNames, matchedName, schematic, truth, truthName, gap];
  c.hide('shrinkage', [...first, ...sizeRow.nodes.filter((node) => node !== sizeSlot)]);
  c.on('shrinkage', () => {
    s.play(bias.to(0, { duration: 0.4 }));
    s.play(bayes.to(1, { duration: 0.5 }), axis.max.to(1, { duration: 0.9 }));
  });
  c.show('shrinkage', [fewName, ...raw], { after: true });
  c.on('beta-prior', () => s.play(hump.to(1, { duration: 0.6 })));
  c.show('beta-prior', [priorTerms, priorName]);
  c.on('beta-posterior', () => s.play(
    indicate(priorTerms, { color: COLOR.mark }),
    ...raw.map((node) => indicate(node, { color: COLOR.mark })),
  ));
  c.after('mode', () => s.play(posterior.to(1, { duration: 0.8 })));
  c.show('mode', centers[0], { after: true });
  c.show('mean', centers[1], { after: true });
  c.on('not-cases', () => s.play(...priorMarks.map((node) => indicate(node))));
  c.show('three-centers', centers[2], { after: true });

  // Calibration: one compatible bucket, and what many bins would show by chance.
  c.hide('held-out', [fewName, ...raw, priorTerms, priorName, ...centers.flat()]);
  c.on('held-out', () => {
    s.play(bayes.to(0, { duration: 0.4 }), axis.staffing.to(0, { duration: 0.25 }));
    s.play(bins.to(1, { duration: 0.5 }), axis.max.to(0.4, { duration: 0.9 }));
  });
  c.show('held-out', [bucketName, forecast, forecastName, ...bucket, fits], { after: true });
  c.show('whole-model', oneOnly, { after: true });
  c.hide('preselected-bins', [forecast, forecastName, fits, ...bucket]);
  c.hide('many-bins', oneOnly);
  c.show('preselected-bins', honestName, { lead: -0.3 });
  c.show('many-bins', forecastKey, { after: true });
  c.after('many-bins', () => {
    s.play(built.to(BUCKETS.length, { duration: 1.6, ease: linear }));
    s.play(selectedMiss.to(1, { duration: 0.5 }));
  });
  c.show('many-bins', selectedName, { after: true, lead: -1.6 });
  c.show('distinct-checks', checks, { stagger: true });
  c.on('one-interval', () =>
    s.play(
      indicate(checks[0], { color: COLOR.accepted }),
      ...checks.slice(1).map((check) => fade(check, 0.35)),
    ),
  );
}
