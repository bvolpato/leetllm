// Scene 17: Which route clears both release thresholds? (Repair map + dual-threshold release gate)
import {
  COSMOS,
  RELEASE_ROUTES,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function routeRelease(s, c) {
  const showRepairs = s.value(0);
  const gateMode = s.value(0); // 0 = repair map, 1 = 3-route release gate
  const showFirstGate = s.value(0);
  const latencyLimit = s.value(350);
  const tightenStarted = s.value(0);
  const showTightVerdict = s.value(0);
  const showEvidence = s.value(0);

  const bgAura = aura(0, 10, 720, '#10345c26', '#2a1a4e18');
  const title = heroTitle(['Which Route Clears Both', 'Release Thresholds?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'RELEASE GATE · MATCH REPAIR TO FAILURE & ENFORCE QUALITY + p95',
  });

  const routeNames = { baseline: 'Raw hybrid', rewrite: 'Rewrite', expensive: 'Costly route' };

  const live = guardedDynamic(s.value(1), () => {
    const sRep = showRepairs.value;
    const inGate = gateMode.value > 0.5;
    const firstDone = showFirstGate.value > 0.5;
    const lim = latencyLimit.value;
    const isTight = tightenStarted.value > 0.5;
    const tightVerdict = showTightVerdict.value > 0.5;
    const sEv = showEvidence.value > 0.4;

    const nodes = [];

    if (!inGate) {
      // Beat 0: Diagnostic failure-to-repair map
      const repairs = [
        { fail: 'Missing conversational subject', fix: 'Query rewrite', col: COSMOS.cyan },
        {
          fail: 'Right page buried in noisy shortlist',
          fix: 'Cross-encoder rerank',
          col: COSMOS.blue,
        },
        { fail: 'Short question misses formal docs', fix: 'Test HyDE proxy', col: COSMOS.emerald },
        { fail: 'Passages leave gap or dependency', fix: 'CRAG / iterative hop', col: COSMOS.gold },
      ];
      nodes.push(
        txt('MEASURED RETRIEVAL FAILURE', -835, -214, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          'TARGETED REPAIR (KEEP RAW HYBRID CONTROL)',
          105,
          -214,
          26,
          COSMOS.emerald,
          'mono',
          'left',
        ),
      );

      repairs.forEach((item, i) => {
        const y = -114 + i * 124;
        const lit = sRep > 0.25;
        nodes.push(
          glassCell(-445, y, 810, 96, lit ? COSMOS.blue : COSMOS.dim, {
            fill: '#101d35',
            glow: lit ? 5 : 2,
          }),
          txt(item.fail, -825, y + 2, 29, COSMOS.ink, 'sans', 'left'),
          glowingArc([-38, y], [88, y], 0, {
            color: item.col,
            width: 3.6,
            opacity: lit ? 0.9 : 0.45,
            glow: 8,
          }),
          glassCell(475, y, 760, 96, lit ? item.col : COSMOS.dim, {
            fill: '#0e2328',
            glow: lit ? 8 : 2,
          }),
          txt(item.fix, 125, y + 2, 30, item.col, 'mono', 'left'),
        );
      });

      nodes.push(
        glowDot(-840, 368, { radius: 6, color: COSMOS.cyan }),
        txt(
          'Measure every repair and every composition (like HyDE + Self-RAG) against raw hybrid control',
          -812,
          370,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ),
      );
      return group(...nodes);
    }

    // Beats 1-4: Dual-threshold release gate on 50 answerable questions
    const showVerdict = isTight ? tightVerdict : firstDone;

    nodes.push(
      glassCell(0, -214, 1710, 68, isTight ? COSMOS.rose : COSMOS.gold, {
        fill: isTight ? '#28131d' : '#241e10',
        glow: 6,
      }),
      txt(
        `RELEASE GATE (50 ANSWERABLE QUESTIONS):   SUPPORTED ACCURACY >= 0.93   ·   p95 <= ${Math.round(lim)} ms`,
        0,
        -212,
        28,
        isTight ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),
      txt('ROUTE', -835, -140, 26, COSMOS.muted, 'mono', 'left'),
      txt('SUPPORTED ANSWERS (50)', -545, -140, 26, COSMOS.emerald, 'mono', 'left'),
      txt('END-TO-END p95', 190, -140, 26, COSMOS.blue, 'mono', 'left'),
      txt('MS', 655, -140, 26, COSMOS.muted, 'mono', 'right'),
      txt('VERDICT', 775, -140, 26, COSMOS.gold, 'mono'),
    );

    const barLeft = 190;
    const barSpan = 340;
    const limitX = barLeft + (barSpan * lim) / 500;

    RELEASE_ROUTES.forEach((route, idx) => {
      const y = -36 + idx * 146;
      const passes = route.accuracy >= 0.93 && route.p95 <= lim;
      const border = showVerdict ? (passes ? COSMOS.emerald : COSMOS.rose) : COSMOS.dim;

      nodes.push(
        glassCell(0, y, 1710, 122, border, {
          fill: showVerdict && passes ? '#0d2723' : '#10182d',
          glow: showVerdict && passes ? 10 : 2,
        }),
        txt(routeNames[route.id], -835, y + 2, 30, COSMOS.cyan, 'sans', 'left'),
      );

      // 50-question dot grid (2 rows of 25)
      for (let k = 0; k < 50; k++) {
        const kx = -540 + (k % 25) * 19;
        const ky = y - 16 + Math.floor(k / 25) * 30;
        nodes.push(
          rect(13, 20, {
            fill: k < route.supported ? COSMOS.emerald : '#2c3652',
            radius: 2,
          }).at(kx, ky),
        );
      }
      nodes.push(
        txt(
          `${route.supported}/50 = ${route.accuracy.toFixed(2)}`,
          -40,
          y + 2,
          28,
          route.accuracy >= 0.93 ? COSMOS.emerald : COSMOS.rose,
          'mono',
          'left',
        ),
      );

      // Latency bar & moving p95 ceiling line (label placed cleanly outside bar span)
      const bw = (barSpan * route.p95) / 500;
      nodes.push(
        rect(bw, 36, {
          fill: route.p95 <= lim ? COSMOS.blue : COSMOS.amber,
          radius: 6,
        })
          .glow(6, route.p95 <= lim ? COSMOS.blue : COSMOS.amber)
          .at(barLeft + bw / 2, y + 2),
        line([limitX, y - 46], [limitX, y + 46], {
          stroke: isTight ? COSMOS.rose : COSMOS.gold,
          width: 4,
        }),
        txt(`${route.p95}`, 655, y + 2, 28, COSMOS.ink, 'mono', 'right'),
        txt(
          showVerdict ? (passes ? 'PASS' : 'FAIL') : '?',
          775,
          y + 2,
          36,
          showVerdict ? (passes ? COSMOS.emerald : COSMOS.rose) : COSMOS.gold,
          'mono',
        ),
      );
    });

    const bottomCol = sEv
      ? COSMOS.cyan
      : isTight && showVerdict
        ? COSMOS.rose
        : firstDone && !isTight
          ? COSMOS.emerald
          : COSMOS.gold;
    const bottomMsg = sEv
      ? 'Compare held-out traces, corpus snapshot, model versions, costs & abstention'
      : isTight && showVerdict
        ? 'At p95 <= 300 ms, NO route passes both · release blocked'
        : isTight
          ? 'Tightened: p95 <= 300 ms'
          : firstDone
            ? 'Rewrite passes!'
            : 'Require accuracy >= 0.93 and p95 <= 350 ms: which route passes both?';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('route-repairs', () => s.play(showRepairs.to(1, { duration: 0.45 })));
  c.onBeat(1, () => s.play(gateMode.to(1, { duration: 0.3 })));
  c.after('route-gate', () => s.play(showFirstGate.to(1, { duration: 0.45 })));
  c.on('route-tighten', () =>
    s.play(tightenStarted.to(1, { duration: 0.05 }), latencyLimit.to(300, { duration: 0.7 })),
  );
  c.after('qx-tight-result', () => s.play(showTightVerdict.to(1, { duration: 0.45 })));
  c.on('route-evidence', () =>
    s.play(showEvidence.to(1, { duration: remainDuration(c, 'route-evidence', 0.45) })),
  );
}
