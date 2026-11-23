// Scene `training-evidence`: what the lab run of the article shows, and what it does not show.
//
// The picture: the lab as cells. Each sample lights 2 to 4 of 24 known directions, and their
// arrows add tip to tail on the plane. The autoencoder lights about 19 of its 64 latents. Three
// gauges read the run: the error falls far, and the alignment with the known directions does not
// move. Then one learned arrow shows why an absolute cosine can mislead. At the end the ruler of
// losses gets its numbers.
import {
  assertEqual,
  boxOf,
  clamp,
  column,
  dot,
  dynamic,
  fade,
  linear,
  line,
  indicate,
  place,
  rect,
  row,
  seededRandom,
  tex,
  text,
} from 'vizmatic/stage';
import { area, chipRow, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, BOARD, SIDE, board, lossRuler, vec } from '../parts.mjs';

/** The lab of the article, and the numbers of its completed run. */
const LAB = { directions: 24, width: 8, latents: 64, mixture: [2, 4] };
const RUN = {
  mseStart: 1.426,
  mseEnd: 0.128,
  activeTrain: 18.9,
  activeHeldOut: 19.5,
  fvu: 0.169,
  cosineStart: 0.798,
  cosineEnd: 0.799,
};
/** The losses of the voice. */
const LOSS = { clean: 2, rebuilt: 2.4, ablated: 6, later: 10, max: 11 };
/** The storage of the voice: vectors, width, and bytes for one float32. */
const STORE = { vectors: 200_000, width: 4096, bytes: 4 };
/** The samples that the picture shows, and the seconds that each one stays. */
const SAMPLES = 36,
  SECONDS = 1.6;

/** The known directions of the picture, and samples of mixtures of them: a picture of the lab, with a fixed seed. */
function lab() {
  const random = seededRandom(11);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const directions = Array.from({ length: LAB.directions }, () => {
    const d = Array.from({ length: LAB.width }, gauss);
    const norm = Math.hypot(...d);
    return d.map((value) => value / norm);
  });
  const inPlane = (p) => p[0] > -1.15 && p[0] < 2.7 && p[1] > -1.35 && p[1] < 1.75;
  const samples = [];
  while (samples.length < SAMPLES) {
    const count = LAB.mixture[0] + Math.floor(random() * (LAB.mixture[1] - LAB.mixture[0] + 1));
    const chosen = [];
    while (chosen.length < count) {
      const index = Math.floor(random() * LAB.directions);
      if (!chosen.includes(index)) chosen.push(index);
    }
    // The points of the chain on the plane: the first two coordinates of each partial sum.
    const chain = chosen.reduce(
      (points, index) => [...points, vec.add(points.at(-1), directions[index].slice(0, 2))],
      [[0, 0]],
    );
    const active = new Set();
    const target = Math.round(RUN.activeTrain + gauss() * 2);
    while (active.size < target) active.add(Math.floor(random() * LAB.latents));
    const activation = Array.from({ length: LAB.width }, (_, k) =>
      chosen.reduce((sum, index) => sum + directions[index][k], 0),
    );
    if (chain.every(inPlane)) samples.push({ chosen, chain, active, activation });
  }
  return { directions, samples };
}

export default function trainingEvidence(s, c) {
  const b = board();
  const labelPlate = place(rect(620, 76, { fill: 'bg', stroke: null }), BOARD, 'bottom right');
  const sampleLabel = place(note('schematic samples and latent activity'), boxOf(labelPlate));
  const { directions, samples } = lab();
  assertEqual(
    samples.every(
      (sample) => sample.chosen.length >= LAB.mixture[0] && sample.chosen.length <= LAB.mixture[1],
    ),
    true,
    'each sample mixes two to four known directions',
  );
  assertEqual(
    Number(((STORE.vectors * STORE.width * STORE.bytes) / 2 ** 30).toFixed(2)),
    3.05,
    'the storage of the voice, in gibibytes',
  );
  assertEqual(
    Math.round((1 - (LOSS.rebuilt - LOSS.clean) / (LOSS.ablated - LOSS.clean)) * 100),
    90,
    'the first recovered share',
  );
  assertEqual(
    Math.round((1 - (LOSS.rebuilt - LOSS.clean) / (LOSS.later - LOSS.clean)) * 100),
    95,
    'the second recovered share',
  );

  // The clock of the samples: a new sample each 0.9 seconds, and each one fades in and out.
  const clock = s.value(0);
  const sample = () => samples[Math.min(SAMPLES - 1, Math.floor(clock.value))];
  const glow = () => {
    const f = clock.value - Math.floor(clock.value);
    return clamp(6 * Math.min(f, 1 - f));
  };

  // The plane: the 24 known directions as their shadows, and the arrows of the sample, tip to tail.
  const shadows = directions.map((d) => b.arrowOf([0, 0], d.slice(0, 2), 'faint', { width: 3 }));
  const chain = Array.from({ length: LAB.mixture[1] }, (_, k) =>
    b.arrowOf(
      () => sample().chain[Math.min(k, sample().chain.length - 1)],
      () => {
        const points = sample().chain;
        const from = points[Math.min(k, points.length - 1)],
          to = points[Math.min(k + 1, points.length - 1)];
        return vec.add(from, vec.scale([to[0] - from[0], to[1] - from[1]], glow()));
      },
      COLOR.first,
      { width: 7 },
    ),
  );
  const activation = dynamic(() =>
    glow() < 0.98 ? null : dot(12, COLOR.activation).at(...b.P(sample().chain.at(-1))),
  );

  // The side: three rows of cells for the lab, and the gauges of the run under them.
  const [knownBand, widthBand, latentBand, gaugeBand] = SIDE.rows([1.3, 1.3, 2.6, 5], 'tight');
  const cells = (band, count, columns, lit, color) => {
    const size = Math.min(
      (band.width - 8) / columns,
      (band.height - 44) / Math.ceil(count / columns),
    );
    const left = band.left + (band.width - size * columns) / 2,
      top = band.bottom - size * Math.ceil(count / columns);
    return dynamic(() =>
      Array.from({ length: count }, (_, i) => {
        const strength = lit(i);
        return rect(size - 6, size - 6, {
          radius: 4,
          stroke: null,
          fill: strength > 0.02 ? color : 'faint',
          opacity: strength > 0.02 ? 0.25 + 0.75 * strength : 0.35,
        }).at(
          left + (i % columns) * size + size / 2,
          top + Math.floor(i / columns) * size + size / 2,
        );
      }),
    );
  };
  const known = cells(
    knownBand,
    LAB.directions,
    LAB.directions,
    (i) => (sample().chosen.includes(i) ? glow() : 0),
    COLOR.first,
  );
  const widths = cells(
    widthBand,
    LAB.width,
    LAB.directions,
    (i) => Math.min(1, Math.abs(sample().activation[i])) * glow(),
    COLOR.activation,
  );
  const latents = cells(
    latentBand,
    LAB.latents,
    16,
    (i) => (sample().active.has(i) ? glow() : 0),
    COLOR.second,
  );
  const knownName = place(
    note(
      `${LAB.directions} known directions: ${LAB.mixture[0]} to ${LAB.mixture[1]} in each sample`,
    ),
    knownBand,
    'top left',
  );
  const widthName = place(note(`an activation of ${LAB.width} dimensions`), widthBand, 'top left');
  const latentName = place(note(`${LAB.latents} latents`), latentBand, 'top left');
  // The chains of the samples pass over the numbers of the axes, so this scene shows the plane without them.
  b.plane.numbers.opacity(0);
  b.plane.grid.opacity(0);
  s.add(
    heading(c.title),
    b.plane,
    shadows,
    chain,
    activation,
    known,
    knownName,
    widths,
    widthName,
    labelPlate,
    sampleLabel,
  );
  c.on('training-evidence-b0', () =>
    s.play(
      clock.to(SAMPLES - 0.5, {
        duration: Math.min((SAMPLES - 0.5) * SECONDS, c.beats[0].end - c.beats[0].start),
        ease: linear,
      }),
    ),
  );

  // Beat 0. The model of the lab, and what the lab leaves out.
  c.show('lab-encoder', [latents, latentName]);
  const recipe = [
    label('ReLU encoder, bias in the decoder'),
    label(`${LAB.latents} unit columns`),
    label('full-batch gradient descent'),
  ];
  place(column(recipe, { gap: 'tight', align: 'left' }), gaugeBand, 'top left');
  c.show('lab-encoder', recipe[0]);
  c.show('lab-columns', recipe[1]);
  c.show('lab-gd', recipe[2]);
  const omitted = [
    note('not in this lab'),
    chipRow(['streaming', 'AuxK', 'learned thresholds'], { color: 'dim' }),
  ];
  place(column(omitted, { gap: 'tight', align: 'left' }), gaugeBand, 'bottom left');
  c.show('lab-omits', omitted);

  // The article's seeded NumPy lab supplies one best absolute cosine per generating direction.
  const initial = [
    0.805, 0.7376, 0.8176, 0.8472, 0.6651, 0.8824, 0.8079, 0.8274, 0.8418, 0.7909, 0.7273, 0.7687,
    0.8897, 0.6427, 0.8571, 0.8976, 0.7258, 0.6787, 0.7644, 0.8057, 0.7547, 0.6553, 0.9388, 0.711,
  ];
  const trained = [
    0.7947, 0.722, 0.8132, 0.8419, 0.6869, 0.867, 0.8247, 0.8184, 0.8395, 0.8031, 0.7117, 0.7726,
    0.8714, 0.6398, 0.8507, 0.9037, 0.7356, 0.697, 0.7793, 0.8061, 0.7491, 0.6579, 0.9183, 0.7009,
  ];
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return Number(((sorted[11] + sorted[12]) / 2).toFixed(3));
  };
  const hits = (values) => values.filter((v) => v >= 0.9).length;
  assertEqual(
    [median(initial), median(trained)],
    [RUN.cosineStart, RUN.cosineEnd],
    'median matches',
  );
  assertEqual([hits(initial), hits(trained)], [1, 2], 'directions reaching 0.90');

  const [chartHead, plot, chartFoot] = BOARD.rows([1, 5, 2], 'normal');
  const px = (i) => plot.left + 100 + ((i + 0.5) * (plot.width - 124)) / LAB.directions;
  const py = (v) => plot.bottom - 20 - ((v - 0.6) / 0.4) * (plot.height - 44);
  const chart = [
    place(label('Best |cosine| per known direction', { size: 41 }), chartHead),
    ...[0.6, 0.7, 0.8, 0.9, 1].flatMap((v) => [
      line([plot.left + 89, py(v)], [plot.right - 10, py(v)], {
        width: v === 0.9 ? 4 : 2,
        stroke: v === 0.9 ? COLOR.mark : 'faint',
        dash: [7, 7],
      }),
      mono(v.toFixed(2), { size: 30, anchor: 'left' }).at(plot.left, py(v)),
    ]),
    ...[0, 5, 11, 17, 23].map((i) => mono(String(i + 1), { size: 30 }).at(px(i), plot.bottom + 16)),
    place(note('Generating direction (1–24)'), chartFoot, 'top'),
  ];
  const starts = initial.map((v, i) => dot(8, COLOR.activation).at(px(i) - 5, py(v)));
  const ends = trained.flatMap((v, i) => [
    line([px(i) - 5, py(initial[i])], [px(i) + 5, py(v)], { stroke: COLOR.other, width: 4 }),
    dot(8, COLOR.other).at(px(i) + 5, py(v)),
  ]);
  const keys = [
    note('● random start', { color: COLOR.activation }),
    note('● after training', { color: COLOR.other }),
  ];
  place(row(keys, { gap: 'wide' }), chartFoot);
  const threshold = place(
    mono('At or above 0.90     1 → 2 of 24', { size: 36, color: COLOR.mark }),
    chartFoot,
    'bottom',
  );

  const [errorBand, supportBand, fvuBand, matchesBand] = SIDE.rows([2, 2, 1.7, 2], 'normal');
  const startMSE = place(label('Training reconstruction MSE'), errorBand, 'top left');
  const mse = s.value(RUN.mseStart);
  const errorBar = dynamic(() => {
    const width = ((errorBand.width - 150) * mse.value) / RUN.mseStart;
    const y = errorBand.cy + 20;
    return [
      rect(width, 27, { fill: COLOR.residual, stroke: null }).at(errorBand.left + width / 2, y),
      mono(mse.value.toFixed(3), { size: 38, color: COLOR.residual, anchor: 'left' }).at(
        errorBand.left + width + 16,
        y,
      ),
    ];
  });
  const support = [
    label('Mean active slots per example', { size: 36 }),
    mono('18.9 train   19.5 held out', { size: 36, color: COLOR.second }),
  ];
  place(column(support, { gap: 'normal', align: 'left' }), supportBand, 'left');
  const generator = place(note('Generator used 2–4 directions'), supportBand, 'bottom left');
  const fvu = place(mono('Held-out FVU = 0.128 / 0.757 ≈ 0.169', { size: 31 }), fvuBand, 'left');
  const verdict = [
    label('Median best |cosine|'),
    mono('0.798 → 0.799', { size: 52, color: COLOR.other }),
  ];
  place(column(verdict, { gap: 'normal', align: 'left' }), matchesBand, 'left');
  c.swap(
    'training-evidence-b1',
    [
      b.plane,
      shadows,
      chain,
      activation,
      labelPlate,
      sampleLabel,
      known,
      knownName,
      widths,
      widthName,
      latents,
      latentName,
      recipe,
      omitted,
    ],
    [chart, starts, keys[0], startMSE, errorBar],
  );
  c.on('training-endpoints', () => s.play(mse.to(RUN.mseEnd, { duration: 1.4 })));
  c.show('training-active-support', support);
  c.show('lab-denser', generator);
  c.show('training-fvu-result', fvu);
  c.show('training-alignment', [ends, keys[1], verdict]);
  c.show('lab-without', threshold);
  const run = [
    chart,
    starts,
    ends,
    keys,
    threshold,
    startMSE,
    errorBar,
    support,
    generator,
    fvu,
    verdict,
  ];
  const rows = gaugeBand.rows(3, 'tight');

  // Beat 2. One learned column against a known direction: what an absolute cosine does not say.
  const truth = [1, 0],
    second = [Math.cos(0.7), Math.sin(0.7)];
  const turn = s.value(0);
  const learned = () => [Math.cos(turn.value), Math.sin(turn.value)];
  const spread = s.value(0);
  const compass = {
    truth: b.arrowOf([0, 0], truth, COLOR.activation, { width: 8 }),
    second: b.arrowOf([0, 0], second, COLOR.activation, { width: 8 }),
    learned: [-1, 0, 1].map((k) =>
      b.arrowOf(
        [0, 0],
        () => [Math.cos(turn.value + k * spread.value), Math.sin(turn.value + k * spread.value)],
        COLOR.second,
        { width: 6 },
      ),
    ),
    other: [1.9, 2.9, 4.4].map((angle) =>
      b.arrowOf([0, 0], [Math.cos(angle), Math.sin(angle)], COLOR.other, { width: 6 }),
    ),
  };
  const cosine = () => vec.dot(learned(), truth);
  const big = (words, color, band) =>
    dynamic(() =>
      text(words(), { size: 50, font: 'mono', color: color() }).at(gaugeBand.cx, band.cy),
    );
  const readings = [
    big(
      () => `cosine ${cosine().toFixed(2)}`,
      () => (cosine() < 0 ? COLOR.wrong : COLOR.activation),
      rows[0],
    ),
    big(
      () => `|cosine| ${Math.abs(cosine()).toFixed(2)}`,
      () => COLOR.mark,
      rows[1],
    ),
  ];
  const matches = [
    big(
      () => `with known 1: ${Math.abs(cosine()).toFixed(2)}`,
      () => COLOR.second,
      rows[0],
    ),
    big(
      () => `with known 2: ${Math.abs(vec.dot(learned(), second)).toFixed(2)}`,
      () => COLOR.second,
      rows[1],
    ),
  ];
  const lesson2 = [
    'keep the sign, and a random start',
    'a code of no negative values cannot write it',
    'one column is the best match of two',
    'another seed: another dictionary',
    'more width: one concept in several latents',
  ].map((words) => place(label(words, { size: 34 }), rows[2]));
  const alignmentLabel = place(note('schematic alignment examples'), boxOf(labelPlate));
  c.show('training-evidence-b2', [labelPlate, alignmentLabel], { lead: -0.3 });
  c.swap('training-evidence-b2', run, [
    b.plane,
    compass.truth,
    compass.learned[1],
    ...readings,
    lesson2[0],
  ]);
  c.on('ev-sign', () => s.play(turn.to(Math.PI, { duration: 1.8 })), 0.4);
  c.swap('ev-sign', lesson2[0], lesson2[1], { lead: -2.4 });
  c.swap('ev-match', [lesson2[1], ...readings], [compass.second, lesson2[2], ...matches]);
  c.on('ev-match', () => s.play(turn.to(Math.PI * 2 + 0.35, { duration: 1.6 })), 0.3);
  c.swap('ev-seeds', lesson2[2], [...compass.other, lesson2[3]]);
  c.swap(
    'ev-width',
    [lesson2[3], ...compass.other],
    [compass.learned[0], compass.learned[2], lesson2[4]],
  );
  c.on('ev-width', () => s.play(spread.to(0.22, { duration: 1.4 })), 0.4);
  const report = [
    note('report'),
    chipRow(['width', 'data', 'compute', 'window', 'rare contexts'], {
      maxWidth: SIDE.width,
      color: COLOR.mark,
      stroke: COLOR.mark,
    }),
  ];
  place(column(report, { gap: 'tight', align: 'left' }), SIDE.rows([5.2, 5], 'tight')[0], 'left');
  c.show('ev-report', report);

  // Beat 3. The ruler of losses takes the place of the plane, and gets the numbers of the voice.
  const [topRow, rulerBand, bottomRow] = area.rows([2, 3, 2], 'normal');
  const [formulaBand, shareBand] = topRow.columns([3, 2], 'wide');
  const [storeBand, reportBand] = bottomRow.columns([3, 2], 'wide');
  const ruler = lossRuler(s, rulerBand, LOSS);
  const formula = place(
    tex(
      '\\text{loss recovered} = 1 - \\frac{L_{\\text{rebuilt}} - L_{\\text{clean}}}{L_{\\text{ablated}} - L_{\\text{clean}}}',
      { size: 54 },
    ),
    formulaBand,
  );
  const same = [note('each loss at'), chipRow(['the same hooks', 'the same positions'])];
  place(row(same, { gap: 'normal' }), storeBand);
  const shares = [
    mono('90%', { size: 110, color: COLOR.residual }),
    mono('95%', { size: 110, color: COLOR.residual }),
  ];
  place(row(shares, { gap: 'loose' }), shareBand);
  // The ruler shows with the names of its three losses, and each number arrives when the voice says it.
  ruler.numbered.set(0);
  const number = (count) => () => s.play(ruler.numbered.to(count, { duration: 0.01 }));
  c.swap(
    'training-evidence-b3',
    [
      labelPlate,
      alignmentLabel,
      b.plane,
      compass.truth,
      compass.second,
      ...compass.learned,
      lesson2[4],
      ...matches,
      ...report,
    ],
    [formula, ...ruler.axis, ruler.baselineMark, ...same],
  );
  c.on('lr-clean', number(1));
  c.on('lr-sub', number(2));
  c.on('lr-abl', number(3));
  c.show('loss-recovery-first', shares[0], { after: true, fade: 0.15 });
  c.hide('lr-change', shares[0], { fade: 0.15, lead: -1.25 });
  c.on('lr-change', () => s.play(ruler.baseline.to(LOSS.later, { duration: 1.8 })), 1.6);
  c.show('loss-recovery-second', shares[1], { after: true });
  c.show('lr-damage', ruler.damage);
  // A baseline at the clean loss gives no share, and a baseline under the rebuilt loss gives a negative one.
  c.swap('lr-zero', shares[1], ruler.share);
  c.on('lr-zero', () => s.play(ruler.baseline.to(LOSS.clean, { duration: 1.4 })), 0.2);
  c.on('lr-negative', () => {
    s.play(ruler.baseline.to(2.2, { duration: 0.7 }));
    s.wait(0.8);
    s.play(ruler.baseline.to(LOSS.ablated, { duration: 1 }));
  });
  const together = [
    note('report together'),
    chipRow(['raw losses', 'MSE', 'support', 'counterexamples', 'task effects'], {
      maxWidth: reportBand.width,
      color: COLOR.mark,
      stroke: COLOR.mark,
    }),
  ];
  place(column(together, { gap: 'tight', align: 'left' }), reportBand, 'left');
  c.show('lr-report', together);
  // The storage of one hook.
  const store = [
    mono('200,000 vectors × 4,096 wide × 4 bytes'),
    mono('≈ 3.05 GiB at one hook', { size: 56, color: COLOR.mark }),
  ];
  place(column(store, { gap: 'normal', align: 'center' }), storeBand);
  c.swap('storage-setup', same, store[0]);
  c.show('activation-storage', store[1], { after: true });
}
