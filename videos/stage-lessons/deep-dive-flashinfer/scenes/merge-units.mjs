// Scene 09: Name the producer before converting its statistic: ln vs log2 LSE, double conversion bug, 0.6.18 vs 0.7.1.
import {
  COSMOS,
  MERGE_CORRECT,
  MERGE_DOUBLE_CONV,
  MERGE_WRONG_BASE,
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
  runPhase,
  txt,
} from '../parts.mjs';

export default function mergeUnits(s, c) {
  const phase = s.value(0);
  const showConv = s.value(1);
  const convStage = s.value(0); // 0=raw ln bug, 1=convert once (/ln2), 2=double convert bug
  const showVersions = s.value(0);
  const verDetail = s.value(0);
  const showProducer = s.value(0);
  const prodRule = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b1a', '#5ce1e61a');

  const title = heroTitle(['Name the Producer', 'Before Converting'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'LSE BASE UNITS · LN VS LOG2',
    subtitle: 'Divide natural-log LSE by ln(2) once; never twice',
  });

  // View 0: Conversion comparison bars (0x, 1x, 2x division by ln 2)
  const convView = guardedDynamic(showConv, (a) => {
    const st = convStage.value;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const cases = [
      {
        cx: -555,
        head: 'UNCONVERTED ln',
        sub: 'b = [1.386, 0.693]',
        outA: MERGE_WRONG_BASE.output[0],
        col: ROLE.bad,
        tag: 'WRONG: 0.618 vs 0.667',
        active: st < 0.5,
      },
      {
        cx: 0,
        head: 'CONVERT ONCE (÷ ln 2)',
        sub: 'b = [2.000, 1.000]',
        outA: MERGE_CORRECT.output[0],
        col: ROLE.good,
        tag: 'EXACT: 0.667 (2/3, 1/3)',
        active: st >= 0.5 && st < 1.5,
      },
      {
        cx: 555,
        head: 'DOUBLE CONVERT (÷ ln2²)',
        sub: 'b = [2.885, 1.443]',
        outA: MERGE_DOUBLE_CONV.output[0],
        col: ROLE.bad,
        tag: `DISTORTED: ${MERGE_DOUBLE_CONV.output[0].toFixed(3)}`,
        active: st >= 1.5,
      },
    ];

    const nodes = [
      txt(
        'EFFECT OF LSE BASE CONVERSION ON WORKER A SHARE (TRUE = 0.667)',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    cases.forEach((cs) => {
      const barW = 420;
      const fillW = Math.round(barW * cs.outA);
      nodes.push(
        glassCell(cs.cx, 55, 490, 340, cs.col, {
          fill: cs.active ? '#162038' : '#0c1222',
          glow: cs.active ? 11 * pulse : 4,
          opacity: a,
        }),
        txt(cs.head, cs.cx, -72, 28, cs.col, 'mono').opacity(a),
        txt(cs.sub, cs.cx, -24, 26, COSMOS.muted, 'mono').opacity(a),
        // Share bar
        rect(barW, 46, { fill: '#192138', stroke: COSMOS.rule, width: 2, radius: 8 })
          .at(cs.cx, 58)
          .opacity(a),
        rect(fillW, 40, { fill: cs.col, stroke: null, radius: 6 })
          .at(cs.cx - (barW - fillW) * 0.5, 58)
          .opacity(0.85 * a),
        txt(`o[0] = ${cs.outA.toFixed(4)}`, cs.cx, 128, 34, COSMOS.ink, 'mono').opacity(a),
        txt(cs.tag, cs.cx, 180, 26, cs.col, 'mono').opacity(a),
      );
    });

    nodes.push(
      txt(
        'Keep normalized o unchanged; only convert ln LSE -> log2 LSE once',
        0,
        320,
        30,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // View 1: Real release boundary timeline (0.6.18 -> 0.7.0 -> 0.7.1)
  const versionView = guardedDynamic(showVersions, (a) => {
    const vd = verDetail.value;
    const stages = [
      {
        cx: -555,
        ver: 'v0.6.18',
        path: 'cuDNN frontend path',
        lse: 'Returned ln LSE',
        note: 'No conversion applied',
        col: ROLE.bad,
      },
      {
        cx: 0,
        ver: 'v0.7.0',
        path: 'Conversion fix',
        lse: 'ln -> log2 fix',
        note: 'Aligned frontend to base 2',
        col: ROLE.warn,
      },
      {
        cx: 555,
        ver: 'v0.7.1',
        path: 'Low-level interface',
        lse: 'lse_base="log2" default',
        note: '"ln" is explicit opt-in',
        col: ROLE.good,
      },
    ];

    const nodes = [
      txt('REAL RELEASE BOUNDARY FOR CUDNN LSE BASE', 0, -155, 28, COSMOS.gold, 'mono').opacity(a),
    ];

    stages.forEach((st) => {
      nodes.push(
        glassCell(st.cx, 65, 490, 315, st.col, { fill: '#0e172a', glow: 8, opacity: a }),
        txt(st.ver, st.cx, -45, 40, st.col, 'mono').glow(6, st.col).opacity(a),
        txt(st.path, st.cx, 15, 28, COSMOS.ink, 'sans').opacity(a),
        txt(st.lse, st.cx, 72, 28, COSMOS.gold, 'mono').opacity(a),
        txt(st.note, st.cx, 134, 26, COSMOS.muted, 'sans').opacity(a),
      );
    });

    if (vd > 0.05) {
      nodes.push(
        txt(
          'Explicit lse_base parameter replaces hidden unit assumptions',
          0,
          318,
          30,
          ROLE.good,
          'sans',
        ).opacity(vd * a),
      );
    }

    return group(...nodes);
  });

  // View 2: Frontend vs Cubin path + producer receipt rule
  const producerView = guardedDynamic(showProducer, (a) => {
    const pr = prodRule.value;
    const nodes = [
      txt('EVEN INSIDE v0.7.1, BACKEND PATHS DIFFER', 0, -155, 28, COSMOS.cyan, 'mono').opacity(a),

      glassCell(-440, 20, 740, 220, ROLE.warn, { fill: '#221a10', glow: 8, opacity: a }),
      txt('cuDNN FRONTEND PATH', -440, -45, 30, ROLE.warn, 'mono').opacity(a),
      txt('Default: lse_base = "log2"', -440, 12, 28, COSMOS.ink, 'mono').opacity(a),
      txt('Accepts explicit lse_base = "ln"', -440, 66, 28, COSMOS.gold, 'sans').opacity(a),

      glassCell(440, 20, 740, 220, ROLE.r2, { fill: '#0f2336', glow: 8, opacity: a }),
      txt('cuDNN CUBIN PATH', 440, -45, 30, ROLE.r2, 'mono').opacity(a),
      txt('Always returns base-2 LSE', 440, 12, 28, COSMOS.ink, 'mono').opacity(a),
      txt('Rejects lse_base = "ln" requests', 440, 66, 28, ROLE.bad, 'sans').opacity(a),
    ];

    if (pr > 0.05) {
      nodes.push(
        glassCell(0, 285, 1620, 136, ROLE.good, { fill: '#0e2623', glow: 10, opacity: pr * a }),
        txt(
          'RECORD: (producer backend, release version, lse_base argument)',
          0,
          258,
          30,
          ROLE.good,
          'mono',
        )
          .glow(5, ROLE.good)
          .opacity(pr * a),
        txt(
          'A library version alone cannot tell you the units of every returned statistic',
          0,
          312,
          28,
          COSMOS.ink,
          'sans',
        ).opacity(pr * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, convView, versionView, producerView);
  runPhase(s, c, phase, 14);

  c.on('fi-merge-units-0', () =>
    s.play(convStage.to(1, { duration: remainDuration(c, 'fi-merge-units-0', 0.8) })),
  );
  c.on('fi-merge-units-0-result', () =>
    s.play(convStage.to(2, { duration: remainDuration(c, 'fi-merge-units-0-result', 0.5) })),
  );
  c.on('fi-merge-units-1', () => {
    s.play(
      par(showConv.to(0, { duration: 0.18 }), delay(showVersions.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-merge-units-1-result', () =>
    s.play(verDetail.to(1, { duration: remainDuration(c, 'fi-merge-units-1-result', 0.4) })),
  );
  c.on('fi-merge-units-2', () => {
    s.play(
      par(
        showVersions.to(0, { duration: 0.18 }),
        delay(showProducer.to(1, { duration: 0.22 }), 0.2),
      ),
    );
  });
  c.on('fi-merge-units-2-result', () =>
    s.play(prodRule.to(1, { duration: remainDuration(c, 'fi-merge-units-2-result', 0.4) })),
  );
}
