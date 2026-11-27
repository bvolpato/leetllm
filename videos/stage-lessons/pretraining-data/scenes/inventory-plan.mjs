// Scene 02: How many tokens must the corpus supply?: Orbiting 3D Chinchilla surface + token yield funnel.
import { delay, par } from 'vizmatic/stage';
import {
  CHINCHILLA_PLAN,
  COSMOS,
  aura,
  buildChinchillaSurface3d,
  glowBar,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  photonStream,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function inventoryPlan(s, c) {
  const beaconP = s.value(0);
  const showPart1 = s.value(1);
  const showAppetite = s.value(0);
  const showFlops = s.value(0);
  const showFunnel = s.value(0);
  const filterP = s.value(0);
  const dedupP = s.value(0);
  const gapReveal = s.value(0);

  const { view: chinchilla3d } = buildChinchillaSurface3d(beaconP, { x: 350, y: 15, half: 2.85 });
  const bgAura = aura(350, 15, 520, '#1e3a7a2c', '#5ce1e614');

  const title1 = heroTitle(['Chinchilla Scale', '& Token Appetite'], {
    x: -855,
    y: -425,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'COMPUTE-OPTIMAL PLANNING · L(N, D)',
  });

  const eqTarget = glowTex(String.raw`70\text{B}\times 20 = 1.4\text{T}`, {
    x: -510,
    y: 45,
    size: 46,
    color: COSMOS.cyan,
  });

  const eqFlops = glowTex(String.raw`6ND = 5.88 \times 10^{23}\ \text{FLOPs}`, {
    x: -475,
    y: 235,
    size: 42,
    color: COSMOS.gold,
  });

  // Part 1 left column annotations & 3D surface caption
  const part1Live = guardedDynamic(showPart1, (a) => {
    const app = showAppetite.value;
    const fl = showFlops.value;
    const nodes = [
      txt('3D ISO-LOSS SURFACE L(N, D)', 350, -405, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        'Gold ridge: D = 20N · Cyan arc: 6ND iso-FLOP',
        350,
        428,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
      metricReadout('DENSE MODEL WEIGHTS', `${CHINCHILLA_PLAN.paramsB}B params`, {
        x: -855,
        y: -210,
        valueSize: 60,
        color: COSMOS.blue,
        sub: '20 presentations / param',
      }).opacity(a),
    ];

    if (app > 0.02) {
      nodes.push(
        txt('TRAINING TOKEN PRESENTATIONS', -855, -20, 26, COSMOS.cyan, 'mono', 'left').opacity(
          app * a,
        ),
      );
    }
    if (fl > 0.02) {
      nodes.push(
        txt('DOMINANT MATRIX COMPUTE', -855, 165, 26, COSMOS.gold, 'mono', 'left').opacity(fl * a),
        txt(
          'Attention & recomputation add extra FLOPs',
          -855,
          335,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(fl * a),
      );
    }
    return group(...nodes);
  });

  // Part 2: Token survival funnel (2.0T -> 1.4T -> 1.12T vs 1.4T target; withhold 280B gap until reveal!)
  const funnelLive = guardedDynamic(showFunnel, (a) => {
    const fp = filterP.value;
    const dp = dedupP.value;
    const gr = gapReveal.value;

    const barLeft = -760;
    const barW = 1480;
    const targetX = barLeft + barW * (CHINCHILLA_PLAN.targetTokensT / CHINCHILLA_PLAN.extractedT);
    const afterFilter = CHINCHILLA_PLAN.extractedT * (1 - 0.3 * fp);
    const afterDedup = afterFilter * (1 - 0.2 * dp);
    const survivorX = barLeft + barW * (afterDedup / CHINCHILLA_PLAN.extractedT);

    const nodes = [
      txt(
        'EXTRACTED INVENTORY VS 1.4T TARGET',
        -855,
        -410,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Filtering & Dedup', -855, -335, 58, COSMOS.ink, 'serif', 'left').opacity(a),
      txt('Shrink the Pool', -855, -268, 58, COSMOS.gold, 'serif', 'left')
        .glow(6, COSMOS.gold)
        .opacity(a),

      // Top bar: 2.0T extracted
      txt('EXTRACTED RAW CORPUS', barLeft, -155, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('2.00T tokens', barLeft + barW, -155, 32, COSMOS.blue, 'mono', 'right').opacity(a),
      ...glowBar(barLeft, -100, barW, 1, { height: 42, color: COSMOS.blue, opacity: a }),

      // Flowing photons into surviving bar
      ...photonStream([barLeft + 180, -72], [barLeft + 180, 14], 0, 0, {
        color: COSMOS.cyan,
        count: 3,
        opacity: a * 0.75,
        trail: false,
      }),
      ...photonStream([barLeft + 740, -72], [barLeft + 740, 14], 0, 0, {
        color: COSMOS.cyan,
        count: 3,
        opacity: a * 0.75,
        trail: false,
      }),

      // Surviving bar
      txt(
        dp > 0.5
          ? 'AFTER QUALITY (-30%) & DEDUP (-20%)'
          : fp > 0.5
            ? 'AFTER QUALITY FILTERING (-30%)'
            : 'BEFORE FILTERING',
        barLeft,
        44,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt(`${afterDedup.toFixed(2)}T unique`, barLeft + barW, 44, 34, COSMOS.cyan, 'mono', 'right')
        .glow(6, COSMOS.cyan)
        .opacity(a),
      ...glowBar(barLeft, 102, barW, afterDedup / CHINCHILLA_PLAN.extractedT, {
        height: 46,
        color: COSMOS.cyan,
        opacity: a,
      }),

      // Fixed 1.4T target laser line
      glowingTrail(
        [
          [targetX, -130],
          [targetX, 224],
        ],
        { color: COSMOS.gold, width: 4.5, glow: 12, opacity: a },
      ),
      txt('TARGET: 1.40T', targetX, 266, 32, COSMOS.gold, 'mono').glow(8, COSMOS.gold).opacity(a),
    ];

    if (dp > 0.8 && gr < 0.05) {
      // Prediction withheld cleanly!
      nodes.push(
        txt(
          '1 pass over 1.12T unique tokens: how far short of 1.40T?',
          0,
          395,
          36,
          COSMOS.ink,
          'serif',
        ).opacity(a),
      );
    }

    if (gr > 0.02) {
      const gapW = targetX - survivorX;
      nodes.push(
        ...glowBar(survivorX, 180, gapW, gr, {
          height: 36,
          color: COSMOS.amber,
          opacity: gr * a,
        }),
        txt(
          `SHORTFALL: ${CHINCHILLA_PLAN.shortfallB.toFixed(0)}B PRESENTATIONS`,
          -40,
          325,
          34,
          COSMOS.amber,
          'mono',
        )
          .glow(6, COSMOS.amber)
          .opacity(gr * a),
        txt(
          'Close the 280B gap with new eligible sources or deliberate repeats',
          0,
          410,
          32,
          COSMOS.emerald,
          'sans',
        ).opacity(gr * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, chinchilla3d, title1, part1Live, funnelLive);

  const part1End = c.cue('pt-inventory-plan-filter').start;
  orbitScene(
    s,
    c,
    chinchilla3d,
    { theta: -0.18, phi: 0.92 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - part1End + 0.4) },
  );
  c.at(0.1, () => s.play(beaconP.to(1, { duration: Math.max(1.0, part1End - c.start - 0.8) })));

  c.on('pt-inventory-plan-appetite', () =>
    s.play(showAppetite.to(1, { duration: remainDuration(c, 'pt-inventory-plan-appetite', 0.5) })),
  );
  c.show('pt-inventory-plan-appetite', eqTarget, { fade: 0.4 });

  c.on('pt-inventory-plan-flops', () =>
    s.play(showFlops.to(1, { duration: remainDuration(c, 'pt-inventory-plan-flops', 0.5) })),
  );
  c.show('pt-inventory-plan-flops', eqFlops, { fade: 0.4 });

  // Transition into funnel on beat 2 (before filter cue)
  c.onBeat(2, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showFunnel.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide(2, [chinchilla3d, title1, eqTarget, eqFlops], { fade: 0.2 });

  c.on('pt-inventory-plan-filter', () =>
    s.play(filterP.to(1, { duration: remainDuration(c, 'pt-inventory-plan-filter', 1.0) })),
  );
  c.on('pt-inventory-plan-dedup', () =>
    s.play(dedupP.to(1, { duration: remainDuration(c, 'pt-inventory-plan-dedup', 1.0) })),
  );
  // Strict prediction withholding: reveal 280B gap only after spoken reveal cue
  c.after('pt-inventory-plan-gap', () =>
    s.play(gapReveal.to(1, { duration: remainAfterDuration(c, 'pt-inventory-plan-gap', 0.5) })),
  );
}
