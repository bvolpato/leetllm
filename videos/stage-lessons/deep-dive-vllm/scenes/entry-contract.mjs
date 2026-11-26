// Scene 02: Choose the entry path and preserve the version (LLM.generate vs vllm serve, v0.28 vs v0.31 pinned tags, registered routes + --enable-scale-out).
import {
  COSMOS,
  ROLE,
  aura,
  buildV1TopologyRig3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function entryContract(s, c) {
  const phase = s.value(0);
  // step: 0 = offline vs online paths, 1 = pinned versions v0.28 / v0.31, 2 = vllm serve routes & --enable-scale-out
  const step = s.value(0);
  const scaleVal = s.value(0);

  const bgAura = aura(440, 20, 560, '#5ce1e61c', '#60a5fa18');
  const rig3d = buildV1TopologyRig3d(scaleVal, phase, { x: 475, y: 20, unit: 90 });

  const title = heroTitle(['Two Entry Paths,', 'One Pinned Engine'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.kv,
    eyebrow: 'ENTRY CONTRACT · OFFLINE PYTHON VS ONLINE HTTP',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [
      txt('V1 SHARED ENGINE TOPOLOGY', 475, -395, 26, ROLE.kv, 'mono').glow(5, ROLE.kv),
      txt('API -> ZeroMQ -> EngineCore -> Workers', 475, 400, 26, COSMOS.muted, 'mono'),
    ];

    if (st === 0) {
      nodes.push(
        glassCell(-420, -145, 860, 140, ROLE.r0, { fill: '#101f38', glow: 8 }),
        txt('OFFLINE: LLM.generate (Python)', -815, -180, 26, ROLE.r0, 'mono', 'left'),
        txt(
          'Caller waits for batch; workers run in separate processes',
          -815,
          -125,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),

        glassCell(-420, 30, 860, 140, ROLE.kv, { fill: '#0e222e', glow: 8 }),
        txt('ONLINE: vllm serve (HTTP Streaming)', -815, -5, 26, ROLE.kv, 'mono', 'left'),
        txt(
          'Client streams tokens as they arrive from the API server',
          -815,
          50,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),

        glassCell(-420, 205, 860, 130, ROLE.r1, { fill: '#1a1530', glow: 6 }),
        txt('MODEL + RUNNER TASKS', -815, 175, 26, ROLE.r1, 'mono', 'left'),
        txt(
          'Generation | Pooling | Reranking (per model & runner)',
          -815,
          225,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),
      );
    } else if (st === 1) {
      const rows = [
        ['Request trace', 'v0.28.0', 'CPU block math · full attention · GPU KV', ROLE.r0],
        ['Adapter key diff', 'v0.31.0', 'Tagged cache identity + adapter path', ROLE.good],
        ['Decoding path', 'Ordinary', 'Same R0 / R1 records across both releases', COSMOS.gold],
      ];
      rows.forEach(([k, ver, desc, col], i) => {
        const cy = -145 + i * 170;
        nodes.push(
          glassCell(-420, cy, 860, 140, col, { fill: '#111a2c', glow: 8 }),
          txt(k, -815, cy - 32, 26, col, 'mono', 'left'),
          txt(ver, -20, cy - 32, 28, COSMOS.gold, 'mono', 'right'),
          txt(desc, -815, cy + 24, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    } else {
      nodes.push(
        glassCell(-420, -145, 860, 140, ROLE.good, { fill: '#0e2824', glow: 9 }),
        txt('CANONICAL ENTRYPOINT: vllm serve', -815, -180, 26, ROLE.good, 'mono', 'left'),
        txt(
          'v0.30 deprecated the old Python API module (compat shim)',
          -815,
          -125,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),

        glassCell(-420, 30, 860, 140, COSMOS.gold, { fill: '#221c0e', glow: 8 }),
        txt('OPT-IN ROUTES: --enable-scale-out', -815, -5, 26, COSMOS.gold, 'mono', 'left'),
        txt(
          'Copied env vars can silently omit scale-out routes',
          -815,
          50,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),

        glassCell(-420, 205, 860, 130, ROLE.kv, { fill: '#0f202c', glow: 7 }),
        txt('PRESERVE BEFORE COMPARING', -815, 175, 26, ROLE.kv, 'mono', 'left'),
        txt(
          'Installed revision + Registered routes + Resolved config',
          -815,
          225,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),
      );
    }

    const u = (p * 0.6) % 1;
    nodes.push(
      glowDot(-820 + u * 780, 330, { radius: 6, color: ROLE.kv }),
      txt(
        st === 0
          ? 'Both entry paths drive the same V1 engine core'
          : st === 1
            ? 'Pin the release tag beside every observed capability'
            : 'Inspect registered routes and config before attributing engine features',
        -855,
        390,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, rig3d.view, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { theta: -0.22, phi: 0.88 });
  wireStepCues(s, c, step, [
    ['vv-entry-contract-op-0', 0],
    ['vv-entry-contract-op-1', 1],
    ['vv-entry-contract-op-2', 2],
  ]);
  c.on('vv-entry-contract-op-2', () => s.play(scaleVal.to(1, { duration: 0.4 })));
}
