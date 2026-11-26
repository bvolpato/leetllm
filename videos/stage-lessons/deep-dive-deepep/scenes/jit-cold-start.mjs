// Scene 25: Separate installation, first specialization and steady-state execution.
// Runtime JIT specialization key (topology, layout, hidden bytes, alignment, warps/SMs/QPs, compiler) -> warm cache vs cold compile.
import {
  COSMOS,
  ROLE,
  aura,
  buildJitAndStackRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function jitColdStart(s, c) {
  const phase = s.value(0);
  const stackStage = s.value(0);
  const alignChanged = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c24', '#6ee7b71a');
  const { view: rig3d } = buildJitAndStackRig3d(stackStage, phase, { x: 470, y: 12, unit: 94 });

  const title = heroTitle(['Separate Install,', 'Compile & Warm Run'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.brand,
    eyebrow: 'DEEPJIT RUNTIME · SPECIALIZATION SIGNATURE',
    subtitle: 'First dispatch compiles a specialized CUBIN for the active shape',
  });

  const keys = [
    'topology',
    'layout',
    'hidden bytes',
    'alignment',
    'warps / SMs / QPs',
    'compiler + flags',
  ];

  const live = guardedDynamic(1, () => {
    const isChanged = Math.round(alignChanged.value) >= 1;

    const nodes = [
      txt('3D DEEPJIT LOWERING & CUBIN CACHE', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        isChanged
          ? 'Change alignment -> new specialization key -> cold compile'
          : 'Host extension installed · DeepJIT builds per-GPU kernels',
        470,
        435,
        26,
        isChanged ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
      txt('CACHE SIGNATURE INPUTS', -860, -135, 26, ROLE.token, 'mono', 'left'),
    ];

    keys.forEach((k, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = -655 + col * 430;
      const cy = -64 + row * 82;
      const hitAlign = isChanged && k === 'alignment';
      const border = hitAlign ? ROLE.bad : ROLE.rank0;
      nodes.push(
        rect(396, 62, {
          fill: hitAlign ? '#2e101c' : '#0e182c',
          stroke: border,
          width: hitAlign ? 2.8 : 2.0,
          radius: 8,
        }).at(cx, cy),
        txt(
          hitAlign ? 'alignment (CHANGED!)' : k,
          cx,
          cy,
          26,
          hitAlign ? ROLE.bad : COSMOS.ink,
          'mono',
        ),
      );
    });

    nodes.push(
      glassCell(-440, 218, 820, 108, isChanged ? ROLE.bad : ROLE.good, {
        fill: isChanged ? '#29101a' : '#0d241c',
        glow: 7,
      }),
      txt(
        isChanged
          ? 'Cache MISS -> recompile for new alignment!'
          : 'Cache HIT -> steady-state warm kernel launch',
        -440,
        196,
        27,
        isChanged ? ROLE.bad : ROLE.good,
        'mono',
      ),
      txt(
        isChanged
          ? 'Pre-warm every required shape on every worker at startup'
          : 'Import success never guarantees first-dispatch compile works',
        -440,
        244,
        26,
        COSMOS.muted,
        'sans',
      ),
      txt(
        'Record compiler, target GPU & cache signature for warm runs',
        -860,
        345,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-jit-cold-start-b0', () =>
    s.play(stackStage.to(1, { duration: remainDuration(c, 'de-jit-cold-start-b0', 0.85) })),
  );
  c.on('de-jit-cold-start-b1', () => {
    const dur = remainDuration(c, 'de-jit-cold-start-b1', 0.75);
    s.play(alignChanged.to(1, { duration: dur }));
    s.play(stackStage.to(2, { duration: dur }));
  });
}
