// Scene 11: llm-policy - "What did each token earn?"
// View 1: Next-token probability ribbon + prefix append, PPO 4-role orbital constellation,
//         and live PPO clipping curve clamping ratio 1.4 at ceiling 1.2.
// View 2: GRPO group normalization (0, 1, 2 -> -1.225, 0.000, +1.225) broadcasting scores
//         back to tokens, then tied-reward replay (1, 1, 1) with strict prediction withholding!
import { fadeIn, line } from 'vizmatic/stage';
import {
  ACTION_COLORS,
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  drawProbRibbon,
  glowArcArrow,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  swapVis,
  txt,
  updatedPolicy,
} from '../parts.mjs';

export default function llmPolicy(s, c) {
  const title = heroTitle(['What did each', 'token earn?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.violet,
  });

  const vPPO = s.value(1);
  const vGRPO = s.value(0);

  // View 1 state (Token action + PPO roles + live clip curve)
  const useTokenNames = s.value(0);
  const appendT = s.value(0);
  const litActor = s.value(0);
  const litCritic = s.value(0);
  const litReward = s.value(0);
  const litRef = s.value(0);
  const litOld = s.value(0);
  const showClipLimit = s.value(0);
  const ratioVal = s.value(1.0); // moves 1.0 -> 1.4 on clip-ratio
  const showClipScore = s.value(0);

  // View 2 state (GRPO 3 completions + tied-reward prediction)
  const r0 = s.value(0);
  const r1 = s.value(0);
  const r2 = s.value(0);
  const showNorm = s.value(0);
  const showRel = s.value(0);
  const showTokScores = s.value(0);
  const tiedMode = s.value(0); // 1 after equal-input (rewards all = 1, scores cleared!)
  const showEqPrompt = s.value(0);
  const showEqAns = s.value(0);
  const hiLimits = s.value(0);

  const eqGRPO = glowTex('A_i = \\frac{r_i - \\mu}{\\sigma + \\varepsilon}', {
    x: 485,
    y: -380,
    size: 38,
    color: ROLE.gold,
    glow: 7,
  });

  // Compute exact GRPO scores
  const eps = 1e-6;
  const norm = (arr) => {
    const mu = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sd = Math.sqrt(arr.reduce((a, b) => a + (b - mu) ** 2, 0) / arr.length);
    return arr.map((r) => (r - mu) / (sd + eps));
  };
  const baseRewards = [0, 1, 2];
  const baseRel = norm(baseRewards);
  const tiedRewards = [1, 1, 1];
  const tiedRel = norm(tiedRewards);

  // VIEW 1: Token Action + PPO Orbital Roles + Live PPO Clipping Curve
  const ppoLayer = guardedDynamic(vPPO, (alpha) => {
    const names =
      useTokenNames.value > 0.5
        ? ['Approve', 'Request', 'Review']
        : ['Approve', 'Evidence', 'Review'];
    const nodes = [
      ...drawProbRibbon({
        cx: 130,
        cy: -345,
        width: 1120,
        height: 44,
        probs: updatedPolicy,
        names,
        colors: ACTION_COLORS,
        alpha,
      }),
    ];

    // Prefix append strip
    const pxY = -205;
    nodes.push(
      txt('Prefix:', -785, pxY, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      lumBar(-545, pxY, 230, 48, { color: ROLE.state, fillOpacity: 0.25, opacity: alpha }),
      txt('REQ-10234', -545, pxY, 28, ROLE.state, 'mono', 'center').opacity(alpha),
      txt('→', -390, pxY, 32, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );
    if (appendT.value > 0.05) {
      // Glide purely horizontally into prefix slot (never crossing the ribbon percentages above!)
      const tx = -230 + (1 - appendT.value) * 320;
      const ty = pxY;
      nodes.push(
        lumBar(tx, ty, 200, 48, {
          color: ROLE.evidence,
          fillOpacity: 0.36,
          glow: 10,
          opacity: appendT.value * alpha,
        }),
        txt('Request', tx, ty, 30, ROLE.evidence, 'mono', 'center').opacity(appendT.value * alpha),
      );
    }

    nodes.push(
      rule(-845, -135, 845, -135, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      rule(65, -110, 65, 420, COSMOS.rule, 1.6).opacity(0.55 * alpha),
    );

    // Bottom-left: PPO Orbital Constellation (Actor -> 4 roles)
    const ax = -675;
    const ay = 145;
    const aLit = litActor.value > 0.5;
    nodes.push(
      txt('PPO Training Roles', -420, -90, 30, ROLE.violet, 'serif', 'center').opacity(alpha),
      glowRing(ax, ay, 72, aLit ? ROLE.gold : ROLE.state, {
        width: aLit ? 4.4 : 3.2,
        glow: aLit ? 14 : 8,
      }).opacity(alpha),
      txt('Actor', ax, ay, 30, aLit ? ROLE.gold : ROLE.state, 'sans', 'center').opacity(alpha),
    );

    const roleNodes = [
      { y: -15, name: 'Critic', sub: 'Prefix value', lit: litCritic.value, col: ROLE.violet },
      {
        y: 92,
        name: 'Reward model',
        sub: 'Completion score',
        lit: litReward.value,
        col: ROLE.evidence,
      },
      {
        y: 199,
        name: 'Rollout policy',
        sub: 'Ratio denominator',
        lit: litOld.value,
        col: ROLE.gold,
      },
      { y: 306, name: 'Frozen ref', sub: 'KL penalty', lit: litRef.value, col: ROLE.review },
    ];
    roleNodes.forEach((rn) => {
      const on = rn.lit > 0.5;
      const op = (0.45 + 0.55 * rn.lit) * alpha;
      nodes.push(
        glowArcArrow([ax + 74, ay], [-415, rn.y], 0, {
          color: on ? rn.col : COSMOS.dim,
          width: on ? 3.6 : 2.0,
          glow: on ? 10 : 3,
          opacity: op,
        }),
        glowDot(-385, rn.y, { radius: 8, color: rn.col, glow: on ? 12 : 4, opacity: op }),
        txt(rn.name, -355, rn.y, 28, on ? rn.col : COSMOS.ink, 'sans', 'left')
          .glow(on ? 7 : 0, rn.col)
          .opacity(op),
        txt(rn.sub, -110, rn.y, 26, COSMOS.muted, 'mono', 'left').opacity(op),
      );
    });

    // Bottom-right: Live PPO Clipping Curve (ratio r vs clipped objective, A = +1, clip = 1.2)
    const gx0 = 195;
    const gx1 = 795;
    const gy0 = 315;
    const gy1 = -25;
    const xOf = (r) => gx0 + ((r - 0.6) / 1.0) * (gx1 - gx0);
    const yOf = (val) => gy0 - ((val - 0.6) / 1.0) * (gy0 - gy1);

    nodes.push(
      txt('PPO Clipping (A = +1)', 495, -90, 30, ROLE.gold, 'serif', 'center').opacity(alpha),
      line([gx0, gy0], [gx1, gy0], { stroke: '#4d608e', width: 2.5 }).opacity(alpha),
      line([gx0, gy0], [gx0, gy1], { stroke: '#4d608e', width: 2.5 }).opacity(alpha),
      txt('Ratio r', 495, gy0 + 54, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('1.0', xOf(1.0), gy0 + 30, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('1.2', xOf(1.2), gy0 + 30, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('1.4', xOf(1.4), gy0 + 30, 26, ROLE.amber, 'mono', 'center').opacity(alpha),
    );

    // Unclipped diagonal (dashed faint) + clipped plateau curve
    const clipOp = (0.35 + 0.65 * showClipLimit.value) * alpha;
    nodes.push(
      line([xOf(0.7), yOf(0.7)], [xOf(1.5), yOf(1.5)], {
        stroke: COSMOS.dim,
        width: 2.2,
        dash: [8, 7],
      }).opacity(0.65 * clipOp),
      glowingTrail(
        [
          [xOf(0.7), yOf(0.7)],
          [xOf(1.2), yOf(1.2)],
          [xOf(1.52), yOf(1.2)],
        ],
        { color: ROLE.evidence, width: 4.5, glow: 10, opacity: clipOp },
      ),
    );

    if (showClipLimit.value > 0.05) {
      nodes.push(
        line([gx0, yOf(1.2)], [gx1, yOf(1.2)], { stroke: ROLE.gold, width: 2.4, dash: [8, 6] })
          .glow(6, ROLE.gold)
          .opacity(showClipLimit.value * alpha),
        txt('Clip 1.2', gx1 - 12, yOf(1.2) - 32, 26, ROLE.gold, 'mono', 'right').opacity(
          showClipLimit.value * alpha,
        ),
      );
    }

    // Live point gliding from r = 1.0 -> r = 1.4 while clamped at y = 1.2
    const rv = ratioVal.value;
    const clippedY = Math.min(rv, 1.2);
    if (showClipLimit.value > 0.5) {
      nodes.push(
        glowDot(xOf(rv), yOf(clippedY), {
          radius: 11,
          color: ROLE.amber,
          glow: 14,
          opacity: alpha,
        }),
      );
      if (rv > 1.22) {
        // Place below the flat plateau so it never touches the unclipped dashed diagonal above!
        nodes.push(
          txt(
            `r = ${rv.toFixed(1)}`,
            xOf(rv),
            yOf(clippedY) + 48,
            28,
            ROLE.amber,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
      if (showClipScore.value > 0.05) {
        nodes.push(
          txt('Clipped score stays 1.2', 495, 405, 30, ROLE.evidence, 'mono', 'center')
            .glow(7, ROLE.evidence)
            .opacity(showClipScore.value * alpha),
        );
      }
    }

    return nodes;
  });

  // VIEW 2: GRPO Group Normalization & Tied-Reward Prediction
  const grpoLayer = guardedDynamic(vGRPO, (alpha) => {
    const isTied = tiedMode.value > 0.5;
    const nodes = [
      txt(
        'Prompt: "REQ-10234: Route this access request."',
        -845,
        -255,
        26,
        ROLE.state,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    if (isTied) {
      nodes.push(
        txt('Mean = 1 · SD = 0 · ε = 1e-6', 845, -255, 26, ROLE.gold, 'mono', 'right').opacity(
          alpha,
        ),
      );
    } else if (showNorm.value > 0.05) {
      nodes.push(
        txt('Mean = 1 · SD ≈ 0.82 · ε = 1e-6', 845, -255, 26, ROLE.gold, 'mono', 'right').opacity(
          showNorm.value * alpha,
        ),
      );
    }

    nodes.push(rule(-845, -210, 845, -210, COSMOS.rule, 1.8).opacity(0.6 * alpha));

    const completions = [
      { y: -115, toks: ['Approve', 'access', '.'], col: ROLE.approve, vis: r0.value },
      { y: 55, toks: ['Request', 'evidence', '.'], col: ROLE.evidence, vis: r1.value },
      { y: 225, toks: ['Review', 'this', 'request'], col: ROLE.review, vis: r2.value },
    ];

    completions.forEach((comp, i) => {
      const rew = isTied ? tiedRewards[i] : baseRewards[i];
      const rel = isTied ? tiedRel[i] : baseRel[i];
      const showScore = isTied ? showEqAns.value > 0.5 : showRel.value > 0.5;
      const showToks = isTied ? showEqAns.value > 0.5 : showTokScores.value > 0.5;
      const rewVis = isTied ? 1 : comp.vis;

      // 3 glowing token chips per completion
      comp.toks.forEach((tk, j) => {
        const tx = -695 + j * 245;
        nodes.push(
          lumBar(tx, comp.y, 215, 56, {
            color: comp.col,
            fillOpacity: hiLimits.value > 0.5 ? 0.36 : 0.22,
            strokeWidth: hiLimits.value > 0.5 ? 3 : 2,
            glow: hiLimits.value > 0.5 ? 10 : 5,
            opacity: alpha,
          }),
          txt(tk, tx, comp.y, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
        );
        if (showToks) {
          const sTxt = isTied ? '0' : rel >= 0 ? `+${rel.toFixed(3)}` : rel.toFixed(3);
          nodes.push(
            txt(sTxt, tx, comp.y + 52, 26, isTied ? ROLE.gold : comp.col, 'mono', 'center').opacity(
              alpha,
            ),
          );
        } else if (isTied && showEqPrompt.value > 0.5) {
          nodes.push(txt('?', tx, comp.y + 52, 26, ROLE.gold, 'mono', 'center').opacity(alpha));
        }
      });

      // Verifier reward orb on right (radius 58 gives generous clearance around "r = 0")
      if (rewVis > 0.05) {
        nodes.push(
          glowRing(255, comp.y, 58, isTied ? ROLE.gold : comp.col, { width: 3.2, glow: 9 }).opacity(
            rewVis * alpha,
          ),
          txt(
            `r = ${rew}`,
            255,
            comp.y,
            28,
            isTied ? ROLE.gold : comp.col,
            'mono',
            'center',
          ).opacity(rewVis * alpha),
        );
      }

      // Normalized group score readout + backward arrow to tokens
      if (showScore) {
        const sTxt = isTied ? 'Score = 0' : `Score = ${rel >= 0 ? '+' : ''}${rel.toFixed(3)}`;
        nodes.push(
          txt(sTxt, 615, comp.y, 34, isTied ? ROLE.gold : comp.col, 'mono', 'center')
            .glow(8, isTied ? ROLE.gold : comp.col)
            .opacity(alpha),
        );
        if (showToks) {
          nodes.push(
            glowArcArrow([190, comp.y], [10, comp.y], 0, {
              color: isTied ? ROLE.gold : comp.col,
              width: 3,
              glow: 8,
              opacity: 0.85 * alpha,
            }),
          );
        }
      } else if (isTied) {
        nodes.push(txt('Score = ?', 615, comp.y, 34, ROLE.gold, 'mono', 'center').opacity(alpha));
      }
    });

    // Bottom prompt / verdict (strict prediction withholding on tied rewards!)
    if (isTied && showEqAns.value > 0.5) {
      nodes.push(
        txt(
          'Zero reward signal for every token · Reference KL penalty can still act.',
          0,
          395,
          30,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(7, ROLE.gold)
          .opacity(showEqAns.value * alpha),
      );
    } else if (isTied && showEqPrompt.value > 0.5) {
      nodes.push(
        txt(
          'Every reply earns 1. What normalized score reaches each token now?',
          0,
          395,
          34,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(showEqPrompt.value * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.violet, ROLE.state), title, ppoLayer, grpoLayer);

  playCue(s, c, 'tokens', (d) => s.play(useTokenNames.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'append', (d) => s.play(appendT.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'actor', (d) => s.play(litActor.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'critic', (d) => s.play(litCritic.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'reward', (d) => s.play(litReward.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'reference', (d) => s.play(litRef.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'old-policy', (d) => s.play(litOld.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'clip-limit', (d) => s.play(showClipLimit.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'clip-ratio', (d) => s.play(ratioVal.to(1.4, { duration: d })), {
    after: true,
    dur: 0.65,
  });
  playCue(s, c, 'clip-score', (d) => s.play(showClipScore.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });

  // Switch cleanly to View 2 (GRPO): fade eqGRPO in ONLY after vPPO has faded out!
  playCue(s, c, 'group', (d) => s.play(swapVis(vPPO, vGRPO, d)), { dur: 0.65 });
  c.on(
    'group',
    () => {
      s.add(eqGRPO);
      s.play(fadeIn(eqGRPO, { duration: 0.3 }));
    },
    0.34,
  );
  playCue(s, c, 'reward-approve', (d) => s.play(r0.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'reward-proof', (d) => s.play(r1.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'reward-review', (d) => s.play(r2.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'normalize', (d) => s.play(showNorm.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'relative', (d) => s.play(showRel.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'token-score', (d) => s.play(showTokScores.to(1, { duration: d })), { dur: 0.55 });

  // Tied-reward prediction (strictly withholds 0 until 'equal'!)
  playCue(s, c, 'equal-input', (d) => s.play(tiedMode.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'equal-question', (d) => s.play(showEqPrompt.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'equal', (d) => s.play(showEqAns.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'limits', (d) => s.play(hiLimits.to(1, { duration: d })), { dur: 0.4 });
}
