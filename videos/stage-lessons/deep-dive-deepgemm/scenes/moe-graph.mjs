// Scene 19: Which token gets the expert result?
// PREDICTION SCENE: Beat 2 compares Source-ID vs Arrival-Order (both sum = 10).
// STRICT WITHHOLDING: Keep PASS/FAIL verdict & green/red outcome colors concealed until c.after('mg-verdict')!
import {
  COSMOS,
  RETURN_FAIL,
  RETURN_PASS,
  ROLE,
  ROUTED_T7,
  ROUTED_T9,
  aura,
  buildMegaMoeRing3d,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  par,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function moeGraph(s, c) {
  const phase = s.value(0);
  const overlap3d = s.value(0.3);
  const showGraph = s.value(1);
  const showCompare = s.value(0);
  const graphStep = s.value(0); // 1=L1, 2=SwiGLU, 3=t7=7, 4=t9=3
  const showSum10 = s.value(0);
  const revealVerdict = s.value(0); // STRICT: c.after('mg-verdict')
  const showMega = s.value(0);
  const showFormats = s.value(0);

  const bgAura = aura(445, 20, 520, '#60a5fa20', '#6ee7b71a');
  const { view: ring3d } = buildMegaMoeRing3d(overlap3d, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['Which Token Gets', 'the Expert Result?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'COMPLETE MOE GRAPH · SOURCE IDS',
    subtitle: 'Dispatch -> L1 (gate + up) -> SwiGLU -> L2 -> Weighted Combine',
  });

  // View 1 (Beats 0-1): Complete 5-stage graph + weighted combine arithmetic for t7 & t9
  const graphView = guardedDynamic(showGraph, (a) => {
    const st = graphStep.value;
    const nodes = [
      txt('3D FUSED MEGA MOE GRAPH', 455, -415, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        'Router -> Dispatch -> L1/SwiGLU/L2 -> Combine',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];

    const stages = [
      { label: 'L1: H -> 2I', sub: 'gate + up', col: ROLE.a, lit: st >= 0.6, x: -735 },
      { label: 'SwiGLU', sub: 'SiLU(g) × up', col: ROLE.scale, lit: st >= 1.6, x: -460 },
      { label: 'L2 + Combine', sub: 'I -> H weighted', col: ROLE.c, lit: st >= 2.6, x: -185 },
    ];
    stages.forEach((sg, idx) => {
      nodes.push(
        glassCell(sg.x, -110, 244, 108, sg.lit ? sg.col : COSMOS.dim, {
          fill: '#0e172a',
          glow: sg.lit ? 8 : 0,
          opacity: a,
        }),
        txt(sg.label, sg.x, -132, 26, sg.lit ? sg.col : COSMOS.muted, 'mono').opacity(a),
        txt(sg.sub, sg.x, -86, 26, COSMOS.ink, 'mono').opacity(a),
      );
      if (idx < 2) {
        nodes.push(
          line([sg.x + 124, -110], [sg.x + 150, -110], {
            stroke: sg.lit ? sg.col : COSMOS.dim,
            width: 3,
          }).opacity(a),
        );
      }
    });

    // Weighted combine worked rows: t7 and t9
    if (st >= 2.6) {
      nodes.push(
        glassCell(-460, 56, 780, 96, ROLE.gold, { fill: '#1a1a2a', glow: 8, opacity: a }),
        txt(
          'TOKEN 7  (E0: 4 × 0.25  +  E2: 8 × 0.75)',
          -825,
          36,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt(`1 + 6 = ${ROUTED_T7.total}`, -825, 78, 30, ROLE.gold, 'mono', 'left').opacity(a),
      );
    }

    if (st >= 3.6) {
      nodes.push(
        glassCell(-460, 188, 780, 96, ROLE.c, { fill: '#0e1f30', glow: 8, opacity: a }),
        txt(
          'TOKEN 9  (E0: 2 × 0.75  +  E2: 6 × 0.25)',
          -825,
          168,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt(`1.5 + 1.5 = ${ROUTED_T9.total}`, -825, 210, 30, ROLE.c, 'mono', 'left').opacity(a),
      );
    }

    nodes.push(
      txt(
        'Keep source token IDs attached when unpacking combined rows',
        -860,
        350,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // View 2 (Beats 2-3): Reverse arrival comparison (STRICT PREDICTION WITHHOLDING!)
  const compareView = guardedDynamic(showCompare, (a) => {
    const rev = revealVerdict.value > 0.5;
    const leftCol = rev ? ROLE.good : ROLE.a;
    const rightCol = rev ? ROLE.bad : ROLE.c;
    const nodes = [
      txt('3D SOURCE-ID RESTORATION CHECK', 455, -415, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        rev
          ? 'Arriving order: [t9: 3, t7: 7] -> unpack by source ID'
          : 'Arriving order: [t9: 3, t7: 7] -> check each token',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
      txt(
        'REFERENCE TARGET:  t7 = 7   ·   t9 = 3',
        -860,
        -170,
        28,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(a),

      // Left copy: follows source ID
      glassCell(-665, -24, 385, 210, leftCol, { fill: '#0f1b2e', glow: rev ? 10 : 5, opacity: a }),
      txt('COPY A: BY SOURCE ID', -665, -94, 26, leftCol, 'mono').opacity(a),
      txt('t7 <- 7  ·  t9 <- 3', -665, -44, 26, COSMOS.ink, 'mono').opacity(a),
      txt(`column sum = ${RETURN_PASS.total}`, -665, 6, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        rev ? 'VERDICT: PASS' : 'VERDICT: ?',
        -665,
        52,
        26,
        rev ? ROLE.good : ROLE.gold,
        'mono',
      ).opacity(a),

      // Right copy: arrival order (swapped!)
      glassCell(-245, -24, 405, 210, rightCol, { fill: '#181426', glow: rev ? 10 : 5, opacity: a }),
      txt('COPY B: ARRIVAL ORDER', -245, -94, 26, rightCol, 'mono').opacity(a),
      txt('t7 <- 3  ·  t9 <- 7', -245, -44, 26, COSMOS.ink, 'mono').opacity(a),
      txt(`column sum = ${RETURN_FAIL.total}`, -245, 6, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        rev ? 'VERDICT: FAIL (SWAP)' : 'VERDICT: ?',
        -245,
        52,
        26,
        rev ? ROLE.bad : ROLE.gold,
        'mono',
      ).opacity(a),
    ];

    if (showSum10.value > 0.5 && !rev) {
      nodes.push(
        glassCell(-460, 175, 800, 88, ROLE.gold, { fill: '#221c10', glow: 9, opacity: a }),
        txt(
          'Both columns sum to 10. Do both pass a per-token check?',
          -460,
          175,
          26,
          ROLE.gold,
          'serif',
        ).opacity(a),
      );
    }

    if (rev) {
      const msg =
        showFormats.value > 0.5
          ? 'July FP4 · Oct FP8 & BF16 -> match buffer & recipe'
          : showMega.value > 0.5
            ? 'Mega MoE fuses dispatch, L1, SwiGLU, L2 & combine'
            : 'Only Copy A passes: Copy B swapped t7 & t9';
      nodes.push(
        glassCell(-460, 175, 800, 88, ROLE.good, { fill: '#0e2420', glow: 8, opacity: a }),
        txt(msg, -460, 175, 26, ROLE.good, 'sans').opacity(a),
      );
    }

    nodes.push(
      txt(
        'Compare restored per-token rows against reference before timing',
        -860,
        350,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, graphView, compareView);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.94 });

  c.on('mg-l1', () => s.play(graphStep.to(1, { duration: remainDuration(c, 'mg-l1', 0.45) })));
  c.on('mg-swiglu', () =>
    s.play(graphStep.to(2, { duration: remainDuration(c, 'mg-swiglu', 0.45) })),
  );
  c.after('mg-t7', () =>
    s.play(graphStep.to(3, { duration: remainAfterDuration(c, 'mg-t7', 0.35) })),
  );
  c.after('mg-t9', () =>
    s.play(graphStep.to(4, { duration: remainAfterDuration(c, 'mg-t9', 0.35) })),
  );

  c.on('mg-reverse', () => {
    s.play(
      par(showGraph.to(0, { duration: 0.18 }), delay(showCompare.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('mg-sum10', () => s.play(showSum10.to(1, { duration: remainDuration(c, 'mg-sum10', 0.4) })));

  // STRICT PREDICTION REVEAL AFTER CLAUSE!
  c.after('mg-verdict', () => {
    const dur = remainAfterDuration(c, 'mg-verdict', 0.35);
    s.play(revealVerdict.to(1, { duration: dur }));
  });
  c.after('mg-mega', () => {
    const dur = remainAfterDuration(c, 'mg-mega', 0.4);
    s.play(showMega.to(1, { duration: dur }));
    s.play(overlap3d.to(1, { duration: dur }));
  });
  c.on('mg-formats', () =>
    s.play(showFormats.to(1, { duration: remainDuration(c, 'mg-formats', 0.45) })),
  );
}
