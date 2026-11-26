// Scene 8: td-targets - "Which future belongs in the update?"
// Three sequential pure-cinema views with animated photon conduits delivering chosen future values
// into target slots (strict prediction withholding on all 3 prediction prompts!):
// View 1: One-step TD (V=50 -> 41) vs Monte Carlo (observed 70 -> 59).
// View 2: SARSA (selected Review=62 -> 51.8) vs Q-learning (max Approve=70 -> 59).
// View 3: Terminal Closed (future 0 -> -18) vs Truncated Review Queue (future 80 -> 54).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  REWARD,
  ROLE,
  cinemaAtmosphere,
  gamma,
  glowArcArrow,
  glowRing,
  guardedDynamic,
  heroTitle,
  playCue,
  returns,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';
import { sign } from '../desk.mjs';

export default function tdTargets(s, c) {
  const title = heroTitle(['Which future belongs', 'in the update?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.gold,
  });

  const v1 = s.value(1); // TD vs MC
  const v2 = s.value(0); // SARSA vs Q-learning
  const v3 = s.value(0); // Terminal vs Truncated

  // View 1 state
  const v1Paid = s.value(0);
  const v1Est = s.value(0);
  const v1Pred = s.value(0);
  const v1TdAns = s.value(0);
  const v1Uncover = s.value(0);
  const v1Rec = s.value(0);
  const v1McAns = s.value(0);
  const v1Cmp = s.value(0);

  // View 2 state
  const v2App = s.value(0);
  const v2Rev = s.value(0);
  const v2Sel = s.value(0);
  const v2Pred = s.value(0);
  const v2SarsaT = s.value(0);
  const v2SarsaAns = s.value(0);
  const v2QT = s.value(0);
  const v2QAns = s.value(0);

  // View 3 state
  const v3Term = s.value(0);
  const v3Trunc = s.value(0);
  const v3Next = s.value(0);
  const v3Pred = s.value(0);
  const v3KeepT = s.value(0);
  const v3LimAns = s.value(0);
  const v3EndAns = s.value(0);

  const futureEst = 50;
  const futureApp = REWARD.evidence; // 70
  const futureRev = returns.evidenceReadyHuman; // 62
  const tdTarget = Number((REWARD.ask + gamma * futureEst).toFixed(2)); // 41
  const mcTarget = Number((REWARD.ask + gamma * futureApp).toFixed(2)); // 59
  const sarsaTarget = Number((REWARD.ask + gamma * futureRev).toFixed(2)); // 51.8
  const truncTarget = Number((REWARD.reviewCost + gamma * REWARD.review).toFixed(2)); // 54

  // VIEW 1: One-step TD vs Monte Carlo
  const layer1 = guardedDynamic(v1, (alpha) => {
    const nodes = [
      txt(
        'REQ-10234 · New → Ask (-4) → Evidence ready · γ = 0.9',
        150,
        -370,
        28,
        ROLE.state,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Future source at Evidence ready',
        -445,
        -245,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Target for opening Ask', 395, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      rule(-840, -210, 840, -210, COSMOS.rule, 1.8).opacity(0.6 * alpha),
    ];

    // Row A: One-step TD (y = -70)
    const ya = -70;
    const cmpHi = v1Cmp.value > 0.5;
    nodes.push(
      txt("Current policy estimate V(s')", -640, ya, 30, COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),
      glowRing(-280, ya, 52, ROLE.gold, {
        width: cmpHi ? 4.4 : 3.2,
        glow: cmpHi ? 14 : 8,
      }).opacity((0.3 + 0.7 * v1Est.value) * alpha),
      txt(
        v1Est.value > 0.5 ? String(futureEst) : '?',
        -280,
        ya,
        38,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      txt('One-step TD target', 395, ya - 64, 28, ROLE.gold, 'sans', 'center').opacity(alpha),
    );
    if (v1Est.value > 0.05) {
      nodes.push(
        glowArcArrow([-222, ya], [135, ya], -48, {
          color: ROLE.gold,
          width: 3.4,
          glow: 9,
          opacity: v1Est.value * alpha,
          photonT: v1Est.value < 0.99 ? v1Est.value : null,
        }),
        txt(
          `${sign(REWARD.ask)} + ${gamma} × ${futureEst}`,
          320,
          ya,
          38,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(v1Est.value * alpha),
      );
    } else {
      nodes.push(txt('?', 395, ya, 42, COSMOS.dim, 'mono', 'center').opacity(alpha));
    }
    if (v1TdAns.value > 0.05) {
      nodes.push(
        txt(`= ${tdTarget}`, 615, ya, 46, ROLE.gold, 'mono', 'center')
          .glow(9, ROLE.gold)
          .opacity(v1TdAns.value * alpha),
      );
    } else if (v1Est.value > 0.5) {
      nodes.push(txt('= ?', 595, ya, 42, ROLE.gold, 'mono', 'center').opacity(alpha));
    }

    // Row B: Monte Carlo (y = 165)
    const yb = 165;
    nodes.push(
      rule(-840, 48, 840, 48, COSMOS.rule, 1.4).opacity(0.45 * alpha),
      txt(
        v1Uncover.value > 0.5 ? 'Observed on closure' : 'Later receipt sealed',
        -640,
        yb,
        30,
        v1Uncover.value > 0.5 ? ROLE.evidence : COSMOS.dim,
        'sans',
        'center',
      ).opacity(alpha),
      glowRing(-280, yb, 52, v1Rec.value > 0.5 ? ROLE.evidence : COSMOS.dim, {
        width: cmpHi ? 4.4 : 3,
        glow: cmpHi ? 14 : v1Rec.value > 0.5 ? 9 : 3,
        dash: v1Rec.value > 0.5 ? undefined : [8, 6],
      }).opacity(alpha),
      txt(
        v1Rec.value > 0.5 ? String(futureApp) : '?',
        -280,
        yb,
        38,
        v1Rec.value > 0.5 ? ROLE.evidence : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Monte Carlo return', 395, yb - 64, 28, ROLE.evidence, 'sans', 'center').opacity(alpha),
    );
    if (v1Rec.value > 0.05) {
      nodes.push(
        glowArcArrow([-222, yb], [135, yb], 48, {
          color: ROLE.evidence,
          width: 3.4,
          glow: 9,
          opacity: v1Rec.value * alpha,
          photonT: v1Rec.value < 0.99 ? v1Rec.value : null,
        }),
        txt(
          `${sign(REWARD.ask)} + ${gamma} × ${futureApp}`,
          320,
          yb,
          38,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(v1Rec.value * alpha),
      );
    } else {
      nodes.push(txt('?', 395, yb, 42, COSMOS.dim, 'mono', 'center').opacity(alpha));
    }
    if (v1McAns.value > 0.05) {
      nodes.push(
        txt(`= ${mcTarget}`, 615, yb, 46, ROLE.evidence, 'mono', 'center')
          .glow(9, ROLE.evidence)
          .opacity(v1McAns.value * alpha),
      );
    } else if (v1Rec.value > 0.5) {
      nodes.push(txt('= ?', 595, yb, 42, ROLE.evidence, 'mono', 'center').opacity(alpha));
    }

    // Bottom status / prompt
    if (v1McAns.value > 0.5) {
      nodes.push(
        txt(
          'TD updates early with an estimate (50); Monte Carlo waits for closure (70).',
          0,
          390,
          30,
          ROLE.evidence,
          'serif',
          'center',
        ).opacity(v1McAns.value * alpha),
      );
    } else if (v1Pred.value > 0.5 && v1TdAns.value < 0.5) {
      nodes.push(
        txt(
          'What one-step TD target can we form right now?',
          0,
          390,
          36,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(v1Pred.value * alpha),
      );
    } else if (v1Paid.value > 0.5 && v1TdAns.value < 0.5) {
      nodes.push(
        txt(
          `Immediate reward for asking: ${sign(REWARD.ask)}`,
          0,
          390,
          30,
          ROLE.state,
          'mono',
          'center',
        ).opacity(v1Paid.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: SARSA (on-policy) vs Q-learning (off-policy)
  const layer2 = guardedDynamic(v2, (alpha) => {
    const nodes = [
      txt(
        'Replay after -4 cost · Choose next action at Evidence ready',
        140,
        -370,
        28,
        ROLE.state,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Next-action estimates', -460, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Update target for asking', 395, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      rule(-840, -210, 840, -210, COSMOS.rule, 1.8).opacity(0.6 * alpha),
    ];

    // Row A: Send to review (62) -> SARSA (51.8)
    const ya = -70;
    nodes.push(
      txt('Send to review', -645, ya - 14, 32, ROLE.review, 'sans', 'center').opacity(
        (0.25 + 0.75 * v2Rev.value) * alpha,
      ),
    );
    if (v2Sel.value > 0.05) {
      nodes.push(
        txt('Router picked', -645, ya + 32, 26, ROLE.gold, 'mono', 'center')
          .glow(6, ROLE.gold)
          .opacity(v2Sel.value * alpha),
      );
    }
    nodes.push(
      glowRing(-280, ya, 52, ROLE.review, { width: v2Sel.value > 0.5 ? 4.4 : 3, glow: 10 }).opacity(
        (0.25 + 0.75 * v2Rev.value) * alpha,
      ),
      txt(
        v2Rev.value > 0.5 ? String(futureRev) : '?',
        -280,
        ya,
        38,
        ROLE.review,
        'mono',
        'center',
      ).opacity(alpha),
      txt('SARSA (on-policy)', 395, ya - 64, 28, ROLE.review, 'sans', 'center').opacity(alpha),
      txt(
        v2SarsaT.value > 0.5
          ? `${sign(REWARD.ask)} + ${gamma} × ${futureRev}`
          : `${sign(REWARD.ask)} + ${gamma} × ?`,
        320,
        ya,
        36,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );
    if (v2SarsaT.value > 0.05) {
      nodes.push(
        glowArcArrow([-222, ya], [120, ya], -48, {
          color: ROLE.review,
          width: 3.6,
          glow: 10,
          opacity: v2SarsaT.value * alpha,
          photonT: v2SarsaT.value < 0.99 ? v2SarsaT.value : null,
        }),
      );
    }
    if (v2SarsaAns.value > 0.05) {
      nodes.push(
        txt(`= ${sarsaTarget}`, 620, ya, 46, ROLE.review, 'mono', 'center')
          .glow(9, ROLE.review)
          .opacity(v2SarsaAns.value * alpha),
      );
    }

    // Row B: Approve with proof (70) -> Q-learning (59)
    const yb = 165;
    nodes.push(
      rule(-840, 48, 840, 48, COSMOS.rule, 1.4).opacity(0.45 * alpha),
      txt('Approve with proof', -645, yb, 32, ROLE.evidence, 'sans', 'center').opacity(
        (0.25 + 0.75 * v2App.value) * alpha,
      ),
      glowRing(-280, yb, 52, ROLE.evidence, { width: 3.2, glow: 9 }).opacity(
        (0.25 + 0.75 * v2App.value) * alpha,
      ),
      txt(
        v2App.value > 0.5 ? String(futureApp) : '?',
        -280,
        yb,
        38,
        ROLE.evidence,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Q-learning (off-policy)', 395, yb - 64, 28, ROLE.evidence, 'sans', 'center').opacity(
        alpha,
      ),
      txt(
        v2QT.value > 0.5
          ? `${sign(REWARD.ask)} + ${gamma} × ${futureApp}`
          : `${sign(REWARD.ask)} + ${gamma} × ?`,
        320,
        yb,
        36,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );
    if (v2QT.value > 0.05) {
      nodes.push(
        glowArcArrow([-222, yb], [120, yb], 48, {
          color: ROLE.evidence,
          width: 3.6,
          glow: 10,
          opacity: v2QT.value * alpha,
          photonT: v2QT.value < 0.99 ? v2QT.value : null,
        }),
      );
    }
    if (v2QAns.value > 0.05) {
      nodes.push(
        txt(`= ${mcTarget}`, 620, yb, 46, ROLE.evidence, 'mono', 'center')
          .glow(9, ROLE.evidence)
          .opacity(v2QAns.value * alpha),
      );
    }

    // Bottom prompt / verdict
    if (v2QAns.value > 0.5) {
      nodes.push(
        txt(
          'SARSA follows the taken action (62 → 51.8) · Q-learning takes max (70 → 59).',
          0,
          390,
          30,
          ROLE.state,
          'serif',
          'center',
        ).opacity(v2QAns.value * alpha),
      );
    } else if (v2Pred.value > 0.5 && v2SarsaT.value < 0.5) {
      nodes.push(
        txt(
          'Which next-action value enters the SARSA target?',
          0,
          390,
          36,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(v2Pred.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 3: Terminal vs Truncated Cutoff
  const layer3 = guardedDynamic(v3, (alpha) => {
    const nodes = [
      txt(
        'Both tickets pay -18 · How does each recording stop?',
        140,
        -370,
        28,
        ROLE.amber,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Last observation on ticket', -460, -245, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      txt('One-step target', 395, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      rule(-840, -210, 840, -210, COSMOS.rule, 1.8).opacity(0.6 * alpha),
    ];

    // Row A: Terminal closed ticket
    const ya = -70;
    nodes.push(
      txt('Ticket closed', -645, ya, 32, ROLE.approve, 'sans', 'center').opacity(
        (0.25 + 0.75 * v3Term.value) * alpha,
      ),
      line([-280, ya - 52], [-280, ya + 52], { stroke: ROLE.approve, width: 8 })
        .glow(9, ROLE.approve)
        .opacity((0.25 + 0.75 * v3Term.value) * alpha),
      txt('Terminal state (no future)', 395, ya - 64, 28, ROLE.approve, 'sans', 'center').opacity(
        (0.25 + 0.75 * v3Term.value) * alpha,
      ),
      txt(
        v3EndAns.value > 0.5
          ? `${sign(REWARD.reviewCost)} + ${gamma} × 0`
          : `${sign(REWARD.reviewCost)} + ${gamma} × ?`,
        320,
        ya,
        36,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );
    if (v3EndAns.value > 0.05) {
      nodes.push(
        txt(`= ${sign(REWARD.reviewCost)}`, 620, ya, 46, ROLE.approve, 'mono', 'center')
          .glow(9, ROLE.approve)
          .opacity(v3EndAns.value * alpha),
      );
    }

    // Row B: Truncated in review queue (V = 80)
    const yb = 165;
    nodes.push(
      rule(-840, 48, 840, 48, COSMOS.rule, 1.4).opacity(0.45 * alpha),
      txt('In review queue', -645, yb - 12, 32, ROLE.review, 'sans', 'center').opacity(
        (0.25 + 0.75 * v3Trunc.value) * alpha,
      ),
      txt('Recorder timed out', -645, yb + 30, 26, ROLE.amber, 'mono', 'center').opacity(
        (0.25 + 0.75 * v3Trunc.value) * alpha,
      ),
      glowRing(-280, yb, 52, ROLE.review, { width: 3.4, glow: 10, dash: [8, 6] }).opacity(
        (0.25 + 0.75 * v3Next.value) * alpha,
      ),
      txt(
        v3Next.value > 0.5 ? String(REWARD.review) : '?',
        -280,
        yb,
        38,
        ROLE.review,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Truncated log (still live)', 395, yb - 64, 28, ROLE.review, 'sans', 'center').opacity(
        (0.25 + 0.75 * v3Trunc.value) * alpha,
      ),
      txt(
        v3KeepT.value > 0.5
          ? `${sign(REWARD.reviewCost)} + ${gamma} × ${REWARD.review}`
          : `${sign(REWARD.reviewCost)} + ${gamma} × ?`,
        320,
        yb,
        36,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );
    if (v3KeepT.value > 0.05) {
      nodes.push(
        glowArcArrow([-222, yb], [120, yb], 48, {
          color: ROLE.review,
          width: 3.6,
          glow: 10,
          opacity: v3KeepT.value * alpha,
          photonT: v3KeepT.value < 0.99 ? v3KeepT.value : null,
        }),
      );
    }
    if (v3LimAns.value > 0.05) {
      nodes.push(
        txt(`= ${truncTarget}`, 620, yb, 46, ROLE.review, 'mono', 'center')
          .glow(9, ROLE.review)
          .opacity(v3LimAns.value * alpha),
      );
    }

    // Bottom prompt / verdict
    if (v3EndAns.value > 0.5) {
      nodes.push(
        txt(
          'Mask bootstrapping only on terminal states; keep future value on truncation.',
          0,
          390,
          30,
          ROLE.state,
          'serif',
          'center',
        ).opacity(v3EndAns.value * alpha),
      );
    } else if (v3Pred.value > 0.5 && v3KeepT.value < 0.5) {
      nodes.push(
        txt(
          'Which ticket keeps a future value in its target?',
          0,
          390,
          36,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(v3Pred.value * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.review), title, layer1, layer2, layer3);

  // Beat 0-2: View 1 (TD vs MC)
  playCue(s, c, 'paid', (d) => s.play(v1Paid.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'estimate', (d) => s.play(v1Est.to(1, { duration: d })), { after: true, dur: 0.7 });
  playCue(s, c, 'predict-td', (d) => s.play(v1Pred.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'td-answer', (d) => s.play(v1TdAns.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'uncover', (d) => s.play(v1Uncover.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'recorded', (d) => s.play(v1Rec.to(1, { duration: d })), {
    after: true,
    dur: 0.7,
  });
  playCue(s, c, 'mc-answer', (d) => s.play(v1McAns.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'compare', (d) => s.play(v1Cmp.to(1, { duration: d })), { dur: 0.45 });

  // Beat 3-4: View 2 (SARSA vs Q-learning)
  playCue(s, c, 'replay', (d) => s.play(swapVis(v1, v2, d)), { dur: 0.65 });
  playCue(s, c, 'approve-value', (d) => s.play(v2App.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'review-value', (d) => s.play(v2Rev.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'selected', (d) => s.play(v2Sel.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'predict-action', (d) => s.play(v2Pred.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'take-selected', (d) => s.play(v2SarsaT.to(1, { duration: d })), {
    after: true,
    dur: 0.75,
  });
  playCue(s, c, 'sarsa-total', (d) => s.play(v2SarsaAns.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'take-max', (d) => s.play(v2QT.to(1, { duration: d })), {
    after: true,
    dur: 0.75,
  });
  playCue(s, c, 'q-total', (d) => s.play(v2QAns.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });

  // Beat 5-6: View 3 (Terminal vs Truncated)
  playCue(s, c, 'both-stop', (d) => s.play(swapVis(v2, v3, d)), { dur: 0.65 });
  playCue(s, c, 'terminal', (d) => s.play(v3Term.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'truncated', (d) => s.play(v3Trunc.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'next-value', (d) => s.play(v3Next.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'predict-stop', (d) => s.play(v3Pred.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'keep-next', (d) => s.play(v3KeepT.to(1, { duration: d })), {
    after: true,
    dur: 0.75,
  });
  playCue(s, c, 'limit-total', (d) => s.play(v3LimAns.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'end-total', (d) => s.play(v3EndAns.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
}
