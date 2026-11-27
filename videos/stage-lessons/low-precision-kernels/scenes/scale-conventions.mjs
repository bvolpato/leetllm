// Scene 08: Which way does the scale go? Reciprocal conventions (S vs alpha=1/S), zero-group guard, and K-block factoring.
import {
  COSMOS,
  STALE_RT,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function scaleConventions(s, c) {
  const showConvA = s.value(0.5);
  const showConvB = s.value(0);
  const showIdeal = s.value(0);
  const showZero = s.value(0);
  const showFactor = s.value(0);

  const bgAura = aura(100, 20, 620, '#5ce1e61e', '#a78bfa18');
  const title = heroTitle(['Which Way Does', 'the Scale Go?'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.cyan,
    eyebrow: 'SCALE CONVENTIONS · ZERO GUARD · FACTORING',
  });

  const eqA = glowTex(String.raw`q = Q(x / S),\quad \hat{x} = S \cdot q`, {
    x: 420,
    y: -360,
    size: 36,
    color: COSMOS.cyan,
  });

  const live = guardedDynamic(1, () => {
    const ca = showConvA.value;
    const cb = showConvB.value;
    const idl = showIdeal.value;
    const zr = showZero.value;
    const fc = showFactor.value;

    const nodes = [];

    // Convention A row (Reconstruction scale S = 10/448)
    const yA = -155;
    nodes.push(
      txt(
        'CONVENTION A · RECONSTRUCTION SCALE S = 10/448',
        -855,
        yA - 72,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(ca),
      glassCell(-700, yA, 290, 92, COSMOS.blue, { fill: '#101a2e', glow: 6, opacity: ca }),
      txt('x = 500', -700, yA, 32, COSMOS.ink, 'mono').opacity(ca),
      glowingArc([-552, yA], [-312, yA], -24, {
        color: COSMOS.cyan,
        width: 3.2,
        opacity: 0.9 * ca,
      }),
      txt('÷ S', -432, yA - 40, 28, COSMOS.cyan, 'mono').opacity(ca),
      glassCell(-140, yA, 340, 92, COSMOS.gold, { fill: '#1d1912', glow: 7, opacity: ca }),
      txt(`q = ${STALE_RT.value} (0x7e)`, -140, yA, 30, COSMOS.gold, 'mono').opacity(ca),
      glowingArc([32, yA], [272, yA], -24, { color: COSMOS.cyan, width: 3.2, opacity: 0.9 * ca }),
      txt('× S', 152, yA - 40, 28, COSMOS.cyan, 'mono').opacity(ca),
      glassCell(515, yA, 480, 92, COSMOS.emerald, { fill: '#0e2224', glow: 7, opacity: ca }),
      txt(
        `x̂ = 448 × (10/448) = ${STALE_RT.reconstructed}`,
        515,
        yA,
        30,
        COSMOS.emerald,
        'mono',
      ).opacity(ca),
    );

    // Convention B row (Inverse / reciprocal scale alpha = 448/10)
    const yB = 38;
    const opB = 0.2 + 0.8 * cb;
    nodes.push(
      txt(
        'CONVENTION B · RECIPROCAL SCALE α = 1/S = 448/10',
        -855,
        yB - 72,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(opB),
      glassCell(-700, yB, 290, 92, COSMOS.blue, { fill: '#101a2e', glow: 6, opacity: opB }),
      txt('x = 500', -700, yB, 32, COSMOS.ink, 'mono').opacity(opB),
      glowingArc([-552, yB], [-312, yB], 24, {
        color: COSMOS.gold,
        width: 3.2,
        opacity: 0.9 * opB,
      }),
      txt('× α', -432, yB + 40, 28, COSMOS.gold, 'mono').opacity(opB),
      glassCell(-140, yB, 340, 92, COSMOS.gold, { fill: '#1d1912', glow: 7, opacity: opB }),
      txt(`q = ${STALE_RT.value} (0x7e)`, -140, yB, 30, COSMOS.gold, 'mono').opacity(opB),
      glowingArc([32, yB], [272, yB], 24, { color: COSMOS.gold, width: 3.2, opacity: 0.9 * opB }),
      txt('÷ α', 152, yB + 40, 28, COSMOS.gold, 'mono').opacity(opB),
      glassCell(515, yB, 480, 92, COSMOS.emerald, { fill: '#0e2224', glow: 7, opacity: opB }),
      txt(
        `x̂ = 448 ÷ (448/10) = ${STALE_RT.reconstructed}`,
        515,
        yB,
        30,
        COSMOS.emerald,
        'mono',
      ).opacity(opB),
    );

    // Bottom left: Ideal formula + all-zero guard (Beat 1)
    const opZ = 0.18 + 0.82 * Math.max(idl, zr);
    nodes.push(
      glassCell(-435, 300, 820, 210, zr > 0.5 ? COSMOS.amber : COSMOS.blue, {
        fill: '#12182b',
        glow: 8,
        opacity: opZ,
      }),
      txt('CHOOSING SCALE & ALL-ZERO GUARD', -435, 232, 26, COSMOS.amber, 'mono').opacity(opZ),
      txt('amax > 0 : S = amax/448  (α = 448/amax)', -435, 290, 26, COSMOS.ink, 'mono').opacity(
        opZ,
      ),
      txt(
        zr > 0.5
          ? 'amax = 0 : set S = 1.0 → every 0 stays 0'
          : 'amax = 0 : 1/amax would divide by zero',
        -435,
        348,
        26,
        zr > 0.5 ? COSMOS.emerald : COSMOS.rose,
        'mono',
      ).opacity(opZ),
    );

    // Bottom right: Constant vs K-varying scale factoring (Beat 2)
    const opF = 0.18 + 0.82 * fc;
    nodes.push(
      glassCell(435, 300, 820, 210, fc > 0.5 ? COSMOS.emerald : COSMOS.dim, {
        fill: '#0e1d26',
        glow: fc > 0.5 ? 9 : 3,
        opacity: opF,
      }),
      txt('SCALE PLACEMENT IN A DOT PRODUCT', 435, 232, 26, COSMOS.emerald, 'mono').opacity(opF),
      txt('Fixed K : (S_x·S_w) Σ q_x q_w  (outside)', 435, 290, 26, COSMOS.cyan, 'mono').opacity(
        opF,
      ),
      txt('Block K : Σ_b (S_xb·S_wb) Σ_k q_x q_w', 435, 348, 26, COSMOS.gold, 'mono').opacity(opF),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqA, live);

  c.on('lp-scale-conventions-build-0', () =>
    s.play(showConvA.to(1, { duration: remainDuration(c, 'lp-scale-conventions-build-0', 0.45) })),
  );
  c.on('lp-scale-conventions-reciprocal', () =>
    s.play(
      showConvB.to(1, { duration: remainDuration(c, 'lp-scale-conventions-reciprocal', 0.5) }),
    ),
  );
  c.on('lp-scale-conventions-build-1', () =>
    s.play(showIdeal.to(1, { duration: remainDuration(c, 'lp-scale-conventions-build-1', 0.45) })),
  );
  c.on('lp-scale-conventions-zero', () =>
    s.play(showZero.to(1, { duration: remainDuration(c, 'lp-scale-conventions-zero', 0.45) })),
  );
  c.on('lp-scale-conventions-build-2', () =>
    s.play(showFactor.to(1, { duration: remainDuration(c, 'lp-scale-conventions-build-2', 0.5) })),
  );
}
