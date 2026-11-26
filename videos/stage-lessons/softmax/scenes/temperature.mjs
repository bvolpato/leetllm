// Scene 09 (temperature): "Can cooling fix the missed word?"
// Orbiting 3D probability simplex with temperature geodesic + live temperature dial + learned-score swap.
import {
  COSMOS,
  LOGITS,
  MARK_COLOR,
  TARGET,
  TARGET_COLOR,
  UPDATED,
  WORD_COLOR,
  WORDS,
  aura,
  buildSimplex3d,
  fmtPct,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  positiveTemperature,
  runAmbientPhase,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

export default function temperature(s, c) {
  const phase = s.value(0);
  const tempVal = s.value(1.0);
  const learnedMix = s.value(0); // 0 = original LOGITS, 1 = UPDATED
  const showOrder = s.value(0);
  const showCoolAnswer = s.value(0);
  const showChanged = s.value(0);

  const curLogits = () => LOGITS.map((z, i) => z + (UPDATED[i] - z) * learnedMix.value);
  const curProbs = () => positiveTemperature(curLogits(), Math.max(0.18, tempVal.value));

  const bgAura = aura(430, 25, 520, '#13314d38', '#2a1c4f18');
  const { view: simplex } = buildSimplex3d(curProbs, {
    x: 430,
    y: 30,
    scale: 2.3,
    trailFn: (t) => positiveTemperature(LOGITS, 0.25 + t * 3.5),
  });

  const title = heroTitle(['Can Cooling Fix', 'the Missed Word?'], {
    x: -855,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'TEMPERATURE SCALING  z / T',
  });

  const eqTemp = glowTex('p_i(T) = \\operatorname{softmax}\\!\\left(\\frac{z}{T}\\right)_i', {
    x: -510,
    y: -242,
    size: 36,
    color: COSMOS.cyan,
    glow: 6,
  });

  const live = guardedDynamic(s.value(1), () => {
    const T = tempVal.value;
    const p = curProbs();
    const learned = learnedMix.value > 0.5;
    const ord = showOrder.value;
    const coolAns = showCoolAnswer.value;
    const chg = showChanged.value;

    // Temperature log slider rail
    const slLeft = -830;
    const slRight = -80;
    const slY = -48;
    const tNorm = Math.max(0, Math.min(1, Math.log(T / 0.25) / Math.log(2.5 / 0.25)));
    const knobX = slLeft + tNorm * (slRight - slLeft);

    const nodes = [
      txt(
        learned ? 'SCORES: LEARNED (slept leads)' : 'SCORES: ORIGINAL (ran leads by +2)',
        -855,
        -156,
        26,
        learned ? TARGET_COLOR : WORD_COLOR[0],
        'mono',
        'left',
      ),
      txt(`TEMPERATURE  T = ${T.toFixed(2)}`, -855, -106, 28, MARK_COLOR, 'mono', 'left').glow(
        6,
        MARK_COLOR,
      ),
      glowingTrail(
        [
          [slLeft, slY],
          [slRight, slY],
        ],
        { gradientColors: [COSMOS.blue, COSMOS.cyan, COSMOS.amber], width: 5, glow: 8 },
      ),
      glowDot(knobX, slY, { radius: 11, color: MARK_COLOR, glow: 14 }),
      txt('0.25 (sharp)', slLeft, slY + 38, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        '1.0',
        slLeft + (Math.log(1 / 0.25) / Math.log(10)) * (slRight - slLeft),
        slY + 38,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt('2.5 (flat)', slRight, slY + 38, 26, COSMOS.amber, 'mono', 'right'),
    ];

    // Live vertical share bars + conserved ribbon
    const ribLeft = -855;
    const ribW = 790;
    const ribY = 128;
    nodes.push(...unitRibbon(ribLeft, ribY, ribW, 66, p, WORD_COLOR));

    WORDS.forEach((w, i) => {
      const lx = ribLeft + i * 270;
      nodes.push(
        txt(w, lx, ribY + 78, 30, WORD_COLOR[i], 'sans', 'left'),
        txt(fmtPct(p[i]), lx + 95, ribY + 78, 30, WORD_COLOR[i], 'mono', 'left'),
      );
    });

    if (chg > 0.02) {
      nodes.push(
        txt(
          'Learning changed score order: slept passes ran!',
          -855,
          315,
          32,
          TARGET_COLOR,
          'sans',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(chg),
      );
    } else if (coolAns > 0.02 && !learned) {
      nodes.push(
        txt(
          'Cooling locks in ran (>99%); slept drops below 1%!',
          -855,
          315,
          30,
          WORD_COLOR[0],
          'sans',
          'left',
        )
          .glow(6, WORD_COLOR[0])
          .opacity(coolAns),
      );
    } else if (ord > 0.02) {
      nodes.push(
        txt(
          'Positive T scales every gap equally: ranking never flips',
          -855,
          315,
          28,
          MARK_COLOR,
          'sans',
          'left',
        ).opacity(ord),
      );
    }

    // Mini order strip badge
    const orderText = learned ? 'slept > ran > ate' : 'ran > slept > ate';
    nodes.push(
      lumBar(-650, 396, 410, 52, {
        color: learned ? TARGET_COLOR : WORD_COLOR[0],
        fillOpacity: 0.16,
        strokeWidth: 2,
        glow: 6,
      }),
      txt(`ORDER:  ${orderText}`, -650, 396, 26, learned ? TARGET_COLOR : WORD_COLOR[0], 'mono'),
      txt('3D TEMPERATURE GEODESIC', 430, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        'Gold curve traces T from sharp vertex to uniform center',
        430,
        412,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return nodes;
  });

  s.add(bgAura, simplex, title, eqTemp, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, simplex, { theta: 0.48, phi: 0.96 });

  c.on('temperature-original', () => {
    s.play(learnedMix.to(0, { duration: 0.35 }));
    s.play(tempVal.to(1.0, { duration: 0.35 }));
  });
  tweenCue(s, c, 'temperature-distribution-b1-1', tempVal, 0.5, { duration: 0.7 });
  tweenCue(s, c, 'temperature-higher-b1-2', tempVal, 2.0, { duration: 0.75 });
  tweenCue(s, c, 'temperature-order', showOrder, 1, { duration: 0.45 });
  // Beat 2 resolves the prediction question strictly at its spoken answer cue
  c.on('temperature-distribution-b2-1', () => {
    s.play(tempVal.to(0.32, { duration: 0.7 }));
    s.play(showCoolAnswer.to(1, { duration: 0.45 }));
  });
  c.on('temperature-restore', () => {
    s.play(tempVal.to(1.0, { duration: 0.65 }));
    s.play(showCoolAnswer.to(0, { duration: 0.3 }));
  });
  tweenCue(s, c, 'temperature-learned', learnedMix, 1, { duration: 0.85 });
  tweenCue(s, c, 'temperature-changed', showChanged, 1, { duration: 0.5 });
}
