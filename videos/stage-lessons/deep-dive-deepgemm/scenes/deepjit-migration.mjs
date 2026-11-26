// Scene 11: Rebuild the cache contract across versions.
// Oct DeepJIT submodule + CUTLASS dep sig; $HOME/.dj; colon roots; DG_JIT -> DJ_JIT; dump on miss; no-local-mem / no-spills.
import {
  COSMOS,
  ROLE,
  aura,
  buildJitLowering3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function deepjitMigration(s, c) {
  const phase = s.value(0);
  const stage3d = s.value(0);
  const step = s.value(0); // 1=DeepJIT+CUTLASS, 2=colon roots, 3=checksum, 4=implicit env, 5=dump miss, 6=checks

  const bgAura = aura(445, 20, 520, '#5ce1e620', '#a78bfa1c');
  const { view: jit3d } = buildJitLowering3d(stage3d, phase, { x: 455, y: 15, unit: 92 });

  const title = heroTitle(['Rebuild the Cache', 'Across Versions'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: 'OCTOBER MIGRATION · DEEPJIT SUBMODULE',
    subtitle: 'New default cache root, multi-root lookup, and split checks',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D DEEPJIT CACHE STACK', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        'Search ordered roots left -> right; write miss to root[0]',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Migration comparison table-free slabs (July vs October)
    nodes.push(
      glassCell(-665, -110, 370, 128, COSMOS.dim, { fill: '#121626', glow: 2 }),
      txt('JULY SNAPSHOT', -665, -148, 26, COSMOS.muted, 'mono'),
      txt('$HOME/.deep_gemm', -665, -106, 26, COSMOS.ink, 'mono'),
      txt('DG_JIT_PTXAS_CHECK', -665, -66, 26, COSMOS.muted, 'mono'),

      glassCell(-250, -110, 410, 128, st >= 0.6 ? ROLE.c : COSMOS.dim, {
        fill: '#0e2030',
        glow: st >= 0.6 ? 9 : 0,
      }),
      txt('OCT DEEPJIT + CUTLASS', -250, -148, 26, ROLE.c, 'mono'),
      txt('$HOME/.dj  (DG -> DJ)', -250, -106, 26, ROLE.good, 'mono'),
      txt(
        st >= 5.5 ? 'NO_LOCAL_MEM + NO_SPILLS' : 'colon-separated roots',
        -250,
        -66,
        26,
        ROLE.gold,
        'mono',
      ),
    );

    // Ordered roots lookup bar
    if (st >= 1.6) {
      nodes.push(
        txt('DG_JIT_CACHE_DIR = root0 : root1 : root2', -860, 12, 26, ROLE.scale, 'mono', 'left'),
        txt(
          'Search front -> back; compile misses write to root0',
          -860,
          56,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    // Checksum vs Untracked Env
    if (st >= 2.6) {
      nodes.push(
        glassCell(-665, 174, 375, 134, ROLE.good, { fill: '#0e2520', glow: 7 }),
        txt('TRACKED CHECKSUM', -665, 132, 26, ROLE.good, 'mono'),
        txt('compiler · flags · src', -665, 172, 26, COSMOS.ink, 'mono'),
        txt('dep sig · post-hook', -665, 212, 26, COSMOS.muted, 'mono'),
      );
    }

    if (st >= 3.6) {
      nodes.push(
        glassCell(-245, 174, 415, 134, ROLE.warn, { fill: '#281a10', glow: 8 }),
        txt('IMPLICIT ENV (UNTRACKED)', -245, 132, 26, ROLE.warn, 'mono'),
        txt('CPATH · NVCC_APPEND', -245, 172, 26, COSMOS.ink, 'mono'),
        txt('Pin DeepJIT submodule!', -245, 212, 26, ROLE.warn, 'sans'),
      );
    }

    // Dump behavior on warm hit
    if (st >= 4.6) {
      nodes.push(
        glassCell(-460, 336, 800, 82, st >= 5.5 ? ROLE.good : ROLE.gold, {
          fill: '#18182a',
          glow: 8,
        }),
        txt(
          st >= 5.5
            ? 'Separate checks: no-local-memory & no-spills'
            : 'PTX/SASS dumps run on miss only (warm hit skips)',
          -460,
          336,
          26,
          st >= 5.5 ? ROLE.good : ROLE.gold,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, jit3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, jit3d, { theta: -0.2, phi: 0.94 });

  c.on('dj-sub', () => s.play(step.to(1, { duration: remainDuration(c, 'dj-sub', 0.45) })));
  c.on('dj-roots', () => {
    const dur = remainDuration(c, 'dj-roots', 0.5);
    s.play(step.to(2, { duration: dur }));
    s.play(stage3d.to(1, { duration: dur }));
  });
  c.on('dj-hash', () => s.play(step.to(3, { duration: remainDuration(c, 'dj-hash', 0.45) })));
  c.on('dj-env', () => s.play(step.to(4, { duration: remainDuration(c, 'dj-env', 0.45) })));
  c.on('dj-dump', () => {
    const dur = remainDuration(c, 'dj-dump', 0.5);
    s.play(step.to(5, { duration: dur }));
    s.play(stage3d.to(2, { duration: dur }));
  });
  c.on('dj-checks', () => s.play(step.to(6, { duration: remainDuration(c, 'dj-checks', 0.45) })));
}
