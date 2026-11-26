// Scene 09: Make the accepted set cover different tasks (2D equal-scale cosine map + orbiting 3D semantic cone)
import {
  COSMOS,
  COS_NEAR,
  COS_NOVEL,
  NEAR_VEC,
  NOVEL_VEC,
  SEED_VEC,
  aura,
  buildEmbeddingCone3d,
  circle,
  glassCell,
  glowDot,
  glowTex,
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

export default function diversity(s, c) {
  const phase = s.value(0);
  const sNeighborhood = s.value(0);
  const sNearMove = s.value(0);
  const sCosNear = s.value(0);
  const sCosNew = s.value(0);

  const bgAura = aura(450, 20, 560, '#133a5c2a', '#2d1c4d18');
  const cone3d = buildEmbeddingCone3d(phase, { x: 475, y: 20 });

  const title = heroTitle(['Make the Accepted Set', 'Cover Different Tasks'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'SEMANTIC DIVERSITY · COSINE SIMILARITY & EMBEDDING ANGLES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const nb = Math.max(0.75, sNeighborhood.value);
    const nm = sNearMove.value;
    const cn = sCosNear.value;
    const cw = sCosNew.value;

    // Equal-scale 2D unit-circle plot on left half
    const ox = -760;
    const oy = 210;
    const scale = 340;
    const toPt = (vx, vy) => [ox + vx * scale, oy - vy * scale];

    const seedPt = toPt(SEED_VEC[0], SEED_VEC[1]);
    const nearPt = toPt(NEAR_VEC[0], NEAR_VEC[1]);
    const novelPt = toPt(NOVEL_VEC[0], NOVEL_VEC[1]);

    // Unit quarter-arc
    const unitArcPts = Array.from({ length: 32 }, (_, i) => {
      const a = (i / 31) * (Math.PI * 0.5);
      return toPt(Math.cos(a), Math.sin(a));
    });

    // Angle arc to novel vector
    const novelAng = Math.atan2(NOVEL_VEC[1], NOVEL_VEC[0]);
    const novelArcPts = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 23) * novelAng;
      return toPt(0.45 * Math.cos(a), 0.45 * Math.sin(a));
    });

    const nodes = [
      txt('3D SEMANTIC COSINE CONE', 475, -365, 26, COSMOS.violet, 'mono'),
      txt(
        'Gold ring marks high-similarity review neighborhood',
        475,
        405,
        26,
        COSMOS.muted,
        'sans',
      ),

      // 2D axes
      line([ox, oy], [ox + scale + 45, oy], { stroke: COSMOS.rule, width: 2.4 }),
      line([ox, oy], [ox, oy - scale - 35], { stroke: COSMOS.rule, width: 2.4 }),
      txt('coord 1', ox + scale + 56, oy + 4, 26, COSMOS.muted, 'mono', 'left'),
      txt('coord 2', ox - 10, oy - scale - 54, 26, COSMOS.muted, 'mono', 'left'),
      glowingTrail(unitArcPts, { color: COSMOS.rule, width: 2.2, glow: 0, core: false }),

      // Seed vector [1, 0] + crowded pagination cluster dots
      line([ox, oy], seedPt, { stroke: COSMOS.blue, width: 4.0 }).glow(8, COSMOS.blue),
      glowDot(seedPt[0], seedPt[1], { radius: 8, color: COSMOS.blue }),
      txt('Seed [1, 0]', seedPt[0] - 85, seedPt[1] + 44, 26, COSMOS.blue, 'mono'),
      circle(6, { fill: COSMOS.blue, stroke: null })
        .at(...toPt(0.94, 0.06))
        .opacity(0.65 * nb),
      circle(6, { fill: COSMOS.blue, stroke: null })
        .at(...toPt(0.97, 0.025))
        .opacity(0.65 * nb),

      // C3 near duplicate [0.99, 0.02]
      line(
        [ox, oy],
        [ox + (nearPt[0] - ox) * Math.max(0.2, nm), oy + (nearPt[1] - oy) * Math.max(0.2, nm)],
        {
          stroke: COSMOS.rose,
          width: 3.4,
        },
      )
        .glow(8, COSMOS.rose)
        .opacity(Math.max(0.45, nm)),
      glowDot(nearPt[0], nearPt[1], {
        radius: 8,
        color: COSMOS.rose,
        opacity: Math.max(0.45, nm),
      }),
      txt('C3 near copy', nearPt[0] - 50, nearPt[1] - 42, 26, COSMOS.rose, 'mono').opacity(
        Math.max(0.45, nm),
      ),

      // C1 novel family [0.25, 0.95]
      line([ox, oy], novelPt, { stroke: COSMOS.emerald, width: 4.0 })
        .glow(8, COSMOS.emerald)
        .opacity(Math.max(0.55, nm)),
      glowDot(novelPt[0], novelPt[1], {
        radius: 8,
        color: COSMOS.emerald,
        opacity: Math.max(0.55, nm),
      }),
      txt(
        'C1 new family',
        novelPt[0] + 18,
        novelPt[1] - 24,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(Math.max(0.55, nm)),
      glowingTrail(novelArcPts, { color: COSMOS.emerald, width: 3.0, opacity: Math.max(0.4, cw) }),

      // Status strip on bottom left
      glassCell(-390, 355, 920, 128, COSMOS.cyan, { fill: '#0e192d', glow: 5 }),
      txt(
        cn > 0.3
          ? `cos(Seed, C3) = ${COS_NEAR.toFixed(4)} >= 0.95 -> REVIEW`
          : 'Cutoff: cos >= 0.95 (skip zero / nonfinite)',
        -805,
        326,
        26,
        cn > 0.3 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        cw > 0.3
          ? `cos(Seed, C1) = ${COS_NOVEL.toFixed(3)}  < 0.95 -> ELIGIBLE`
          : 'Measure angle; reviewer verifies meaning',
        -805,
        382,
        26,
        cw > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    if (cn > 0.3) {
      nodes.push(glowDot(-828, 326, { radius: 6 * pulse, color: COSMOS.rose }));
    }
    if (cw > 0.3) {
      nodes.push(glowDot(-828, 382, { radius: 6 * pulse, color: COSMOS.emerald }));
    }

    return group(...nodes);
  });

  const eqCos = glowTex('\\cos(a, b) = \\frac{a \\cdot b}{\\|a\\|\\,\\|b\\|}', {
    x: -175,
    y: -155,
    size: 40,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, cone3d, title, live, eqCos);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cone3d, { theta: -0.22, phi: 0.96 });

  c.on('diversity-b1-1', () => s.play(sNeighborhood.to(1, { duration: 0.45 })));
  c.on('diversity-b2-1', () => s.play(sNearMove.to(1, { duration: 0.65 })));
  c.after('diversity-b3-1', () => s.play(sCosNear.to(1, { duration: 0.4 })));
  c.after('diversity-b3-2', () =>
    s.play(sCosNew.to(1, { duration: remainDuration(c, 'diversity-b3-2', 0.45) })),
  );
}
