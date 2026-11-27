// Scene 29: Use the observed boundary to choose the next measurement. 3 beats: (0) OOM per-rank ledger + latency trace breakdown; (1) KV duplication vs hybrid state + 4 token-gap trace stages; (2) exact reference + 3 serving measurements.
import {
  COSMOS,
  PLACE_LOCAL,
  ROLE,
  aura,
  fmtFixed,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  mpReference,
  rect,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function failureTrace(s, c) {
  const showB0 = s.value(1);
  const showB1 = s.value(0);
  const showB2 = s.value(0);

  const p0 = s.value(0);
  const pLedger = s.value(0);
  const pLat = s.value(0);
  const pDup = s.value(0);
  const pGaps = s.value(0);
  const pVal = s.value(0);

  const bgAura = aura(0, 20, 620, '#ff6b8b18', '#5ce1e61a');
  const title = heroTitle(['Use the Observed Boundary', 'to Choose Your Next Trace'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: ROLE.warn,
    eyebrow: 'DIAGNOSTIC ROUTING · EVIDENCE BEFORE ASSUMPTIONS',
  });

  const b0View = guardedDynamic(showB0, (a) => {
    const ld = pLedger.value > 0.3 || p0.value > 0.3;
    const lt = pLat.value > 0.4;
    const barW = 520;
    const capFrac = 29 / 40;

    const nodes = [
      txt(
        'SYMPTOM 1: OOM DESPITE GROUP FIT -> INSPECT PER-RANK LEDGER',
        0,
        -210,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    PLACE_LOCAL.values.forEach((gb, r) => {
      const bx0 = r === 0 ? -740 : 120;
      const fillW = (gb / 40) * barW;
      const capX = bx0 + capFrac * barW;
      const col = r === 0 ? ROLE.bad : ROLE.gpu1;
      nodes.push(
        txt(`RANK ${r}: ${gb} GB (cap 29 GB)`, bx0, -150, 28, col, 'mono', 'left').opacity(a),
        rect(barW, 74, { fill: '#0b1222', stroke: COSMOS.dim, width: 1.8, radius: 8 })
          .at(bx0 + barW * 0.5, -72)
          .opacity(a),
        rect(fillW, 74, {
          fill: r === 0 ? '#321222' : '#0e3240',
          stroke: col,
          width: 2.6,
          radius: 8,
        })
          .at(bx0 + fillW * 0.5, -72)
          .glow(ld ? 8 : 3, col)
          .opacity(a),
        line([capX, -118], [capX, -108], { stroke: COSMOS.gold, width: 3.4 }).opacity(a),
        line([capX, -36], [capX, -22], { stroke: COSMOS.gold, width: 3.4 }).opacity(a),
      );
    });

    nodes.push(
      txt(
        'SYMPTOM 2: HIGHER LATENCY AT HIGHER TP -> SEPARATE TRACE PHASES',
        0,
        52,
        26,
        lt ? ROLE.warn : COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    const traces = [
      { name: 'Local kernels', w: 360, col: ROLE.gpu0, fill: '#122b52' },
      { name: 'Collectives', w: 360, col: ROLE.bad, fill: '#321222' },
      { name: 'Scheduling', w: 320, col: ROLE.warn, fill: '#2c1c0e' },
      { name: 'Shared links', w: 340, col: ROLE.expert, fill: '#22163c' },
    ];
    let tx = -710;
    traces.forEach((tr) => {
      nodes.push(
        rect(tr.w - 12, 74, {
          fill: tr.fill,
          stroke: lt ? tr.col : COSMOS.dim,
          width: 2.4,
          radius: 8,
        })
          .at(tx + tr.w * 0.5, 140)
          .glow(lt ? 7 : 0, tr.col)
          .opacity(a),
        txt(tr.name, tx + tr.w * 0.5, 140, 26, lt ? tr.col : COSMOS.muted, 'mono').opacity(a),
      );
      tx += tr.w + 14;
    });

    nodes.push(
      glassCell(0, 315, 1480, 78, ROLE.warn, { fill: '#10182b', glow: 7, opacity: a }),
      txt(
        'A PCIe or cross-node label alone does not identify the bottleneck · measure the trace',
        0,
        315,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const b1View = guardedDynamic(showB1, (a) => {
    const dp = pDup.value > 0.3;
    const gp = pGaps.value > 0.3;

    const nodes = [
      txt(
        'SYMPTOM 3: KV MEMORY PLATEAU -> CHECK KV REPLICATION vs HYBRID STATE',
        0,
        -210,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    for (let r = 0; r < 8; r++) {
      const cx = -735 + r * 210;
      const col = r < 4 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(
        glassCell(cx, -88, 186, 126, dp ? col : COSMOS.dim, {
          fill: r < 4 ? '#10213d' : '#0e2b38',
          glow: dp ? 7 : 2,
          opacity: a,
        }),
        txt(`R${r} · KV${r < 4 ? 0 : 1}`, cx, -112, 26, col, 'mono').opacity(a),
        txt('32 copies', cx, -62, 26, ROLE.bad, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt(
        'SYMPTOM 4: TOKEN GAPS UNDER CONCURRENCY -> TRACE ALL 4 STAGES',
        0,
        56,
        26,
        gp ? ROLE.gpu1 : COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    const stages = [
      { label: '1. Admission', col: ROLE.gpu0 },
      { label: '2. Mixed step', col: ROLE.gpu1 },
      { label: '3. KV transfer', col: ROLE.bad },
      { label: '4. Delivery buf', col: COSMOS.gold },
    ];
    stages.forEach((st, i) => {
      const cx = -585 + i * 390;
      nodes.push(
        glassCell(cx, 152, 348, 86, gp ? st.col : COSMOS.dim, {
          fill: '#101b30',
          glow: gp ? 8 : 2,
          opacity: a,
        }),
        txt(st.label, cx, 152, 28, gp ? st.col : COSMOS.muted, 'mono').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 315, 1480, 78, ROLE.gpu1, { fill: '#10182b', glow: 7, opacity: a }),
      txt(
        'Measured KV duplication justifies supported DCP · also trace any new queues added by a fix',
        0,
        315,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const b2View = guardedDynamic(showB2, (a) => {
    const vl = pVal.value > 0.3;
    const checks = [
      {
        title: '1. Per-rank peak memory',
        sub: 'Weights + KV pages + CUDA graphs + workspace',
        col: ROLE.gpu0,
      },
      {
        title: '2. Sustained useful rate',
        sub: 'Useful output tokens/s across validated replicas',
        col: ROLE.gpu1,
      },
      {
        title: '3. Joint latency outcomes',
        sub: 'TTFT + per-request token-gap distributions',
        col: COSMOS.gold,
      },
    ];

    const nodes = [
      glassCell(0, -125, 1480, 108, vl ? ROLE.good : COSMOS.dim, {
        fill: '#0d2924',
        glow: vl ? 10 : 4,
        opacity: a,
      }),
      txt(
        'STEP 0: RECONSTRUCT EXACT REFERENCE COMPUTATION',
        -700,
        -148,
        26,
        ROLE.good,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `Sharded == Dense float64  [${fmtFixed(mpReference.output[0], 4)}, ${fmtFixed(mpReference.output[1], 4)}]`,
        -700,
        -100,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
    ];

    checks.forEach((ck, i) => {
      const y = 26 + i * 102;
      nodes.push(
        glassCell(0, y, 1480, 82, ck.col, { fill: '#0f1c32', glow: 6, opacity: a }),
        txt(ck.title, -700, y, 28, ck.col, 'mono', 'left').opacity(a),
        txt(ck.sub, 700, y, 26, COSMOS.muted, 'sans', 'right').opacity(a),
      );
    });

    nodes.push(
      txt(
        'Replicate validated sharded groups when independent traffic is the bottleneck',
        0,
        345,
        28,
        ROLE.good,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, b0View, b1View, b2View);

  c.on('mp-failure-trace-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-failure-trace-0', 0.35) })),
  );
  c.on('mp-failure-trace-ledger', () =>
    s.play(pLedger.to(1, { duration: remainDuration(c, 'mp-failure-trace-ledger', 0.4) })),
  );
  c.on('mp-failure-trace-latency', () =>
    s.play(pLat.to(1, { duration: remainDuration(c, 'mp-failure-trace-latency', 0.45) })),
  );
  c.on('mp-failure-trace-1', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-failure-trace-1', 0.16));
    swapViews(s, showB0, showB1, d, d);
  });
  c.on('mp-failure-trace-duplication', () =>
    s.play(pDup.to(1, { duration: remainDuration(c, 'mp-failure-trace-duplication', 0.4) })),
  );
  c.on('mp-failure-trace-gaps', () =>
    s.play(pGaps.to(1, { duration: remainDuration(c, 'mp-failure-trace-gaps', 0.45) })),
  );
  c.on('mp-failure-trace-2', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-failure-trace-2', 0.16));
    swapViews(s, showB1, showB2, d, d);
  });
  c.on('mp-failure-trace-validate', () =>
    s.play(pVal.to(1, { duration: remainDuration(c, 'mp-failure-trace-validate', 0.45) })),
  );
}
