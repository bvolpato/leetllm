// Scene 18: graph: "When does a detour find a nearer point?"
// View 1: Orbiting 3D 3-layer HNSW skip-graph pyramid showing sparse upper layers dropping onto base layer.
// View 2: Luminous 2D base-layer graph comparing greedy ef=1 (trapped at D, L2²=5) vs ef=3 (detour B->A->C->E, L2²=0.01).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  GRAPH,
  ROLE,
  buildHnswPyramid3d,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  graphSearch,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';

export default function graph(s, c) {
  const res1 = graphSearch(1);
  const res3 = graphSearch(3);

  const phase = s.value(0);
  const upperVis = s.value(0);
  const vPyramid = s.value(1);
  const vBase = s.value(0);

  // Base-layer search state
  const searchRun = s.value(0); // 0=ef1, 1=ef3
  const stepPos = s.value(0); // 0=B, 1=D (for ef=1) OR 0=B, 1=A, 2=C, 3=E (for ef=3)
  const stopDone = s.value(0);
  const foundDone = s.value(0);

  const { view: pyramid3d } = buildHnswPyramid3d(upperVis, { x: 250, y: 20 });

  const title = heroTitle(['When does a detour', 'find a nearer point?'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.code,
    eyebrow: 'HNSW MULTI-LAYER GRAPH SEARCH',
  });

  // View 1 overlay: floating 3D HNSW layer legend on the left
  const pyramidOverlay = guardedDynamic(vPyramid, (alpha) => {
    const up = upperVis.value;
    return group(
      txt('HIERARCHICAL SKIP LAYERS', -855, -225, 26, ROLE.code, 'mono', 'left').opacity(alpha),
      // Layer 2
      glowDot(-835, -135, { radius: 8, color: ROLE.gold, glow: 10, opacity: up * alpha }),
      txt('Layer 2 (top entry)', -800, -135, 32, ROLE.gold, 'serif', 'left').opacity(up * alpha),
      txt('node B', -800, -90, 28, COSMOS.ink, 'mono', 'left').opacity(up * alpha),
      // Layer 1
      glowDot(-835, 5, { radius: 8, color: ROLE.violet, glow: 10, opacity: up * alpha }),
      txt('Layer 1 (express links)', -800, 5, 32, ROLE.violet, 'serif', 'left').opacity(up * alpha),
      txt('nodes B, C', -800, 50, 28, COSMOS.ink, 'mono', 'left').opacity(up * alpha),
      // Layer 0 (always visible)
      glowDot(-835, 145, { radius: 8, color: ROLE.code, glow: 10, opacity: alpha }),
      txt('Layer 0 (base graph)', -800, 145, 32, ROLE.code, 'serif', 'left').opacity(alpha),
      txt('all points: A, B, C, D, E', -800, 190, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt(
        'Drop down at the same node, then explore base',
        -855,
        325,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );
  });

  // View 2: 2D Base-layer graph + ef=1 vs ef=3 trace
  const mapX = (vx) => -760 + ((vx + 0.5) / 6.5) * 900;
  const mapY = (vy) => 270 - ((vy + 0.8) / 3.8) * 520;
  const xy = (v) => [mapX(v[0]), mapY(v[1])];

  const baseLayer = guardedDynamic(vBase, (alpha) => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const run = Math.round(searchRun.value);
    const sp = stepPos.value;

    const nodes = [
      rule(175, -390, 175, 400, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('BASE-LAYER GRAPH  (ENTRY B)', -310, -255, 26, ROLE.code, 'mono').opacity(alpha),
    ];

    // Subtle background grid
    for (let gx = 0; gx <= 5; gx++) {
      nodes.push(
        line([mapX(gx), mapY(-0.5)], [mapX(gx), mapY(2.8)], {
          stroke: '#1e2c4c',
          width: 1.3,
        }).opacity(0.6 * alpha),
      );
    }
    for (let gy = 0; gy <= 2; gy++) {
      nodes.push(
        line([mapX(-0.3), mapY(gy)], [mapX(5.5), mapY(gy)], {
          stroke: '#1e2c4c',
          width: 1.3,
        }).opacity(0.6 * alpha),
      );
    }

    // Graph edges
    Object.entries(GRAPH.edges).forEach(([id, ns]) => {
      ns.filter((n) => id < n).forEach((n) => {
        const isGreedyEdge =
          run === 0 && sp > 0.2 && ((id === 'B' && n === 'D') || (id === 'D' && n === 'B'));
        const isDetourEdge =
          run === 1 &&
          ((sp > 0.2 && id === 'A' && n === 'B') ||
            (sp > 1.2 && id === 'A' && n === 'C') ||
            (sp > 2.2 && id === 'C' && n === 'E'));
        const col = isDetourEdge ? ROLE.A : isGreedyEdge ? ROLE.warn : '#485d8a';
        const w = isDetourEdge || isGreedyEdge ? 5 : 3;
        nodes.push(
          line(xy(GRAPH.points[id]), xy(GRAPH.points[n]), { stroke: col, width: w })
            .glow(isDetourEdge || isGreedyEdge ? 9 : 0, col)
            .opacity(alpha),
        );
      });
    });

    // Graph nodes with guaranteed non-colliding offsets
    const offsets = {
      A: [-42, 0],
      B: [0, 44],
      C: [0, -44],
      D: [0, 44],
      E: [0, -48],
    };
    Object.entries(GRAPH.points).forEach(([id, pt]) => {
      const [sx, sy] = xy(pt);
      const isHit =
        (run === 0 && stopDone.value > 0.5 && id === 'D') ||
        (run === 1 && foundDone.value > 0.5 && id === 'E');
      const col = id === 'E' && foundDone.value > 0.5 ? ROLE.A : isHit ? ROLE.warn : ROLE.code;
      nodes.push(
        glowRing(sx, sy, isHit ? 19 : 14, col, { width: 3, glow: isHit ? 11 : 6, opacity: alpha }),
        txt(id, sx + offsets[id][0], sy + offsets[id][1], 32, col, 'mono')
          .glow(5, col)
          .opacity(alpha),
      );
    });

    // Query node q = [5, 2]
    const [qx, qy] = xy(GRAPH.query);
    nodes.push(
      glowDot(qx, qy, { radius: 9, color: ROLE.query, glow: 12 * pulse, opacity: alpha }),
      txt('q [5, 2]', qx + 28, qy + 38, 28, ROLE.query, 'mono', 'left')
        .glow(6, ROLE.query)
        .opacity(alpha),
    );

    // Moving search photon
    const pathPts =
      run === 0
        ? [GRAPH.points.B, GRAPH.points.D]
        : [GRAPH.points.B, GRAPH.points.A, GRAPH.points.C, GRAPH.points.E];
    const maxI = pathPts.length - 1;
    const clamped = Math.max(0, Math.min(maxI, sp));
    const i0 = Math.floor(clamped);
    const i1 = Math.min(maxI, i0 + 1);
    const frac = clamped - i0;
    const curPos = [
      pathPts[i0][0] + (pathPts[i1][0] - pathPts[i0][0]) * frac,
      pathPts[i0][1] + (pathPts[i1][1] - pathPts[i0][1]) * frac,
    ];
    const [tx, ty] = xy(curPos);
    nodes.push(glowDot(tx, ty, { radius: 11, color: ROLE.gold, glow: 14 * pulse, opacity: alpha }));

    // Right column: Floating search traces (NO boxy table!)
    const rx = 225;
    const route1 = sp > 0.4 || run === 1 ? 'B → D (local min)' : 'B';
    const route3 =
      run === 0
        ? 'waiting...'
        : sp < 0.3
          ? 'B'
          : sp < 1.3
            ? 'B → A'
            : sp < 2.3
              ? 'B → A → C'
              : 'B → A → C → E';

    nodes.push(
      txt('SEARCH EFFORT (ef)', rx, -245, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      // Run 1: ef = 1
      txt(
        'ef = 1  (greedy)',
        rx,
        -165,
        34,
        run === 0 ? ROLE.warn : COSMOS.muted,
        'serif',
        'left',
      ).opacity(alpha),
      txt(route1, rx, -110, 30, ROLE.warn, 'mono', 'left').opacity(alpha),
      ...(stopDone.value > 0.02
        ? [
            lumBar(rx + 185, -42, 370, 52, {
              color: ROLE.warn,
              fillAlpha: 0.18,
              glow: 7,
              opacity: stopDone.value * alpha,
            }),
            txt(
              `stops at D · L2² = ${res1.distanceSquared.toFixed(0)}`,
              rx + 185,
              -42,
              28,
              ROLE.warn,
              'mono',
            ).opacity(stopDone.value * alpha),
          ]
        : []),

      // Run 2: ef = 3
      txt(
        'ef = 3  (wider list)',
        rx,
        58,
        34,
        run === 1 ? ROLE.A : COSMOS.muted,
        'serif',
        'left',
      ).opacity(alpha),
      txt(route3, rx, 113, 30, run === 1 ? ROLE.A : COSMOS.dim, 'mono', 'left').opacity(alpha),
      ...(foundDone.value > 0.02
        ? [
            lumBar(rx + 185, 182, 370, 54, {
              color: ROLE.A,
              fillAlpha: 0.24,
              strokeWidth: 2.8,
              glow: 10 * pulse,
              opacity: foundDone.value * alpha,
            }),
            txt(
              `finds E · L2² = ${res3.distanceSquared.toFixed(2)}`,
              rx + 185,
              182,
              28,
              ROLE.A,
              'mono',
            )
              .glow(6, ROLE.A)
              .opacity(foundDone.value * alpha),
          ]
        : []),

      rule(rx, 268, 845, 268, COSMOS.rule, 1.5).opacity(0.6 * alpha),
      txt('ef limits retained candidates,', rx, 322, 28, COSMOS.muted, 'sans', 'left').opacity(
        alpha,
      ),
      txt('not total nodes visited.', rx, 366, 28, COSMOS.ink, 'sans', 'left').opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.A), title, pyramid3d, pyramidOverlay, baseLayer);

  runPhase(s, c, phase, 10);
  orbitScene(s, c, pyramid3d, { theta: 0.25, phi: 0.98 });

  playCue(s, c, 'layers', (d) => s.play(upperVis.to(1, { duration: d })), { dur: 1.1 });

  c.hide('base', pyramid3d);
  playCue(s, c, 'base', (d) => s.play(swapVis(vPyramid, vBase, d)), { dur: 0.65 });
  playCue(s, c, 'greedy', (d) => s.play(stepPos.to(1, { duration: d })), { dur: 1.3 });
  playCue(s, c, 'stop', (d) => s.play(stopDone.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(
    s,
    c,
    'restart',
    (d) =>
      s.play(searchRun.to(1, { duration: 0.05 }), stepPos.to(0, { duration: Math.min(0.25, d) })),
    { dur: 0.3 },
  );
  playCue(s, c, 'wider', (d) => s.play(stepPos.to(1, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'c', (d) => s.play(stepPos.to(2, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'e', (d) => s.play(stepPos.to(3, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'found', (d) => s.play(foundDone.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
