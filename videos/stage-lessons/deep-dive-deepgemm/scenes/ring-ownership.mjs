// Scene 20: Lease each reusable slot through its last consumer.
// Persistent CTAs + bounded ring buffer release ONLY after ALL output N-blocks finish;
// SymmBuffer contents + July recipe (1, 1, 32) fixed K=32 + interleaved gate/up weights.
import {
  COSMOS,
  ROLE,
  aura,
  buildMegaMoeRing3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ringOwnership(s, c) {
  const phase = s.value(0);
  const overlap3d = s.value(0.25);
  const step = s.value(0); // 1=persistent CTAs, 2=all N-blocks release, 3=SymmBuffer, 4=recipe (1,1,32), 5=2 vs 1 slot, 6=verify

  const bgAura = aura(445, 20, 520, '#5ce1e620', '#a78bfa1c');
  const { view: ring3d } = buildMegaMoeRing3d(overlap3d, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['Lease Each Ring Slot', 'to Its Last Consumer'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.c,
    eyebrow: 'PERSISTENT RING · SYMMETRIC MEMORY',
    subtitle: 'Producer done != slot safe; wait for every output N-block',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D PERSISTENT RING OWNERSHIP', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Early overwrite = silent data race, not a CUDA crash', 455, 435, 26, ROLE.warn, 'sans'),
    ];

    // Top panel: Consumer reference counter bar (N-blocks 0, 1, 2, 3)
    const releaseLit = st >= 1.6;
    nodes.push(
      glassCell(-460, -118, 800, 140, releaseLit ? ROLE.warn : ROLE.a, {
        fill: '#0e172a',
        glow: releaseLit ? 9 : 5,
      }),
      txt('PERSISTENT CTA RING SLOT LEASE', -830, -162, 26, ROLE.a, 'mono', 'left'),
      txt(
        releaseLit
          ? 'N0:done · N1:done · N2:reading -> LOCKED'
          : 'Resident CTAs claim tasks without relaunch',
        -830,
        -118,
        26,
        releaseLit ? ROLE.warn : COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        releaseLit
          ? 'Release only when all output N-blocks finish'
          : 'Warmup & task order gate consumer visibility',
        -830,
        -74,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    // Middle row: SymmBuffer + Recipe (1,1,32)
    nodes.push(
      glassCell(-665, 58, 385, 146, st >= 2.6 ? ROLE.scale : COSMOS.dim, {
        fill: '#1a1430',
        glow: st >= 2.6 ? 8 : 0,
      }),
      txt('SYMMETRIC BUFFER', -665, 14, 26, ROLE.scale, 'mono'),
      txt('tokens · scales · routes', -665, 58, 26, COSMOS.ink, 'mono'),
      txt('intermediates + EP sync', -665, 102, 26, COSMOS.muted, 'sans'),

      glassCell(-245, 58, 405, 146, st >= 3.6 ? ROLE.gold : COSMOS.dim, {
        fill: '#201a10',
        glow: st >= 3.6 ? 8 : 0,
      }),
      txt('JULY LOW-BIT RECIPE', -245, 14, 26, ROLE.gold, 'mono'),
      txt('recipe = (1, 1, 32) fixed', -245, 58, 26, COSMOS.ink, 'mono'),
      txt('gate/up interleaved wts', -245, 102, 26, COSMOS.muted, 'sans'),
    );

    // Bottom row: 2 slots vs 1 slot & distributed verification
    if (st >= 4.6) {
      nodes.push(
        glassCell(-460, 240, 800, 92, st >= 5.5 ? ROLE.good : ROLE.c, {
          fill: '#0e222a',
          glow: 8,
        }),
        txt(
          st >= 5.5
            ? 'Verify rank participation, dims & buffer capacity'
            : '2 slots -> overlap NVLink/compute · 1 slot -> stalls',
          -460,
          240,
          26,
          st >= 5.5 ? ROLE.good : ROLE.c,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        'Copy fresh routing inputs into typed buffer views before each call',
        -860,
        362,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.94 });

  c.on('ro-persist', () => s.play(step.to(1, { duration: remainDuration(c, 'ro-persist', 0.45) })));
  c.on('ro-release', () => s.play(step.to(2, { duration: remainDuration(c, 'ro-release', 0.45) })));
  c.on('ro-symm', () => s.play(step.to(3, { duration: remainDuration(c, 'ro-symm', 0.45) })));
  c.on('ro-recipe', () => {
    const dur = remainDuration(c, 'ro-recipe', 0.45);
    s.play(step.to(4, { duration: dur }));
    s.play(overlap3d.to(0.95, { duration: dur }));
  });
  c.on('ro-two-vs-one', () =>
    s.play(step.to(5, { duration: remainDuration(c, 'ro-two-vs-one', 0.45) })),
  );
  c.on('ro-verify', () => s.play(step.to(6, { duration: remainDuration(c, 'ro-verify', 0.45) })));
}
