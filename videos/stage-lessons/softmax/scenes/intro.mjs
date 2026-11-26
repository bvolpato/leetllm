// Scene 01 (intro): "Which word was on the page?"
// Living 3D probability simplex + sliding model guess over "The dog ___" + conserved glowing ribbon.
import {
  COSMOS,
  LOGITS,
  MARK_COLOR,
  PROBS,
  TARGET,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  buildSimplex3d,
  fmtPct,
  glowRing,
  glowingArc,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  runAmbientPhase,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const liftCard = s.value(0);
  const showObserved = s.value(0);
  const showPrompt = s.value(0);
  const showTargetLink = s.value(0);
  const showScoresHint = s.value(0);

  const bgAura = aura(420, 20, 520, '#14384438', '#1b204d18');
  const { view: simplex } = buildSimplex3d(() => PROBS, {
    x: 420,
    y: 30,
    scale: 2.3,
    theta: -0.65,
    phi: 1.04,
  });

  const title = heroTitle(['Which Word Was', 'on the Page?'], {
    x: -855,
    y: -420,
    size: 58,
    lineHeight: 68,
    accent: TARGET_COLOR,
    eyebrow: 'SOFTMAX & CROSS-ENTROPY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const lift = liftCard.value;
    const obs = showObserved.value;
    const prm = showPrompt.value;
    const lnk = showTargetLink.value;
    const scr = showScoresHint.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);

    const nodes = [
      // Sentence with live floating prediction slot (no heavy slide chrome)
      txt('The dog', -855, -108, 76, COSMOS.ink, 'serif', 'left'),
      // Subtle glowing slot baseline
      lumBar(-385, -108, 290, 128, {
        color: obs > 0.5 ? TARGET_COLOR : COSMOS.muted,
        fillOpacity: 0.1,
        strokeWidth: 2.4,
        glow: obs > 0.5 ? 10 : 4,
        radius: 12,
      }),
    ];

    // Revealed word "slept" strictly withheld until after `intro-observed`
    if (obs > 0.02) {
      nodes.push(
        txt('slept', -385, -108, 66, TARGET_COLOR, 'serif', 'center')
          .glow(10 * pulse, TARGET_COLOR)
          .opacity(obs),
        txt('OBSERVED TARGET', -385, -206, 26, TARGET_COLOR, 'mono', 'center').opacity(obs),
      );
    }

    // Covering model guess "ran" slides smoothly up and fades as the card lifts
    const coverOp = Math.max(0, 1 - lift * 1.35);
    const guessTagOp = Math.max(0, 1 - lift * 3.8);
    if (coverOp > 0.02) {
      const cy = -108 - lift * 95;
      nodes.push(
        lumBar(-385, cy, 290, 128, {
          color: WORD_COLOR[0],
          fillOpacity: 0.85,
          strokeWidth: 2.5,
          glow: 10,
          radius: 12,
          opacity: coverOp,
        }),
        txt('ran', -385, cy, 62, COSMOS.bg, 'serif', 'center').opacity(coverOp),
      );
    }
    if (guessTagOp > 0.02) {
      nodes.push(
        txt('MODEL GUESS · 84.4%', -385, -206, 26, WORD_COLOR[0], 'mono', 'center').opacity(
          guessTagOp,
        ),
      );
    }

    // Conserved unit-probability glowing ribbon on left stage
    const ribLeft = -855;
    const ribW = 790;
    const ribY = 125;
    nodes.push(
      txt('PROBABILITY BUDGET (SUM = 1.0)', ribLeft, ribY - 62, 26, COSMOS.muted, 'mono', 'left'),
      ...unitRibbon(ribLeft, ribY, ribW, 68, PROBS, WORD_COLOR, {
        showLabels: false,
      }),
      // Clear non-overlapping legend labels below the ribbon
      txt(
        `${WORDS[0]} ${fmtPct(PROBS[0])}`,
        ribLeft + ribW * PROBS[0] * 0.5,
        ribY + 72,
        28,
        WORD_COLOR[0],
        'mono',
        'center',
      ),
      txt(
        `${WORDS[1]} ${fmtPct(PROBS[1])}`,
        ribLeft + ribW * (PROBS[0] + PROBS[1] * 0.5) - 10,
        ribY + 72,
        28,
        WORD_COLOR[1],
        'mono',
        'center',
      ),
      txt(
        `${WORDS[2]} ${fmtPct(PROBS[2])}`,
        ribLeft + ribW - 8,
        ribY + 116,
        26,
        WORD_COLOR[2],
        'mono',
        'right',
      ),
    );

    // Prediction question prompt (withholds answer until `intro-target`; clean P5 non-overlap fade)
    const qOp = prm * Math.max(0, 1 - lnk * 2.6);
    if (qOp > 0.02) {
      nodes.push(
        txt(
          'Which slice gives the probability of slept?',
          -855,
          318,
          34,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(qOp),
      );
    }

    // Luminous arc connecting "slept" directly to its emerald 11.4% slice
    const ansOp = Math.max(0, (lnk - 0.45) / 0.55);
    if (ansOp > 0.02) {
      const targetX = ribLeft + ribW * (PROBS[0] + PROBS[1] * 0.5);
      nodes.push(
        glowingArc([-385, -36], [targetX, ribY - 40], -35, {
          color: TARGET_COLOR,
          width: 4.0,
          glow: 10,
          opacity: ansOp,
        }),
        glowRing(targetX, ribY, 44, TARGET_COLOR, {
          width: 3.5,
          glow: 12,
          opacity: ansOp * pulse,
        }),
        txt('Green slice: slept gets 11.4%', -855, 318, 34, TARGET_COLOR, 'sans', 'left')
          .glow(6, TARGET_COLOR)
          .opacity(ansOp),
      );
    }

    // Three scores teaser at end of scene (short so reading time fits cleanly)
    if (scr > 0.02) {
      nodes.push(
        txt(`Logits: [${LOGITS.join(', ')}]`, -855, 380, 28, COSMOS.cyan, 'mono', 'left').opacity(
          scr,
        ),
      );
    }

    // 3D Simplex floating captions
    nodes.push(
      txt('3D PROBABILITY SIMPLEX', 420, -405, 26, COSMOS.cyan, 'mono', 'center').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        'ran (blue)  ·  slept (emerald)  ·  ate (violet)',
        420,
        412,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    );

    return nodes;
  });

  s.add(bgAura, simplex, title, live);
  runAmbientPhase(s, c, phase, 2.0);
  orbitScene(s, c, simplex, { theta: 0.45, phi: 0.94 });

  tweenCue(s, c, 'intro-uncover', liftCard, 0.25, { duration: 0.45 });
  c.after('intro-observed', () => {
    s.play(liftCard.to(1, { duration: 0.5 }));
    s.play(showObserved.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'intro-question', showPrompt, 1, { duration: 0.45 });
  tweenCue(s, c, 'intro-target', showTargetLink, 1, { duration: 0.55, after: true });
  tweenCue(s, c, 'intro-scores', showScoresHint, 1, { duration: 0.5 });
}
