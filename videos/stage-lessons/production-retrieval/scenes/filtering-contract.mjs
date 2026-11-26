// Scene 06 (filtering-contract): "Which three passages can Luna receive?"
// Orbiting 3D HNSW graph inside trusted search sphere (Q -> R1 -> P1) paired with luminous
// Global top-3 redaction (1 left) vs Allowed top-3 (3 recovered) comparison, transitioning to
// the external reranker scope boundary.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildHnswFilter3d,
  callerTag,
  cinemaAtmosphere,
  filteredRecallFixture,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  runPhase,
  seq,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function filteringContract(s, c) {
  const data = filteredRecallFixture();

  const phase = s.value(0);
  const graphLit = s.value(0);
  const hopProgress = s.value(0); // 0 -> 0.5 (Q->R1) -> 1 (R1->P1)
  const showGlobal = s.value(0);
  const showTrim = s.value(0);
  const showAllowed = s.value(0);
  const boundaryMode = s.value(0); // 0 = HNSW view, 1 = Scope boundary laser curtain
  const r1Move = s.value(0); // R1 moves to boundary and stops
  const p1Move = s.value(0); // P1 passes boundary to reranker
  // Footer mode: 0 = intro, 1 = global 1 left, 2 = global 1 vs allowed 3, 3 = boundary check
  const footMode = s.value(0);

  const { view: hnsw3d } = buildHnswFilter3d(hopProgress, { x: 470, y: 15 });

  const title = heroTitle(['Which Three Passages', 'Can Luna Receive?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'VECTOR FILTERING CONTRACT · HNSW BOUNDARY',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const gl = graphLit.value;
    const sg = showGlobal.value;
    const st = showTrim.value;
    const sa = showAllowed.value;
    const bm = boundaryMode.value;
    const r1 = r1Move.value;
    const p1 = p1Move.value;
    const fm = Math.round(footMode.value);

    const nodes = [callerTag(1)];

    // Left: Distance-ranked 5-passage luminous table (no heavy chrome)
    const rowStartY = -185;
    const rowPitch = 94;
    nodes.push(
      txt('RANKED BY DISTANCE', -855, -252, 26, COSMOS.muted, 'mono', 'left'),
      txt('GLOBAL k=3', -340, -252, 26, ROLE.warn, 'mono', 'center'),
      txt('ALLOWED k=3', -95, -252, 26, ROLE.admitted, 'mono', 'center'),
    );

    data.records.forEach((rec, i) => {
      const ry = rowStartY + i * rowPitch;
      const inGlobal = i < 3;
      const scopeCol = rec.allowed ? ROLE.admitted : ROLE.danger;
      nodes.push(
        lumBar(-435, ry, 845, 72, {
          color: rec.allowed && sa > 0.5 ? ROLE.admitted : '#314266',
          fillAlpha: rec.allowed && sa > 0.5 ? 0.14 : 0.06,
          strokeWidth: 1.8,
          glow: rec.allowed && sa > 0.5 ? 6 : 0,
          radius: 10,
        }),
        glowDot(-825, ry, { radius: 8, color: scopeCol, glow: 9 }),
        txt(`${rec.id}  d=${rec.distance.toFixed(1)}`, -795, ry, 28, COSMOS.ink, 'mono', 'left'),
        txt(rec.allowed ? 'permitted' : 'restricted', -575, ry, 26, scopeCol, 'sans', 'left'),
      );

      // Global cut status
      if (sg > 0.1 && inGlobal) {
        const removed = !rec.allowed && st > 0.3;
        const kept = rec.allowed && st > 0.3;
        const lbl = removed ? 'REMOVED' : kept ? 'KEPT' : 'TOP-3';
        const col = removed ? ROLE.danger : kept ? ROLE.admitted : ROLE.focus;
        nodes.push(
          txt(lbl, -340, ry, 26, col, 'mono', 'center')
            .glow(removed || kept ? 6 : 0, col)
            .opacity(sg),
        );
      }

      // Allowed cut status
      if (sa > 0.1) {
        const lbl = rec.allowed ? 'SELECTED' : 'EXCLUDED';
        const col = rec.allowed ? ROLE.admitted : ROLE.danger;
        nodes.push(
          txt(lbl, -95, ry, 26, col, 'mono', 'center')
            .glow(rec.allowed ? 7 : 0, col)
            .opacity(sa),
        );
      }
    });

    // Right side caption for 3D HNSW sphere (fades out cleanly before Scope boundary overlay)
    const hnswOp = Math.max(0, 1 - bm * 2.6);
    if (hnswOp > 0.02) {
      nodes.push(
        txt(
          'HNSW INSIDE TRUSTED SEARCH',
          470,
          -318,
          26,
          gl > 0.3 ? ROLE.policy : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(gl > 0.3 ? 7 : 0, ROLE.policy)
          .opacity(hnswOp),
        txt(
          'Q (blue) -> R1 (red) -> P1 (green)',
          470,
          326,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(hnswOp),
      );
    }

    // Right side Scope Boundary Overlay (appears cleanly after `pr-scope`)
    const bndOp = Math.max(0, (bm - 0.45) / 0.55);
    if (bndOp > 0.02) {
      const bx0 = 95;
      const bxWall = 465;
      const bxRerank = 805;
      const yR1 = -45;
      const yP1 = 125;

      nodes.push(
        lumBar(465, 40, 770, 460, {
          color: '#070910',
          fillAlpha: 0.92 * bndOp,
          strokeWidth: 0,
          glow: 0,
          radius: 16,
          opacity: bndOp,
        }),
        txt('PAYLOAD BOUNDARY', bxWall, -160, 26, ROLE.focus, 'mono', 'center')
          .glow(7, ROLE.focus)
          .opacity(bndOp),
        txt('INDEX', bx0 + 30, -160, 26, COSMOS.muted, 'mono', 'center').opacity(bndOp),
        txt('RERANKER', bxRerank, -160, 26, ROLE.admitted, 'mono', 'center').opacity(bndOp),
        // Glowing gold boundary laser curtain
        line([bxWall, -125], [bxWall, 220], { stroke: ROLE.focus, width: 5.5 })
          .glow(12 * pulse, ROLE.focus)
          .opacity(bndOp),
        // Lanes
        line([bx0 + 30, yR1], [bxWall, yR1], { stroke: '#4a2538', width: 3.5 }).opacity(bndOp),
        line([bx0 + 30, yP1], [bxRerank, yP1], { stroke: '#254a42', width: 3.5 }).opacity(bndOp),
      );

      // R1 stops cleanly left of the boundary wall
      const rx = bx0 + 30 + (bxWall - 48 - (bx0 + 30)) * r1;
      nodes.push(
        glowRing(rx, yR1, 19, ROLE.danger, { width: 3.2, glow: 10, opacity: bndOp }),
        glowDot(rx, yR1, { radius: 8, color: ROLE.danger, glow: 11, opacity: bndOp }),
        txt('R1', rx, yR1 - 44, 26, ROLE.danger, 'mono', 'center').opacity(bndOp),
      );
      if (r1 > 0.8) {
        nodes.push(
          txt('HELD INSIDE', bxWall + 28, yR1, 26, ROLE.danger, 'mono', 'left')
            .glow(7, ROLE.danger)
            .opacity(bndOp),
        );
      }

      // P1 crosses boundary to external reranker
      const px = bx0 + 30 + (bxRerank - (bx0 + 30)) * p1;
      nodes.push(
        glowRing(px, yP1, 19, ROLE.admitted, { width: 3.2, glow: 10, opacity: bndOp }),
        glowDot(px, yP1, { radius: 8, color: ROLE.admitted, glow: 11, opacity: bndOp }),
        txt('P1', px, yP1 - 44, 26, ROLE.admitted, 'mono', 'center').opacity(bndOp),
      );
      if (p1 > 0.85) {
        nodes.push(
          txt('PERMITTED', bxRerank, yP1 + 52, 26, ROLE.admitted, 'mono', 'center')
            .glow(7, ROLE.admitted)
            .opacity(bndOp),
        );
      }
    }

    // Bottom discrete verdict
    const footMap = [
      { text: 'Graph traversal may touch R1 inside trusted search', color: COSMOS.muted },
      {
        text: `Global cut  ->  only ${data.redacted.length} permitted passage survives`,
        color: ROLE.warn,
      },
      {
        text: `Global cut: ${data.redacted.length}   vs   Allowed cut: ${data.allowed.length} permitted passages`,
        color: ROLE.admitted,
      },
      { text: 'Scope boundary keeps restricted payloads inside the service', color: ROLE.focus },
    ];
    const ft = footMap[Math.max(0, Math.min(footMap.length - 1, fm))];
    nodes.push(
      txt(ft.text, -855, 415, 32, ft.color, 'mono', 'left').glow(fm > 0 ? 7 : 0, ft.color),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.admitted), hnsw3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, hnsw3d, { theta: 0.35, phi: 0.98 });

  tweenCue(s, c, 'pr-graph', graphLit, 1, { dur: 0.5 });
  playCue(
    s,
    c,
    'pr-traverse',
    (d) =>
      s.play(
        seq(hopProgress.to(0.5, { duration: d * 0.5 }), hopProgress.to(1, { duration: d * 0.5 })),
      ),
    { dur: 1.5 },
  );
  tweenCue(s, c, 'pr-globalcut', showGlobal, 1, { dur: 0.5 });
  playCue(
    s,
    c,
    'pr-trim',
    (d) => s.play(showTrim.to(1, { duration: d }), footMode.to(1, { duration: 0.05 })),
    { after: true, dur: 0.5 },
  );
  playCue(
    s,
    c,
    'pr-allowedcut',
    (d) => s.play(showAllowed.to(1, { duration: d }), footMode.to(2, { duration: 0.05 })),
    { after: true, dur: 0.55 },
  );
  playCue(
    s,
    c,
    'pr-scope',
    (d) => s.play(boundaryMode.to(1, { duration: d }), footMode.to(3, { duration: 0.05 })),
    { dur: 0.6 },
  );
  tweenCue(s, c, 'pr-restricted', r1Move, 1, { dur: 0.75 });
  tweenCue(s, c, 'pr-permitted', p1Move, 1, { dur: 0.85 });
}
