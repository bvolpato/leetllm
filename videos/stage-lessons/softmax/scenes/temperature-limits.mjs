// Scene 14 (temperature-limits): "What happens to a tie when we cool it?"
// 3D Simplex limit behavior (T->0 tie split, T->inf uniform) -> subtract-max before /T -> masking -> T^2 distillation.
import {
  COSMOS,
  DANGER_COLOR,
  LOGITS,
  MARK_COLOR,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  buildSimplex3d,
  crossSwap,
  fmtPct,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  positiveTemperature,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

export default function temperatureLimits(s, c) {
  const phase = s.value(0);
  const vLimits = s.value(1);
  const vOverflow = s.value(0);
  const vDistill = s.value(0);

  // View 1 state
  const tempVal = s.value(1.0);
  const sleptLift = s.value(0); // 0 -> z=[3,1,0], 2 -> tie [3,3,0]
  const showOrderNote = s.value(0);
  const showGreedyNote = s.value(0);
  const showCalNote = s.value(0);

  // View 2 state: divide-first overflow vs subtract-first safe + candidate masking
  const showHuge = s.value(0);
  const showOvf = s.value(0);
  const showInfMinus = s.value(0);
  const retrySafe = s.value(0);
  const showShiftFirst = s.value(0);
  const showUnitW = s.value(0);
  const showSafeThird = s.value(0);
  const maskAte = s.value(0);
  const maskAll = s.value(0);

  // View 3 state: Distillation T^2 scaling
  const showDistillBoth = s.value(0);
  const showDistillGrad = s.value(0);
  const showDistillScale = s.value(0);

  const curLogits = () => [LOGITS[0], LOGITS[1] + sleptLift.value, LOGITS[2]];
  const curProbs = () => positiveTemperature(curLogits(), Math.max(0.14, tempVal.value));

  const bgAura = aura(420, 25, 520, '#13314d36', '#3a193218');
  const { view: simplex } = buildSimplex3d(curProbs, {
    x: 440,
    y: 30,
    scale: 2.25,
  });

  const title = heroTitle(['Temperature Limits,', 'Ties & Distillation'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'EXTREME TEMPERATURES & STABILITY',
  });

  const eqDistill = glowTex('\\nabla_z \\bigl(T^2\\, L_{\\text{soft}}\\bigr) = T\\,(p_T - q_T)', {
    x: 0,
    y: 235,
    size: 44,
    color: MARK_COLOR,
    glow: 8,
  });

  // View 1: Cool -> tie split 50/50 -> warm -> uniform 33/33/33
  const view1 = guardedDynamic(vLimits, (a) => {
    const T = tempVal.value;
    const p = curProbs();
    const tied = sleptLift.value > 1.5;

    const nodes = [
      txt(
        `T = ${T.toFixed(2)}   ·   scores = [${curLogits()
          .map((v) => v.toFixed(1))
          .join(', ')}]`,
        -855,
        -225,
        28,
        MARK_COLOR,
        'mono',
        'left',
      ).opacity(a),
      ...unitRibbon(-855, -125, 790, 68, p, WORD_COLOR, { opacity: a }),
    ];

    WORDS.forEach((w, i) => {
      nodes.push(
        txt(`${w} ${fmtPct(p[i])}`, -855 + i * 268, -42, 28, WORD_COLOR[i], 'mono', 'left').opacity(
          a,
        ),
      );
    });

    if (tied && T < 0.5) {
      nodes.push(
        txt(
          'Tie at T → 0⁺: ran & slept split 50% / 50%',
          -855,
          62,
          30,
          TARGET_COLOR,
          'sans',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(a),
      );
    } else if (T > 4.0) {
      nodes.push(
        txt(
          'High T → ∞: all three approach 33.3% (uniform)',
          -855,
          62,
          30,
          COSMOS.amber,
          'sans',
          'left',
        ).opacity(a),
      );
    }

    if (showOrderNote.value > 0.02) {
      nodes.push(
        txt(
          '• Any T > 0 preserves the exact score ranking',
          -855,
          162,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(showOrderNote.value * a),
      );
    }
    if (showGreedyNote.value > 0.02) {
      nodes.push(
        txt(
          '• T = 0 is undefined; decoders switch to greedy argmax',
          -855,
          224,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showGreedyNote.value * a),
      );
    }
    if (showCalNote.value > 0.02) {
      nodes.push(
        txt(
          '• Fit T on held-out outcomes to calibrate probabilities',
          -855,
          286,
          28,
          MARK_COLOR,
          'sans',
          'left',
        ).opacity(showCalNote.value * a),
      );
    }

    nodes.push(txt('3D SIMPLEX LIMITS', 440, -405, 26, COSMOS.cyan, 'mono').opacity(a));
    return nodes;
  });

  // View 2: Subtract max BEFORE dividing by T + candidate masking
  const view2 = guardedDynamic(vOverflow, (a) => {
    const safe = retrySafe.value > 0.5;
    const mOne = maskAte.value > 0.5;
    const mAll = maskAll.value > 0.5;
    const nodes = [];

    if (!mOne && !mAll) {
      nodes.push(
        txt(
          safe
            ? 'SAFE ORDER: SUBTRACT MAX FIRST, THEN DIVIDE BY T'
            : 'UNSAFE ORDER: DIVIDE BY T FIRST',
          -855,
          -235,
          28,
          safe ? TARGET_COLOR : DANGER_COLOR,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'z = [1e308, 1e308, 1e308],   T = 1e-308',
          -855,
          -168,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(Math.max(0.4, showHuge.value) * a),
        // Persistent visual stability pipeline gauge across bottom-right (keeps frame balanced!)
        lumBar(-560, 315, 430, 74, {
          color: safe ? TARGET_COLOR : DANGER_COLOR,
          fillOpacity: 0.16,
          glow: 6,
          opacity: a,
        }),
        txt(
          safe ? '1. subtract max(z)' : '1. divide z / T',
          -560,
          315,
          28,
          safe ? TARGET_COLOR : DANGER_COLOR,
          'mono',
        ).opacity(a),
        lumBar(10, 315, 430, 74, {
          color: safe ? COSMOS.cyan : DANGER_COLOR,
          fillOpacity: 0.16,
          glow: 6,
          opacity: a,
        }),
        txt(
          safe ? '2. divide (z − m) / T' : '2. subtract max (+∞ − ∞)',
          10,
          315,
          28,
          safe ? COSMOS.cyan : DANGER_COLOR,
          'mono',
        ).opacity(a),
        lumBar(580, 315, 430, 74, {
          color: safe ? MARK_COLOR : DANGER_COLOR,
          fillOpacity: 0.18,
          glow: 7,
          opacity: a,
        }),
        txt(
          safe ? '3. finite [1/3, 1/3, 1/3]' : '3. NaN crash!',
          580,
          315,
          28,
          safe ? MARK_COLOR : DANGER_COLOR,
          'mono',
        ).opacity(a),
      );

      if (!safe) {
        if (showOvf.value > 0.02) {
          nodes.push(
            txt(
              '1.  z / T  →  [+∞, +∞, +∞]   (OVERFLOW!)',
              -855,
              -75,
              32,
              DANGER_COLOR,
              'mono',
              'left',
            )
              .glow(7, DANGER_COLOR)
              .opacity(showOvf.value * a),
          );
        }
        if (showInfMinus.value > 0.02) {
          nodes.push(
            txt('2.  z/T − max(z/T)  →  ∞ − ∞ = NaN', -855, 5, 34, DANGER_COLOR, 'mono', 'left')
              .glow(9, DANGER_COLOR)
              .opacity(showInfMinus.value * a),
          );
        }
      } else {
        if (showShiftFirst.value > 0.02) {
          nodes.push(
            txt(
              '1.  (z − max z) / T  =  [0, 0, 0] / T  =  [0, 0, 0]',
              -855,
              -75,
              30,
              TARGET_COLOR,
              'mono',
              'left',
            ).opacity(showShiftFirst.value * a),
          );
        }
        if (showUnitW.value > 0.02) {
          nodes.push(
            txt(
              '2.  exp([0, 0, 0])  =  [1, 1, 1]',
              -855,
              2,
              30,
              COSMOS.cyan,
              'mono',
              'left',
            ).opacity(showUnitW.value * a),
          );
        }
        if (showSafeThird.value > 0.02) {
          nodes.push(
            txt(
              '3.  p  =  [1/3, 1/3, 1/3]  (exact tie restored!)',
              -855,
              82,
              32,
              MARK_COLOR,
              'mono',
              'left',
            )
              .glow(8, MARK_COLOR)
              .opacity(showSafeThird.value * a),
            ...unitRibbon(-855, 195, 1180, 56, [1 / 3, 1 / 3, 1 / 3], WORD_COLOR, {
              opacity: showSafeThird.value * a,
            }),
          );
        }
      }
    } else {
      // Masking candidates (-inf)
      const shares = mAll ? [0, 0, 0] : [0.5, 0.5, 0];
      nodes.push(
        txt(
          mAll ? 'ALL CANDIDATES MASKED (−∞)' : 'MASK ONE CANDIDATE (ate = −∞)',
          -855,
          -235,
          28,
          mAll ? DANGER_COLOR : COSMOS.cyan,
          'mono',
          'left',
        ).opacity(a),
      );
      WORDS.forEach((w, i) => {
        const masked = mAll || i === 2;
        const cx = -620 + i * 380;
        nodes.push(
          lumBar(cx, -50, 290, 140, {
            color: masked ? DANGER_COLOR : WORD_COLOR[i],
            fillOpacity: masked ? 0.1 : 0.34,
            dash: masked ? [8, 6] : undefined,
            glow: masked ? 4 : 9,
            opacity: a,
          }),
          txt(w, cx, -82, 32, masked ? COSMOS.dim : WORD_COLOR[i], 'sans').opacity(a),
          txt(
            masked ? 'z = −∞  →  w = 0' : `p = ${(shares[i] * 100).toFixed(0)}%`,
            cx,
            -22,
            28,
            masked ? DANGER_COLOR : COSMOS.ink,
            'mono',
          ).opacity(a),
        );
      });
      nodes.push(
        txt(
          mAll
            ? 'Denominator = 0  →  0 / 0 = NaN!  Keep ≥ 1 finite score (no NaN / +∞).'
            : 'ate weight = 0  →  ran & slept split 50% / 50%',
          -855,
          125,
          30,
          mAll ? DANGER_COLOR : TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, mAll ? DANGER_COLOR : TARGET_COLOR)
          .opacity(a),
        // Visual active denominator gauge at bottom (keeps lower frame balanced & teaches Z -> 0!)
        txt(
          mAll ? 'ACTIVE WEIGHT SUM  Z = 0.000 (INVALID)' : 'ACTIVE WEIGHT SUM  Z = 2.000',
          -855,
          235,
          26,
          mAll ? DANGER_COLOR : COSMOS.cyan,
          'mono',
          'left',
        ).opacity(a),
        ...unitRibbon(-855, 300, 1280, 52, mAll ? [0, 0, 0] : [0.5, 0.5, 0], WORD_COLOR, {
          opacity: a,
        }),
        txt(
          mAll ? 'Zero active weight → undefined division' : '50% ran   ·   50% slept   ·   0% ate',
          -215,
          372,
          26,
          mAll ? DANGER_COLOR : COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    }

    return nodes;
  });

  // View 3: Knowledge distillation T^2 scaling
  const view3 = guardedDynamic(vDistill, (a) => {
    const pSharp = positiveTemperature(LOGITS, 1.0);
    const pSoft = positiveTemperature(LOGITS, 4.0);
    const nodes = [
      txt(
        'KNOWLEDGE DISTILLATION AT HIGH TEMPERATURE T',
        -855,
        -225,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Softened teacher reveals dark knowledge in runner-up probabilities',
        -855,
        -152,
        30,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(a),
      // Always-visible T=1 vs T=4 contrast ribbons in View 3 (rich & balanced from beat start!)
      txt('T = 1.0 sharp teacher:', -855, -72, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      ...unitRibbon(-460, -72, 1180, 40, pSharp, WORD_COLOR, { opacity: a }),
      txt('T = 4.0 soft teacher:', -855, 8, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      ...unitRibbon(-460, 8, 1180, 40, pSoft, WORD_COLOR, { opacity: a }),
      rule(-855, 395, 855, 395, COSMOS.cyan, 2.2).opacity(0.65 * a),
      txt(
        'HIGHER T REVEALS RUNNER-UP STRUCTURE · SCALE LOSS BY T²',
        -855,
        435,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    if (showDistillBoth.value > 0.02) {
      nodes.push(
        txt(
          'At T = 4.0: runner-up slept (29%) & ate (23%) become clearly visible to the student',
          -855,
          82,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showDistillBoth.value * a),
      );
    }
    if (showDistillGrad.value > 0.02) {
      nodes.push(
        txt(
          'Raw-logit gradient scales down as 1 / T²  (1/T from z/T and softer p_T − q_T)',
          -855,
          140,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(showDistillGrad.value * a),
      );
    }
    if (showDistillScale.value > 0.02) {
      nodes.push(
        txt(
          'Multiply soft-target loss by T² to restore gradient scale (Hinton et al.)',
          -855,
          345,
          30,
          MARK_COLOR,
          'sans',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(showDistillScale.value * a),
      );
    }
    return nodes;
  });

  s.add(bgAura, simplex, title, view1, view2, view3);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, simplex, { theta: 0.45, phi: 0.96 });

  // Beat 0 cues
  tweenCue(s, c, 'temperature-zero-limit', tempVal, 0.22, { duration: 0.7 });
  tweenCue(s, c, 'temperature-tied', sleptLift, 2.0, { duration: 0.75 });
  tweenCue(s, c, 'temperature-uniform', tempVal, 6.0, { duration: 0.85 });
  tweenCue(s, c, 'temperature-limits-0', showOrderNote, 1, { duration: 0.4 });
  tweenCue(s, c, 'temperature-greedy', showGreedyNote, 1, { duration: 0.4 });
  tweenCue(s, c, 'temperature-calibration', showCalNote, 1, { duration: 0.4 });

  // Beat 1-3 cues (hide 3D simplex while showing overflow/masking view)
  c.hide('temperature-huge-tie', simplex);
  crossSwap(s, c, 'temperature-huge-tie', vLimits, vOverflow, { duration: 0.5 });
  tweenCue(s, c, 'temperature-huge-tie', showHuge, 1, { duration: 0.4 });
  tweenCue(s, c, 'temperature-overflow', showOvf, 1, { duration: 0.45 });
  tweenCue(s, c, 'temperature-invalid-difference', showInfMinus, 1, { duration: 0.45 });
  tweenCue(s, c, 'temperature-retry', retrySafe, 1, { duration: 0.4 });
  tweenCue(s, c, 'temperature-limits-1', showShiftFirst, 1, { duration: 0.45 });
  tweenCue(s, c, 'temperature-unit-weights', showUnitW, 1, { duration: 0.4 });
  tweenCue(s, c, 'temperature-safe', showSafeThird, 1, { duration: 0.45 });
  tweenCue(s, c, 'temperature-mask-one', maskAte, 1, { duration: 0.45 });
  tweenCue(s, c, 'temperature-all-masked', maskAll, 1, { duration: 0.45 });

  // Beat 4 cues
  crossSwap(s, c, 'temperature-limits-2', vOverflow, vDistill, { duration: 0.5 });
  tweenCue(s, c, 'distill-both', showDistillBoth, 1, { duration: 0.45 });
  tweenCue(s, c, 'distill-gradient', showDistillGrad, 1, { duration: 0.45 });
  tweenCue(s, c, 'distill-scale', showDistillScale, 1, { duration: 0.45 });
  c.show('distill-scale', eqDistill);
}
