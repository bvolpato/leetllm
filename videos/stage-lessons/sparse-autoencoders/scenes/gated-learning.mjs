// Scene 7: gated-learning - "Separate detection from estimated magnitude"
// Left: Glowing 2D activation plane with live blue + pink reconstruction arrows and dashed
//       shared encoder rows / auxiliary gate reconstruction.
// Right: Two luminous stacked lanes (upper gold gate pre-activations + binary gate lamps,
//        lower full-size magnitude strip), then swaps to a glowing JumpReLU step-and-ramp
//        transfer curve with animated straight-through estimator window band.
import { assertEqual, dynamic, indicate, line } from 'vizmatic/stage';
import { encoderFixture } from '../../../films/sparse-autoencoders/model.mjs';
import {
  COSMOS,
  EXAMPLE_SLOTS,
  ROLE,
  cinemaAtmosphere,
  cinemaPlane,
  cinemaRebuild,
  code,
  dictionary,
  glowCodeStrip,
  glowDot,
  glowRing,
  glowTex,
  heroTitle,
  lumBar,
  playCue,
  rule,
  txt,
  vec,
} from '../parts.mjs';

const GATE_LEVEL = [0.9, 0.6, 0, 0, 0];
const GATE_ROW_SCALE = 0.6;
const THETA = 0.5;
const jumpRelu = (u, theta) => (u > theta ? u : 0);

export default function gatedLearning(s, c) {
  const encoder = encoderFixture();
  assertEqual(jumpRelu(code[1], THETA), code[1], 'JumpReLU keeps full size above threshold');

  const atmo = cinemaAtmosphere(ROLE.mark, ROLE.second);
  const title = heroTitle(['Separate detection from', 'estimated magnitude'], {
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

  const pre = s.value(code[1]);
  const theta = s.value(0);
  const secondVal = () => jumpRelu(pre.value, theta.value);

  const z = glowCodeStrip(s, {
    x: 515,
    y: -65,
    width: 640,
    height: 220,
    max: 2,
    colors: EXAMPLE_SLOTS,
    start: code,
    read: (i) => (i === 1 ? secondVal() : undefined),
  });
  const live = cinemaRebuild(b, () => [code[0], secondVal()]);

  s.add(
    atmo,
    title,
    b.node,
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

  const rx = 515;

  // --- Upper Gate Lane (gold pre-activations + glowing binary gate orbs) ---
  const pressure = s.value(0);
  const levelOf = (i) => GATE_LEVEL[i] * (1 - 0.75 * pressure.value);
  const gateFloor = -220;
  const gateRail = rule(195, gateFloor, 835, gateFloor, '#3b4a70', 2.5);
  const gateNodes = dynamic(() =>
    dictionary.flatMap((_, i) => {
      const lv = levelOf(i);
      const h = lv * 105;
      const gx = z.x(i);
      const lamp =
        lv > 0
          ? glowDot(gx + z.barWidth * 0.44, gateFloor - 20, {
              radius: 13,
              color: ROLE.activation,
              glow: 12,
            })
          : glowRing(gx + z.barWidth * 0.44, gateFloor - 20, 13, '#435275', {
              width: 2.5,
              glow: 0,
              fillOpacity: 0.05,
            });
      if (h < 2) return [lamp];
      return [
        lumBar(gx - z.barWidth * 0.18, gateFloor - h / 2, z.barWidth * 0.46, h, {
          color: ROLE.mark,
          fillOpacity: 0.42,
          strokeWidth: 2,
          glow: 8,
          radius: 5,
        }),
        lamp,
      ];
    }),
  );

  const gateLbl = txt('Gate pre-activation', 195, -360, 26, ROLE.mark, 'sans', 'left');
  const binLbl = txt('Orbs: binary gate', 835, -360, 26, COSMOS.ink, 'sans', 'right');
  const magLbl = txt('Magnitude lane', 835, -182, 26, ROLE.second, 'sans', 'right');
  const productEq = glowTex('z = \\text{gate} \\times \\text{magnitude}', {
    x: rx,
    y: 125,
    size: 42,
    color: COSMOS.ink,
    glow: 6,
  });

  c.show('gated-learning-b0', [gateRail, gateNodes, gateLbl, binLbl]);
  c.show('gated-magnitude', [magLbl, productEq]);

  // Shared projection directions with separate row scales
  const sharedRows = [0, 1].flatMap((i) => [
    b.arrowOf([0, 0], encoder.weights[i], EXAMPLE_SLOTS[i], { width: 4, dash: [13, 9] }),
    b.arrowOf([0, 0], vec.scale(encoder.weights[i], GATE_ROW_SCALE), ROLE.mark, { width: 6.5 }),
  ]);
  const sharedNote = txt(
    'Shared projection direction, separate row scales',
    rx,
    225,
    28,
    COSMOS.ink,
    'sans',
    'center',
  );
  c.show('gated-shared', [...sharedRows, sharedNote]);

  // L1 pressure hits gate lane only
  const l1Note = txt(
    'L1 presses on gate pre-activations only',
    rx,
    225,
    30,
    ROLE.mark,
    'sans',
    'center',
  ).glow(6, ROLE.mark);
  const untouched = txt(
    'Magnitude bar & pink arrow keep full size',
    rx,
    285,
    26,
    ROLE.second,
    'sans',
    'center',
  );
  c.swap('gated-l1', [...sharedRows, sharedNote], l1Note);
  playCue(s, c, 'gated-l1', (d) => s.play(pressure.to(1, { duration: d })), {
    offset: 0.35,
    dur: 2.2,
  });
  c.show('gated-l1', untouched, { lead: -0.7 });

  // Auxiliary gate reconstruction with frozen decoder output path
  const auxTip = (count) =>
    dictionary
      .slice(0, count)
      .reduce((sum, d, i) => vec.add(sum, vec.scale(d, levelOf(i))), [0, 0]);
  const auxPath = [
    b.arrowOf([0, 0], () => auxTip(1), ROLE.mark, { width: 4, dash: [10, 8] }),
    b.arrowOf(
      () => auxTip(1),
      () => auxTip(2),
      ROLE.mark,
      { width: 4, dash: [10, 8] },
    ),
    b.ringOf(() => auxTip(2), ROLE.mark, 15, 3.5),
  ];
  const auxNote = txt(
    'Auxiliary gate rebuild trains detection',
    rx,
    225,
    30,
    ROLE.mark,
    'sans',
    'center',
  );
  const frozen1 = txt('Decoder output path frozen', rx, 285, 26, ROLE.other, 'sans', 'center');
  const frozen2 = txt(
    '(centering bias path can still receive gradient)',
    rx,
    330,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  c.swap('gated-aux', [l1Note, untouched], [...auxPath, auxNote]);
  playCue(s, c, 'gated-aux', (d) => s.play(pressure.to(0.3, { duration: d })), {
    offset: 0.35,
    dur: 1.5,
  });
  c.show('gated-aux-stop', [frozen1, frozen2]);

  // --- Beat 1: No direct L1 on magnitude -> JumpReLU transfer curve & windowed STE ---
  const freeNote = txt('No direct L1 on magnitude lane', rx, 225, 30, COSMOS.ink, 'sans', 'center');
  c.swap('gated-learning-b1', [...auxPath, auxNote, frozen1, frozen2], freeNote);
  playCue(
    s,
    c,
    'gated-learning-b1',
    (d) => s.play(indicate(magLbl, { color: ROLE.mark, scale: 1.2, duration: d })),
    { dur: 0.7 },
  );

  // Glowing JumpReLU transfer plot in lower right (x: 0..1.5, y: 0..1.5)
  const pLeft = 225;
  const pRight = 565;
  const pTop = 105;
  const pBottom = 385;
  const toPlot = (vx, vy) => [
    pLeft + (vx / 1.5) * (pRight - pLeft),
    pBottom - (vy / 1.5) * (pBottom - pTop),
  ];

  const jumpAxes = [
    rule(pLeft, pBottom, pRight, pBottom, '#4c608d', 2.5),
    rule(pLeft, pBottom, pLeft, pTop, '#4c608d', 2.5),
    ...[0, 0.5, 1.0, 1.5].flatMap((v) => {
      const [sx] = toPlot(v, 0);
      return [
        line([sx, pBottom], [sx, pBottom + 8], { stroke: '#4c608d', width: 2 }),
        txt(v === 0 ? '0' : v.toFixed(1), sx, pBottom + 32, 26, COSMOS.dim, 'mono', 'center'),
      ];
    }),
    ...[0.5, 1.0, 1.5].flatMap((v) => {
      const [, sy] = toPlot(0, v);
      return [
        line([pLeft - 8, sy], [pLeft, sy], { stroke: '#4c608d', width: 2 }),
        txt(v.toFixed(1), pLeft - 18, sy, 26, COSMOS.dim, 'mono', 'right'),
      ];
    }),
    txt('pre-activation u', (pLeft + pRight) / 2, pBottom + 68, 26, COSMOS.muted, 'sans', 'center'),
    txt('JumpReLU(u)', pLeft, pTop - 24, 26, ROLE.second, 'mono', 'left'),
  ];

  const bandW = s.value(0);
  const steWindow = dynamic(() => {
    if (bandW.value < 0.01) return [];
    const l = toPlot(Math.max(0, theta.value - bandW.value / 2), 0);
    const r = toPlot(Math.min(1.5, theta.value + bandW.value / 2), 1.5);
    return [
      lumBar(
        (l[0] + r[0]) / 2,
        (l[1] + r[1]) / 2,
        Math.max(4, r[0] - l[0]),
        Math.max(4, l[1] - r[1]),
        {
          color: ROLE.mark,
          fillOpacity: 0.2,
          strokeWidth: 1.8,
          glow: 6,
          radius: 4,
        },
      ),
    ];
  });

  const transfer = dynamic(() => {
    const th = theta.value;
    const [ox, oy] = toPlot(0, 0);
    const [tx, ty0] = toPlot(th, 0);
    const [, ty1] = toPlot(th, th);
    const [ex, ey] = toPlot(1.5, 1.5);
    const [px, py] = toPlot(pre.value, secondVal());
    return [
      line([ox, oy], [tx, ty0], { stroke: ROLE.second, width: 5.5 }).glow(8, ROLE.second),
      line([tx, ty1], [ex, ey], { stroke: ROLE.second, width: 5.5 }).glow(8, ROLE.second),
      line([tx, ty0], [tx, ty1], { stroke: ROLE.mark, width: 3, dash: [8, 7] }),
      glowDot(px, py, { radius: 9, color: ROLE.activation, glow: 14 }),
    ];
  });

  const thetaReadout = dynamic(() =>
    txt(`θ = ${theta.value.toFixed(2)}`, 720, 175, 38, ROLE.mark, 'mono', 'center').glow(
      7,
      ROLE.mark,
    ),
  );
  const activeL0 = dynamic(() =>
    txt(`L₀ = ${1 + (secondVal() > 0 ? 1 : 0)} active`, 720, 265, 34, COSMOS.ink, 'mono', 'center'),
  );
  const steLbl = txt('Windowed STE', 720, 340, 26, ROLE.mark, 'sans', 'center');

  // Floating matched-comparison criteria in upper right (zero boxed cards!)
  const matchHead = txt(
    'Compare architectures at matched:',
    rx,
    -340,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );
  const matchItems = [
    txt('data  ·  width  ·  sparsity  ·  compute', rx, -285, 30, ROLE.mark, 'mono', 'center').glow(
      6,
      ROLE.mark,
    ),
  ];

  c.swap(
    'jump-instead',
    [freeNote, productEq, gateRail, gateNodes, gateLbl, binLbl, magLbl],
    [...jumpAxes, steWindow, transfer, thetaReadout],
  );
  c.on('jump-instead', () => s.play(theta.to(THETA, { duration: 0.01 })));
  c.on('jump-threshold', () => {
    s.play(pre.to(0.3, { duration: 1.3 }));
    s.wait(0.35);
    s.play(pre.to(code[1], { duration: 1.3 }));
  });
  c.show('jump-l0', activeL0);
  c.on('jump-zero', () => {
    s.play(theta.to(THETA + 0.2, { duration: 0.9 }));
    s.play(theta.to(THETA, { duration: 0.9 }));
  });
  c.show('jump-window', steLbl);
  playCue(s, c, 'jump-window', (d) => s.play(bandW.to(0.24, { duration: d })), { dur: 0.8 });
  c.on('jump-bandwidth', () => {
    s.play(bandW.to(0.6, { duration: 0.8 }));
    s.play(bandW.to(0.1, { duration: 0.8 }));
    s.play(bandW.to(0.24, { duration: 0.5 }));
  });
  c.show('jump-matched', [matchHead, ...matchItems]);
}
