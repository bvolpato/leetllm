// Scene 07: Addition order can change a rounded result. Dual glowing FP32 reduction trees with MathJax equations.
import {
  COSMOS,
  LEFT,
  RIGHT,
  aura,
  evalArc2d,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function floatingPointOrder(s, c) {
  const phase = s.value(0);
  const showInputs = s.value(1);
  const showLeftTree = s.value(0);
  const showRightRound = s.value(0);
  const showRightZero = s.value(0);
  const showConclusion = s.value(0);

  const bgAura = aura(0, 10, 620, '#5ce1e61e', '#ff6b8b1a');
  const title = heroTitle(['FP32 Rounding', 'Breaks Associativity'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'IEEE-754 FLOAT32 · REDUCTION ORDER',
  });

  // Glowing MathJax input header & dual grouping equations
  const eqInputs = glowTex('a = 10^{20},\\quad b = -10^{20},\\quad r = 3.14', {
    x: 240,
    y: -365,
    size: 40,
    color: COSMOS.gold,
    glow: 7,
  });

  const eqLeft = glowTex(
    '\\operatorname{fl}_{32}(\\operatorname{fl}_{32}(a + b) + r) \\approx 3.14',
    {
      x: -440,
      y: -175,
      size: 36,
      color: COSMOS.emerald,
      glow: 6,
    },
  );

  const eqRight = glowTex('\\operatorname{fl}_{32}(a + \\operatorname{fl}_{32}(b + r)) = 0', {
    x: 440,
    y: -175,
    size: 36,
    color: COSMOS.rose,
    glow: 6,
  });

  const live = guardedDynamic(showInputs, () => {
    const p = phase.value;
    const lt = showLeftTree.value;
    const rr = showRightRound.value;
    const rz = showRightZero.value;
    const cn = showConclusion.value;
    const u = (p * 0.85) % 1;

    const nodes = [
      // Subtle center vertical split between the two reduction trees
      line([0, -235], [0, 310], { stroke: '#253355', width: 2, dash: [8, 8] }).opacity(0.65),
    ];

    // LEFT TREE: (10^20 + -10^20) -> 0, then 0 + 3.14 -> 3.14
    const lxA = -700;
    const lxB = -440;
    const lxR = -180;
    const lyTop = -60;
    const lyMid = 95;
    const lyBot = 245;

    nodes.push(
      txt('TREE A: PAIR LARGE VALUES FIRST', -440, -238, 26, COSMOS.cyan, 'mono'),
      txt('TREE B: ADD RESIDUAL FIRST', 440, -238, 26, COSMOS.rose, 'mono'),
      glassCell(lxA, lyTop, 185, 76, COSMOS.blue, { fill: '#101d38', glow: 6 }),
      txt('10²⁰', lxA, lyTop, 32, COSMOS.blue, 'mono'),
      glassCell(lxB, lyTop, 185, 76, COSMOS.blue, { fill: '#101d38', glow: 6 }),
      txt('−10²⁰', lxB, lyTop, 32, COSMOS.blue, 'mono'),
      glassCell(lxR, lyTop, 185, 76, COSMOS.gold, { fill: '#241c10', glow: 6 }),
      txt('3.14', lxR, lyTop, 32, COSMOS.gold, 'mono'),
    );

    if (lt < 0.05) {
      nodes.push(
        glassCell((lxA + lxB) * 0.5, lyMid, 210, 76, COSMOS.dim, {
          fill: '#0f1422',
          dash: [7, 5],
          glow: 0,
        }),
        txt('a + b', (lxA + lxB) * 0.5, lyMid, 28, COSMOS.muted, 'mono'),
        glassCell(-440, lyBot, 270, 84, COSMOS.dim, {
          fill: '#0f1422',
          dash: [7, 5],
          glow: 0,
        }),
        txt('sum A = ?', -440, lyBot, 30, COSMOS.muted, 'mono'),
      );
    }

    if (lt > 0.02) {
      const mx = (lxA + lxB) * 0.5;
      nodes.push(
        glowingArc([lxA, lyTop + 42], [mx, lyMid - 42], 12, {
          color: COSMOS.cyan,
          width: 3.6,
          opacity: lt,
          core: false,
        }),
        glowingArc([lxB, lyTop + 42], [mx, lyMid - 42], 12, {
          color: COSMOS.cyan,
          width: 3.6,
          opacity: lt,
          core: false,
        }),
        glassCell(mx, lyMid, 210, 76, COSMOS.cyan, { fill: '#0e2234', glow: 9, opacity: lt }),
        txt('0.0', mx, lyMid, 36, COSMOS.cyan, 'mono').opacity(lt),

        glowingArc([mx, lyMid + 42], [-440, lyBot - 42], 14, {
          color: COSMOS.emerald,
          width: 4,
          opacity: lt,
          core: false,
        }),
        glowingArc([lxR, lyTop + 42], [-440, lyBot - 42], 24, {
          color: COSMOS.emerald,
          width: 4,
          opacity: lt,
          core: false,
        }),
        glassCell(-440, lyBot, 270, 84, COSMOS.emerald, {
          fill: '#0d2824',
          glow: 11,
          opacity: lt,
        }),
        txt(`≈ ${LEFT.toFixed(2)}`, -440, lyBot, 42, COSMOS.emerald, 'mono')
          .glow(8, COSMOS.emerald)
          .opacity(lt),
      );
      const [px, py] = evalArc2d([lxR, lyTop + 42], [-440, lyBot - 42], 24, u);
      nodes.push(glowDot(px, py, { radius: 6.5, color: COSMOS.emerald, opacity: lt }));
    }

    // RIGHT TREE: (-10^20 + 3.14) -> -10^20 (rounded away!), then 10^20 + (-10^20) -> 0
    const rxA = 180;
    const rxB = 440;
    const rxR = 700;

    nodes.push(
      glassCell(rxA, lyTop, 185, 76, COSMOS.blue, { fill: '#101d38', glow: 6 }),
      txt('10²⁰', rxA, lyTop, 32, COSMOS.blue, 'mono'),
      glassCell(rxB, lyTop, 185, 76, COSMOS.blue, { fill: '#101d38', glow: 6 }),
      txt('−10²⁰', rxB, lyTop, 32, COSMOS.blue, 'mono'),
      glassCell(rxR, lyTop, 185, 76, COSMOS.gold, { fill: '#241c10', glow: 6 }),
      txt('3.14', rxR, lyTop, 32, COSMOS.gold, 'mono'),
    );

    if (rr < 0.05) {
      nodes.push(
        glassCell((rxB + rxR) * 0.5, lyMid, 240, 76, COSMOS.dim, {
          fill: '#0f1422',
          dash: [7, 5],
          glow: 0,
        }),
        txt('b + r', (rxB + rxR) * 0.5, lyMid, 28, COSMOS.muted, 'mono'),
        glassCell(440, lyBot, 270, 84, COSMOS.dim, {
          fill: '#0f1422',
          dash: [7, 5],
          glow: 0,
        }),
        txt('sum B = ?', 440, lyBot, 30, COSMOS.muted, 'mono'),
      );
    }

    if (rr > 0.02) {
      const mx = (rxB + rxR) * 0.5;
      nodes.push(
        glowingArc([rxB, lyTop + 42], [mx, lyMid - 42], 12, {
          color: COSMOS.rose,
          width: 3.6,
          opacity: rr,
          core: false,
        }),
        glowingArc([rxR, lyTop + 42], [mx, lyMid - 42], 12, {
          color: COSMOS.rose,
          width: 3.6,
          opacity: rr,
          core: false,
        }),
        glassCell(mx, lyMid, 290, 76, COSMOS.rose, { fill: '#28101c', glow: 9, opacity: rr }),
        txt('−10²⁰ (3.14 lost)', mx, lyMid, 28, COSMOS.rose, 'mono').opacity(rr),
      );
      if (rz > 0.02) {
        nodes.push(
          glowingArc([rxA, lyTop + 42], [440, lyBot - 42], 24, {
            color: COSMOS.rose,
            width: 4,
            opacity: rz,
            core: false,
          }),
          glowingArc([mx, lyMid + 42], [440, lyBot - 42], 14, {
            color: COSMOS.rose,
            width: 4,
            opacity: rz,
            core: false,
          }),
          glassCell(440, lyBot, 270, 84, COSMOS.rose, { fill: '#2a101d', glow: 11, opacity: rz }),
          txt(`= ${RIGHT}`, 440, lyBot, 42, COSMOS.rose, 'mono').glow(8, COSMOS.rose).opacity(rz),
        );
        const [px, py] = evalArc2d([rxA, lyTop + 42], [440, lyBot - 42], 24, (u + 0.5) % 1);
        nodes.push(glowDot(px, py, { radius: 6.5, color: COSMOS.rose, opacity: rz }));
      }
    }

    const footCol = cn > 0.5 ? COSMOS.gold : COSMOS.cyan;
    const footText =
      cn > 0.5
        ? 'Both trees are race-free · Validate against tolerances when tile size or layout changes'
        : 'FP32 rounds every intermediate step · 10²⁰ and 3.14 sit 20 orders of magnitude apart';
    nodes.push(
      glassCell(0, 392, 1520, 82, footCol, { fill: '#141724', glow: 8 }),
      txt(footText, 0, 392, 28, footCol, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqInputs, live);
  runPhase(s, c, phase, 14);

  c.on('floating-point-order-beat-1-focus-1', () => s.play(showInputs.to(1, { duration: 0.3 })));
  c.show('floating-point-order-beat-2-focus-1', eqLeft, { fade: 0.35 });
  c.on('floating-point-order-beat-2-focus-1', () => {
    s.play(showLeftTree.to(1, { duration: 0.5 }));
  });
  c.on('floating-residual-rounds-away', () => {
    s.play(showRightRound.to(1, { duration: 0.5 }));
  });
  c.show('floating-next-addition-zero', eqRight, { fade: 0.35 });
  c.on('floating-next-addition-zero', () => {
    s.play(showRightZero.to(1, { duration: 0.45 }));
  });
  c.on('floating-point-order-beat-3-focus-1', () =>
    s.play(
      showConclusion.to(1, {
        duration: remainDuration(c, 'floating-point-order-beat-3-focus-1', 0.45),
      }),
    ),
  );
}
