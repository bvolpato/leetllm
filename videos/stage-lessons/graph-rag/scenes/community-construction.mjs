// Scene 8: Score a grouping without changing the graph (Modularity Q = 5/36 + 5/36 = 5/18 ~ 0.278 vs single group = 0, Leiden hierarchy)
import {
  COSMOS,
  MOD_MERGED,
  MOD_SPLIT,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function communityConstruction(s, c) {
  const showDeg = s.value(0);
  const showSplit = s.value(0);
  const showMerge = s.value(0);
  const showForest = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Score a Grouping Without', 'Changing the Graph'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'MODULARITY & LEIDEN · 6 EDGES, 12 ENDS · Q = 5/18 (~0.278) VS Q = 0',
  });

  const qSplit = MOD_SPLIT.reduce((s0, t) => s0 + t.contribution, 0);
  const qMerged = MOD_MERGED[0].contribution;

  const live = guardedDynamic(s.value(1), () => {
    const sd = showDeg.value;
    const sp = showSplit.value;
    const sm = showMerge.value;
    const sf = showForest.value;

    // Left: 6 fixed undirected edges: Cache clique (A,B,C,D: 5 edges, deg sum 10) + Eval pair (E,F: 1 edge, deg sum 2)
    const A = [-735, -75];
    const B = [-515, -75];
    const C = [-515, 115];
    const D = [-735, 115];
    const E = [-225, -40];
    const F = [-225, 105];

    const nodes = [
      glassCell(-475, 22, 760, 446, sm > 0.4 ? COSMOS.amber : COSMOS.emerald, {
        fill: '#0e182e',
        glow: 4,
      }),
      txt('UNDIRECTED PROJECTION: 6 EDGES, 12 ENDS', -825, -166, 26, COSMOS.cyan, 'mono', 'left'),

      // Community boundary divider (disappears on merge!)
      ...(sm < 0.4
        ? [
            line([-375, -125], [-375, 165], {
              stroke: COSMOS.gold,
              width: 3.5,
              dash: [10, 8],
            }).glow(7, COSMOS.gold),
          ]
        : []),

      // 5 edges in Cache group + 1 edge in Eval pair
      line(A, B, { stroke: COSMOS.cyan, width: 3.5 }),
      line(B, C, { stroke: COSMOS.cyan, width: 3.5 }),
      line(C, D, { stroke: COSMOS.cyan, width: 3.5 }),
      line(D, A, { stroke: COSMOS.cyan, width: 3.5 }),
      line(A, C, { stroke: COSMOS.cyan, width: 3.5 }),
      line(E, F, { stroke: COSMOS.gold, width: 3.5 }),

      glowDot(A[0], A[1], { radius: 11, color: COSMOS.cyan }),
      txt(sd > 0.3 ? 'A (3)' : 'A', A[0] - 46, A[1] - 36, 26, COSMOS.cyan, 'mono'),
      glowDot(B[0], B[1], { radius: 11, color: COSMOS.cyan }),
      txt(sd > 0.3 ? 'B (2)' : 'B', B[0] + 46, B[1] - 36, 26, COSMOS.cyan, 'mono'),
      glowDot(C[0], C[1], { radius: 11, color: COSMOS.cyan }),
      txt(sd > 0.3 ? 'C (3)' : 'C', C[0] + 46, C[1] + 36, 26, COSMOS.cyan, 'mono'),
      glowDot(D[0], D[1], { radius: 11, color: COSMOS.cyan }),
      txt(sd > 0.3 ? 'D (2)' : 'D', D[0] - 46, D[1] + 36, 26, COSMOS.cyan, 'mono'),

      glowDot(E[0], E[1], { radius: 11, color: COSMOS.gold }),
      txt(sd > 0.3 ? 'E (1)' : 'E', E[0] + 62, E[1] - 6, 26, COSMOS.gold, 'mono'),
      glowDot(F[0], F[1], { radius: 11, color: COSMOS.gold }),
      txt(sd > 0.3 ? 'F (1)' : 'F', F[0] + 62, F[1] + 6, 26, COSMOS.gold, 'mono'),

      txt(
        sm > 0.4
          ? '1 GROUP (ALL 6 NODES): 6 edges, 12 ends'
          : 'Cache: 5 edges (deg 10) | Eval: 1 (deg 2)',
        -825,
        204,
        26,
        sm > 0.4 ? COSMOS.amber : COSMOS.emerald,
        'mono',
        'left',
      ),

      // Right: Modularity equations (strict c.after withholding on single-group Q = 0!)
      txt('MODULARITY (RESOLUTION = 1) & LEIDEN', 20, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(445, -102, 850, 146, sp > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sp > 0.3 ? 8 : 2,
      }),
      txt('Cache: 5/6 - (10/12)^2 = 5/36', 50, -142, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Eval:  1/6 - (2/12)^2  = 5/36', 50, -100, 26, COSMOS.gold, 'mono', 'left'),
      txt(`Total Q = 5/18 = ${qSplit.toFixed(3)}`, 50, -56, 28, COSMOS.emerald, 'mono', 'left'),

      glassCell(445, 58, 850, 126, sm > 0.4 ? COSMOS.amber : COSMOS.gold, {
        fill: sm > 0.4 ? '#231c10' : '#181e34',
        glow: sm > 0.4 ? 9 : 3,
      }),
      txt(
        sm > 0.4
          ? `ALL IN 1 GROUP: 1 - 1^2 = ${qMerged.toFixed(1)} (ZERO!)`
          : 'WHAT IF ALL 6 NODES JOIN 1 GROUP?  Q = ?',
        50,
        28,
        28,
        sm > 0.4 ? COSMOS.amber : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Partition changed without editing a single edge',
        50,
        78,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(445, 212, 850, 134, sf > 0.3 ? COSMOS.violet : COSMOS.muted, {
        fill: '#181430',
        glow: sf > 0.3 ? 8 : 2,
      }),
      txt('LEIDEN HIERARCHY & COMMUNITY REPORTS', 50, 178, 26, COSMOS.violet, 'mono', 'left'),
      txt(
        'Refines connected clusters; splits large roots recursively',
        50,
        222,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Impact 0-10 != frequency or relevance -> check sources',
        50,
        256,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Modularity scores structural clustering; read cited sources to establish themes or causes',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('community-construction-projection', () => s.play(showDeg.to(0.2, { duration: 0.3 })));
  c.on('community-construction-degrees', () => s.play(showDeg.to(1, { duration: 0.35 })));
  c.on('community-construction-cache-term', () => s.play(showSplit.to(0.4, { duration: 0.3 })));
  c.on('community-construction-eval-term', () => s.play(showSplit.to(0.75, { duration: 0.3 })));
  c.on('community-construction-modularity-result', () =>
    s.play(showSplit.to(1, { duration: 0.35 })),
  );
  c.on('community-construction-merge', () => s.play(showMerge.to(0.35, { duration: 0.3 })));
  c.after('community-construction-all-one', () => s.play(showMerge.to(1, { duration: 0.4 })));
  c.on('community-construction-forest', () =>
    s.play(
      showForest.to(1, { duration: remainDuration(c, 'community-construction-forest', 0.45) }),
    ),
  );
}
