// Scene 9: general-allocation: "When do the two gains balance?"
// SIGNATURE 3D SCENE: Orbiting 3D Chinchilla iso-loss power-law surface L(N,D) = E + A/N^a + B/D^b
// with compute-optimal ridge curve (cinematic3d + surface + curve3d + orbitScene) on the right,
// paired with a 4-act swapVis progression on the left:
//   Act 1 (Beats 0-1): 1% exchange at N=10 -> 10.1 & exact first-order balance alpha*A*N^-a = beta*B*D^-b.
//   Act 2 (Beat 2): Closed-form growth exponents N* ~ C^(b/(a+b)), D* ~ C^(a/(a+b)) (0.45 / 0.55).
//   Act 3 (Beat 3): 1M budget, equal exponents (0.5/0.5), B: 2 -> 8 shifts 1000x1000 -> 250x4000 (16:1).
//   Act 4 (Beat 4): 20:1 Chinchilla sizing at 10^24 FLOPs -> 91.3B params, 1.83T tokens.
import {
  COSMOS,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  allocationOptimum,
  buildLossSurface3d,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  swapVis,
} from '../parts.mjs';

export default function generalAllocation(s, c) {
  const title = heroTitle(['When do the two', 'gains balance?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.compute,
  });

  // Right-side orbiting 3D Chinchilla iso-loss power-law surface with optimal ridge
  const { view3d } = buildLossSurface3d({
    xPos: 470,
    yPos: -25,
    unit: 96,
    distance: 15.6,
    theta: -0.84,
    phi: 1.04,
    A: 2.0,
    B: 2.0,
    alpha: 0.5,
    beta: 0.5,
    beacons: [
      { u: 0.0, v: 0.0, color: ROLE.compute, radius: 8.5 },
      { u: -1.1, v: -1.1, color: ROLE.tokens, radius: 6.5 },
      { u: 1.1, v: 1.1, color: ROLE.optimal, radius: 6.5 },
    ],
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const act3Vis = s.value(0);
  const act4Vis = s.value(0);

  const step1Pct = s.value(0); // sl-general-allocation-0: N 10 -> 10.1
  const balanceVis = s.value(0); // sl-general-allocation-1
  const expSweep = s.value(0); // sl-general-allocation-2
  const coefShift = s.value(0); // sl-general-allocation-3: B 2 -> 8
  const scaleReveal = s.value(0); // sl-general-allocation-4

  // Act 1 (Beats 0-1): 1% exchange at N=10 -> exact log-derivative balance
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const nVal = 10 * (1 + 0.01 * step1Pct.value);
    const dVal = 100 / nVal;
    const pN = 2 / Math.sqrt(nVal);
    const pD = 2 / Math.sqrt(dVal);
    const p0 = 2 / Math.sqrt(10);
    const delta = pN + pD - 2 * p0;
    const bv = balanceVis.value;

    const barLeft = -830;
    const maxW = 540;

    nodes.push(
      txt('1% exchange on N × D = 100', barLeft, -245, 32, ROLE.tokens, 'mono', 'left')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
      txt(
        `N = ${fmt(nVal, 2)}   ·   D = ${fmt(dVal, 3)}`,
        barLeft,
        -190,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
    );

    const rows = [
      { label: 'Parameter penalty  2/√N', val: pN, col: ROLE.params, y: -95 },
      { label: 'Data penalty       2/√D', val: pD, col: ROLE.tokens, y: 65 },
    ];
    rows.forEach((r) => {
      const w = (r.val / 0.8) * maxW;
      nodes.push(
        txt(r.label, barLeft, r.y - 44, 26, r.col, 'mono', 'left').opacity(alpha),
        lumBar(barLeft + w / 2, r.y + 8, w, 52, {
          color: r.col,
          fillOpacity: 0.4,
          strokeWidth: 2.5,
          glow: 9,
          opacity: alpha,
        }),
        txt(
          `${fmt(p0, 5)}  ->  ${fmt(r.val, 5)}`,
          barLeft,
          r.y + 62,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    if (bv > 0.05) {
      nodes.push(
        txt(`α(A/N^α) = β(B/D^β) ≈ 0.3162`, barLeft, 225, 30, ROLE.compute, 'mono', 'left')
          .glow(7, ROLE.compute)
          .opacity(bv * alpha),
        txt(
          `Net 1% change: +${fmt(delta, 6)} nats (first-order cancels)`,
          barLeft,
          280,
          26,
          ROLE.optimal,
          'mono',
          'left',
        ).opacity(bv * alpha),
      );
    }

    return nodes;
  });

  // Act 2 (Beat 2): Closed-form growth exponents
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const sw = Math.max(0.06, expSweep.value);

    const plane = plotPlane({
      left: -790,
      right: -120,
      top: -195,
      bottom: 165,
      xDomain: [0, 3],
      yDomain: [0, 3],
      xTicks: [0, 1, 2, 3],
      yTicks: [0, 1, 2, 3],
      xLabel: 'log₁₀ compute C',
      yLabel: 'log₁₀ resource',
      opacity: alpha,
    });
    nodes.push(plane.node);

    const slopeN = 0.28 / (0.34 + 0.28);
    const slopeD = 0.34 / (0.34 + 0.28);

    const ptsN = sampleCurve(plane, (x) => slopeN * x, 0, sw * 3, 40);
    const ptsD = sampleCurve(plane, (x) => slopeD * x, 0, sw * 3, 40);
    nodes.push(
      glowingTrail(ptsN, { color: ROLE.params, width: 4.5, glow: 10, opacity: alpha }),
      glowingTrail(ptsD, { color: ROLE.tokens, width: 4.5, glow: 10, opacity: alpha }),
      txt('N* ∝ C^(β/(α+β))  ≈ C^0.45', -800, 290, 28, ROLE.params, 'mono', 'left')
        .glow(6, ROLE.params)
        .opacity(alpha),
      txt('D* ∝ C^(α/(α+β))  ≈ C^0.55', -800, 340, 28, ROLE.tokens, 'mono', 'left')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
      txt(
        'α = 0.34, β = 0.28  ·  exponents sum to 1',
        -800,
        390,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Act 3 (Beat 3): Million-unit budget, B: 2 -> 8 -> D/N = (8/2)^2 = 16
  const act3Layer = guardedDynamic(act3Vis, (alpha) => {
    const nodes = [];
    const bVal = 2 + 6 * coefShift.value;
    const opt = allocationOptimum(1e6, 2, bVal, 0.5, 0.5);
    const ratio = opt.d / opt.n;

    const baseX = -780;
    const baseY = 185;
    const scaleX = 0.32; // 1000 -> 320px
    const scaleY = 0.095; // 4000 -> 380px
    const rw = Math.max(16, opt.n * scaleX);
    const rh = Math.max(16, opt.d * scaleY);

    nodes.push(
      txt(
        '1,000,000 budget  ·  equal α = β = 0.5',
        -830,
        -245,
        30,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(baseX + rw / 2, baseY - rh / 2, rw, rh, {
        color: ROLE.tokens,
        fillOpacity: 0.34,
        strokeWidth: 2.8,
        glow: 11,
        opacity: alpha,
      }),
      txt(`A = 2   ·   B = ${fmt(bVal, 1)}`, -360, -145, 32, ROLE.compute, 'mono', 'left')
        .glow(6, ROLE.compute)
        .opacity(alpha),
      txt(`D / N = (B / A)² = ${fmt(ratio, 1)}`, -360, -75, 34, ROLE.optimal, 'mono', 'left')
        .glow(7, ROLE.optimal)
        .opacity(alpha),
      txt(`N = ${Math.round(opt.n)}`, -360, 15, 42, ROLE.params, 'mono', 'left')
        .glow(7, ROLE.params)
        .opacity(alpha),
      txt(`D = ${Math.round(opt.d)}`, -360, 88, 42, ROLE.tokens, 'mono', 'left')
        .glow(7, ROLE.tokens)
        .opacity(alpha),
      txt('Equal growth slopes can start tall!', -830, 315, 30, COSMOS.ink, 'sans', 'left').opacity(
        alpha,
      ),
    );

    return nodes;
  });

  // Act 4 (Beat 4): 20:1 Chinchilla sizing at 10^24 FLOPs
  const act4Layer = guardedDynamic(act4Vis, (alpha) => {
    const nodes = [];
    const sr = scaleReveal.value;
    const nOpt = Math.sqrt(1e24 / 120);
    const dOpt = 20 * nOpt;

    nodes.push(
      txt('CHINCHILLA 20 : 1 PROPOSAL AT 10²⁴ FLOPs', -830, -235, 28, ROLE.compute, 'mono', 'left')
        .glow(6, ROLE.compute)
        .opacity(alpha),
      txt(
        'D = 20 N   =>   C ≈ 6 N (20 N) = 120 N²',
        -830,
        -155,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt('N = √(10²⁴ / 120)', -830, -85, 34, ROLE.params, 'mono', 'left')
        .glow(6, ROLE.params)
        .opacity(alpha),
    );

    if (sr > 0.05) {
      const a = sr * alpha;
      nodes.push(
        txt(`${fmt(nOpt / 1e9, 1)}B`, -830, 45, 76, ROLE.params, 'mono', 'left')
          .glow(12, ROLE.params)
          .opacity(a),
        txt('parameters', -520, 55, 32, COSMOS.muted, 'sans', 'left').opacity(a),
        txt(`${fmt(dOpt / 1e12, 2)}T`, -830, 185, 76, ROLE.tokens, 'mono', 'left')
          .glow(12, ROLE.tokens)
          .opacity(a),
        txt('training tokens', -520, 195, 32, COSMOS.muted, 'sans', 'left').opacity(a),
        txt(
          'Test this proposal against your own proxy runs',
          -830,
          325,
          28,
          ROLE.optimal,
          'sans',
          'left',
        ).opacity(a),
      );
    }

    return nodes;
  });

  // Right 3D captions
  const rightCaption = guardedDynamic(s.value(1), (alpha) => [
    txt('3D Iso-Loss Surface L(N, D)', 470, -355, 30, ROLE.compute, 'mono', 'center')
      .glow(6, ROLE.compute)
      .opacity(alpha),
    txt(
      'Gold ridge: α A N^(-α) = β B D^(-β)',
      470,
      325,
      26,
      COSMOS.muted,
      'mono',
      'center',
    ).opacity(alpha),
  ]);

  const surfEq = glowTex('L(N,D) = E + A N^{-\\alpha} + B D^{-\\beta}', {
    x: 470,
    y: 405,
    size: 36,
    color: ROLE.tokens,
  });

  s.add(
    cinemaAtmosphere(ROLE.params, ROLE.compute),
    title,
    view3d,
    rightCaption,
    surfEq,
    act1Layer,
    act2Layer,
    act3Layer,
    act4Layer,
  );

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.18, phi: 0.94, distance: 14.5 },
    { startOffset: 0.15, endMargin: 0.55 },
  );

  playCue(s, c, 'sl-general-allocation-0', (d) => s.play(step1Pct.to(1, { duration: d })), {
    dur: 1.2,
  });
  playCue(s, c, 'sl-general-allocation-1', (d) => s.play(balanceVis.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(
    s,
    c,
    'sl-general-allocation-2',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.65, d)), expSweep.to(1, { duration: d })),
    { dur: 1.4 },
  );
  playCue(
    s,
    c,
    'sl-general-allocation-3',
    (d) => s.play(swapVis(act2Vis, act3Vis, Math.min(0.65, d)), coefShift.to(1, { duration: d })),
    { dur: 1.5 },
  );
  playCue(
    s,
    c,
    'sl-general-allocation-4',
    (d) => s.play(swapVis(act3Vis, act4Vis, Math.min(0.65, d)), scaleReveal.to(1, { duration: d })),
    { dur: 1.1 },
  );
}
