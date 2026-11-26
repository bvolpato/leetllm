// Scene 15 (smoothing-equilibrium): "When does smoothing stop pushing the score higher?"
// Live equilibrium bar vs dashed smoothed target [0.0333, 0.9333, 0.0333] + gap = ln(28) + overshoot reversal + support conflict.
import {
  COSMOS,
  DANGER_COLOR,
  MARK_COLOR,
  MODEL,
  SMOOTH_TARGET,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
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
} from '../parts.mjs';

export default function smoothingEquilibrium(s, c) {
  const phase = s.value(0);
  const smoothMix = s.value(0); // 0 = one-hot [0,1,0], 1 = [1/30, 28/30, 1/30]
  const gapVal = s.value(1.5); // z_slept - z_comp (log(28)=3.332 equilibrium, 5.2 overshoot)
  const shiftTen = s.value(0);
  const excludeAte = s.value(0);

  const showSmoothNums = s.value(0);
  const showMatchZero = s.value(0);
  const showGapLn28 = s.value(0);
  const showOvershoot = s.value(0);
  const showMinEntropy = s.value(0);
  const showShiftNote = s.value(0);
  const showInfLoss = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a3d30', '#2b1b4a18');
  const title = heroTitle(['Label Smoothing', '& Finite Equilibrium'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: TARGET_COLOR,
    eyebrow: 'LABEL SMOOTHING · α = 0.1',
  });

  const eqGap = glowTex(
    'z_{\\text{slept}} - z_{\\text{comp}} = \\ln\\!\\left(\\frac{0.9333}{0.0333}\\right) = \\ln(28) \\approx 3.332',
    { x: 430, y: -150, size: 30, color: MARK_COLOR, glow: 6 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const sm = smoothMix.value;
    const g = gapVal.value;
    const sh = shiftTen.value;
    const exAte = excludeAte.value > 0.5;

    const target = [SMOOTH_TARGET[0] * sm, 1 + (SMOOTH_TARGET[1] - 1) * sm, SMOOTH_TARGET[2] * sm];
    const probs = exAte ? [...stableSoftmax([sh, g + sh]), 0] : stableSoftmax([sh, g + sh, sh]);
    const gradSlept = probs[1] - target[1];

    const baseY = 235;
    const maxH = 345;
    const xs = [-695, -455, -215];

    const nodes = [
      rule(-815, baseY, -95, baseY, COSMOS.muted, 2.5).opacity(0.8),
      txt(
        `Logit gap = ${g.toFixed(2)}  (offset +${sh.toFixed(0)})`,
        -455,
        -195,
        28,
        COSMOS.cyan,
        'mono',
      ),
    ];

    WORDS.forEach((w, i) => {
      const ph = Math.max(4, probs[i] * maxH);
      const th = Math.max(0, target[i] * maxH);
      const isExcluded = exAte && i === 2;
      nodes.push(
        lumBar(xs[i], baseY - ph / 2, 118, ph, {
          color: isExcluded ? DANGER_COLOR : WORD_COLOR[i],
          fillOpacity: isExcluded ? 0.12 : 0.72,
          glow: isExcluded ? 4 : 9,
        }),
        txt(w, xs[i], baseY + 42, 30, isExcluded ? DANGER_COLOR : WORD_COLOR[i], 'sans'),
        txt(
          isExcluded ? 'p = 0 (−∞)' : `${(probs[i] * 100).toFixed(1)}%`,
          xs[i],
          baseY + 84,
          26,
          isExcluded ? DANGER_COLOR : COSMOS.muted,
          'mono',
        ),
      );
      if (th > 4) {
        nodes.push(
          lumBar(xs[i], baseY - th / 2, 134, th, {
            color: COSMOS.ink,
            fillOpacity: 0.02,
            strokeWidth: 3.0,
            dash: [10, 7],
            glow: 5,
          }),
        );
      }
    });

    // Live gradient push indicator on slept bar (flips sign when overshooting 93.3%!)
    const pushDir = Math.abs(gradSlept) < 0.008 ? 0 : gradSlept < 0 ? -1 : 1;
    if (pushDir !== 0 && !exAte) {
      const topY = baseY - probs[1] * maxH;
      nodes.push(
        glowArrow(
          [xs[1] + 92, topY + 20],
          [xs[1] + 92, topY + 20 + pushDir * 68],
          pushDir < 0 ? TARGET_COLOR : DANGER_COLOR,
          { width: 4 },
        ),
      );
    }

    // Right column floating analytical milestones
    const rx = 50;
    // Always-on Beat 0 target-mixture visual ribbon on right (keeps right canvas rich from t=0!)
    const preSmOp = Math.max(0, 1 - showSmoothNums.value * 2.6);
    if (preSmOp > 0.02) {
      nodes.push(
        txt('TARGET DISTRIBUTION MIXTURE', rx, -285, 26, COSMOS.cyan, 'mono', 'left').opacity(
          preSmOp,
        ),
        txt(
          sm > 0.2 ? 'ỹ = (1 − α) · one_hot + α / K' : 'One-hot target: y = [0, 1, 0]',
          rx,
          -225,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(preSmOp),
        txt(
          `Current target mass:  [${target.map((v) => v.toFixed(3)).join(', ')}]`,
          rx,
          -155,
          28,
          TARGET_COLOR,
          'mono',
          'left',
        ).opacity(preSmOp),
        txt(
          `Current prediction:   [${probs.map((v) => v.toFixed(3)).join(', ')}]`,
          rx,
          -95,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(preSmOp),
      );
    }
    const smNumOp = Math.max(0, (showSmoothNums.value - 0.45) / 0.55);
    if (smNumOp > 0.02) {
      nodes.push(
        txt('SMOOTHED TARGET (α = 0.1)', rx, -285, 26, COSMOS.cyan, 'mono', 'left').opacity(
          smNumOp,
        ),
        txt('ỹ = [0.0333,  0.9333,  0.0333]', rx, -230, 30, COSMOS.ink, 'mono', 'left').opacity(
          smNumOp,
        ),
      );
    }

    if (showMatchZero.value > 0.02) {
      const eqColor = Math.abs(gradSlept) < 0.01 ? TARGET_COLOR : DANGER_COLOR;
      nodes.push(
        txt(
          `Direct gradient  p_slept − ỹ_slept = ${gradSlept >= 0 ? '+' : ''}${gradSlept.toFixed(3)}`,
          rx,
          -45,
          30,
          eqColor,
          'mono',
          'left',
        )
          .glow(6, eqColor)
          .opacity(showMatchZero.value),
      );
    }

    if (showOvershoot.value > 0.02 && !exAte) {
      nodes.push(
        txt(
          'Overshoot (> 93.3%) → positive gradient pulls slept BACK DOWN',
          rx,
          35,
          28,
          DANGER_COLOR,
          'sans',
          'left',
        ).opacity(showOvershoot.value),
      );
    }

    if (showMinEntropy.value > 0.02) {
      nodes.push(
        txt(
          `Minimum loss = H(ỹ) = ${MODEL.smoothEntropy.toFixed(3)} nats`,
          rx,
          112,
          30,
          MARK_COLOR,
          'mono',
          'left',
        ).opacity(showMinEntropy.value),
      );
    }

    if (showShiftNote.value > 0.02) {
      nodes.push(
        txt(
          `Shift +${sh.toFixed(0)} leaves proportions identical (gap ln 28 fixes ratios)`,
          rx,
          188,
          26,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showShiftNote.value),
      );
    }

    if (showInfLoss.value > 0.02) {
      nodes.push(
        txt(
          'SUPPORT CONFLICT: ỹ(ate) > 0, p(ate) = 0  ⇒  L = +∞',
          rx,
          285,
          26,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(8, DANGER_COLOR)
          .opacity(showInfLoss.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  // Beat 0
  tweenCue(s, c, 'smoothing-equilibrium-0', gapVal, 4.2, { duration: 0.9 });
  tweenCue(s, c, 'smooth-mixture', smoothMix, 1, { duration: 0.75 });

  // Beat 1
  tweenCue(s, c, 'smoothing-equilibrium-1', showSmoothNums, 1, { duration: 0.45 });
  c.on('smooth-match', () => {
    s.play(gapVal.to(MODEL.smoothGap, { duration: 0.7 }));
    s.play(showMatchZero.to(1, { duration: 0.45 }));
  });
  c.show('smooth-gap', eqGap, { after: true });
  tweenCue(s, c, 'smooth-gap', showGapLn28, 1, { duration: 0.45, after: true });
  c.on('smooth-overshoot', () => {
    s.play(gapVal.to(5.4, { duration: 0.65 }));
    s.play(showOvershoot.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'smooth-descend', gapVal, MODEL.smoothGap, { duration: 0.65 });
  tweenCue(s, c, 'smooth-minimum', showMinEntropy, 1, { duration: 0.45, after: true });

  // Beat 2
  tweenCue(s, c, 'smoothing-equilibrium-2', showShiftNote, 0.5, { duration: 0.35 });
  c.on('smooth-shift', () => {
    s.play(shiftTen.to(10, { duration: 0.75 }));
    s.play(showShiftNote.to(1, { duration: 0.45 }));
  });
  tweenCue(s, c, 'smooth-support', excludeAte, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'smooth-infinite', showInfLoss, 1, { duration: 0.5 });
}
