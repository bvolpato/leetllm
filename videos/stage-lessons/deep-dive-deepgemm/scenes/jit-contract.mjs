// Scene 10: Publish a complete generated signature.
// July JIT: key = name + compiler + flags + generated source; dynamic dims excluded; temp dir -> atomic rename.
import {
  COSMOS,
  ROLE,
  aura,
  buildJitLowering3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function jitContract(s, c) {
  const phase = s.value(0);
  const stage3d = s.value(0);
  const step = s.value(0); // 1=signature, 2=dynamic dim, 3=atomic rename, 4=concurrent rank, 5=$HOME/.deep_gemm, 6=cold vs warm

  const bgAura = aura(445, 20, 520, '#a78bfa22', '#6ee7b718');
  const { view: jit3d } = buildJitLowering3d(stage3d, phase, { x: 455, y: 15, unit: 92 });

  const title = heroTitle(['Publish a Complete', 'Generated Signature'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.scale,
    eyebrow: 'RUNTIME JIT · JULY COMPILER CONTRACT',
    subtitle: 'Specialize CUBINs on demand and publish atomically',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D JIT TEMPLATE LOWERING', 455, -415, 26, ROLE.scale, 'mono').glow(5, ROLE.scale),
      txt(
        'Signature -> NVCC/NVRTC compile -> Atomic CUBIN cache',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Signature components
    const sigItems = [
      { label: 'Kernel', col: ROLE.a },
      { label: 'Compiler', col: ROLE.scale },
      { label: 'Eff. Flags', col: ROLE.c },
      { label: 'Gen. Src', col: ROLE.gold },
    ];
    nodes.push(txt('CACHE KEY = DIGEST(SIGNATURE)', -860, -172, 26, ROLE.scale, 'mono', 'left'));
    sigItems.forEach((it, i) => {
      const ix = -758 + i * 198;
      const lit = st >= 0.6;
      nodes.push(
        glassCell(ix, -104, 184, 74, lit ? it.col : COSMOS.dim, {
          fill: '#0e172a',
          glow: lit ? 7 : 0,
        }),
        txt(it.label, ix, -104, 26, lit ? it.col : COSMOS.muted, 'mono'),
      );
    });

    // Dynamic dim note
    if (st >= 1.6) {
      nodes.push(
        txt(
          'Dynamic dim (set_ignore_compile_dims) -> no new binary needed',
          -860,
          -18,
          26,
          ROLE.good,
          'sans',
          'left',
        ),
      );
    }

    // Atomic publication flow: Temp Dir -> Close & Fsync -> Atomic Rename -> Cache
    const pubLit = st >= 2.6;
    nodes.push(
      glassCell(-735, 86, 236, 92, pubLit ? ROLE.a : COSMOS.dim, {
        fill: '#101d36',
        glow: pubLit ? 7 : 0,
      }),
      txt('Unique Tmp Dir', -735, 66, 26, ROLE.a, 'mono'),
      txt('NVCC / NVRTC', -735, 108, 26, COSMOS.muted, 'mono'),

      line([-614, 86], [-580, 86], { stroke: pubLit ? ROLE.gold : COSMOS.dim, width: 3 }),
      glassCell(-455, 86, 240, 92, pubLit ? ROLE.gold : COSMOS.dim, {
        fill: '#221c10',
        glow: pubLit ? 8 : 0,
      }),
      txt('Atomic Rename', -455, 66, 26, ROLE.gold, 'mono'),
      txt('fsync + publish', -455, 108, 26, COSMOS.muted, 'mono'),

      line([-332, 86], [-298, 86], { stroke: pubLit ? ROLE.good : COSMOS.dim, width: 3 }),
      glassCell(-165, 86, 256, 92, st >= 4.5 ? ROLE.good : COSMOS.dim, {
        fill: '#0e2620',
        glow: st >= 4.5 ? 9 : 0,
      }),
      txt(st >= 4.5 ? '$HOME/.deep_gemm' : 'Cache Entry', -165, 66, 26, ROLE.good, 'mono'),
      txt(st >= 3.5 ? '2 ranks may race' : 'complete CUBIN', -165, 108, 26, COSMOS.muted, 'mono'),
    );

    // Cold vs Disk hit vs Process hit strip
    if (st >= 5.5) {
      nodes.push(
        glassCell(-725, 250, 244, 86, ROLE.good, { fill: '#0e2620', glow: 8 }),
        txt('Process Hit', -725, 232, 26, ROLE.good, 'mono'),
        txt('loaded handle', -725, 270, 26, COSMOS.muted, 'sans'),

        glassCell(-460, 250, 244, 86, ROLE.c, { fill: '#0d2130', glow: 8 }),
        txt('Disk Hit', -460, 232, 26, ROLE.c, 'mono'),
        txt('read CUBIN', -460, 270, 26, COSMOS.muted, 'sans'),

        glassCell(-195, 250, 244, 86, ROLE.warn, { fill: '#281b10', glow: 8 }),
        txt('Cold Compile', -195, 232, 26, ROLE.warn, 'mono'),
        txt('build + rename', -195, 270, 26, COSMOS.muted, 'sans'),
      );
    }

    nodes.push(
      txt(
        st >= 5.5
          ? 'Report cold compile and warm cache latency separately'
          : 'Atomic rename prevents half-written CUBINs, not duplicate compiles',
        -860,
        382,
        26,
        st >= 5.5 ? ROLE.gold : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, jit3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, jit3d, { theta: -0.2, phi: 0.94 });

  c.on('jc-sig', () => s.play(step.to(1, { duration: remainDuration(c, 'jc-sig', 0.45) })));
  c.on('jc-dyn', () => s.play(step.to(2, { duration: remainDuration(c, 'jc-dyn', 0.45) })));
  c.on('jc-atomic', () => {
    const dur = remainDuration(c, 'jc-atomic', 0.55);
    s.play(step.to(3, { duration: dur }));
    s.play(stage3d.to(1, { duration: dur }));
  });
  c.on('jc-dup', () => s.play(step.to(4, { duration: remainDuration(c, 'jc-dup', 0.45) })));
  c.on('jc-root', () => {
    const dur = remainDuration(c, 'jc-root', 0.5);
    s.play(step.to(5, { duration: dur }));
    s.play(stage3d.to(2, { duration: dur }));
  });
  c.on('jc-cold', () => s.play(step.to(6, { duration: remainDuration(c, 'jc-cold', 0.45) })));
}
