// Scene 16: Which rows reach the next round? (3 real + 2+2 synthetic IDs, 3D collapse vs accumulation surface, sampling weight)
import {
  COSMOS,
  aura,
  buildCollapseSurface3d,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function accumulationWeight(s, c) {
  const phase = s.value(0);
  const modeVal = s.value(0); // 0 -> 1 transitions 3D tail ridge to emerald anchored accumulation
  const sReal = s.value(0);
  const sAdd = s.value(0);
  const sPoolAcc = s.value(0);
  const sPoolSeven = s.value(0);
  const sReplaceTwo = s.value(0);
  const sAct2 = s.value(0);
  const curveProg = s.value(0);
  const sScope = s.value(0);
  const sAct3 = s.value(0);
  const sNegligible = s.value(0);
  const sPositive = s.value(0);
  const sExpWeight = s.value(0);

  const bgAura = aura(440, 20, 560, '#123e362a', '#35172b18');
  const surf3d = buildCollapseSurface3d(phase, modeVal, { x: 470, y: 20 });

  const title = heroTitle(['Which Rows Reach', 'the Next Round?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'ACCUMULATION VS REPLACEMENT · POOL MEMBERSHIP VS EXPOSURE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const rightLabels = [
      txt('3D TAIL PRESERVATION SURFACE', 470, -370, 26, COSMOS.emerald, 'mono'),
      txt(
        modeVal.value > 0.5
          ? 'Emerald curve: accumulating real data keeps tail anchored'
          : 'Rose curve: replacement collapses tail toward zero',
        470,
        412,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Act 3: Membership vs Effective Sampling Exposure
    if (sAct3.value > 0.5) {
      const neg = sNegligible.value > 0.3;
      const pos = sPositive.value > 0.3 || sExpWeight.value > 0.3;
      const nodes = [
        ...rightLabels,
        txt('POOL MEMBERSHIP != TRAINING EXPOSURE', -835, -196, 26, COSMOS.blue, 'mono', 'left'),

        glassCell(-420, -92, 830, 118, COSMOS.blue, { fill: '#0e1d36', glow: 6 }),
        txt('H3 RETAINED IN STORAGE POOL', -800, -112, 26, COSMOS.blue, 'mono', 'left'),
        txt('Row ID exists in dataset manifest', -800, -68, 28, COSMOS.ink, 'sans', 'left'),

        glassCell(-420, 74, 830, 138, neg ? COSMOS.rose : COSMOS.rule, {
          fill: neg ? '#281119' : '#0c1222',
          glow: neg ? 8 * pulse : 2,
        }),
        txt('SAMPLING WEIGHT: 1 / 1,000,000 UPDATES', -800, 44, 26, COSMOS.rose, 'mono', 'left'),
        txt(
          'Retained ID, yet training influence is effectively zero',
          -800,
          98,
          28,
          neg ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ),

        glassCell(-420, 268, 830, 152, pos ? COSMOS.emerald : COSMOS.rule, {
          fill: pos ? '#0e2824' : '#0c1222',
          glow: pos ? 9 * pulse : 2,
        }),
        txt('EXPLICIT POSITIVE MIXTURE WEIGHT', -800, 232, 26, COSMOS.emerald, 'mono', 'left'),
        txt(
          'Restores rare draws · declare token exposure & refresh real data',
          -800,
          286,
          26,
          pos ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ),
      ];
      return group(...nodes);
    }

    // Act 2: Gerstgrasser et al. Error Curves (Replacement linear vs Accumulation bounded)
    if (sAct2.value > 0.5) {
      const cp = Math.max(0.15, curveProg.value);
      const ox = -790;
      const oy = 215;
      const w = 740;
      const h = 340;

      const steps = Math.max(2, Math.round(24 * cp));
      const repPts = Array.from({ length: steps }, (_, i) => {
        const g = (i / 23) * 6;
        return [ox + (g / 6) * w, oy - (g / 6.5) * h];
      });
      const accPts = Array.from({ length: steps }, (_, i) => {
        const g = (i / 23) * 6;
        const val = 1.64 * (1 - 1 / (1 + g * 1.1));
        return [ox + (g / 6) * w, oy - (val / 6.5) * h];
      });

      const nodes = [
        ...rightLabels,
        txt('ERROR ACROSS RECURSIVE GENERATIONS', -830, -196, 26, COSMOS.blue, 'mono', 'left'),
        line([ox, oy], [ox + w, oy], { stroke: COSMOS.rule, width: 2.4 }),
        line([ox, oy], [ox, oy - h], { stroke: COSMOS.rule, width: 2.4 }),
        txt('generation', ox + w - 70, oy + 42, 26, COSMOS.muted, 'mono'),
        txt('error', ox - 10, oy - h - 28, 26, COSMOS.muted, 'mono', 'left'),

        glowingTrail(repPts, { color: COSMOS.rose, width: 4.2, glow: 9 }),
        glowingTrail(accPts, { color: COSMOS.blue, width: 4.2, glow: 9 }),
        glowDot(repPts.at(-1)[0], repPts.at(-1)[1], { radius: 7, color: COSMOS.rose }),
        glowDot(accPts.at(-1)[0], accPts.at(-1)[1], { radius: 7, color: COSMOS.blue }),

        txt('Replace (diverges)', ox + w - 150, oy - h - 18, 26, COSMOS.rose, 'mono').opacity(cp),
        txt('Accumulate (bounded)', ox + w - 170, oy - 132, 26, COSMOS.blue, 'mono').opacity(cp),

        glassCell(-415, 355, 860, 108, COSMOS.cyan, { fill: '#0f1c32', glow: 5 }),
        txt(
          sScope.value > 0.3
            ? 'Gerstgrasser et al.: accumulation keeps error bounded'
            : 'Keeping earlier real + synthetic data bounds error',
          -415,
          357,
          26,
          COSMOS.cyan,
          'sans',
        ),
      ];
      return group(...nodes);
    }

    // Act 1: 3 Real IDs + 2 + 2 Synthetic IDs = 7 Accumulated vs 2 Replaced (0 Real)
    const rl = Math.max(0.76, sReal.value);
    const ad = sAdd.value;
    const sv = sPoolSeven.value > 0.3 || sPoolAcc.value > 0.3;
    const rp = sReplaceTwo.value > 0.3;

    const realIds = ['H1', 'H2', 'H3'];
    const synthIds = ['G1', 'G2', 'G3', 'G4'];

    const nodes = [
      ...rightLabels,
      txt('REVIEWED REAL ANCHORS (3 IDS)', -830, -192, 26, COSMOS.blue, 'mono', 'left'),
      ...realIds.map((id, i) => {
        const cx = -700 + i * 260;
        return group(
          glassCell(cx, -110, 210, 82, COSMOS.blue, { fill: '#102446', glow: 6, opacity: rl }),
          txt(id, cx, -108, 32, COSMOS.blue, 'mono').opacity(rl),
        );
      }),

      txt('SYNTHETIC ROUNDS (+2 PER ROUND)', -830, -16, 26, COSMOS.cyan, 'mono', 'left'),
      ...synthIds.map((id, i) => {
        const cx = -740 + i * 204;
        return group(
          glassCell(cx, 66, 174, 82, ad > 0.2 ? COSMOS.cyan : COSMOS.rule, {
            fill: ad > 0.2 ? '#0f2838' : '#0b101d',
            glow: ad > 0.2 ? 6 : 1,
            opacity: Math.max(0.72, ad),
          }),
          txt(id, cx, 68, 30, ad > 0.2 ? COSMOS.cyan : COSMOS.dim, 'mono'),
        );
      }),

      // Accumulated summary
      glassCell(-415, 216, 860, 100, sv ? COSMOS.emerald : COSMOS.rule, {
        fill: sv ? '#0e2824' : '#0c1222',
        glow: sv ? 8 : 2,
      }),
      txt(
        sv ? 'ACCUMULATE: 3 real + 4 synth = 7 IDs (kept)' : 'Keep every batch -> ?',
        -810,
        218,
        26,
        sv ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ),

      // Replacement summary
      glassCell(-415, 354, 860, 100, rp ? COSMOS.rose : COSMOS.rule, {
        fill: rp ? '#281119' : '#0c1222',
        glow: rp ? 8 * pulse : 2,
      }),
      txt(
        rp ? 'REPLACE: G3, G4 only = 2 IDs (0 real rows)' : 'Keep only last batch -> ?',
        -810,
        356,
        26,
        rp ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, surf3d, title, live);
  runPhase(s, c, phase, 16);
  orbitScene(s, c, surf3d, { theta: -0.2, phi: 0.92 });

  c.on('real-three', () => s.play(sReal.to(1, { duration: 0.4 })));
  c.on('add-two', () => s.play(sAdd.to(1, { duration: 0.45 })));
  c.on('pool-accumulate', () => s.play(sPoolAcc.to(1, { duration: 0.4 })));
  c.after('pool-seven', () => s.play(sPoolSeven.to(1, { duration: 0.35 })));
  c.after('replace-two', () => s.play(sReplaceTwo.to(1, { duration: 0.35 })));

  c.on('bounded-study', () => {
    s.play(
      sAct2.to(1, { duration: 0.3 }),
      curveProg.to(1, { duration: 1.4 }),
      modeVal.to(1, { duration: 1.4 }),
    );
  });
  c.on('accumulation-scope', () => s.play(sScope.to(1, { duration: 0.45 })));

  c.on('weight-negligible', () => {
    s.play(sAct3.to(1, { duration: 0.3 }), sNegligible.to(1, { duration: 0.45 }));
  });
  c.on('exposure-weight', () => s.play(sExpWeight.to(1, { duration: 0.4 })));
  c.after('weight-positive', () =>
    s.play(sPositive.to(1, { duration: remainDuration(c, 'weight-positive', 0.4) })),
  );
}
