// Scene `boundary`: ten clean labels, and what an interval promises.
//
// The picture: ten blue labels in the tray, and their fraction at 0% on the axis. The Wald bar is a
// red mark with no width. The Wilson bar grows from 0% to 28%. The axis zooms out to 100%, the ten
// labels turn pink, and the mirror bar grows at the other end. Then the axis zooms back, the tray
// holds samples of 100 again, and 24 intervals stack up against the true rate: green covers, red
// misses.
import assert from 'node:assert/strict';
import {
  beside,
  circle,
  column,
  dot,
  dynamic,
  fade,
  indicate,
  lerp,
  line,
  linear,
  place,
  polyline,
  rect,
  tex,
  text,
} from 'vizmatic/stage';
import { coverageBatches, coverageIntervals } from '../../../films/estimation/fixtures.mjs';
import { binomialMass, wilson } from '../../../films/estimation/model.mjs';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  FIELD,
  HEAD,
  HEAD_RIGHT,
  LEFT_PANEL,
  PANELS,
  POINT,
  READOUT,
  RIGHT_PANEL,
  TRAY_GRID,
  TRAY_HEAD,
  labelOf,
  mark,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The labels of the two boundary cases. */
const TEN = 10;
/** The true rate of the simulation. */
const RATE = 0.16;
/** The normal cutoff for the two-sided 95% score interval. */
const SCORE_Z = 1.96;

export default function boundary(s, c) {
  const axis = rateAxis(s);
  const none = wilson(0, TEN, SCORE_Z),
    all = wilson(TEN, TEN, SCORE_Z);
  assert(Math.abs(none.high - SCORE_Z ** 2 / (TEN + SCORE_Z ** 2)) < 1e-12);
  // The x of a rate when the axis ends at 100%, for the names of the mirror case.
  const wide = (rate) => FIELD.left + rate * FIELD.width;

  // The values of the scene.
  const grown = s.value(0); // the Wilson bar of the zero case grows from 0%
  const positives = s.value(0); // how many of the ten labels are specialist cases
  const mirror = s.value(0); // the Wilson bar of the all case grows from 100%
  const collapsed = s.value(0); // the red Wald marks are on screen
  const cases = s.value(1); // the two boundary cases are on screen
  const simulation = s.value(0); // from the tray of ten to the tray of a sample of 100
  const built = s.value(0); // the intervals of the simulation that are built
  const fractions = s.value(0); // the sample fractions of the simulation light up

  // The tray: ten large labels, and then one sample of 100 of the simulation.
  const ten = slots(TEN, 5, TRAY_GRID.inset('normal', 'loose')),
    tenRadius = radiusOf(5, TRAY_GRID.inset('normal', 'loose'));
  const hundred = slots(100, 10);
  const positiveCount = () => Math.max(0, Math.min(TEN, Math.floor(positives.value + 1e-6)));
  const tray = dynamic(() => {
    const marks = [];
    if (simulation.value < 1)
      ten.forEach((at, index) =>
        marks.push(
          mark(
            index < positiveCount() ? 'specialist' : 'regular',
            tenRadius,
            1 - simulation.value,
          ).at(at),
        ),
      );
    if (simulation.value > 0) {
      const batch = coverageBatches[Math.min(coverageBatches.length - 1, Math.floor(built.value))];
      batch.forEach((row, index) =>
        marks.push(mark(labelOf(row), radiusOf(10), simulation.value).at(hundred[index])),
      );
    }
    return marks;
  });
  const tenName = place(label('10 messages', { color: COLOR.sample }), TRAY_HEAD);
  const hundredName = place(label('one sample: 100', { color: COLOR.sample }), TRAY_HEAD);

  // The count under the tray: the specialist cases of the ten, and then the intervals that cover.
  const over = mono('00', { size: 64 }),
    under = mono('00', { size: 64 });
  const stroke = rect(150, 5, { fill: 'ink', stroke: null, radius: 2 });
  const covers = note('cover the true rate');
  place(column([over, stroke, under, covers], { gap: 'tight', align: 'center' }), READOUT, 'top');
  const live = (slot, read, color) =>
    dynamic(() =>
      text(String(read()), { font: 'mono', size: 64, color: color() }).at(
        slot.get('x'),
        slot.get('y'),
      ),
    );
  const done = () => Math.min(coverageIntervals.length, Math.floor(built.value));
  const covering = () => coverageIntervals.slice(0, done()).filter((entry) => entry.covers).length;
  const inSimulation = () => simulation.value >= 0.5;
  const count = [
    live(
      over,
      () => (inSimulation() ? covering() : positiveCount()),
      () => (inSimulation() ? COLOR.accepted : COLOR.specialist),
    ),
    stroke,
    live(
      under,
      () => (inSimulation() ? done() : TEN),
      () => (inSimulation() ? 'ink' : COLOR.sample),
    ),
  ];

  // The two boundary cases on the axis: the fraction, the Wald mark, and the Wilson bar.
  const bars = dynamic(() => {
    if (cases.value < 0.02) return [];
    const opacity = cases.value,
      at = axis.rowY(0),
      marks = [];
    const bar = (low, high, visibility = 1) => {
      marks.push(
        line([axis.x(low), at], [axis.x(high), at], {
          stroke: COLOR.accepted,
          width: 10,
          opacity: opacity * visibility,
        }),
      );
      for (const end of [low, high])
        marks.push(
          line([axis.x(end), at - 16], [axis.x(end), at + 16], {
            stroke: COLOR.accepted,
            width: 4,
            opacity: opacity * visibility,
          }),
        );
    };
    const wald = (rate) =>
      marks.push(
        line([axis.x(rate), axis.rowY(1) - 22], [axis.x(rate), axis.rowY(1) + 22], {
          stroke: COLOR.failure,
          width: 8,
          opacity: opacity * collapsed.value,
        }),
      );
    if (grown.value > 0) bar(0, none.high, grown.value);
    if (collapsed.value > 0) wald(0);
    marks.push(dot(POINT, COLOR.sample, { opacity }).at(axis.x(0), at));
    if (mirror.value > 0 && axis.inside(1)) {
      bar(1 - (1 - all.low) * mirror.value, 1);
      wald(1);
      marks.push(dot(POINT, COLOR.sample, { opacity }).at(axis.x(1), at));
    }
    return marks;
  });
  // How often each candidate rate gives the labels of the tray: ten clean ones, and then ten pink ones.
  const chance = (positives, opacity) => {
    const points = [];
    for (let step = 0; step <= 80; step++) {
      const rate = axis.min.value + ((axis.max.value - axis.min.value) * step) / 80;
      const value = binomialMass(TEN, rate)[positives];
      points.push([axis.x(rate), PANELS.bottom - value * PANELS.height]);
    }
    return polyline(points, {
      stroke: 'ink',
      width: 5,
      opacity,
      dash: positives === 0 ? [12, 8] : [],
    });
  };
  const chances = dynamic(() => {
    if (cases.value < 0.02) return [];
    const marks = [chance(0, cases.value * (1 - 0.75 * mirror.value))];
    if (mirror.value > 0) marks.push(chance(TEN, cases.value * mirror.value));
    return marks;
  });
  const chanceMeaning = place(
    column(
      [note('curve height: chance of'), note('these ten outcomes at'), note('each candidate rate')],
      { gap: 'tight', align: 'center' },
    ),
    RIGHT_PANEL.inset('normal', 'normal'),
    'top',
  );
  const chanceName = beside(note('0 of 10'), [wide(0), PANELS.top], 'right', 'wide');
  const mirrorChanceName = beside(note('10 of 10'), [wide(1), PANELS.top], 'left', 'wide');
  const pinned = beside(
    label('pinned at 0%?', { color: COLOR.mark }),
    [axis.x(0), axis.rowY(0)],
    'right',
    'wide',
  );
  const waldName = beside(
    label('Wald', { color: COLOR.failure }),
    [axis.x(0), axis.rowY(1)],
    'right',
    'normal',
  );
  const formula = place(
    tex('1.96\\sqrt{\\tfrac{0\\,\\times\\,1}{10}} = 0', { size: 64, color: COLOR.failure }),
    RIGHT_PANEL,
  );
  const upperFormula = place(
    column(
      [
        note('zero positives, n independent labels'),
        tex(`p_{\\mathrm{upper}} = \\frac{${SCORE_Z}^2}{n + ${SCORE_Z}^2}`, {
          size: 52,
          color: COLOR.accepted,
        }),
        note('two-sided 95% Wilson'),
      ],
      { gap: 'normal', align: 'center' },
    ),
    RIGHT_PANEL,
  );
  const wilsonName = beside(
    label('Wilson', { color: COLOR.accepted }),
    [axis.x(none.high), axis.rowY(0)],
    'right',
    'normal',
  );
  // The number of the upper end follows the end of the bar through the zoom.
  const upperPlace = beside(
    mono('28%', { color: COLOR.accepted }),
    [axis.x(none.high), axis.rowY(0)],
    'above',
    'normal',
  );
  const upper = dynamic(() =>
    text('28%', { font: 'mono', size: 40, color: COLOR.accepted }).at(
      axis.x(none.high),
      upperPlace.get('y'),
    ),
  );
  // The names of the two cases when the axis shows all rates.
  const caseNames = [
    beside(label('0 of 10'), [wide(none.high / 2), axis.rowY(0)], 'above', 'normal'),
    beside(label('10 of 10'), [wide((1 + all.low) / 2), axis.rowY(0)], 'above', 'normal'),
  ];
  const mirrorRows = [
    label('Wald', { color: COLOR.failure }).at(wide(0.6), axis.rowY(1)),
    label('Wilson', { color: COLOR.accepted }).at(wide(0.6), axis.rowY(0)),
  ];
  const mirrorLine = line([wide(0.5), axis.rowY(2)], [wide(0.5), axis.y], {
    stroke: 'dim',
    width: 3,
    dash: [6, 10],
  });
  const ends = [0, 1].map((rate) =>
    circle(POINT + 8, { stroke: COLOR.mark, width: 4, fill: null }).at(wide(rate), axis.rowY(0)),
  );

  // The simulation: one interval for each sample of 100, from the axis up.
  const rowAt = (index) => axis.y - 30 - index * 24;
  const stack = dynamic(() => {
    const marks = [];
    coverageIntervals.slice(0, Math.ceil(built.value)).forEach((entry, index) => {
      const color = entry.covers ? COLOR.accepted : COLOR.failure,
        at = rowAt(index),
        opacity = Math.min(1, built.value - index);
      marks.push(
        line([axis.x(entry.interval.low), at], [axis.x(entry.interval.high), at], {
          stroke: color,
          width: 7,
          opacity,
        }),
      );
      marks.push(
        dot(lerp(6, 9, fractions.value), fractions.value > 0.5 ? COLOR.mark : COLOR.sample, {
          opacity,
        }).at(axis.x(entry.k / entry.n), at),
      );
    });
    return marks;
  });
  const truth = axis.upright(() => RATE);
  const truthName = beside(
    label('true rate 16%', { color: COLOR.specialist }),
    [axis.x(RATE), HEAD.cy],
    'left',
    'tight',
  );
  const target = place(label('target: about 95%', { color: COLOR.accepted }), HEAD_RIGHT, 'right');
  const landed = coverageIntervals.map((entry) => entry.k / entry.n);
  const top = rowAt(coverageIntervals.length - 1) - 40;
  const range = line([axis.x(Math.min(...landed)), top], [axis.x(Math.max(...landed)), top], {
    stroke: COLOR.mark,
    width: 5,
  });
  const rangeName = beside(
    note('where the sample fractions landed', { color: COLOR.mark }),
    [axis.x(Math.max(...landed)), top],
    'right',
    'normal',
  );

  // The first picture: ten blue labels, and their fraction at 0%.
  s.add(heading(c.title), tray, tenName, ...count, bars, stack);
  c.take(axis.standing);
  c.keep(axis.standing);

  c.show('pinned', pinned);
  c.hide('zero-wald', pinned);
  c.after('zero-wald', () => s.play(collapsed.to(1, { duration: 0.4 })));
  c.show('zero-wald', [waldName, formula], { after: true });
  c.after('upper-endpoint', () => s.play(grown.to(1, { duration: 1.4 })));
  c.show('zero-wilson', [chances, chanceName, chanceMeaning]);
  c.show('upper-endpoint', wilsonName, { after: true });
  c.show('upper-endpoint', upper, { after: true });
  c.hide('zero-upper-rule', chanceMeaning);
  c.swap('zero-upper-rule', formula, upperFormula, { after: true });

  // The mirror case: the axis shows all rates, and the ten labels turn pink.
  c.hide('all-wilson', [wilsonName, waldName, upper, chanceName]);
  c.hide('all-wilson', upperFormula, { after: true, lead: 0.5 });
  c.on('all-wilson', () => {
    cases.set(0);
    s.play(axis.max.to(1, { duration: 1.2 }));
    s.play(positives.to(TEN, { duration: 1, ease: linear }), mirror.to(1, { duration: 1.2 }));
  });
  c.after('all-wilson', () => {
    positives.set(TEN);
    mirror.set(1);
    s.play(cases.to(1, { duration: 0.3 }));
  });
  c.show('all-wilson', [mirrorLine, ...caseNames, chanceName, upper, mirrorChanceName, chanceMeaning, ...mirrorRows], {
    after: true,
  });
  c.show('boundary-point', ends);

  // The simulation: the axis comes back, and each sample of 100 gives one interval.
  c.hide('repeat', [
    mirrorLine,
    ...caseNames,
    ...ends,
    upper,
    chanceName,
    mirrorChanceName,
    chanceMeaning,
    ...mirrorRows,
  ]);
  c.on('repeat', () => {
    s.play(cases.to(0, { duration: 0.4 }));
    s.play(axis.max.to(0.4, { duration: 1 }), simulation.to(1, { duration: 0.8 }));
  });
  c.swap('repeat', tenName, hundredName);
  c.hide('repeat', count);
  c.show('true-rate', [truth, truthName]);
  const build = c.cue('coverage-build');
  c.on('coverage-build', () =>
    s.play(built.to(coverageIntervals.length, { duration: build.end - build.start, ease: linear })),
  );
  c.show('coverage-build', [...count, covers]);
  c.show('coverage-target', target, { after: true });
  c.on('population-rate', () => s.play(indicate(truthName, { color: COLOR.mark })));
  c.on('prediction', () => s.play(fractions.to(1, { duration: 0.5 })));
  c.show('prediction', [range, rangeName]);
}
