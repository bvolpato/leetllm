// Scene 22: synthesis: "Turn the query"
// Grand geometric synthesis: blue query rotates 90° from [1,0] to [0,1] with a live sliding
// projection ruler; raw dot & cosine pick Audit while raw L2 picks Rotation; then both guides
// slide onto the glowing unit circle (paired with orbiting 3D unit sphere) where all 3 agree on Audit!
import { dynamic, group, line, projectionMark, projectToLine } from 'vizmatic/stage';
import {
  COSMOS,
  GUIDES,
  ROLE,
  buildUnitSphere3d,
  cinemaAtmosphere,
  cosine,
  dotProd,
  guardedDynamic,
  heroTitle,
  l2,
  normalized,
  orbitScene,
  playCue,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';
import { cinemaVectorPlane, guideVectors } from '../guide-plot.mjs';

export default function synthesis(s, c) {
  const qUp = [0, 1];
  const rawDot = GUIDES.map((g) => dotProd(qUp, g.vector)); // [0.2, 2.0]
  const rawCos = GUIDES.map((g) => cosine(qUp, g.vector)); // [0.196, 0.447]
  const rawL2 = GUIDES.map((g) => l2(qUp, g.vector)); // [1.281, 4.123]
  const unitData = GUIDES.map((g) => {
    const u = normalized(g.vector);
    const cos = cosine(qUp, u);
    return { id: g.id, name: g.name, color: g.color, cos, gap2: l2(qUp, u) ** 2 };
  });

  const phase = s.value(0);
  const angle = s.value(0);
  const mix = s.value(0);
  const extent = s.value(5.6);

  const vOldQ = s.value(1);
  const vNewQ = s.value(0);
  const vLiveReach = s.value(1);
  const vRawPanel = s.value(1);
  const showDotRow = s.value(0);
  const showCosRow = s.value(0);
  const showAsk = s.value(0);
  const showGapRow = s.value(0);
  const showRuler = s.value(1);
  const showUnitArc = s.value(0);
  const vUnitPanel = s.value(0);
  const showOrder = s.value(0);

  const curQuery = () => [Math.cos(angle.value), Math.sin(angle.value)];
  const curVectors = () =>
    GUIDES.map(({ vector }) => vector.map((x, i) => x + mix.value * (normalized(vector)[i] - x)));

  const plane = cinemaVectorPlane({
    originX: -785,
    originY: 280,
    width: 900,
    height: 510,
    extent: () => extent.value,
  });

  // Orbiting 3D unit sphere confirmation (revealed cleanly in unit-circle stage)
  const { view: sphere3d } = buildUnitSphere3d({
    x: 695,
    y: -245,
    radius: 1.32,
    unit: 80,
    distance: 13.4,
    theta: -0.78,
    phi: 1.05,
    vectors: [
      { dir: [0, 1, 0.12], color: ROLE.query, width: 4.2 },
      { dir: [...normalized(GUIDES[0].vector), 0.12], color: ROLE.A, width: 4.0 },
      { dir: [...normalized(GUIDES[1].vector), 0.12], color: ROLE.B, width: 4.2 },
    ],
    geodesics: [
      { a: [0, 1, 0.12], b: [...normalized(GUIDES[0].vector), 0.12], color: ROLE.A, width: 2.6 },
      { a: [0, 1, 0.12], b: [...normalized(GUIDES[1].vector), 0.12], color: ROLE.gold, width: 3.6 },
    ],
  });

  const title = heroTitle(['Turn the query', 'straight up'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
    eyebrow: 'GEOMETRIC SYNTHESIS',
  });

  // Projection ruler along q (only draws projection marks once q aligns near vertical or horizontal,
  // avoiding sweeping a long ray across A/B labels mid-rotation)
  const rulerLayer = guardedDynamic(showRuler, (a) => {
    const ang = angle.value;
    const settled = ang < 0.05 || ang > 1.45 ? 1 : 0;
    if (settled < 0.5) return group();
    const q = curQuery();
    const reaches = GUIDES.map(({ vector }) => projectToLine(vector, [0, 0], q).signedDistance);
    const len = Math.max(1.2, ...reaches) + 0.25;
    const onRuler = (d, off = 0) => plane.p([d * q[0] - off * q[1], d * q[1] + off * q[0]]);
    const ticks = [];
    for (let u = 0.5; u < len; u += 0.5) {
      const h = Number.isInteger(u) ? 0.08 : 0.04;
      ticks.push(line(onRuler(u, -h), onRuler(u, h), { stroke: ROLE.query, width: 2 }).opacity(a));
    }
    return group(
      line(onRuler(0), onRuler(len), { stroke: ROLE.query, width: 3 })
        .glow(6, ROLE.query)
        .opacity(a),
      ...ticks,
      ...GUIDES.map(({ vector, color }) =>
        projectionMark(plane.p(vector), plane.p([0, 0]), plane.p(q), {
          color,
          width: 3,
          radius: 8,
        }).opacity(a),
      ),
    );
  });

  // Glowing yellow L2 chords (raw or unit)
  const chordLayer = guardedDynamic(showGapRow, (a) => {
    const q = curQuery();
    const vecs = curVectors();
    const qPt = plane.p(q);
    return group(
      line(qPt, plane.p(vecs[0]), { stroke: ROLE.gold, width: 4.5, dash: [9, 6] })
        .glow(8, ROLE.gold)
        .opacity(a),
      line(qPt, plane.p(vecs[1]), { stroke: ROLE.gold, width: 4.5, dash: [9, 6] })
        .glow(8, ROLE.gold)
        .opacity(a),
    );
  });

  // Right column: View 1 (Raw upward-query rulers)
  const rawPanel = guardedDynamic(vRawPanel, (alpha) => {
    const q = curQuery();
    const reaches = GUIDES.map(({ vector }) => projectToLine(vector, [0, 0], q).signedDistance);
    const rx = 215;

    const nodes = [
      rule(170, -395, 170, 405, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('A [1, 0.2]   ·   B [4, 2]', rx, -355, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
    ];

    if (vOldQ.value > 0.02) {
      nodes.push(
        txt('q = [1, 0]', rx, -295, 36, ROLE.query, 'mono', 'left').opacity(vOldQ.value * alpha),
      );
    }
    if (vNewQ.value > 0.02) {
      nodes.push(
        txt('q = [0, 1]', rx, -295, 36, ROLE.query, 'mono', 'left')
          .glow(7, ROLE.query)
          .opacity(vNewQ.value * alpha),
      );
    }

    if (vLiveReach.value > 0.02) {
      nodes.push(
        txt('LIVE REACH ALONG q', rx, -195, 26, COSMOS.muted, 'mono', 'left').opacity(
          vLiveReach.value * alpha,
        ),
        txt(
          `A ${reaches[0].toFixed(2)}     B ${reaches[1].toFixed(2)}`,
          rx,
          -140,
          38,
          ROLE.code,
          'mono',
          'left',
        ).opacity(vLiveReach.value * alpha),
      );
    }

    if (showDotRow.value > 0.02) {
      nodes.push(
        txt('DOT PRODUCT (HEIGHT)', rx, -195, 26, ROLE.B, 'mono', 'left').opacity(
          showDotRow.value * alpha,
        ),
        txt(
          `A ${rawDot[0].toFixed(1)}    B ${rawDot[1].toFixed(1)}   →  Audit`,
          rx,
          -140,
          36,
          ROLE.B,
          'mono',
          'left',
        )
          .glow(6, ROLE.B)
          .opacity(showDotRow.value * alpha),
      );
    }

    if (showCosRow.value > 0.02) {
      nodes.push(
        txt('COSINE (DIRECTION)', rx, -45, 26, ROLE.B, 'mono', 'left').opacity(
          showCosRow.value * alpha,
        ),
        txt(
          `A ${rawCos[0].toFixed(3)}   B ${rawCos[1].toFixed(3)}  →  Audit`,
          rx,
          10,
          36,
          ROLE.B,
          'mono',
          'left',
        )
          .glow(6, ROLE.B)
          .opacity(showCosRow.value * alpha),
      );
    }

    if (showAsk.value > 0.02) {
      nodes.push(
        txt('Which original tip is nearest to q?', rx, 145, 36, ROLE.gold, 'serif', 'left')
          .glow(8, ROLE.gold)
          .opacity(showAsk.value * alpha),
      );
    }

    if (showGapRow.value > 0.02) {
      nodes.push(
        txt('RAW ENDPOINT GAP (L2)', rx, 108, 26, ROLE.A, 'mono', 'left').opacity(
          showGapRow.value * alpha,
        ),
        txt(
          `A ${rawL2[0].toFixed(2)}    B ${rawL2[1].toFixed(2)}   →  Rotation!`,
          rx,
          164,
          36,
          ROLE.A,
          'mono',
          'left',
        )
          .glow(7, ROLE.A)
          .opacity(showGapRow.value * alpha),
      );
    }

    return group(...nodes);
  });

  // Right column: View 2 (Unit circle agreement + 3D sphere)
  const unitPanel = guardedDynamic(vUnitPanel, (alpha) => {
    const rx = 215;
    const o = showOrder.value * alpha;
    return group(
      rule(170, -395, 170, 405, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('ON THE UNIT CIRCLE', rx, -355, 28, ROLE.code, 'mono', 'left').opacity(alpha),
      txt('q = [0, 1]', rx, -295, 34, ROLE.query, 'mono', 'left').opacity(alpha),
      ...(o > 0.02
        ? [
            // Unit A
            txt('Rotation (A) · unit', rx, -45, 32, ROLE.A, 'serif', 'left').opacity(o),
            txt(
              `dot = cos ≈ ${unitData[0].cos.toFixed(3)}   ·   gap² ≈ ${unitData[0].gap2.toFixed(3)}`,
              rx,
              8,
              28,
              COSMOS.ink,
              'mono',
              'left',
            ).opacity(o),
            // Unit B
            txt('Audit (B) · unit', rx, 102, 32, ROLE.B, 'serif', 'left')
              .glow(6, ROLE.B)
              .opacity(o),
            txt(
              `dot = cos ≈ ${unitData[1].cos.toFixed(3)}   ·   gap² ≈ ${unitData[1].gap2.toFixed(3)}`,
              rx,
              155,
              28,
              ROLE.gold,
              'mono',
              'left',
            )
              .glow(6, ROLE.gold)
              .opacity(o),
            // Grand agreement verdict
            txt('All three rulers put Audit first!', rx, 285, 38, ROLE.B, 'serif', 'left')
              .glow(9, ROLE.B)
              .opacity(o),
            txt(
              'Keep q = [0, 1] for one last search',
              rx,
              345,
              28,
              COSMOS.muted,
              'sans',
              'left',
            ).opacity(o),
          ]
        : []),
    );
  });

  const unitArcVis = guardedDynamic(showUnitArc, (a) => plane.unitArc.opacity(a));

  // Dynamic vectors with angle-aware non-colliding query label (always clear of axes & ticks)
  const dynamicQVec = dynamic(() => {
    const q = curQuery();
    const end = plane.p(q);
    const a = angle.value;
    const settledStart = Math.max(0, 1 - a * 10);
    const settledEnd = Math.max(0, (a - 1.42) / 0.15);
    const nodes = [plane.span([0, 0], q, { stroke: ROLE.query, width: 5.5 }).glow(8, ROLE.query)];
    if (settledStart > 0.02) {
      nodes.push(
        txt('q', end[0] + 22, end[1] + 46, 32, ROLE.query, 'mono')
          .glow(5, ROLE.query)
          .opacity(settledStart),
      );
    }
    if (settledEnd > 0.02) {
      nodes.push(
        txt('q', end[0] + 38, end[1] - 54, 32, ROLE.query, 'mono')
          .glow(5, ROLE.query)
          .opacity(settledEnd),
      );
    }
    return group(...nodes);
  });

  s.add(
    cinemaAtmosphere(ROLE.query, ROLE.B),
    title,
    plane.grid,
    unitArcVis,
    rulerLayer,
    dynamicQVec,
    plane.vector(() => curVectors()[0], 'A', ROLE.A, [30, -28], { width: 5.8, tip: 18 }),
    plane.vector(() => curVectors()[1], 'B', ROLE.B, [36, 30], { width: 5.8, tip: 18 }),
    chordLayer,
    rawPanel,
    unitPanel,
  );

  runPhase(s, c, phase, 10);

  playCue(
    s,
    c,
    'turn',
    (d) => s.play(vOldQ.to(0, { duration: 0.25 }), angle.to(Math.PI / 2, { duration: d })),
    { dur: 1.3 },
  );
  playCue(s, c, 'up', (d) => s.play(vNewQ.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'dot', (d) => s.play(swapVis(vLiveReach, showDotRow, d)), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'cos', (d) => s.play(showCosRow.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'ask', (d) => s.play(showAsk.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'gap', (d) => s.play(showAsk.to(0, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'gap', (d) => s.play(showGapRow.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  c.show('unit', sphere3d);
  playCue(
    s,
    c,
    'unit',
    (d) =>
      s.play(
        showRuler.to(0, { duration: 0.3 }),
        showUnitArc.to(1, { duration: 0.4 }),
        swapVis(vRawPanel, vUnitPanel, 0.55),
        mix.to(1, { duration: d }),
        extent.to(1.32, { duration: d }),
      ),
    { dur: 1.7 },
  );
  orbitScene(s, c, sphere3d, { theta: 0.48, phi: 0.96 });
  playCue(s, c, 'order', (d) => s.play(showOrder.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
