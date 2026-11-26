// Scene 18: Count devices separately from independent sequences: 4D mesh DP(8) x TP(4) x PP(2) x CP(2) = 128 ranks; global batch = 1x4x8 = 32.
import {
  COSMOS,
  ROLE,
  aura,
  buildGpuRing3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
} from '../parts.mjs';

export default function mesh(s, c) {
  const ringHeight = s.value(0.65);
  const phase = s.value(0);
  const showExample = s.value(0);

  const bgAura = aura(420, 20, 520, '#5ce1e620', '#a78bfa18');
  const { view: ring3d } = buildGpuRing3d(ringHeight, phase, {
    x: 455,
    y: 25,
    unit: 100,
    gpus: 8,
    color: ROLE.comm,
  });

  const title = heroTitle(['Devices vs', 'Independent Sequences'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: '4D DEVICE MESH · DP × TP × PP × CP',
  });

  const eq = glowTex('\\text{World} = DP \\times TP \\times PP \\times CP', {
    x: -520,
    y: -190,
    size: 36,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const se = showExample.value;

    const axes = [
      { ax: 'DP = 8', role: 'independent seq replicas', col: ROLE.good },
      { ax: 'TP = 4', role: 'splits inside each layer', col: ROLE.weights },
      { ax: 'PP = 2', role: 'splits layer depth', col: ROLE.grads },
      { ax: 'CP = 2', role: 'splits sequence positions', col: ROLE.opt },
    ];

    const nodes = [
      txt('3D MULTI-AXIS GPU MESH', 455, -405, 26, ROLE.comm, 'mono').glow(5, ROLE.comm),
      txt('TP, PP, CP cooperate on shared sequences', 455, 420, 26, COSMOS.muted, 'sans'),
    ];

    axes.forEach((item, i) => {
      const y = -98 + i * 86;
      nodes.push(
        glassCell(-535, y, 640, 68, item.col, { fill: '#0e1b30', glow: 6 }),
        txt(item.ax, -820, y, 28, item.col, 'mono', 'left'),
        txt(item.role, -660, y, 26, COSMOS.ink, 'sans', 'left'),
      );
    });

    if (se > 0.02) {
      nodes.push(
        glassCell(-535, 305, 640, 128, ROLE.good, { fill: '#0d2624', glow: 9, opacity: se }),
        txt('8 × 4 × 2 × 2 = 128 RANKS', -535, 276, 30, COSMOS.gold, 'mono').opacity(se),
        txt('Global batch = 1 × 4 × 8 DP = 32', -535, 330, 26, ROLE.good, 'mono').opacity(se),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, eq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.92 });
  c.onBeat(1, () => s.play(showExample.to(1, { duration: 0.5 })));
}
