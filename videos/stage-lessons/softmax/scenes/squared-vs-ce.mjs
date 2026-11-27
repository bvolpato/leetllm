// Scene 12 (squared-vs-ce): "How far will each loss move the score for slept?"
// Confident wrong logits [8, 0, 0] -> Jacobian vanishing -> CE (-0.9997) vs Squared Error (-0.0007) race.
import {
  COSMOS,
  DANGER_COLOR,
  MARK_COLOR,
  MODEL,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

const P_WRONG = MODEL.certain;
const CE_GRAD = P_WRONG[1] - 1; // -0.99966
const SQ_GRAD = MODEL.squared[1]; // -0.00067

export default function squaredVsCe(s, c) {
  const showLogits = s.value(0);
  const showFav = s.value(0);
  const showTarget = s.value(0);
  const showCeLabel = s.value(0);
  const showBrierLabel = s.value(0);
  const showJac = s.value(0);

  const showCeLane = s.value(0);
  const showCancel = s.value(0);
  const showCeVal = s.value(0);
  const showSqLane = s.value(0);
  const showRemain = s.value(0);
  const showSqVal = s.value(0);

  const showStepAxis = s.value(0);
  const ceStep = s.value(0);
  const sqStep = s.value(0);
  const inspectCyan = s.value(0);

  const bgAura = aura(120, 40, 620, '#3a183b30', '#12384218');
  const title = heroTitle(['Confident Mistake:', 'Cross-Entropy vs MSE'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: TARGET_COLOR,
    eyebrow: 'GRADIENT SATURATION TEST',
  });

  const eqCe = glowTex('L_{\\text{CE}} = -\\ln p_{\\text{slept}}', {
    x: -440,
    y: -15,
    size: 38,
    color: TARGET_COLOR,
    glow: 6,
  });
  const eqSq = glowTex('L_{\\text{sq}} = \\tfrac{1}{2}\\sum_k (p_k - y_k)^2', {
    x: 420,
    y: -15,
    size: 38,
    color: COSMOS.cyan,
    glow: 6,
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // Top probability strip for logits [8, 0, 0]
    nodes.push(
      txt(
        'Confident wrong logits:  ran = 8.0,  slept = 0.0,  ate = 0.0',
        -855,
        -255,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showLogits.value),
      ...unitRibbon(-855, -205, 1710, 34, P_WRONG, WORD_COLOR, {
        opacity: 0.45 + 0.55 * showFav.value,
      }),
    );
    if (showFav.value > 0.02) {
      nodes.push(
        txt(
          `ran > 99.9% (${(P_WRONG[0] * 100).toFixed(2)}%)`,
          -855,
          -145,
          26,
          WORD_COLOR[0],
          'mono',
          'left',
        ).opacity(showFav.value),
      );
    }
    if (showTarget.value > 0.02) {
      nodes.push(
        txt(
          `slept ≈ 0.03% (${P_WRONG[1].toFixed(4)})`,
          855,
          -145,
          26,
          TARGET_COLOR,
          'mono',
          'right',
        ).opacity(showTarget.value),
      );
    }

    if (showJac.value > 0.02) {
      nodes.push(
        txt(
          'Softmax Jacobian saturated:  ∂p_slept / ∂z_slept ≈ 0.00034',
          0,
          -95,
          28,
          MARK_COLOR,
          'mono',
        ).opacity(showJac.value),
      );
    }

    // Beat 0 visual loss-shape contrast along bottom (steep -ln(p) vs flat 0.5*(1-p)^2 near p->0)
    const beat0CurveOp = Math.max(0, 1 - showCeLane.value * 2.6);
    if (beat0CurveOp > 0.02) {
      const yBase = 345;
      const plotH = 190;
      const plotW = 640;
      const xL = -785;
      const xR = 145;
      const cePts = [];
      const sqPts = [];
      for (let k = 0; k <= 40; k++) {
        const p = 0.04 + (0.96 * k) / 40;
        cePts.push([xL + p * plotW, yBase - Math.min(1, -Math.log(p) / 3.2) * plotH]);
        sqPts.push([xR + p * plotW, yBase - Math.pow(1 - p, 2) * plotH * 0.55]);
      }
      nodes.push(
        txt(
          'CROSS-ENTROPY CURVE: STEEP NEAR p → 0',
          xL,
          122,
          26,
          TARGET_COLOR,
          'mono',
          'left',
        ).opacity(beat0CurveOp),
        rule(xL, yBase, xL + plotW, yBase, COSMOS.rule, 2.2).opacity(beat0CurveOp),
        glowingTrail(cePts, { color: TARGET_COLOR, width: 4.0, glow: 9, opacity: beat0CurveOp }),
        txt(
          'SQUARED ERROR CURVE: FLAT NEAR p → 0',
          xR,
          122,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(beat0CurveOp),
        rule(xR, yBase, xR + plotW, yBase, COSMOS.rule, 2.2).opacity(beat0CurveOp),
        glowingTrail(sqPts, { color: COSMOS.cyan, width: 4.0, glow: 9, opacity: beat0CurveOp }),
      );
    }

    // Center comparison: Left = Cross-Entropy (cancels p_slept), Right = Squared Error (trapped!)
    const b1Op = Math.max(0, (showCeLane.value - 0.45) / 0.55);
    if (b1Op > 0.02) {
      const op = b1Op;
      nodes.push(
        txt('CROSS-ENTROPY', -855, -20, 26, TARGET_COLOR, 'mono', 'left').opacity(op),
        txt('−(1 / p_s) · p_s(1 − p_s)', -855, 32, 30, COSMOS.ink, 'mono', 'left').opacity(op),
      );
    }
    if (showCancel.value > 0.02) {
      nodes.push(
        txt('p_s cancels!', -395, 32, 28, MARK_COLOR, 'mono', 'left').opacity(showCancel.value),
      );
    }
    if (showCeVal.value > 0.02) {
      nodes.push(
        txt(`∂L / ∂z_slept = ${CE_GRAD.toFixed(4)}`, -855, 96, 36, TARGET_COLOR, 'mono', 'left')
          .glow(8, TARGET_COLOR)
          .opacity(showCeVal.value),
      );
    }

    if (showSqLane.value > 0.02) {
      const op = showSqLane.value;
      nodes.push(
        rule(15, -35, 15, 130, COSMOS.rule, 2).opacity(op),
        txt('SCALED BRIER (SQUARED ERROR)', 75, -20, 26, COSMOS.cyan, 'mono', 'left').opacity(op),
        txt('Σ (p_k − y_k) · ∂p_k / ∂z_slept', 75, 32, 30, COSMOS.ink, 'mono', 'left').opacity(op),
      );
    }
    if (showRemain.value > 0.02) {
      nodes.push(
        txt('tiny Jacobian stays in the sum!', 75, 148, 26, DANGER_COLOR, 'mono', 'left').opacity(
          showRemain.value,
        ),
      );
    }
    if (showSqVal.value > 0.02) {
      nodes.push(
        txt(`∂L / ∂z_slept = ${SQ_GRAD.toFixed(4)}`, 75, 92, 34, COSMOS.cyan, 'mono', 'left')
          .glow(7, COSMOS.cyan)
          .opacity(showSqVal.value),
      );
    }

    // Bottom step-size=1 race ruler on z_slept (0.0 -> +1.0): skeleton stays visible during beat 1!
    const axisOp = Math.max(b1Op * 0.65, showStepAxis.value);
    if (axisOp > 0.02) {
      const axLeft = -760;
      const axRight = 760;
      const axY = 285;
      const op = axisOp;
      const xOf = (d) => axLeft + d * (axRight - axLeft);
      const cePos = xOf(Math.abs(CE_GRAD) * ceStep.value);
      const sqPos = xOf(Math.abs(SQ_GRAD) * sqStep.value);

      nodes.push(
        txt(
          'ONE DIRECT STEP (η = 1.0) ON z_slept',
          -855,
          182,
          26,
          MARK_COLOR,
          'mono',
          'left',
        ).opacity(op),
        rule(axLeft, axY, axRight, axY, COSMOS.cyan, 3).opacity(op * 0.8),
        txt('0.0', axLeft, axY + 62, 26, COSMOS.muted, 'mono').opacity(op),
        txt('+0.5', xOf(0.5), axY + 62, 26, COSMOS.muted, 'mono').opacity(op),
        txt('+1.0', axRight, axY + 62, 26, COSMOS.muted, 'mono').opacity(op),
      );

      if (ceStep.value > 0.02) {
        const w = Math.max(4, cePos - axLeft);
        nodes.push(
          lumBar(axLeft + w / 2, axY - 28, w, 28, {
            color: TARGET_COLOR,
            fillOpacity: 0.82,
            glow: 10,
            opacity: op,
          }),
          glowDot(cePos, axY - 28, { radius: 8, color: TARGET_COLOR, glow: 12, opacity: op }),
          txt(
            `CE: +${Math.abs(CE_GRAD).toFixed(4)}`,
            cePos - 10,
            axY - 62,
            28,
            TARGET_COLOR,
            'mono',
            'right',
          ).opacity(ceStep.value * op),
        );
      }

      if (sqStep.value > 0.02) {
        nodes.push(
          glowDot(sqPos + 4, axY + 6, { radius: 7.5, color: COSMOS.cyan, glow: 14, opacity: op }),
          txt(
            `Squared error: +${Math.abs(SQ_GRAD).toFixed(4)} (< 1/1000)`,
            axLeft + 75,
            axY + 112,
            28,
            COSMOS.cyan,
            'mono',
            'left',
          ).opacity(sqStep.value * op),
        );
      }

      if (inspectCyan.value > 0.02) {
        nodes.push(
          glowRing(sqPos + 4, axY + 6, 26, COSMOS.cyan, {
            width: 3.5,
            glow: 12,
            opacity: inspectCyan.value * op,
          }),
          txt('1,490× weaker signal!', 855, axY + 112, 30, DANGER_COLOR, 'mono', 'right')
            .glow(7, DANGER_COLOR)
            .opacity(inspectCyan.value * op),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'brier-logits', showLogits, 1, { duration: 0.4 });
  tweenCue(s, c, 'brier-favorite', showFav, 1, { duration: 0.4 });
  tweenCue(s, c, 'brier-target', showTarget, 1, { duration: 0.4 });
  c.show('squared-vs-ce-0', eqCe);
  tweenCue(s, c, 'squared-vs-ce-0', showCeLabel, 1, { duration: 0.35 });
  c.show('brier-half-sum', eqSq);
  tweenCue(s, c, 'brier-half-sum', showBrierLabel, 1, { duration: 0.35 });
  tweenCue(s, c, 'brier-jacobian', showJac, 1, { duration: 0.45 });

  c.hide('squared-vs-ce-1', eqCe);
  c.hide('squared-vs-ce-1', eqSq);
  tweenCue(s, c, 'squared-vs-ce-1', showCeLane, 1, { duration: 0.45 });
  tweenCue(s, c, 'brier-cancel', showCancel, 1, { duration: 0.4 });
  tweenCue(s, c, 'brier-ce-result', showCeVal, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'brier-squared-slope', showSqLane, 1, { duration: 0.45 });
  tweenCue(s, c, 'brier-remain', showRemain, 1, { duration: 0.4 });
  tweenCue(s, c, 'brier-squared-result', showSqVal, 1, { duration: 0.45, after: true });

  tweenCue(s, c, 'squared-vs-ce-2', showStepAxis, 1, { duration: 0.45 });
  tweenCue(s, c, 'brier-ce-step', ceStep, 1, { duration: 0.75 });
  tweenCue(s, c, 'brier-squared-step', sqStep, 1, { duration: 0.55 });
  tweenCue(s, c, 'brier-inspect', inspectCyan, 1, { duration: 0.45 });
}
