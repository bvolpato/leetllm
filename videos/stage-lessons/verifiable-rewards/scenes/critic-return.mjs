// Scene 13: What return does the critic expect from this prefix? (PPO learned critic vs GRPO local baseline)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function criticReturn(s, c) {
  const phase = s.value(0);
  const sExp = s.value(0);
  const sObs = s.value(0);
  const sGap = s.value(0);
  const sCost = s.value(0);
  const sLocal = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#331d5214');
  const title = heroTitle(['What Return Does the', 'Critic Expect Here?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'PPO VALUE BASELINE vs GRPO GROUP BASELINE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ex = Math.max(0.6, sExp.value);
    const ob = sObs.value;
    const gp = sGap.value;
    const ct = sCost.value;
    const lc = sLocal.value;

    const nodes = [
      // Left: Partial prefix splitting into 50% pass (1) / 50% fail (0)
      glassCell(-640, -30, 360, 128, COSMOS.cyan, { fill: '#102138', glow: 7 }),
      txt('HALFWAY PREFIX s_t', -640, -60, 26, COSMOS.cyan, 'mono'),
      txt('V(s_t) = 0.50', -640, -4, 38, COSMOS.gold, 'mono').glow(7, COSMOS.gold).opacity(ex),

      glowingArc([-455, -55], [-160, -140], -30, { color: COSMOS.emerald, width: 3.6 }),
      glassCell(-10, -140, 290, 88, COSMOS.emerald, { fill: '#0e2824', glow: 6 }),
      txt('50% -> r = 1.0', -10, -138, 30, COSMOS.emerald, 'mono'),

      glowingArc([-455, -5], [-160, 75], 30, { color: COSMOS.rose, width: 3.8 }),
      glassCell(-10, 75, 290, 88, COSMOS.rose, {
        fill: '#291018',
        glow: ob > 0.3 ? 10 * pulse : 5,
      }),
      txt('50% -> r = 0.0', -10, 77, 30, COSMOS.rose, 'mono'),

      // Observed advantage readout
      glassCell(510, -105, 620, 148, gp > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: gp > 0.3 ? '#26111a' : '#12182b',
        glow: gp > 0.3 ? 9 : 3,
        opacity: Math.max(0.7, gp),
      }),
      txt('OBSERVED ADVANTAGE (MISS)', 510, -142, 26, COSMOS.muted, 'mono').opacity(
        Math.max(0.7, gp),
      ),
      txt(
        gp > 0.3 ? 'A = 0.0 - 0.5 = -0.50' : 'A = r - V(s_t)',
        510,
        -86,
        36,
        gp > 0.3 ? COSMOS.rose : COSMOS.gold,
        'mono',
      )
        .glow(6, gp > 0.3 ? COSMOS.rose : COSMOS.gold)
        .opacity(Math.max(0.7, gp)),

      // Lower-right: Critic overhead vs GRPO prompt-local stats
      glassCell(510, 120, 620, 200, lc > 0.3 ? COSMOS.emerald : COSMOS.violet, {
        fill: lc > 0.3 ? '#0e2524' : '#191433',
        glow: ct > 0.3 || lc > 0.3 ? 8 : 3,
        opacity: Math.max(0.72, Math.max(ct, lc)),
      }),
      txt(
        lc > 0.3 ? 'GRPO: PROMPT-LOCAL GROUP STATS' : 'PPO CRITIC MEMORY & COMPUTE',
        510,
        56,
        26,
        lc > 0.3 ? COSMOS.emerald : COSMOS.violet,
        'mono',
      ).opacity(Math.max(0.72, Math.max(ct, lc))),
      txt(
        lc > 0.3
          ? 'Drops critic · keep easy & hard prompts separate!'
          : 'Extra weights + optimizer + activations (GAE)',
        510,
        118,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(Math.max(0.72, Math.max(ct, lc))),
      txt(
        lc > 0.3
          ? 'Std scaling alters cross-prompt batch weighting'
          : 'Sharding, offload & rollout buffers set peak RAM',
        510,
        170,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(Math.max(0.72, Math.max(ct, lc))),

      glowDot(-820, 315, { radius: 6, color: COSMOS.gold }),
      txt(
        'Terminal reward only (gamma = 1): V(s_t) = E[R | s_t] = 0.50',
        -790,
        317,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  const eqAdv = glowTex('A = R - V(s_t) = 0 - 0.5 = -0.5', {
    x: -440,
    y: 230,
    size: 36,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, live, eqAdv);
  runPhase(s, c, phase, 14);

  c.on('vr-critic-return-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-expected-critic-return', () => s.play(sExp.to(1, { duration: 0.45 })));
  c.on('vr-observed-critic-return', () => s.play(sObs.to(1, { duration: 0.45 })));
  c.on('vr-gap-critic-return', () => s.play(sGap.to(1, { duration: 0.45 })));
  c.on('vr-critic-return-b1', () => s.play(sCost.to(0.6, { duration: 0.35 })));
  c.on('vr-cost-critic-return', () => s.play(sCost.to(1, { duration: 0.45 })));
  c.on('vr-critic-return-b2', () => s.play(sLocal.to(0.6, { duration: 0.35 })));
  c.on('vr-local-critic-return', () =>
    s.play(sLocal.to(1, { duration: remainDuration(c, 'vr-local-critic-return', 0.45) })),
  );
}
