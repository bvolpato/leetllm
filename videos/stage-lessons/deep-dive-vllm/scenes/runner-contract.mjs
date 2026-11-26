// Scene 17: Keep admitted work intact across the worker boundary (SchedulerOutput metadata: ID R1, inputs 5, len 9, block table [12,73,90]; mixing R0's [12,41] reads "green" instead of "stone"; CUDA graph / eager + warmed benchmarks).
import {
  COSMOS,
  ROLE,
  aura,
  buildPagedKvRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function runnerContract(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = op-0 / handoff (SchedulerOutput packet)
  // 1 = wrong-history (AFTER: mixed table [12,41] -> pos 6 reads slot 41 offset 2 = "green" WRONG!)
  // 2 = op-1 (ModelRunner selects CUDA Graph or Eager)
  // 3 = runner-load (AFTER: restored table [12,73,90] -> pos 6 reads slot 73 offset 2 = "stone" CORRECT!)
  // 4 = op-2 (warmed kernel benchmarking checklist)
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e61c', '#a78bfa18');
  const rig3d = buildPagedKvRig3d(step, phase, { x: 475, y: 20, unit: 90, shareMode: true });

  const title = heroTitle(['Keep Admitted Work Intact', 'Across Worker Boundaries'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'SCHEDULER -> MODEL RUNNER · BLOCK TABLE · CUDA GRAPHS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const isWrong = st === 1;
    const table = isWrong ? [12, 41] : [12, 73, 90];
    const slot = table[1];
    const word = slot === 41 ? 'green' : 'stone';

    const nodes = [
      txt('3D RUNNER -> PAGED ATTENTION LOAD', 475, -395, 26, ROLE.kv, 'mono').glow(5, ROLE.kv),
      txt('Page table = metadata; kernel executes load', 475, 400, 26, COSMOS.gold, 'mono'),
    ];

    if (st <= 3) {
      // Handoff packet card
      nodes.push(
        glassCell(-420, -175, 860, 128, isWrong ? ROLE.bad : ROLE.r0, {
          fill: isWrong ? '#2c1320' : '#101f38',
          glow: 8,
        }),
        txt(
          'SCHEDULER OUTPUT HANDOFF',
          -815,
          -206,
          26,
          isWrong ? ROLE.bad : ROLE.r0,
          'mono',
          'left',
        ),
        txt(
          `ID: R1 | Inputs: 5 | Len: 9 | Table: [${table.join(',')}]`,
          -815,
          -150,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
      );

      // Physical slots reference
      const physRows = [
        ['Slot 12', 'The  little  bird  sat', ROLE.good, false],
        ['Slot 41', 'on   the   green  branch', ROLE.r0, isWrong],
        ['Slot 73', 'on   the   stone  wall', ROLE.r1, !isWrong && st >= 2],
        ['Slot 90', 'today   (partial)', COSMOS.gold, false],
      ];
      physRows.forEach(([id, words, col, hi], i) => {
        const cy = -55 + i * 74;
        nodes.push(
          glassCell(-420, cy, 860, 62, hi ? (isWrong ? ROLE.bad : ROLE.good) : col, {
            fill: hi ? (isWrong ? '#2a1220' : '#0e2924') : '#0f182a',
            glow: hi ? 10 : 3,
          }),
          txt(id, -815, cy, 26, col, 'mono', 'left'),
          txt(words, -20, cy, 26, COSMOS.ink, 'mono', 'right'),
        );
      });

      // Position 6 resolution box
      const resCol = isWrong ? ROLE.bad : st >= 3 ? ROLE.good : COSMOS.gold;
      nodes.push(
        glassCell(-420, 262, 860, 108, resCol, {
          fill: isWrong ? '#2b121f' : st >= 3 ? '#0e2924' : '#221b0e',
          glow: 9,
        }),
        txt(
          `POS 6 (6 = 4x1 + 2) -> SLOT ${slot} OFFSET 2 -> "${word}"`,
          -420,
          236,
          26,
          resCol,
          'mono',
        ),
        txt(
          isWrong
            ? 'MISMATCH! Valid address, wrong request history (R0’s slot 41)!'
            : st >= 3
              ? 'CORRECT: R1’s word "stone" via CUDA Graph or Eager runner'
              : 'Runner binds tensor layouts, weights, CUDA graphs & sampling',
          -420,
          286,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      // Beat 2: Warmed kernel benchmarking discipline
      const checks = [
        ['1. WARM UP FIRST', 'Compile kernels & capture CUDA graphs before timing', ROLE.kv],
        ['2. FIX ALL OPERANDS', 'Same shapes, dtypes, block size, sampling & topology', ROLE.r0],
        [
          '3. VERIFY & SEPARATE',
          'Sync timers, check outputs, split launch / KV / math / collectives',
          ROLE.good,
        ],
      ];
      checks.forEach(([k, d, col], i) => {
        const cy = -145 + i * 165;
        nodes.push(
          glassCell(-420, cy, 860, 138, col, { fill: '#101b2e', glow: 8 }),
          txt(k, -815, cy - 30, 26, col, 'mono', 'left'),
          txt(d, -815, cy + 24, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    }

    nodes.push(
      txt(
        'Time kernels on the target serving GPU with reference output verification',
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
  orbitScene(s, c, rig3d.view, { theta: -0.22, phi: 0.88 });
  wireStepCues(s, c, step, [
    ['vv-runner-contract-op-0', 0],
    ['vv-runner-contract-handoff', 0],
    ['vv-runner-contract-wrong-history', 1, true],
    ['vv-runner-contract-op-1', 2],
    ['vv-runner-contract-runner-load', 3, true],
    ['vv-runner-contract-op-2', 4],
  ]);
}
