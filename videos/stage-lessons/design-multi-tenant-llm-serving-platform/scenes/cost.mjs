// Scene 26: cost - Keep GPU seconds and whole-node prices consistent
// Signature orbiting 3D 4-GPU accelerator cluster pulsing through a 0.2 s step -> 0.8 GPU-s.
// Derives $0.000444444 total at $2/GPU-hr, split 25% A ($0.000111111) + 75% B ($0.000333333),
// and warns against multiplying GPU-seconds by whole-node rate (4x double-count).
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  STEP_GPU_SECONDS,
  STEP_SHARE_A,
  STEP_SHARE_B,
  STEP_TOTAL_COST,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  driftValue,
  glowMeter,
  guardedDynamic,
  orbitScene,
  stepAfter,
  stepOn,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function costScene(s, c) {
  const pulse = s.value(0);
  const receiptOn = s.value(0);
  const gpuSecOn = s.value(0);
  const unitRuleOn = s.value(0);

  const stageAura = aura(440, 15, 620, '#6ee7b720', '#60a5fa1a');
  const header = cinemaHeader(
    'SHARED-STEP COST ACCOUNTING',
    'Keep GPU seconds and',
    'whole-node prices consistent',
    { x: -860, y: -450, accent: ROLE.ok, size: 46 },
  );

  // Orbiting 3D 4-GPU Shared Step Node on right half
  const node3d = cinematic3d({
    theta: -0.8,
    phi: 0.96,
    distance: 15.6,
    unit: 108,
    focus: [0, 0, 0.85],
  }).at(475, 10);

  node3d.add(
    gridPlane3d({
      x: [-3.0, 3.0],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.0,
      color: '#223358',
      width: 1.2,
      opacity: 0.45,
    }),
  );

  // 4 GPU accelerator slabs running in lockstep for 0.2 s
  const gpuCoords = [
    [-2.0, -1.2],
    [0.3, -1.2],
    [-2.0, 0.3],
    [0.3, 0.3],
  ];
  gpuCoords.forEach(([gx, gy], idx) => {
    const col = idx === 0 ? ROLE.A : ROLE.B;
    addBox3D(node3d, gx, gy, 0.14, 1.7, 0.95, 1.25, col, ROLE.shared, {
      faceOpacity: 0.78,
      edgeGlow: 7,
    });
  });

  node3d.add(
    ...wireframeSlab3d([0, 0, 0.78], 2.25, 1.45, 0.74, {
      color: ROLE.ok,
      width: 2.2,
      glow: 8,
    }),
  );

  addArc3D(node3d, [-1.15, -0.72, 1.44], [1.15, 0.78, 1.44], ROLE.ok, {
    lift: 0.55,
    pulseVal: pulse,
    phaseOffset: 0,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const rec = receiptOn.value > 0.5;
      const gSec = gpuSecOn.value > 0.5;
      const rule = unitRuleOn.value > 0.5;

      const nodes = [
        txt('4-GPU NODE  ·  0.2 s SHARED STEP', 475, -430, 26, ROLE.ok, 'mono', 'center'),
        txt(
          '4 GPUs × 0.2 s = 0.8 GPU-SECONDS  ·  0.2 NODE-SECONDS',
          475,
          432,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),

        // Left: Step cost derivation cards
        rect(860, 128, {
          fill: '#0b1428',
          stroke: gSec ? ROLE.A : '#2c3d66',
          width: 2.8,
          radius: 16,
        })
          .at(-425, -172)
          .glow(gSec ? 9 : 3, ROLE.A),
        txt('OBSERVED ACCELERATOR WORK', -825, -206, 26, ROLE.A, 'mono', 'left'),
        txt(
          `4 GPUs × 0.2 s = ${STEP_GPU_SECONDS.toFixed(1)} GPU-seconds`,
          -825,
          -150,
          36,
          COSMOS.ink,
          'mono',
          'left',
        ),

        rect(860, 134, {
          fill: '#0b1e1b',
          stroke: rec || gSec ? ROLE.ok : '#2c3d66',
          width: 2.8,
          radius: 16,
        })
          .at(-425, -14)
          .glow(rec || gSec ? 9 : 3, ROLE.ok),
        txt(
          'STEP TOTAL AT $2 / GPU-HOUR  (OR $8 / NODE-HOUR)',
          -825,
          -50,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
        txt(`$${STEP_TOTAL_COST.toFixed(9)} total`, -825, 8, 40, ROLE.ok, 'mono', 'left'),

        // Conserved 25% A / 75% B allocation split bar
        txt('ALLOCATION POLICY (CONSERVES STEP COST)', -855, 102, 26, COSMOS.muted, 'mono', 'left'),
        glowMeter(-855, 152, 860, 42, 0.25, { fill: ROLE.A, bg: ROLE.B, border: '#384d7a' }),
        txt(`A (25%): $${STEP_SHARE_A.toFixed(9)}`, -855, 206, 28, ROLE.A, 'mono', 'left'),
        txt(`B (75%): $${STEP_SHARE_B.toFixed(9)}`, 5, 206, 28, ROLE.B, 'mono', 'right'),

        // Unit consistency warning card
        rect(860, 138, {
          fill: rule ? '#240f19' : '#141524',
          stroke: rule ? ROLE.fail : ROLE.focus,
          width: 2.8,
          radius: 16,
        })
          .at(-425, 340)
          .glow(rule ? 9 : 4, rule ? ROLE.fail : ROLE.focus),
        txt(
          rule
            ? 'NEVER MIX GPU-SECONDS WITH WHOLE-NODE RATE'
            : 'SEPARATE USAGE · ALLOCATION · TARIFF',
          -825,
          306,
          26,
          rule ? ROLE.fail : ROLE.focus,
          'mono',
          'left',
        ),
        txt(
          rule
            ? '0.8 GPU-s × $8/node-hr double-counts 4 GPUs (4× wrong)!'
            : 'Retries create a new attempt; duplicate delivery adds zero charge.',
          -825,
          358,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),
      ];

      return group(...nodes);
    },
  );

  s.add(stageAura, node3d, header, view);
  orbitScene(s, c, node3d, { theta: -0.22, phi: 0.85 });
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'cost-beat-1-focus-1', receiptOn, 1);
  stepOn(s, c, 'cost-beat-2-focus-2', gpuSecOn, 1);
  stepAfter(s, c, 'cost-beat-2-focus-1', unitRuleOn, 1);
}
