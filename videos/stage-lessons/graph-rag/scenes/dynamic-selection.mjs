// Scene 11: Which reports get a turn? (Dynamic hierarchical pruning: Serving 0.9 -> 0.2 hides Cache & Queue; AP News 77% savings vs +34% L3)
import {
  COSMOS,
  aura,
  dynamicTree,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function dynamicSelection(s, c) {
  const phase = s.value(0);
  const showPass1 = s.value(0);
  const showDrop = s.value(0);
  const showNone = s.value(0);
  const showStudy = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Which Reports', 'Get a Turn?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'DYNAMIC COMMUNITY SELECTION · THRESHOLD >= 0.5 PRUNING · AP NEWS STUDY',
  });

  const runA = dynamicTree(0.9);
  const runB = dynamicTree(0.2);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const p1 = showPass1.value;
    const dr = showDrop.value;
    const sn = showNone.value;
    const st = showStudy.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const low = dr > 0.3;

    const nodes = [
      // Left: Interactive 2-root selector tree (Serving -> Cache, Queue; Eval -> Metric)
      txt(
        'HIERARCHICAL SELECTOR (OPEN BRANCH IF >= 0.5)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-465, 22, 780, 404, sn > 0.4 ? COSMOS.rose : COSMOS.cyan, {
        fill: '#0e182e',
        glow: 4,
      }),

      // Edges
      line([-635, -75], [-725, 45], {
        stroke: low ? COSMOS.rose : COSMOS.emerald,
        width: 3.5,
        dash: low ? [8, 6] : undefined,
      }),
      line([-635, -75], [-525, 45], {
        stroke: low ? COSMOS.rose : COSMOS.emerald,
        width: 3.5,
        dash: low ? [8, 6] : undefined,
      }),
      line([-255, -75], [-255, 45], { stroke: COSMOS.rose, width: 3.0, dash: [8, 6] }),

      // Root 1: Serving (0.9 -> 0.2)
      glassCell(-635, -108, 280, 74, low ? COSMOS.rose : COSMOS.emerald, {
        fill: low ? '#28111a' : '#0e2824',
        glow: 7,
      }),
      txt(
        low ? 'Serving: 0.2' : 'Serving: 0.9',
        -635,
        -106,
        26,
        low ? COSMOS.rose : COSMOS.emerald,
        'mono',
      ),

      // Root 2: Eval (0.1 -> pruned)
      glassCell(-255, -108, 240, 74, COSMOS.rose, { fill: '#28111a', glow: 4 }),
      txt('Eval: 0.1', -255, -106, 26, COSMOS.rose, 'mono'),

      // Leaves under Serving & Eval
      glassCell(-725, 76, 200, 72, low ? COSMOS.muted : COSMOS.emerald, {
        fill: '#10203a',
        glow: 2,
      }),
      txt(
        low ? 'Cache: ?' : 'Cache: 0.8',
        -725,
        78,
        26,
        low ? COSMOS.muted : COSMOS.emerald,
        'mono',
      ),

      glassCell(-505, 76, 200, 72, low ? COSMOS.muted : COSMOS.emerald, {
        fill: '#10203a',
        glow: 2,
      }),
      txt(
        low ? 'Queue: ?' : 'Queue: 0.7',
        -505,
        78,
        26,
        low ? COSMOS.muted : COSMOS.emerald,
        'mono',
      ),

      glassCell(-255, 76, 220, 72, COSMOS.muted, { fill: '#12182b', glow: 2 }),
      txt('Metric: skip', -255, 78, 26, COSMOS.muted, 'mono'),

      txt(
        sn > 0.4
          ? `NEITHER LEAF! Both < 0.5 (${runB.visited.join(', ')})`
          : low
            ? 'Serving->0.2: which leaves visited? ?'
            : `Pass 1 selected: [ ${runA.selected.join(', ')} ] (Eval pruned)`,
        -825,
        182,
        26,
        sn > 0.4 ? COSMOS.rose : low ? COSMOS.gold : COSMOS.emerald,
        'mono',
        'left',
      ),

      // Right: Static 12-report map batches + AP News Nov 2024 experiment
      txt('STATIC BATCHING & AP NEWS BENCHMARK', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -94, 750, 146, p1 > 0.2 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: 3,
      }),
      txt('12 REPORTS -> 2 MAP CALLS (6 / BATCH)', 145, -132, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Parallel map cuts latency, NOT total tokens', 145, -86, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'Always count extra rating calls + hidden evidence',
        145,
        -46,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(495, 114, 750, 198, st > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: st > 0.3 ? 9 * pulse : 2,
      }),
      txt('MICROSOFT AP NEWS STUDY (50 GLOBAL Qs)', 145, 52, 26, COSMOS.gold, 'mono', 'left'),
      txt('· Dynamic vs static L1: -77% avg tokens', 145, 98, 28, COSMOS.emerald, 'mono', 'left'),
      txt(
        '· L3 subset (29 Qs, more reports): +34% cost',
        145,
        144,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        '· Factual accuracy still needs its own eval',
        145,
        186,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Dynamic pruning saves tokens when parents filter cleanly, but a missed parent hides its leaves',
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

  c.on('dynamic-selection-batches', () => s.play(showPass1.to(0.3, { duration: 0.3 })));
  c.on('dynamic-selection-rate-serving', () => s.play(showPass1.to(0.5, { duration: 0.3 })));
  c.on('dynamic-selection-rate-cache', () => s.play(showPass1.to(0.7, { duration: 0.3 })));
  c.on('dynamic-selection-rate-queue', () => s.play(showPass1.to(0.85, { duration: 0.3 })));
  c.on('dynamic-selection-prune-eval', () => s.play(showPass1.to(1, { duration: 0.3 })));
  c.on('dynamic-selection-parent-change', () => s.play(showDrop.to(1, { duration: 0.4 })));
  c.after('dynamic-selection-no-leaves', () => s.play(showNone.to(1, { duration: 0.4 })));
  c.on('dynamic-selection-study', () =>
    s.play(showStudy.to(1, { duration: remainDuration(c, 'dynamic-selection-study', 0.45) })),
  );
}
