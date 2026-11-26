// Scene 23: Frozen weights still carry an upstream derivative: Backprop W_0^T through frozen block to earlier adapter + quadratic activation growth + checkpointing.
import {
  COSMOS,
  arrow,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function frozenBackward(s, c) {
  const phase = s.value(0);
  const showBack = s.value(0);
  const showTranspose = s.value(0);
  const showAct = s.value(0);
  const showQuad = s.value(0);
  const showMitigate = s.value(0);
  const showRecompute = s.value(0);

  const bgAura = aura(0, 0, 620, '#ff6b8b1e', '#5ce1e61a');
  const title = heroTitle(['Frozen Weights Still', 'Carry Upstream Grads'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.rose,
    eyebrow: 'BACKPROP THROUGH FROZEN LAYERS',
  });

  const eq = glowTex(
    String.raw`\nabla_x \mathcal{L} = W_0^T \, \nabla_h \mathcal{L} \qquad (\nabla_{W_0} \mathcal{L}\text{ skipped})`,
    {
      x: 410,
      y: -365,
      size: 32,
      color: COSMOS.rose,
    },
  );

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sb = Math.max(showBack.value, showTranspose.value);
    const sa = showAct.value;
    const sq = showQuad.value;
    const sm = showMitigate.value;
    const sr = showRecompute.value;

    const yChain = -170;
    const nodes = [
      // Top computational graph: Earlier Adapter -> Frozen W_0 -> Loss
      glassCell(-585, yChain, 360, 148, COSMOS.gold, { fill: '#221c10', glow: 9 }),
      txt('EARLIER ADAPTER', -585, yChain - 36, 26, COSMOS.gold, 'mono'),
      txt('A₁, B₁ (trainable)', -585, yChain + 18, 28, COSMOS.ink, 'mono'),

      arrow([-395, yChain - 24], [-210, yChain - 24], { stroke: COSMOS.cyan, width: 4, tip: 12 }),
      txt('forward x', -302, yChain - 56, 26, COSMOS.cyan, 'mono'),

      glassCell(0, yChain, 395, 148, COSMOS.blue, { fill: '#101d38', glow: 8 }),
      txt('FROZEN BASE W_0', 0, yChain - 36, 26, COSMOS.blue, 'mono'),
      txt('no W_0 grad slot', 0, yChain + 18, 26, COSMOS.muted, 'mono'),

      arrow([208, yChain - 24], [395, yChain - 24], { stroke: COSMOS.cyan, width: 4, tip: 12 }),
      txt('forward h', 302, yChain - 56, 26, COSMOS.cyan, 'mono'),

      glassCell(595, yChain, 360, 148, COSMOS.rose, { fill: '#261220', glow: 9 }),
      txt('UPSTREAM LOSS', 595, yChain - 36, 26, COSMOS.rose, 'mono'),
      txt('g = ∂L / ∂h', 595, yChain + 18, 30, COSMOS.ink, 'mono'),

      // Backward gradient beam multiplying by W_0^T (cleanly below the boxes!)
      arrow([460, yChain + 112], [-460, yChain + 112], {
        stroke: COSMOS.rose,
        width: 4.5,
        tip: 13,
      }).glow(9, COSMOS.rose),
      txt(
        'W_0ᵀ · g passes through frozen layer!',
        0,
        yChain + 154,
        26,
        sb > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ),
      glowDot(460 - ((p * 0.55) % 1) * 920, yChain + 112, { radius: 7, color: COSMOS.rose }),

      // Bottom left: Sequence activation growth (1024 -> 2048 quadratic attention scores)
      glassCell(-430, 232, 810, 315, sq > 0.2 ? COSMOS.rose : COSMOS.cyan, {
        fill: '#10182d',
        glow: sa > 0.2 ? 9 : 4,
      }),
      txt('SAVED ACTIVATIONS AT 2,048 TOKENS', -430, 112, 26, COSMOS.cyan, 'mono'),

      // Linear vs Quadratic activation bars (compact widths so labels fit comfortably inside box!)
      txt('Adapter state', -800, 182, 26, COSMOS.gold, 'mono', 'left'),
      rect(44, 34, { fill: COSMOS.gold, radius: 4 }).at(-490, 182).glow(7, COSMOS.gold),
      txt('tiny', -442, 182, 26, COSMOS.gold, 'mono', 'left'),

      txt('Activations', -800, 250, 26, COSMOS.cyan, 'mono', 'left'),
      rect(240, 34, { fill: COSMOS.cyan, radius: 4 }).at(-392, 250).glow(7, COSMOS.cyan),
      txt('O(B·L·d)', -246, 250, 26, COSMOS.cyan, 'mono', 'left'),

      txt('Attn scores', -800, 318, 26, COSMOS.rose, 'mono', 'left'),
      rect(290 * Math.max(0.35, sq), 34, { fill: COSMOS.rose, radius: 4 })
        .at(-512 + 145 * Math.max(0.35, sq), 318)
        .glow(9, COSMOS.rose),
      txt(
        sq > 0.3 ? 'O(L²)!' : 'grows w/ L',
        -490 + 290 * Math.max(0.35, sq),
        318,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),

      // Bottom right: Mitigation controls (microbatch, FlashAttention, activation checkpointing)
      glassCell(445, 228, 810, 315, sr > 0.2 ? COSMOS.emerald : '#334268', {
        fill: sr > 0.2 ? '#0e2528' : '#11182c',
        glow: sm > 0.2 ? 9 : 4,
      }),
      txt('WHAT ACTUALLY CUTS ACTIVATION PEAKS', 445, 108, 26, COSMOS.emerald, 'mono'),
      txt('1. Smaller microbatch size', 80, 174, 28, COSMOS.ink, 'sans', 'left'),
      txt(
        '2. Activation checkpointing (recompute in bwd)',
        80,
        238,
        28,
        sr > 0.2 ? COSMOS.emerald : COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '3. Fused / Flash attention (avoid N×N matrix)',
        80,
        302,
        28,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt('Measure live peak at real context & batch', 80, 356, 26, COSMOS.muted, 'mono', 'left'),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('frozen-backward-1', () => s.play(showBack.to(1, { duration: 0.4 })));
  c.on('frozen-input-gradient', () => s.play(showTranspose.to(1, { duration: 0.45 })));
  c.on('frozen-backward-2', () => s.play(showAct.to(1, { duration: 0.4 })));
  c.on('frozen-quadratic', () => s.play(showQuad.to(1, { duration: 0.5 })));
  c.on('frozen-backward-3', () => s.play(showMitigate.to(1, { duration: 0.4 })));
  c.on('frozen-recompute', () =>
    s.play(showRecompute.to(1, { duration: remainDuration(c, 'frozen-recompute', 0.45) })),
  );
}
