// Scene 15: Which answers count as unsafe? (4-request gate suite: 3/4 baseline unsafe vs 0/2 served unsafe)
import {
  COSMOS,
  GATE_SCORE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function scoreTheGate(s, c) {
  const phase = s.value(0);
  const showBase = s.value(0);
  const showCand = s.value(0);
  const showCount = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['Which Answers Count', 'as Unsafe?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'GATE EVALUATION · REQUEST-LEVEL UNSAFE-SERVE RATE vs COVERAGE',
  });

  const rows = [
    {
      name: '1. clean_update',
      claims: '3/3 supported',
      base: 'SAFE',
      gate: 'SERVE (SAFE)',
      col: COSMOS.emerald,
    },
    {
      name: '2. invented_eta',
      claims: '3/4 + 1 bad ETA',
      base: 'UNSAFE!',
      gate: 'SHORTEN (SAFE)',
      col: COSMOS.emerald,
    },
    {
      name: '3. wrong_status',
      claims: '0/1 contradicted',
      base: 'UNSAFE!',
      gate: 'WITHHOLD',
      col: COSMOS.amber,
    },
    {
      name: '4. unadmitted_src',
      claims: '0/1 missing src',
      base: 'UNSAFE!',
      gate: 'WITHHOLD',
      col: COSMOS.amber,
    },
  ];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sb = showBase.value;
    const sc = showCand.value;
    const sCnt = showCount.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const revealed = sCnt > 0.4;

    const nodes = [
      txt(
        '4 TEST REQUESTS (1 FAILED CLAIM SPOILS A RESPONSE)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('METRIC DENOMINATORS', 170, -205, 26, COSMOS.gold, 'mono', 'left'),
    ];

    rows.forEach((row, i) => {
      const y = -114 + i * 112;
      const showGate = sc > 0.3;
      const col = showGate ? row.col : row.base === 'SAFE' ? COSMOS.emerald : COSMOS.rose;
      nodes.push(
        glassCell(-395, y, 910, 88, col, {
          fill: !showGate && row.base !== 'SAFE' ? '#28111a' : '#10182d',
          glow: showGate ? 7 : 3,
        }),
        txt(row.name, -825, y - 16, 26, COSMOS.ink, 'mono', 'left'),
        txt(row.claims, -825, y + 18, 26, COSMOS.muted, 'sans', 'left'),
        txt(showGate ? row.gate : `Baseline: ${row.base}`, 30, y + 2, 26, col, 'mono', 'right'),
      );
    });

    // Right: Baseline vs Candidate metrics (strictly withhold denominator until sCnt!)
    nodes.push(
      glassCell(515, -96, 700, 134, sb > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#28111a',
        glow: sb > 0.3 ? 8 : 2,
      }),
      txt('BASELINE (SEND ALL 4)', 195, -130, 26, COSMOS.rose, 'mono', 'left'),
      txt('Claims supported: 6 / 9  (67%)', 195, -86, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        `Unsafe readers:   ${GATE_SCORE.baselineUnsafe} / ${GATE_SCORE.total}  (75%!)`,
        195,
        -48,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),

      glassCell(515, 76, 700, 146, revealed ? COSMOS.emerald : COSMOS.gold, {
        fill: revealed ? '#0e2824' : '#181e34',
        glow: revealed ? 10 * pulse : 4,
      }),
      txt(
        'EVIDENCE GATE (CANDIDATE)',
        195,
        36,
        26,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        revealed
          ? `Unsafe-serve rate: ${GATE_SCORE.unsafe} / ${GATE_SCORE.served} = 0.0%`
          : 'Unsafe-serve denominator = ?',
        195,
        82,
        28,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        revealed
          ? `Response coverage: ${GATE_SCORE.served} / ${GATE_SCORE.total} = 50%`
          : 'Count only answers that reached a reader',
        195,
        122,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(515, 240, 700, 108, COSMOS.muted, { fill: '#10182d', glow: 2 }),
      txt('IF ALL 4 ARE WITHHELD (0 SERVED):', 195, 218, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        'Coverage = 0%, unsafe-serve rate = undefined!',
        195,
        258,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: revealed ? COSMOS.emerald : COSMOS.gold }),
      txt(
        revealed
          ? 'Denominator for unsafe-serve rate is served answers (2); denominator for coverage is all requests (4)'
          : sc > 0.3
            ? 'How many answers belong in the denominator of the unsafe-serve rate?'
            : 'Claim-level accuracy hides request-level harm: 1 bad claim spoils the whole update',
        -812,
        360,
        28,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('baseline-answers', () => s.play(showBase.to(1, { duration: 0.45 })));
  c.on('candidate-answers', () => s.play(showCand.to(1, { duration: 0.45 })));
  c.after('candidate-count', () =>
    s.play(showCount.to(1, { duration: remainDuration(c, 'candidate-count', 0.45) })),
  );
}
