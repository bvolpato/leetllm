// Scene 07 (gradient): "Subtract what happened from what was predicted"
// One-hot target strip + signed gradient bars (p_i - y_i) + zero-sum balance beam + descent arrows.
import {
  COSMOS,
  GRAD,
  LOGITS,
  MARK_COLOR,
  PROBS,
  TARGET,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  buildRulerBars,
  glowArrow,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function gradient(s, c) {
  const phase = s.value(0);
  const showTarget = s.value(0);
  const g0 = s.value(0);
  const g1 = s.value(0);
  const g2 = s.value(0);
  const showDescent = s.value(0);
  const showBalance = s.value(0);
  const showZero = s.value(0);

  const bgAura = aura(320, 20, 560, '#133a3d30', '#2b1b4a18');
  const title = heroTitle(['Subtract Reality', 'from Prediction'], {
    x: -855,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: TARGET_COLOR,
    eyebrow: 'THE LOGIT GRADIENT',
  });

  const eqGrad = glowTex('\\frac{\\partial L}{\\partial z_i} = p_i - y_i', {
    x: 470,
    y: -315,
    size: 46,
    color: MARK_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const tOn = showTarget.value;
    const gs = [g0.value, g1.value, g2.value];
    const desc = showDescent.value;
    const bal = showBalance.value;
    const zro = showZero.value;

    const { nodes, xOf } = buildRulerBars(-815, -35, 130, 290, LOGITS, PROBS, {
      solidScales: [1, 1, 1],
      readMode: 'share',
    });

    // One-hot target badges below ruler
    if (tOn > 0.02) {
      WORDS.forEach((_, i) => {
        const yVal = i === TARGET ? 1 : 0;
        nodes.push(
          txt(
            `y = ${yVal}`,
            xOf(LOGITS[i]),
            260,
            28,
            i === TARGET ? TARGET_COLOR : COSMOS.muted,
            'mono',
          ).opacity(tOn),
        );
      });
    }

    // Descent push arrows showing where -eta * grad moves each score
    if (desc > 0.02) {
      const yRan = 320;
      const ySlept = 368;
      const yAte = 320;
      nodes.push(
        glowArrow([xOf(LOGITS[0]), yRan], [xOf(LOGITS[0] - 0.9 * desc), yRan], WORD_COLOR[0], {
          opacity: desc,
        }),
        glowArrow([xOf(LOGITS[1]), ySlept], [xOf(LOGITS[1] + 0.95 * desc), ySlept], WORD_COLOR[1], {
          opacity: desc,
        }),
        glowArrow([xOf(LOGITS[2]), yAte], [xOf(LOGITS[2] - 0.25 * desc), yAte], WORD_COLOR[2], {
          opacity: desc,
        }),
        txt('−η(p−y): raise slept, lower competitors', -425, 424, 26, MARK_COLOR, 'sans').opacity(
          desc,
        ),
      );
    }

    // Right side: signed gradient bars around vertical zero axis
    const axisX = 525;
    const barScale = 235;
    nodes.push(
      rule(axisX, -215, axisX, 170, COSMOS.muted, 2.5).opacity(0.8),
      txt('0', axisX, 202, 26, COSMOS.muted, 'mono'),
      txt('− (raise score)', axisX - 165, -225, 26, TARGET_COLOR, 'mono'),
      txt('+ (lower score)', axisX + 165, -225, 26, WORD_COLOR[0], 'mono'),
    );

    WORDS.forEach((w, i) => {
      const vis = gs[i];
      const y = -130 + i * 118;
      const val = GRAD[i];
      const bw = Math.abs(val) * barScale * vis;
      const cx = val >= 0 ? axisX + bw / 2 : axisX - bw / 2;
      nodes.push(txt(w, 85, y, 30, WORD_COLOR[i], 'sans', 'left').opacity(0.35 + 0.65 * vis));
      if (bw >= 3) {
        nodes.push(
          lumBar(cx, y, bw, 52, {
            color: WORD_COLOR[i],
            fillOpacity: 0.8,
            strokeWidth: 2,
            glow: 9,
            opacity: vis,
          }),
          txt(
            `${val >= 0 ? '+' : ''}${val.toFixed(3)}`,
            val >= 0 ? axisX + bw + 18 : axisX - bw - 18,
            y,
            28,
            WORD_COLOR[i],
            'mono',
            val >= 0 ? 'left' : 'right',
          ).opacity(vis),
        );
      }
    });

    // Zero-sum balance bar at bottom right
    if (bal > 0.02) {
      const ySum = 285;
      const wRan = GRAD[0] * barScale * bal;
      const wAte = GRAD[2] * barScale * bal;
      const wSlept = Math.abs(GRAD[1]) * barScale * bal;
      nodes.push(
        lumBar(axisX - wSlept / 2, ySum, wSlept, 32, {
          color: WORD_COLOR[1],
          fillOpacity: 0.78,
          glow: 8,
          opacity: bal,
        }),
        lumBar(axisX + wRan / 2, ySum, wRan, 32, {
          color: WORD_COLOR[0],
          fillOpacity: 0.78,
          glow: 8,
          opacity: bal,
        }),
        lumBar(axisX + wRan + wAte / 2, ySum, Math.max(4, wAte), 32, {
          color: WORD_COLOR[2],
          fillOpacity: 0.78,
          glow: 8,
          opacity: bal,
        }),
      );
    }
    if (zro > 0.02) {
      nodes.push(
        txt('(+0.844) + (−0.886) + (+0.042) = 0.000', axisX, 355, 28, MARK_COLOR, 'mono')
          .glow(7, MARK_COLOR)
          .opacity(zro),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, eqGrad, live);
  runAmbientPhase(s, c, phase, 2.0);

  tweenCue(s, c, 'gradient-target', showTarget, 1, { duration: 0.45 });
  tweenCue(s, c, 'gradient-0', g0, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'gradient-1', g1, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'gradient-2', g2, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'gradient-descent', showDescent, 1, { duration: 0.55 });
  tweenCue(s, c, 'gradient-balance', showBalance, 1, { duration: 0.65 });
  tweenCue(s, c, 'gradient-zero', showZero, 1, { duration: 0.5 });
}
