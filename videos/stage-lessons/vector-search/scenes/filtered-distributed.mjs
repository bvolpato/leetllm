// Scene 13: Where can an eligible passage disappear? (Post-filter starvation 60.6% vs 99.5%, 10-shard merge 0.99^10=90.4%, filter-aware graph bridge)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function filteredDistributed(s, c) {
  const phase = s.value(0);
  const showWindow = s.value(0);
  const showProb = s.value(0);
  const showShards = s.value(0);
  const showTail = s.value(0);
  const showBridge = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Where Can an Eligible', 'Passage Disappear?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'FILTERED & SHARDED SEARCH · EMPTY-WINDOW RISK · TAIL LATENCY · BRIDGE REPAIR',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sw = showWindow.value;
    const sp = showProb.value;
    const ss = showShards.value;
    const st = showTail.value;
    const sb = showBridge.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left top: EU post-filter buffer 3 -> 5 inside trusted service
      txt('1. POST-FILTER STARVATION (EU RUNBOOKS)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -108, 780, 128, sw > 0.5 ? COSMOS.emerald : COSMOS.amber, {
        fill: '#10203a',
        glow: sw > 0.3 ? 8 : 2,
      }),
      txt(
        sw > 0.5
          ? 'Buffer 3 -> 5: 2nd EU hit recovered!'
          : 'Top-3 buffer -> only 1 EU hit survives',
        -825,
        -136,
        26,
        sw > 0.5 ? COSMOS.emerald : COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        'Enforce access rules inside trusted retrieval service',
        -825,
        -88,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Left bottom: Empty-window probability (60.6% independent vs 99.5% clustered!)
      txt('2. EMPTY-WINDOW RISK (p = 0.5%, 100 HITS)', -855, 6, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(-465, 146, 780, 212, sp > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sp > 0.3 ? 9 * pulse : 2,
      }),
      txt('Independent: 0.995^100 = 60.6% empty!', -825, 76, 26, COSMOS.amber, 'mono', 'left'),
      meterBar(-825, 108, 690, 18, 0.606, COSMOS.amber),
      txt('Clustered region: 1 draw = 99.5% empty!', -825, 148, 26, COSMOS.rose, 'mono', 'left'),
      meterBar(-825, 180, 690, 18, sp > 0.6 ? 0.995 : 0.606, COSMOS.rose),
      txt(
        'Same mean (0.5 hits), huge empty-result gap',
        -825,
        216,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right top: 10-shard fanout & 0.99^10 = 90.4% tail latency
      txt('3. 10-SHARD MERGE & TAIL LATENCY', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -72, 750, 198, ss > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: st > 0.3 ? 9 * pulse : 2,
      }),
      txt('10 shards x exact top-5 -> global top-5', 145, -134, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Lose 1 shard -> PARTIAL result (no guard)', 145, -88, 26, COSMOS.rose, 'mono', 'left'),
      txt('99% / shard -> 0.99^10 = 90.4% all-10', 145, -42, 26, COSMOS.gold, 'mono', 'left'),
      txt('IVF-PQ / DiskANN shrink RAM before sharding', 145, 2, 26, COSMOS.muted, 'sans', 'left'),

      // Right bottom: Filter-aware graph bridge traversal
      txt('4. FILTER-AWARE TRAVERSAL REPAIR', 110, 64, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(495, 174, 750, 152, sb > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sb > 0.3 ? 9 * pulse : 2,
      }),
      txt(
        'Cross ineligible bridge node inside trusted graph',
        145,
        134,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),
      txt(
        'Return ONLY eligible IDs (or exact scan small sets)',
        145,
        180,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Apply identical filter to the exact recall reference',
        145,
        218,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Correlated filters starve post-filtering; cross bridges in-graph or exact-scan tiny subsets',
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
  runPhase(s, c, phase, 14);

  c.on('filtered-distributed-b1', () => s.play(showWindow.to(0.4, { duration: 0.35 })));
  c.on('expand-filter-window', () => s.play(showWindow.to(1, { duration: 0.4 })));
  c.on('filtered-distributed-b2', () => s.play(showProb.to(0.3, { duration: 0.3 })));
  c.on('independent-empty', () => s.play(showProb.to(0.55, { duration: 0.3 })));
  c.on('shared-region', () => s.play(showProb.to(0.8, { duration: 0.3 })));
  c.on('shared-empty', () => s.play(showProb.to(1, { duration: 0.35 })));
  c.on('filtered-distributed-b3', () => s.play(showShards.to(0.5, { duration: 0.35 })));
  c.on('lose-shard', () => s.play(showShards.to(1, { duration: 0.35 })));
  c.on('filtered-distributed-b3-extension', () => s.play(showTail.to(1, { duration: 0.4 })));
  c.on('filter-aware-repair', () =>
    s.play(showBridge.to(1, { duration: remainDuration(c, 'filter-aware-repair', 0.45) })),
  );
}
