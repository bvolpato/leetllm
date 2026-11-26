// Scene 2: packing-bound - "Small pairwise overlap can accumulate"
// Act 1: Orthogonal blue & pink arrows + sweeping gold 3rd arrow (withheld verdict until packing-answer!),
//        then Johnson-Lindenstrauss squared-distance ratio spectrum ruler.
// Act 2: 24 random unit directions fan against probe + glowing 24x24 pairwise overlap matrix
//        (yellow probe row) + MathJax concentration bound as D sweeps 16 -> 64 -> 256 -> 16 -> 64.
// Act 3: 12 active unit directions (overlap 0.1 each) chaining tip-to-tail -> leak 1.2 > threshold 1.0
//        (false activation), then 4 active -> 0.4, plus weak real signal (0.6).
import {
  assertEqual,
  clamp,
  dot,
  dynamic,
  indicate,
  line,
  rect,
  rightAngle,
  seededRandom,
} from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildOvercomplete3d,
  cinemaAtmosphere,
  cinemaPlane,
  glowDot,
  glowTex,
  heroTitle,
  lumBar,
  playCue,
  rule,
  txt,
  vec,
} from '../parts.mjs';

const LANE = [0, 74];
const LANE_2 = [0, 110];

const M = 24;
const EPSILON = 0.5;
const DIMENSIONS = [16, 64, 256];
const boundVal = (d) => M * (M - 1) * Math.exp((-d * EPSILON ** 2) / 2);

function sampleOverlaps() {
  const random = seededRandom(1);
  return DIMENSIONS.map((dimension) => {
    const dirs = Array.from({ length: M }, () =>
      Array.from({ length: dimension }, () => (random() < 0.5 ? -1 : 1) / Math.sqrt(dimension)),
    );
    return dirs.map((d) => dirs.map((o) => d.reduce((sum, val, k) => sum + val * o[k], 0)));
  });
}

function sampleDistanceRatios() {
  const random = seededRandom(5);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const N = 8;
  const from = 256;
  const to = 64;
  const points = Array.from({ length: N }, () => Array.from({ length: from }, gauss));
  const map = Array.from({ length: to }, () =>
    Array.from({ length: from }, () => gauss() / Math.sqrt(to)),
  );
  const mapped = points.map((p) =>
    map.map((row) => row.reduce((sum, val, k) => sum + val * p[k], 0)),
  );
  const sq = (a, b) => a.reduce((sum, val, k) => sum + (val - b[k]) ** 2, 0);
  const ratios = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      ratios.push(sq(mapped[i], mapped[j]) / sq(points[i], points[j]));
    }
  }
  return { ratios, points: N, from, to };
}

const ACTIVE = 12;
const MU = 0.1;
const THRESHOLD = 1;

const activeDirections = Array.from({ length: ACTIVE }, (_, i) =>
  Array.from({ length: ACTIVE + 1 }, (_, j) =>
    j === 0 ? MU : j === i + 1 ? Math.sqrt(1 - MU ** 2) : 0,
  ),
);
const projectActive = (d) => [
  d[0],
  d.slice(1).reduce((sum, val, i) => sum + (i % 2 ? -val : val), 0) / Math.sqrt(ACTIVE),
];

export default function packingBound(s, c) {
  const pairwise = sampleOverlaps();
  const overlaps = pairwise.map((mat) => mat[0].slice(1));
  const jl = sampleDistanceRatios();
  assertEqual(
    jl.ratios.every((r) => Math.abs(r - 1) <= EPSILON),
    true,
    'every JL distance ratio stays inside 1 ± epsilon',
  );
  assertEqual(Number((ACTIVE * MU).toFixed(6)), 1.2, '12 * 0.1 = 1.2');

  const atmo = cinemaAtmosphere(ROLE.first, ROLE.mark);
  const title = heroTitle(['Small pairwise overlap', 'can accumulate'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mark,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });

  s.add(atmo, title, b.node);

  // --- ACT 1: Two perpendicular directions + sweeping 3rd arrow ---
  const sweep = s.value(0.6);
  const third = () => [Math.cos(sweep.value), Math.sin(sweep.value)];
  const pair = [
    b.arrowOf([0, 0], [1, 0], ROLE.first, { width: 7 }),
    b.arrowOf([0, 0], [0, 1], ROLE.second, { width: 7 }),
    rightAngle(b.P([0, 0]), b.P([1, 0]), b.P([0, 1]), { stroke: COSMOS.muted, width: 3 }),
  ];
  const seeker = [
    b.shadowOf(third, [1, 0], ROLE.first, 8),
    b.shadowOf(third, [0, 1], ROLE.second, 8),
    b.arrowOf([0, 0], third, ROLE.mark, { width: 6.5 }),
  ];

  const rx = 515;
  const limitHead = txt('2 dimensions', rx, -280, 42, COSMOS.ink, 'serif', 'center');
  const limitSub = txt(
    'At most 2 mutually perpendicular',
    rx,
    -230,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );

  const shadowReadouts = dynamic(() => [
    txt('shadow on blue', rx - 150, -90, 28, ROLE.first, 'sans', 'center'),
    txt(Math.abs(third()[0]).toFixed(2), rx - 150, -25, 62, ROLE.first, 'mono', 'center').glow(
      8,
      ROLE.first,
    ),
    txt('shadow on pink', rx + 150, -90, 28, ROLE.second, 'sans', 'center'),
    txt(Math.abs(third()[1]).toFixed(2), rx + 150, -25, 62, ROLE.second, 'mono', 'center').glow(
      8,
      ROLE.second,
    ),
  ]);

  const verdict1 = txt(
    'Every direction casts at least one shadow',
    rx,
    115,
    30,
    ROLE.mark,
    'sans',
    'center',
  ).glow(6, ROLE.mark);

  // Decorative orbiting 3D overcomplete sphere anchored in bottom-right during Act 1
  const mini3d = buildOvercomplete3d({
    x: rx,
    y: 300,
    radius: 1.7,
    rayCount: 12,
    activeIndices: [0, 1],
    activeColors: [ROLE.first, ROLE.second],
    unit: 72,
  });

  s.add(pair, limitHead, limitSub, mini3d.view);
  const act1Dur = Math.max(0.8, c.cue('packing-bound-b1').start - c.start - 0.5);
  c.at(0.1, () => {
    s.play(mini3d.view.orbit({ theta: 0.7, phi: 0.92 }, { duration: act1Dur }));
  });

  c.show('packing-bound-b0', [seeker, shadowReadouts]);
  playCue(s, c, 'packing-up', (d) => s.play(sweep.to(Math.PI / 2, { duration: d })), { dur: 1.25 });
  playCue(s, c, 'packing-side', (d) => s.play(sweep.to(0, { duration: d })), { dur: 1.5 });
  c.show('packing-answer', verdict1, { after: true });

  // --- Johnson-Lindenstrauss squared-distance ratio ruler ---
  const jlLeft = 215;
  const jlRight = 835;
  const jlY = 60;
  const jlAt = (ratio) => jlLeft + ((ratio - 0.4) / 1.2) * (jlRight - jlLeft);
  const spread = s.value(0);

  const jlScale = [
    rule(jlLeft, jlY, jlRight, jlY, '#4c608d', 3),
    ...[0.5, 1, 1.5].flatMap((t) => [
      line([jlAt(t), jlY], [jlAt(t), jlY + 14], { stroke: '#4c608d', width: 2.5 }),
      txt(t === 1 ? '1' : t.toFixed(1), jlAt(t), jlY + 42, 26, COSMOS.dim, 'mono', 'center'),
    ]),
  ];
  const jlTicks = dynamic(() =>
    jl.ratios.map((ratio) => {
      const x = jlAt(1 + (ratio - 1) * spread.value);
      return line([x, jlY - 62], [x, jlY - 8], {
        stroke: ROLE.other,
        width: 4,
        opacity: 0.88,
      }).glow(5, ROLE.other);
    }),
  );
  const jlBand = lumBar(jlAt(1), jlY - 35, jlAt(1 + EPSILON) - jlAt(1 - EPSILON), 80, {
    color: ROLE.mark,
    fillOpacity: 0.16,
    strokeWidth: 2,
    glow: 6,
    radius: 6,
  });

  const jlFormula = glowTex('k = O\\!\\left(\\varepsilon^{-2}\\log N\\right)', {
    x: rx,
    y: -255,
    size: 46,
    color: ROLE.mark,
    glow: 7,
  });
  const jlSample = txt(
    `${jl.points} points, ${jl.ratios.length} pairs, ${jl.from} → ${jl.to}D`,
    rx,
    -165,
    28,
    COSMOS.muted,
    'mono',
    'center',
  );
  const jlTitle = txt('Squared-distance ratio', rx, -65, 32, COSMOS.ink, 'sans', 'center');
  const jlWithin = txt('All 28 pairs within 1 ± ε', rx, 165, 32, ROLE.mark, 'sans', 'center').glow(
    6,
    ROLE.mark,
  );
  const jlRecovery = txt(
    'Feature recovery needs direct mixture tests',
    rx,
    235,
    26,
    ROLE.other,
    'sans',
    'center',
  );

  c.swap(
    'jl-name',
    [limitHead, limitSub, shadowReadouts, verdict1, mini3d.view],
    [...jlScale, jlTicks, jlTitle, jlSample],
  );
  playCue(s, c, 'jl-projection', (d) => s.play(spread.to(1, { duration: d })), { dur: 1.7 });
  c.show('jl-dimension', jlFormula);
  c.show('jl-within', [jlBand, jlWithin]);
  c.show('jl-not', jlRecovery);

  // --- ACT 2: 24 Random directions fan + 24x24 overlap matrix + concentration bound ---
  const stage = s.value(0);
  const dimNow = () => 16 * 4 ** stage.value;
  const overlapOf = (i) => {
    const low = Math.min(DIMENSIONS.length - 2, Math.floor(stage.value));
    const frac = stage.value - low;
    return overlaps[low][i] * (1 - frac) + overlaps[low + 1][i] * frac;
  };
  const rayOf = (i) => {
    const ov = overlapOf(i);
    return [ov, (i % 2 ? -1 : 1) * Math.sqrt(Math.max(0, 1 - ov ** 2))];
  };
  const inside = (i) => Math.abs(overlapOf(i)) <= EPSILON + 1e-9;

  const fan = overlaps[0].map((_, i) =>
    b.arrowOf(
      [0, 0],
      () => rayOf(i),
      () => (inside(i) ? '#536794' : ROLE.wrong),
      { width: 3.5, glow: 0 },
    ),
  );
  const projDots = dynamic(() =>
    overlaps[0].map((_, i) => {
      const p = b.P([overlapOf(i), 0]);
      const col = inside(i) ? ROLE.activation : ROLE.wrong;
      return glowDot(p[0], p[1] + LANE[1], { radius: 6, color: col, glow: 8 });
    }),
  );
  const edgeY = Math.sqrt(1 - EPSILON ** 2);
  const coneLines = [
    [EPSILON, edgeY],
    [-EPSILON, edgeY],
  ].map((d) =>
    line(b.P(vec.scale(d, -1.14)), b.P(vec.scale(d, 1.14)), {
      stroke: ROLE.mark,
      width: 2.8,
      dash: [11, 9],
    }).opacity(0.85),
  );
  const allowedSpan = b.segmentOf([-EPSILON, 0], [EPSILON, 0], ROLE.mark, {
    lift: LANE,
    width: 16,
    opacity: 0.34,
    glow: 6,
  });
  const probeArrow = b.arrowOf([0, 0], [1, 0], ROLE.activation, { width: 8.5 });
  const probeTag = b.tagOf([1.48, 0], 'probe', ROLE.activation, [0, -34], {
    font: 'sans',
    size: 30,
  });

  const boundEq = glowTex('P(\\text{fail}) \\le M(M-1)\\,e^{-D\\varepsilon^{2}/2}', {
    x: rx,
    y: -310,
    size: 40,
    color: ROLE.mark,
    glow: 6,
  });
  const dimReadout = dynamic(() => [
    txt('dimensions D', rx - 155, -210, 26, COSMOS.muted, 'mono', 'center'),
    txt(String(Math.round(dimNow())), rx - 155, -155, 52, COSMOS.ink, 'mono', 'center'),
  ]);
  const boundReadout = dynamic(() => {
    const val = boundVal(dimNow());
    const col = val > 1 ? ROLE.wrong : ROLE.mark;
    const str = val >= 10 ? val.toFixed(0) : val >= 0.001 ? val.toFixed(3) : '< 0.001';
    return [
      txt('union bound', rx + 155, -210, 26, COSMOS.muted, 'mono', 'center'),
      txt(str, rx + 155, -155, 52, col, 'mono', 'center').glow(8, col),
    ];
  });

  const allPairs = s.value(0);
  const matCell = 11.5;
  const matLeft = 215;
  const matTop = -65;
  const matrix = dynamic(() => {
    const low = Math.min(DIMENSIONS.length - 2, Math.floor(stage.value));
    const frac = stage.value - low;
    return pairwise[low].flatMap((rowArr, i) =>
      rowArr.map((val, j) => {
        const ov = Math.abs(val * (1 - frac) + pairwise[low + 1][i][j] * frac);
        const col =
          i === j ? '#2b3652' : ov > EPSILON ? ROLE.wrong : i === 0 ? ROLE.mark : ROLE.other;
        const op =
          i === j ? 0.2 : (i === 0 ? 1 : 0.16 + 0.84 * allPairs.value) * (0.25 + 0.75 * ov);
        return rect(matCell - 1.2, matCell - 1.2, { fill: col, stroke: null, opacity: op }).at(
          matLeft + (j + 0.5) * matCell,
          matTop + (i + 0.5) * matCell,
        );
      }),
    );
  });

  const matInfo = [
    txt('24×24 pair overlaps', 525, 10, 28, COSMOS.ink, 'sans', 'left'),
    txt('Yellow row: this probe', 525, 56, 26, ROLE.mark, 'sans', 'left'),
    txt('M = 24,  ε = 0.50', 525, 104, 26, COSMOS.muted, 'mono', 'left'),
    txt('signs ±1 / √D', 525, 148, 26, COSMOS.dim, 'mono', 'left'),
  ];
  const fanScope = txt('Angles to probe row only', rx, 280, 28, COSMOS.muted, 'sans', 'center');
  const overOne = txt(
    'Bound > 1: no useful guarantee at D = 16',
    rx,
    280,
    28,
    ROLE.wrong,
    'sans',
    'center',
  ).glow(6, ROLE.wrong);

  c.swap(
    'packing-bound-b1',
    [
      ...pair,
      ...seeker,
      ...jlScale,
      jlTicks,
      jlTitle,
      jlSample,
      jlFormula,
      jlBand,
      jlWithin,
      jlRecovery,
    ],
    [
      ...fan,
      projDots,
      ...coneLines,
      allowedSpan,
      probeArrow,
      probeTag,
      dimReadout,
      matrix,
      ...matInfo,
      fanScope,
    ],
  );
  playCue(s, c, 'packing-bound-b1', (d) => s.play(b.ticksAlpha.to(0, { duration: d })), {
    dur: 0.3,
  });
  playCue(s, c, 'bound-concentration', (d) => s.play(stage.to(1, { duration: d })), { dur: 1.7 });
  c.show('bound-formula', [boundEq, boundReadout]);
  playCue(s, c, 'bound-formula', (d) => s.play(allPairs.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'bound-exp', (d) => s.play(stage.to(2, { duration: d })), { dur: 1.7 });
  c.hide('random-bound', fanScope);
  playCue(s, c, 'random-bound', (d) => s.play(stage.to(0, { duration: d })), { dur: 1.3 });
  c.show('random-bound', overOne, { after: true });
  playCue(s, c, 'bound-many', (d) => s.play(stage.to(1, { duration: d })), { dur: 1.5 });
  c.hide('bound-many', overOne);
  c.show('bound-many', fanScope, { lead: -0.3 });

  // --- ACT 3: Coherence accumulation (12 active directions * 0.1 = 1.2 > 1.0) ---
  const joined = s.value(0);
  const stepVec = (i) => projectActive(activeDirections[i]);
  const starts = Array.from({ length: ACTIVE }, (_, i) =>
    Array.from({ length: i }, (_, j) => stepVec(j)).reduce(vec.add, [0, 0]),
  );
  const shareOf = (i) => clamp(joined.value - i);
  const chainTip = () => {
    const last = Math.min(ACTIVE - 1, Math.max(0, Math.ceil(joined.value) - 1));
    return vec.add(starts[last], vec.scale(stepVec(last), shareOf(last)));
  };
  const chain = starts.map((st, i) =>
    b.arrowOf(st, () => vec.add(st, vec.scale(stepVec(i), shareOf(i))), ROLE.other, { width: 5 }),
  );
  const leakVal = () => chainTip()[0];
  const dropShadow = b.shadowOf(chainTip, [1, 0], ROLE.mark, 8);
  const leakBars = [
    b.segmentOf([0, 0], () => [Math.min(leakVal(), THRESHOLD), 0], ROLE.mark, {
      lift: LANE,
      width: 16,
    }),
    b.segmentOf([THRESHOLD, 0], () => [Math.max(leakVal(), THRESHOLD), 0], ROLE.wrong, {
      lift: LANE,
      width: 16,
    }),
  ];

  const coherenceEq = glowTex('\\left|d_j^{\\top}x\\right| \\le \\mu \\sum_{i} |z_i|', {
    x: rx,
    y: -275,
    size: 46,
    color: ROLE.mark,
    glow: 7,
  });

  const tallyReadout = dynamic(() => {
    const lv = leakVal();
    const leakCol = lv > THRESHOLD ? ROLE.wrong : ROLE.mark;
    return [
      txt('active features', rx - 150, -105, 28, COSMOS.muted, 'sans', 'center'),
      txt(String(Math.round(joined.value)), rx - 150, -35, 68, ROLE.other, 'mono', 'center').glow(
        8,
        ROLE.other,
      ),
      txt('probe leak', rx + 150, -105, 28, COSMOS.muted, 'sans', 'center'),
      txt(lv.toFixed(1), rx + 150, -35, 68, leakCol, 'mono', 'center').glow(10, leakCol),
    ];
  });

  const eachNote1 = txt('Overlap μ = 0.1 each', rx, 110, 32, ROLE.other, 'mono', 'center');
  const eachNote2 = txt(
    '13D unit vectors projected to 2D',
    rx,
    158,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  const gate = [
    line(
      vec.add(b.P([THRESHOLD, 0]), [0, LANE[1] - 24]),
      vec.add(b.P([THRESHOLD, 0]), [0, LANE_2[1] + 24]),
      { stroke: ROLE.activation, width: 4 },
    ).glow(6, ROLE.activation),
    b.tagOf([THRESHOLD, 0], 'threshold 1.0', ROLE.activation, [16, LANE_2[1] + 10], {
      anchor: 'left',
      size: 28,
    }),
  ];
  const falseAlarm = txt(
    'False activation on inactive probe!',
    rx,
    265,
    32,
    ROLE.wrong,
    'sans',
    'center',
  ).glow(8, ROLE.wrong);

  const weakBar = b.segmentOf([0, 0], [0.6, 0], ROLE.first, { lift: LANE_2, width: 16 });
  const weakNote = txt(
    'High cutoff cuts weak real signals (0.6)',
    rx,
    265,
    30,
    ROLE.first,
    'sans',
    'center',
  ).glow(6, ROLE.first);

  c.swap(
    'packing-bound-b2',
    [
      ...fan,
      projDots,
      ...coneLines,
      allowedSpan,
      boundEq,
      dimReadout,
      boundReadout,
      matrix,
      ...matInfo,
      fanScope,
    ],
    [...chain, dropShadow, ...leakBars, eachNote1, eachNote2],
  );
  playCue(s, c, 'packing-bound-b2', (d) => s.play(b.ticksAlpha.to(1, { duration: d })), {
    offset: 0.3,
    dur: 0.3,
  });
  playCue(s, c, 'packing-bound-b2', (d) => s.play(joined.to(1, { duration: d })), { dur: 0.9 });
  c.show('coherence-readout', coherenceEq);
  c.show('coherence-accumulate', tallyReadout);
  playCue(s, c, 'coherence-accumulate', (d) => s.play(joined.to(ACTIVE, { duration: d })), {
    dur: 4.4,
  });
  playCue(
    s,
    c,
    'coherence-leak',
    (d) => s.play(indicate(tallyReadout, { color: ROLE.wrong, scale: 1.08, duration: d })),
    { after: true, dur: 0.7 },
  );
  c.show('coherence-threshold', gate);
  c.show('coherence-threshold', falseAlarm, { after: true });
  c.hide('coherence-sparsity', falseAlarm);
  playCue(s, c, 'coherence-sparsity', (d) => s.play(joined.to(4, { duration: d })), { dur: 1.5 });
  c.show('coherence-weak', [weakBar, weakNote]);
}
