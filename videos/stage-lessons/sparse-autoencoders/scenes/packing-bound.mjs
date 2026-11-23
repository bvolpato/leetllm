// Scene `packing-bound`: how many directions fit, and what a small overlap costs.
//
// The picture: three acts on the plane, and each one reads an overlap as a shadow on a line.
// 1. Two arrows stand at a right angle. A third one sweeps the circle, and its two shadows are
//    never both zero.
// 2. Random directions in D dimensions, each drawn at its true angle to one probe. As D grows, the
//    fan closes on the perpendicular, and the bound falls under one.
// 3. Twelve arrows that each overlap the probe by 0.1 join tip to tail. Their shadow on the probe
//    creeps past the threshold.
import {
  assertEqual,
  clamp,
  column,
  decimal,
  dot,
  dynamic,
  fade,
  grid,
  indicate,
  line,
  place,
  rect,
  rightAngle,
  row,
  seededRandom,
  tex,
  text,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, NUMBER_SIZE, SIDE, board, vec } from '../parts.mjs';

/** The lane under axis 1 that shows a shadow as a bar, and the lane under it. */
const LANE = [0, 84],
  LANE_2 = [0, 118];

/** Each coordinate sign is sampled independently and fairly across all M directions. */
const M = 24,
  EPSILON = 0.5,
  DIMENSIONS = [16, 64, 256];
const bound = (dimension) => M * (M - 1) * Math.exp((-dimension * EPSILON ** 2) / 2);

/** The overlap of each sampled direction with the first one, the probe, for each dimension. */
function sampleOverlaps() {
  const random = seededRandom(1);
  return DIMENSIONS.map((dimension) => {
    const directions = Array.from({ length: M }, () =>
      Array.from({ length: dimension }, () => (random() < 0.5 ? -1 : 1) / Math.sqrt(dimension)),
    );
    return directions.map((d) =>
      directions.map((other) => d.reduce((sum, value, k) => sum + value * other[k], 0)),
    );
  });
}

/** The ratio of squared distances, after a random linear map and before it, for each pair of N points. */
function sampleDistanceRatios() {
  const random = seededRandom(5);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const N = 8,
    from = 256,
    to = 64;
  const points = Array.from({ length: N }, () => Array.from({ length: from }, gauss));
  const map = Array.from({ length: to }, () =>
    Array.from({ length: from }, () => gauss() / Math.sqrt(to)),
  );
  const mapped = points.map((p) =>
    map.map((line) => line.reduce((sum, value, k) => sum + value * p[k], 0)),
  );
  const squared = (a, b) => a.reduce((sum, value, k) => sum + (value - b[k]) ** 2, 0);
  const ratios = [];
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++)
      ratios.push(squared(mapped[i], mapped[j]) / squared(points[i], points[j]));
  return { ratios, points: N, from, to };
}

/** The accumulation of the voice: twelve active unit coefficients, each with overlap 0.1. */
const ACTIVE = 12,
  MU = 0.1,
  THRESHOLD = 1;

// In 13 dimensions, d_i = MU e_0 + sqrt(1 - MU^2) e_(i+1).
// The second display axis is the alternating unit sum of the twelve private axes.
// This orthogonal projection preserves probe overlaps and vector addition.
const activeDirections = Array.from({ length: ACTIVE }, (_, i) =>
  Array.from({ length: ACTIVE + 1 }, (_, j) =>
    j === 0 ? MU : j === i + 1 ? Math.sqrt(1 - MU ** 2) : 0,
  ),
);
const projectActive = (d) => [
  d[0],
  d.slice(1).reduce((sum, value, i) => sum + (i % 2 ? -value : value), 0) / Math.sqrt(ACTIVE),
];

export default function packingBound(s, c) {
  const b = board();
  const pairwise = sampleOverlaps();
  const overlaps = pairwise.map((matrix) => matrix[0].slice(1));
  const jl = sampleDistanceRatios();
  assertEqual(
    jl.ratios.every((ratio) => Math.abs(ratio - 1) <= EPSILON),
    true,
    'every pair of the sampled map is within one plus or minus epsilon',
  );
  assertEqual(Number((ACTIVE * MU).toFixed(6)), 1.2, 'twelve overlaps of 0.1');
  assertEqual(
    activeDirections.every((d) => Math.abs(Math.hypot(...d) - 1) < 1e-12),
    true,
    'the twelve active directions are unit vectors',
  );
  assertEqual(
    activeDirections.every((d, i) =>
      activeDirections.every(
        (other, j) =>
          i === j || Math.abs(d.reduce((sum, value, k) => sum + value * other[k], 0)) <= MU,
      ),
    ),
    true,
    'active-active overlaps also obey the stated coherence',
  );
  const [top, middle, bottom] = SIDE.rows([2, 5, 2], 'normal');
  s.add(heading(c.title));
  c.take(b.plane);

  // Act 1. Two directions at a right angle, and a third one that looks for a place.
  const sweep = s.value(0.6);
  const third = () => [Math.cos(sweep.value), Math.sin(sweep.value)];
  const pair = [
    b.arrowOf([0, 0], [1, 0], COLOR.first),
    b.arrowOf([0, 0], [0, 1], COLOR.second),
    rightAngle(b.P([0, 0]), b.P([1, 0]), b.P([0, 1]), { color: 'dim', width: 3 }),
  ];
  const seeker = [
    b.shadowOf(third, [1, 0], COLOR.first),
    b.shadowOf(third, [0, 1], COLOR.second),
    b.arrowOf([0, 0], third, COLOR.mark, { width: 7 }),
  ];
  const limit = place(
    column([label('2 dimensions'), label('2 directions at a right angle')], {
      gap: 'none',
      align: 'center',
    }),
    top,
  );
  const shadows = [
    note('shadow on 1'),
    decimal(() => Math.abs(third()[0]), { digits: 2, size: 64, color: COLOR.first }),
    note('shadow on 2'),
    decimal(() => Math.abs(third()[1]), { digits: 2, size: 64, color: COLOR.second }),
  ];
  place(
    grid(shadows, { columns: 2, gap: ['wide', 'normal'], align: ['right', 'left'] }),
    middle,
    'top',
  );
  const conclusion = place(label('At least one shadow', { color: COLOR.mark }), bottom);
  s.add(pair, limit);
  c.show('packing-bound-b0', [seeker, shadows]);
  c.on('packing-up', () => s.play(sweep.to(Math.PI / 2, { duration: 1.3 })));
  c.on('packing-side', () => s.play(sweep.to(0, { duration: 1.6 })));
  c.show('packing-answer', conclusion, { after: true });

  // Johnson-Lindenstrauss: a map to fewer dimensions keeps every distance within a band.
  const [nameBand, rulerBand] = middle.inset('normal', 'none').rows([1, 2], 'tight');
  const ruler = { min: 0.4, max: 1.6, region: rulerBand };
  const rulerY = rulerBand.cy;
  const at = (ratio) =>
    ruler.region.left + ((ratio - ruler.min) / (ruler.max - ruler.min)) * ruler.region.width;
  const spread = s.value(0);
  const scale = [
    line([at(ruler.min), rulerY], [at(ruler.max), rulerY], { stroke: 'dim', width: 3 }),
    ...[0.5, 1, 1.5].flatMap((tick) => [
      line([at(tick), rulerY], [at(tick), rulerY + 14], { stroke: 'dim', width: 3 }),
      text(tick === 1 ? '1' : tick.toFixed(1), {
        size: NUMBER_SIZE,
        font: 'mono',
        color: 'dim',
      }).at(at(tick), rulerY + 46),
    ]),
  ];
  const ticks = dynamic(() =>
    jl.ratios.map((ratio) => {
      const x = at(1 + (ratio - 1) * spread.value);
      return line([x, rulerY - 58], [x, rulerY - 8], {
        stroke: COLOR.other,
        width: 4,
        opacity: 0.85,
      });
    }),
  );
  const band = rect(at(1 + EPSILON) - at(1 - EPSILON), 84, {
    fill: COLOR.mark,
    stroke: null,
    opacity: 0.16,
    radius: 6,
  }).at(at(1), rulerY - 33);
  const ratioName = place(label('squared-distance ratio'), nameBand, 'bottom');
  const sample = place(
    note(`${jl.points} points, ${jl.ratios.length} pairs, ${jl.from} to ${jl.to} dimensions`),
    top,
    'bottom',
  );
  const order = place(
    tex('k = O\\!\\left(\\varepsilon^{-2}\\log N\\right)', { size: 52 }),
    top,
    'top',
  );
  const within = place(label('all within 1 ± ε', { color: COLOR.mark }), bottom, 'top');
  const recovery = place(note('Feature test: recover known directions'), bottom, 'bottom');
  c.swap('jl-name', [limit, ...shadows, conclusion], [...scale, ticks, ratioName, sample]);
  c.on('jl-projection', () => s.play(spread.to(1, { duration: 1.8 })));
  c.show('jl-dimension', order);
  c.show('jl-within', [band, within]);
  c.show('jl-not', recovery);

  // Act 2. Random directions against one probe: each arrow stands at its true angle to the probe.
  const stage = s.value(0);
  const dimension = () => 16 * 4 ** stage.value;
  const overlapOf = (i) => {
    const low = Math.min(DIMENSIONS.length - 2, Math.floor(stage.value));
    const share = stage.value - low;
    return overlaps[low][i] * (1 - share) + overlaps[low + 1][i] * share;
  };
  const side = (i) => (i % 2 ? -1 : 1);
  const ray = (i) => {
    const overlap = overlapOf(i);
    return [overlap, side(i) * Math.sqrt(Math.max(0, 1 - overlap ** 2))];
  };
  const inside = (i) => Math.abs(overlapOf(i)) <= EPSILON + 1e-9;
  const fan = overlaps[0].map((_, i) =>
    b.arrowOf(
      [0, 0],
      () => ray(i),
      () => (inside(i) ? 'dim' : COLOR.wrong),
      { width: 4 },
    ),
  );
  const marks = dynamic(() =>
    overlaps[0].map((_, i) => {
      const p = b.P([overlapOf(i), 0]);
      return dot(7, inside(i) ? COLOR.activation : COLOR.wrong).at(p[0], p[1] + LANE[1]);
    }),
  );
  const edge = Math.sqrt(1 - EPSILON ** 2);
  const cone = [
    [EPSILON, edge],
    [-EPSILON, edge],
  ].map((d) =>
    line(b.P(vec.scale(d, -1.12)), b.P(vec.scale(d, 1.12)), {
      stroke: COLOR.mark,
      width: 3,
      dash: [12, 10],
    }),
  );
  const allowed = b.segmentOf([-EPSILON, 0], [EPSILON, 0], COLOR.mark, {
    lift: LANE,
    width: 18,
    opacity: 0.3,
  });
  const probe = b.arrowOf([0, 0], [1, 0], COLOR.activation, { width: 9 });
  const probeTag = b.tagOf([1.55, 0], 'probe', COLOR.activation, [0, -36], { font: undefined });
  const formula = place(
    tex('P(\\text{fail}) \\le M(M-1)\\,e^{-D\\varepsilon^{2}/2}', { size: 46 }),
    top,
  );
  const boundColor = () => (bound(dimension()) > 1 ? COLOR.wrong : COLOR.mark);
  const [factBand, matrixBand] = middle.rows([2, 5], 'normal');
  const [leftHalf, rightHalf] = factBand.columns(2, 'normal');
  const facts = [
    label('dimensions'),
    decimal(() => dimension(), { digits: 0, size: 52 }),
    label('bound'),
    dynamic(() => {
      const value = bound(dimension());
      const words = value >= 10 ? value.toFixed(0) : value >= 0.001 ? value.toFixed(3) : '< 0.001';
      return text(words, { size: 52, font: 'mono', color: boundColor() });
    }),
  ];
  place(column(facts.slice(0, 2), { gap: 'tight', align: 'center' }), leftHalf);
  place(column(facts.slice(2), { gap: 'tight', align: 'center' }), rightHalf);
  const sampleNote = place(
    column(
      [
        note(`M = ${M}; ε = ${EPSILON}`, { color: COLOR.mark }),
        note('fair independent signs / √D'),
      ],
      { gap: 'tight', align: 'center' },
    ),
    bottom,
    'top',
  );
  const allPairs = s.value(0);
  const cell = Math.min(matrixBand.height / M, matrixBand.width / (M * 2));
  const matrix = dynamic(() => {
    const low = Math.min(DIMENSIONS.length - 2, Math.floor(stage.value));
    const fraction = stage.value - low;
    return pairwise[low].flatMap((row, i) =>
      row.map((value, j) => {
        const overlap = Math.abs(value * (1 - fraction) + pairwise[low + 1][i][j] * fraction);
        return rect(cell - 1, cell - 1, {
          fill:
            i === j
              ? 'faint'
              : overlap > EPSILON
                ? COLOR.wrong
                : i === 0
                  ? COLOR.mark
                  : COLOR.other,
          stroke: null,
          opacity:
            i === j ? 0.15 : (i === 0 ? 1 : 0.15 + 0.85 * allPairs.value) * (0.2 + 0.8 * overlap),
        }).at(matrixBand.left + (j + 0.5) * cell, matrixBand.top + (i + 0.5) * cell);
      }),
    );
  });
  const matrixWords = place(
    column(
      [note('absolute pair overlaps'), note('yellow row: this probe'), note('diagonal excluded')],
      { gap: 'tight', align: 'left' },
    ),
    matrixBand.columns(2, 'normal')[1],
    'left',
  ).nodes;
  const fanScope = place(note('angles to this probe only'), bottom, 'bottom');
  const over = place(
    label('over 1: the bound says nothing', { color: COLOR.wrong }),
    bottom,
    'bottom',
  );
  c.swap(
    'packing-bound-b1',
    [...pair, ...seeker, ...scale, ticks, ratioName, sample, order, band, within, recovery],
    [
      ...fan,
      marks,
      ...cone,
      allowed,
      probe,
      probeTag,
      facts[0],
      facts[1],
      sampleNote,
      matrix,
      ...matrixWords,
      fanScope,
    ],
  );
  // The fan passes over the numbers of the axes, so the numbers leave for this act.
  c.on('packing-bound-b1', () => s.play(fade(b.plane.numbers, 0, { duration: 0.3 })));
  c.on('packing-bound-b2', () => s.play(fade(b.plane.numbers, 1, { duration: 0.3 })), 0.4);
  c.on('bound-concentration', () => s.play(stage.to(1, { duration: 1.8 })));
  c.show('bound-formula', [formula, facts[2], facts[3]]);
  c.on('bound-formula', () => s.play(allPairs.to(1, { duration: 0.8 })));
  c.hide('random-bound', fanScope);
  c.on('bound-exp', () => s.play(stage.to(2, { duration: 1.8 })));
  c.on('random-bound', () => s.play(stage.to(0, { duration: 1.4 })));
  c.show('random-bound', over, { after: true });
  c.on('bound-many', () => s.play(stage.to(1, { duration: 1.6 })));
  c.hide('bound-many', over);
  c.show('bound-many', fanScope, { lead: -0.3 });

  // Act 3. Projections of twelve active unit directions join tip to tail.
  const joined = s.value(0);
  const step = (i) => projectActive(activeDirections[i]);
  const starts = Array.from({ length: ACTIVE }, (_, i) =>
    Array.from({ length: i }, (_, j) => step(j)).reduce(vec.add, [0, 0]),
  );
  const share = (i) => clamp(joined.value - i);
  const tip = () => {
    const last = Math.min(ACTIVE - 1, Math.max(0, Math.ceil(joined.value) - 1));
    return vec.add(starts[last], vec.scale(step(last), share(last)));
  };
  const chain = starts.map((start, i) =>
    b.arrowOf(start, () => vec.add(start, vec.scale(step(i), share(i))), COLOR.other, { width: 5 }),
  );
  const leak = () => tip()[0];
  const drop = b.shadowOf(tip, [1, 0], COLOR.mark, 8);
  const leakBar = [
    b.segmentOf([0, 0], () => [Math.min(leak(), THRESHOLD), 0], COLOR.mark, {
      lift: LANE,
      width: 18,
    }),
    b.segmentOf([THRESHOLD, 0], () => [Math.max(leak(), THRESHOLD), 0], COLOR.wrong, {
      lift: LANE,
      width: 18,
    }),
  ];
  const coherence = place(
    tex('\\left|d_j^{\\top}x\\right| \\le \\mu \\sum_{i} |z_i|', { size: 50 }),
    top,
  );
  const tally = [
    label('active'),
    decimal(() => Math.round(joined.value), { digits: 0, size: 72, color: COLOR.other }),
    label('leak'),
    decimal(() => leak(), { digits: 1, size: 72, color: COLOR.mark }),
  ];
  place(column(tally.slice(0, 2), { gap: 'tight', align: 'center' }), leftHalf);
  place(column(tally.slice(2), { gap: 'tight', align: 'center' }), rightHalf);
  const each = place(
    column(
      [label(`overlap ${MU} each`, { color: COLOR.other }), note('13D vectors projected to 2D')],
      { gap: 'none', align: 'center' },
    ),
    bottom,
    'top',
  );
  const gate = [
    line(
      vec.add(b.P([THRESHOLD, 0]), [0, LANE[1] - 22]),
      vec.add(b.P([THRESHOLD, 0]), [0, LANE_2[1] + 22]),
      {
        stroke: COLOR.activation,
        width: 4,
      },
    ),
    b.tagOf([THRESHOLD, 0], 'threshold 1', COLOR.activation, [18, LANE_2[1] + 12], {
      anchor: 'left',
    }),
  ];
  const falseAlarm = place(label('a false activation', { color: COLOR.wrong }), bottom, 'bottom');
  const weak = b.segmentOf([0, 0], [0.6, 0], COLOR.first, { lift: LANE_2, width: 18 });
  const weakNote = place(
    label('a weak real signal is cut too', { color: COLOR.first }),
    bottom,
    'bottom',
  );
  c.swap(
    'packing-bound-b2',
    [
      ...fan,
      marks,
      ...cone,
      allowed,
      formula,
      ...facts,
      sampleNote,
      matrix,
      ...matrixWords,
      fanScope,
    ],
    [...chain, drop, ...leakBar, each],
  );
  c.on('packing-bound-b2', () => s.play(joined.to(1, { duration: 0.9 })));
  c.show('coherence-readout', coherence);
  c.show('coherence-accumulate', tally);
  c.on('coherence-accumulate', () => s.play(joined.to(ACTIVE, { duration: 4.6 })));
  c.after('coherence-leak', () =>
    s.play(indicate(tally[3], { color: COLOR.activation, scale: 1.2 })),
  );
  c.show('coherence-threshold', gate);
  c.show('coherence-threshold', falseAlarm, { after: true });
  c.hide('coherence-sparsity', falseAlarm);
  c.on('coherence-sparsity', () => s.play(joined.to(4, { duration: 1.6 })));
  c.show('coherence-weak', [weak, weakNote]);
  c.keep(b.plane);
}
