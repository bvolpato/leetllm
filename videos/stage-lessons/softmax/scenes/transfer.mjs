// Scene 10 (transfer): "What changes when the word changes?"
// Fresh example "The cat ate" -> joint product & summed mean loss -> relabel dog to "ate" (+1 nat).
import {
  COSMOS,
  DOG_ATE_TRACE,
  DOG_TRACE,
  FRESH_LOGITS,
  FRESH_TARGET,
  FRESH_TRACE,
  LOGITS,
  MARK_COLOR,
  PROBS,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  crossSwap,
  fmtPct,
  freshState,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  stableSoftmax,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

const CAT_FINAL = freshState(1);
const CAT_GRAD = FRESH_TRACE.probabilities.map((p, i) => p - Number(i === FRESH_TARGET));
const JOINT_PROB = DOG_TRACE.probabilities[1] * FRESH_TRACE.probabilities[2];
const SUM_LOSS = DOG_TRACE.loss + FRESH_TRACE.loss;
const MEAN_LOSS = SUM_LOSS / 2;
const DOG_ATE_GRAD = PROBS.map((p, i) => p - Number(i === 2));

export default function transfer(s, c) {
  const vCat = s.value(1);
  const vPair = s.value(0);
  const vRelabel = s.value(0);

  const catForward = s.value(0);
  const catTarget = s.value(0);
  const catPredict = s.value(0);
  const catGrad = s.value(0);
  const catUpdate = s.value(0);
  const catSmaller = s.value(0);

  const pairProd = s.value(0);
  const pairSum = s.value(0);
  const pairMean = s.value(0);
  const pairMost = s.value(0);

  const relabelTarget = s.value(0);
  const relabelLoss = s.value(0);
  const relabelGrad = s.value(0);

  const bgAura = aura(0, 20, 620, '#2b1b4a32', '#133a3d18');
  const title = heroTitle(['What Changes When', 'the Word Changes?'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: WORD_COLOR[2],
    eyebrow: 'TRANSFER & RELABELING',
  });

  // View 1: "The cat ate" fresh scores + prediction + smaller gradient update
  const viewCat = guardedDynamic(vCat, (a) => {
    const u = catUpdate.value;
    const zNow = FRESH_LOGITS.map((z, i) => z + (CAT_FINAL.logits[i] - z) * u);
    const pNow = stableSoftmax(zNow);

    const nodes = [
      txt('The cat', -855, -215, 64, COSMOS.ink, 'serif', 'left').opacity(a),
      txt(catTarget.value > 0.5 ? 'ate' : '___', -605, -215, 64, WORD_COLOR[2], 'serif', 'left')
        .glow(catTarget.value > 0.5 ? 8 : 0, WORD_COLOR[2])
        .opacity(a),
      txt(
        `Fresh logits: ran ${zNow[0].toFixed(2)}, slept ${zNow[1].toFixed(2)}, ate ${zNow[2].toFixed(2)}`,
        -855,
        -130,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity((0.35 + 0.65 * catForward.value) * a),
      ...unitRibbon(-855, -20, 820, 64, pNow, WORD_COLOR, { opacity: a }),
    ];

    WORDS.forEach((w, i) => {
      nodes.push(
        txt(
          `${w}  ${fmtPct(pNow[i])}`,
          -855 + i * 280,
          58,
          28,
          WORD_COLOR[i],
          'mono',
          'left',
        ).opacity(a),
      );
    });

    const predOp = catPredict.value * Math.max(0, 1 - catGrad.value * 2.6) * a;
    if (predOp > 0.02) {
      nodes.push(
        txt(
          'Which score gets the upward push? What is its gradient sign?',
          -855,
          175,
          32,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(predOp),
      );
    }

    const gradOp = Math.max(0, (catGrad.value - 0.45) / 0.55) * a;
    if (gradOp > 0.02) {
      nodes.push(
        txt(
          `ate gradient:  p_ate − 1 = ${FRESH_TRACE.probabilities[2].toFixed(3)} − 1 = ${CAT_GRAD[2].toFixed(3)} (< 0)`,
          -855,
          175,
          30,
          WORD_COLOR[2],
          'mono',
          'left',
        )
          .glow(7, WORD_COLOR[2])
          .opacity(gradOp),
      );
    }

    // Right-side persistent live score columns for "The cat" (keeps right half rich from t=0!)
    const catBaseY = 340;
    const catMaxH = 195;
    const catXs = [260, 480, 700];
    const colFade = Math.max(0, 1 - catSmaller.value * 2.6) * a;
    if (colFade > 0.02) {
      nodes.push(
        txt('FRESH CANDIDATE SHARES', 480, -205, 26, COSMOS.cyan, 'mono').opacity(colFade),
        rule(155, catBaseY, 805, catBaseY, COSMOS.rule, 2).opacity(colFade),
      );
      WORDS.forEach((w, i) => {
        const h = Math.max(8, pNow[i] * catMaxH);
        nodes.push(
          lumBar(catXs[i], catBaseY - h / 2, 108, h, {
            color: WORD_COLOR[i],
            fillOpacity: 0.72,
            glow: 9,
            opacity: colFade,
          }),
          txt(fmtPct(pNow[i]), catXs[i], catBaseY - h - 28, 26, WORD_COLOR[i], 'mono').opacity(
            colFade,
          ),
          txt(w, catXs[i], catBaseY + 38, 28, WORD_COLOR[i], 'sans').opacity(colFade),
        );
      });
    }

    const smOp = Math.max(0, (catSmaller.value - 0.45) / 0.55) * a;
    if (smOp > 0.02) {
      const rx = 180;
      nodes.push(
        txt('CORRECTION MAGNITUDE', rx, -195, 26, MARK_COLOR, 'mono', 'left').opacity(smOp),
        txt('slept (surprising, 11.4%)', rx, -110, 28, TARGET_COLOR, 'sans', 'left').opacity(smOp),
        lumBar(rx + 250, -52, 500, 38, {
          color: TARGET_COLOR,
          fillOpacity: 0.78,
          glow: 8,
          opacity: smOp,
        }),
        txt('|−0.886|', rx + 520, -52, 28, TARGET_COLOR, 'mono', 'left').opacity(smOp),
        txt('ate (likely, 73.6%)', rx, 45, 28, WORD_COLOR[2], 'sans', 'left').opacity(smOp),
        lumBar(rx + 75, 102, 150, 38, {
          color: WORD_COLOR[2],
          fillOpacity: 0.78,
          glow: 8,
          opacity: smOp,
        }),
        txt('|−0.264| (3.4× smaller)', rx + 170, 102, 28, WORD_COLOR[2], 'mono', 'left').opacity(
          smOp,
        ),
      );
    }

    return nodes;
  });

  // View 2: Combining both training examples (product -> sum -> mean)
  const viewPair = guardedDynamic(vPair, (a) => {
    const dBar = DOG_TRACE.loss * 175;
    const cBar = FRESH_TRACE.loss * 175;
    const nodes = [
      txt('TWO INITIAL PREDICTIONS', -855, -225, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt(
        `1. The dog slept:   p = ${DOG_TRACE.probabilities[1].toFixed(3)}   →   L₁ = ${DOG_TRACE.loss.toFixed(3)} nats`,
        -855,
        -140,
        30,
        TARGET_COLOR,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `2. The cat ate:     p = ${FRESH_TRACE.probabilities[2].toFixed(3)}   →   L₂ = ${FRESH_TRACE.loss.toFixed(3)} nats`,
        -855,
        -72,
        30,
        WORD_COLOR[2],
        'mono',
        'left',
      ).opacity(a),
      // Right-side visual loss comparison bars (present immediately when viewPair opens!)
      txt('INDIVIDUAL LOSSES (NATS)', 255, -225, 26, MARK_COLOR, 'mono', 'left').opacity(a),
      lumBar(255 + dBar / 2, -140, dBar, 42, {
        color: TARGET_COLOR,
        fillOpacity: 0.78,
        glow: 9,
        opacity: a,
      }),
      txt(
        `${DOG_TRACE.loss.toFixed(2)}`,
        270 + dBar,
        -140,
        28,
        TARGET_COLOR,
        'mono',
        'left',
      ).opacity(a),
      lumBar(255 + cBar / 2, -72, cBar, 42, {
        color: WORD_COLOR[2],
        fillOpacity: 0.78,
        glow: 9,
        opacity: a,
      }),
      txt(
        `${FRESH_TRACE.loss.toFixed(2)}`,
        270 + cBar,
        -72,
        28,
        WORD_COLOR[2],
        'mono',
        'left',
      ).opacity(a),
      // Lower-right persistent probability ribbons for both initial examples (eliminates empty space!)
      txt('DOG INITIAL SHARES', 255, 42, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      ...unitRibbon(255, 92, 560, 36, PROBS, WORD_COLOR, { opacity: a }),
      txt('CAT INITIAL SHARES', 255, 168, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      ...unitRibbon(255, 218, 560, 36, FRESH_TRACE.probabilities, WORD_COLOR, { opacity: a }),
    ];

    if (pairProd.value > 0.02) {
      nodes.push(
        txt(
          `Joint probability:  p₁ · p₂ = ${JOINT_PROB.toFixed(4)}`,
          -855,
          36,
          30,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(pairProd.value * a),
      );
    }
    if (pairSum.value > 0.02) {
      nodes.push(
        txt(
          `−ln(p₁ · p₂) = L₁ + L₂ = ${DOG_TRACE.loss.toFixed(3)} + ${FRESH_TRACE.loss.toFixed(3)} = ${SUM_LOSS.toFixed(3)} nats`,
          -855,
          112,
          30,
          MARK_COLOR,
          'mono',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(pairSum.value * a),
      );
    }
    if (pairMean.value > 0.02) {
      nodes.push(
        txt(
          `Batch mean (÷ 2) = ${MEAN_LOSS.toFixed(3)} nats / example`,
          -855,
          192,
          34,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(8, TARGET_COLOR)
          .opacity(pairMean.value * a),
      );
    }
    if (pairMost.value > 0.02) {
      const share1 = DOG_TRACE.loss / SUM_LOSS;
      const share2 = FRESH_TRACE.loss / SUM_LOSS;
      nodes.push(
        txt('SHARE OF TOTAL LOSS', -855, 295, 26, COSMOS.muted, 'mono', 'left').opacity(
          pairMost.value * a,
        ),
        ...unitRibbon(-855, 355, 1180, 56, [share1, share2], [TARGET_COLOR, WORD_COLOR[2]], {
          opacity: pairMost.value * a,
        }),
        txt(
          `dog slept: ${(share1 * 100).toFixed(1)}%`,
          -340,
          422,
          28,
          TARGET_COLOR,
          'mono',
        ).opacity(pairMost.value * a),
        txt(`cat ate: ${(share2 * 100).toFixed(1)}%`, 245, 422, 28, WORD_COLOR[2], 'mono').opacity(
          pairMost.value * a,
        ),
      );
    }
    return nodes;
  });

  // View 3: Original dog shares stay fixed; relabel target from slept -> ate (+1.000 nat!)
  const viewRelabel = guardedDynamic(vRelabel, (a) => {
    const rel = relabelTarget.value > 0.5;
    const nodes = [
      txt('The dog', -855, -215, 64, COSMOS.ink, 'serif', 'left').opacity(a),
      txt(
        rel ? 'ate' : 'slept',
        -590,
        -215,
        64,
        rel ? WORD_COLOR[2] : TARGET_COLOR,
        'serif',
        'left',
      )
        .glow(8, rel ? WORD_COLOR[2] : TARGET_COLOR)
        .opacity(a),
      txt(
        `Original logits fixed: ran ${LOGITS[0]}, slept ${LOGITS[1]}, ate ${LOGITS[2]}`,
        -855,
        -128,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      ...unitRibbon(-855, -20, 1280, 64, PROBS, WORD_COLOR, { opacity: a }),
      txt(`ran ${fmtPct(PROBS[0])}`, -320, 55, 28, WORD_COLOR[0], 'mono').opacity(a),
      txt(`slept ${fmtPct(PROBS[1])}`, 295, 55, 28, WORD_COLOR[1], 'mono').opacity(a),
      txt(`ate ${fmtPct(PROBS[2])}`, 425, 102, 26, WORD_COLOR[2], 'mono', 'right').opacity(a),
    ];

    if (rel && relabelLoss.value < 0.1) {
      nodes.push(
        txt(
          'Probabilities did not move. Does the loss go up or down?',
          -855,
          190,
          34,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(a),
      );
    }
    if (relabelLoss.value > 0.02) {
      nodes.push(
        txt(
          `Up by +1.000 nat:  ${DOG_TRACE.loss.toFixed(3)} → ${DOG_ATE_TRACE.loss.toFixed(3)} nats`,
          -855,
          190,
          34,
          MARK_COLOR,
          'mono',
          'left',
        )
          .glow(8, MARK_COLOR)
          .opacity(relabelLoss.value * a),
        txt(
          'Same log-sum-exp, z_ate is 1.0 below z_slept',
          -855,
          248,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(relabelLoss.value * a),
      );
    }
    if (relabelGrad.value > 0.02) {
      nodes.push(
        rule(-855, 302, 425, 302, COSMOS.rule, 2).opacity(relabelGrad.value * a),
        txt(
          `New negative gradient on ate:  ${DOG_ATE_GRAD[2].toFixed(3)}  (upward push moves to ate!)`,
          -855,
          358,
          30,
          WORD_COLOR[2],
          'mono',
          'left',
        )
          .glow(7, WORD_COLOR[2])
          .opacity(relabelGrad.value * a),
      );
    }
    return nodes;
  });

  s.add(bgAura, title, viewCat, viewPair, viewRelabel);

  // Beat 0-1 cues
  c.on('transfer-cat', () => {
    s.play(catForward.to(0.3, { duration: 0.3 }));
  });
  tweenCue(s, c, 'transfer-forward', catForward, 1, { duration: 0.45 });
  tweenCue(s, c, 'transfer-target', catTarget, 1, { duration: 0.45 });
  tweenCue(s, c, 'transfer-predict', catPredict, 1, { duration: 0.45 });
  tweenCue(s, c, 'transfer-gradient', catGrad, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'transfer-update', catUpdate, 1, { duration: 0.85 });
  tweenCue(s, c, 'transfer-smaller', catSmaller, 1, { duration: 0.5 });

  // Beat 2 cues
  crossSwap(s, c, 'transfer-return', vCat, vPair, { duration: 0.55 });
  tweenCue(s, c, 'transfer-product', pairProd, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'transfer-loss-sum', pairSum, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'transfer-mean', pairMean, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'transfer-most', pairMost, 1, { duration: 0.5 });

  // Beat 3-4 cues
  crossSwap(s, c, 'transfer-replay', vPair, vRelabel, { duration: 0.55 });
  tweenCue(s, c, 'transfer-relabel', relabelTarget, 1, { duration: 0.45 });
  tweenCue(s, c, 'transfer-relabel-loss', relabelLoss, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'transfer-relabel-gradient', relabelGrad, 1, { duration: 0.45 });
}
