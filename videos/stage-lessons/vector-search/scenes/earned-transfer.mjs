// Scene 15: Which search budget would you use? (Earned transfer: 3 strict prediction gates + orbiting 3D HNSW/IVF synthesis)
import {
  COSMOS,
  QUERY_NEAR_D,
  aura,
  distance,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeIvfVoronoi3D,
  pointById,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function earnedTransfer(s, c) {
  const phase = s.value(0);
  const showHold = s.value(0);
  const showQ2 = s.value(0);
  const showQ2Ans = s.value(0);
  const showCompare = s.value(0);
  const showFinal = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Which Search Budget', 'Would You Use?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'EARNED TRANSFER · RECALL GATE (90%) · LATENCY GATE (20 MS) · NPROBE = 2',
  });

  const voronoi3d = makeIvfVoronoi3D(555, -20, phase);

  const dB2 = distance(pointById('B'), QUERY_NEAR_D);
  const dA2 = distance(pointById('A'), QUERY_NEAR_D);

  const live = guardedDynamic(s.value(1), () => {
    const sh = showHold.value;
    const q2 = showQ2.value;
    const q2a = showQ2Ans.value;
    const cmp = showCompare.value;
    const fin = showFinal.value;

    const nodes = [
      // Trial 1: Held-out 5-ID check (4/5 = 80% < 90% -> HOLD, strictly withheld before earned-transfer-result!)
      glassCell(-405, -142, 920, 134, sh > 0.4 ? COSMOS.rose : COSMOS.gold, {
        fill: sh > 0.4 ? '#28111a' : '#181e34',
        glow: sh > 0.4 ? 9 : 3,
      }),
      txt(
        '1. HELD-OUT GATE (REQ >= 90% RECALL, <= 20 ms | 12 ms)',
        -835,
        -178,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Exact [10, 21, 34, 55, 89]  vs  Got [10, 21, 34, 55, 3]',
        -835,
        -134,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        sh > 0.4
          ? 'VERDICT: 4/5 = 80% < 90% -> HOLD THIS RUN!'
          : 'Would you accept this run?  (Recall = ?  |  Verdict = ?)',
        -835,
        -94,
        26,
        sh > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      // Trial 2: Query moved near D (B=6.41 vs A=9.04 -> right list alone recovers [D, B], withheld until new-pair!)
      glassCell(
        -405,
        26,
        920,
        146,
        q2a > 0.4 ? COSMOS.emerald : q2 > 0.3 ? COSMOS.cyan : COSMOS.muted,
        {
          fill: q2a > 0.4 ? '#0e2824' : '#101d35',
          glow: q2 > 0.3 ? 8 : 2,
        },
      ),
      txt('2. SECOND QUERY NEAR D (RIGHT LIST SCORED)', -835, -16, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `Right top-2: D & B (${dB2.toFixed(2)})  |  Closest left A: ${dA2.toFixed(2)}`,
        -835,
        30,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        q2a > 0.4
          ? 'KEEP [D, B]: 1 list gets 2/2 (border still 1/2)'
          : 'Would opening the left list change top-2 here?  ?',
        -835,
        72,
        26,
        q2a > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),

      // Trial 3: Workload release table (nprobe=1 75%/11ms vs nprobe=2 100%/18ms, withheld until choose-budget!)
      glassCell(
        -405,
        206,
        920,
        152,
        fin > 0.4 ? COSMOS.emerald : cmp > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: fin > 0.4 ? '#0e2824' : '#231c10',
          glow: cmp > 0.3 ? 10 : 2,
        },
      ),
      txt(
        '3. WORKLOAD GATE (AVG RECALL >= 90%, p95 <= 20 ms)',
        -835,
        162,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'nprobe=1: 75%, p95 8ms  |  nprobe=2: 100%, 18ms',
        -835,
        208,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        fin > 0.4
          ? 'CHOOSE nprobe = 2: 100% recall & 18 ms (2 ms under cap!)'
          : 'Which setting clears BOTH recall & p95 limits?  ?',
        -835,
        250,
        26,
        fin > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),

      // Right 3D caption
      txt('3D BORDER VS INTERIOR QUERIES', 555, -252, 26, COSMOS.emerald, 'mono'),
      txt('nprobe = 2 recovers B at the wall', 555, 258, 26, COSMOS.gold, 'mono'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Evaluate recall & p95 across border and interior queries together before locking search budgets',
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

  s.add(bgAura, title, voronoi3d.view, live);
  runPhase(s, c, phase, 14);
  voronoi3d.orbit(s, c);

  c.on('earned-transfer-b1', () => s.play(showHold.to(0.2, { duration: 0.3 })));
  c.after('earned-transfer-result', () => s.play(showHold.to(1, { duration: 0.4 })));
  c.on('new-query', () => s.play(showQ2.to(0.5, { duration: 0.35 })));
  c.on('show-right-scores', () => s.play(showQ2.to(1, { duration: 0.35 })));
  c.after('new-pair', () => s.play(showQ2Ans.to(1, { duration: 0.4 })));
  c.on('compare-runs', () => s.play(showCompare.to(1, { duration: 0.4 })));
  c.after('choose-budget', () => s.play(showFinal.to(0.6, { duration: 0.35 })));
  c.on('recover-border', () => s.play(showFinal.to(0.85, { duration: 0.35 })));
  c.on('latency-margin', () =>
    s.play(showFinal.to(1, { duration: remainDuration(c, 'latency-margin', 0.45) })),
  );
}
