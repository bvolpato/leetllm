// Scene 5: What does a lucky guess earn? (Benchmark guessing incentives: 8/10 vs 7/10 abstention)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function guessingIncentives(s, c) {
  const phase = s.value(0);
  const showWhy = s.value(0);
  const showScore = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1a5216');
  const title = heroTitle(['What Does a', 'Lucky Guess Earn?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'SCORING INCENTIVES · +1 RIGHT, 0 WRONG, 0 ABSTAIN -> REWARDS GUESSING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sw = showWhy.value;
    const ss = showScore.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Why plausible guesses happen (Kalai et al.)
      txt('GENERATION & SCOREBOARD INCENTIVES', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-465, -25, 760, 290, sw > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101c34',
        glow: sw > 0.3 ? 8 * pulse : 3,
      }),
      txt('WHY MODELS GUESS PLAUSIBLE ETAs', -820, -120, 26, COSMOS.cyan, 'mono', 'left'),
      txt('· Trained to emit likely continuations', -820, -68, 26, COSMOS.ink, 'sans', 'left'),
      txt('· Hard to separate valid vs invalid facts', -820, -24, 26, COSMOS.ink, 'sans', 'left'),
      txt('  (Kalai et al. statistical lower bound)', -820, 12, 26, COSMOS.muted, 'sans', 'left'),
      txt('· Binary 1/0/0 scoring pays 0 for honesty', -820, 64, 26, COSMOS.amber, 'sans', 'left'),

      // Right: 10-question scoreboard (Always Answer = 8 pts vs Selective = 7 pts)
      txt(
        '10 PRACTICE QUESTIONS (RIGHT=+1, WRONG=0, PASS=0)',
        110,
        -205,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(495, -90, 750, 152, ss > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: ss > 0.3 ? 9 * pulse : 3,
      }),
      txt('ALWAYS ANSWER (GUESSES 3 UNCERTAIN)', 150, -132, 26, COSMOS.amber, 'mono', 'left'),
      txt('8 right, 2 wrong -> SCORE = 8 / 10', 150, -86, 30, COSMOS.gold, 'mono', 'left'),
      meterBar(150, -40, 670, 26, 0.8, COSMOS.amber),

      glassCell(495, 102, 750, 152, ss > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: ss > 0.3 ? 9 * pulse : 3,
      }),
      txt('SELECTIVE ABSTENTION (PASSES 3)', 150, 60, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        '7 right, 0 wrong, 3 pass -> SCORE = 7 / 10',
        150,
        106,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(150, 152, 670, 26, 0.7, COSMOS.emerald),

      glassCell(495, 250, 750, 88, COSMOS.rose, { fill: '#26111a', glow: 5 }),
      txt('0-penalty grading rewards guessing over abstention!', 495, 252, 26, COSMOS.rose, 'sans'),

      glowDot(-840, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        'To reward groundedness in training or eval, explicitly penalize unsupported errors alongside coverage',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('guessing-incentives-b1', () => s.play(showWhy.to(1, { duration: 0.45 })));
  c.on('guessing-incentives-b2', () =>
    s.play(showScore.to(1, { duration: remainDuration(c, 'guessing-incentives-b2', 0.45) })),
  );
}
