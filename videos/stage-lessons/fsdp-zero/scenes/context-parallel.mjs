// Scene 21: Keep queries still while KV blocks travel (Context Parallelism / Ring Attention): scores [0, ln3], vals [2, 10] -> online merge = 8!
import {
  COSMOS,
  RING_ATTN,
  ROLE,
  aura,
  buildGpuRing3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function contextParallel(s, c) {
  const ringHeight = s.value(0.65);
  const phase = s.value(0);
  const merged = s.value(0);

  const bgAura = aura(420, 20, 520, '#5ce1e620', '#6ee7b718');
  const { view: ring3d } = buildGpuRing3d(ringHeight, phase, {
    x: 445,
    y: 25,
    unit: 100,
    gpus: 4,
    color: ROLE.comm,
  });

  const title = heroTitle(['Context Parallelism:', 'Queries Stay, KV Travels'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.comm,
    eyebrow: 'RING ATTENTION · ONLINE SOFTMAX MERGE',
  });

  const eq = glowTex('\\frac{1 \\cdot 2 + 3 \\cdot 10}{1 + 3} = \\frac{32}{4} = 8', {
    x: -535,
    y: 175,
    size: 42,
    color: ROLE.good,
  });

  const live = guardedDynamic(1, () => {
    const mg = merged.value;
    const s0 = RING_ATTN[0];
    const s1 = RING_ATTN[1];

    const nodes = [
      txt('3D RING ATTENTION KV ROTATION', 445, -405, 26, ROLE.comm, 'mono').glow(5, ROLE.comm),
      txt('Stationary Q blocks · KV blocks orbit the ring', 445, 420, 26, COSMOS.muted, 'sans'),

      glassCell(-535, -145, 640, 118, ROLE.weights, { fill: '#10203a', glow: 7 }),
      txt('BLOCK 0: score = 0, value = 2', -535, -172, 26, ROLE.weights, 'mono'),
      txt(
        `unnorm mass = ${s0.mass} · weighted = ${s0.weighted}`,
        -535,
        -120,
        28,
        COSMOS.ink,
        'mono',
      ),

      glassCell(-535, 10, 640, 118, ROLE.comm, { fill: '#0e2434', glow: 8 }),
      txt('BLOCK 1: score = ln(3), value = 10', -535, -18, 26, ROLE.comm, 'mono'),
      txt('unnorm mass = 3 · weighted = 30', -535, 34, 28, COSMOS.ink, 'mono'),

      glassCell(-535, 315, 640, 118, mg > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: mg > 0.5 ? '#0d2924' : '#0c1322',
        glow: mg > 0.5 ? 11 : 3,
      }),
      txt('ONLINE RESCALED MERGE', -535, 288, 26, ROLE.good, 'mono'),
      txt(
        mg > 0.5
          ? `Normalized Output = ${s1.output.toFixed(0)} (exact!)`
          : 'Keep running max, rescale mass & sum',
        -535,
        340,
        28,
        mg > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.18, phi: 0.92 });

  c.on('online-output', () =>
    s.play(merged.to(1, { duration: remainDuration(c, 'online-output', 0.45) })),
  );
  c.show('online-output', [eq]);
}
