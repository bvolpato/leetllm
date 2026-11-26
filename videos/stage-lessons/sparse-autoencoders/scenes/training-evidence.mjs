// Scene 13: training-evidence - "Measure recovery separately from reconstruction"
// Beat 0: Orbiting 3D 24-direction synthetic lab sphere + glowing 24/8/64 activity dot-matrix cells.
// Beat 1: Glowing 24-direction paired dumbbell plot (white random start vs cyan trained, gold 0.90 line)
//         + glowing MSE plunge bar (1.426 -> 0.128), active slots (18.9 / 19.5), FVU (0.169),
//         and flat median |cosine| (0.798 -> 0.799).
// Beat 2: Glowing 2D alignment compass exposing sign flip (cosine -1.00, |cosine| 1.00),
//         dual-match reuse, seed non-identifiability, and width feature-splitting fan.
// Beat 3: Full-bleed glowing Loss Recovered equation & interactive ruler (90% -> 95% -> undefined ->
//         negative -> 90%) + glowing activation storage readout (200k x 4096 x 4B = 3.05 GiB).
import { assertEqual, clamp, dynamic, line, linear, rect, seededRandom } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildOvercomplete3d,
  cinemaAtmosphere,
  cinemaPlane,
  glowDot,
  glowLossRuler,
  glowTex,
  heroTitle,
  lumBar,
  playCue,
  rule,
  txt,
  vec,
} from '../parts.mjs';

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
const LOSS = { clean: 2, rebuilt: 2.4, ablated: 6, later: 10, max: 11 };

const INITIAL_COS = [
  0.805, 0.7376, 0.8176, 0.8472, 0.6651, 0.8824, 0.8079, 0.8274, 0.8418, 0.7909, 0.7273, 0.7687,
  0.8897, 0.6427, 0.8571, 0.8976, 0.7258, 0.6787, 0.7644, 0.8057, 0.7547, 0.6553, 0.9388, 0.711,
];
const TRAINED_COS = [
  0.7947, 0.722, 0.8132, 0.8419, 0.6869, 0.867, 0.8247, 0.8184, 0.8395, 0.8031, 0.7117, 0.7726,
  0.8714, 0.6398, 0.8507, 0.9037, 0.7356, 0.697, 0.7793, 0.8061, 0.7491, 0.6579, 0.9183, 0.7009,
];

function makeSamples() {
  const random = seededRandom(11);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const samples = [];
  for (let n = 0; n < 30; n++) {
    const count = 2 + Math.floor(random() * 3);
    const chosen = [];
    while (chosen.length < count) {
      const idx = Math.floor(random() * LAB.directions);
      if (!chosen.includes(idx)) chosen.push(idx);
    }
    const act = Array.from({ length: LAB.width }, () => Math.min(1, Math.abs(gauss() * 0.7)));
    const active = new Set();
    const targetCnt = Math.round(RUN.activeTrain + gauss() * 2);
    while (active.size < targetCnt) active.add(Math.floor(random() * LAB.latents));
    samples.push({ chosen, act, active });
  }
  return samples;
}

export default function trainingEvidence(s, c) {
  const median = (vals) => {
    const sorted = [...vals].sort((a, b) => a - b);
    return Number(((sorted[11] + sorted[12]) / 2).toFixed(3));
  };
  assertEqual(
    [median(INITIAL_COS), median(TRAINED_COS)],
    [RUN.cosineStart, RUN.cosineEnd],
    'medians',
  );
  assertEqual(
    [INITIAL_COS.filter((v) => v >= 0.9).length, TRAINED_COS.filter((v) => v >= 0.9).length],
    [1, 2],
    'hits >= 0.90',
  );

  const samples = makeSamples();
  const atmo = cinemaAtmosphere(ROLE.other, ROLE.first);
  const title = heroTitle(['Measure recovery separately', 'from reconstruction'], {
    x: -855,
    y: -440,
    size: 46,
    lineHeight: 54,
    accent: ROLE.other,
  });

  s.add(atmo, title);

  // --- Beat 0: Orbiting 3D 24-direction dictionary sphere + glowing 24 / 8 / 64 cell matrices ---
  const lab3d = buildOvercomplete3d({
    x: -410,
    y: 85,
    radius: 2.65,
    rayCount: 24,
    activeIndices: [0, 1, 5, 11],
    activeColors: [ROLE.first, ROLE.second, ROLE.other, ROLE.mark],
    unit: 112,
  });
  const lab3dCap = txt(
    '24 known unit directions in 8D (3D view)',
    -410,
    435,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );

  const clock = s.value(0);
  const sampleNow = () => samples[Math.min(samples.length - 1, Math.floor(clock.value))];
  const pulse = () => {
    const f = clock.value - Math.floor(clock.value);
    return clamp(6 * Math.min(f, 1 - f));
  };

  const makeGrid = (left, top, count, cols, cellSz, litFn, col) =>
    dynamic(() =>
      Array.from({ length: count }, (_, i) => {
        const st = litFn(i);
        const on = st > 0.03;
        return rect(cellSz - 5, cellSz - 5, {
          radius: 4,
          stroke: null,
          fill: on ? col : '#263352',
          opacity: on ? 0.3 + 0.7 * st : 0.45,
        }).at(
          left + (i % cols) * cellSz + cellSz / 2,
          top + Math.floor(i / cols) * cellSz + cellSz / 2,
        );
      }),
    );

  const gx = 120;
  const knownLbl = txt(
    '24 known directions (2 to 4 active)',
    gx,
    -295,
    26,
    ROLE.first,
    'sans',
    'left',
  );
  const knownCells = makeGrid(
    gx,
    -265,
    24,
    24,
    30,
    (i) => (sampleNow().chosen.includes(i) ? pulse() : 0),
    ROLE.first,
  );

  const widthLbl = txt('8D activation vector', gx, -195, 26, COSMOS.ink, 'sans', 'left');
  const widthCells = makeGrid(
    gx,
    -165,
    8,
    8,
    42,
    (i) => sampleNow().act[i] * pulse(),
    ROLE.activation,
  );

  const latLbl = txt('64 ReLU latents (~19 active)', gx, -75, 26, ROLE.second, 'sans', 'left');
  const latCells = makeGrid(
    gx,
    -45,
    64,
    16,
    40,
    (i) => (sampleNow().active.has(i) ? pulse() : 0),
    ROLE.second,
  );

  const rec1 = txt(
    'Uncentered ReLU encoder + decoder bias',
    gx,
    165,
    28,
    COSMOS.ink,
    'sans',
    'left',
  );
  const rec2 = txt('64 unit-normalized decoder columns', gx, 215, 28, ROLE.other, 'sans', 'left');
  const rec3 = txt('Full-batch gradient descent', gx, 265, 28, COSMOS.ink, 'sans', 'left');
  const omitLbl = txt(
    'Omits:  streaming  ·  AuxK  ·  learned thresholds',
    gx,
    340,
    26,
    COSMOS.muted,
    'mono',
    'left',
  );

  s.add(lab3d.view, lab3dCap, knownLbl, knownCells, widthLbl, widthCells);
  const b0Dur = Math.max(1.0, c.cue('training-evidence-b1').start - c.start - 0.5);
  c.on('training-evidence-b0', () => {
    s.play(
      lab3d.view.orbit({ theta: 1.4, phi: 0.96 }, { duration: b0Dur }),
      clock.to(samples.length - 0.5, { duration: b0Dur, ease: linear }),
    );
  });
  c.show('lab-encoder', [latLbl, latCells, rec1]);
  c.show('lab-columns', rec2);
  c.show('lab-gd', rec3);
  c.show('lab-omits', omitLbl);

  // --- Beat 1: Paired 24-direction |cosine| dumbbell chart + MSE/Support/FVU/Median gauges ---
  const pLeft = -780;
  const pRight = 70;
  const pTop = -230;
  const pBottom = 265;
  const px = (i) => pLeft + 55 + ((i + 0.5) * (pRight - pLeft - 70)) / LAB.directions;
  const py = (v) => pBottom - ((v - 0.6) / 0.4) * (pBottom - pTop);

  const chartNodes = [
    txt(
      'Best |cosine| per known direction',
      (pLeft + pRight) / 2,
      -295,
      36,
      COSMOS.ink,
      'serif',
      'center',
    ),
    ...[0.6, 0.7, 0.8, 0.9, 1.0].flatMap((v) => [
      line([pLeft + 44, py(v)], [pRight, py(v)], {
        stroke: v === 0.9 ? ROLE.mark : '#2a3759',
        width: v === 0.9 ? 3.5 : 1.6,
        dash: v === 0.9 ? [9, 7] : undefined,
      }),
      txt(v.toFixed(2), pLeft + 34, py(v), 26, v === 0.9 ? ROLE.mark : COSMOS.dim, 'mono', 'right'),
    ]),
    ...[0, 5, 11, 17, 23].map((i) =>
      txt(String(i + 1), px(i), pBottom + 32, 26, COSMOS.dim, 'mono', 'center'),
    ),
    txt(
      'Generating direction (1 to 24)',
      (pLeft + pRight) / 2,
      pBottom + 78,
      26,
      COSMOS.muted,
      'sans',
      'center',
    ),
  ];

  const startDots = INITIAL_COS.map((v, i) =>
    glowDot(px(i) - 4, py(v), { radius: 6.5, color: ROLE.activation, glow: 8 }),
  );
  const endMarks = TRAINED_COS.flatMap((v, i) => [
    line([px(i) - 4, py(INITIAL_COS[i])], [px(i) + 4, py(v)], { stroke: ROLE.other, width: 3.5 }),
    glowDot(px(i) + 4, py(v), { radius: 6.5, color: ROLE.other, glow: 9 }),
  ]);

  const keyStart = [
    glowDot(-620, 395, { radius: 7, color: ROLE.activation, glow: 8 }),
    txt('random start', -600, 395, 28, ROLE.activation, 'sans', 'left'),
  ];
  const keyEnd = [
    glowDot(-340, 395, { radius: 7, color: ROLE.other, glow: 9 }),
    txt('after training', -320, 395, 28, ROLE.other, 'sans', 'left'),
  ];
  const hitsBadge = txt('≥ 0.90:  1 → 2 of 24', -355, 450, 32, ROLE.mark, 'mono', 'center').glow(
    7,
    ROLE.mark,
  );

  // Right metrics column (no boxed cards!)
  const mx = 185;
  const mseVal = s.value(RUN.mseStart);
  const mseLbl = txt('Training reconstruction MSE', mx, -280, 32, COSMOS.ink, 'sans', 'left');
  const mseGauge = dynamic(() => {
    const w = Math.max(6, (470 * mseVal.value) / RUN.mseStart);
    return [
      rule(mx, -215, mx + 470, -215, '#2b385a', 4),
      lumBar(mx + w / 2, -215, w, 28, {
        color: ROLE.residual,
        fillOpacity: 0.48,
        strokeWidth: 2.2,
        glow: 9,
        radius: 5,
      }),
      txt(mseVal.value.toFixed(3), mx + 635, -215, 36, ROLE.residual, 'mono', 'right').glow(
        7,
        ROLE.residual,
      ),
    ];
  });

  const supHead = txt('Mean active slots per example', mx, -95, 32, COSMOS.ink, 'sans', 'left');
  const supVal = txt(
    '18.9 train   ·   19.5 held out',
    mx,
    -40,
    32,
    ROLE.second,
    'mono',
    'left',
  ).glow(6, ROLE.second);
  const supGen = txt(
    'Generator used only 2 to 4 directions',
    mx,
    12,
    26,
    COSMOS.muted,
    'sans',
    'left',
  );

  const fvuTxt = txt(
    'Held-out FVU = 0.128 / 0.757 ≈ 0.169',
    mx,
    115,
    28,
    ROLE.other,
    'mono',
    'left',
  );

  const medHead = txt('Median best |cosine|', mx, 235, 32, COSMOS.ink, 'sans', 'left');
  const medVal = txt('0.798 → 0.799', mx, 305, 52, ROLE.other, 'mono', 'left').glow(9, ROLE.other);

  c.swap(
    'training-evidence-b1',
    [
      lab3d.view,
      lab3dCap,
      knownLbl,
      knownCells,
      widthLbl,
      widthCells,
      latLbl,
      latCells,
      rec1,
      rec2,
      rec3,
      omitLbl,
    ],
    [...chartNodes, ...startDots, ...keyStart, mseLbl, mseGauge],
  );
  playCue(s, c, 'training-endpoints', (d) => s.play(mseVal.to(RUN.mseEnd, { duration: d })), {
    dur: 1.4,
  });
  c.show('training-active-support', [supHead, supVal]);
  c.show('lab-denser', supGen);
  c.show('training-fvu-result', fvuTxt);
  c.show('training-alignment', [...endMarks, ...keyEnd, medHead, medVal]);
  c.show('lab-without', hitsBadge);

  const runGroup = [
    ...chartNodes,
    ...startDots,
    ...endMarks,
    ...keyStart,
    ...keyEnd,
    hitsBadge,
    mseLbl,
    mseGauge,
    supHead,
    supVal,
    supGen,
    fvuTxt,
    medHead,
    medVal,
  ];

  // --- Beat 2: Alignment compass (sign flip, dual-match, seed variance, width splitting) ---
  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
    showTicks: false,
    showGrid: false,
  });

  const truth1 = [1, 0];
  const truth2 = [Math.cos(0.7), Math.sin(0.7)];
  const turn = s.value(0);
  const spread = s.value(0);
  const learnedVec = () => [Math.cos(turn.value), Math.sin(turn.value)];
  const cosVal = () => vec.dot(learnedVec(), truth1);

  const compTruth1 = b.arrowOf([0, 0], truth1, ROLE.activation, { width: 8 });
  const compTruth2 = b.arrowOf([0, 0], truth2, ROLE.activation, { width: 8 });
  const compLearned = [-1, 0, 1].map((k) =>
    b.arrowOf(
      [0, 0],
      () => [Math.cos(turn.value + k * spread.value), Math.sin(turn.value + k * spread.value)],
      ROLE.second,
      { width: 6.5 },
    ),
  );
  const compOther = [1.9, 2.9, 4.4].map((ang) =>
    b.arrowOf([0, 0], [Math.cos(ang), Math.sin(ang)], ROLE.other, { width: 6 }),
  );

  const rx = 515;
  const signReads = dynamic(() => {
    const cv = cosVal();
    return [
      txt(
        `signed cosine:  ${cv.toFixed(2)}`,
        rx,
        -125,
        42,
        cv < 0 ? ROLE.wrong : ROLE.activation,
        'mono',
        'center',
      ),
      txt(
        `|cosine|:       ${Math.abs(cv).toFixed(2)}`,
        rx,
        -45,
        42,
        ROLE.mark,
        'mono',
        'center',
      ).glow(7, ROLE.mark),
    ];
  });
  const matchReads = dynamic(() => [
    txt(
      `match with known 1:  ${Math.abs(cosVal()).toFixed(2)}`,
      rx,
      -125,
      36,
      ROLE.second,
      'mono',
      'center',
    ),
    txt(
      `match with known 2:  ${Math.abs(vec.dot(learnedVec(), truth2)).toFixed(2)}`,
      rx,
      -55,
      36,
      ROLE.second,
      'mono',
      'center',
    ),
  ]);

  const diagNotes = [
    'Keep signed cosines & random-init controls',
    'Nonnegative code cannot write opposite sign',
    'One learned column can match multiple true dirs',
    'Different seeds find different dictionaries',
    'Wider SAEs split one concept across latents',
  ].map((str) => txt(str, rx, 85, 30, COSMOS.ink, 'sans', 'center'));

  const repHead = txt('Report full context:', rx, 220, 26, COSMOS.muted, 'sans', 'center');
  const repLine = txt(
    'width · data · compute · window · rare contexts',
    rx,
    275,
    26,
    ROLE.mark,
    'mono',
    'center',
  ).glow(6, ROLE.mark);

  c.swap('training-evidence-b2', runGroup, [
    b.node,
    compTruth1,
    compLearned[1],
    signReads,
    diagNotes[0],
  ]);
  playCue(s, c, 'ev-sign', (d) => s.play(turn.to(Math.PI, { duration: d })), {
    offset: 0.35,
    dur: 1.7,
  });
  c.swap('ev-sign', diagNotes[0], diagNotes[1], { lead: -2.2 });
  c.swap('ev-match', [diagNotes[1], signReads], [compTruth2, diagNotes[2], matchReads]);
  playCue(s, c, 'ev-match', (d) => s.play(turn.to(Math.PI * 2 + 0.35, { duration: d })), {
    offset: 0.3,
    dur: 1.5,
  });
  c.swap('ev-seeds', diagNotes[2], [...compOther, diagNotes[3]]);
  c.swap('ev-width', [diagNotes[3], ...compOther], [compLearned[0], compLearned[2], diagNotes[4]]);
  playCue(s, c, 'ev-width', (d) => s.play(spread.to(0.22, { duration: d })), {
    offset: 0.35,
    dur: 1.3,
  });
  c.show('ev-report', [repHead, repLine]);

  // --- Beat 3: Full-bleed Loss Recovered equation + interactive ruler + 3.05 GiB storage ---
  const ruler = glowLossRuler(s, { left: -760, right: 760, y: 20, ...LOSS });
  ruler.numbered.set(0);

  const lrEq = glowTex(
    '\\text{Loss Recovered} = 1 - \\frac{L_{\\text{rebuilt}} - L_{\\text{clean}}}{L_{\\text{ablated}} - L_{\\text{clean}}}',
    { x: -185, y: -235, size: 46, color: COSMOS.ink, glow: 6 },
  );
  const sh90 = txt('90%', 580, -235, 96, ROLE.residual, 'mono', 'center').glow(10, ROLE.residual);
  const sh95 = txt('95%', 580, -235, 96, ROLE.residual, 'mono', 'center').glow(10, ROLE.residual);

  const sameHookTxt = txt(
    'Measure all three losses at the exact same hooks & token positions',
    0,
    255,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );
  const togetherTxt = txt(
    'Report together:  raw losses · MSE · support · counterexamples · task effects',
    0,
    255,
    26,
    ROLE.mark,
    'mono',
    'center',
  );

  const storeSetup = txt(
    '200,000 float32 vectors × 4,096 width × 4 bytes',
    0,
    340,
    30,
    COSMOS.ink,
    'mono',
    'center',
  );
  const storeRes = txt(
    '≈ 3.05 GiB at one hook alone',
    0,
    410,
    46,
    ROLE.mark,
    'mono',
    'center',
  ).glow(9, ROLE.mark);

  const setNum = (n) => () => s.play(ruler.numbered.to(n, { duration: 0.01 }));

  c.swap(
    'training-evidence-b3',
    [b.node, compTruth1, compTruth2, ...compLearned, diagNotes[4], matchReads, repHead, repLine],
    [lrEq, ...ruler.axis, ruler.parts, sameHookTxt],
  );
  c.on('lr-clean', setNum(1));
  c.on('lr-sub', setNum(2));
  c.on('lr-abl', setNum(3));
  c.show('loss-recovery-first', sh90, { after: true, fade: 0.15 });
  c.hide('lr-change', sh90, { fade: 0.15, lead: -1.1 });
  playCue(s, c, 'lr-change', (d) => s.play(ruler.baseline.to(LOSS.later, { duration: d })), {
    offset: 1.4,
    dur: 1.7,
  });
  c.show('loss-recovery-second', sh95, { after: true });
  c.show('lr-damage', ruler.damage);

  c.swap('lr-zero', sh95, ruler.share);
  playCue(s, c, 'lr-zero', (d) => s.play(ruler.baseline.to(LOSS.clean, { duration: d })), {
    offset: 0.2,
    dur: 1.3,
  });
  c.on('lr-negative', () => {
    s.play(ruler.baseline.to(2.2, { duration: 0.65 }));
    s.wait(0.7);
    s.play(ruler.baseline.to(LOSS.ablated, { duration: 0.9 }));
  });
  c.swap('lr-report', sameHookTxt, togetherTxt);
  c.show('storage-setup', storeSetup);
  c.show('activation-storage', storeRes, { after: true });
}
