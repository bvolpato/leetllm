// Scene `prior-and-calibration`: what a prior adds to a few labels, and to many.
//
// The picture: the first five labels in the tray, and a curve over the axis that says how well each
// rate fits them. Its peak is at 1 of 5. A Beta(2,2) prior adds one success term and one failure
// term: the white curve leaves the blue one, and its peak slides to 2 of 7. Then the full 100 labels
// arrive. Both curves get narrow, the axis zooms in, and the white peak stands beside the blue one.
// Last, a separate covered held-out tray reveals its labels before the forecast comparison.
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
  grid,
  indicate,
  lerp,
  line,
  linear,
  place,
  polyline,
  rect,
  row,
  smoothstep,
  text,
  to,
} from 'vizmatic/stage';
import { scoreStatistic, wilson } from '../../../films/estimation/model.mjs';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  FIELD,
  HEAD_RIGHT,
  LEFT_PANEL,
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

/** The labels of the first beat. */
const FEW = 5;
/** The Beta(2,2) prior adds one success term and one failure term to the mode. */
const PRIOR = 1;
/** A separate constructed held-out bucket supplies the count in the narration. */
const HELDOUT_COUNT = 100,
  HELDOUT_POSITIVES = 16;
assertEqual(
  HELD_OUT.filter((message) => message.specialist).length,
  HELDOUT_POSITIVES,
  'held-out positive count',
);

export default function priorAndCalibration(s, c) {
  const axis = rateAxis(s);
  const all = SAMPLE.length;
  const positives = (labels) => SAMPLE.slice(0, labels).filter((m) => m.specialist).length;
  // The x of a rate when the axis ends at 100%, and at rest, for the names of each beat.
  const wide = (rate) => FIELD.left + rate * FIELD.width;
  const near = (rate) => FIELD.left + (rate / 0.4) * FIELD.width;
  const peakY = PANELS.inset('none', 'loose').top;

  // The values of the scene.
  const labels = s.value(FEW); // the labels in the tray
  const prior = s.value(0); // the weight of the two prior terms in the white curve, from 0 to 1
  const curves = s.value(1); // the curves are on screen
  const hump = s.value(0); // the curve of the prior alone is on screen
  const heldOut = s.value(0);
  const revealed = s.value(0);
  const solved = s.value(0); // solved geometry waits for the answer clause
  const marked = s.value(0); // the peak of the white curve has its mark

  const count = () => Math.floor(labels.value + 1e-6);
  // How well a rate fits: the labels alone, or the labels with a share of the two prior terms.
  const fit = (weight) => {
    const n = count(),
      k = positives(n);
    const a = k + weight * PRIOR,
      b = n - k + weight * PRIOR;
    const mode = a / (a + b);
    const log = (rate) => a * Math.log(rate) + b * Math.log(1 - rate);
    return { mode, at: (rate) => Math.exp(log(rate) - log(mode)) };
  };
  const curveY = (value) => axis.y - value * (axis.y - peakY);
  const trace = (at, style) => {
    const points = [];
    for (let step = 0; step <= 160; step++) {
      const rate = clamp(
        axis.min.value + ((axis.max.value - axis.min.value) * step) / 160,
        1e-6,
        1 - 1e-6,
      );
      points.push([axis.x(rate), curveY(at(rate))]);
    }
    return polyline(points, style);
  };
  const plot = dynamic(() => {
    if (curves.value < 0.02) return [];
    const opacity = curves.value;
    const data = fit(0),
      posterior = fit(prior.value);
    const marks = [];
    if (hump.value > 0.02)
      marks.push(
        trace((rate) => 4 * rate * (1 - rate), {
          stroke: 'dim',
          width: 4,
          dash: [10, 8],
          opacity: opacity * hump.value,
        }),
      );
    marks.push(trace(data.at, { stroke: COLOR.sample, width: 5, opacity }));
    marks.push(
      line([axis.x(data.mode), peakY], [axis.x(data.mode), axis.y], {
        stroke: COLOR.sample,
        width: 3,
        opacity: opacity * 0.8,
      }),
    );
    marks.push(dot(POINT, COLOR.sample, { opacity }).at(axis.x(data.mode), axis.y));
    if (prior.value > 0.01 && solved.value > 0.01) {
      marks.push(trace(posterior.at, { stroke: 'ink', width: 5, opacity: opacity * solved.value }));
      if (marked.value > 0.02) {
        marks.push(
          line([axis.x(posterior.mode), peakY], [axis.x(posterior.mode), axis.y], {
            stroke: 'ink',
            width: 3,
            opacity: opacity * marked.value * solved.value,
          }),
        );
        marks.push(
          dot(POINT - 3, 'ink', { opacity: opacity * marked.value }).at(
            axis.x(posterior.mode),
            peakY,
          ),
        );
      }
    }
    return marks;
  });

  // The tray: five large labels, which make room for the full 100.
  const fewRoom = TRAY_GRID.inset('normal', 'loose');
  const few = slots(FEW, FEW, fewRoom),
    full = slots(all, 10);
  const tray = dynamic(() => {
    if (heldOut.value > 0.5)
      return full.map((at, index) =>
        mark(index < revealed.value ? labelOf(HELD_OUT[index]) : 'unknown', radiusOf(10)).at(at),
      );
    const grown = smoothstep(clamp((labels.value - FEW) / 20));
    return SAMPLE.slice(0, count()).map((message, index) =>
      index < FEW
        ? mark(labelOf(message), lerp(radiusOf(FEW, fewRoom), radiusOf(10), grown)).at(
            lerp(few[index][0], full[index][0], grown),
            lerp(few[index][1], full[index][1], grown),
          )
        : mark(labelOf(message), radiusOf(10)).at(full[index]),
    );
  });
  const fewName = place(label('the first 5 messages', { color: COLOR.sample }), TRAY_HEAD);
  const fullName = place(label('100 messages', { color: COLOR.sample }), TRAY_HEAD);
  const bucketName = place(label('held-out bucket: 100'), TRAY_HEAD);

  // The count under the tray: the labels, and beside them the two prior terms as outlines.
  const ring = (color) => circle(17, { stroke: color, width: 4, fill: null });
  const terms = row([ring(COLOR.specialist), ring(COLOR.sample), note('prior terms')], {
    gap: 'tight',
  });
  const over = mono('00', { size: 56 }),
    under = mono('000', { size: 56 });
  const plusOne = mono('+ 1', { size: 56 }),
    plusTwo = mono('+ 2', { size: 56 });
  const stroke = rect(250, 5, { fill: 'ink', stroke: null, radius: 2 });
  const result = mono('= 2/7', { size: 56 });
  const fraction = column(
    [row([over, plusOne], { gap: 'tight' }), stroke, row([under, plusTwo], { gap: 'tight' })],
    { gap: 'tight', align: 'center' },
  );
  place(
    column([terms, row([fraction, result], { gap: 'normal', align: 'center' })], {
      gap: 'normal',
      align: 'center',
    }),
    READOUT,
    'top',
  );
  const live = (slot, read, color, width) =>
    dynamic(() =>
      text(String(read()).padStart(width), { font: 'mono', size: 56, color }).at(
        slot.get('x'),
        slot.get('y'),
      ),
    );
  const liveOver = live(over, () => positives(count()), COLOR.specialist, 2),
    liveUnder = live(under, count, COLOR.sample, 3);

  const heldFraction = place(
    mono(`${HELDOUT_POSITIVES} / ${HELDOUT_COUNT}`, { size: 56, color: COLOR.sample }),
    READOUT,
    'top',
  );
  // The names of the curves, for the axis that ends at 100%.
  const fitName = place(
    note('likelihood: fit of the labels', { color: COLOR.sample }),
    HEAD_RIGHT,
    'right',
  );
  const priorName = beside(note('Beta(2,2) prior'), [wide(0.5), curveY(1)], 'above', 'tight');
  const posteriorName = place(note('posterior: labels × prior'), RIGHT_PANEL, 'top');
  const modeName = beside(mono('2/7'), [wide(2 / 7), peakY], 'above', 'normal');
  // The names of the two peaks, for the axis at rest.
  const few5 = positives(FEW) / FEW,
    map5 = (positives(FEW) + PRIOR) / (FEW + 2 * PRIOR);
  const rate = positives(all) / all,
    map = (positives(all) + PRIOR) / (all + 2 * PRIOR);
  // The two peaks by name, at the left of the curves: the staffing line is at their right.
  const mleName = [
    dot(10, COLOR.sample),
    mono('16%', { color: COLOR.sample }),
    note('labels alone'),
  ];
  const mapName = [dot(10, 'ink'), mono('16.7%'), note('with the prior terms')];
  place(
    grid([...mleName, ...mapName], { columns: 3, gap: 'tight', even: true }),
    LEFT_PANEL.inset('none', 'normal'),
    'top left',
  );
  // How far the prior moves the peak, to the scale of the axis: with 5 labels, and with 100.
  const shiftBar = (from, to, color) =>
    rect(near(to) - near(from), 10, { fill: color, stroke: null, radius: 3 });
  const shifts = place(
    grid(
      [
        shiftBar(few5, map5, 'dim'),
        note('shift, 5 labels'),
        shiftBar(rate, map, COLOR.mark),
        note('100 labels', { color: COLOR.mark }),
      ],
      { columns: 2, gap: ['normal', 'tight'], align: ['right', 'left'] },
    ),
    RIGHT_PANEL.inset('none', 'normal'),
    'top right',
  );

  // The bucket: its forecast, its fraction, and its Wilson interval.
  const interval = wilson(HELDOUT_POSITIVES, HELDOUT_COUNT);
  // The score of each candidate rate for this bucket, as in the scene of the Wilson interval.
  const CUTOFF = 1.96,
    TOP_SCORE = 5;
  const scorePlot = PANELS.inset('none', 'normal');
  const score = (candidate) => scoreStatistic(HELDOUT_POSITIVES, HELDOUT_COUNT, candidate);
  const scoreY = (value) => scorePlot.bottom - (value / TOP_SCORE) * scorePlot.height;
  const scorePoints = [];
  for (let candidate = 0.04; candidate <= 0.36; candidate += 0.002)
    if (score(candidate) <= TOP_SCORE)
      scorePoints.push([near(candidate), scoreY(score(candidate))]);
  const scoreCurve = polyline(scorePoints, { stroke: 'ink', width: 5 });
  const cutoff = line([FIELD.left, scoreY(CUTOFF)], [FIELD.right, scoreY(CUTOFF)], {
    stroke: COLOR.mark,
    width: 3,
  });
  const cutoffName = beside(
    mono('1.96', { size: 30, color: COLOR.mark }),
    [FIELD.left, scoreY(CUTOFF)],
    'above',
    'tight',
    'left',
  );
  const forecastScore = dot(11, COLOR.mark).at(near(THRESHOLD), scoreY(score(THRESHOLD)));
  const forecast = line([near(THRESHOLD), scorePlot.top], [near(THRESHOLD), axis.y], {
    stroke: COLOR.mark,
    width: 6,
  });
  const forecastStem = line(
    [near(THRESHOLD), scoreY(score(THRESHOLD))],
    [near(THRESHOLD), axis.y],
    { stroke: COLOR.mark, width: 6 },
  );
  const forecastName = beside(
    label('forecast 20%', { color: COLOR.mark }),
    [near(THRESHOLD), axis.rowY(2)],
    'right',
    'normal',
  );
  const observed = axis.point(() => rate);
  const bar = axis.bar(() => interval);
  const fits = beside(
    label('compatible', { color: COLOR.accepted }),
    [near(interval.high), axis.rowY(0)],
    'right',
    'normal',
  );
  const gapY = (axis.rowY(0) + axis.y) / 2 + 6;
  const gap = arrow([near(rate), gapY], [near(THRESHOLD), gapY], {
    stroke: COLOR.mark,
    width: 4,
    both: true,
    tip: 14,
  });

  const title = heading(c.title);
  const calibrationTitle = heading('Compare a held-out forecast');

  // The first picture: five labels, and the curve of their fit over the axis.
  s.add(title, tray, fewName, liveOver, stroke, liveUnder, plot, fitName);
  c.take(axis.standing);
  c.keep([axis.rule, axis.title]);
  // The curve of five labels is wide, so the axis shows all rates.
  c.at(0, () => s.play(axis.max.to(1, { duration: 0.9 })));

  c.on('prior', () => s.play(hump.to(1, { duration: 0.6 })));
  c.show('prior', [priorName, terms]);
  // The white curve is the labels and the prior together: it leaves the blue curve.
  c.show('posterior', posteriorName);
  c.on('peak', () => s.play(indicate(posteriorName, { scale: 1, color: COLOR.mark })));
  c.hide('prior-terms', terms.nodes[2]);
  c.on(
    'prior-terms',
    () => {
      const pieces = terms.nodes.slice(0, 2);
      const targets = [plusOne, plusTwo];
      const edge = Math.max(boxOf(plusOne).right, boxOf(plusTwo).right) + 48;
      s.play(
        ...pieces.map((piece, index) =>
          to(piece, (node) => node.moveTo([edge + index * 48, piece.get('y')]), { duration: 0.4 }),
        ),
      );
      s.play(
        ...pieces.map((piece, index) =>
          to(piece, (node) => node.moveTo([edge + index * 48, targets[index].get('y')]), {
            duration: 0.6,
          }),
        ),
      );
      s.play(to(pieces[1], (node) => node.moveTo([edge, plusTwo.get('y')]), { duration: 0.4 }));
    },
    0.4,
  );
  c.show('prior-terms', [plusOne, plusTwo], { after: true });
  c.after('two-sevenths', () => {
    prior.set(1);
    marked.set(1);
    s.play(solved.to(1, { duration: 0.3 }));
  });
  c.show('two-sevenths', [result, modeName], { after: true });
  c.on('outlined', () =>
    s.play(...terms.nodes.slice(0, 2).map((node) => indicate(node, { scale: 1 }))),
  );

  // The full 100 labels: the same two terms beside far more evidence.
  c.hide('prior-data', [result, modeName, priorName, fitName, posteriorName]);
  c.swap('prior-data', fewName, fullName);
  c.on('prior-data', () => {
    solved.set(0);
    marked.set(0);
    s.play(
      labels.to(all, { duration: 2.4, ease: linear }),
      axis.max.to(0.4, { duration: 2.4 }),
      hump.to(0, { duration: 0.6 }),
    );
  });
  c.on('same-terms', () =>
    s.play(...terms.nodes.slice(0, 2).map((node) => indicate(node, { scale: 1 }))),
  );
  c.show('mle', mleName, { after: true });
  c.after('map', () => {
    marked.set(1);
    s.play(solved.to(1, { duration: 0.3 }));
  });
  c.show('map', mapName, { after: true });
  c.show('less-influence', shifts);

  // Calibration: a forecast against the interval of its bucket.
  c.swap('calibration', title, calibrationTitle);
  c.hide('calibration', [
    ...mleName,
    ...mapName,
    shifts,
    ...terms.nodes.slice(0, 2),
    plusOne,
    plusTwo,
    liveOver,
    liveUnder,
    stroke,
  ]);
  c.on('calibration', () => {
    heldOut.set(1);
    s.play(curves.to(0, { duration: 0.5 }), axis.staffing.to(0, { duration: 0.25 }));
  });
  c.swap('calibration', fullName, bucketName);
  c.show('bucket', [forecast, forecastName]);
  c.after('yields', () => revealed.set(HELDOUT_COUNT));
  c.show('yields', [observed, heldFraction], { after: true });
  c.hide('compatible', forecast, { after: true });
  c.show('compatible', [bar, draw(scoreCurve), cutoff, cutoffName, forecastScore, forecastStem], {
    after: true,
  });
  c.show('compatible', fits, { after: true });
  c.show('smaller-gap', gap, { after: true });
}
