// Scene 06: Count the processes that own one request (V1 multiprocessing: API A + Cores D + Workers N + (D>1 ? 1 : 0); TP4/DP1 = 6; TP2/DP4 = 17; orbiting 3D V1 topology).
import {
  COSMOS,
  ROLE,
  aura,
  buildV1TopologyRig3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function processOwners(s, c) {
  const phase = s.value(0);
  // step: 0=V1 roles + ZeroMQ, 1=formula A+D+N+(D>1), 2=TP4/DP1 -> 6, 3=TP2/DP4 -> 17, 4=trace slow reply by process boundary
  const step = s.value(0);
  const scaleVal = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e61e', '#ffd16618');
  const rig3d = buildV1TopologyRig3d(scaleVal, phase, { x: 475, y: 20, unit: 92 });

  const title = heroTitle(['Count the Processes', 'That Own One Request'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kv,
    eyebrow: 'V1 MULTIPROCESSING · API · ZEROMQ · ENGINECORE · WORKERS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const isMulti = st === 3;
    const nodes = [
      txt(
        isMulti
          ? '3D SCALE-OUT: 4 DP CORES + 8 WORKERS'
          : '3D V1 PIPELINE: API -> CORE -> GPU WORKERS',
        475,
        -395,
        26,
        isMulti ? COSMOS.gold : ROLE.kv,
        'mono',
      ).glow(5, isMulti ? COSMOS.gold : ROLE.kv),
      txt('ZeroMQ links every API server to every EngineCore', 475, 400, 26, COSMOS.muted, 'mono'),
    ];

    // 3 ownership tiers on left
    const tiers = [
      [
        'API SERVERS (A)',
        isMulti ? 'A = 4' : 'A = 1',
        'Parse HTTP, tokenize, decode media, stream tokens',
        ROLE.r0,
      ],
      [
        'ENGINE CORES (D)',
        isMulti ? 'D = 4 + 1 Coord' : 'D = 1',
        'Own scheduler loop & KV block pool per DP rank',
        COSMOS.gold,
      ],
      [
        'GPU WORKERS (N)',
        isMulti ? 'N = 8 (TP=2)' : 'N = 4 (TP=4)',
        'Run model runner, attention kernels & collectives',
        ROLE.kv,
      ],
    ];
    tiers.forEach(([name, badge, desc, col], i) => {
      const cy = -175 + i * 138;
      nodes.push(
        glassCell(-420, cy, 860, 118, col, { fill: '#101a2e', glow: st === 4 ? 9 : 6 }),
        txt(name, -815, cy - 26, 26, col, 'mono', 'left'),
        txt(badge, -20, cy - 26, 26, COSMOS.ink, 'mono', 'right'),
        txt(desc, -815, cy + 24, 26, COSMOS.muted, 'sans', 'left'),
      );
    });

    // Bottom formula / count receipt
    const formulaBoxCol = st >= 2 && st <= 3 ? ROLE.good : ROLE.r1;
    nodes.push(glassCell(-420, 240, 860, 126, formulaBoxCol, { fill: '#0e202a', glow: 9 }));
    if (st === 2) {
      nodes.push(
        txt('4 GPUs · TP = 4 · DP = 1  (NO COORDINATOR)', -420, 206, 26, ROLE.good, 'mono'),
        glowTex(String.raw`1 + 1 + 4 = 6\ \text{main processes}`, {
          x: -420,
          y: 262,
          size: 38,
          color: ROLE.good,
          glow: 6,
        }),
      );
    } else if (st === 3) {
      nodes.push(
        txt('8 GPUs · TP = 2 · DP = 4  (+1 COORDINATOR)', -420, 206, 26, COSMOS.gold, 'mono'),
        glowTex(String.raw`4 + 4 + 8 + 1 = 17\ \text{main processes}`, {
          x: -420,
          y: 262,
          size: 38,
          color: COSMOS.gold,
          glow: 6,
        }),
      );
    } else if (st === 4) {
      nodes.push(
        txt('SLOW-REPLY BOUNDARY CHECK', -420, 206, 26, ROLE.bad, 'mono'),
        txt(
          'CPU starvation in API or Core stalls GPUs with spare capacity',
          -420,
          262,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      nodes.push(
        txt('DOCUMENTED MAIN-PROCESS COUNT', -420, 206, 26, ROLE.r1, 'mono'),
        glowTex(String.raw`\text{Total} = A + D + N + \mathbb{1}[D > 1]`, {
          x: -420,
          y: 262,
          size: 36,
          color: COSMOS.gold,
          glow: 6,
        }),
      );
    }

    nodes.push(
      txt(
        'Auxiliary OS processes excluded; API server count defaults to DP ranks',
        -855,
        368,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, rig3d.view, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { theta: -0.2, phi: 0.88 });
  wireStepCues(s, c, step, [
    ['vv-process-owners-op-0', 0],
    ['vv-process-owners-op-1', 1],
    ['vv-process-owners-single-six', 2],
    ['vv-process-owners-parallel-seventeen', 3],
    ['vv-process-owners-op-2', 4],
  ]);
  c.on('vv-process-owners-parallel-seventeen', () => s.play(scaleVal.to(1, { duration: 0.4 })));
}
