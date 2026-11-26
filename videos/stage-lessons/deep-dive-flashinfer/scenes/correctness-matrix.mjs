// Scene 23: Cover the paths intended for release: dense parity matrix, atol/rtol (2e-3 + 2e-3 = 4e-3 at ref=1), rejected vs wrong.
import {
  COSMOS,
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

export default function correctnessMatrix(s, c) {
  const phase = s.value(0);
  const showCases = s.value(1);
  const stressOn = s.value(0);
  const showTol = s.value(0);
  const tolCalc = s.value(0);
  const showStatus = s.value(0);
  const bwdNote = s.value(0);

  const bgAura = aura(0, 20, 650, '#6ee7b71a', '#5ce1e61a');

  const title = heroTitle(['Cover the Paths', 'Intended for Release'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'CORRECTNESS MATRIX · TOLERANCES & FALLBACKS',
  });

  // View 0: Reference parity checklist & edge-case coverage
  const casesView = guardedDynamic(showCases, (a) => {
    const st = stressOn.value;
    const rows = [
      {
        cx: -555,
        y: -50,
        h: 'GATHER IN ORDER',
        s: 'Follow listed pages + trim tail',
        col: ROLE.r0,
      },
      {
        cx: 0,
        y: -50,
        h: 'EXACT MASK & SCALE',
        s: 'Bottom-right causal + GQA groups',
        col: ROLE.r2,
      },
      {
        cx: 555,
        y: -50,
        h: 'INCREMENTAL DECODE',
        s: 'Match full-prefix attention',
        col: ROLE.good,
      },
      { cx: -555, y: 150, h: 'SHARED PREFIXES', s: 'Disjoint cascade ranges', col: ROLE.violet },
      {
        cx: 0,
        y: 150,
        h: 'PARTIAL TAILS & SPLITS',
        s: '1..P tail slots + split-KV cuts',
        col: COSMOS.gold,
      },
      { cx: 555, y: 150, h: 'CANCEL & REUSE', s: 'Lease events under churn', col: ROLE.warn },
    ];
    const nodes = [
      txt(
        'BOTH SIDES MUST SEE THE EXACT SAME LOGICAL INPUTS',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    rows.forEach((rw, i) => {
      const lit = i < 3 || st > 0.3;
      nodes.push(
        glassCell(rw.cx, rw.y, 490, 146, lit ? rw.col : COSMOS.dim, {
          fill: lit ? '#0f1c33' : '#0b101d',
          glow: lit ? 8 : 2,
          opacity: a,
        }),
        txt(rw.h, rw.cx, rw.y - 26, 26, lit ? rw.col : COSMOS.dim, 'mono').opacity(a),
        txt(rw.s, rw.cx, rw.y + 28, 26, COSMOS.ink, 'sans').opacity(a),
      );
    });

    nodes.push(
      txt(
        'Test short incremental decode first, then add shared prefixes, splits, tails, and cancellation',
        0,
        325,
        28,
        ROLE.good,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // View 1: Output & LSE tolerance check (atol=0.002, rtol=0.002 -> 0.004 at ref=1)
  const tolView = guardedDynamic(showTol, (a) => {
    const tc = tolCalc.value;
    const nodes = [
      txt(
        'CHECK BOTH OUTPUT (O) AND NORMALIZATION STATISTIC (LSE)',
        0,
        -162,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(-440, 35, 740, 230, ROLE.r2, { fill: '#0f2238', glow: 8, opacity: a }),
      txt('ALLOWED ERROR FORMULA', -440, -34, 28, ROLE.r2, 'mono').opacity(a),
      txt('|actual - ref| <= atol + rtol × |ref|', -440, 26, 28, COSMOS.ink, 'mono').opacity(a),
      txt('Relative term scales with |ref|', -440, 84, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(440, 35, 740, 230, tc > 0.5 ? ROLE.good : COSMOS.gold, {
        fill: tc > 0.5 ? '#0e2824' : '#141e36',
        glow: tc > 0.5 ? 11 : 6,
        opacity: a,
      }),
      txt('FP16 EXAMPLE (ref = 1.0)', 440, -34, 28, COSMOS.gold, 'mono').opacity(a),
      txt('atol = 0.002  ·  rtol = 0.002', 440, 26, 28, COSMOS.ink, 'mono').opacity(a),
      txt(
        tc > 0.5 ? '0.002 + 0.002 × 1 = 0.004 max err' : 'Sum absolute + relative budget',
        440,
        84,
        28,
        tc > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
      ).opacity(a),

      glassCell(0, 295, 1600, 118, ROLE.bad, { fill: '#2c101b', glow: 8, opacity: a }),
      txt(
        'REJECT NaN OR +/-Inf IN EVERY FINITE CASE (BOTH O AND LSE)',
        0,
        295,
        28,
        ROLE.bad,
        'mono',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // View 2: Separate PASS / FAIL / UNSUPPORTED rows + fallbacks + backward test
  const statusView = guardedDynamic(showStatus, (a) => {
    const bn = bwdNote.value;
    const cols = [
      { cx: -555, h: 'PASSED', s: 'Within atol + rtol · finite', col: ROLE.good },
      { cx: 0, h: 'FAILED', s: 'Wrong output or NaN/Inf bug', col: ROLE.bad },
      { cx: 555, h: 'UNSUPPORTED', s: 'Backend cleanly rejected shape', col: ROLE.warn },
    ];
    const nodes = [
      txt(
        'KEEP UNSUPPORTED SHAPES SEPARATE FROM WRONG OUTPUTS',
        0,
        -155,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    cols.forEach((cl) => {
      nodes.push(
        glassCell(cl.cx, 25, 490, 200, cl.col, { fill: '#0e172a', glow: 8, opacity: a }),
        txt(cl.h, cl.cx, -20, 34, cl.col, 'mono').glow(5, cl.col).opacity(a),
        txt(cl.s, cl.cx, 44, 26, COSMOS.ink, 'sans').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 275, 1620, 144, bn > 0.5 ? ROLE.violet : ROLE.r2, {
        fill: '#121a32',
        glow: 8,
        opacity: a,
      }),
      txt(
        'Cover: int32 ptrs/device · GQA/MLA · mask · quant packing · every fallback',
        0,
        248,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt(
        bn > 0.5
          ? 'Training requires a separate backward gradient verification test'
          : 'Never ship an untested fallback path',
        0,
        304,
        28,
        bn > 0.5 ? ROLE.violet : COSMOS.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const tolEq = glowTex('\\mathrm{tol} = 0.002 + 0.002\\,|\\mathrm{ref}|', {
    x: 600,
    y: -360,
    size: 36,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, tolEq, casesView, tolView, statusView);
  runPhase(s, c, phase, 14);

  c.on('fi-correctness-matrix-0', () =>
    s.play(stressOn.to(0.2, { duration: remainDuration(c, 'fi-correctness-matrix-0', 0.35) })),
  );
  c.after('fi-correctness-matrix-0-result', () =>
    s.play(stressOn.to(1, { duration: remainAfter(c, 'fi-correctness-matrix-0-result', 0.35) })),
  );
  c.on('fi-correctness-matrix-1', () => {
    s.play(par(showCases.to(0, { duration: 0.18 }), delay(showTol.to(1, { duration: 0.22 }), 0.2)));
  });
  c.after('fi-correctness-matrix-1-result', () =>
    s.play(tolCalc.to(1, { duration: remainAfter(c, 'fi-correctness-matrix-1-result', 0.35) })),
  );
  c.on('fi-correctness-matrix-2', () => {
    s.play(
      par(showTol.to(0, { duration: 0.18 }), delay(showStatus.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-correctness-matrix-2-result', () =>
    s.play(bwdNote.to(1, { duration: remainDuration(c, 'fi-correctness-matrix-2-result', 0.4) })),
  );
}
