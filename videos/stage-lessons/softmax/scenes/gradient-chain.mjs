// Scene 06 (gradient-chain): "What moves when one score rises?"
// Zero-sum probability perturbation bars -> Softmax Jacobian -> Chain-rule cancellation to p - y.
import {
  COSMOS,
  GRAD,
  LOGITS,
  MARK_COLOR,
  MODEL,
  PROBS,
  TARGET,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  crossSwap,
  glowArrow,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  stableSoftmax,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

const JAC = MODEL.jacobian;
const NUDGE = 0.5;
const NUDGED_PROBS = stableSoftmax([LOGITS[0], LOGITS[1] + NUDGE, LOGITS[2]]);
const DELTAS = NUDGED_PROBS.map((p, i) => p - PROBS[i]);

export default function gradientChain(s, c) {
  const phase = s.value(0);
  const vNudge = s.value(1);
  const vCancel = s.value(0);

  const nudgeAmt = s.value(0);
  const showJacFormula = s.value(0);
  const showColSum = s.value(0);

  const showSelf = s.value(0);
  const showRan = s.value(0);
  const showAte = s.value(0);
  const showLossSlope = s.value(0);

  const showTargetRoute = s.value(0);
  const showTargetCancel = s.value(0);
  const showTargetGrad = s.value(0);
  const showCompRoute = s.value(0);
  const showCompCancel = s.value(0);
  const showCompGrad = s.value(0);
  const showNormRule = s.value(0);
  const showLseRoute = s.value(0);

  const bgAura = aura(0, 20, 620, '#182b5230', '#2b1b4a18');
  const title = heroTitle(['What Moves When', 'One Score Rises?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: TARGET_COLOR,
    eyebrow: 'SOFTMAX JACOBIAN & CHAIN RULE',
  });

  const eqJac = glowTex('\\frac{\\partial p_i}{\\partial z_j} = p_i(\\delta_{ij} - p_j)', {
    x: 410,
    y: -275,
    size: 42,
    color: COSMOS.cyan,
    glow: 7,
  });

  // View 1: Signed zero-sum probability shift bars + Softmax Jacobian column
  const view1 = guardedDynamic(vNudge, (a) => {
    const n = nudgeAmt.value;
    const colSum = showColSum.value;
    const axisX = -320;
    const scale = 2800;

    const nodes = [
      txt(
        n > 0.1
          ? `Nudge z_slept by +${(NUDGE * n).toFixed(2)}  →  zero-sum probability shift`
          : 'If z_slept rises, where does its extra probability come from?',
        -855,
        -225,
        30,
        n > 0.1 ? TARGET_COLOR : MARK_COLOR,
        'sans',
        'left',
      ).opacity(a),
      rule(axisX, -155, axisX, 235, COSMOS.muted, 2.5).opacity(a * 0.8),
      txt('0', axisX, 265, 26, COSMOS.muted, 'mono').opacity(a),
      txt('−Δp (give up)', axisX - 240, -172, 26, COSMOS.muted, 'mono').opacity(a),
      txt('+Δp (gain)', axisX + 185, -172, 26, TARGET_COLOR, 'mono').opacity(a),
    ];

    WORDS.forEach((w, i) => {
      const y = -80 + i * 120;
      const d = DELTAS[i] * n;
      const bw = Math.abs(d) * scale;
      const cx = d >= 0 ? axisX + bw / 2 : axisX - bw / 2;
      nodes.push(txt(w, -855, y, 32, WORD_COLOR[i], 'sans', 'left').opacity(a));
      if (bw >= 3) {
        nodes.push(
          lumBar(cx, y, bw, 54, {
            color: WORD_COLOR[i],
            fillOpacity: 0.78,
            strokeWidth: 2,
            glow: 9,
            opacity: a,
          }),
          txt(
            `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%`,
            d >= 0 ? axisX + bw + 22 : axisX - bw - 22,
            y,
            28,
            WORD_COLOR[i],
            'mono',
            d >= 0 ? 'left' : 'right',
          ).opacity(a),
        );
      }
    });

    // Always-visible live conserved ribbon on lower-right showing the zero-sum trade directly
    const curProbs = stableSoftmax([LOGITS[0], LOGITS[1] + NUDGE * n, LOGITS[2]]);
    nodes.push(
      txt('LIVE UNIT BUDGET (Σ p_i = 1.000)', 130, 240, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      ...unitRibbon(130, 305, 710, 52, curProbs, WORD_COLOR, { opacity: a }),
      txt(
        `ran ${(curProbs[0] * 100).toFixed(1)}% · slept ${(curProbs[1] * 100).toFixed(1)}% · ate ${(curProbs[2] * 100).toFixed(1)}%`,
        485,
        376,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    if (showJacFormula.value > 0.02) {
      const jf = showJacFormula.value * a;
      nodes.push(
        txt('COLUMN j = slept (LOCAL SLOPES)', 410, -165, 26, COSMOS.muted, 'mono').opacity(jf),
      );
      WORDS.forEach((w, i) => {
        const slope = JAC[i][TARGET];
        const y = -95 + i * 74;
        nodes.push(
          txt(
            `∂p_${w} / ∂z_slept = ${slope >= 0 ? '+' : ''}${slope.toFixed(4)}`,
            410,
            y,
            28,
            WORD_COLOR[i],
            'mono',
          ).opacity(jf),
        );
      });
    }

    if (colSum > 0.02) {
      nodes.push(
        rule(180, 112, 640, 112, COSMOS.rule, 2).opacity(colSum * a),
        txt('Column sum = 0.0000 (unit budget conserved)', 410, 158, 28, MARK_COLOR, 'mono')
          .glow(6, MARK_COLOR)
          .opacity(colSum * a),
      );
    }

    return nodes;
  });

  // View 2: Target row slopes × (-1 / p_slept) -> clean cancellation to p - y
  const view2 = guardedDynamic(vCancel, (a) => {
    const sSelf = showSelf.value;
    const sRan = showRan.value;
    const sAte = showAte.value;
    const sSlope = showLossSlope.value;

    const tR = showTargetRoute.value;
    const tC = showTargetCancel.value;
    const tG = showTargetGrad.value;
    const cR = showCompRoute.value;
    const cC = showCompCancel.value;
    const cG = showCompGrad.value;
    const nR = showNormRule.value;
    const lse = showLseRoute.value;

    const nodes = [
      txt(
        'TARGET SHARE SLOPES  ∂p_slept / ∂z_j',
        -855,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      // Top-right persistent chain-rule flow diagram (fills upper-right cleanly during Beat 3)
      lumBar(225, -350, 140, 58, { color: COSMOS.cyan, fillOpacity: 0.2, glow: 6, opacity: a }),
      txt('z_j', 225, -350, 28, COSMOS.cyan, 'mono').opacity(a),
      glowArrow([305, -350], [385, -350], COSMOS.cyan, { opacity: a }),
      lumBar(485, -350, 180, 58, { color: TARGET_COLOR, fillOpacity: 0.22, glow: 7, opacity: a }),
      txt('p_slept', 485, -350, 28, TARGET_COLOR, 'mono').opacity(a),
      glowArrow([585, -350], [665, -350], MARK_COLOR, { opacity: a }),
      lumBar(760, -350, 170, 58, { color: MARK_COLOR, fillOpacity: 0.22, glow: 7, opacity: a }),
      txt('L = −ln p', 760, -350, 28, MARK_COLOR, 'mono').opacity(a),
      // Persistent visual sensitivity bars on lower-left (clean non-overlapping P5 handoff to nR)
      ...(Math.max(0, 1 - nR * 2.6) > 0.02
        ? [
            txt(
              'SENSITIVITY MAGNITUDES  |∂p_slept / ∂z_j|',
              -855,
              245,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ).opacity(a * Math.max(0, 1 - nR * 2.6)),
            lumBar(-855 + 240, 305, 480, 26, {
              color: WORD_COLOR[1],
              fillOpacity: 0.72,
              glow: 7,
              opacity: a * Math.max(0, 1 - nR * 2.6),
            }),
            txt('slept +0.101', -355, 305, 26, WORD_COLOR[1], 'mono', 'left').opacity(
              a * Math.max(0, 1 - nR * 2.6),
            ),
            lumBar(-855 + 228, 350, 456, 26, {
              color: WORD_COLOR[0],
              fillOpacity: 0.72,
              glow: 7,
              opacity: a * Math.max(0, 1 - nR * 2.6),
            }),
            txt('ran −0.096', -380, 350, 26, WORD_COLOR[0], 'mono', 'left').opacity(
              a * Math.max(0, 1 - nR * 2.6),
            ),
            lumBar(-855 + 14, 395, 28, 26, {
              color: WORD_COLOR[2],
              fillOpacity: 0.72,
              glow: 7,
              opacity: a * Math.max(0, 1 - nR * 2.6),
            }),
            txt('ate −0.005', -810, 395, 26, WORD_COLOR[2], 'mono', 'left').opacity(
              a * Math.max(0, 1 - nR * 2.6),
            ),
          ]
        : []),
    ];

    const rows = [
      {
        label: '∂p_slept / ∂z_slept',
        expr: 'p_s (1 − p_s)',
        val: `+${JAC[TARGET][1].toFixed(4)}`,
        col: WORD_COLOR[1],
        vis: sSelf,
      },
      {
        label: '∂p_slept / ∂z_ran',
        expr: '−p_s · p_ran',
        val: `${JAC[TARGET][0].toFixed(4)}`,
        col: WORD_COLOR[0],
        vis: sRan,
      },
      {
        label: '∂p_slept / ∂z_ate',
        expr: '−p_s · p_ate',
        val: `${JAC[TARGET][2].toFixed(4)}`,
        col: WORD_COLOR[2],
        vis: sAte,
      },
    ];

    rows.forEach((r, idx) => {
      if (r.vis > 0.02) {
        const y = -165 + idx * 82;
        nodes.push(
          txt(r.label, -855, y, 28, r.col, 'mono', 'left').opacity(r.vis * a),
          txt(`= ${r.expr} = ${r.val}`, -430, y, 28, COSMOS.ink, 'mono', 'left').opacity(r.vis * a),
        );
      }
    });

    if (sSlope > 0.02) {
      nodes.push(
        txt(
          `× Loss slope:  ∂L / ∂p_slept = −1 / p_slept = ${MODEL.targetSlope.toFixed(2)}`,
          -855,
          98,
          28,
          MARK_COLOR,
          'mono',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(sSlope * a),
      );
    }

    // Right side: crisp cancellation steps (luminous guide rails keep right half balanced!)
    const rx = 110;
    nodes.push(
      rule(rx, -82, 820, -82, COSMOS.cyan, 2.5).opacity(0.65 * a),
      rule(rx, 128, 820, 128, COSMOS.cyan, 2.5).opacity(0.65 * a),
      txt('CHAIN-RULE CANCELLATION ROUTES', rx, -280, 26, COSMOS.muted, 'mono', 'left').opacity(
        0.75 * a,
      ),
    );
    if (tR > 0.02) {
      nodes.push(
        txt('TARGET (slept):', rx, -235, 26, TARGET_COLOR, 'mono', 'left').opacity(tR * a),
        txt('p_s (1 − p_s) · (−1 / p_s)', rx, -182, 28, COSMOS.ink, 'mono', 'left').opacity(tR * a),
      );
    }
    if (tC > 0.02) {
      nodes.push(
        txt('p_s cancels!', rx + 515, -182, 26, MARK_COLOR, 'mono', 'left').opacity(tC * a),
      );
    }
    if (tG > 0.02) {
      nodes.push(
        txt(`⇒  p_slept − 1 = ${GRAD[1].toFixed(3)}`, rx, -125, 32, TARGET_COLOR, 'mono', 'left')
          .glow(7, TARGET_COLOR)
          .opacity(tG * a),
      );
    }

    if (cR > 0.02) {
      nodes.push(
        txt('COMPETITOR (ran):', rx, -28, 26, WORD_COLOR[0], 'mono', 'left').opacity(cR * a),
        txt('(−p_s · p_ran) · (−1 / p_s)', rx, 25, 28, COSMOS.ink, 'mono', 'left').opacity(cR * a),
      );
    }
    if (cC > 0.02) {
      nodes.push(txt('(−)(−) = +', rx + 520, 25, 26, MARK_COLOR, 'mono', 'left').opacity(cC * a));
    }
    if (cG > 0.02) {
      nodes.push(
        txt(`⇒  +p_ran = +${GRAD[0].toFixed(3)}`, rx, 82, 32, WORD_COLOR[0], 'mono', 'left')
          .glow(7, WORD_COLOR[0])
          .opacity(cG * a),
      );
    }

    const nROp = Math.max(0, (nR - 0.45) / 0.55) * a;
    if (nROp > 0.02) {
      nodes.push(
        rule(-855, 192, 855, 192, COSMOS.rule, 2).opacity(nROp),
        txt('FULL GRADIENT:   ∇_z L = p − y', -855, 265, 42, MARK_COLOR, 'mono', 'left')
          .glow(9, MARK_COLOR)
          .opacity(nROp),
      );
    }
    if (lse > 0.02) {
      nodes.push(
        txt(
          'Shortcut:  ∂/∂z_i [ log Σ e^{z_j} ] = p_i',
          65,
          265,
          30,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(lse * a),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, view1, view2);
  runAmbientPhase(s, c, phase, 2.2);

  // Beat 0-2 cues
  c.on('gradient-chain-0', () => {
    s.play(nudgeAmt.to(0.01, { duration: 0.2 }));
  });
  tweenCue(s, c, 'jacobian-nudge', nudgeAmt, 1, { duration: 0.85 });
  c.on('jacobian-formula', () => {
    s.play(nudgeAmt.to(0, { duration: 0.7 }));
    s.play(showJacFormula.to(1, { duration: 0.55 }));
  });
  c.show('jacobian-formula', eqJac);
  tweenCue(s, c, 'jacobian-column', showColSum, 1, { duration: 0.5, after: true });

  // Beat 3-4 transition & cancellation cues
  c.hide('gradient-chain-1', eqJac);
  crossSwap(s, c, 'gradient-chain-1', vNudge, vCancel, { duration: 0.55 });
  tweenCue(s, c, 'jacobian-self', showSelf, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'jacobian-ran', showRan, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'jacobian-ate', showAte, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'jacobian-loss-slope', showLossSlope, 1, { duration: 0.45, after: true });

  tweenCue(s, c, 'gradient-chain-2', showTargetRoute, 0.35, { duration: 0.3 });
  tweenCue(s, c, 'chain-target-route', showTargetRoute, 1, { duration: 0.4 });
  tweenCue(s, c, 'chain-target-cancel', showTargetCancel, 1, { duration: 0.4 });
  tweenCue(s, c, 'chain-target', showTargetGrad, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'chain-competitor-route', showCompRoute, 1, { duration: 0.4 });
  tweenCue(s, c, 'chain-competitor-cancel', showCompCancel, 1, { duration: 0.4 });
  tweenCue(s, c, 'chain-competitor', showCompGrad, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'chain-normalized', showNormRule, 1, { duration: 0.5, after: true });
  tweenCue(s, c, 'chain-logsumexp', showLseRoute, 1, { duration: 0.5 });
}
