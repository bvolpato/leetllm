// Scene 14: How often will people ask? (Crossover ~221 queries: 1+1.7Q vs 200+0.8Q; Route release gates Basic/Global with strict withholding)
import {
  COST_10,
  COST_500,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function workloadCost(s, c) {
  const showTen = s.value(0);
  const showMove = s.value(0);
  const showMany = s.value(0);
  const showFact = s.value(0);
  const showTrend = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['How Often Will', 'People Ask?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'WORKLOAD ECONOMICS · CROSSOVER ~221 QUERIES · ROUTE RELEASE GATES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const s10 = showTen.value;
    const smv = showMove.value;
    const s500 = showMany.value;
    const sf = showFact.value;
    const st = showTrend.value;

    // Left: Break-even chart (0 to 500 queries, 0 to 900 cost units)
    const ox = -785;
    const oy = 185;
    const xMap = (q) => ox + (q / 500) * 650;
    const yMap = (cost) => oy - (cost / 900) * 310;
    const crossQ = COST_10.crossover;
    const crossCost = 1 + 1.7 * crossQ;

    const nodes = [
      glassCell(-445, 16, 820, 428, COSMOS.cyan, { fill: '#0e182e', glow: 4 }),
      txt('COST PER REFRESH CYCLE (Q = 0..500)', -825, -166, 26, COSMOS.cyan, 'mono', 'left'),

      line([ox, oy], [ox + 670, oy], { stroke: COSMOS.muted, width: 2.0 }),
      line([ox, oy], [ox, oy - 300], { stroke: COSMOS.muted, width: 2.0 }),
      txt('Queries / refresh ->', ox + 380, oy + 24, 26, COSMOS.muted, 'mono', 'left'),

      // Deferred line (yellow): 1 + 1.7Q
      glowingTrail(
        [
          [xMap(0), yMap(1)],
          [xMap(500), yMap(COST_500.deferred)],
        ],
        { color: COSMOS.gold, width: 4.0, glow: 8 },
      ),
      // Precomputed line (cyan): 200 + 0.8Q
      glowingTrail(
        [
          [xMap(0), yMap(200)],
          [xMap(500), yMap(COST_500.precomputed)],
        ],
        { color: COSMOS.cyan, width: 4.0, glow: 8 },
      ),

      // Crossover marker (~221)
      glowDot(xMap(crossQ), yMap(crossCost), { radius: 9, color: COSMOS.emerald }),
      txt(
        s500 > 0.4 ? 'Cross ~221 Qs' : 'Cross: ?',
        xMap(crossQ) - 85,
        yMap(crossCost) - 56,
        26,
        COSMOS.emerald,
        'mono',
      ),
      txt('Deferred: 1 + 1.7Q', -760, -134, 26, COSMOS.gold, 'mono', 'left'),
      txt('Precomp: 200 + 0.8Q', -430, -134, 26, COSMOS.cyan, 'mono', 'left'),

      // Right: Interactive volume verdict + Route release gate (strict c.after withholding!)
      txt('VOLUME BILL & ROUTE RELEASE GATES', 100, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(
        495,
        -94,
        770,
        146,
        s500 > 0.4 ? COSMOS.cyan : s10 > 0.4 ? COSMOS.gold : COSMOS.muted,
        {
          fill: '#10203a',
          glow: 6,
        },
      ),
      txt(
        s10 > 0.4
          ? `Q=10: Def ${COST_10.deferred} vs Pre ${COST_10.precomputed} (DEFERRED)`
          : 'Q = 10 queries: which bill is smaller? ?',
        140,
        -130,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        s500 > 0.4
          ? `Q=500: Pre ${COST_500.precomputed} vs Def ${COST_500.deferred} (PRECOMP)`
          : smv > 0.3
            ? 'Q = 500 queries: which strategy wins? ?'
            : 'Pay 199 upfront to save 0.9 / query',
        140,
        -82,
        26,
        s500 > 0.4 ? COSMOS.cyan : COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(
        495,
        114,
        770,
        206,
        st > 0.4 ? COSMOS.emerald : sf > 0.4 ? COSMOS.cyan : COSMOS.gold,
        {
          fill: '#12182d',
          glow: st > 0.4 ? 9 : 3,
        },
      ),
      txt('RELEASE GATE: >= 90% ACCURACY + LATENCY CAP', 140, 48, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        sf > 0.4
          ? 'Facts <=200ms: BASIC (Local 240ms fails)'
          : 'Facts <=200ms: Basic vs Local -> ?',
        140,
        96,
        26,
        sf > 0.4 ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        st > 0.4
          ? 'Trends <=700ms: GLOBAL (Basic 61% fails)'
          : 'Trends <=700ms: Global vs Basic -> ?',
        140,
        142,
        26,
        st > 0.4 ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        'If every candidate misses a limit, hold that class back',
        140,
        186,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Frequent refreshes shrink queries per build; gate every route on accuracy, latency, and spend',
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

  c.on('workload-cost-volume', () => s.play(showTen.to(0.15, { duration: 0.3 })));
  c.after('workload-cost-volume-ten', () => s.play(showTen.to(1, { duration: 0.4 })));
  c.on('workload-cost-move', () => s.play(showMove.to(1, { duration: 0.4 })));
  c.after('workload-cost-volume-many', () => s.play(showMany.to(0.7, { duration: 0.35 })));
  c.on('workload-cost-cost-crossing', () => s.play(showMany.to(1, { duration: 0.35 })));
  c.on('workload-cost-rules', () => s.play(showFact.to(0.15, { duration: 0.3 })));
  c.after('workload-cost-fact-route', () => s.play(showFact.to(1, { duration: 0.4 })));
  c.after('workload-cost-trend-route', () => s.play(showTrend.to(1, { duration: 0.4 })));
  c.on('workload-cost-refresh', () =>
    s.play(showTrend.to(1, { duration: remainDuration(c, 'workload-cost-refresh', 0.3) })),
  );
}
