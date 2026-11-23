// Scene `score-interval`: the Wilson interval is the set of candidate rates that pass a test.
//
// The picture: the tray with 16 of 100, and the estimate on the axis. The Wald bar grows around the
// estimate. Then a candidate rate slides along the axis. It carries its own bracket, 1.96 of its own
// standard errors to each side, and it traces its score over the axis. While the bracket covers the
// estimate, the score is under the yellow cutoff, and the candidate stays green on the axis. The
// green rates are the Wilson interval, and it crosses the staffing line.
import {
  beside,
  circle,
  column,
  dot,
  dynamic,
  group,
  line,
  linear,
  place,
  polyline,
  rect,
  row,
  text,
} from 'vizmatic/stage';
import { scoreStatistic, wilson } from '../../../films/estimation/model.mjs';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  FIELD,
  HEAD_LEFT,
  HEAD_RIGHT,
  PANELS,
  POINT,
  READOUT,
  SAMPLE,
  THRESHOLD,
  TRAY_HEAD,
  labelOf,
  mark,
  radiusOf,
  rateAxis,
  slots,
} from '../parts.mjs';

/** The cutoff of the score for a 95% interval. */
const CUTOFF = 1.96;
/** The highest score that the plot shows. */
const TOP_SCORE = 5;
/** The candidate rates of the sweep, from its start to its end. */
const SWEEP = [0.04, 0.36];

export default function scoreInterval(s, c) {
  const labels = SAMPLE.length,
    specialists = SAMPLE.filter((message) => message.specialist).length,
    rate = specialists / labels;
  const interval = wilson(specialists, labels);
  const error = Math.sqrt((rate * (1 - rate)) / labels);
  const axis = rateAxis(s);
  const score = (candidate) => scoreStatistic(specialists, labels, candidate);
  // The plot of the score: its zero is over the rows of the axis, and its top is the top of the field.
  const plot = PANELS.inset('none', 'normal');
  const scoreY = (value) => plot.bottom - (Math.min(value, TOP_SCORE) / TOP_SCORE) * plot.height;

  // The values of the scene.
  const reach = s.value(1); // the half width of the blue bar, in standard errors
  const waldLook = s.value(1); // the Wald bar goes quiet when the candidate arrives
  const candidate = s.value(SWEEP[0]);
  const currentCandidate = () => Math.round(candidate.value * 100) / 100;
  const sweeping = s.value(0); // 1 while the candidate is on the axis
  const lift = s.value(0); // the green rates rise from the axis to the row of the estimate
  const answerReady = s.value(0);
  const comparisonReady = s.value(0);

  // The tray: the 100 reviewed messages of the lesson.
  const places = slots(labels, 10);
  const tray = group(
    ...SAMPLE.map((message, index) => mark(labelOf(message), radiusOf(10)).at(places[index])),
  );
  const trayName = place(label('100 messages', { color: COLOR.sample }), TRAY_HEAD);
  const fraction = place(
    column(
      [
        mono(String(specialists), { size: 64, color: COLOR.specialist }),
        rect(150, 5, { fill: 'ink', stroke: null, radius: 2 }),
        mono(String(labels), { size: 64, color: COLOR.sample }),
      ],
      { gap: 'tight', align: 'center' },
    ),
    READOUT,
    'top',
  );

  // The estimate, and the Wald bar over it.
  const estimate = axis.point(() => rate, { stem: true });
  const estimateName = beside(
    mono('16%', { color: COLOR.sample }),
    [axis.x(rate), axis.rowY(0)],
    'above',
    'wide',
  );
  const wald = dynamic(() => {
    const half = reach.value * error,
      at = axis.rowY(2);
    const style = { stroke: COLOR.sample, opacity: waldLook.value };
    return [
      line([axis.x(rate - half), at], [axis.x(rate + half), at], { ...style, width: 10 }),
      ...[-half, half].map((side) =>
        line([axis.x(rate + side), at - 16], [axis.x(rate + side), at + 16], {
          ...style,
          width: 4,
        }),
      ),
    ];
  });
  const errorName = beside(
    note('one standard error: about 4 points'),
    [axis.x(rate + CUTOFF * error), axis.rowY(2)],
    'right',
    'normal',
  );
  const waldName = beside(
    label('Wald', { color: COLOR.sample }),
    [axis.x(rate - CUTOFF * error), axis.rowY(2)],
    'left',
    'normal',
  );
  const observed = circle(POINT + 6, { stroke: COLOR.mark, width: 4, fill: null }).at(
    axis.x(rate),
    axis.rowY(0),
  );

  // The plot of the score, with its cutoff.
  const cutoff = line([FIELD.left, scoreY(CUTOFF)], [FIELD.right, scoreY(CUTOFF)], {
    stroke: COLOR.mark,
    width: 3,
  });
  const floor = line([FIELD.left, scoreY(0)], [FIELD.right, scoreY(0)], {
    stroke: 'grid',
    width: 3,
  });
  // The number of the cutoff is left of the first candidate, so the sweep does not cross it.
  const cutoffName = beside(
    mono('1.96', { size: 30, color: COLOR.mark }),
    [FIELD.left, scoreY(CUTOFF)],
    'above',
    'tight',
    'left',
  );
  const scoreName = place(note('score of the candidate'), plot, 'top right');

  // The candidate: its dot on the axis, its own bracket, the score that it traces, and the rates that stay.
  const sweep = dynamic(() => {
    const now = currentCandidate(),
      marks = [];
    // The trace of the score, from the start of the sweep to the candidate.
    const trace = [];
    for (let at = SWEEP[0]; at <= SWEEP[1]; at += 0.002)
      if (score(at) <= TOP_SCORE) trace.push([axis.x(at), scoreY(score(at))]);
    if (answerReady.value > 0.5 && trace.length > 1)
      marks.push(polyline(trace, { stroke: 'ink', width: 5 }));
    // The rates that pass: green on the axis, and then on the row of the estimate.
    const kept = interval.high;
    if (answerReady.value > 0.5) {
      const at = axis.y + (axis.rowY(0) - axis.y) * lift.value;
      marks.push(
        line([axis.x(interval.low), at], [axis.x(kept), at], {
          stroke: COLOR.accepted,
          width: 10,
        }),
      );
      for (const end of lift.value > 0 ? [interval.low, interval.high] : [])
        marks.push(
          line([axis.x(end), at - 16], [axis.x(end), at + 16], {
            stroke: COLOR.accepted,
            width: 4,
            opacity: lift.value,
          }),
        );
    }
    if (sweeping.value < 0.02) return marks;
    const opacity = sweeping.value;
    const passes = score(now) <= CUTOFF;
    const color = passes ? COLOR.accepted : COLOR.mark;
    if (comparisonReady.value < 0.5) {
      marks.push(dot(12, COLOR.sample, { opacity }).at(axis.x(now), axis.y));
      return marks;
    }
    // The bracket of the candidate: 1.96 of its own standard errors to each side.
    const half = CUTOFF * Math.sqrt((now * (1 - now)) / labels),
      at = axis.rowY(0);
    const from = Math.max(axis.x(now - half), FIELD.left),
      to = Math.min(axis.x(now + half), FIELD.right);
    marks.push(line([from, at], [to, at], { stroke: color, width: 5, opacity }));
    for (const end of [now - half, now + half])
      if (axis.inside(end))
        marks.push(line([axis.x(end), at - 12], [axis.x(end), at + 12], { stroke: color, width: 4, opacity }));
    // The candidate on the axis, and the line from the floor of the plot up to its score.
    if (score(now) <= TOP_SCORE) {
      marks.push(
        line([axis.x(now), scoreY(0)], [axis.x(now), scoreY(score(now))], {
          stroke: color,
          width: 2,
          opacity: 0.6 * opacity,
        }),
        dot(9, color, { opacity }).at(axis.x(now), scoreY(score(now))),
      );
    }
    marks.push(dot(12, color, { opacity }).at(axis.x(now), axis.y));
    return marks;
  });
  // The readout of the candidate, in two places that do not move.
  const slotsOf = { rate: mono('00%'), score: mono('0.00') };
  const readout = place(
    row([note('candidate'), slotsOf.rate, note('score'), slotsOf.score], { gap: 'tight' }),
    HEAD_RIGHT,
    'right',
  );
  const live = (slot, read, computed = false) =>
    dynamic(() =>
      sweeping.value < 0.02 || (computed && comparisonReady.value < 0.5)
        ? []
        : text(read(), {
            font: 'mono',
            size: 40,
            color: comparisonReady.value < 0.5
              ? COLOR.sample
              : score(currentCandidate()) <= CUTOFF ? COLOR.accepted : COLOR.mark,
          })
            .at(slot.get('x'), slot.get('y'))
            .opacity(sweeping.value),
    );
  const liveRate = live(slotsOf.rate, () => `${Math.round(currentCandidate() * 100)}%`.padStart(3)),
    liveScore = live(slotsOf.score, () => score(currentCandidate()).toFixed(2), true);
  const readoutNames = readout.nodes.filter((node) => !Object.values(slotsOf).includes(node));

  // The first picture: the tray, the estimate, and the axis with the staffing line.
  s.add(heading(c.title), tray, trayName, fraction, estimate, estimateName, sweep);
  c.take(axis.standing);
  c.keep(axis.standing);

  // The Wald bar: one standard error, and then nearly two.
  c.show('standard-error', wald, { after: true });
  c.show('standard-error', errorName, { after: true });
  c.hide('wald-range', errorName);
  c.after('wald-range', () => reach.set(CUTOFF));
  c.show('wald-range', waldName, { after: true });
  c.show('observed-fraction', observed);

  // Wilson: a candidate slides, and the plot of its score opens.
  c.hide('wilson-asks', observed);
  c.on('wilson-asks', () => s.play(waldLook.to(0.45, { duration: 0.5 })));
  c.show('wilson-asks', [floor, cutoff, cutoffName, scoreName]);
  c.on('candidate-sweep', () => s.play(sweeping.to(1, { duration: 0.3 })));
  c.show('candidate-sweep', [readoutNames[0], liveRate]);
  c.after('own-scale', () => {
    comparisonReady.set(1);
    const available = c.cue('score-project').start - c.cue('own-scale').end - 0.35;
    const hold = Math.min(0.8, available / 4);
    const travel = available - hold;
    s.play(candidate.to(rate, { duration: travel * 0.35, ease: linear }));
    s.wait(hold);
    s.play(candidate.to(SWEEP[1], { duration: travel * 0.65, ease: linear }));
  });
  c.show('own-scale', [readoutNames[1], liveScore], { after: true });
  const own = place(
    note('bracket: 1.96 of its own standard errors', { color: COLOR.mark }),
    HEAD_LEFT,
    'left',
  );
  c.show('own-scale', own, { after: true });
  const kept = place(
    note('under the cutoff: the rate stays', { color: COLOR.accepted }),
    HEAD_LEFT,
    'left',
  );
  c.swap('keep-below', own, kept, { after: true });

  // The two crossings come down: the rates between them are the Wilson interval.
  const drops = [interval.low, interval.high].map((end) =>
    line([axis.x(end), scoreY(CUTOFF)], [axis.x(end), axis.rowY(0)], {
      stroke: COLOR.accepted,
      width: 3,
      dash: [8, 8],
    }),
  );
  c.hide('score-project', [...readoutNames, liveRate, liveScore]);
  c.hide('score-endpoints', kept, { after: true });
  c.on('score-project', () => s.play(sweeping.to(0, { duration: 0.4 })));
  c.show('score-endpoints', drops, { after: true });
  c.after('score-endpoints', () => {
    answerReady.set(1);
    s.play(lift.to(1, { duration: 0.8 }));
  });
  const ends = [interval.low, interval.high].map((end, index) =>
    beside(
      mono(`${Math.round(end * 100)}%`, { color: COLOR.accepted }),
      [axis.x(end), axis.rowY(0)],
      index === 0 ? 'left' : 'right',
      'normal',
    ),
  );
  c.show('score-endpoints', ends, { after: true });
  const wilsonName = beside(label('Wilson', { color: COLOR.accepted }), ends[1], 'right', 'normal');
  c.show('wilson-name', wilsonName);
  const crossing = circle(POINT + 8, { stroke: COLOR.mark, width: 4, fill: null }).at(
    axis.x(THRESHOLD),
    axis.rowY(0),
  );
  c.show('either-side', crossing, { after: true });
  const sides = [
    place(note('regular team'), HEAD_LEFT, 'right'),
    place(note('extra shift'), HEAD_RIGHT, 'left'),
  ];
  c.show('either-side', sides, { after: true });
}
