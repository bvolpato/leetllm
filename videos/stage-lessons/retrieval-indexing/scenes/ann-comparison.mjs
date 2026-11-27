// Scene 23: Which reference are you comparing with? (ANN Recall@K vs Task Recall@K)
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
  txt,
} from '../parts.mjs';

export default function annComparison(s, c) {
  const showPair = s.value(0);
  const showAsk = s.value(0);
  const showResult = s.value(0);
  const showFast = s.value(0);
  const showTuned = s.value(0);
  const showFreeze = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1a5216');
  const title = heroTitle(['Which Reference Are', 'You Comparing With?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'TWO DIFFERENT RECALLS · ANN NEIGHBOR AGREEMENT vs HUMAN TASK RELEVANCE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sp = showPair.value;
    const sa = showAsk.value;
    const sr = showResult.value;
    const sf = showFast.value;
    const st = showTuned.value;
    const sz = showFreeze.value;

    const revealed = sr > 0.4;

    const nodes = [
      // Left: Single query at K=1 returning d1 when Exact top-1 is d2 and Judged relevant = {d1, d2}
      txt('APPROX RETURNS d1 AT CUTOFF K = 1', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-455, -96, 790, 134, revealed ? COSMOS.rose : COSMOS.muted, {
        fill: revealed ? '#28111a' : '#12182b',
        glow: revealed ? 9 : 3,
      }),
      txt('vs EXACT NEIGHBOR TOP-1:  { d2 }', -825, -130, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        revealed ? 'ANN Recall@1  =  0 / 1  =  0.00' : 'ANN Recall@1  =  ?',
        -825,
        -84,
        30,
        revealed ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt('Shared IDs with exact top-K divided by K', -825, -48, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(-455, 84, 790, 146, revealed ? COSMOS.emerald : COSMOS.muted, {
        fill: revealed ? '#0e2824' : '#12182b',
        glow: revealed ? 9 : 3,
      }),
      txt('vs HUMAN RELEVANT SET:  { d1, d2 }', -825, 42, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        revealed ? 'Task Recall@1  =  1 / 2  =  0.50' : 'Task Recall@1  =  ?',
        -825,
        88,
        29,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'A non-exact neighbor can still answer the question!',
        -825,
        126,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-455, 240, 790, 108, sz > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10182d',
        glow: sz > 0.3 ? 7 : 2,
      }),
      txt('FREEZE DEV CHOICES -> RUN ON HELD-OUT SET', -825, 218, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Log query IDs, filters, judgments, ranks & latency',
        -825,
        258,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right: 4-query ANN agreement benchmark (Fast 2/4 = 0.50 vs Tuned 4/4 = 1.00)
      txt('4-QUERY NEIGHBOR AGREEMENT (EXACT FIXED)', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -90, 750, 146, sf > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: sf > 0.3 ? '#231b10' : '#12182b',
        glow: sf > 0.3 ? 8 : 2,
      }),
      txt('SUPPLIED LIST 1 (AGREES ON ROWS 2 & 3)', 150, -130, 26, COSMOS.amber, 'mono', 'left'),
      txt('Mean ANN Recall@1 = 2 / 4 = 0.50', 150, -86, 30, COSMOS.ink, 'mono', 'left'),
      meterBar(150, -40, 670, 24, sf > 0.3 ? 0.5 : 0.15, COSMOS.amber),

      glassCell(495, 92, 750, 146, st > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: st > 0.3 ? '#0e2824' : '#12182b',
        glow: st > 0.3 ? 9 : 2,
      }),
      txt('SUPPLIED LIST 2 (ALL 4 IDs MATCH)', 150, 52, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Mean ANN Recall@1 = 4 / 4 = 1.00', 150, 96, 30, COSMOS.emerald, 'mono', 'left'),
      meterBar(150, 142, 670, 24, st > 0.3 ? 1.0 : 0.15, COSMOS.emerald),

      glassCell(495, 244, 750, 102, COSMOS.muted, { fill: '#10182d', glow: 2 }),
      txt('Agreement is not speed: time the actual searches!', 495, 246, 26, COSMOS.gold, 'sans'),

      glowDot(-840, 358, { radius: 6, color: revealed ? COSMOS.emerald : COSMOS.gold }),
      txt(
        revealed
          ? '0/1 exact neighbor match yet 1/2 task recall -> always match eligible corpus, metric & tie rule'
          : sa > 0.3
            ? 'Returning d1 at K=1: what fraction did Exact vs Human Relevance each recover?'
            : sp > 0.3
              ? 'Separate index fidelity (ANN recall) from end-user usefulness (Task recall)'
              : 'Compare approximate IDs against exact scan AND human relevance judgments',
        -812,
        360,
        28,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('ann-pair', () => s.play(showPair.to(1, { duration: 0.4 })));
  c.on('ann-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('ann-result', () => s.play(showResult.to(1, { duration: 0.45 })));
  c.on('ann-fast', () => s.play(showFast.to(0.5, { duration: 0.35 })));
  c.on('ann-fast-rate', () => s.play(showFast.to(1, { duration: 0.4 })));
  c.on('ann-tuned', () => s.play(showTuned.to(0.5, { duration: 0.35 })));
  c.on('ann-all', () => s.play(showTuned.to(1, { duration: 0.4 })));
  c.on('ann-freeze', () =>
    s.play(showFreeze.to(1, { duration: remainDuration(c, 'ann-freeze', 0.45) })),
  );
}
