// Scene 5: Where the links come from (HNSW insertion: 1/ln(M) level draw, diverse neighbor heuristic, efSearch >= k)
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

export default function insertGraph(s, c) {
  const phase = s.value(0);
  const showSample = s.value(0);
  const showWire = s.value(0);
  const showHeuristic = s.value(0);
  const showCap = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Where the Links', 'Come From'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'HNSW INSERTION · LEVEL SAMPLING · DIVERSE PRUNING · EF_SEARCH >= K',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showSample.value;
    const sw = showWire.value;
    const sh = showHeuristic.value;
    const sc = showCap.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const raised = sc > 0.6;

    const nodes = [
      // Left: Level distribution + Wiring G on layers 1 and 0
      txt('1. LAYER SAMPLING & INSERTION WALK', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -98, 780, 140, ss > 0.3 ? COSMOS.violet : COSMOS.muted, {
        fill: '#181430',
        glow: ss > 0.3 ? 8 : 2,
      }),
      txt(
        'Scale = 1 / ln(M) -> P(layer >= L) = (1 / M)^L',
        -825,
        -134,
        26,
        COSMOS.violet,
        'mono',
        'left',
      ),
      txt('L0: 100% | L1: 1/M | L2: 1/M^2 (most at L0)', -825, -90, 26, COSMOS.ink, 'mono', 'left'),
      meterBar(-825, -52, 680, 18, 0.22, COSMOS.violet),

      glassCell(-465, 92, 780, 184, sw > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sw > 0.3 ? 8 : 2,
      }),
      txt('NEW NODE G DRAWS LAYER 1 (TOP ENTRY AT L2)', -825, 34, 26, COSMOS.cyan, 'mono', 'left'),
      txt('· Walk L2 greedily to find entry point', -825, 78, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        '· Wire G on L1 and L0 using efConstruction beam',
        -825,
        118,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),
      txt(
        '· Global entry changes ONLY if G beats max layer',
        -825,
        154,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Diversity heuristic + Query budget check (k=12 vs efSearch=6)
      txt('2. DIVERSITY PRUNING & QUERY BUDGET', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -98, 750, 154, sh > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: sh > 0.3 ? 8 * pulse : 2,
      }),
      txt('DIVERSE NEIGHBOR RULE (UP TO M, BASE 2M)', 145, -138, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'Keep candidate only if closer to G than to already',
        145,
        -94,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'selected links -> spreads edges in all directions',
        145,
        -54,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      glassCell(
        495,
        108,
        750,
        182,
        raised ? COSMOS.emerald : sc > 0.2 ? COSMOS.rose : COSMOS.muted,
        {
          fill: raised ? '#0e2824' : sc > 0.2 ? '#29111a' : '#12182b',
          glow: sc > 0.2 ? 9 * pulse : 2,
        },
      ),
      txt(
        raised ? 'QUERY BUDGET FIXED: efSearch >= 12' : 'CALLER ASKS k = 12, efSearch = 6!',
        145,
        54,
        26,
        raised ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        raised
          ? 'Raise efSearch to >= 12 (or reject invalid request)'
          : 'Result heap of 6 cannot even hold 12 requested hits',
        145,
        102,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      meterBar(145, 148, 660, 22, raised ? 1.0 : 0.5, raised ? COSMOS.emerald : COSMOS.rose),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Reciprocal pruning can leave one-way links; always measure recall & latency on the built graph',
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

  c.on('insert-graph-b1', () => s.play(showSample.to(1, { duration: 0.4 })));
  c.on('insert-graph-b2', () => s.play(showWire.to(1, { duration: 0.4 })));
  c.on('insert-graph-b3', () => s.play(showHeuristic.to(1, { duration: 0.4 })));
  c.on('query-capacity', () => s.play(showCap.to(0.45, { duration: 0.35 })));
  c.on('raise-query-capacity', () =>
    s.play(showCap.to(1, { duration: remainDuration(c, 'raise-query-capacity', 0.45) })),
  );
}
