// Scene 26: Follow one contract through its implementation: code-reading route across decode.py, batch_decode.cu, cascade.cuh, page.cu.
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

export default function sourceRoute(s, c) {
  const showRoute = s.value(1);
  const routeStep = s.value(0);
  const showAudit = s.value(0);
  const fourBugs = s.value(0);
  const showBench = s.value(0);
  const replayRule = s.value(0);

  const bgAura = aura(0, 20, 650, '#5ce1e61c', '#6ee7b71a');

  const title = heroTitle(['Follow One Contract', 'Through Source'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'CODE-READING ROUTE · INVARIANT TRACE',
  });

  // View 0: 4-step repository reading route with concrete invariants
  const routeView = guardedDynamic(showRoute, (a) => {
    const rs = routeStep.value;
    const hops = [
      { l: 'flashinfer/decode.py', r: 'plan() / run() offsets & split scratch', col: ROLE.r0 },
      { l: 'csrc/batch_decode.cu', r: 'CTA tile assignment & split-KV reads', col: ROLE.r2 },
      {
        l: 'cascade.py + cascade.cuh',
        r: 'Base-2 LSE & pre-normalized merge scales',
        col: COSMOS.gold,
      },
      {
        l: 'flashinfer/page.py + page.cu',
        r: 'Logical token -> physical page & slot',
        col: ROLE.good,
      },
    ];
    const nodes = [
      txt(
        'USE THE REPOSITORY AS AN INVARIANT ROUTE, NOT A DIRECTORY TREE',
        0,
        -162,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    hops.forEach((hp, i) => {
      const cy = -74 + i * 112;
      const lit = i < 3 || rs > 0.5;
      nodes.push(
        glassCell(-420, cy, 660, 84, lit ? hp.col : COSMOS.dim, {
          fill: '#101d35',
          glow: lit ? 7 : 2,
          opacity: a,
        }),
        txt(hp.l, -420, cy, 28, lit ? hp.col : COSMOS.dim, 'mono').opacity(a),
        glowingArc([-85, cy], [25, cy], 0, {
          color: hp.col,
          width: 3.4,
          opacity: (lit ? 0.9 : 0.35) * a,
        }),
        glassCell(430, cy, 780, 84, lit ? hp.col : COSMOS.dim, {
          fill: '#0e172a',
          glow: lit ? 6 : 2,
          opacity: a,
        }),
        txt(hp.r, 430, cy, 26, COSMOS.ink, 'sans').opacity(a),
      );
    });

    return group(...nodes);
  });

  // View 1: 4 boundary invariants + 4 silent failure points from our walkthrough
  const auditView = guardedDynamic(showAudit, (a) => {
    const fb = fourBugs.value;
    const bugs = [
      { cx: -615, t: 'Query Offsets', s: 'Elements vs tokens', col: ROLE.r0 },
      { cx: -205, t: 'Page ID Order', s: 'Logical list != sorted', col: ROLE.r2 },
      { cx: 205, t: 'Tail Length', s: 'Stale plan stops short', col: ROLE.warn },
      { cx: 615, t: 'LSE Base-2', s: 'ln vs log2 distortion', col: ROLE.bad },
    ];
    const nodes = [
      txt(
        'AT EVERY BOUNDARY: WRITE SHAPE, INDEX UNITS, PRODUCER & NEXT OWNER',
        0,
        -155,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      glassCell(0, -45, 1520, 108, ROLE.r2, { fill: '#0f2236', glow: 7, opacity: a }),
      txt(
        'Compare wrapper tests against the dense correctness reference BEFORE reading microkernels',
        0,
        -45,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    bugs.forEach((bg) => {
      nodes.push(
        glassCell(bg.cx, 155, 370, 170, fb > 0.5 ? bg.col : COSMOS.dim, {
          fill: '#0e172a',
          glow: fb > 0.5 ? 9 : 3,
          opacity: a,
        }),
        txt(bg.t, bg.cx, 125, 28, bg.col, 'mono').opacity(a),
        txt(bg.s, bg.cx, 182, 26, COSMOS.muted, 'sans').opacity(a),
      );
    });

    nodes.push(
      txt(
        'Four places an in-bounds, finite result can silently answer the wrong attention problem',
        0,
        325,
        28,
        fb > 0.5 ? ROLE.warn : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // View 2: Disciplined serving comparison protocol
  const benchView = guardedDynamic(showBench, (a) => {
    const rr = replayRule.value;
    const cards = [
      {
        cx: -555,
        h: 'TRACE METADATA',
        l1: 'Backend + split policy',
        l2: 'Workspace + CUDA Graph mode',
        col: ROLE.r0,
      },
      {
        cx: 0,
        h: 'SEPARATE PHASES',
        l1: 'Record compile & warmup',
        l2: 'Never mix into steady state',
        col: ROLE.warn,
      },
      {
        cx: 555,
        h: 'TAIL METRICS',
        l1: 'p50 & p99 TTFT (first token)',
        l2: 'p50 & p99 ITL (decode)',
        col: ROLE.r2,
      },
    ];
    const nodes = [
      txt('DISCIPLINED SERVING COMPARISON PROTOCOL', 0, -155, 28, COSMOS.cyan, 'mono').opacity(a),
    ];

    cards.forEach((cd) => {
      nodes.push(
        glassCell(cd.cx, 40, 490, 230, cd.col, { fill: '#0e172a', glow: 8, opacity: a }),
        txt(cd.h, cd.cx, -28, 28, cd.col, 'mono').opacity(a),
        txt(cd.l1, cd.cx, 32, 26, COSMOS.ink, 'sans').opacity(a),
        txt(cd.l2, cd.cx, 84, 26, COSMOS.muted, 'sans').opacity(a),
      );
    });

    if (rr > 0.05) {
      nodes.push(
        glassCell(0, 295, 1620, 118, ROLE.good, { fill: '#0e2824', glow: 10, opacity: rr * a }),
        txt(
          'Change ONE setting -> replay the exact same requests -> compare outputs AND latency',
          0,
          295,
          28,
          ROLE.good,
          'mono',
        ).opacity(rr * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, routeView, auditView, benchView);

  c.on('fi-source-route-0', () =>
    s.play(routeStep.to(0.2, { duration: remainDuration(c, 'fi-source-route-0', 0.35) })),
  );
  c.after('fi-source-route-0-result', () =>
    s.play(routeStep.to(1, { duration: remainAfter(c, 'fi-source-route-0-result', 0.35) })),
  );
  c.on('fi-source-route-1', () => {
    s.play(
      par(showRoute.to(0, { duration: 0.18 }), delay(showAudit.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.after('fi-source-route-1-result', () =>
    s.play(fourBugs.to(1, { duration: remainAfter(c, 'fi-source-route-1-result', 0.35) })),
  );
  c.on('fi-source-route-2', () => {
    s.play(
      par(showAudit.to(0, { duration: 0.18 }), delay(showBench.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-source-route-2-result', () =>
    s.play(replayRule.to(1, { duration: remainDuration(c, 'fi-source-route-2-result', 0.4) })),
  );
}
