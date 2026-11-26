// Scene 19: Split the matrix multiply itself (Tensor Parallelism): Col-parallel + Row-parallel MLP [2,3] -> [2,8] + [6,-3] = [8,5] + 2 fwd / 2 bwd all-reduces.
import {
  COSMOS,
  ROLE,
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

export default function tensorParallel(s, c) {
  const phase = s.value(0);
  const revSum = s.value(0);
  const showLayers = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1e', '#6ee7b716');
  const title = heroTitle(['Tensor Parallelism:', 'Split the GEMM Itself'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.weights,
    eyebrow: 'COL-PARALLEL → LOCAL ACT → ROW-PARALLEL → ALL-REDUCE',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const rs = revSum.value;
    const sl = showLayers.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Rank 0 branch (top)
      glassCell(-570, -110, 390, 128, ROLE.weights, { fill: '#10203a', glow: 8 }),
      txt('RANK 0 · COL SHARD', -570, -142, 26, ROLE.weights, 'mono'),
      txt('h0 = 2 → ReLU = 2', -570, -90, 28, COSMOS.ink, 'mono'),

      glassCell(-65, -110, 450, 128, ROLE.grads, { fill: '#1e1436', glow: 8 }),
      txt('RANK 0 · ROW SHARD [1, 4]', -65, -142, 26, ROLE.grads, 'mono'),
      txt('2 × [1, 4] = [2, 8]', -65, -90, 28, COSMOS.gold, 'mono'),

      // Rank 1 branch (bottom)
      glassCell(-570, 95, 390, 128, ROLE.weights, { fill: '#10203a', glow: 8 }),
      txt('RANK 1 · COL SHARD', -570, 63, 26, ROLE.weights, 'mono'),
      txt('h1 = 3 → ReLU = 3', -570, 115, 28, COSMOS.ink, 'mono'),

      glassCell(-65, 95, 450, 128, ROLE.grads, { fill: '#1e1436', glow: 8 }),
      txt('RANK 1 · ROW SHARD [2, -1]', -65, 63, 26, ROLE.grads, 'mono'),
      txt('3 × [2, -1] = [6, -3]', -65, 115, 28, COSMOS.gold, 'mono'),

      // Right: All-Reduce Sum -> [8, 5]
      glassCell(540, -8, 480, 238, rs > 0.5 ? ROLE.good : COSMOS.gold, {
        fill: rs > 0.5 ? '#0d2924' : '#1b1828',
        glow: rs > 0.5 ? 12 * pulse : 6,
      }),
      txt('ALL-REDUCE SUM', 540, -80, 26, ROLE.comm, 'mono'),
      txt('[2, 8] + [6, -3]', 540, -20, 30, COSMOS.ink, 'mono'),
      txt(
        rs > 0.5 ? '= [8, 5]' : '= [?, ?]',
        540,
        46,
        46,
        rs > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ).glow(7, rs > 0.5 ? ROLE.good : COSMOS.gold),

      glowingArc([-372, -110], [-294, -110], -12, {
        color: ROLE.weights,
        width: 3.4,
        opacity: 0.9,
      }),
      glowingArc([-372, 95], [-294, 95], 12, { color: ROLE.weights, width: 3.4, opacity: 0.9 }),
      glowingArc([164, -110], [296, -38], -22, { color: ROLE.comm, width: 3.6, opacity: 0.92 }),
      glowingArc([164, 95], [296, 22], 22, { color: ROLE.comm, width: 3.6, opacity: 0.92 }),

      glowDot(-740 + ((p * 0.65) % 1) * 1480, 268, { radius: 6, color: ROLE.good }),
      txt(
        sl > 0.5
          ? 'Megatron TP: attention heads + MLP = 2 fwd + 2 bwd All-Reduces / layer (shrinks gathered matrices)'
          : 'Elementwise activation stays local between Column-Parallel and Row-Parallel GEMMs',
        0,
        345,
        26,
        sl > 0.5 ? ROLE.comm : COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('tp-sum', () => s.play(revSum.to(1, { duration: remainDuration(c, 'tp-sum', 0.45) })));
  c.onBeat(2, () => s.play(showLayers.to(1, { duration: 0.45 })));
}
