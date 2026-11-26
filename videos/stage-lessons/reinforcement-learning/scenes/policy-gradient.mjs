// Scene 10: policy-gradient - "How should the policy change its odds?"
// View 1: Glowing 2-step Bernoulli decision tree + REINFORCE MathJax + time-discount slope contrast.
// View 2: Baseline Variance Geometry - 3 luminous horizontal scatter rails (b = 0, 0.5, 10)
//         aligned along a single glowing vertical Mean = 0.25 beam (zero dry slide tables!).
// View 3: Router opening-logit update with continuous glowing softmax probability ribbon
//         morphing [33.3%, 33.3%, 33.3%] -> [7.7%, 41.5%, 50.8%] above advantage & slope bars.
import { line } from 'vizmatic/stage';
import {
  ACTIONS,
  ACTION_COLORS,
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  drawProbRibbon,
  gamma,
  glowArcArrow,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  openingBaseline,
  openingGradient,
  openingPolicyValues,
  playCue,
  rule,
  swapVis,
  txt,
  updatedPolicy,
} from '../parts.mjs';

export default function policyGradient(s, c) {
  const title = heroTitle(['How should the policy', 'change its odds?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.violet,
  });

  const v1 = s.value(1); // REINFORCE + 2-step coin
  const v2 = s.value(0); // Baseline variance geometry
  const v3 = s.value(0); // Router softmax update

  // View 1 state
  const showGammaT = s.value(0);
  const tossActive = s.value(0);
  const derivStage = s.value(0); // 0: setup, 1: 0.225, 2: 0.225 vs 0.25

  // View 2 state (3 baselines: 0, 0.5, 10)
  const rZero = s.value(0);
  const rHalf = s.value(0);
  const rTen = s.value(0);
  const showMeanBeam = s.value(0);
  const hiFixed = s.value(0);
  const hiTrueVal = s.value(0);

  // View 3 state (router softmax update)
  const hiReview = s.value(0);
  const updT = s.value(0); // interpolates 0 -> 1 from uniform to updatedPolicy
  const showScope = s.value(0);

  const eqReinforce = glowTex(
    '\\nabla_\\theta J(\\theta) = \\mathbb{E}\\!\\left[\\sum_t \\gamma^t G_t \\nabla_\\theta \\log \\pi_\\theta(a_t \\mid s_t)\\right]',
    { x: 200, y: -375, size: 30, color: ROLE.violet, glow: 6 },
  );

  // Compute exact baseline samples from the coin-toss model
  const samples = [0, 0.5, 10].map((b) => {
    const tails = (0 - 0.5) * (0 - b);
    const heads = (1 - 0.5) * (1 - b);
    const mean = (tails + heads) / 2;
    const variance = ((tails - mean) ** 2 + (heads - mean) ** 2) / 2;
    return { b, tails, heads, mean, variance };
  });

  // VIEW 1: Two-step Bernoulli tree + time weight gamma^t
  const layer1 = guardedDynamic(v1, (alpha) => {
    const nodes = [];
    const atToss = tossActive.value > 0.5;
    const ds = Math.round(derivStage.value);

    // Left: Glowing 2-step decision tree
    const pStart = [-730, 55];
    const pChoose = [-415, 55];
    const pHeads = [-70, -105];
    const pTails = [-70, 215];

    nodes.push(
      glowArcArrow([pStart[0] + 64, pStart[1]], [pChoose[0] - 68, pChoose[1]], 0, {
        color: ROLE.state,
        width: 3.6,
        glow: 9,
        opacity: alpha,
        photonT: tossActive.value > 0.02 && tossActive.value < 0.99 ? tossActive.value : null,
      }),
      glowArcArrow([pChoose[0] + 66, pChoose[1] - 18], [pHeads[0] - 68, pHeads[1]], -45, {
        color: ROLE.evidence,
        width: 3.4,
        glow: 8,
        opacity: alpha,
      }),
      glowArcArrow([pChoose[0] + 66, pChoose[1] + 18], [pTails[0] - 68, pTails[1]], 45, {
        color: ROLE.muted,
        width: 3.0,
        glow: 5,
        opacity: 0.85 * alpha,
      }),

      glowRing(pStart[0], pStart[1], 58, !atToss ? ROLE.gold : ROLE.state, {
        width: !atToss ? 4 : 2.8,
        glow: 10,
      }).opacity(alpha),
      txt('Start', pStart[0], pStart[1], 28, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('t = 0', pStart[0], pStart[1] + 84, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),

      glowRing(pChoose[0], pChoose[1], 62, atToss ? ROLE.gold : ROLE.violet, {
        width: atToss ? 4.4 : 3.0,
        glow: atToss ? 14 : 8,
      }).opacity(alpha),
      txt(
        'Coin',
        pChoose[0],
        pChoose[1],
        30,
        atToss ? ROLE.gold : ROLE.violet,
        'sans',
        'center',
      ).opacity(alpha),
      txt('t = 1', pChoose[0], pChoose[1] + 88, 26, ROLE.violet, 'mono', 'center').opacity(alpha),

      glowRing(pHeads[0], pHeads[1], 72, ROLE.evidence, { width: 3.4, glow: 9 }).opacity(alpha),
      txt('Heads', pHeads[0], pHeads[1] - 16, 28, ROLE.evidence, 'sans', 'center').opacity(alpha),
      txt('r = +1', pHeads[0], pHeads[1] + 22, 26, ROLE.evidence, 'mono', 'center').opacity(alpha),

      glowRing(pTails[0], pTails[1], 72, COSMOS.muted, { width: 2.8, glow: 5 }).opacity(alpha),
      txt('Tails', pTails[0], pTails[1] - 16, 28, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('r = 0', pTails[0], pTails[1] + 22, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),

      rule(125, -240, 125, 410, COSMOS.rule, 1.8).opacity(0.6 * alpha),
    );

    // Right: Fair coin slope & time-weight contrast
    const rx = 505;
    if (!atToss) {
      nodes.push(
        txt('From chosen action', rx, -120, 34, ROLE.state, 'serif', 'center').opacity(alpha),
        txt('Weight by reward-to-go G_t', rx, -65, 28, COSMOS.muted, 'sans', 'center').opacity(
          alpha,
        ),
      );
      if (showGammaT.value > 0.05) {
        nodes.push(
          txt('Objective from t = 0', rx, 80, 34, ROLE.gold, 'serif', 'center').opacity(
            showGammaT.value * alpha,
          ),
          txt('Multiply by time weight γ^t', rx, 140, 30, ROLE.gold, 'mono', 'center')
            .glow(7, ROLE.gold)
            .opacity(showGammaT.value * alpha),
        );
      }
    } else {
      nodes.push(
        txt('Fair coin at logit = 0', rx, -175, 34, ROLE.violet, 'serif', 'center').opacity(alpha),
        txt(
          'P(Heads) = 0.5   ·   dP / dθ = 0.25',
          rx,
          -110,
          28,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
      if (ds >= 1) {
        const local = gamma * 0.25;
        nodes.push(
          txt('With time weight γ¹ = 0.9:', rx, 10, 28, ROLE.gold, 'sans', 'center').opacity(alpha),
          txt(`0.9 × 0.25 = ${local}`, rx, 68, 44, ROLE.gold, 'mono', 'center')
            .glow(9, ROLE.gold)
            .opacity(alpha),
        );
      }
      if (ds >= 2) {
        nodes.push(
          txt('Drop γ¹ weight:', rx, 195, 28, ROLE.approve, 'sans', 'center').opacity(alpha),
          txt('0.25  (wrong for J at t = 0)', rx, 248, 32, ROLE.approve, 'mono', 'center')
            .glow(6, ROLE.approve)
            .opacity(alpha),
        );
      }
    }

    return nodes;
  });

  // VIEW 2: Baseline Variance Geometry (3 horizontal scatter rails on one shared Mean = 0.25 axis)
  const layer2 = guardedDynamic(v2, (alpha) => {
    const nodes = [
      txt(
        'One fair toss (reward paid now) · Subtract fixed baseline b',
        0,
        -290,
        32,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
      txt(
        'Sample gradient = (action - 0.5) × (reward - b)',
        0,
        -232,
        28,
        hiFixed.value > 0.5 ? ROLE.gold : ROLE.state,
        'mono',
        'center',
      )
        .glow(hiFixed.value > 0.5 ? 8 : 0, ROLE.gold)
        .opacity(alpha),
    ];

    const x0 = -475;
    const x1 = 445;
    const xOf = (v) => x0 + ((v + 5.2) / 10.6) * (x1 - x0);
    const meanX = xOf(0.25);

    // Shared vertical Mean = 0.25 beam
    const mOp = (0.38 + 0.62 * showMeanBeam.value) * alpha;
    nodes.push(
      line([meanX, -155], [meanX, 295], { stroke: ROLE.gold, width: 3.4, dash: [10, 7] })
        .glow(showMeanBeam.value > 0.5 ? 10 : 4, ROLE.gold)
        .opacity(mOp),
      txt('Mean = 0.25', meanX, -182, 28, ROLE.gold, 'mono', 'center')
        .glow(showMeanBeam.value > 0.5 ? 8 : 0, ROLE.gold)
        .opacity(mOp),
    );

    const rowVis = [rZero.value, rHalf.value, rTen.value];
    const rowCols = [ROLE.state, ROLE.evidence, ROLE.approve];
    const rowYs = [-75, 85, 245];

    samples.forEach((sm, i) => {
      const y = rowYs[i];
      const vis = rowVis[i];
      const col = rowCols[i];
      const isTrue = i === 1 && hiTrueVal.value > 0.5;

      // Baseline label on left
      nodes.push(
        txt(`b = ${sm.b}`, -705, y, 36, isTrue ? ROLE.gold : col, 'mono', 'center')
          .glow(isTrue ? 9 : 4, isTrue ? ROLE.gold : col)
          .opacity(alpha),
        line([x0, y], [x1, y], { stroke: '#3a4a70', width: 3.5 }).opacity(alpha),
      );

      if (vis > 0.05) {
        const tx = xOf(sm.tails);
        const hx = xOf(sm.heads);
        if (Math.abs(hx - tx) > 6) {
          nodes.push(
            line([tx, y], [hx, y], { stroke: col, width: 5 })
              .glow(8, col)
              .opacity(0.7 * vis * alpha),
            glowDot(tx, y, { radius: 11, color: col, glow: 12, opacity: vis * alpha }),
            glowDot(hx, y, { radius: 11, color: col, glow: 12, opacity: vis * alpha }),
            txt(
              `T: ${sm.tails}`,
              Math.min(tx - 16, meanX - 24),
              y + 42,
              26,
              col,
              'mono',
              'right',
            ).opacity(vis * alpha),
            txt(
              `H: ${sm.heads}`,
              Math.max(hx + 16, meanX + 24),
              y - 42,
              26,
              col,
              'mono',
              'left',
            ).opacity(vis * alpha),
          );
        } else {
          // Zero-variance exact coincidence at 0.25 (anchor cleanly right of meanX line!)
          nodes.push(
            glowDot(meanX, y, { radius: 15, color: ROLE.evidence, glow: 16, opacity: vis * alpha }),
            txt(
              'T = H = 0.25 (zero scatter)',
              meanX + 34,
              y - 40,
              26,
              ROLE.evidence,
              'mono',
              'left',
            )
              .glow(7, ROLE.evidence)
              .opacity(vis * alpha),
          );
        }

        // Variance readout on right
        nodes.push(
          txt(`Var = ${sm.variance}`, 685, y, 32, isTrue ? ROLE.gold : col, 'mono', 'center')
            .glow(isTrue ? 9 : 4, isTrue ? ROLE.gold : col)
            .opacity(vis * alpha),
        );
      }
    });

    if (showMeanBeam.value > 0.05) {
      nodes.push(
        txt(
          hiTrueVal.value > 0.5
            ? 'Subtracting V(s) estimates advantage A(s, a) = Q - V with far lower variance.'
            : 'All three baselines share exact mean 0.25; b = 0.5 eliminates gradient variance.',
          0,
          385,
          30,
          ROLE.evidence,
          'serif',
          'center',
        ).opacity(showMeanBeam.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 3: Router Opening-Logit Update (live softmax probability ribbon + slope bars)
  const layer3 = guardedDynamic(v3, (alpha) => {
    const t = updT.value;
    const curProbs = updatedPolicy.map((p) => (1 / 3) * (1 - t) + p * t);
    const nodes = [
      txt(
        'Opening action probabilities (25% leave rate)',
        0,
        -295,
        30,
        ROLE.state,
        'sans',
        'center',
      ).opacity(alpha),
      ...drawProbRibbon({
        cx: 0,
        cy: -185,
        width: 1420,
        height: 54,
        probs: curProbs,
        names: ACTIONS,
        colors: ACTION_COLORS,
        alpha,
      }),
      rule(-840, -68, 840, -68, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('Action', -655, -24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Return', -345, -24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Advantage (Q - V)', -10, -24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Logit slope', 355, -24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Updated P', 685, -24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    ];

    ACTIONS.forEach((act, i) => {
      const y = 62 + i * 102;
      const col = ACTION_COLORS[i];
      const isRev = i === 2 && hiReview.value > 0.5;
      const adv = (openingPolicyValues[i] - openingBaseline).toFixed(2);
      const slope = openingGradient[i].toFixed(2);
      const pTxt = t > 0.5 ? `${(updatedPolicy[i] * 100).toFixed(1)}%` : '33.3% → ?';

      // Luminous slope bar sits cleanly beside the slope number (never behind narrow text!)
      const barW = Math.min(145, Math.abs(openingGradient[i]) * 3.8);
      nodes.push(
        txt(act, -655, y, 32, isRev ? ROLE.gold : col, 'serif', 'center')
          .glow(isRev ? 9 : 3, isRev ? ROLE.gold : col)
          .opacity(alpha),
        txt(String(openingPolicyValues[i]), -345, y, 30, col, 'mono', 'center').opacity(alpha),
        txt(adv, -10, y, 30, col, 'mono', 'center').opacity(alpha),
        txt(slope, 265, y, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
        lumBar(355 + barW / 2, y, barW, 28, {
          color: col,
          fillOpacity: isRev ? 0.48 : 0.28,
          strokeWidth: isRev ? 3 : 1.8,
          glow: isRev ? 10 : 4,
          opacity: alpha,
        }),
        txt(pTxt, 685, y, 32, isRev ? ROLE.gold : col, 'mono', 'center')
          .glow(t > 0.5 && isRev ? 9 : 0, ROLE.gold)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        showScope.value > 0.5
          ? 'Exact opening-logit step (η = 0.03) · Trajectory trainers sample gradients'
          : `Initial policy mean V(New) = ${openingBaseline} · Equal starting odds (1/3 each)`,
        0,
        398,
        28,
        showScope.value > 0.5 ? ROLE.gold : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.violet, ROLE.evidence), title, eqReinforce, layer1, layer2, layer3);

  playCue(s, c, 'reinforce', (d) => s.play(showGammaT.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'bernoulli', (d) => s.play(tossActive.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'derivative', (d) => s.play(derivStage.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'wrong', (d) => s.play(derivStage.to(2, { duration: d })), {
    after: true,
    dur: 0.35,
  });

  // Switch to View 2 (Baseline Variance Geometry)
  c.hide('baseline', eqReinforce);
  playCue(s, c, 'baseline', (d) => s.play(swapVis(v1, v2, d)), { dur: 0.65 });
  playCue(s, c, 'zero-row', (d) => s.play(rZero.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'half-row', (d) => s.play(rHalf.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'ten-row', (d) => s.play(rTen.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'variance', (d) => s.play(showMeanBeam.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'baseline-fixed', (d) => s.play(hiFixed.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'true-value', (d) => s.play(hiTrueVal.to(1, { duration: d })), { dur: 0.4 });

  // Switch to View 3 (Router Softmax Update)
  playCue(s, c, 'router', (d) => s.play(swapVis(v2, v3, d)), { dur: 0.65 });
  playCue(s, c, 'row-review', (d) => s.play(hiReview.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'update', (d) => s.play(updT.to(1, { duration: d })), { after: true, dur: 0.85 });
  playCue(s, c, 'scope', (d) => s.play(showScope.to(1, { duration: d })), { dur: 0.4 });
}
