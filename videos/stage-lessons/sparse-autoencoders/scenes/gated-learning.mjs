// Scene `gated-learning`: detection and magnitude are two lanes, and a threshold makes a jump.
//
// The picture: the rebuilt example, with a lane of gates over the strip of magnitudes. The L1
// penalty presses on the gate lane: its levels fall, the lamps stay on, and the magnitude bar and
// the pink arrow keep their length. Then JumpReLU: one pre-activation slides across a threshold,
// and the pink arrow is absent or has its full length, with no size between.
import {
  assertEqual,
  axes,
  circle,
  column,
  dot,
  dynamic,
  fitted,
  indicate,
  line,
  place,
  polyline,
  rect,
  tex,
  text,
} from 'vizmatic/stage';
import { encoderFixture } from '../../../films/sparse-autoencoders/model.mjs';
import { chipRow, heading, label, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  EXAMPLE_SLOTS,
  SIDE,
  board,
  code,
  dictionary,
  rebuild,
  strip,
  target,
  vec,
} from '../parts.mjs';

/** The levels of the gate lane before the penalty: a picture of pre-activations, with no scale. */
const GATE_LEVEL = [0.9, 0.6, 0, 0, 0];
/** The scale of a gate row in the picture of the shared directions: shorter than its magnitude row. */
const GATE_ROW_SCALE = 0.6;
/** The threshold of the JumpReLU picture, and the pre-activation that the scene moves. */
const THETA = 0.5;
const jumpRelu = (u, theta) => (u > theta ? u : 0);

export default function gatedLearning(s, c) {
  const b = board();
  const encoder = encoderFixture();
  assertEqual(
    jumpRelu(code[1], THETA),
    code[1],
    'a pre-activation over the threshold keeps its full size',
  );
  const [gateBand, stripBand, lower] = SIDE.rows([2, 3.4, 4], 'tight');
  const [ruleBand, noteBand, extraBand] = lower.rows([2, 1, 1], 'tight');

  /** The pre-activation of the second feature. Its output is its full size over the threshold, and zero under it. */
  const pre = s.value(code[1]);
  const theta = s.value(0);
  const second = () => jumpRelu(pre.value, theta.value);
  const z = strip(s, stripBand, {
    max: 2,
    colors: EXAMPLE_SLOTS,
    start: code,
    read: (i) => (i === 1 ? second() : undefined),
  });
  const live = rebuild(b, () => [code[0], second()]);
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

  // The gate lane: a level and a lamp for each slot. The lamp is on while its level is over zero.
  const pressure = s.value(0);
  const level = (i) => GATE_LEVEL[i] * (1 - 0.75 * pressure.value);
  const floor = gateBand.bottom - 8;
  const gates = dynamic(() =>
    dictionary.flatMap((_, i) => {
      const height = level(i) * 110;
      const lamp = circle(
        18,
        level(i) > 0
          ? { fill: COLOR.activation, stroke: null }
          : { fill: null, stroke: 'faint', width: 3 },
      ).at(z.x(i) + z.barWidth * 0.5, floor - 22);
      if (height < 1) return [lamp];
      return [
        rect(z.barWidth * 0.5, height, {
          fill: COLOR.mark,
          stroke: null,
          radius: 5,
          opacity: 0.55,
        }).at(z.x(i) - z.barWidth * 0.2, floor - height / 2),
        lamp,
      ];
    }),
  );
  const gateRail = line([gateBand.left, floor], [gateBand.right, floor], {
    stroke: 'faint',
    width: 3,
  });
  const gateName = place(
    note('rectified gate pre-activation', { color: COLOR.mark }),
    gateBand,
    'top left',
  );
  const binaryName = place(note('dots: binary gate'), gateBand, 'top right');
  const magnitudeName = place(note('magnitude'), stripBand, 'top right');
  c.show('gated-learning-b0', [gateRail, gates, gateName, binaryName]);
  const product = place(tex('z = \\text{gate} \\times \\text{magnitude}', { size: 46 }), ruleBand);
  c.show('gated-magnitude', [magnitudeName, product]);

  // One direction for the two rows of a feature, with two scales.
  const rows = [0, 1].flatMap((i) => [
    b.arrowOf([0, 0], encoder.weights[i], EXAMPLE_SLOTS[i], { width: 4, dash: [14, 10] }),
    b.arrowOf([0, 0], vec.scale(encoder.weights[i], GATE_ROW_SCALE), COLOR.mark, { width: 7 }),
  ]);
  const shared = place(label('one direction, two row scales'), noteBand);
  c.show('gated-shared', [...rows, shared]);

  // The penalty presses on the gate lane only.
  const press = place(label('L1 presses on gate pre-activations', { color: COLOR.mark }), noteBand);
  c.swap('gated-l1', [...rows, shared], press);
  c.on('gated-l1', () => s.play(pressure.to(1, { duration: 2.4 })), 0.4);
  const untouched = place(note('the magnitude and the arrow keep their size'), extraBand);
  c.show('gated-l1', untouched, { lead: -0.8 });

  // The auxiliary rebuild: the gate levels alone, through the same columns, which this path does not train.
  const auxTip = (count) =>
    dictionary.slice(0, count).reduce((sum, d, i) => vec.add(sum, vec.scale(d, level(i))), [0, 0]);
  const aux = [
    b.arrowOf([0, 0], () => auxTip(1), COLOR.mark, { width: 4, dash: [10, 8] }),
    b.arrowOf(
      () => auxTip(1),
      () => auxTip(2),
      COLOR.mark,
      { width: 4, dash: [10, 8] },
    ),
    b.ringOf(() => auxTip(2), COLOR.mark, 16),
  ];
  const auxNote = place(
    label('an auxiliary rebuild trains the gates', { color: COLOR.mark, size: 36 }),
    noteBand,
  );
  const frozen = place(
    column([note('decoder output path frozen'), note('centering bias can still learn')], {
      gap: 'none',
      align: 'center',
    }),
    extraBand,
  );
  c.swap('gated-aux', [press, untouched], [...aux, auxNote]);
  // The auxiliary rebuild needs the gate levels, so it holds them up against the penalty.
  c.on('gated-aux', () => s.play(pressure.to(0.3, { duration: 1.6 })), 0.4);
  c.show('gated-aux-stop', frozen);

  // Beat 1. No direct penalty on the magnitude. Then JumpReLU: one threshold, and a jump.
  const free = place(label('no direct L1 on the magnitude'), noteBand);
  c.swap('gated-learning-b1', [...aux, auxNote, frozen], free);
  c.on('gated-learning-b1', () =>
    s.play(
      ...z.z.slice(0, 1).map(() => indicate(magnitudeName, { color: COLOR.mark, scale: 1.2 })),
    ),
  );

  const [plotBand, sideBand] = lower.columns([3, 2], 'normal');
  const graph = place(
    fitted(plotBand, (width) =>
      axes({
        x: [0, 1.5],
        y: [0, 1.5],
        xStep: 0.5,
        yStep: 0.5,
        width,
        height: plotBand.height - 120,
        labelSize: 28,
      }),
    ),
    plotBand,
    'top',
  );
  const transfer = dynamic(() => [
    line(graph.world(0, 0), graph.world(theta.value, 0), { stroke: COLOR.second, width: 6 }),
    line(graph.world(theta.value, theta.value), graph.world(1.5, 1.5), {
      stroke: COLOR.second,
      width: 6,
    }),
    line(graph.world(theta.value, 0), graph.world(theta.value, theta.value), {
      stroke: COLOR.mark,
      width: 3,
      dash: [8, 8],
    }),
    dot(12, COLOR.activation).at(...graph.world(pre.value, second())),
  ]);
  const band = s.value(0);
  const window = dynamic(() => {
    if (band.value < 0.01) return null;
    const left = graph.world(Math.max(0, theta.value - band.value / 2), 0),
      right = graph.world(theta.value + band.value / 2, 1.5);
    return rect(right[0] - left[0], left[1] - right[1], {
      fill: COLOR.mark,
      stroke: null,
      opacity: 0.2,
    }).at((left[0] + right[0]) / 2, (left[1] + right[1]) / 2);
  });
  const axisNames = [
    place(note('pre-activation'), plotBand, 'bottom right'),
    place(note('output'), sideBand, 'top left'),
  ];
  const thetaName = place(
    dynamic(() =>
      text(`θ = ${theta.value.toFixed(2)}`, { size: 40, font: 'mono', color: COLOR.mark }),
    ),
    sideBand,
  );
  const count = place(
    dynamic(() =>
      text(`active: ${1 + (second() > 0 ? 1 : 0)}`, { size: 40, color: COLOR.activation }),
    ),
    sideBand,
    'bottom',
  );
  c.swap(
    'jump-instead',
    [free, product, gateRail, gates, gateName, binaryName, magnitudeName],
    [graph, window, transfer, ...axisNames, thetaName],
  );
  c.on('jump-instead', () => s.play(theta.to(THETA, { duration: 0.01 })));
  // The pre-activation goes under the threshold and comes back: the arrow is absent, then whole.
  c.on('jump-threshold', () => {
    s.play(pre.to(0.3, { duration: 1.5 }));
    s.wait(0.4);
    s.play(pre.to(code[1], { duration: 1.5 }));
  });
  c.show('jump-l0', count);
  // A small move of the threshold changes no output here: the slope is zero.
  c.on('jump-zero', () => {
    s.play(theta.to(THETA + 0.2, { duration: 1 }));
    s.play(theta.to(THETA, { duration: 1 }));
  });
  c.on('jump-window', () => s.play(band.to(0.24, { duration: 0.8 })));
  c.on('jump-bandwidth', () => {
    s.play(band.to(0.6, { duration: 0.9 }));
    s.play(band.to(0.1, { duration: 0.9 }));
    s.play(band.to(0.24, { duration: 0.6 }));
  });
  const matched = [
    note('compare architectures at matched'),
    chipRow(['data', 'width', 'sparsity', 'compute'], { color: COLOR.mark, stroke: COLOR.mark }),
  ];
  place(column(matched, { gap: 'tight', align: 'center' }), gateBand);
  c.show('jump-matched', matched);
}
