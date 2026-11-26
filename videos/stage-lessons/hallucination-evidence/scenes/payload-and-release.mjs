// Scene 16: Would you release this gate? (Grade delivered payload, silent policy trap, 4 boolean release checks)
import {
  COSMOS,
  aura,
  candidateReview,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  relabeledReview,
  releaseEvidence,
  remainDuration,
  runPhase,
  silentReview,
  txt,
} from '../parts.mjs';

export default function payloadAndRelease(s, c) {
  const phase = s.value(0);
  const showLogTrap = s.value(0);
  const showSilent = s.value(0);
  const showCand = s.value(0);
  const showRelease = s.value(0);
  const showHold = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['Would You Release', 'This Gate?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'PAYLOAD GRADING & RELEASE CHECKLIST · HOLD WITHOUT HOLDOUT & OWNER',
  });

  const canShip = releaseEvidence({
    regressions: true,
    versions: true,
    holdout: false,
    owner: false,
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sl = showLogTrap.value;
    const ss = showSilent.value;
    const sc = showCand.value;
    const sr = showRelease.value;
    const sh = showHold.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const checks = [
      { name: '1. Known failures fixed + clean kept', ok: true },
      { name: '2. Admitted snapshot versions logged', ok: true },
      { name: '3. Independent held-out eval + grader audit', ok: false },
      { name: '4. On-call alert owner assigned', ok: false },
    ];

    const nodes = [
      // Left: Grade delivered payload (NOT route label!)
      txt('GRADE WHAT REACHED THE READER', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-455, -108, 800, 118, sl > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#28111a',
        glow: sl > 0.3 ? 8 * pulse : 3,
      }),
      txt('RELABELED LOG ("shorten", LEAKS 14:30)', -825, -134, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        `Served: ${relabeledReview.served}/4   |   Unsafe: ${relabeledReview.unsafe}/4 (STILL FAILS!)`,
        -825,
        -88,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(-455, 42, 800, 118, ss > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: ss > 0.3 ? 8 : 2,
      }),
      txt('SILENT POLICY (WITHHOLD ALL 4)', -825, 16, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        `Served: ${silentReview.served}/4   |   Unsafe rate: null (0 utility!)`,
        -825,
        62,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(-455, 198, 800, 134, sc > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sc > 0.3 ? 9 * pulse : 2,
      }),
      txt('REAL CANDIDATE GATE (4 DEV CASES)', -825, 166, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        `Clean kept: 1/1  |  Served: ${candidateReview.served}/4  |  Unsafe: ${candidateReview.unsafe}/2`,
        -825,
        208,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Dev suite tests known bugs, not production traffic rate',
        -825,
        244,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: 4 boolean release requirements -> HOLD!
      txt('RELEASE EVIDENCE CHECKLIST', 110, -205, 26, COSMOS.gold, 'mono', 'left'),
    ];

    checks.forEach((chk, i) => {
      const y = -114 + i * 94;
      const col = chk.ok ? COSMOS.emerald : sh > 0.3 ? COSMOS.rose : COSMOS.amber;
      nodes.push(
        glassCell(495, y, 760, 76, col, {
          fill: chk.ok ? '#0e2624' : '#28111a',
          glow: !chk.ok && sh > 0.3 ? 9 * pulse : 2,
        }),
        txt(chk.name, 140, y + 2, 26, COSMOS.ink, 'sans', 'left'),
        txt(chk.ok ? 'TRUE' : 'FALSE', 845, y + 2, 26, col, 'mono', 'right'),
      );
    });

    nodes.push(
      glassCell(495, 244, 760, 96, sh > 0.3 ? COSMOS.rose : COSMOS.gold, {
        fill: sh > 0.3 ? '#2b1019' : '#181e34',
        glow: sh > 0.3 ? 11 * pulse : 3,
      }),
      txt(
        sr > 0.3 || sh > 0.3
          ? `DECISION: ${canShip ? 'SHIP' : 'HOLD RELEASE!'} (strict bools)`
          : 'DECISION: SHIP or HOLD?  ?',
        495,
        246,
        26,
        sh > 0.3 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),

      glowDot(-840, 358, { radius: 6, color: sh > 0.3 ? COSMOS.rose : COSMOS.gold }),
      txt(
        sh > 0.3
          ? 'Missing keys or string "false" fail strict boolean checks -> hold release until holdout & owner exist'
          : 'Always grade the exact text delivered to readers, not the internal route name',
        -812,
        360,
        28,
        sh > 0.3 ? COSMOS.rose : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('log-shorten', () => s.play(showLogTrap.to(0.5, { duration: 0.35 })));
  c.on('payload-and-release-b1', () => s.play(showLogTrap.to(1, { duration: 0.4 })));
  c.on('silent-policy', () => s.play(showSilent.to(1, { duration: 0.4 })));
  c.on('payload-and-release-b2', () => s.play(showCand.to(1, { duration: 0.45 })));
  c.on('payload-and-release-b3', () => s.play(showRelease.to(1, { duration: 0.45 })));
  c.on('missing-records', () => s.play(showHold.to(0.6, { duration: 0.4 })));
  c.on('release-missing-evidence', () =>
    s.play(showHold.to(1, { duration: remainDuration(c, 'release-missing-evidence', 0.45) })),
  );
}
