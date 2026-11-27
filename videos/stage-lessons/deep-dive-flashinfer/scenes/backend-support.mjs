// Scene 21: Validate a specialization before choosing its binary: multi-backend dispatch, missing cubin vs unsupported op, v0.6.18 wheels.
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

export default function backendSupport(s, c) {
  const showComp = s.value(1);
  const compRec = s.value(0);
  const showJit = s.value(0);
  const customNote = s.value(0);
  const showWheels = s.value(0);
  const wheelWarn = s.value(0);

  const bgAura = aura(0, 20, 650, '#a78bfa1c', '#5ce1e61c');

  const title = heroTitle(['Validate Before', 'Choosing a Binary'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.violet,
    eyebrow: 'MULTI-BACKEND DISPATCH · AOT & JIT',
  });

  // View 0: 3-stage composition (Layout Reader -> Backend Kernel -> Merge/Output)
  const compView = guardedDynamic(showComp, (a) => {
    const cr = compRec.value;
    const stages = [
      { cx: -575, h: '1. LAYOUT READER', sub: 'Ragged / Paged / BSR', col: ROLE.r0 },
      { cx: 0, h: '2. BACKEND KERNEL', sub: 'FA2/3 · cuDNN · CUTLASS · TRT-LLM', col: ROLE.r2 },
      { cx: 575, h: '3. MERGE & OUTPUT', sub: 'Split-KV LSE / Transform', col: ROLE.good },
    ];
    const nodes = [
      txt(
        'A FLASHINFER OPERATION IS A THREE-STAGE COMPOSITION',
        0,
        -155,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
      glowingArc([-325, 20], [-255, 20], 0, { color: ROLE.r0, width: 4, opacity: 0.9 * a }),
      glowingArc([255, 20], [325, 20], 0, { color: ROLE.r2, width: 4, opacity: 0.9 * a }),
    ];

    stages.forEach((st) => {
      nodes.push(
        glassCell(st.cx, 20, 490, 210, st.col, { fill: '#0e182e', glow: 8, opacity: a }),
        txt(st.h, st.cx, -25, 28, st.col, 'mono').opacity(a),
        txt(st.sub, st.cx, 35, 26, COSMOS.ink, 'sans').opacity(a),
      );
    });

    if (cr > 0.05) {
      nodes.push(
        glassCell(0, 285, 1620, 126, COSMOS.gold, { fill: '#241c10', glow: 9, opacity: cr * a }),
        txt(
          'RECORD IMPLEMENTATION WITH: (backend, layout, heads, dtype, split policy)',
          0,
          285,
          28,
          COSMOS.gold,
          'mono',
        ).opacity(cr * a),
      );
    }

    return group(...nodes);
  });

  // View 1: Missing binary (supported JIT) vs Unsupported combination
  const jitView = guardedDynamic(showJit, (a) => {
    const cn = customNote.value;
    const nodes = [
      txt(
        'MISSING PRECOMPILED BINARY  !=  UNSUPPORTED SPECIALIZATION',
        0,
        -155,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(-440, 40, 740, 240, ROLE.good, { fill: '#0e2824', glow: 9, opacity: a }),
      txt('SUPPORTED · MISSING CUBIN', -440, -34, 28, ROLE.good, 'mono').opacity(a),
      txt('Valid GPU + head dim + dtype', -440, 22, 28, COSMOS.ink, 'sans').opacity(a),
      txt('-> Compiles via JIT with matching toolchain', -440, 82, 26, COSMOS.gold, 'mono').opacity(
        a,
      ),

      glassCell(440, 40, 740, 240, ROLE.bad, { fill: '#2c101b', glow: 9, opacity: a }),
      txt('UNSUPPORTED COMBINATION', 440, -34, 28, ROLE.bad, 'mono').opacity(a),
      txt('Arbitrary head dim, format, or GPU', 440, 22, 28, COSMOS.ink, 'sans').opacity(a),
      txt('-> Having nvcc installed will NOT make it valid', 440, 82, 26, ROLE.bad, 'mono').opacity(
        a,
      ),
    ];

    if (cn > 0.05) {
      nodes.push(
        glassCell(0, 295, 1620, 118, ROLE.violet, { fill: '#1c1336', glow: 8, opacity: cn * a }),
        txt(
          'Custom attention scores require an implemented variant + correctness checks, not a label',
          0,
          295,
          28,
          ROLE.violet,
          'sans',
        ).opacity(cn * a),
      );
    }

    return group(...nodes);
  });

  // View 2: v0.6.18 prebuilt JIT cache wheel changes
  const wheelView = guardedDynamic(showWheels, (a) => {
    const ww = wheelWarn.value;
    const nodes = [
      txt('v0.6.18 PREBUILT JIT CACHE WHEEL BOUNDARIES', 0, -155, 28, COSMOS.cyan, 'mono').opacity(
        a,
      ),

      glassCell(-440, 40, 740, 230, ROLE.good, { fill: '#0e2824', glow: 8, opacity: a }),
      txt('ADDED IN v0.6.18', -440, -28, 28, ROLE.good, 'mono').opacity(a),
      txt('Rubin architecture paths', -440, 32, 32, COSMOS.ink, 'mono').opacity(a),
      txt('New fleet provider wheel support', -440, 88, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(440, 40, 740, 230, ROLE.warn, { fill: '#261b10', glow: 8, opacity: a }),
      txt('DROPPED FROM PREBUILT WHEELS', 440, -28, 28, ROLE.warn, 'mono').opacity(a),
      txt('SM75 & single-request FA2 cubins', 440, 32, 30, COSMOS.gold, 'mono').opacity(a),
      txt('Triggers first-use JIT compilation', 440, 88, 26, COSMOS.muted, 'sans').opacity(a),
    ];

    if (ww > 0.05) {
      nodes.push(
        glassCell(0, 295, 1620, 118, COSMOS.cyan, { fill: '#0e1c30', glow: 8, opacity: ww * a }),
        txt(
          'Budget first-use compile time and verify which architecture cache wheel is installed',
          0,
          295,
          28,
          COSMOS.cyan,
          'sans',
        ).opacity(ww * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, compView, jitView, wheelView);

  c.on('fi-backend-support-0', () =>
    s.play(compRec.to(0.01, { duration: remainDuration(c, 'fi-backend-support-0', 0.2) })),
  );
  c.on('fi-backend-support-0-result', () =>
    s.play(compRec.to(1, { duration: remainDuration(c, 'fi-backend-support-0-result', 0.4) })),
  );
  c.on('fi-backend-support-1', () => {
    s.play(par(showComp.to(0, { duration: 0.18 }), delay(showJit.to(1, { duration: 0.22 }), 0.2)));
  });
  c.on('fi-backend-support-1-result', () =>
    s.play(customNote.to(1, { duration: remainDuration(c, 'fi-backend-support-1-result', 0.4) })),
  );
  c.on('fi-backend-support-2', () => {
    s.play(
      par(showJit.to(0, { duration: 0.18 }), delay(showWheels.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-backend-support-2-result', () =>
    s.play(wheelWarn.to(1, { duration: remainDuration(c, 'fi-backend-support-2-result', 0.4) })),
  );
}
