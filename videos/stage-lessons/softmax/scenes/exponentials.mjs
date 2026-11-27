// Scene 03 (exponentials): "Give each score a positive weight"
// Progressive exponential spires + max-shift stabilization + e^1000 overflow guard vs safe shift.
import {
  COSMOS,
  DANGER_COLOR,
  LOGITS,
  MARK_COLOR,
  PROBS,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  buildRulerBars,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function exponentials(s, c) {
  const wRan = s.value(0);
  const wSlept = s.value(0);
  const wAte = s.value(0);
  const showRatio = s.value(0);
  const shiftVal = s.value(0);
  const offsetVal = s.value(0);
  const showSurvives = s.value(0);
  const showOverflow = s.value(0);

  const bgAura = aura(-250, 30, 540, '#1f235436', '#10354016');
  const title = heroTitle(['Positive Weights,', 'Safe Arithmetic'], {
    x: -855,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: MARK_COLOR,
    eyebrow: 'STABLE EXPONENTIATION',
  });

  const eqWeight = glowTex('w_i = e^{z_i - m}, \\quad m = \\max_j z_j', {
    x: 475,
    y: -255,
    size: 38,
    color: COSMOS.cyan,
    glow: 6,
  });

  const live = guardedDynamic(s.value(1), () => {
    const sh = shiftVal.value;
    const off = offsetVal.value;
    const rat = showRatio.value;
    const surv = showSurvives.value;
    const ovf = showOverflow.value;

    const activeShift = off > 1 ? 3 + off : sh;
    const { nodes, xOf } = buildRulerBars(-810, 20, 145, 310, LOGITS, PROBS, {
      offset: off,
      shift: activeShift,
      solidScales: [wRan.value, wSlept.value, wAte.value],
      readMode: 'none',
    });

    // Live exact weight readouts above each bar as each word is revealed
    const reveals = [wRan.value, wSlept.value, wAte.value];
    LOGITS.forEach((z, i) => {
      if (reveals[i] > 0.05) {
        const expArg = z + off - activeShift;
        const w = Math.exp(expArg);
        const wStr = w >= 10 ? w.toFixed(1) : w.toFixed(3);
        const h = Math.max(6, 310 * PROBS[i]);
        nodes.push(
          txt(
            `e^(${expArg.toFixed(0)}) = ${wStr}`,
            xOf(z),
            145 - 48 - h,
            26,
            WORD_COLOR[i],
            'mono',
          ).opacity(reveals[i]),
        );
      }
    });

    // Ratio arc showing e^2 = 7.389x survives shift unchanged
    if (rat > 0.02) {
      const x1 = xOf(LOGITS[1]);
      const x0 = xOf(LOGITS[0]);
      nodes.push(
        glowingArc([x1, -18], [x0, -215], -45, {
          color: MARK_COLOR,
          width: 3.4,
          glow: 9,
          opacity: rat,
        }),
        txt('e² ≈ 7.39× ratio', (x1 + x0) / 2 - 40, -225, 28, MARK_COLOR, 'mono').opacity(rat),
      );
    }

    // Right column: always-on glowing y = exp(z) curve + shift/overflow readouts
    const rx = 475;
    const gx0 = 165;
    const gy0 = 265;
    const gw = 640;
    const gh = 220;
    const expPts = [];
    for (let k = 0; k <= 44; k++) {
      const zt = -0.5 + (3.7 * k) / 44;
      const ev = Math.exp(zt - 3) * 1.0; // normalized curve shape
      expPts.push([gx0 + ((zt + 0.5) / 3.7) * gw, gy0 - ev * gh]);
    }
    const curveFade = Math.max(0, 1 - ovf * 2.5);
    if (curveFade > 0.02) {
      nodes.push(
        txt('EXPONENTIAL GROWTH  w = e^z > 0', rx, 25, 26, COSMOS.cyan, 'mono').opacity(curveFade),
        rule(gx0, gy0, gx0 + gw, gy0, COSMOS.rule, 2).opacity(curveFade),
        glowingTrail(expPts, {
          gradientColors: [COSMOS.violet, COSMOS.emerald, COSMOS.blue],
          width: 4.0,
          glow: 9,
          opacity: curveFade,
        }),
      );
      LOGITS.forEach((z, i) => {
        const px = gx0 + ((z + 0.5) / 3.7) * gw;
        const py = gy0 - Math.exp(z - 3) * gh;
        nodes.push(
          glowDot(px, py, { radius: 7.5, color: WORD_COLOR[i], glow: 11, opacity: curveFade }),
          txt(WORDS[i], px, gy0 + 34, 26, WORD_COLOR[i], 'sans').opacity(curveFade),
        );
      });
    }

    if (surv > 0.02) {
      nodes.push(
        txt('SHIFT BY MAX (m = 3)', rx, -145, 26, TARGET_COLOR, 'mono').opacity(surv),
        txt('[0, -2, -3]  →  [1.000, 0.135, 0.050]', rx, -96, 28, COSMOS.ink, 'mono').opacity(surv),
        txt('1.000 / 0.135 = 7.389 (identical)', rx, -46, 26, MARK_COLOR, 'mono').opacity(surv),
      );
    }

    const ovfFade = Math.max(0, (ovf - 0.45) / 0.55);
    if (ovfFade > 0.02) {
      nodes.push(
        txt('NAIVE  exp(1003) → +∞  (NaN)', rx, 115, 30, DANGER_COLOR, 'mono')
          .glow(7, DANGER_COLOR)
          .opacity(ovfFade),
        txt('SHIFTED  exp(1003 - 1003) = 1.000', rx, 175, 30, TARGET_COLOR, 'mono')
          .glow(7, TARGET_COLOR)
          .opacity(ovfFade),
        txt(
          `${WORDS[0]} 1.000 · ${WORDS[1]} 0.135 · ${WORDS[2]} 0.050`,
          rx,
          232,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(ovfFade),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'exp-ran', wRan, 1, { duration: 0.45 });
  tweenCue(s, c, 'exp-slept', wSlept, 1, { duration: 0.45 });
  tweenCue(s, c, 'exp-ate', wAte, 1, { duration: 0.45 });
  tweenCue(s, c, 'exp-ratio', showRatio, 1, { duration: 0.5 });
  c.show('exp-shift', eqWeight);
  tweenCue(s, c, 'exp-shift', shiftVal, 3, { duration: 0.85 });
  tweenCue(s, c, 'exp-survives', showSurvives, 1, { duration: 0.5 });
  tweenCue(s, c, 'exp-offset', offsetVal, 1000, { duration: 0.85 });
  tweenCue(s, c, 'exp-overflow', showOverflow, 1, { duration: 0.55 });
}
