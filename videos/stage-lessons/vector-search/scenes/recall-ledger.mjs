// Scene 8: How much of the exact pair survived? (Recall@2 identity matching: 1/2 -> 2/2, fair exact-reference contract)
import {
  COSMOS,
  EXACT_PAIR,
  PROBE1,
  PROBE2,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  meterBar,
  recall,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function recallLedger(s, c) {
  const phase = s.value(0);
  const showMatch1 = s.value(0);
  const showHalf = s.value(0);
  const showMatch2 = s.value(0);
  const showContract = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['How Much of the', 'Exact Pair Survived?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'RECALL@K LEDGER · IDENTITY MATCHING AGAINST THE EXACT FLAT REFERENCE',
  });

  const r1 = recall(PROBE1.result, EXACT_PAIR);
  const r2 = recall(PROBE2.result, EXACT_PAIR);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const m1 = showMatch1.value;
    const sh = showHalf.value;
    const m2 = showMatch2.value;
    const sc = showContract.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Match lane diagram (Exact [A, B] vs nprobe=1 [A, C] vs nprobe=2 [A, B])
      txt('IDENTITY MATCH LANES (k = 2)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -94, 780, 146, sh > 0.3 ? COSMOS.amber : COSMOS.cyan, {
        fill: '#231c10',
        glow: sh > 0.3 ? 8 : 2,
      }),
      txt('nprobe = 1 (3 vectors scored):', -825, -134, 26, COSMOS.amber, 'mono', 'left'),
      txt('Exact [ A, B ]  <->  Approx [ A, C ]', -825, -88, 28, COSMOS.ink, 'mono', 'left'),
      txt(
        `A matches; C misses -> Recall@2 = 1/2 = ${(r1 * 100).toFixed(0)}%`,
        -825,
        -46,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-465, 92, 780, 146, m2 > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: m2 > 0.3 ? 9 * pulse : 2,
      }),
      txt('nprobe = 2 (6 vectors scored):', -825, 52, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Exact [ A, B ]  <->  Approx [ A, B ]', -825, 98, 28, COSMOS.ink, 'mono', 'left'),
      txt(
        `Both A & B match -> Recall@2 = 2/2 = ${(r2 * 100).toFixed(0)}%`,
        -825,
        140,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // Visual match connector bar
      line([-825, 224], [-115, 224], {
        stroke: m1 > 0.3 ? COSMOS.emerald : COSMOS.muted,
        width: 3.5,
      }).glow(6, COSMOS.emerald),
      txt(
        'Probing ALL lists in IVF Flat (raw coords) is exhaustive',
        -825,
        256,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),

      // Right: Recall meters + Production benchmark hygiene
      txt('FAIR RECALL BENCHMARK CONTRACT', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -94, 750, 158, COSMOS.cyan, { fill: '#10203a', glow: 3 }),
      txt(`nprobe = 1   Recall@2 = ${r1.toFixed(2)}`, 145, -138, 26, COSMOS.amber, 'mono', 'left'),
      meterBar(145, -104, 660, 18, r1, COSMOS.amber),
      txt(`nprobe = 2   Recall@2 = ${r2.toFixed(2)}`, 145, -66, 26, COSMOS.emerald, 'mono', 'left'),
      meterBar(145, -32, 660, 18, m2 > 0.3 ? r2 : 0.1, COSMOS.emerald),

      glassCell(495, 114, 750, 204, sc > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#12182d',
        glow: sc > 0.3 ? 9 * pulse : 2,
      }),
      txt('HOLD FIXED BETWEEN EXACT & ANN:', 145, 52, 26, COSMOS.gold, 'mono', 'left'),
      txt('· Same embeddings, metric & tie-break rule', 145, 96, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        '· Same filter & corpus revision; same cutoff k',
        145,
        136,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt(
        '· Measure latency at production concurrency',
        145,
        176,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Recall measures index fidelity to exact search; if exact hits are weak, improve the embedding',
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

  c.on('recall-ledger-b1-1', () => s.play(showMatch1.to(1, { duration: 0.4 })));
  c.on('recall-ledger-b1-2', () => s.play(showHalf.to(1, { duration: 0.4 })));
  c.on('recall-ledger-b2-1', () => s.play(showMatch2.to(1, { duration: 0.4 })));
  c.on('recall-ledger-b3-1', () =>
    s.play(showContract.to(1, { duration: remainDuration(c, 'recall-ledger-b3-1', 0.45) })),
  );
}
