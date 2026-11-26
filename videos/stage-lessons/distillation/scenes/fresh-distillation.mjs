// Scene 18: Which student can serve these requests? (Fresh prefix step + Alder vs Birch release gate + key callback)
import {
  COSMOS,
  FRESH_AFTER,
  FRESH_BEFORE,
  FRESH_LOGITS,
  FRESH_Q,
  FRESH_WORDS,
  POLICY_CASES,
  POLICY_REPLIES,
  POLICY_STUDENT,
  POLICY_TEACHER,
  RELEASE_EVAL,
  RELEASE_LIMITS,
  aura,
  circle,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  keyEmblem,
  line,
  rect,
  remainAfterDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshDistillation(s, c) {
  const phase = s.value(0);
  const stageMode = s.value(0); // 0=fresh prefix (b0-b1), 1=release reports (b2-b4), 2=opening callback (b5)
  const sTarget = s.value(0);
  const sGarden = s.value(0);
  const sLogits = s.value(0);
  const sProb = s.value(0);
  const sErrors = s.value(0);
  const sRelease = s.value(0);

  const bgAura = aura(0, 30, 620, '#13355c26', '#2e1c5214');
  const title = heroTitle(['Which Student Can Serve', 'These Requests?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'FRESH ON-POLICY UPDATE · MULTI-METRIC RELEASE GATE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const mode = Math.round(stageMode.value);

    if (mode === 0) {
      // Beats 0 & 1: Fresh prefix ending in "beside", lr=0.6, T=1
      const tg = sTarget.value;
      const gd = sGarden.value > 0.5;
      const lg = sLogits.value > 0.5;
      const pr = sProb.value;
      const baseY = 178;
      const scale = 420;

      const nodes = [
        txt(
          'VISITED PREFIX ENDS IN "beside"   ·   T = 1   ·   lr = 0.6',
          -855,
          -206,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        line([-680, baseY], [680, baseY], { stroke: COSMOS.rule, width: 2.2 }),
      ];

      FRESH_WORDS.forEach((word, i) => {
        const cx = -440 + i * 440;
        const pVal = FRESH_BEFORE[i] + (FRESH_AFTER[i] - FRESH_BEFORE[i]) * pr;
        const barH = Math.max(16, pVal * scale);
        const isGarden = i === 1;
        const col = isGarden && gd ? COSMOS.emerald : COSMOS.cyan;

        nodes.push(
          txt(word, cx, -138, 36, isGarden && gd ? COSMOS.gold : COSMOS.ink, 'mono'),
          rect(180, barH, {
            fill: isGarden && gd ? '#103b33' : '#0e3a4f',
            stroke: col,
            width: 2.6,
            radius: 8,
          })
            .at(cx, baseY - barH * 0.5)
            .glow(isGarden && gd ? 9 * pulse : 4, col),
          txt(pr > 0.5 ? FRESH_AFTER[i].toFixed(3) : '1/3', cx, baseY - 30, 28, COSMOS.ink, 'mono'),
        );

        if (tg > 0.08) {
          const tickY = baseY - FRESH_Q[i] * scale;
          nodes.push(
            line([cx - 110, tickY], [cx + 110, tickY], { stroke: COSMOS.blue, width: 6 })
              .glow(7, COSMOS.blue)
              .opacity(tg),
            txt(
              `q = ${FRESH_Q[i].toFixed(2)}`,
              cx + 124,
              tickY,
              26,
              COSMOS.blue,
              'mono',
              'left',
            ).opacity(tg),
          );
        }

        const zLabel = lg
          ? `${FRESH_LOGITS[i] >= 0 ? '+' : ''}${FRESH_LOGITS[i].toFixed(2)}`
          : '0.00';
        nodes.push(
          txt(`logit  ${zLabel}`, cx, baseY + 46, 30, lg ? COSMOS.gold : COSMOS.muted, 'mono'),
        );
      });

      const prompt =
        pr > 0.5
          ? 'After softmax: [0.307, 0.367, 0.326]  (garden rises to ~37%)'
          : lg
            ? 'Garden: 0.6 x (0.50 - 1/3) = +0.10  ->  logits [-0.08, +0.10, -0.02]'
            : gd
              ? 'Garden has the largest positive teacher gap (0.50 vs 0.333)'
              : 'With T = 1 and lr = 0.6, which word score rises most?';

      nodes.push(
        glassCell(0, 326, 1580, 88, pr > 0.5 ? COSMOS.emerald : COSMOS.gold, {
          fill: pr > 0.5 ? '#0f2c27' : '#201b0d',
          dash: !gd ? [8, 6] : undefined,
          glow: 7 * pulse,
        }),
        txt(prompt, 0, 328, 28, pr > 0.5 ? COSMOS.emerald : COSMOS.gold, 'mono'),
      );
      return group(...nodes);
    }

    if (mode === 1) {
      // Beats 2, 3 & 4: Alder vs Birch deployment release scorecard + 100-case policy dot matrix
      const showErr = sErrors.value > 0.5;
      const showVer = sRelease.value > 0.5;
      const common = RELEASE_EVAL[0];

      const metrics = [
        {
          k: 'CHECKED ACCURACY',
          v: `${Math.round(common.accuracy * 100)}%`,
          req: `>= ${RELEASE_LIMITS.accuracy * 100}%`,
        },
        { k: 'LATENCY', v: `${common.latency} ms`, req: `<= ${RELEASE_LIMITS.latency} ms` },
        {
          k: 'MONTHLY COST',
          v: `$${common.monthlyCost.toLocaleString('en-US')}`,
          req: `<= $${RELEASE_LIMITS.monthlyCost.toLocaleString('en-US')}`,
        },
      ];

      const nodes = [
        txt(
          'SHARED PASSING MEASUREMENTS (ALDER & BIRCH)',
          -855,
          -208,
          26,
          COSMOS.emerald,
          'mono',
          'left',
        ),
      ];

      metrics.forEach(({ k, v, req }, i) => {
        const cx = -570 + i * 570;
        nodes.push(
          glassCell(cx, -124, 510, 96, COSMOS.emerald, { fill: '#0f2824', glow: 4 }),
          txt(k, cx, -150, 26, COSMOS.muted, 'mono'),
          txt(`${v}   (pass ${req})`, cx, -104, 28, COSMOS.emerald, 'mono'),
        );
      });

      nodes.push(
        txt(
          `POLICY SLICE REQUIREMENT:  AT MOST ${RELEASE_LIMITS.policy * 100} ERROR / 100 HELD-OUT CASES`,
          -855,
          -34,
          28,
          COSMOS.gold,
          'mono',
          'left',
        ),
      );

      RELEASE_EVAL.forEach((cand, i) => {
        const gx = -440 + i * 880;
        const borderCol = !showVer ? COSMOS.rule : cand.passAll ? COSMOS.emerald : COSMOS.rose;
        nodes.push(
          glassCell(gx, 140, 810, 286, borderCol, {
            fill: showVer && cand.passAll ? '#0f2b25' : showVer ? '#28121c' : '#10182b',
            glow: showVer ? 9 * pulse : 2,
          }),
          txt(cand.name.toUpperCase(), gx - 355, 32, 34, COSMOS.ink, 'mono', 'left'),
          txt(
            showErr ? `${cand.errors} / ${cand.policyCases} errors` : '100 held-out cases',
            gx + 355,
            32,
            30,
            showErr ? (cand.passAll ? COSMOS.emerald : COSMOS.rose) : COSMOS.muted,
            'mono',
            'right',
          ),
        );

        // 100-dot grid (20 columns x 5 rows)
        for (let j = 0; j < cand.policyCases; j++) {
          const isErr = showErr && j < cand.errors;
          const dx = gx - 332 + (j % 20) * 35;
          const dy = 86 + Math.floor(j / 20) * 28;
          nodes.push(
            circle(isErr ? 10 : 5.5, {
              fill: isErr ? COSMOS.rose : '#2b3959',
              stroke: isErr ? COSMOS.rose : null,
            })
              .at(dx, dy)
              .glow(isErr ? 8 : 0, COSMOS.rose),
          );
        }

        nodes.push(
          txt(
            showVer
              ? cand.passAll
                ? 'CLEARS ALL FOUR -> SHIP'
                : 'EXCEEDS LIMIT (3 > 1) -> HOLD'
              : showErr
                ? 'Passes all four requirements?'
                : 'Awaiting policy slice check...',
            gx,
            246,
            28,
            showVer ? (cand.passAll ? COSMOS.emerald : COSMOS.rose) : COSMOS.gold,
            'mono',
          ),
        );
      });

      nodes.push(
        txt(
          showVer
            ? 'Only Birch ships · investigate Alder on separate dev policy exceptions, keeping holdout clean'
            : 'Which candidate clears all four release requirements?',
          0,
          354,
          28,
          showVer ? COSMOS.emerald : COSMOS.gold,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Beat 5: Full-circle callback to Opening Expired Admin Key + Release Verdict
    const sqSize = 48;
    const sqStep = 58;
    const gridLeft = -335;
    const nodes = [
      keyEmblem(-670, -70, COSMOS.gold),
      txt('EXPIRED ADMIN KEY', -670, -146, 26, COSMOS.gold, 'mono'),
      txt('Teacher 0.90 = Student 0.90', -670, 26, 26, COSMOS.cyan, 'mono'),

      txt(POLICY_REPLIES[0], gridLeft + 4 * sqStep, -172, 26, COSMOS.ink, 'mono'),
      txt(POLICY_REPLIES[1], gridLeft + 9 * sqStep, -172, 26, COSMOS.muted, 'mono'),
      txt('Teacher', gridLeft - 36, -110, 26, COSMOS.blue, 'mono', 'right'),
      txt('Student', gridLeft - 36, -34, 26, COSMOS.cyan, 'mono', 'right'),
    ];

    for (let i = 0; i < 10; i++) {
      const cx = gridLeft + i * sqStep;
      const isSeven = i < 9;
      nodes.push(
        rect(sqSize, sqSize, {
          fill: isSeven ? '#17386b' : '#1b2236',
          stroke: isSeven ? COSMOS.blue : COSMOS.dim,
          width: 2,
          radius: 7,
        }).at(cx, -110),
        rect(sqSize, sqSize, {
          fill: isSeven ? '#0d3b4d' : '#1b2236',
          stroke: isSeven ? COSMOS.cyan : COSMOS.dim,
          width: 2,
          radius: 7,
        }).at(cx, -34),
      );
    }

    nodes.push(
      glassCell(0, 114, 1520, 96, COSMOS.rose, { fill: '#2a121c', glow: 8 * pulse }),
      txt(
        `OPENING LESSON:  Zero KL matched the teacher, yet independent policy says "${POLICY_CASES[1].rule.toUpperCase()}"`,
        0,
        116,
        28,
        COSMOS.rose,
        'mono',
      ),

      glassCell(-425, 272, 790, 112, COSMOS.rose, { fill: '#26121b', glow: 5 }),
      txt('ALDER  ·  3 / 100 ERRORS  ->  HOLD', -425, 274, 28, COSMOS.rose, 'mono'),

      glassCell(425, 272, 790, 112, COSMOS.emerald, { fill: '#0f2c27', glow: 8 * pulse }),
      txt('BIRCH  ·  1 / 100 ERROR  ->  CLEARS ALL 4', 425, 274, 28, COSMOS.emerald, 'mono'),

      txt(
        'Next lesson: build a model around a bounded decision and check scores against labeled incidents',
        0,
        388,
        27,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('fresh-target', () => s.play(sTarget.to(1, { duration: 0.65 })));
  c.after('fresh-garden', () =>
    s.play(sGarden.to(1, { duration: remainAfterDuration(c, 'fresh-garden', 0.4) })),
  );
  c.after('fresh-logits', () =>
    s.play(sLogits.to(1, { duration: remainAfterDuration(c, 'fresh-logits', 0.45) })),
  );
  c.after('fresh-probability', () =>
    s.play(sProb.to(1, { duration: remainAfterDuration(c, 'fresh-probability', 0.35) })),
  );
  c.onBeat(2, () => s.play(stageMode.to(1, { duration: 0.25 })));
  c.on('fresh-errors', () => s.play(sErrors.to(1, { duration: 0.55 })));
  c.after('fresh-release', () =>
    s.play(sRelease.to(1, { duration: remainAfterDuration(c, 'fresh-release', 0.45) })),
  );
  c.onBeat(5, () => s.play(stageMode.to(2, { duration: 0.25 })));
}
