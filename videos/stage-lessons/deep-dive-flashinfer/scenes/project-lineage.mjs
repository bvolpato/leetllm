// Scene 14: Who gives the kernel its pages? FlashInfer operator suite, release versions (0.6.18 / 0.7.1 / 0.2), engine boundary.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  par,
  remainAfter,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function projectLineage(s, c) {
  const showSuite = s.value(1);
  const licReady = s.value(0);
  const showReleases = s.value(0);
  const relIdx = s.value(0); // 0=0.6.18, 1=0.7.1, 2=0.2
  const showBoundary = s.value(0);
  const kernReady = s.value(0);

  const bgAura = aura(0, 20, 650, '#60a5fa1c', '#5ce1e61c');

  const title = heroTitle(['Who Gives the Kernel', 'Its Pages?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r0,
    eyebrow: 'PROJECT LINEAGE & SERVING BOUNDARY',
  });

  // View 0: Operator vocabulary + origins + Apache-2.0
  const suiteView = guardedDynamic(showSuite, (a) => {
    const lr = licReady.value;
    const ops = [
      { x: -680, name: 'Attention', col: ROLE.r2 },
      { x: -340, name: 'GEMM', col: ROLE.r0 },
      { x: 0, name: 'MoE Ops', col: ROLE.violet },
      { x: 340, name: 'Sampling', col: COSMOS.gold },
      { x: 680, name: 'Cache Update', col: ROLE.good },
    ];
    const nodes = [
      txt(
        'FLASHINFER SERVING KERNEL LIBRARY (STARTED SUMMER 2023)',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    ops.forEach((op) => {
      nodes.push(
        glassCell(op.x, -30, 300, 118, op.col, { fill: '#0e192f', glow: 7, opacity: a }),
        txt(op.name, op.x, -30, 30, op.col, 'mono').opacity(a),
      );
    });

    nodes.push(
      glassCell(-440, 200, 740, 175, ROLE.r0, { fill: '#101f3a', glow: 6, opacity: a }),
      txt('ORIGIN & STEWARDSHIP', -440, 152, 26, ROLE.r0, 'mono').opacity(a),
      txt('UW · CMU · OctoAI (2023)', -440, 204, 30, COSMOS.ink, 'sans').opacity(a),
      txt('NVIDIA + open community CI', -440, 252, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(440, 200, 740, 175, lr > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: lr > 0.5 ? '#0e2824' : '#0d1528',
        glow: lr > 0.5 ? 9 : 4,
        opacity: a,
      }),
      txt('LICENSING', 440, 152, 26, ROLE.good, 'mono').opacity(a),
      txt('Core source: Apache-2.0', 440, 204, 30, COSMOS.gold, 'mono').opacity(a),
      txt('Models & CUDA deps keep own licenses', 440, 252, 26, COSMOS.muted, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  // View 1: Three release pins paired with their examples
  const relView = guardedDynamic(showReleases, (a) => {
    const ri = relIdx.value;
    const cards = [
      {
        cx: -555,
        ver: 'v0.6.18',
        scope: 'Paged-prefill FA2 call',
        sub: 'Our CUDA walkthrough example',
        col: ROLE.r2,
        lit: true,
      },
      {
        cx: 0,
        ver: 'v0.7.1',
        scope: 'cuDNN element/token offsets',
        sub: 'Explicit lse_base & offset units',
        col: COSMOS.gold,
        lit: ri >= 0.8,
      },
      {
        cx: 555,
        ver: 'v0.2',
        scope: 'MLSys 2025 paper results',
        sub: 'Historical A100/H100 latency study',
        col: ROLE.violet,
        lit: ri >= 1.8,
      },
    ];
    const nodes = [
      txt(
        'KEEP EACH EXAMPLE PINNED TO ITS EXACT RELEASE',
        0,
        -155,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    cards.forEach((cd) => {
      nodes.push(
        glassCell(cd.cx, 60, 490, 290, cd.lit ? cd.col : COSMOS.dim, {
          fill: cd.lit ? '#101d35' : '#0b101f',
          glow: cd.lit ? 9 : 2,
          opacity: a,
        }),
        txt(cd.ver, cd.cx, -32, 44, cd.lit ? cd.col : COSMOS.dim, 'mono').opacity(a),
        txt(cd.scope, cd.cx, 38, 28, COSMOS.ink, 'sans').opacity(a),
        txt(cd.sub, cd.cx, 104, 26, COSMOS.muted, 'sans').opacity(a),
      );
    });

    nodes.push(
      txt(
        'API signatures and benchmarks evolve across releases: pair every claim with its version',
        0,
        312,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // View 2: Serving Engine -> R2 ordered pages [3, 14, 6] -> FlashInfer Kernel
  const boundView = guardedDynamic(showBoundary, (a) => {
    const kr = kernReady.value;
    const nodes = [
      txt('THE SERVING ENGINE / KERNEL BOUNDARY', 0, -155, 28, COSMOS.cyan, 'mono').opacity(a),

      glassCell(-555, 45, 500, 260, ROLE.r0, { fill: '#10213d', glow: 8, opacity: a }),
      txt('SERVING ENGINE', -555, -38, 30, ROLE.r0, 'mono').opacity(a),
      txt('vLLM · SGLang · TRT-LLM', -555, 16, 26, COSMOS.gold, 'mono').opacity(a),
      txt('Admits requests & allocates pages', -555, 70, 26, COSMOS.ink, 'sans').opacity(a),
      txt('Selects attention backend', -555, 114, 26, COSMOS.muted, 'sans').opacity(a),

      // Flowing R2 ordered page list across the boundary
      glassCell(0, 45, 360, 140, COSMOS.gold, { fill: '#261e10', glow: 10, opacity: a }),
      txt('R2 PAGE LIST', 0, 16, 26, COSMOS.gold, 'mono').opacity(a),
      txt('[3, 14, 6]', 0, 68, 38, COSMOS.ink, 'mono').glow(5, COSMOS.gold).opacity(a),

      glowingArc([-300, 45], [-185, 45], 0, { color: ROLE.r0, width: 4.0, opacity: 0.9 * a }),
      glowingArc([185, 45], [300, 45], 0, { color: ROLE.good, width: 4.0, opacity: 0.9 * a }),

      glassCell(555, 45, 500, 260, kr > 0.5 ? ROLE.good : ROLE.r2, {
        fill: kr > 0.5 ? '#0e2924' : '#0f2336',
        glow: kr > 0.5 ? 10 : 6,
        opacity: a,
      }),
      txt('FLASHINFER KERNEL', 555, -38, 30, ROLE.good, 'mono').opacity(a),
      txt('Follows listed page order', 555, 18, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Loads keys & values in tiles', 555, 72, 26, COSMOS.muted, 'sans').opacity(a),
      txt('Never owns allocator policy', 555, 116, 26, COSMOS.gold, 'mono').opacity(a),
    ];

    nodes.push(
      txt(
        'Engine decides WHICH pages belong to R2; FlashInfer reads them at GPU speed',
        0,
        305,
        28,
        ROLE.good,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, suiteView, relView, boundView);

  c.on('fi-project-lineage-0', () =>
    s.play(licReady.to(0.3, { duration: remainDuration(c, 'fi-project-lineage-0', 0.4) })),
  );
  c.after('fi-project-lineage-0-result', () =>
    s.play(licReady.to(1, { duration: remainAfter(c, 'fi-project-lineage-0-result', 0.35) })),
  );
  c.on('fi-project-lineage-1', () => {
    s.play(
      par(showSuite.to(0, { duration: 0.18 }), delay(showReleases.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('lineage-offset-version', () =>
    s.play(relIdx.to(1, { duration: remainDuration(c, 'lineage-offset-version', 0.4) })),
  );
  c.after('fi-project-lineage-1-result', () =>
    s.play(relIdx.to(2, { duration: remainAfter(c, 'fi-project-lineage-1-result', 0.35) })),
  );
  c.on('fi-project-lineage-2', () => {
    s.play(
      par(
        showReleases.to(0, { duration: 0.18 }),
        delay(showBoundary.to(1, { duration: 0.22 }), 0.2),
      ),
    );
  });
  c.after('fi-project-lineage-2-result', () =>
    s.play(kernReady.to(1, { duration: remainAfter(c, 'fi-project-lineage-2-result', 0.35) })),
  );
}
