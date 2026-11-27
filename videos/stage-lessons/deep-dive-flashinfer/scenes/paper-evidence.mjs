// Scene 25: Keep each percentage with its experiment: MLSys 2025 v0.2 setup, SGLang 29-69% ITL, parallel gen 14-17%, 10ms->7ms (+43% rate).
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  par,
  rect,
  remainAfter,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function paperEvidence(s, c) {
  const showSetup = s.value(1);
  const setupHist = s.value(0);
  const showSglang = s.value(0);
  const denomNote = s.value(0);
  const showParGen = s.value(0);
  const convReady = s.value(0);
  const tputNote = s.value(0);

  const bgAura = aura(0, 20, 650, '#60a5fa1c', '#a78bfa1c');

  const title = heroTitle(['Keep Each Percentage', 'With Its Experiment'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r0,
    eyebrow: 'MLSYS 2025 PAPER · HISTORICAL EVIDENCE',
  });

  // View 0: Experimental setup (v0.2, CUDA 12.4, PyTorch 2.4, A100 40GB & H100 80GB SXM, FP16)
  const setupView = guardedDynamic(showSetup, (a) => {
    const sh = setupHist.value;
    const specs = [
      {
        cx: -555,
        h: 'SOFTWARE STACK',
        v: 'FlashInfer v0.2',
        s: 'CUDA 12.4 · PyTorch 2.4',
        col: ROLE.r0,
      },
      {
        cx: 0,
        h: 'GPU HARDWARE',
        v: 'A100 40GB / H100 80GB',
        s: 'Both SXM form factor',
        col: ROLE.r2,
      },
      { cx: 555, h: 'PRECISION', v: 'FP16 / FP16', s: 'Storage and compute', col: COSMOS.gold },
    ];
    const nodes = [
      txt('MLSYS 2025 PAPER EVALUATION ENVIRONMENT', 0, -155, 28, COSMOS.cyan, 'mono').opacity(a),
    ];

    specs.forEach((sp) => {
      nodes.push(
        glassCell(sp.cx, 35, 490, 235, sp.col, { fill: '#0e182e', glow: 8, opacity: a }),
        txt(sp.h, sp.cx, -32, 26, sp.col, 'mono').opacity(a),
        txt(sp.v, sp.cx, 26, 30, COSMOS.ink, 'mono').opacity(a),
        txt(sp.s, sp.cx, 84, 26, COSMOS.muted, 'sans').opacity(a),
      );
    });

    if (sh > 0.05) {
      nodes.push(
        glassCell(0, 295, 1620, 118, ROLE.warn, { fill: '#261b10', glow: 9, opacity: sh * a }),
        txt(
          'Historical design evidence (v0.2), NOT measurements from our pinned v0.6.18 / v0.7.1 walkthrough',
          0,
          295,
          26,
          ROLE.warn,
          'mono',
        ).opacity(sh * a),
      );
    }

    return group(...nodes);
  });

  // View 1: SGLang 29-69% lower ITL vs Triton + preserved denominators
  const sglangView = guardedDynamic(showSglang, (a) => {
    const dn = denomNote.value;
    const nodes = [
      txt(
        'SGLANG COMPARISON (FLASHINFER VS TRITON BACKEND)',
        0,
        -155,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(0, -10, 1480, 140, ROLE.good, { fill: '#0e2824', glow: 9, opacity: a }),
      txt('29% to 69% LOWER INTER-TOKEN LATENCY (ITL)', 0, -34, 36, ROLE.good, 'mono')
        .glow(6, ROLE.good)
        .opacity(a),
      txt(
        'Measured on ShareGPT + specified variable-length workload',
        0,
        22,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),

      glassCell(-410, 175, 680, 128, ROLE.r2, { fill: '#0f2336', glow: 7, opacity: a }),
      txt('SLO CONSTRAINT', -410, 148, 26, ROLE.r2, 'mono').opacity(a),
      txt('Rate tuned for p99 TTFT < 200 ms', -410, 198, 28, COSMOS.ink, 'mono').opacity(a),

      glassCell(410, 175, 680, 128, ROLE.violet, { fill: '#1c1336', glow: 7, opacity: a }),
      txt('OTHER STUDIES', 410, 148, 26, ROLE.violet, 'mono').opacity(a),
      txt(
        'Long-context & parallel gen use own baselines',
        410,
        198,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    if (dn > 0.05) {
      nodes.push(
        txt(
          'Preserve workload, baseline, and SLO when citing ranges',
          0,
          345,
          28,
          COSMOS.gold,
          'sans',
        ).opacity(dn * a),
      );
    }

    return group(...nodes);
  });

  // View 2: Parallel gen (14-17% lower ITL) + 10ms -> 7ms (-30% latency = +43% reciprocal rate)
  const parView = guardedDynamic(showParGen, (a) => {
    const cr = convReady.value;
    const tn = tputNote.value;
    const nodes = [
      txt(
        'PARALLEL GENERATION & LATENCY-VS-RATE ARITHMETIC',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      glassCell(0, -58, 1520, 124, ROLE.r0, { fill: '#10213d', glow: 7, opacity: a }),
      txt('PARALLEL GENERATION: 14% to 17% LOWER ITL', 0, -82, 32, ROLE.r0, 'mono').opacity(a),
      txt(
        'Llama 3.1 8B & 70B · ShareGPT · 16 req/s · peak width 4',
        0,
        -32,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),

      // Latency bar conversion: 10 ms -> 7 ms
      txt('10 ms -> 7 ms (-30% latency)', -440, 72, 28, COSMOS.gold, 'mono').opacity(a),
      rect(600, 46, { fill: '#1b2b4a', stroke: ROLE.r0, width: 2.2, radius: 8 })
        .at(-440, 134)
        .opacity(a),
      txt('10 ms baseline', -440, 134, 26, COSMOS.ink, 'mono').opacity(a),
      rect(420, 46, { fill: '#0e3028', stroke: ROLE.good, width: 2.5, radius: 8 })
        .at(-530, 200)
        .glow(cr > 0.5 ? 9 : 4, ROLE.good)
        .opacity(a),
      txt('7 ms (-30%)', -530, 200, 26, ROLE.good, 'mono').opacity(a),

      glassCell(440, 156, 720, 170, cr > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: cr > 0.5 ? '#0e2824' : '#0d1528',
        glow: cr > 0.5 ? 10 : 3,
        opacity: a,
      }),
      txt('RECIPROCAL SINGLE-STREAM RATE', 440, 108, 26, COSMOS.gold, 'mono').opacity(a),
      txt(
        cr > 0.5 ? '10 / 7 = 1.4286 -> +43% rate' : 'Compute 1 / (1 - 0.30)',
        440,
        162,
        32,
        cr > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
      ).opacity(a),
      txt('Latency % drop != throughput % gain', 440, 212, 26, COSMOS.muted, 'sans').opacity(a),
    ];

    if (tn > 0.05) {
      nodes.push(
        glassCell(0, 345, 1620, 108, COSMOS.cyan, { fill: '#0e1b30', glow: 8, opacity: tn * a }),
        txt(
          'Service throughput counts tokens from ALL active streams over the same wall-clock interval',
          0,
          345,
          28,
          COSMOS.cyan,
          'sans',
        ).opacity(tn * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, setupView, sglangView, parView);

  c.on('fi-paper-evidence-0', () =>
    s.play(setupHist.to(0.01, { duration: remainDuration(c, 'fi-paper-evidence-0', 0.2) })),
  );
  c.on('fi-paper-evidence-0-result', () =>
    s.play(setupHist.to(1, { duration: remainDuration(c, 'fi-paper-evidence-0-result', 0.4) })),
  );
  c.on('fi-paper-evidence-1', () => {
    s.play(
      par(showSetup.to(0, { duration: 0.18 }), delay(showSglang.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-paper-evidence-1-result', () =>
    s.play(denomNote.to(1, { duration: remainDuration(c, 'fi-paper-evidence-1-result', 0.4) })),
  );
  c.on('fi-paper-evidence-2', () => {
    s.play(
      par(showSglang.to(0, { duration: 0.18 }), delay(showParGen.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-paper-evidence-conversion', () =>
    s.play(convReady.to(1, { duration: remainDuration(c, 'fi-paper-evidence-conversion', 0.45) })),
  );
  c.on('fi-paper-evidence-2-result', () =>
    s.play(tputNote.to(1, { duration: remainDuration(c, 'fi-paper-evidence-2-result', 0.4) })),
  );
}
