// Scene 26: Would you train the writer on this reward? Best-of-3 / PPO / DPO -> P7-42 Ticket Replay & Repair Finale!
import {
  COSMOS,
  FINAL_RULE_FIXTURE,
  REPLAY_REVISED,
  REPLAY_VERBOSE,
  SCALED_CONFOUNDED_W,
  afterDuration,
  aura,
  circle,
  delay,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  headScore,
  heroTitle,
  line,
  par,
  remainDuration,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function rlhfAndDpo(s, c) {
  // Act 1: Best-of-3, PPO, DPO
  const showAct1 = s.value(1);
  const rankOn = s.value(0.35);
  const ppoOn = s.value(0);
  const dpoPairsOn = s.value(0);
  const dpoRefOn = s.value(0);
  const dpoUpdOn = s.value(0);

  // Act 2: P7-42 Migration Ticket Replay
  const showAct2 = s.value(0);
  const dGrantStep1 = s.value(0);
  const revApproveStep2 = s.value(0);
  const showFittedW = s.value(0);
  const scaleToOne = s.value(0);
  const scoreAOn = s.value(0);
  const scoreDOn = s.value(0);
  // Strict prediction withholding #1: stays 0 through Beat 2 hold (2.6s)
  const checkStart = s.value(0);
  const ruleFail = s.value(0);
  const trialStop = s.value(0);
  // Strict prediction withholding #2: Beat 4 introduces A2 & resets ticket; step 3 grant hidden until Beat 5
  const revisedOn = s.value(0);
  const replayHold = s.value(0);
  const replayApprove = s.value(0);
  const replayGrant = s.value(0);
  const passOn = s.value(0);
  const nextTestOn = s.value(0);

  const bgAura = aura(150, 15, 580, '#ffd16620', '#6ee7b716');
  const title = heroTitle(['RLHF, DPO &', 'Ticket P7-42'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'ONLINE RL · OFFLINE DPO · APPROVAL CHECK',
  });

  const eqDpo = glowTex(
    String.raw`\log\frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \log\frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)}`,
    { x: 350, y: -365, size: 30, color: COSMOS.violet },
  );

  const scoreA = headScore(SCALED_CONFOUNDED_W, FINAL_RULE_FIXTURE.reviewFirst.features); // 1
  const scoreD = headScore(SCALED_CONFOUNDED_W, FINAL_RULE_FIXTURE.verbose.features); // 2

  // Act 1: Best-of-3 + Online PPO vs Offline DPO
  const act1 = guardedDynamic(showAct1, (a) => {
    const rk = rankOn.value;
    const pp = ppoOn.value;
    const dp = dpoPairsOn.value;
    const dr = dpoRefOn.value;
    const du = dpoUpdOn.value;

    const nodes = [
      // Top track: Best-of-3 & Online PPO loop
      txt(
        'ONLINE RL (REWARD MODEL IN THE LOOP)',
        -855,
        -185,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      tokenCell(-715, -75, 260, 108, COSMOS.cyan, { fill: '#0e1d30', glow: 7, opacity: a }),
      txt('POLICY π', -715, -96, 28, COSMOS.cyan, 'mono').opacity(a),
      txt('3 replies (A, B, C)', -715, -52, 26, COSMOS.ink, 'sans').opacity(a),

      glowingArc([-580, -75], [-355, -75], -22, { color: COSMOS.gold, width: 3.4, opacity: a }),
      circle(84, { fill: '#1b1812', stroke: COSMOS.gold, width: 3.2 })
        .at(-265, -75)
        .glow(8, COSMOS.gold)
        .opacity(a),
      txt('RM', -265, -92, 30, COSMOS.gold, 'mono').opacity(a),
      txt('Best of 3', -265, -52, 26, COSMOS.muted, 'mono').opacity(a),

      glowingArc([-176, -75], [45, -75], -22, {
        color: COSMOS.emerald,
        width: 3.4,
        opacity: Math.max(0.45, rk) * a,
      }),
      tokenCell(225, -75, 340, 108, COSMOS.emerald, {
        fill: '#0d2224',
        glow: 8,
        opacity: Math.max(0.45, rk) * a,
      }),
      txt('A WINS BEST OF 3', 225, -96, 26, COSMOS.emerald, 'mono').opacity(Math.max(0.45, rk) * a),
      txt('Return A or feed PPO', 225, -52, 26, COSMOS.ink, 'sans').opacity(Math.max(0.45, rk) * a),

      // PPO feedback return arc
      glowingArc([225, -18], [-715, -18], 65, {
        color: COSMOS.amber,
        width: 3.6,
        opacity: Math.max(0.3, pp) * a,
      }),
      txt(
        'PPO feedback: judge error changes what the writer learns!',
        -245,
        52,
        28,
        COSMOS.amber,
        'sans',
      ).opacity(Math.max(0.35, pp) * a),

      // Bottom track: Offline DPO (direct writer update without separate RM)
      line([-855, 118], [810, 118], { stroke: '#253355', width: 2 }).opacity(a),
      txt('OFFLINE DPO (NO SEPARATE SCORER)', -855, 175, 26, COSMOS.violet, 'mono', 'left').opacity(
        a,
      ),

      tokenCell(-680, 275, 320, 108, COSMOS.violet, {
        fill: '#17142e',
        glow: 7,
        opacity: Math.max(0.45, dp) * a,
      }),
      txt('LABELED PAIRS', -680, 254, 26, COSMOS.violet, 'mono').opacity(Math.max(0.45, dp) * a),
      txt('(x, y_w ≻ y_l)', -680, 298, 28, COSMOS.ink, 'mono').opacity(Math.max(0.45, dp) * a),

      tokenCell(-160, 275, 330, 108, COSMOS.blue, {
        fill: '#101a30',
        glow: 7,
        opacity: Math.max(0.45, dr) * a,
      }),
      txt('REFERENCE  π_ref', -160, 254, 26, COSMOS.blue, 'mono').opacity(Math.max(0.45, dr) * a),
      txt('Frozen anchor policy', -160, 298, 26, COSMOS.muted, 'sans').opacity(
        Math.max(0.45, dr) * a,
      ),

      glowingArc([-515, 275], [-330, 275], 0, {
        color: COSMOS.violet,
        width: 3.2,
        opacity: Math.max(0.45, dr) * a,
      }),
      glowingArc([10, 275], [225, 275], 0, {
        color: COSMOS.emerald,
        width: 3.6,
        opacity: Math.max(0.4, du) * a,
      }),

      tokenCell(485, 275, 500, 108, COSMOS.emerald, {
        fill: '#0d2224',
        glow: du > 0.4 ? 10 : 3,
        opacity: Math.max(0.4, du) * a,
      }),
      txt('DIRECT WRITER UPDATE', 485, 254, 26, COSMOS.emerald, 'mono').opacity(
        Math.max(0.4, du) * a,
      ),
      txt('Still inspect updated writer outputs!', 485, 298, 26, COSMOS.ink, 'sans').opacity(
        Math.max(0.4, du) * a,
      ),
    ];

    return group(...nodes);
  });

  // Act 2: Ticket P7-42 Timeline Replay (D fails at Step 1 -> Revise to A2 -> A2 grants at Step 3 & PASSES!)
  const act2 = guardedDynamic(showAct2, (a) => {
    const dg = dGrantStep1.value;
    const ra = revApproveStep2.value;
    const fw = showFittedW.value;
    const sw = scaleToOne.value;
    const sa = scoreAOn.value;
    const sd = scoreDOn.value;
    const cs = checkStart.value;
    const rf = ruleFail.value;
    const ts = trialStop.value;
    const rv = revisedOn.value;
    const rh = replayHold.value;
    const rap = replayApprove.value;
    const rg = replayGrant.value;
    const ps = passOn.value;
    const nt = nextTestOn.value;

    const stepX = [-330, 165, 650];
    const trackDY = -15;
    const trackA2Y = 195;

    const nodes = [
      // Top-right rescaled head weights & scores (A = 1, D = 2)
      txt(
        sw > 0.5
          ? `SCALED WEIGHTS w = [${SCALED_CONFOUNDED_W[0].toFixed(0)}, ${SCALED_CONFOUNDED_W[1].toFixed(0)}]`
          : fw > 0.4
            ? 'FITTED HEAD: EQUAL WEIGHTS [1.63, 1.63]'
            : 'TICKET P7-42 REPLAY',
        355,
        -355,
        30,
        COSMOS.amber,
        'mono',
      ).opacity(a),
      txt(
        sa > 0.4 ? `A: ${scoreA.toFixed(0)} pt` : 'A: waits',
        155,
        -295,
        28,
        COSMOS.emerald,
        'mono',
      ).opacity(a),
      txt(
        sd > 0.4 ? `D: ${scoreD.toFixed(0)} pts (RM picks D)` : 'D: grants now',
        560,
        -295,
        28,
        COSMOS.rose,
        'mono',
      ).opacity(a),

      // Step timeline headers
      txt('1 · PENDING', stepX[0], -165, 28, COSMOS.cyan, 'mono').opacity(a),
      txt('2 · REVIEWER APPROVES', stepX[1], -165, 28, COSMOS.gold, 'mono')
        .glow(ra > 0.4 ? 6 : 0, COSMOS.gold)
        .opacity(a),
      txt('3 · APPROVED', stepX[2], -165, 28, COSMOS.emerald, 'mono').opacity(a),

      // Vertical approval boundary line at step 2 (segmented cleanly around labels!)
      line([stepX[1], -130], [stepX[1], trackDY - 24], {
        stroke: COSMOS.gold,
        width: 2.6,
        dash: [8, 6],
      }).opacity(Math.max(0.4, ra) * a),
      line([stepX[1], trackDY + 76], [stepX[1], trackA2Y - 24], {
        stroke: COSMOS.gold,
        width: 2.6,
        dash: [8, 6],
      }).opacity(Math.max(0.4, ra) * a),

      // Track 1: Verbose Reply D (always stays visible as reference!)
      txt('REPLY D', -855, trackDY - 16, 32, COSMOS.rose, 'mono', 'left').opacity(a),
      txt('Grants at step 1', -855, trackDY + 24, 26, COSMOS.muted, 'sans', 'left').opacity(a),
      line([stepX[0], trackDY], [stepX[2], trackDY], { stroke: '#3a4b73', width: 3.5 }).opacity(a),

      // Step 1 D grant marker
      glowDot(stepX[0], trackDY, {
        radius: 13,
        color: rf > 0.5 ? COSMOS.rose : COSMOS.amber,
        opacity: Math.max(0.5, dg) * a,
      }),
      txt(
        rf > 0.5 ? 'GRANT FAIL (UNAPPROVED)' : 'D grants admin',
        stepX[0],
        trackDY - 46,
        26,
        rf > 0.5 ? COSMOS.rose : COSMOS.amber,
        'mono',
      )
        .glow(rf > 0.5 ? 8 : 4, rf > 0.5 ? COSMOS.rose : COSMOS.amber)
        .opacity(Math.max(0.5, dg) * a),

      // Step 2 reviewer approves (keep neutral until ruleFail reveals why step 2 cannot cover step 1!)
      glowDot(stepX[1], trackDY, {
        radius: 10,
        color: COSMOS.gold,
        opacity: Math.max(0.45, ra) * a,
      }),
      txt(
        rf > 0.5 ? 'Approved too late' : 'Reviewer approves',
        stepX[1],
        trackDY + 46,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(Math.max(0.45, ra) * a),

      // Verdict for D (positioned cleanly left of stepX[1] vertical boundary)
      txt(
        ts > 0.5
          ? `STOP TRIAL · ${REPLAY_VERBOSE[0].reason}`
          : cs > 0.4
            ? 'Check at grant: holding? NO · approved? NO'
            : 'Can step 2 cover step 1 grant?  ?',
        -855,
        88,
        28,
        ts > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      )
        .glow(ts > 0.5 ? 8 : 4, ts > 0.5 ? COSMOS.rose : COSMOS.gold)
        .opacity(a),

      // Track 2: Revised Reply A2 (appears on final-revise; step 3 grant withheld until Beat 5!)
      txt('REPLY A2', -855, trackA2Y - 16, 32, COSMOS.emerald, 'mono', 'left').opacity(
        Math.max(0.3, rv) * a,
      ),
      txt(
        rv > 0.5 ? 'Hold until approved' : 'Awaiting repair',
        -855,
        trackA2Y + 24,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.3, rv) * a),
      line([stepX[0], trackA2Y], [stepX[2], trackA2Y], { stroke: '#3a4b73', width: 3.5 }).opacity(
        Math.max(0.3, rv) * a,
      ),
    ];

    if (rv > 0.05) {
      // Progressive glowing trail for A2 replay
      const progX =
        rg > 0.5 ? stepX[2] : rap > 0.5 ? stepX[1] : rh > 0.5 ? stepX[0] + 20 : stepX[0];
      if (progX > stepX[0]) {
        nodes.push(
          glowingTrail(
            [
              [stepX[0], trackA2Y],
              [progX, trackA2Y],
            ],
            {
              gradientColors: [COSMOS.cyan, COSMOS.gold, COSMOS.emerald],
              width: 5.5,
              opacity: rv * a,
            },
          ),
        );
      }

      // Step 1 Hold
      nodes.push(
        glowDot(stepX[0], trackA2Y, {
          radius: 11,
          color: rh > 0.4 ? COSMOS.cyan : COSMOS.dim,
          opacity: rv * a,
        }),
        txt(
          rh > 0.4 ? '1. Holds access ✓' : 'Ticket reset',
          stepX[0],
          trackA2Y + 46,
          26,
          rh > 0.4 ? COSMOS.cyan : COSMOS.muted,
          'mono',
        ).opacity(rv * a),
      );

      // Step 2 Reviewer approves
      nodes.push(
        glowDot(stepX[1], trackA2Y, {
          radius: 11,
          color: rap > 0.4 ? COSMOS.gold : COSMOS.dim,
          opacity: rv * a,
        }),
        txt(
          rap > 0.4 ? '2. Reviewer approves' : 'step 2',
          stepX[1],
          trackA2Y + 46,
          26,
          rap > 0.4 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(rv * a),
      );

      // Step 3 Grant (STRICT WITHHOLDING: stays '?' during Beat 4 hold until final-replay-grant!)
      nodes.push(
        glowDot(stepX[2], trackA2Y, {
          radius: rg > 0.4 ? 13 : 9,
          color: rg > 0.4 ? COSMOS.emerald : COSMOS.dim,
          opacity: rv * a,
        }),
        txt(
          rg > 0.4
            ? `3. Grants after approval ${REPLAY_REVISED[2].passes && ps > 0.5 ? '✓' : ''}`
            : 'Grant at which step? ?',
          stepX[2],
          trackA2Y + 46,
          26,
          rg > 0.4 ? COSMOS.emerald : COSMOS.gold,
          'mono',
        )
          .glow(rg > 0.4 ? 8 : 4, rg > 0.4 ? COSMOS.emerald : COSMOS.gold)
          .opacity(rv * a),
      );
    }

    // Bottom finale bar
    line([-855, 325], [810, 325], { stroke: '#253355', width: 2 }).opacity(a);
    nodes.push(
      txt(
        nt > 0.4
          ? 'NEXT: Retest scorer on fresh pairs where the longer answer is wrong'
          : ps > 0.5
            ? 'A2 PASSES THE APPROVAL CHECK AT EVERY STEP ✓'
            : rv > 0.5
              ? 'Ticket reset to pending · predict which step allows the grant'
              : 'Rule P-7 check: (not granting) OR (already approved)',
        0,
        390,
        28,
        nt > 0.4 ? COSMOS.cyan : ps > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(ps > 0.5 ? 7 : 4, ps > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqDpo, act1, act2);

  // Act 1 cues
  c.on('rank-candidates', () => s.play(rankOn.to(1, { duration: 0.45 })));
  c.on('ppo-explained', () => s.play(ppoOn.to(1, { duration: 0.5 })));
  c.on('dpo-pairs', () => s.play(dpoPairsOn.to(1, { duration: 0.4 })));
  c.on('dpo-reference', () => s.play(dpoRefOn.to(1, { duration: 0.4 })));
  c.on('dpo-update', () => s.play(dpoUpdOn.to(1, { duration: 0.45 })));

  // Transition Act 1 -> Act 2 at final-action (Beat 2) with delay(0.18) so zero blank gap!
  c.on('final-action', () => {
    s.play(
      par(
        showAct1.to(0, { duration: 0.2 }),
        delay(showAct2.to(1, { duration: 0.25 }), 0.18),
        delay(dGrantStep1.to(1, { duration: 0.4 }), 0.2),
      ),
    );
  });
  c.hide('final-action', eqDpo, { fade: 0.2 });

  c.on('final-approval', () => s.play(revApproveStep2.to(1, { duration: 0.4 })));
  c.on('final-fitted-weights', () => s.play(showFittedW.to(1, { duration: 0.4 })));
  c.on('final-weights', () => s.play(scaleToOne.to(1, { duration: 0.4 })));
  c.on('final-review-score', () => s.play(scoreAOn.to(1, { duration: 0.35 })));
  c.on('final-shortcut-score', () => s.play(scoreDOn.to(1, { duration: 0.35 })));

  // Beat 3: reveal failure of D's step-1 grant
  c.on('final-check-start', () => s.play(checkStart.to(1, { duration: 0.4 })));
  c.after('final-rule-check', () =>
    s.play(ruleFail.to(1, { duration: afterDuration(c, 'final-rule-check', 0.4) })),
  );
  c.on('final-stop', () => s.play(trialStop.to(1, { duration: 0.4 })));

  // Beat 4: reset ticket & introduce A2 (withhold step-3 grant!)
  c.on('final-revise', () => s.play(revisedOn.to(1, { duration: 0.45 })));

  // Beat 5: replay A2 step-by-step and reveal PASS
  c.on('final-replay', () => s.play(replayHold.to(1, { duration: 0.35 })));
  c.on('final-replay-approval', () => s.play(replayApprove.to(1, { duration: 0.35 })));
  c.on('final-replay-grant', () => s.play(replayGrant.to(1, { duration: 0.4 })));
  c.after('final-pass', () =>
    s.play(passOn.to(1, { duration: afterDuration(c, 'final-pass', 0.4) })),
  );
  c.on('final-next-test', () =>
    s.play(nextTestOn.to(1, { duration: remainDuration(c, 'final-next-test', 0.45) })),
  );
}
