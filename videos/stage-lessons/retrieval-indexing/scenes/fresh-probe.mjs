// Scene 25: Spend a second probe? (Fresh transfer at q = 5.2 vs q = 4.9 with orbiting 3D Voronoi stage)
import {
  COSMOS,
  aura,
  flatRoute,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  ivfRoute,
  makeIvfVoronoi3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshProbe(s, c) {
  const phase = s.value(0);
  const queryPos = s.value(4.9);
  const showAsk = s.value(0);
  const showAnswer = s.value(0);
  const showCount = s.value(0);
  const showCompare = s.value(0);
  const showSpend = s.value(0);
  const showDecision = s.value(0);

  const bgAura = aura(0, 10, 680, '#12366028', '#2a1c5216');
  const title = heroTitle(['Spend a Second', 'Probe?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.emerald,
    eyebrow: 'FINAL TRANSFER · MOVE ONLY THE QUERY: 4.9 -> 5.2 (nprobe = 1)',
  });

  const { view: stage3d, orbit: orbit3d } = makeIvfVoronoi3D(520, -25, 680, 560, phase, {
    activeProbe: () => (showSpend.value > 0.5 ? 2 : 1),
    queryVal: () => queryPos.value,
  });

  const r52_1 = ivfRoute(5.2, 1);
  const r52_2 = ivfRoute(5.2, 2);
  const r52_f = flatRoute(5.2);
  const r49_1 = ivfRoute(4.9, 1);
  const r49_2 = ivfRoute(4.9, 2);

  const live = guardedDynamic(s.value(1), () => {
    const sa = showAsk.value;
    const sAns = showAnswer.value;
    const sc = showCount.value;
    const sCmp = showCompare.value;
    const sSp = showSpend.value;
    const sDec = showDecision.value;

    const revealed = sAns > 0.4;
    const spendRevealed = sSp > 0.4;

    const nodes = [
      txt(
        `3D VORONOI ROUTE (q = ${queryPos.value.toFixed(1)})`,
        520,
        -330,
        26,
        COSMOS.cyan,
        'mono',
      ),
      txt(
        revealed
          ? 'q = 5.2 crosses boundary -> List 1 opens!'
          : queryPos.value > 5.0
            ? 'Query moved to q = 5.2 (nprobe = 1)'
            : 'Starting at q = 4.9 -> moving to 5.2...',
        520,
        282,
        26,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),

      // Left top: Query 5.2 with 1 probe (strictly withheld before sAns!)
      txt('FRESH QUERY:  q = 5.2   (nprobe = 1)', -855, -205, 26, COSMOS.gold, 'mono', 'left'),
      glassCell(-425, -96, 880, 148, revealed ? COSMOS.emerald : COSMOS.gold, {
        fill: revealed ? '#0e2824' : '#181e34',
        glow: revealed ? 9 : 4,
      }),
      txt(
        revealed
          ? `Winner: ${r52_1.ranked[0].id}  |  Checks: ${r52_1.checks} (2+2)`
          : 'Winner: ?   |   Total distance checks: ?',
        -840,
        -132,
        26,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        revealed
          ? 'Center dists: 5.2 vs 4.8 -> List 1 opens (rot: 0.1, quota: 3.8)'
          : 'List 0 has 1 doc (0.0); List 1 has 2 docs (5.1, 9.0)',
        -840,
        -84,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        sc > 0.3
          ? `Flat scan takes ${r52_f.checks} checks; 2-probe IVF takes ${r52_2.checks} checks`
          : 'Count BOTH center checks and visited passage checks',
        -840,
        -46,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Left bottom: Compare q = 4.9 vs q = 5.2 (strictly withheld before sSp!)
      txt('WHICH QUERY BENEFITS FROM A 2nd PROBE?', -855, 22, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-425, 118, 880, 96, spendRevealed ? COSMOS.emerald : COSMOS.muted, {
        fill: spendRevealed ? '#0e2824' : '#11182c',
        glow: spendRevealed ? 9 : 2,
      }),
      txt('q=4.9:', -840, 120, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        spendRevealed
          ? `1p: ${r49_1.ranked[0].id} -> 2p: ${r49_2.ranked[0].id} (FOUND!)`
          : 'Does 2nd probe change page?  ?',
        -720,
        120,
        26,
        spendRevealed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-425, 232, 880, 96, spendRevealed ? COSMOS.amber : COSMOS.muted, {
        fill: '#11182c',
        glow: 2,
      }),
      txt('q=5.2:', -840, 234, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        spendRevealed
          ? `1p: ${r52_1.ranked[0].id} -> 2p: same (+1 check)`
          : 'Does 2nd probe change page?  ?',
        -720,
        234,
        26,
        spendRevealed ? COSMOS.amber : COSMOS.muted,
        'mono',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: sDec > 0.3 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        sDec > 0.3
          ? 'Compare ANN vs exact on the same eligible set, then choose settings with held-out recall & latency'
          : spendRevealed
            ? 'Only q = 4.9 changes page with a 2nd probe; at 5.2 it only adds 1 check'
            : sCmp > 0.3
              ? 'Compare q = 4.9 vs q = 5.2: for which query does opening a 2nd list change the page?'
              : sa > 0.3 && !revealed
                ? 'At q = 5.2 with 1 probe: which passage returns, and how many checks (incl. centers)?'
                : 'Shift query across the Voronoi boundary from 4.9 to 5.2',
        -812,
        360,
        28,
        sDec > 0.3 ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 14);
  orbit3d(s, c);

  c.on('fresh-move', () => s.play(queryPos.to(5.2, { duration: 0.65 })));
  c.on('fresh-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('fresh-answer', () => s.play(showAnswer.to(0.6, { duration: 0.4 })));
  c.on('fresh-centers', () => s.play(showAnswer.to(0.85, { duration: 0.35 })));
  c.on('fresh-distances', () => s.play(showAnswer.to(1, { duration: 0.35 })));
  c.on('fresh-count', () => s.play(showCount.to(0.6, { duration: 0.35 })));
  c.on('fresh-flat', () => s.play(showCount.to(1, { duration: 0.35 })));
  c.on('fresh-compare', () => s.play(showCompare.to(1, { duration: 0.4 })));
  c.after('fresh-spend', () => s.play(showSpend.to(0.6, { duration: 0.4 })));
  c.on('fresh-extra', () => s.play(showSpend.to(1, { duration: 0.4 })));
  c.on('fresh-decision', () =>
    s.play(showDecision.to(1, { duration: remainDuration(c, 'fresh-decision', 0.45) })),
  );
}
