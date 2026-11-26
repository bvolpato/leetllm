// Scene 07: Six comparisons are still one prompt: K4 complete pair graph, random-split leakage vs prompt grouping.
import {
  COSMOS,
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
  txt,
} from '../parts.mjs';

const K4_EDGES = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

export default function promptGroups(s, c) {
  const phase = s.value(0);
  const edgesBuilt = s.value(0.25);
  const splitMode = s.value(0); // 0=unified, 1=random leaked split
  const groupMode = s.value(0); // 1=prompt-grouped clean split

  const bgAura = aura(150, 20, 560, '#5ce1e61e', '#ff6b8b14');
  const title = heroTitle(['Six Pairs,', 'One Prompt'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'PROMPT-GROUPED SPLITS · LEAKAGE PREVENTION',
  });

  const eq = glowTex(String.raw`\binom{4}{2} = 6\;\text{pairs from 1 prompt}`, {
    x: 420,
    y: -365,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const eb = edgesBuilt.value;
    const sp = splitMode.value;
    const gp = groupMode.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    // K4 vertex coordinates: when splitMode=1 and groupMode=0, vertices straddle the TRAIN/EVAL wall
    // When groupMode=1, all 4 vertices of Prompt P1 stay safely on the TRAIN side, while P2 sits in EVAL!
    const wallX = 180;
    const basePts = [
      [-230, -135],
      [60, -135],
      [60, 155],
      [-230, 155],
    ];
    const leakedPts = [
      [-280, -135],
      [420, -135],
      [420, 155],
      [-280, 155],
    ];
    const groupedPts = [
      [-350, -135],
      [-70, -135],
      [-70, 155],
      [-350, 155],
    ];

    const verts = basePts.map((b, i) => {
      const lx = b[0] + (leakedPts[i][0] - b[0]) * sp;
      const ly = b[1] + (leakedPts[i][1] - b[1]) * sp;
      const gx = lx + (groupedPts[i][0] - lx) * gp;
      const gy = ly + (groupedPts[i][1] - ly) * gp;
      return [gx, gy];
    });

    const names = ['y₁', 'y₂', 'y₃', 'y₄'];
    const nodes = [
      // Left metric summary (floating, no card)
      txt('CANDIDATES', -855, -145, 26, COSMOS.muted, 'mono', 'left'),
      txt('4 answers', -855, -92, 42, COSMOS.cyan, 'mono', 'left').glow(6, COSMOS.cyan),
      txt('COMPARISONS', -855, 8, 26, COSMOS.muted, 'mono', 'left'),
      txt('6 pairs (3 per answer)', -855, 58, 30, COSMOS.gold, 'mono', 'left'),

      // Split partition wall (lights up during split & group)
      line([wallX, -250], [wallX, 310], {
        stroke: gp > 0.5 ? COSMOS.emerald : sp > 0.5 ? COSMOS.rose : '#344770',
        width: sp > 0.3 || gp > 0.3 ? 3.5 : 2,
        dash: [10, 8],
      }),
      txt('TRAIN SPLIT', -210, -245, 28, COSMOS.cyan, 'mono'),
      txt('EVAL SPLIT', 520, -245, 28, gp > 0.5 ? COSMOS.emerald : COSMOS.violet, 'mono'),
    ];

    const trimSeg = (a, b, r) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const ux = (dx / len) * r;
      const uy = (dy / len) * r;
      return [
        [a[0] + ux, a[1] + uy],
        [b[0] - ux, b[1] - uy],
      ];
    };

    // Draw the 6 edges of Prompt P1 (trimmed at vertex rims so strokes never cross vertex labels)
    K4_EDGES.forEach(([u, v], idx) => {
      const a = verts[u];
      const b = verts[v];
      const crossesWall = (a[0] < wallX && b[0] > wallX) || (a[0] > wallX && b[0] < wallX);
      const col = crossesWall ? COSMOS.rose : gp > 0.5 ? COSMOS.emerald : COSMOS.cyan;
      const vis = Math.max(0.25, Math.min(1, eb * 6 - idx * 0.5));
      nodes.push(
        glowingTrail(trimSeg(a, b, 40), {
          color: col,
          width: crossesWall ? 4.4 : 3.2,
          opacity: 0.9 * vis,
          glow: crossesWall ? 12 : 7,
        }),
      );
      if (crossesWall && sp > 0.5 && gp < 0.5) {
        const mx = (a[0] + b[0]) * 0.5;
        const my = (a[1] + b[1]) * 0.5;
        nodes.push(glowDot(mx, my, { radius: 6, color: COSMOS.rose, opacity: pulse }));
      }
    });

    // Draw the 4 vertices of Prompt P1
    verts.forEach(([vx, vy], i) => {
      const inEval = vx > wallX;
      const col = inEval && gp < 0.5 ? COSMOS.rose : COSMOS.gold;
      nodes.push(
        circle(36, { fill: '#11192f', stroke: col, width: 3 }).at(vx, vy).glow(8, col),
        txt(names[i], vx, vy + 2, 30, COSMOS.ink, 'mono'),
      );
    });
    nodes.push(
      txt(
        'Prompt P1',
        (verts[0][0] + verts[1][0]) * 0.5,
        228,
        28,
        gp > 0.5 ? COSMOS.emerald : sp > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),
    );

    // Unseen held-out Prompt P2 clique in EVAL (appears cleanly when grouped)
    if (gp > 0.05) {
      const p2 = [
        [420, -110],
        [660, -110],
        [660, 130],
        [420, 130],
      ];
      for (const [u, v] of K4_EDGES) {
        nodes.push(
          glowingTrail(trimSeg(p2[u], p2[v], 34), {
            color: COSMOS.violet,
            width: 3.0,
            opacity: 0.85 * gp,
            glow: 7,
          }),
        );
      }
      p2.forEach(([vx, vy], i) => {
        nodes.push(
          circle(30, { fill: '#17142e', stroke: COSMOS.violet, width: 2.8 })
            .at(vx, vy)
            .glow(7, COSMOS.violet)
            .opacity(gp),
          txt(`z${i + 1}`, vx, vy + 2, 26, COSMOS.ink, 'mono').opacity(gp),
        );
      });
      nodes.push(txt('Held-out Prompt P2', 540, 228, 28, COSMOS.violet, 'mono').opacity(gp));
    }

    // Bottom status bar explaining leakage vs clean split
    line([-855, 320], [810, 320], { stroke: '#253355', width: 2 });
    if (gp > 0.5) {
      nodes.push(
        txt(
          'PROMPT-GROUPED SPLIT: zero shared prompts · check near-duplicates too',
          0,
          380,
          30,
          COSMOS.emerald,
          'mono',
        )
          .glow(7, COSMOS.emerald)
          .opacity(gp),
      );
    } else if (sp > 0.5) {
      nodes.push(
        txt(
          'RANDOM ROW SPLIT LEAKS P1 ACROSS TRAIN & EVAL (familiar test!)',
          0,
          380,
          30,
          COSMOS.rose,
          'mono',
        )
          .glow(8, COSMOS.rose)
          .opacity(sp),
      );
    } else {
      nodes.push(
        txt(
          'All 6 comparison rows share one underlying prompt P1',
          0,
          380,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('build-six-pairs', () => s.play(edgesBuilt.to(1, { duration: 0.55 })));
  c.on('split-pairs', () => s.play(splitMode.to(1, { duration: 0.65 })));
  c.on('group-prompts', () =>
    s.play(groupMode.to(1, { duration: remainDuration(c, 'group-prompts', 0.7) })),
  );
}
