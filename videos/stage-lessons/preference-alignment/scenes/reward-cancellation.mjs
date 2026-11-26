// Scene 11: The same prompt constant cancels inside a pair (Algebraic Z(x) cancellation -> DPO loss + 3D surface)
import {
  COSMOS,
  aura,
  buildDpoLandscape3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function rewardCancellation(s, c) {
  const phase = s.value(0);
  const sInvert = s.value(0);
  const sDiff = s.value(0);
  const sCancel = s.value(0);
  const sLoss = s.value(0);

  const bgAura = aura(430, 20, 560, '#123e3628', '#3c1b4a16');
  const dpo3d = buildDpoLandscape3d(phase, { x: 455, y: 20, beta: 0.5 });

  const title = heroTitle(['The Same Prompt Constant', 'Cancels Inside a Pair'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'FROM OPTIMAL POLICY TO DPO · PARTITION Z(x) VANISHES IDENTICALLY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const inv = Math.max(0.75, sInvert.value);
    const df = sDiff.value;
    const cn = sCancel.value;
    const ls = sLoss.value;

    const nodes = [
      // Row 1: Chosen reward inversion
      glassCell(-580, -155, 550, 96, COSMOS.emerald, { fill: '#0e2624', glow: 5, opacity: inv }),
      txt('r_w = beta ln(pi*_w / ref_w)', -580, -153, 26, COSMOS.emerald, 'mono'),

      glassCell(-160, -155, 260, 96, cn > 0.3 ? COSMOS.rose : COSMOS.gold, {
        fill: cn > 0.3 ? '#29101a' : '#221c0e',
        glow: cn > 0.3 ? 8 : 4,
        opacity: Math.max(0.28, 1 - cn * 0.68),
      }),
      txt('+ beta ln Z(x)', -160, -153, 26, cn > 0.3 ? COSMOS.rose : COSMOS.gold, 'mono').opacity(
        Math.max(0.28, 1 - cn * 0.68),
      ),

      // Row 2: Rejected reward inversion
      glassCell(-580, 26, 550, 96, COSMOS.cyan, { fill: '#102138', glow: 5, opacity: inv }),
      txt('r_l = beta ln(pi*_l / ref_l)', -580, 28, 26, COSMOS.cyan, 'mono'),

      glassCell(-160, 26, 260, 96, cn > 0.3 ? COSMOS.rose : COSMOS.gold, {
        fill: cn > 0.3 ? '#29101a' : '#221c0e',
        glow: cn > 0.3 ? 8 : 4,
        opacity: Math.max(0.28, 1 - cn * 0.68),
      }),
      txt('+ beta ln Z(x)', -160, 28, 26, cn > 0.3 ? COSMOS.rose : COSMOS.gold, 'mono').opacity(
        Math.max(0.28, 1 - cn * 0.68),
      ),

      // Clean cancellation callout in the clear gap between rows (never crossing text!)
      ...(cn > 0.1
        ? [
            txt('Z(x) CANCELS ON SUBTRACTION!', -160, -64, 26, COSMOS.rose, 'mono')
              .glow(6, COSMOS.rose)
              .opacity(cn),
          ]
        : []),

      // Result implicit reward difference
      glassCell(-445, 168, 820, 118, ls > 0.3 ? COSMOS.gold : COSMOS.cyan, {
        fill: ls > 0.3 ? '#221c0e' : '#101d34',
        glow: ls > 0.3 || df > 0.3 ? 10 * pulse : 4,
      }),
      txt(
        ls > 0.3
          ? 'NO REWARD MODEL, NO CRITIC, NO ROLLOUTS'
          : 'IMPLICIT REWARD: r_hat = beta ln(pi / ref)',
        -445,
        142,
        26,
        COSMOS.gold,
        'mono',
      ),
      txt(
        ls > 0.3
          ? 'Minimize -ln sigma(r_hat_w - r_hat_l) on stored pairs'
          : 'Bradley-Terry difference subtracts r_w - r_l',
        -445,
        192,
        26,
        COSMOS.ink,
        'sans',
      ),

      // Right 3D header
      txt('3D DPO PAIRWISE LOSS LANDSCAPE', 455, -365, 26, COSMOS.cyan, 'mono'),
      txt(
        'Finite DPO and clipped PPO need not reach the same checkpoint',
        455,
        396,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  const eqDpo = glowTex(
    '\\mathcal{L}_{\\text{DPO}}(\\theta) = -\\ln \\sigma\\!\\left(\\beta\\ln\\frac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\beta\\ln\\frac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)}\\right)',
    {
      x: -445,
      y: 325,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, dpo3d, title, live, eqDpo);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, dpo3d, { theta: -0.22, phi: 0.92 });

  c.on('reward-cancellation-b0', () =>
    s.play(sInvert.to(1, { duration: remainDuration(c, 'reward-cancellation-b0', 0.5) })),
  );
  c.on('reward-cancellation-b1', () =>
    s.play(sDiff.to(1, { duration: remainDuration(c, 'reward-cancellation-b1', 0.5) })),
  );
  c.on('pa-reward-cancel', () =>
    s.play(sCancel.to(1, { duration: remainDuration(c, 'pa-reward-cancel', 0.6) })),
  );
  c.on('reward-cancellation-b2', () =>
    s.play(sLoss.to(1, { duration: remainDuration(c, 'reward-cancellation-b2', 0.55) })),
  );
}
