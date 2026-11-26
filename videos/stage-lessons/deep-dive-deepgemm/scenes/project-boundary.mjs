// Scene 02: Who does the work for this row?
// Ownership boundaries: Model / Router / DeepGEMM / Serving Runtime + July 15 & Oct 10 snapshots.
import {
  COSMOS,
  ROLE,
  aura,
  buildMegaMoeRing3d,
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

export default function projectBoundary(s, c) {
  const phase = s.value(0);
  const overlapVal = s.value(0.2);
  const activeLayer = s.value(0); // 0=init, 1=mit/deepgemm, 2=runtime, 3=diag, 4=kernel-trace, 5=snapshots, 6=cpu-gpu

  const bgAura = aura(445, 20, 520, '#60a5fa20', '#a78bfa18');
  const { view: ring3d } = buildMegaMoeRing3d(overlapVal, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['Who Does the Work', 'for This Row?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: 'PROJECT SCOPE · PHYSICAL OWNERS',
    subtitle: 'Same routed token row across four distinct layers',
  });

  const layers = [
    { name: 'MODEL + ROUTER', detail: 'Defines experts, dims, top-k IDs', color: ROLE.a },
    { name: 'DEEPGEMM (MIT)', detail: 'Dense/grouped GEMM, indexer, Mega MoE', color: ROLE.c },
    {
      name: 'SERVING RUNTIME',
      detail: 'Loads model, batches, owns request clock',
      color: ROLE.good,
    },
    { name: 'SNAPSHOTS + REF', detail: 'July 15 -> Oct 10 · 5 CPU refs vs GPU', color: ROLE.scale },
  ];

  const live = guardedDynamic(1, () => {
    const st = activeLayer.value;
    const nodes = [
      txt('3D MULTI-RANK KERNEL SURFACE', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('DeepGEMM runs the hot loop; runtime owns the clock', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    layers.forEach((layer, idx) => {
      const y = -135 + idx * 124;
      const lit =
        (idx === 0 && st >= 0.5) ||
        (idx === 1 && st >= 0.8) ||
        (idx === 2 && st >= 1.8) ||
        (idx === 3 && st >= 4.5);
      const focus =
        (idx === 1 && ((st >= 0.8 && st < 1.8) || (st >= 3.5 && st < 4.5))) ||
        (idx === 2 && st >= 1.8 && st < 3.5) ||
        (idx === 3 && st >= 4.5);

      const borderCol = focus ? ROLE.gold : lit ? layer.color : COSMOS.dim;
      nodes.push(
        glassCell(-460, y, 780, 96, borderCol, {
          fill: focus ? '#142038' : '#0d1528',
          glow: focus ? 10 : lit ? 4 : 0,
        }),
        txt(layer.name, -825, y - 18, 26, focus ? ROLE.gold : layer.color, 'mono', 'left'),
        txt(layer.detail, -825, y + 22, 26, lit ? COSMOS.ink : COSMOS.muted, 'sans', 'left'),
      );

      if (idx < 3) {
        nodes.push(
          line([-460, y + 48], [-460, y + 76], {
            stroke: lit ? layer.color : COSMOS.dim,
            width: 2.5,
          }),
        );
      }
    });

    const footerMsg =
      st >= 5.5
        ? 'Pin the revision + compare GPU rows against CPU reference'
        : st >= 4.5
          ? 'Sept releases changed compilation + indexer interface'
          : st >= 3.5
            ? 'Trace tile load -> store; compare grouped vs separate'
            : st >= 2.5
              ? 'Slow grouped multiply? Inspect wrapper, tile, share of clock'
              : 'MIT-licensed kernel library + HyperConnection state ops';

    nodes.push(txt(footerMsg, -860, 388, 26, st >= 5.5 ? ROLE.good : COSMOS.gold, 'sans', 'left'));

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.94 });

  c.on('pb-mit', () => s.play(activeLayer.to(1, { duration: remainDuration(c, 'pb-mit', 0.4) })));
  c.on('pb-runtime', () =>
    s.play(activeLayer.to(2, { duration: remainDuration(c, 'pb-runtime', 0.4) })),
  );
  c.on('pb-slow', () => s.play(activeLayer.to(3, { duration: remainDuration(c, 'pb-slow', 0.4) })));
  c.on('pb-kernel', () => {
    const dur = remainDuration(c, 'pb-kernel', 0.5);
    s.play(activeLayer.to(4, { duration: dur }));
    s.play(overlapVal.to(0.85, { duration: dur }));
  });
  c.on('pb-snapshots', () =>
    s.play(activeLayer.to(5, { duration: remainDuration(c, 'pb-snapshots', 0.45) })),
  );
  c.on('pb-cpu-gpu', () =>
    s.play(activeLayer.to(6, { duration: remainDuration(c, 'pb-cpu-gpu', 0.45) })),
  );
}
