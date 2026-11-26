// Scene 04 (mass): "Three claims on one budget"
// 3D probability simplex + live denominator build + conserved ribbon + perturbation & restore.
import {
  COSMOS,
  LOGITS,
  MARK_COLOR,
  TARGET,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  buildSimplex3d,
  fmtPct,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  runAmbientPhase,
  stableSoftmax,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

export default function mass(s, c) {
  const phase = s.value(0);
  const add0 = s.value(0);
  const add1 = s.value(0);
  const add2 = s.value(0);
  const sh0 = s.value(0);
  const sh1 = s.value(0);
  const sh2 = s.value(0);
  const sleptBoost = s.value(0);
  const showUnit = s.value(0);
  const showEleven = s.value(0);
  const showPredict = s.value(0);

  const curLogits = () => [LOGITS[0], LOGITS[1] + sleptBoost.value, LOGITS[2]];
  const curProbs = () => stableSoftmax(curLogits());

  const bgAura = aura(430, 20, 520, '#133a3d34', '#1d225216');
  const { view: simplex } = buildSimplex3d(curProbs, {
    x: 430,
    y: 35,
    scale: 2.3,
    theta: -0.72,
    phi: 1.04,
  });

  const title = heroTitle(['Three Claims on', 'One Budget'], {
    x: -855,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: TARGET_COLOR,
    eyebrow: 'NORMALIZATION & COMPETITION',
  });

  const eqNorm = glowTex('p_i = \\frac{e^{z_i - m}}{\\sum_j e^{z_j - m}}', {
    x: -470,
    y: -215,
    size: 40,
    color: COSMOS.cyan,
    glow: 6,
  });

  const live = guardedDynamic(s.value(1), () => {
    const logits = curLogits();
    const probs = curProbs();
    const m = Math.max(...logits);
    const weights = logits.map((z) => Math.exp(z - m));
    const adds = [add0.value, add1.value, add2.value];
    const shares = [sh0.value, sh1.value, sh2.value];
    const runningSum = weights.reduce((acc, w, i) => acc + w * adds[i], 0);
    const boost = sleptBoost.value;

    const nodes = [txt('RUNNING DENOMINATOR Z', -855, -95, 26, COSMOS.muted, 'mono', 'left')];

    // Weight bars accumulating into Z
    const bx = -855;
    let cursor = bx;
    const scaleW = 460;
    weights.forEach((w, i) => {
      const segW = Math.max(0, w * adds[i] * scaleW);
      if (segW >= 2) {
        nodes.push(
          lumBar(cursor + segW / 2, -32, segW - 2, 48, {
            color: WORD_COLOR[i],
            fillOpacity: 0.72,
            strokeWidth: 2,
            glow: 7,
            radius: 6,
          }),
        );
      }
      cursor += segW;
    });
    if (runningSum > 0.01) {
      nodes.push(
        txt(
          `Z = ${runningSum.toFixed(3)}`,
          Math.min(-60, cursor + 22),
          -32,
          30,
          MARK_COLOR,
          'mono',
          'left',
        ).glow(6, MARK_COLOR),
      );
    }

    // Conserved 1.0 probability ribbon
    const ribLeft = -855;
    const ribW = 790;
    const ribY = 128;
    nodes.push(
      txt(
        showUnit.value > 0.5 ? 'CONSERVED UNIT BUDGET  (Σ p_i = 1.000)' : 'PROBABILITY SHARES',
        ribLeft,
        ribY - 58,
        26,
        showUnit.value > 0.5 ? MARK_COLOR : COSMOS.muted,
        'mono',
        'left',
      ),
      ...unitRibbon(ribLeft, ribY, ribW, 64, probs, WORD_COLOR, {
        fillScales: shares,
      }),
    );

    // Live per-word readouts below ribbon
    WORDS.forEach((w, i) => {
      const lx = ribLeft + i * 270;
      nodes.push(
        txt(
          `${w} (z=${logits[i].toFixed(1)})`,
          lx,
          ribY + 74,
          26,
          WORD_COLOR[i],
          'mono',
          'left',
        ).opacity(0.35 + 0.65 * Math.max(adds[i], shares[i])),
        txt(
          shares[i] > 0.2 ? fmtPct(probs[i]) : `w=${weights[i].toFixed(3)}`,
          lx,
          ribY + 114,
          30,
          i === TARGET ? TARGET_COLOR : WORD_COLOR[i],
          'mono',
          'left',
        ).opacity(0.2 + 0.8 * Math.max(adds[i], shares[i])),
      );
    });

    if (boost > 0.05) {
      nodes.push(
        txt(
          `slept +${boost.toFixed(1)} → slept grows, ran & ate give up mass`,
          -855,
          332,
          28,
          TARGET_COLOR,
          'sans',
          'left',
        ).glow(6, TARGET_COLOR),
      );
    } else if (showPredict.value > 0.02) {
      nodes.push(
        txt(
          'Which costs more: favorite ran (84.4%) or slept (11.4%)?',
          -855,
          342,
          30,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(showPredict.value),
      );
    } else if (showEleven.value > 0.02) {
      nodes.push(
        txt('Restored: slept = 11.4%', -855, 342, 28, TARGET_COLOR, 'sans', 'left').opacity(
          showEleven.value,
        ),
      );
    }

    nodes.push(
      txt('3D SIMPLEX MOTION', 430, -405, 26, COSMOS.cyan, 'mono', 'center').glow(5, COSMOS.cyan),
      txt(
        boost > 0.05 ? 'Beacon slides toward slept vertex' : 'Live point on p₀ + p₁ + p₂ = 1',
        430,
        412,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ),
    );

    return nodes;
  });

  s.add(bgAura, simplex, title, eqNorm, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, simplex, { theta: 0.42, phi: 0.96 });

  tweenCue(s, c, 'mass-add-0', add0, 1, { duration: 0.4 });
  tweenCue(s, c, 'mass-add-1', add1, 1, { duration: 0.4 });
  tweenCue(s, c, 'mass-add-2', add2, 1, { duration: 0.4 });
  tweenCue(s, c, 'mass-share-0', sh0, 1, { duration: 0.45 });
  tweenCue(s, c, 'mass-share-1', sh1, 1, { duration: 0.45 });
  tweenCue(s, c, 'mass-share-2', sh2, 1, { duration: 0.45 });
  tweenCue(s, c, 'mass-unit', showUnit, 1, { duration: 0.45 });
  tweenCue(s, c, 'mass-raise', sleptBoost, 1, { duration: 0.95 });
  tweenCue(s, c, 'mass-restore', sleptBoost, 0, { duration: 0.8 });
  tweenCue(s, c, 'mass-eleven', showEleven, 1, { duration: 0.45 });
  tweenCue(s, c, 'mass-predict', showPredict, 1, { duration: 0.5 });
}
