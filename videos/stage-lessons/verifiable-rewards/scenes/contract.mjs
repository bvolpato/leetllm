// Scene 03: Define the verifier's contract (Parser, tests/prover, candidate zero vs infra quarantine)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function contract(s, c) {
  const phase = s.value(0);
  const showParse = s.value(0);
  const showReward = s.value(0);
  const showModes = s.value(0);
  const showCrash = s.value(0);
  const showWrong = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(["Define the Verifier's", 'Contract'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'PROMPT + CANDIDATE -> DETERMINISTIC TRAINING LABEL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sp = Math.max(0.55, showParse.value);
    const sr = Math.max(0.5, showReward.value);
    const sm = Math.max(0.45, showModes.value);
    const sc = showCrash.value;
    const sw = showWrong.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Input node
      glassCell(-690, -70, 310, 118, COSMOS.cyan, { fill: '#102138', glow: 6, opacity: sp }),
      txt('PROMPT +', -690, -96, 26, COSMOS.cyan, 'mono').opacity(sp),
      txt('CANDIDATE', -690, -48, 32, COSMOS.ink, 'mono').opacity(sp),

      // Center: Verifier hub (3 check families)
      glowingArc([-530, -70], [-270, -70], -28, { color: COSMOS.cyan, width: 3.6, opacity: sp }),
      glassCell(-30, -70, 460, 212, COSMOS.gold, {
        fill: '#231d0f',
        glow: sm > 0.7 ? 10 * pulse : 5,
        opacity: sm,
      }),
      txt('VERIFIER v1.0', -30, -138, 28, COSMOS.gold, 'mono').opacity(sm),
      txt('· Numeric final parser', -30, -86, 26, COSMOS.ink, 'sans').opacity(sm),
      txt('· Isolated test suite', -30, -44, 26, COSMOS.ink, 'sans').opacity(sm),
      txt('· Formal proof checker', -30, -2, 26, COSMOS.ink, 'sans').opacity(sm),

      // Right top: Match -> r = 1
      glowingArc([206, -110], [420, -170], -26, { color: COSMOS.emerald, width: 3.6, opacity: sr }),
      glassCell(600, -170, 350, 96, COSMOS.emerald, { fill: '#0e2824', glow: 8, opacity: sr }),
      txt('MATCH -> r = 1', 600, -168, 32, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(sr),

      // Right middle: Wrong answer -> candidate failure (r = 0)
      glowingArc([206, -50], [420, 10], 0, {
        color: sw > 0.3 ? COSMOS.amber : COSMOS.muted,
        width: 3.4,
        opacity: Math.max(0.5, sw),
      }),
      glassCell(600, 10, 350, 108, sw > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: sw > 0.3 ? '#271a0e' : '#12182b',
        glow: sw > 0.3 ? 9 * pulse : 2,
        opacity: Math.max(0.5, sw),
      }),
      txt('WRONG ANSWER', 600, -16, 26, sw > 0.3 ? COSMOS.amber : COSMOS.muted, 'mono').opacity(
        Math.max(0.5, sw),
      ),
      txt('r = 0 (candidate)', 600, 32, 30, sw > 0.3 ? COSMOS.amber : COSMOS.muted, 'mono').opacity(
        Math.max(0.5, sw),
      ),

      // Right bottom: Checker crash -> infrastructure fault (quarantine, unscored)
      glowingArc([206, -10], [420, 200], 40, {
        color: sc > 0.3 ? COSMOS.rose : COSMOS.muted,
        width: 3.6,
        opacity: Math.max(0.5, sc),
      }),
      glassCell(600, 200, 350, 114, sc > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sc > 0.3 ? '#291018' : '#12182b',
        dash: [9, 6],
        glow: sc > 0.3 ? 10 * pulse : 2,
        opacity: Math.max(0.5, sc),
      }),
      txt('RUNNER CRASH', 600, 172, 26, sc > 0.3 ? COSMOS.rose : COSMOS.muted, 'mono').opacity(
        Math.max(0.5, sc),
      ),
      txt('QUARANTINE (no r)', 600, 222, 28, sc > 0.3 ? COSMOS.rose : COSMOS.muted, 'mono').opacity(
        Math.max(0.5, sc),
      ),

      // Bottom summary
      glowDot(-820, 336, { radius: 6, color: COSMOS.gold }),
      txt(
        'Record verifier version & failure policy in the experiment log: crash = missing evidence, not r = 0',
        -790,
        338,
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

  c.on('contract-b1-1', () => s.play(showParse.to(1, { duration: 0.45 })));
  c.on('contract-b1-2', () => s.play(showReward.to(1, { duration: 0.45 })));
  c.on('contract-b2-1', () => s.play(showModes.to(1, { duration: 0.5 })));
  c.on('contract-b3-1', () => s.play(showCrash.to(1, { duration: 0.5 })));
  c.on('contract-b3-2', () =>
    s.play(showWrong.to(1, { duration: remainDuration(c, 'contract-b3-2', 0.5) })),
  );
}
