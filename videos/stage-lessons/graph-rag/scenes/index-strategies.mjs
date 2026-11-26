// Scene 13: What goes into the index? (Standard vs Fast vs LazyGraphRAG ~0.1% index cost, LightRAG incremental merge & delete)
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

export default function indexStrategies(s, c) {
  const phase = s.value(0);
  const showArch = s.value(0);
  const showLazy = s.value(0);
  const showLight = s.value(0);
  const showWithdraw = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What Goes Into', 'the Index?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'INDEXING ARCHITECTURES · STANDARD · FAST · LAZY (~0.1%) · LIGHTRAG',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sa = showArch.value;
    const sl = showLazy.value;
    const lg = showLight.value;
    const wd = showWithdraw.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: 3 indexing pipelines compared (Build-time vs Query-time LLM work)
      txt('1. BUILD-TIME VS QUERY-TIME LLM WORK', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -114, 780, 108, sa > 0.2 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: 3,
      }),
      txt(
        'STANDARD: LLM extract + summaries + reports',
        -825,
        -138,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Highest upfront build cost; precomputed global map',
        -825,
        -94,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-465, 16, 780, 108, sa > 0.5 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: 3,
      }),
      txt(
        'FASTGRAPHRAG: noun-phrase graph + LLM reports',
        -825,
        -8,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Skips LLM entity extraction; still writes reports',
        -825,
        36,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-465, 152, 780, 124, sl > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sl > 0.3 ? 9 * pulse : 3,
      }),
      txt('LAZY: phrase stats; LLM at query time', -825, 118, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'AP News (5,590 docs): ~0.1% of full build cost!',
        -825,
        160,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      meterBar(-825, 194, 690, 14, 0.02, COSMOS.emerald),

      // Right: LightRAG dual-level keywords + incremental add & withdrawal
      txt('2. LIGHTRAG: INCREMENTAL MERGE & DELETE', 110, -205, 26, COSMOS.violet, 'mono', 'left'),

      glassCell(495, -94, 750, 146, lg > 0.3 ? COSMOS.violet : COSMOS.muted, {
        fill: '#181430',
        glow: lg > 0.3 ? 8 : 2,
      }),
      txt('Low-level key ("Redis") -> Entity profile', 145, -130, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'High-level key ("dependencies") -> Edge + text',
        145,
        -86,
        26,
        COSMOS.violet,
        'mono',
        'left',
      ),
      txt(
        'Merges new doc graph into existing Redis node',
        145,
        -46,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(
        495,
        114,
        750,
        198,
        wd > 0.3 ? COSMOS.rose : lg > 0.6 ? COSMOS.emerald : COSMOS.muted,
        {
          fill: wd > 0.3 ? '#26111a' : '#0e2624',
          glow: wd > 0.3 ? 9 * pulse : 3,
        },
      ),
      txt(
        wd > 0.3
          ? 'WITHDRAW NEW NOTE -> DROP SEARCH->REDIS'
          : 'ADD NOTE: Search -> Redis (merges cleanly)',
        145,
        54,
        26,
        wd > 0.3 ? COSMOS.rose : COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        wd > 0.3
          ? 'Search edge lost its ONLY source -> must drop out!'
          : 'Both Inference API & Search point to Redis cache',
        145,
        102,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Original Inference API -> Redis stays (still cited)',
        145,
        148,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),
      txt(
        'Count BOTH daily rebuilds & query traffic together',
        145,
        188,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Balance index rebuild cost against query cost, and test clean edge deletion when notes retract',
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

  c.on('index-strategies-b1', () => s.play(showArch.to(0.4, { duration: 0.3 })));
  c.on('index-strategies-fast', () => s.play(showArch.to(0.75, { duration: 0.3 })));
  c.on('index-strategies-lazy-query', () => s.play(showArch.to(1, { duration: 0.3 })));
  c.on('index-strategies-b2', () => s.play(showLazy.to(1, { duration: 0.4 })));
  c.on('index-strategies-b3', () => s.play(showLight.to(0.3, { duration: 0.3 })));
  c.on('index-strategies-relationship', () => s.play(showLight.to(0.55, { duration: 0.3 })));
  c.on('index-strategies-document', () => s.play(showLight.to(0.8, { duration: 0.3 })));
  c.on('index-strategies-light-merge', () => s.play(showLight.to(1, { duration: 0.3 })));
  c.on('index-strategies-withdraw', () =>
    s.play(showWithdraw.to(1, { duration: remainDuration(c, 'index-strategies-withdraw', 0.45) })),
  );
}
