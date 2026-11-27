// Scene 27: Choose composable operators with explicit responsibilities: strengths, engine obligations, hardware/training limits.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  par,
  remainAfter,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function featureLimits(s, c) {
  const showComp = s.value(1);
  const compPayoff = s.value(0);
  const showCost = s.value(0);
  const matrixWarn = s.value(0);
  const showScope = s.value(0);
  const trainNote = s.value(0);

  const bgAura = aura(0, 20, 650, '#6ee7b71a', '#a78bfa1a');

  const title = heroTitle(['Composable Operators,', 'Explicit Ownership'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'STRENGTHS, COSTS & SYSTEM BOUNDARIES',
  });

  // View 0: Composability strength
  const compView = guardedDynamic(showComp, (a) => {
    const cp = compPayoff.value;
    const pillars = [
      { cx: -555, h: 'EXPOSE ENGINE STATE', s: 'Ragged rows, paged KV, splits', col: ROLE.r0 },
      { cx: 0, h: 'CHOOSE OPERATORS', s: 'Mature vendor or custom JIT', col: ROLE.r2 },
      { cx: 555, h: 'ONE VOCABULARY', s: 'Prefill, decode, MoE, sampling', col: ROLE.good },
    ];
    const nodes = [
      txt('WHY SERVING ENGINES ADOPT FLASHINFER', 0, -155, 28, ROLE.good, 'mono').opacity(a),
    ];

    pillars.forEach((pl) => {
      nodes.push(
        glassCell(pl.cx, 35, 490, 225, pl.col, { fill: '#0e1a2f', glow: 8, opacity: a }),
        txt(pl.h, pl.cx, -25, 26, pl.col, 'mono').opacity(a),
        txt(pl.s, pl.cx, 38, 26, COSMOS.ink, 'sans').opacity(a),
      );
    });

    if (cp > 0.05) {
      nodes.push(
        glassCell(0, 290, 1620, 120, ROLE.good, { fill: '#0e2824', glow: 9, opacity: cp * a }),
        txt(
          'Avoids repeated layout conversions while keeping every operator choice explicit',
          0,
          290,
          28,
          ROLE.good,
          'sans',
        ).opacity(cp * a),
      );
    }

    return group(...nodes);
  });

  // View 1: Integration costs moved upward to the serving engine (spacious 2x2 grid)
  const costView = guardedDynamic(showCost, (a) => {
    const mw = matrixWarn.value;
    const costs = [
      {
        cx: -435,
        cy: -38,
        h: 'PAGE LIFECYCLE',
        s: 'Page list, tail len & release event',
        col: ROLE.r2,
      },
      {
        cx: 435,
        cy: -38,
        h: 'GRAPH REPLAY',
        s: 'Compatible workspace & CTA grid',
        col: COSMOS.gold,
      },
      {
        cx: -435,
        cy: 122,
        h: 'JIT TOOLCHAIN',
        s: 'Compiler & module cache pinning',
        col: ROLE.warn,
      },
      { cx: 435, cy: 122, h: 'TEST MATRIX', s: 'Backends × layouts × masks × GPUs', col: ROLE.bad },
    ];
    const nodes = [
      txt(
        'KEEPING ENGINE LAYOUT SAVES COPIES, BUT MOVES METADATA COMPLEXITY UPWARD',
        0,
        -162,
        26,
        ROLE.warn,
        'mono',
      ).opacity(a),
    ];

    costs.forEach((cs, i) => {
      nodes.push(
        glassCell(cs.cx, cs.cy, 760, 128, cs.col, {
          fill: i === 3 && mw > 0.5 ? '#2c101b' : '#0e172a',
          glow: i === 3 && mw > 0.5 ? 11 : 7,
          opacity: a,
        }),
        txt(cs.h, cs.cx, cs.cy - 26, 26, cs.col, 'mono').opacity(a),
        txt(cs.s, cs.cx, cs.cy + 26, 26, COSMOS.ink, 'sans').opacity(a),
      );
    });

    if (mw > 0.05) {
      nodes.push(
        glassCell(0, 295, 1620, 118, ROLE.bad, { fill: '#2c101b', glow: 9, opacity: mw * a }),
        txt(
          'Test every backend across the exact layouts, masks, head groups, and GPUs you serve',
          0,
          295,
          28,
          ROLE.bad,
          'sans',
        ).opacity(mw * a),
      );
    }

    return group(...nodes);
  });

  // View 2: Hardware portability & training-stack boundary
  const scopeView = guardedDynamic(showScope, (a) => {
    const tn = trainNote.value;
    const nodes = [
      txt('HARDWARE & WORKLOAD BOUNDARIES', 0, -155, 28, COSMOS.violet, 'mono').opacity(a),

      glassCell(-555, 35, 490, 235, ROLE.r0, { fill: '#10213d', glow: 7, opacity: a }),
      txt('CPU REFERENCE', -555, -30, 28, ROLE.r0, 'mono').opacity(a),
      txt('Verifies exact arithmetic', -555, 30, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Not a serving runtime', -555, 86, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(0, 35, 490, 235, ROLE.warn, { fill: '#261b10', glow: 8, opacity: a }),
      txt('NVIDIA CUDA NATIVE', 0, -30, 28, ROLE.warn, 'mono').opacity(a),
      txt('Compatible NVIDIA GPUs only', 0, 30, 28, COSMOS.ink, 'sans').opacity(a),
      txt('AMD / Apple need another stack', 0, 86, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(555, 35, 490, 235, tn > 0.5 ? ROLE.violet : COSMOS.dim, {
        fill: tn > 0.5 ? '#1f143a' : '#0d1528',
        glow: tn > 0.5 ? 10 : 4,
        opacity: a,
      }),
      txt('NOT A TRAINING STACK', 555, -30, 28, ROLE.violet, 'mono').opacity(a),
      txt('Verify backward separately', 555, 30, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Framework owns weights & ckpts', 555, 86, 26, COSMOS.muted, 'sans').opacity(a),

      txt(
        'FlashInfer excels as a composable NVIDIA inference kernel library inside a disciplined engine',
        0,
        305,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, compView, costView, scopeView);

  c.on('fi-feature-limits-0', () =>
    s.play(compPayoff.to(0.01, { duration: remainDuration(c, 'fi-feature-limits-0', 0.2) })),
  );
  c.on('fi-feature-limits-0-result', () =>
    s.play(compPayoff.to(1, { duration: remainDuration(c, 'fi-feature-limits-0-result', 0.4) })),
  );
  c.on('fi-feature-limits-1', () => {
    s.play(par(showComp.to(0, { duration: 0.18 }), delay(showCost.to(1, { duration: 0.22 }), 0.2)));
  });
  c.on('fi-feature-limits-1-result', () =>
    s.play(matrixWarn.to(1, { duration: remainDuration(c, 'fi-feature-limits-1-result', 0.4) })),
  );
  c.on('fi-feature-limits-2', () => {
    s.play(
      par(showCost.to(0, { duration: 0.18 }), delay(showScope.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.after('fi-feature-limits-2-result', () =>
    s.play(trainNote.to(1, { duration: remainAfter(c, 'fi-feature-limits-2-result', 0.35) })),
  );
}
