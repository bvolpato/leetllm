import { area, heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import {
  table,
  place,
  row,
  column,
  arrayCells,
  numberLine,
  barChart,
  axes,
  dynamic,
  group,
  rect,
  line,
  dot,
  arrow,
  draw,
  indicate,
  to,
  fade,
  morph,
  assertEqual,
  polyline,
} from 'vizmatic/stage';
import {
  robustUnit,
  cosine,
  scalarEncode,
  dot as inner,
  l2,
} from '../../../films/embedding-geometry/arithmetic.mjs';

import { calibrationResult, calibrationRanking } from '../../../films/embedding-geometry/model.mjs';
export default function calibration(s, c) {
  const bound = s.value(25),
    directionStage = s.value(0),
    outlier = s.value(25);
  const [upper, lower] = area.rows([5, 3], 'wide');
  const [left, right] = upper.columns(2, 'loose');
  const make = (r) =>
    place(
      axes({
        x: [-1, 1],
        y: [-1, 1],
        width: r.width - 140,
        height: r.height - 130,
        xStep: 1,
        yStep: 1,
        labelSize: 34,
        grid: true,
        tips: false,
      }),
      r,
    );
  const wide = make(left),
    fine = make(right);
  const points = (b) =>
    calibrationResult(b).input.flatMap((x, i, a) =>
      i
        ? [
            [x, calibrationResult(b).output[i - 1]],
            [x, calibrationResult(b).output[i]],
          ]
        : [[x, calibrationResult(b).output[i]]],
    );
  const baseline = polyline(
    points(25).map((v) => wide.world(...v)),
    { stroke: 'blue', width: 5 },
  );
  const stair = dynamic(() =>
    polyline(
      points(bound.value).map((v) => fine.world(...v)),
      { stroke: 'green', width: 5 },
    ),
  );
  const [errors, rankArea] = lower.columns(2, 'loose');
  const tab = place(
    table(
      ['bound', 'ordinary MAE', { key: 'outlier error', marks: true, sample: 24 }],
      [
        { id: 'wide', bound: 25, 'ordinary MAE': null, 'outlier error': 0 },
        { id: 'fine', bound: 1, 'ordinary MAE': null, 'outlier error': null },
      ],
      { size: 34, width: errors.width },
    ),
    errors,
  );
  const rank = place(
    table(
      ['codec', { key: 'winner', sample: 'second' }],
      [
        { id: 'full', codec: 'full precision', winner: null },
        { id: 'coarse', codec: 'wide bound', winner: null },
        { id: 'fine', codec: 'fine bound', winner: null },
      ],
      { size: 34, width: rankArea.width },
    ),
    rankArea,
  );
  const wideTitle = place(note('bound 25: reconstructed value'), left, 'top');
  const fineTitle = dynamic(() =>
    note('bound ' + bound.value.toFixed(0) + ': reconstructed value').moveTo(right.point('top')),
  );
  const inputs = [left, right].map((r) => place(note('input value x'), r, 'bottom'));
  const [clipTitleArea, clipRulerArea] = left.rows([1, 3], 'wide');
  const clipTitle = place(
    column([label('outlier at 25', { color: 'red' }), note('bound 1 saturates at its endpoint')], {
      gap: 'normal',
    }),
    clipTitleArea,
  );
  const clipRuler = place(
    numberLine({
      range: [0, 25],
      length: clipRulerArea.width - 130,
      ticks: [1, 25],
      points: [{ name: 'value', value: 25 }],
      labelSize: 34,
      size: 36,
    }),
    clipRulerArea,
  );
  const ranking = calibrationRanking();
  const directionParts = right.columns([1, 1], 'wide');
  const directionNames = place(
    column(
      [
        label('endpoints', { size: 36 }),
        note('enlarged view'),
        label('first [1, .05]', { color: 'green', size: 34 }),
        label('second [1, .04]', { color: 'pink', size: 34 }),
        note('q = [1, 0]'),
      ],
      { gap: 'normal' },
    ),
    directionParts[0],
  );
  const detail = place(
    axes({
      x: [0.94, 1.02],
      y: [-0.01, 0.07],
      width: 320,
      height: 320,
      xStep: 0.04,
      yStep: 0.04,
      grid: false,
      tips: false,
      labelSize: 34,
    }),
    directionParts[1],
  );
  const directions = dynamic(() => {
    const stage = directionStage.value;
    const start = stage <= 1 ? ranking.original : ranking.coarse;
    const end = stage <= 1 ? ranking.coarse : ranking.fine;
    const mix = stage <= 1 ? stage : stage - 1;
    const rows = start.map((v, i) => v.map((x, j) => x + (end[i][j] - x) * mix));
    return group(
      arrow(detail.world(0.94, 0), detail.world(1, 0), { stroke: 'cyan', width: 3, tip: 10 }),
      ...rows.flatMap((v, i) => [
        line(detail.world(0.94, (0.94 * v[1]) / v[0]), detail.world(...v), {
          stroke: ['green', 'pink'][i],
          width: i ? 4 : 8,
        }),
        dot(i ? 6 : 11, ['green', 'pink'][i]).moveTo(detail.world(...v)),
      ]),
    );
  });
  s.add(heading(c.title), wide, fine, baseline, stair, tab, rank, wideTitle, fineTitle, inputs);
  c.swap('outlier', [wide, baseline, wideTitle, inputs[0]], [clipTitle, clipRuler]);
  c.on('outlier', () => s.play(clipRuler.move('value', 1, { duration: 1.5 })), 0.4);
  c.swap('directions', [fine, stair, fineTitle, inputs[1]], [directionNames, detail, directions]);
  c.on('coarse', () => s.play(directionStage.to(1, { duration: 1.2 })));
  c.on('precise', () => s.play(directionStage.to(2, { duration: 1.2 })));
  c.on('wide', () => s.play(tab.light('wide')));
  c.on('fine', () => s.play(bound.to(1, { duration: 3 })));
  c.after('errors', () =>
    s.play(
      tab.setCell('wide', 'ordinary MAE', { value: calibrationResult(25).mae.toFixed(4) }),
      tab.setCell('fine', 'ordinary MAE', { value: calibrationResult(1).mae.toFixed(4) }),
      { duration: 0.6 },
    ),
  );
  c.after('clip', () =>
    s.play(
      tab.setCell('fine', 'outlier error', {
        value: 25 - calibrationResult(1).outlier,
        state: 'fail',
      }),
      { duration: 0.5 },
    ),
  );
  const f = calibrationRanking();
  c.after('original', () =>
    s.play(rank.setCell('full', 'winner', { value: ['first', 'second'][f.originalWinner] }), {
      duration: 0.5,
    }),
  );
  c.after('coarse', () =>
    s.play(rank.setCell('coarse', 'winner', { value: ['first', 'second'][f.coarseWinner] }), {
      duration: 0.5,
    }),
  );
  c.after('precise', () =>
    s.play(rank.setCell('fine', 'winner', { value: ['first', 'second'][f.fineWinner] }), {
      duration: 0.5,
    }),
  );
}
