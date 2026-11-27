// Scene 19: Read the constructed runner inside the installed engine (gpu_worker branches on use_v2_model_runner inside V1; hardware platforms & hybrid/SSM cache groups; resolving doc-vs-release conflicts).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function runnerVersions(s, c) {
  // step: 0=op-0 gpu_worker branch, 1=v1-engine (V2 runner inside V1!), 2=op-1 platforms & hybrid/SSM, 3=op-2 / guide-conflict resolution
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61a', '#a78bfa18');
  const title = heroTitle(['Read the Constructed Runner', 'Inside the Installed Engine'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'V1 ENGINE · GPU_WORKER BRANCH · PLATFORM & HYBRID MATRIX',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 1) {
      nodes.push(
        glassCell(0, -190, 1680, 118, ROLE.r0, { fill: '#101f38', glow: 8 }),
        txt(
          'V1 ENGINE CORE  ->  vllm/v1/worker/gpu_worker.py   (v0.28.0)',
          0,
          -216,
          26,
          ROLE.r0,
          'mono',
        ),
        txt(
          'Branch flag:  use_v2_model_runner  (selects runner inside V1)',
          0,
          -162,
          28,
          COSMOS.gold,
          'mono',
        ),

        glassCell(-430, 18, 800, 185, st === 0 ? ROLE.kv : COSMOS.dim, {
          fill: '#0e202c',
          glow: st === 0 ? 9 : 4,
        }),
        txt('use_v2_model_runner = False', -430, -34, 26, ROLE.kv, 'mono'),
        txt('v1/worker/gpu_model_runner.py', -430, 18, 28, COSMOS.ink, 'mono'),
        txt('Established V1 GPU model runner path', -430, 72, 26, COSMOS.muted, 'sans'),

        glassCell(430, 18, 800, 185, st >= 1 ? ROLE.good : ROLE.r1, {
          fill: st >= 1 ? '#0e2924' : '#18142e',
          glow: st >= 1 ? 11 : 5,
        }),
        txt('use_v2_model_runner = True', 430, -34, 26, st >= 1 ? ROLE.good : ROLE.r1, 'mono'),
        txt('v1/worker/gpu/model_runner.py', 430, 18, 28, COSMOS.ink, 'mono'),
        txt(
          'Modular V2 runner (still inside V1 engine!)',
          430,
          72,
          26,
          st >= 1 ? ROLE.good : COSMOS.muted,
          'sans',
        ),

        glassCell(0, 210, 1680, 96, COSMOS.gold, { fill: '#221c0e', glow: 8 }),
        txt(
          'Inspect the resolved config branch BEFORE tracing tensor prep or attention kernels',
          0,
          210,
          28,
          COSMOS.gold,
          'sans',
        ),
      );
    } else if (st === 2) {
      const rows = [
        [
          'ACCELERATORS',
          'NVIDIA · AMD · Intel GPU · TPU · CPU + Plugins',
          'Functional path != every feature combination',
          ROLE.r0,
        ],
        [
          'FULL ATTENTION',
          'Paged KV blocks (K, V per layer & head)',
          'Our 4-token block math describes this path',
          ROLE.kv,
        ],
        [
          'HYBRID / SSM',
          'Mamba / recurrent state checkpoints',
          'Different retention & caching contracts!',
          COSMOS.gold,
        ],
      ];
      rows.forEach(([k, val, sub, col], i) => {
        const cy = -140 + i * 165;
        nodes.push(
          glassCell(0, cy, 1680, 138, col, { fill: '#101a2d', glow: 8 }),
          txt(k, -800, cy - 30, 26, col, 'mono', 'left'),
          txt(val, 800, cy - 30, 28, COSMOS.ink, 'mono', 'right'),
          txt(sub, -800, cy + 26, 26, COSMOS.muted, 'sans', 'left'),
        );
      });
    } else {
      nodes.push(
        glassCell(-430, -135, 800, 165, ROLE.bad, { fill: '#2a1320', glow: 8 }),
        txt('MOVING DOCS GUIDE', -430, -178, 26, ROLE.bad, 'mono'),
        txt('Restricted Mamba prefix caching', -430, -124, 30, COSMOS.ink, 'sans'),
        txt('Docs drift across release lines', -430, -76, 26, COSMOS.muted, 'sans'),

        glassCell(430, -135, 800, 165, COSMOS.gold, { fill: '#241d0e', glow: 8 }),
        txt('PINNED RELEASE NOTES', 430, -178, 26, COSMOS.gold, 'mono'),
        txt('Advertised default Mamba support', 430, -124, 30, COSMOS.ink, 'sans'),
        txt('Later releases renamed flags & added checkpoints', 430, -76, 26, COSMOS.muted, 'sans'),

        glassCell(0, 128, 1680, 175, ROLE.good, { fill: '#0e2924', glow: 10 }),
        txt('HOW TO RESOLVE VERSION CONFLICTS', 0, 78, 26, ROLE.good, 'mono'),
        txt(
          'Installed Code   +   Model & Cache Config   +   Targeted Tests',
          0,
          136,
          32,
          COSMOS.ink,
          'mono',
        ),
        txt(
          'Neither a moving guide nor a release headline substitutes for execution context',
          0,
          190,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        st <= 1
          ? '"V2" here names a modular model runner inside the V1 engine'
          : st === 2
            ? 'Platform support does not automatically settle tuning or hybrid cache contracts'
            : 'Verify feature flags directly against the installed vLLM release',
        0,
        378,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-runner-versions-op-0', 0],
    ['vv-runner-versions-v1-engine', 1, true],
    ['vv-runner-versions-op-1', 2],
    ['vv-runner-versions-op-2', 3],
    ['vv-runner-versions-guide-conflict', 3, true],
  ]);
}
