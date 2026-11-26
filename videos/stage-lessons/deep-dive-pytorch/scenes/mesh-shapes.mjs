// Scene 15: A placement belongs to a named mesh dimension (DeviceMesh (dp=2, tp=4), [4096, 16384] Shard(1) -> [4096, 4096] local, redistribution table).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  buildMeshGrid3d,
  glassCell,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function meshShapes(s, c) {
  const phase = s.value(0);
  const meshMode = s.value(0);
  const stage = s.value(0); // 0=placements, 1=2x4 mesh 4096x16384, 2=local 4096x4096, 3=redistribution transitions

  const bgAura = aura(445, 25, 520, '#60a5fa20', '#6ee7b718');
  const { view: mesh3d } = buildMeshGrid3d(meshMode, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Placement Belongs to a', 'Named Mesh Axis'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.copy,
    eyebrow: 'DEVICEMESH (DP=2, TP=4) · DTENSOR AXES',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;

    const nodes = [
      txt('3D DEVICEMESH (dp=2 × tp=4)', 475, -390, 26, ROLE.copy, 'mono').glow(5, ROLE.copy),
      txt('Gold links: tp axis  ·  Green links: dp axis', 475, 405, 26, COSMOS.muted, 'mono'),

      // Top card: Placement taxonomy or 4096x16384 slice math
      glassCell(-420, -110, 860, 210, st >= 1.5 ? ROLE.good : ROLE.orig, {
        fill: st >= 1.5 ? '#0e2624' : '#0f1b33',
        glow: 9,
      }),
      txt(
        st >= 0.5 ? 'GLOBAL WEIGHT: [4096, 16384]' : 'DTENSOR PLACEMENT TYPES',
        -420,
        -172,
        28,
        st >= 0.5 ? COSMOS.gold : ROLE.orig,
        'mono',
      ),
      txt(
        st >= 0.5
          ? 'dp=2: Replicate()   ·   tp=4: Shard(1)'
          : 'Replicate() · Shard(dim) · Partial(sum)',
        -420,
        -112,
        28,
        COSMOS.ink,
        'mono',
      ),
      txt(
        st >= 1.5
          ? 'LOCAL SLICE PER RANK: [4096, 4096]'
          : 'Each DeviceMesh axis carries its own placement',
        -420,
        -48,
        28,
        st >= 1.5 ? ROLE.good : COSMOS.muted,
        'mono',
      ),

      // Bottom card: Redistribution collectives
      glassCell(-420, 145, 860, 220, st >= 2.5 ? ROLE.copy : COSMOS.dim, {
        fill: st >= 2.5 ? '#0d202b' : '#0a0f1c',
        glow: st >= 2.5 ? 9 : 2,
      }),
      txt(
        'AXIS REDISTRIBUTION COLLECTIVES',
        -420,
        72,
        28,
        st >= 2.5 ? ROLE.copy : COSMOS.dim,
        'mono',
      ),
      txt(
        'Shard(d) -> Replicate()     :  all_gather',
        -420,
        128,
        26,
        st >= 2.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt(
        'Partial  -> Replicate()     :  all_reduce',
        -420,
        174,
        26,
        st >= 2.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt(
        'Partial  -> Shard(d)        :  reduce_scatter',
        -420,
        220,
        26,
        st >= 2.5 ? ROLE.good : COSMOS.dim,
        'mono',
      ),

      txt(
        'Transform one mesh axis while preserving the other; always price real bytes & VRAM',
        -855,
        345,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, mesh3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, mesh3d, { theta: -0.2, phi: 0.88 });

  c.on('pt-mesh-shapes-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-mesh-shapes-1', () => {
    const dur = remainDuration(c, 'pt-mesh-shapes-1', 0.45);
    s.play(stage.to(1, { duration: dur }));
    s.play(meshMode.to(1, { duration: dur }));
  });
  c.on('pt-mesh-local', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-mesh-local', 0.4) })),
  );
  c.on('pt-mesh-shapes-2', () => {
    const dur = remainDuration(c, 'pt-mesh-shapes-2', 0.45);
    s.play(stage.to(3, { duration: dur }));
    s.play(meshMode.to(2, { duration: dur }));
  });
}
