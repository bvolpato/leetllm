// Scene 14: Move weights, then check the margin: output-space derivatives vs shared-weight co-movement.
import {
  COSMOS,
  SHARED_FEATS,
  SHARED_GRAD,
  SHARED_LR,
  SHARED_MARGIN0,
  SHARED_MARGIN1,
  SHARED_SCORES0,
  SHARED_SCORES1,
  SHARED_W0,
  SHARED_W1,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  sigmoid,
  txt,
} from '../parts.mjs';

export default function scoreGradients(s, c) {
  const phase = s.value(0);
  const showChosenGrad = s.value(0.45);
  const showRejGrad = s.value(0.25);
  const outStep = s.value(0);
  const showSharedGrad = s.value(0);
  const sharedStep = s.value(0);
  const showResult = s.value(0);

  const bgAura = aura(150, 20, 560, '#5ce1e620', '#a78bfa18');
  const title = heroTitle(['Shared Weights,', 'Moving Margins'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SCORE DERIVATIVES  VS  SHARED PARAMETER STEP',
  });

  const eq = glowTex(
    String.raw`\frac{\partial\mathcal{L}}{\partial r_w} = \sigma(\Delta) - 1, \qquad \frac{\partial\mathcal{L}}{\partial r_l} = 1 - \sigma(\Delta)`,
    { x: 310, y: -365, size: 32, color: COSMOS.gold },
  );

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const cg = showChosenGrad.value;
    const rg = showRejGrad.value;
    const os = outStep.value;
    const sg = showSharedGrad.value;
    const ss = sharedStep.value;
    const sr = showResult.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    // Top track: Independent output-space descent from margin -2 (r_w = -1, r_l = +1)
    const outX0 = -760;
    const outX1 = -80;
    const outY = -50;
    const mapOut = (v) => outX0 + ((v - -2.0) / 4.0) * (outX1 - outX0);
    const outRw = -1.0 + os * 0.55;
    const outRl = 1.0 - os * 0.55;
    const outMag = 1 - sigmoid(-2);

    // Right track: Shared weight w = -1 -> -1.0269 on h = [1, 2]
    const shX0 = 120;
    const shX1 = 810;
    const shY = 75;
    const mapSh = (v) => shX0 + ((v - -2.35) / 1.65) * (shX1 - shX0);
    const curW = SHARED_W0 + (SHARED_W1 - SHARED_W0) * ss;
    const curRW = curW * SHARED_FEATS[0];
    const curRL = curW * SHARED_FEATS[1];
    const curMargin = curRW - curRL;

    const nodes = [
      // Left panel geometry: Output-space opposing derivatives (no card chrome)
      txt('OUTPUT-SPACE DERIVATIVES (Δ = -2)', -855, -185, 26, COSMOS.cyan, 'mono', 'left'),
      line([outX0, outY], [outX1, outY], { stroke: '#455885', width: 2.8 }),
      ...[-2, -1, 0, 1, 2].map((v) =>
        group(
          line([mapOut(v), outY - 7], [mapOut(v), outY + 7], { stroke: '#5a6f9c', width: 2 }),
          txt(String(v), mapOut(v), outY + 34, 26, COSMOS.muted, 'mono'),
        ),
      ),
      // Chosen score moving RIGHT (+grad descent)
      glowingTrail(
        [
          [mapOut(outRw), outY - 46],
          [mapOut(outRw) + 110 * cg, outY - 46],
        ],
        { color: COSMOS.emerald, width: 4.4, opacity: Math.max(0.45, cg) },
      ),
      glowDot(mapOut(outRw), outY, { radius: 10, color: COSMOS.emerald }),
      txt('r_w ↑', mapOut(outRw), outY - 76, 26, COSMOS.emerald, 'mono'),

      // Rejected score moving LEFT (-grad descent)
      glowingTrail(
        [
          [mapOut(outRl), outY - 46],
          [mapOut(outRl) - 110 * rg, outY - 46],
        ],
        { color: COSMOS.rose, width: 4.4, opacity: Math.max(0.45, rg) },
      ),
      glowDot(mapOut(outRl), outY, { radius: 10, color: COSMOS.rose }),
      txt('r_l ↓', mapOut(outRl), outY - 76, 26, COSMOS.rose, 'mono'),

      txt(
        `|∂L/∂r| = ${outMag.toFixed(2)}  ·  independent step narrows wrong gap`,
        -855,
        55,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),

      // Lower-left shared parameter arithmetic chain
      txt('SHARED WEIGHT UPDATE', -855, 160, 26, COSMOS.violet, 'mono', 'left'),
      txt(
        `w₀ = ${SHARED_W0.toFixed(1)},  h = [${SHARED_FEATS[0]}, ${SHARED_FEATS[1]}],  η = ${SHARED_LR}`,
        -855,
        212,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(`∂L/∂w = +${SHARED_GRAD.toFixed(3)}`, -855, 270, 32, COSMOS.amber, 'mono', 'left')
        .glow(6, COSMOS.amber)
        .opacity(Math.max(0.4, sg)),
      txt(
        `w₁ = -1 - 0.1(0.269) = ${SHARED_W1.toFixed(3)}`,
        -855,
        330,
        30,
        COSMOS.violet,
        'mono',
        'left',
      )
        .glow(6, COSMOS.violet)
        .opacity(Math.max(0.4, ss)),
      txt(
        `Margin: ${SHARED_MARGIN0.toFixed(3)} → ${SHARED_MARGIN1.toFixed(4)}  (widens!)`,
        -855,
        395,
        30,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(7, COSMOS.emerald)
        .opacity(Math.max(0.35, sr)),

      // Right side: Live co-movement number line showing BOTH scores moving LEFT
      txt('SHARED BACKPROP: BOTH SCORES FALL', shX0, -185, 26, COSMOS.violet, 'mono', 'left'),
      txt(`w = ${curW.toFixed(4)}`, shX0, -130, 44, COSMOS.violet, 'mono', 'left').glow(
        7,
        COSMOS.violet,
      ),
      line([shX0, shY], [shX1, shY], { stroke: '#455885', width: 3 }),
      ...[-2.2, -2.0, -1.5, -1.0].map((v) =>
        group(
          line([mapSh(v), shY - 8], [mapSh(v), shY + 8], { stroke: '#5a6f9c', width: 2 }),
          txt(v.toFixed(1), mapSh(v), shY + 40, 26, COSMOS.muted, 'mono'),
        ),
      ),

      // Ghost original positions at -1.0 and -2.0
      circle(8, { fill: null, stroke: COSMOS.emerald, width: 2 })
        .at(mapSh(SHARED_SCORES0[0]), shY)
        .opacity(0.55),
      circle(8, { fill: null, stroke: COSMOS.rose, width: 2 })
        .at(mapSh(SHARED_SCORES0[1]), shY)
        .opacity(0.55),

      // Glowing margin span connecting current r_l to current r_w
      glowingTrail(
        [
          [mapSh(curRL), shY],
          [mapSh(curRW), shY],
        ],
        { gradientColors: [COSMOS.rose, COSMOS.gold, COSMOS.emerald], width: 6, glow: 10 },
      ),
      glowDot(mapSh(curRW), shY, { radius: 11, color: COSMOS.emerald }),
      glowDot(mapSh(curRL), shY, { radius: 11, color: COSMOS.rose }),
      txt(`r_w = ${curRW.toFixed(3)}`, mapSh(curRW), shY - 46, 28, COSMOS.emerald, 'mono'),
      txt(`r_l = ${curRL.toFixed(3)}`, mapSh(curRL), shY - 46, 28, COSMOS.rose, 'mono'),

      // Margin readout below right axis
      txt(
        `Δ = ${curMargin.toFixed(4)}`,
        (mapSh(curRL) + mapSh(curRW)) * 0.5,
        shY + 125,
        42,
        COSMOS.gold,
        'mono',
      ).glow(8 * pulse, COSMOS.gold),
      txt(
        ss > 0.5 ? 'Rejected fell 2× farther (-0.054 vs -0.027)' : 'Both outputs share parameter w',
        (shX0 + shX1) * 0.5,
        shY + 195,
        28,
        ss > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('score-gradients-b1-1', () => s.play(showChosenGrad.to(1, { duration: 0.35 })));
  c.on('score-gradients-b1-2', () => s.play(showRejGrad.to(1, { duration: 0.35 })));
  c.on('output-descent', () => s.play(outStep.to(1, { duration: 0.65 })));
  c.on('shared-gradient', () => s.play(showSharedGrad.to(1, { duration: 0.45 })));
  c.on('shared-update', () => s.play(sharedStep.to(1, { duration: 0.7 })));
  c.on('shared-result', () =>
    s.play(showResult.to(1, { duration: remainDuration(c, 'shared-result', 0.45) })),
  );
}
