// Scene 03: Give every valid target the intended weight: Rank 0 (1 target: 1, g=-2) vs Rank 1 (3 targets: 3, g=-6) -> naive -4 vs pooled -5.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function weightedDdp(s, c) {
  const phase = s.value(0);
  const showFixed = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1e', '#6ee7b716');
  const title = heroTitle(['Give Every Valid Target', 'Equal Weight'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'DDP LOSS WEIGHTING · VARIABLE VALID TOKENS',
  });

  const eq = glowTex('w_r = \\frac{N_{\\text{ranks}} \\cdot n_r}{\\sum_k n_k}', {
    x: 480,
    y: -350,
    size: 42,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sf = showFixed.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Rank 0 (1 valid target)
      glassCell(-535, -110, 560, 172, ROLE.weights, { fill: '#10203a', glow: 8 }),
      txt('RANK 0 · 1 VALID TARGET', -535, -162, 26, ROLE.weights, 'mono'),
      txt('target [1] → grad = -2', -535, -110, 28, COSMOS.ink, 'mono'),
      txt('factor = 2 × (1/4) = 1/2', -535, -58, 26, COSMOS.gold, 'mono'),

      // Rank 1 (3 valid targets)
      glassCell(-535, 114, 560, 172, ROLE.grads, { fill: '#1e1436', glow: 8 }),
      txt('RANK 1 · 3 VALID TARGETS', -535, 62, 26, ROLE.grads, 'mono'),
      txt('targets [3,3,3] → grad = -6', -535, 114, 28, COSMOS.ink, 'mono'),
      txt('factor = 2 × (3/4) = 3/2', -535, 166, 26, COSMOS.gold, 'mono'),

      // Right: Unweighted DDP vs Valid-Token-Weighted DDP
      glassCell(355, -110, 700, 172, ROLE.bad, { fill: '#2c101c', glow: 8 }),
      txt('DEFAULT EQUAL-RANK AVERAGE (BIASED)', 355, -162, 26, ROLE.bad, 'mono'),
      txt('(-2 + -6) / 2  =  -4.0', 355, -108, 36, ROLE.bad, 'mono'),
      txt('Rank 0 token gets 3× weight!', 355, -56, 26, COSMOS.muted, 'sans'),

      glassCell(355, 114, 700, 172, sf > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: sf > 0.5 ? '#0d2924' : '#0e1726',
        glow: sf > 0.5 ? 12 * pulse : 3,
      }),
      txt('TOKEN-WEIGHTED AVERAGE (EXACT POOL)', 355, 62, 26, ROLE.good, 'mono'),
      txt(
        sf > 0.5 ? '((1/2)(-2) + (3/2)(-6)) / 2 = -5.0' : '(-2 - 6 - 6 - 6) / 4 = -5.0',
        355,
        114,
        28,
        sf > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
      txt('Empty rank sends 0 & joins sync', 355, 166, 26, COSMOS.muted, 'sans'),
    ];

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 274, { radius: 6, color: sf > 0.5 ? ROLE.good : ROLE.comm }),
      txt(
        'Count valid targets across all accumulated microbatches; coordinate skip if global count = 0',
        0,
        348,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('weighted-average', () =>
    s.play(showFixed.to(1, { duration: remainDuration(c, 'weighted-average', 0.45) })),
  );
}
