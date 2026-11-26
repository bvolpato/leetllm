// Scene 11: Partition keys, not just worker labels: overlap double-counts k0 ([0.5,0.5] -> [2/3,1/3]) + 168 split checks.
import {
  COSMOS,
  MERGE_OVERLAP,
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
  runPhase,
  txt,
} from '../parts.mjs';

export default function mergePartition(s, c) {
  const phase = s.value(0);
  const showDup = s.value(1);
  const dupActive = s.value(0);
  const dupVerdict = s.value(0);
  const showRule = s.value(0);
  const assocReady = s.value(0);
  const showSweep = s.value(0);
  const sweepPass = s.value(0);

  const bgAura = aura(0, 20, 650, '#ff6b8b1a', '#5ce1e61a');

  const title = heroTitle(['Partition Keys,', 'Not Worker Labels'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.bad,
    eyebrow: 'DISJOINT KEY RANGES · CASCADE PREFIX SHARING',
  });

  // View 0: Disjoint [k0, k1] -> [0.5, 0.5] vs duplicate k0 -> [2/3, 1/3]
  const dupView = guardedDynamic(showDup, (a) => {
    const dup = dupActive.value > 0.5;
    const verd = dupVerdict.value;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt(
        'EQUAL-LOGIT KEYS:  k0 -> v=[1,0] · k1 -> v=[0,1]',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // Full state box on left
      glassCell(-530, 10, 490, 175, ROLE.r0, { fill: '#10213d', glow: 8, opacity: a }),
      txt('STATE 1: {k0, k1}', -530, -32, 28, ROLE.r0, 'mono').opacity(a),
      txt('mass = 2 · o = [1/2, 1/2]', -530, 24, 30, COSMOS.ink, 'mono').opacity(a),
    ];

    if (dup) {
      nodes.push(
        glassCell(-530, 220, 490, 140, ROLE.bad, { fill: '#30101d', glow: 11 * pulse, opacity: a }),
        txt('OVERLAPPING STATE 2: {k0}', -530, 192, 26, ROLE.bad, 'mono').opacity(a),
        txt('mass = 1 · k0 counted TWICE!', -530, 242, 28, COSMOS.gold, 'mono').opacity(a),
        glowingArc([-280, 10], [85, 95], -20, { color: ROLE.r0, width: 3.5, opacity: 0.88 * a }),
        glowingArc([-280, 220], [85, 95], 20, { color: ROLE.bad, width: 3.8, opacity: 0.92 * a }),
      );
    } else {
      nodes.push(
        glowingArc([-280, 10], [85, 95], 0, { color: ROLE.good, width: 3.5, opacity: 0.88 * a }),
      );
    }

    const outStr = dup
      ? `o = [${MERGE_OVERLAP.output[0].toFixed(4)}, ${MERGE_OVERLAP.output[1].toFixed(4)}] = [2/3, 1/3]`
      : 'o = [0.5000, 0.5000] = [1/2, 1/2]';
    const numStr = dup ? 'numerator [2, 1] / mass 3' : 'numerator [1, 1] / mass 2';

    nodes.push(
      glassCell(440, 95, 700, 240, dup ? ROLE.bad : ROLE.good, {
        fill: dup ? '#2c101c' : '#0f2824',
        glow: dup ? 11 * pulse : 8,
        opacity: a,
      }),
      txt(
        dup ? 'CORRUPTED MERGE OUTPUT' : 'DISJOINT OUTPUT',
        440,
        18,
        28,
        dup ? ROLE.bad : ROLE.good,
        'mono',
      ).opacity(a),
      txt(numStr, 440, 76, 28, COSMOS.gold, 'mono').opacity(a),
      txt(outStr, 440, 134, 30, COSMOS.ink, 'mono').opacity(a),
    );

    if (verd > 0.05) {
      nodes.push(
        txt(
          'Output stays finite (no NaN, no crash), yet answers a different attention problem!',
          0,
          365,
          28,
          ROLE.bad,
          'sans',
        ).opacity(verd * a),
      );
    }

    return group(...nodes);
  });

  // View 1: Prefix sharing across requests vs disjointness within one request + associativity
  const ruleView = guardedDynamic(showRule, (a) => {
    const ar = assocReady.value;
    const nodes = [
      txt(
        'DISJOINTNESS & INVARIANTS FOR VALID STATE MERGE',
        0,
        -155,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      glassCell(-440, 25, 740, 225, ROLE.good, { fill: '#0f2724', glow: 8, opacity: a }),
      txt('ACROSS REQUESTS: SHARE PREFIX PAGES', -440, -40, 26, ROLE.good, 'mono').opacity(a),
      txt('R0 & R2 point to same physical prefix', -440, 18, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Each request counts its prefix ONCE', -440, 72, 28, COSMOS.gold, 'mono').opacity(a),

      glassCell(440, 25, 740, 225, ROLE.warn, { fill: '#261c10', glow: 8, opacity: a }),
      txt('WITHIN ONE REQUEST: MUST MATCH', 440, -40, 26, ROLE.warn, 'mono').opacity(a),
      txt('Same query row, head, mask, scale', 440, 18, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Disjoint logical key indices only', 440, 72, 28, COSMOS.gold, 'mono').opacity(a),
    ];

    if (ar > 0.05) {
      nodes.push(
        glassCell(0, 290, 1620, 122, ROLE.r2, { fill: '#102238', glow: 8, opacity: ar * a }),
        txt(
          'EXACT ARITHMETIC: ASSOCIATIVE  (A ⊕ B) ⊕ C = A ⊕ (B ⊕ C)',
          0,
          264,
          28,
          ROLE.r2,
          'mono',
        ).opacity(ar * a),
        txt(
          'Floating-point reduction order can still shift low bits',
          0,
          316,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(ar * a),
      );
    }

    return group(...nodes);
  });

  // View 2: 168 exhaustive split-vs-direct verification sweep
  const sweepView = guardedDynamic(showSweep, (a) => {
    const sp = sweepPass.value;
    const lengths = [1, 2, 6, 9, 33];
    const offsets = ['-1000', '0', '+1000'];

    const nodes = [
      txt(
        'EXHAUSTIVE CPU REFERENCE SWEEP: SPLIT MERGE VS DIRECT SOFTMAX',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
      txt(
        'LENGTHS: 1, 2, 6, 9, 33  (cuts = len + 1, incl. empty edges)',
        -420,
        -78,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    lengths.forEach((len, idx) => {
      const cx = -680 + idx * 170;
      nodes.push(
        glassCell(cx, 18, 148, 110, ROLE.r2, { fill: '#102438', glow: 6, opacity: a }),
        txt(`L=${len}`, cx, -4, 30, COSMOS.ink, 'mono').opacity(a),
        txt(`${len + 1} cuts`, cx, 38, 26, COSMOS.gold, 'mono').opacity(a),
      );
    });

    nodes.push(txt('LOGIT OFFSETS (×3)', 520, -78, 26, COSMOS.muted, 'mono').opacity(a));
    offsets.forEach((off, idx) => {
      const cx = 310 + idx * 210;
      nodes.push(
        glassCell(cx, 18, 184, 110, ROLE.violet, { fill: '#1d1438', glow: 6, opacity: a }),
        txt(off, cx, 18, 30, ROLE.violet, 'mono').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 248, 1520, 150, sp > 0.5 ? ROLE.good : COSMOS.gold, {
        fill: sp > 0.5 ? '#0e2b25' : '#141d34',
        glow: sp > 0.5 ? 11 : 6,
        opacity: a,
      }),
      txt(
        '(2 + 3 + 7 + 10 + 34) cuts × 3 offsets = 168 comparisons',
        0,
        218,
        30,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        sp > 0.5 ? 'ALL 168 / 168 PASSED WITHIN TOLERANCE' : 'Checking every split point...',
        0,
        278,
        34,
        sp > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
      )
        .glow(6, sp > 0.5 ? ROLE.good : COSMOS.gold)
        .opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, dupView, ruleView, sweepView);
  runPhase(s, c, phase, 14);

  c.on('fi-merge-partition-0', () =>
    s.play(dupActive.to(0.1, { duration: remainDuration(c, 'fi-merge-partition-0', 0.3) })),
  );
  c.on('fi-merge-partition-duplicate', () =>
    s.play(dupActive.to(1, { duration: remainDuration(c, 'fi-merge-partition-duplicate', 0.4) })),
  );
  c.on('fi-merge-partition-0-result', () =>
    s.play(dupVerdict.to(1, { duration: remainDuration(c, 'fi-merge-partition-0-result', 0.4) })),
  );
  c.on('fi-merge-partition-1', () => {
    s.play(par(showDup.to(0, { duration: 0.18 }), delay(showRule.to(1, { duration: 0.22 }), 0.2)));
  });
  c.on('fi-merge-partition-1-result', () =>
    s.play(assocReady.to(1, { duration: remainDuration(c, 'fi-merge-partition-1-result', 0.4) })),
  );
  c.on('fi-merge-partition-2', () => {
    s.play(
      par(showRule.to(0, { duration: 0.18 }), delay(showSweep.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-merge-partition-2-result', () =>
    s.play(sweepPass.to(1, { duration: remainDuration(c, 'fi-merge-partition-2-result', 0.4) })),
  );
}
