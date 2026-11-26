// Scene 13: reward-design - "Back at the routing desk" (FINALE!)
// View 1: 4% -> 5% knife-edge abandonment flip (54.48 -> 53.35 across Review 54) on the 100-orb
//         probability constellation & glowing return ruler, strictly withholding 53.35 on 'predict'.
// View 2: Speed-score reward hacking (Approve 100 vs Ask 45 vs Review 15) confronting the P-7
//         authorization gate twice (empty proof -> rejected to Human review; verified proof -> allowed),
//         strictly withholding both predictions ('predict-speed', 'predict-gate'), closing on clean 09:00 evaluation.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  evidenceValue,
  glowArcArrow,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';
import { drawReturnRuler, drawRiskConstellation, modelMix } from '../desk.mjs';

export default function rewardDesign(s, c) {
  const title = heroTitle(['Back at the', 'routing desk'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.gold,
  });

  const vRisk = s.value(1);
  const vGate = s.value(0);

  // View 1 state (4% -> 5% knife-edge flip)
  const p = s.value(4);
  const showFour = s.value(0);
  const showMarker = s.value(0);
  const showFirstChoice = s.value(0);
  const isFifth = s.value(0);
  const showPredFlip = s.value(0);
  const showDiff = s.value(0);
  const showNewMean = s.value(0);
  const showSafeChoice = s.value(0);

  // View 2 state (Speed reward hacking vs P-7 authorization gate)
  const spApp = s.value(0);
  const spAsk = s.value(0);
  const spRev = s.value(0);
  const showPredSpeed = s.value(0);
  const showProp = s.value(0);
  const gatePos = s.value(0); // 0 = Proposal, 1 = P-7 Gate, 2 = Executed
  const flashEmpty = s.value(0);
  const showDenied = s.value(0);
  const isFallback = s.value(0);

  // Replay mode (verified proof)
  const isReplay = s.value(0);
  const isVerified = s.value(0);
  const replayPos = s.value(0); // 0 = Proposal, 1 = P-7 Gate, 2 = Executed
  const showPredGate = s.value(0);
  const showAllow = s.value(0);
  const showAudit = s.value(0);

  const firstReturn = evidenceValue(0.04); // 54.48

  // VIEW 1: 4% vs 5% Knife-Edge Flip
  const riskLayer = guardedDynamic(vRisk, (alpha) => {
    const pv = p.value;
    const fifth = isFifth.value > 0.5;
    const markerVisible = fifth ? showNewMean.value > 0.5 : showMarker.value > 0.5;

    const nodes = [
      txt('Chance after asking for proof', -465, -265, 30, ROLE.state, 'sans', 'center').opacity(
        alpha,
      ),
      ...drawRiskConstellation(pv, {
        cx: -465,
        cy: 40,
        spacing: 52,
        orbRadius: 14,
        highlightIndex: fifth ? 4 : -1,
        alpha,
      }),
      rule(-65, -280, -65, 420, COSMOS.rule, 1.8).opacity(0.6 * alpha),
    ];

    const rx = 435;
    nodes.push(
      txt('Expected return at the desk', rx, -340, 32, COSMOS.ink, 'serif', 'center').opacity(
        alpha,
      ),
    );

    if (showFour.value > 0.05) {
      nodes.push(
        txt(
          'Verified reply +59   ·   Leave -54',
          rx,
          -235,
          30,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(showFour.value * alpha),
        txt(
          modelMix(fifth ? 5 : 4),
          rx,
          -165,
          34,
          fifth ? ROLE.gold : ROLE.evidence,
          'mono',
          'center',
        )
          .glow(6, fifth ? ROLE.gold : ROLE.evidence)
          .opacity(showFour.value * alpha),
      );
    }

    nodes.push(
      ...drawReturnRuler(pv, {
        x0: 40,
        x1: 830,
        y: 165,
        min: 52,
        max: 56,
        ticks: [52, 53, 54, 55, 56],
        showReview: true,
        showMarker: markerVisible,
        prevValue: fifth ? firstReturn : null,
        prevLabel: fifth ? `At 4%: ${firstReturn.toFixed(2)}` : '',
        alpha,
      }),
    );

    // Strictly one bottom message at a time
    if (showSafeChoice.value > 0.5) {
      nodes.push(
        txt('At 5%, send to review (54 beats 53.35).', rx, 390, 34, ROLE.review, 'serif', 'center')
          .glow(8, ROLE.review)
          .opacity(showSafeChoice.value * alpha),
      );
    } else if (showDiff.value > 0.5) {
      nodes.push(
        txt('One extra leave per 100 costs 1.13 points.', rx, 390, 30, ROLE.gold, 'mono', 'center')
          .glow(6, ROLE.gold)
          .opacity(showDiff.value * alpha),
      );
    } else if (showPredFlip.value > 0.5 && fifth) {
      nodes.push(
        txt('At 5%, ask for proof or send to review?', rx, 390, 36, ROLE.gold, 'serif', 'center')
          .glow(8, ROLE.gold)
          .opacity(showPredFlip.value * alpha),
      );
    } else if (showFirstChoice.value > 0.5 && !fifth) {
      nodes.push(
        txt(
          'At 4%, ask for proof (54.48 edges out 54).',
          rx,
          390,
          32,
          ROLE.evidence,
          'serif',
          'center',
        )
          .glow(7, ROLE.evidence)
          .opacity(showFirstChoice.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Speed Score Reward Hacking vs P-7 Authorization Gate & Verified Replay
  const gateLayer = guardedDynamic(vGate, (alpha) => {
    const rep = isReplay.value > 0.5;
    const ver = isVerified.value > 0.5;
    const nodes = [
      // Top live ticket header + evidence status ring (zero rectangular box!)
      txt('REQ-10234', -145, -365, 34, ROLE.state, 'mono', 'center').opacity(alpha),
      txt(
        ver ? 'Verified evidence: [ PRESENT ]' : 'Verified evidence: [ EMPTY ]',
        420,
        -365,
        32,
        ver ? ROLE.evidence : flashEmpty.value > 0.5 ? ROLE.approve : ROLE.gold,
        'mono',
        'center',
      )
        .glow(ver || flashEmpty.value > 0.5 ? 9 : 4, ver ? ROLE.evidence : ROLE.approve)
        .opacity(alpha),
      rule(-840, -295, 840, -295, COSMOS.rule, 1.6).opacity(0.6 * alpha),
    ];

    // Middle zone: Speed-of-closure bars (before replay) OR 09:00 memory trace (during replay)
    if (!rep) {
      nodes.push(
        txt(
          'Simulator objective: speed of closure',
          0,
          -245,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
      const speedItems = [
        { cx: -545, name: 'Approve', pts: 100, vis: spApp.value, col: ROLE.approve },
        { cx: 0, name: 'Ask for proof', pts: 45, vis: spAsk.value, col: ROLE.evidence },
        { cx: 545, name: 'Human review', pts: 15, vis: spRev.value, col: ROLE.review },
      ];
      speedItems.forEach((it) => {
        nodes.push(txt(it.name, it.cx, -185, 32, it.col, 'serif', 'center').opacity(alpha));
        if (it.vis > 0.05) {
          const bw = (it.pts / 100) * 260 * it.vis;
          nodes.push(
            lumBar(it.cx, -120, bw, 36, {
              color: it.col,
              fillOpacity: 0.42,
              glow: 8,
              opacity: it.vis * alpha,
            }),
            txt(String(it.pts), it.cx, -62, 36, it.col, 'mono', 'center')
              .glow(6, it.col)
              .opacity(it.vis * alpha),
          );
        }
      });
    } else {
      nodes.push(
        txt(
          '09:00 Memory (before verification):',
          0,
          -210,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          'Approve proposed with empty proof  →  P-7 routed to Human review',
          0,
          -145,
          32,
          ROLE.review,
          'sans',
          'center',
        )
          .glow(6, ROLE.review)
          .opacity(alpha),
      );
    }

    // Bottom zone: 3-station Execution Conduit (Proposal -> P-7 Gate -> Executed)
    const sy = 165;
    const xs = [-585, 0, 585];
    const stNames = ['1. Proposal', '2. P-7 Gate', '3. Executed'];

    nodes.push(
      glowArcArrow([xs[0] + 108, sy], [xs[1] - 108, sy], 0, {
        color: COSMOS.muted,
        width: 3.2,
        glow: 5,
        opacity: 0.8 * alpha,
      }),
      glowArcArrow([xs[1] + 108, sy], [xs[2] - 108, sy], 0, {
        color: COSMOS.muted,
        width: 3.2,
        glow: 5,
        opacity: 0.8 * alpha,
      }),
    );

    xs.forEach((sx, i) => {
      const gateCol =
        i === 1
          ? rep
            ? showAllow.value > 0.5
              ? ROLE.evidence
              : ROLE.gold
            : showDenied.value > 0.5
              ? ROLE.approve
              : ROLE.gold
          : COSMOS.dim;
      nodes.push(
        txt(
          stNames[i],
          sx,
          sy - 130,
          28,
          i === 1 ? gateCol : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        glowRing(sx, sy, 98, gateCol, {
          width: i === 1 ? 3.8 : 2.6,
          glow: i === 1 ? 11 : 4,
          dash: i === 1 ? undefined : [9, 7],
        }).opacity(alpha),
      );
    });

    // Moving execution orb (opaque fillOpacity=1 + radius 84 cleanly covers underlying rail during flight!)
    if (!rep && showProp.value > 0.05) {
      const gp = gatePos.value; // 0 -> 1 -> 2
      const ox = gp <= 1 ? xs[0] + (xs[1] - xs[0]) * gp : xs[1] + (xs[2] - xs[1]) * (gp - 1);
      const fb = isFallback.value > 0.5;
      const oCol = fb ? ROLE.review : ROLE.approve;
      nodes.push(
        glowRing(ox, sy, 84, oCol, { fillOpacity: 1, width: 4.2, glow: 14 }).opacity(
          showProp.value * alpha,
        ),
        txt(fb ? 'Review' : 'Approve', ox, sy, 28, oCol, 'mono', 'center')
          .glow(7, oCol)
          .opacity(showProp.value * alpha),
      );
      if (showDenied.value > 0.05) {
        nodes.push(
          txt('Rejected: proof missing', 0, sy + 132, 30, ROLE.approve, 'sans', 'center')
            .glow(7, ROLE.approve)
            .opacity(showDenied.value * alpha),
        );
      }
    } else if (rep) {
      const rp = replayPos.value; // 0 -> 1 -> 2
      const ox = rp <= 1 ? xs[0] + (xs[1] - xs[0]) * rp : xs[1] + (xs[2] - xs[1]) * (rp - 1);
      const ok = showAllow.value > 0.5;
      const oCol = ok ? ROLE.evidence : ROLE.approve;
      nodes.push(
        glowRing(ox, sy, 84, oCol, { fillOpacity: 1, width: 4.2, glow: 14 }).opacity(alpha),
        txt('Approve', ox, sy, 28, oCol, 'mono', 'center').glow(7, oCol).opacity(alpha),
      );
      if (ok) {
        nodes.push(
          txt(
            'Proof verified · Approval permitted',
            0,
            sy + 132,
            30,
            ROLE.evidence,
            'sans',
            'center',
          )
            .glow(7, ROLE.evidence)
            .opacity(showAllow.value * alpha),
        );
      }
    }

    // Bottom prompt / verdict / finale takeaway (one line at a time!)
    if (showAudit.value > 0.5) {
      nodes.push(
        txt(
          'Evaluate the 09:00 decision using only the 09:00 evidence.',
          0,
          405,
          36,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(9, ROLE.gold)
          .opacity(showAudit.value * alpha),
      );
    } else if (rep && showPredGate.value > 0.5 && showAllow.value < 0.5) {
      nodes.push(
        txt(
          'Same approval proposal with verified proof: what executes now?',
          0,
          405,
          34,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(showPredGate.value * alpha),
      );
    } else if (!rep && isFallback.value > 0.5) {
      nodes.push(
        txt(
          'Speed score changes the proposal; P-7 decides what executes.',
          0,
          405,
          32,
          ROLE.review,
          'serif',
          'center',
        ).opacity(isFallback.value * alpha),
      );
    } else if (!rep && showPredSpeed.value > 0.5 && showProp.value < 0.5) {
      nodes.push(
        txt('Which action will the speed score propose?', 0, 405, 36, ROLE.gold, 'serif', 'center')
          .glow(8, ROLE.gold)
          .opacity(showPredSpeed.value * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.evidence), title, riskLayer, gateLayer);

  // View 1: 4% -> 5% knife-edge flip
  playCue(s, c, 'four', (d) => s.play(showFour.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'first-mean', (d) => s.play(showMarker.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'first-choice', (d) => s.play(showFirstChoice.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'fifth',
    (d) => s.play(isFifth.to(1, { duration: 0.2 }), p.to(5, { duration: d })),
    { after: true, dur: 0.55 },
  );
  playCue(s, c, 'predict', (d) => s.play(showPredFlip.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'difference', (d) => s.play(showDiff.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'new-mean', (d) => s.play(showNewMean.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'safe-choice', (d) => s.play(showSafeChoice.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  // View 2: Speed score & P-7 authorization gate
  playCue(s, c, 'speed', (d) => s.play(swapVis(vRisk, vGate, d)), { dur: 0.65 });
  playCue(s, c, 'speed-approve', (d) => s.play(spApp.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'speed-ask', (d) => s.play(spAsk.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'speed-review', (d) => s.play(spRev.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'predict-speed', (d) => s.play(showPredSpeed.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'propose', (d) => s.play(showProp.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'gate', (d) => s.play(gatePos.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'empty', (d) => s.play(flashEmpty.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'denied', (d) => s.play(showDenied.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'fallback',
    (d) => s.play(isFallback.to(1, { duration: 0.25 }), gatePos.to(2, { duration: d })),
    { after: true, dur: 0.75 },
  );

  // Replay with verified evidence
  playCue(s, c, 'replay', (d) => s.play(isReplay.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'verified', (d) => s.play(isVerified.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'same-proposal', (d) => s.play(replayPos.to(1, { duration: d })), {
    after: true,
    dur: 0.65,
  });
  playCue(s, c, 'predict-gate', (d) => s.play(showPredGate.to(1, { duration: d })), { dur: 0.35 });
  playCue(
    s,
    c,
    'allow',
    (d) => s.play(showAllow.to(1, { duration: 0.3 }), replayPos.to(2, { duration: d })),
    { after: true, dur: 0.75 },
  );
  playCue(s, c, 'audit', (d) => s.play(showAudit.to(1, { duration: d })), { dur: 0.45 });
}
