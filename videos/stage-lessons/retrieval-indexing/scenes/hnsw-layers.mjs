// Scene 19: Why visit a point farther from the query? (Orbiting 3D multi-layer HNSW skip-graph & ef frontier)
import {
  COSMOS,
  aura,
  frontierSearch,
  glassCell,
  glowDot,
  graphDistance,
  group,
  guardedDynamic,
  heroTitle,
  makeHnsw3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function hnswLayers(s, c) {
  const phase = s.value(0);
  const showUpper = s.value(0);
  const showDescent = s.value(0);
  const showNarrow = s.value(0);
  const showAsk = s.value(0);
  const showAnswer = s.value(0);
  const showWideStep = s.value(0); // 0 -> 1 (S) -> 2 (B) -> 3 (G)
  const showBuild = s.value(0);

  const bgAura = aura(0, 10, 680, '#12366028', '#2a1c5216');
  const title = heroTitle(['Why Visit a Point', 'Farther From Query?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'HNSW MULTI-LAYER SKIP GRAPH · LOCAL MINIMUM TRAP · FRONTIER BUDGET ef',
  });

  const ef1 = frontierSearch(1);
  const ef2 = frontierSearch(2);

  const { view: stage3d, orbit: orbit3d } = makeHnsw3D(520, -15, 680, 580, phase, () => {
    const ws = showWideStep.value;
    const edges = [];
    const expanded = ['A'];
    let frontier = [];
    if (ws >= 0.8) {
      edges.push(['A', 'S']);
      expanded.push('S');
      frontier = ['B'];
    }
    if (ws >= 1.8) {
      edges.push(['S', 'B']);
      expanded.push('B');
      frontier = ['G'];
    }
    if (ws >= 2.8) {
      edges.push(['B', 'G']);
      expanded.push('G');
      frontier = [];
    }
    return {
      upperActive: showUpper.value > 0.3,
      descentActive: showDescent.value > 0.3,
      pathEdges: edges,
      expanded,
      frontier,
      reachedG: ws >= 2.8,
    };
  });

  const live = guardedDynamic(s.value(1), () => {
    const sn = showNarrow.value;
    const sa = showAsk.value;
    const sAns = showAnswer.value;
    const ws = showWideStep.value;
    const sb = showBuild.value;

    const nodes = [
      txt('3D HNSW MULTI-LAYER GRAPH (L1 -> L0)', 520, -330, 26, COSMOS.cyan, 'mono'),
      txt(
        ws >= 2.8
          ? 'ef = 2 path: A -> S -> B -> G (dist 0.1!)'
          : 'Upper skip S -> A descends into Layer 0',
        520,
        292,
        26,
        ws >= 2.8 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),

      // Left: Distances & ef=1 vs ef=2 comparison
      txt('DISTANCES TO QUERY Q = [4.0, 0.8]', -855, -205, 26, COSMOS.gold, 'mono', 'left'),
      glassCell(-425, -110, 880, 114, COSMOS.cyan, { fill: '#10203a', glow: 4 }),
      txt(
        `A: ${graphDistance('A').toFixed(1)}   S: ${graphDistance('S').toFixed(2)}   B: ${graphDistance('B').toFixed(2)}   G: ${graphDistance('G').toFixed(1)}`,
        -425,
        -130,
        27,
        COSMOS.ink,
        'mono',
      ),
      txt('Layer 0:  A -- S -- B -- G  (A links only to S)', -425, -84, 26, COSMOS.muted, 'mono'),

      // ef = 1 vs ef = 2 cards
      glassCell(-425, 36, 880, 118, sn > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sn > 0.3 ? '#29111a' : '#12182b',
        glow: sn > 0.3 ? 8 : 2,
      }),
      txt(
        `ef = 1 (GREEDY):  expanded [ ${ef1.expanded.join(' -> ')} ]`,
        -840,
        8,
        27,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        'S is farther than A -> frontier drops S -> trapped at A!',
        -840,
        54,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(-425, 186, 880, 128, sAns > 0.4 ? COSMOS.emerald : COSMOS.muted, {
        fill: sAns > 0.4 ? '#0e2824' : '#12182b',
        glow: sAns > 0.4 ? 9 : 2,
      }),
      txt(
        sAns > 0.4
          ? `ef = 2 (DETOUR):  [ ${ef2.expanded.join(' -> ')} ]`
          : 'ef = 2: which node must stay to escape A?',
        -840,
        158,
        26,
        sAns > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        sb > 0.3
          ? 'M & efConstruction shape build; ef explores query'
          : sAns > 0.4
            ? 'Keeping S unlocks B -> reaches G (0.1 away)'
            : 'In hnswlib, ef >= k requested neighbors',
        -840,
        204,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: sAns > 0.4 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        sb > 0.3
          ? 'Raising efConstruction affects future builds, not an already built HNSW graph'
          : sAns > 0.4
            ? 'Keeping farther node S lets ef = 2 step around the local minimum to G'
            : sa > 0.3
              ? 'Which point must stay in the frontier long enough to leave A?'
              : 'Upper layers take long skips; Layer 0 explores a bounded frontier of size ef',
        -812,
        360,
        28,
        sAns > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 14);
  orbit3d(s, c);

  c.on('hnsw-copies', () => s.play(showUpper.to(0.4, { duration: 0.35 })));
  c.on('hnsw-upper', () => s.play(showUpper.to(1, { duration: 0.4 })));
  c.on('hnsw-descent', () => s.play(showDescent.to(1, { duration: 0.4 })));
  c.on('hnsw-narrow', () => s.play(showNarrow.to(1, { duration: 0.4 })));
  c.on('hnsw-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('hnsw-answer', () => s.play(showAnswer.to(1, { duration: 0.4 })));
  c.on('hnsw-wide', () => s.play(showWideStep.to(0.5, { duration: 0.3 })));
  c.on('hnsw-s', () => s.play(showWideStep.to(1, { duration: 0.35 })));
  c.on('hnsw-b', () => s.play(showWideStep.to(2, { duration: 0.35 })));
  c.on('hnsw-g', () => s.play(showWideStep.to(3, { duration: 0.4 })));
  c.on('hnsw-guard', () => s.play(showBuild.to(0.3, { duration: 0.3 })));
  c.on('hnsw-build', () => s.play(showBuild.to(0.7, { duration: 0.35 })));
  c.on('hnsw-limit', () =>
    s.play(showBuild.to(1, { duration: remainDuration(c, 'hnsw-limit', 0.45) })),
  );
}
