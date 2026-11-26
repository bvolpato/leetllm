// Scene 24: How much faster is the whole workload?: MLPerf BERT, GPT MFU, and Amdahl 100ms -> 90ms bar.
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function benchmarkScopes(s, c) {
  const phase = s.value(0);
  const showBert = s.value(0.5);
  const showGpt = s.value(0);
  const showAmdahl = s.value(0);
  const halveAttn = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#6ee7b716');
  const title = heroTitle(['Kernel Speed vs', 'Whole Workload'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'BENCHMARK SCOPES · AMDAHL LIMIT',
  });

  const live = guardedDynamic(1, () => {
    const bt = showBert.value;
    const gp = showGpt.value;
    const am = showAmdahl.value;
    const hv = halveAttn.value;

    const attnMs = 20 - 10 * hv;
    const totalMs = attnMs + 80;
    const barScale = 10.2;
    const xLeft = -620;

    const nodes = [
      // Top Left: BERT-large MLPerf 1.1 (8x A100, seq 512, 10 runs)
      glassCell(-430, -110, 800, 225, COSMOS.cyan, { fill: '#0e192d', glow: 8, opacity: bt }),
      txt(
        'BERT-LARGE · 8×A100 · SEQ 512 (10 RUNS)',
        -795,
        -182,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(bt),
      rect(360, 38, { fill: COSMOS.blue, stroke: null, radius: 6 })
        .at(-615, -120)
        .opacity(0.85 * bt),
      txt('MLPerf: 20.0 min', -410, -120, 26, COSMOS.ink, 'mono', 'left').opacity(bt),
      rect(360 * (17.4 / 20), 38, { fill: COSMOS.emerald, stroke: null, radius: 6 })
        .at(-795 + 360 * (17.4 / 20) * 0.5, -56)
        .glow(7, COSMOS.emerald)
        .opacity(0.92 * bt),
      txt('Flash: 17.4 (−13%)', -410, -56, 26, COSMOS.emerald, 'mono', 'left').opacity(bt),

      // Top Right: FA2 GPT training step (225 TFLOP/s/GPU, 72% MFU)
      glassCell(445, -110, 800, 225, COSMOS.gold, {
        fill: '#1a1712',
        glow: gp > 0.4 ? 9 : 2,
        opacity: Math.max(0.3, gp),
      }),
      txt('FA2 PAPER · GPT TRAINING SCOPE', 80, -182, 26, COSMOS.gold, 'mono', 'left').opacity(
        Math.max(0.3, gp),
      ),
      txt('225 TFLOP/s per GPU   ·   72% MFU', 80, -120, 32, COSMOS.gold, 'mono', 'left')
        .glow(6, COSMOS.gold)
        .opacity(Math.max(0.3, gp)),
      rect(680, 34, { fill: '#11182c', stroke: '#33446c', width: 2, radius: 7 })
        .at(420, -56)
        .opacity(Math.max(0.3, gp)),
      rect(680 * 0.72, 26, { fill: COSMOS.cyan, stroke: null, radius: 5 })
        .at(80 + 680 * 0.72 * 0.5, -56)
        .glow(7, COSMOS.cyan)
        .opacity(Math.max(0.3, gp)),

      // Bottom: Live Amdahl request bar (100 ms -> 90 ms = 1.11x)
      glassCell(0, 215, 1680, 305, am > 0.4 ? COSMOS.emerald : '#263455', {
        fill: '#0e1526',
        glow: am > 0.4 ? 9 : 0,
        opacity: Math.max(0.35, am),
      }),
      txt(
        'ONE REQUEST TIMELINE (SERIAL WORKLOAD)',
        -795,
        108,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(Math.max(0.35, am)),
      // Baseline 20 + 80 = 100 ms
      txt('Baseline', -795, 185, 26, COSMOS.muted, 'mono', 'left').opacity(Math.max(0.35, am)),
      rect(20 * barScale, 54, { fill: COSMOS.cyan, stroke: null, radius: 6 })
        .at(xLeft + 10 * barScale, 185)
        .opacity(0.9 * Math.max(0.35, am)),
      rect(80 * barScale, 54, { fill: '#28385e', stroke: '#4d6599', width: 1.5, radius: 6 })
        .at(xLeft + 20 * barScale + 40 * barScale, 185)
        .opacity(0.9 * Math.max(0.35, am)),
      txt('20 ms', xLeft + 10 * barScale, 185, 26, '#070910', 'mono').opacity(Math.max(0.35, am)),
      txt('80 ms other work', xLeft + 60 * barScale, 185, 26, COSMOS.ink, 'sans').opacity(
        Math.max(0.35, am),
      ),
      txt('100.0 ms', xLeft + 100 * barScale + 34, 185, 30, COSMOS.muted, 'mono', 'left').opacity(
        Math.max(0.35, am),
      ),

      // Halved attention row: attnMs + 80 = totalMs
      txt('2× attn', -795, 275, 26, COSMOS.emerald, 'mono', 'left').opacity(Math.max(0.35, am)),
      rect(attnMs * barScale, 54, { fill: COSMOS.emerald, stroke: null, radius: 6 })
        .at(xLeft + attnMs * barScale * 0.5, 275)
        .glow(8, COSMOS.emerald)
        .opacity(0.94 * Math.max(0.35, am)),
      rect(80 * barScale, 54, { fill: '#28385e', stroke: '#4d6599', width: 1.5, radius: 6 })
        .at(xLeft + attnMs * barScale + 40 * barScale, 275)
        .opacity(0.9 * Math.max(0.35, am)),
      txt(
        `${attnMs.toFixed(0)}ms`,
        xLeft + attnMs * barScale * 0.5,
        275,
        26,
        '#070910',
        'mono',
      ).opacity(Math.max(0.35, am)),
      txt(
        '80 ms other work',
        xLeft + attnMs * barScale + 40 * barScale,
        275,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(Math.max(0.35, am)),
      txt(
        `${totalMs.toFixed(1)} ms  (${(100 / totalMs).toFixed(2)}×)`,
        xLeft + totalMs * barScale + 34,
        275,
        30,
        COSMOS.gold,
        'mono',
        'left',
      )
        .glow(6, COSMOS.gold)
        .opacity(Math.max(0.35, am)),
    ];

    if (hv > 0.5) {
      nodes.push(
        txt(
          'Halving 20% attention saves 10 ms → 100 / 90 ≈ +11% req/s',
          0,
          342,
          26,
          COSMOS.gold,
          'mono',
        ).opacity(hv),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 10);

  c.on('benchmark-scopes-beat-1', () => s.play(showBert.to(1, { duration: 0.45 })));
  c.on('benchmark-scopes-beat-2', () => s.play(showGpt.to(1, { duration: 0.45 })));
  c.on('benchmark-scopes-beat-3', () => s.play(showAmdahl.to(1, { duration: 0.45 })));
  c.on('fa-half-attention', () =>
    s.play(halveAttn.to(1, { duration: remainDuration(c, 'fa-half-attention', 0.9) })),
  );
}
