// Scene 10: Handle empty mass before subtracting infinities: -Inf sentinel, CUDA boundary, 1e308 pre-normalized merge.
import {
  COSMOS,
  MERGE_HUGE,
  ROLE,
  aura,
  delay,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  par,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function mergeDomain(s, c) {
  const phase = s.value(0);
  const showEmpty = s.value(1);
  const emptyBranch = s.value(0);
  const showReject = s.value(0);
  const cudaWarn = s.value(0);
  const showHuge = s.value(0);
  const halfStep = s.value(0);
  const hugeDone = s.value(0);

  const bgAura = aura(0, 20, 650, '#a78bfa1c', '#6ee7b71a');

  const title = heroTitle(['Handle Empty Mass', 'Before -Inf - (-Inf)'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.violet,
    eyebrow: 'NUMERICAL DOMAIN · SENTINELS & OVERFLOW',
  });

  // View 0: Empty sentinel ([0,0], -Inf) branch guards
  const emptyView = guardedDynamic(showEmpty, (a) => {
    const eb = emptyBranch.value;
    const nodes = [
      txt(
        'EMPTY / FULLY MASKED RANGE SENTINEL:  o = [0, 0],  b = -Inf',
        0,
        -162,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(-555, 25, 490, 210, ROLE.r2, { fill: '#0f2236', glow: 8, opacity: a }),
      txt('LEFT EMPTY', -555, -32, 28, ROLE.r2, 'mono').opacity(a),
      txt('(-Inf) ⊕ (o_B, b_B)', -555, 20, 28, COSMOS.ink, 'mono').opacity(a),
      txt('-> return (o_B, b_B)', -555, 76, 28, ROLE.good, 'mono').opacity(a),

      glassCell(0, 25, 490, 210, ROLE.r2, { fill: '#0f2236', glow: 8, opacity: a }),
      txt('RIGHT EMPTY', 0, -32, 28, ROLE.r2, 'mono').opacity(a),
      txt('(o_A, b_A) ⊕ (-Inf)', 0, 20, 28, COSMOS.ink, 'mono').opacity(a),
      txt('-> return (o_A, b_A)', 0, 76, 28, ROLE.good, 'mono').opacity(a),

      glassCell(555, 25, 490, 210, ROLE.violet, { fill: '#1e1538', glow: 8, opacity: a }),
      txt('BOTH EMPTY', 555, -32, 28, ROLE.violet, 'mono').opacity(a),
      txt('(-Inf) ⊕ (-Inf)', 555, 20, 28, COSMOS.ink, 'mono').opacity(a),
      txt('-> return ([0,0], -Inf)', 555, 76, 28, COSMOS.gold, 'mono').opacity(a),
    ];

    if (eb > 0.05) {
      nodes.push(
        glassCell(0, 290, 1520, 118, ROLE.good, { fill: '#0e2824', glow: 9, opacity: eb * a }),
        txt(
          'GUARD FIRST: Handle empty branches BEFORE m = max(b_A, b_B)',
          0,
          290,
          30,
          ROLE.good,
          'mono',
        )
          .glow(5, ROLE.good)
          .opacity(eb * a),
      );
    }

    return group(...nodes);
  });

  // View 1: Domain rejections vs CUDA direct recurrence
  const rejectView = guardedDynamic(showReject, (a) => {
    const cw = cudaWarn.value;
    const rejects = [
      { x: -615, t: '-Inf - (-Inf)', sub: 'Produces NaN shift' },
      { x: -205, t: 'NaN / +Inf', sub: 'Rejected by CPU ref' },
      { x: 205, t: 'dim mismatch', sub: 'len(o_A) != len(o_B)' },
      { x: 615, t: '[2.0], -Inf', sub: 'Nonzero empty fails' },
    ];
    const nodes = [
      txt('INVALID MERGE STATES REJECTED BY CPU REFERENCE', 0, -155, 28, ROLE.bad, 'mono').opacity(
        a,
      ),
    ];

    rejects.forEach((rj) => {
      nodes.push(
        glassCell(rj.x, 10, 370, 175, ROLE.bad, { fill: '#2b111c', glow: 7, opacity: a }),
        txt(rj.t, rj.x, -20, 30, ROLE.bad, 'mono').opacity(a),
        txt(rj.sub, rj.x, 38, 26, COSMOS.ink, 'sans').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 275, 1600, 134, cw > 0.5 ? COSMOS.gold : ROLE.warn, {
        fill: '#261c10',
        glow: cw > 0.5 ? 10 : 5,
        opacity: a,
      }),
      txt(
        'PINNED CUDA MERGE KERNEL ASSUMES FINITE STATES',
        0,
        248,
        30,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        'Filter or handle empty / masked ranges BEFORE invoking the CUDA finite recurrence',
        0,
        304,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // View 2: Finite 1e308 scale-before-multiply proof
  const hugeView = guardedDynamic(showHuge, (a) => {
    const hs = halfStep.value;
    const hd = hugeDone.value;
    const nodes = [
      txt(
        'OVERFLOW PROTECTION:  o_A = [1e308],  o_B = [1e308],  b_A = b_B = 0',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // Left: naive add first -> Inf
      glassCell(-440, 45, 740, 240, ROLE.bad, { fill: '#2b111c', glow: 8, opacity: a }),
      txt('NAIVE: ADD FIRST, DIVIDE AFTER', -440, -25, 28, ROLE.bad, 'mono').opacity(a),
      txt('(1e308 + 1e308) / 2', -440, 36, 32, COSMOS.ink, 'mono').opacity(a),
      txt('= +Inf / 2 = +Inf  (OVERFLOW!)', -440, 98, 30, ROLE.bad, 'mono').opacity(a),

      // Right: normalize weights first -> exact 1e308
      glassCell(440, 45, 740, 240, hs > 0.5 ? ROLE.good : COSMOS.gold, {
        fill: hs > 0.5 ? '#0e2824' : '#141e36',
        glow: hs > 0.5 ? 11 : 6,
        opacity: a,
      }),
      txt('SAFE: NORMALIZE WEIGHTS FIRST', 440, -25, 28, ROLE.good, 'mono').opacity(a),
      txt(
        hs > 0.5 ? '0.5 × 1e308 + 0.5 × 1e308' : 'Compute w_A/z = 0.5, w_B/z = 0.5',
        440,
        36,
        30,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        hd > 0.5
          ? `5e307 + 5e307 = ${MERGE_HUGE.output[0].toExponential(0)} (EXACT!)`
          : 'Multiply each half, then sum',
        440,
        98,
        30,
        hd > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    if (hd > 0.05) {
      nodes.push(
        txt(
          'Both halves stay inside IEEE-754 float64 range and recover 1e308 without overflow',
          0,
          312,
          28,
          ROLE.good,
          'sans',
        ).opacity(hd * a),
      );
    }

    return group(...nodes);
  });

  const eq = glowTex('\\frac{w_A}{z}\\,o_A + \\frac{w_B}{z}\\,o_B', {
    x: 615,
    y: -360,
    size: 42,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, eq, emptyView, rejectView, hugeView);
  runPhase(s, c, phase, 14);

  c.on('fi-merge-domain-0', () =>
    s.play(emptyBranch.to(0.4, { duration: remainDuration(c, 'fi-merge-domain-0', 0.4) })),
  );
  c.after('fi-merge-domain-0-result', () =>
    s.play(emptyBranch.to(1, { duration: remainAfter(c, 'fi-merge-domain-0-result', 0.35) })),
  );
  c.on('fi-merge-domain-1', () => {
    s.play(
      par(showEmpty.to(0, { duration: 0.18 }), delay(showReject.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.after('fi-merge-domain-1-result', () =>
    s.play(cudaWarn.to(1, { duration: remainAfter(c, 'fi-merge-domain-1-result', 0.35) })),
  );
  c.on('fi-merge-domain-2', () => {
    s.play(
      par(showReject.to(0, { duration: 0.18 }), delay(showHuge.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-merge-domain-half', () =>
    s.play(halfStep.to(1, { duration: remainDuration(c, 'fi-merge-domain-half', 0.4) })),
  );
  c.on('fi-merge-domain-2-result', () =>
    s.play(hugeDone.to(1, { duration: remainDuration(c, 'fi-merge-domain-2-result', 0.4) })),
  );
}
