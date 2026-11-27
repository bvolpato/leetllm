// Scene 25: runtime-trust - Draw the resources that remain shared
// Signature orbiting 3D hardware isolation slabs (`cinematic3d`, `addBox3D`, `wireframeSlab3d`)
// showing GPU Instance GI1 (with CI1 + CI2 sharing GI1 parent memory) vs separate GI2 (CI3).
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  guardedDynamic,
  orbitScene,
  stepAfter,
  stepOn,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function runtimeTrust(s, c) {
  const b0On = s.value(0);
  const procOn = s.value(0);
  const b1On = s.value(0);
  const giBoundaryOn = s.value(0);
  const ciShareOn = s.value(0);
  const b2On = s.value(0);
  const vmPoolOn = s.value(0);

  const stageAura = aura(440, 20, 620, '#60a5fa20', '#ff6b8b18');
  const header = cinemaHeader(
    'HARDWARE & RUNTIME ISOLATION DOMAINS',
    'Draw the resources',
    'that remain shared',
    { x: -860, y: -450, accent: ROLE.A, size: 46 },
  );

  // Orbiting 3D GPU-Instance / Compute-Instance Slab Model on right half
  const hw3d = cinematic3d({
    theta: -0.78,
    phi: 0.96,
    distance: 15.8,
    unit: 106,
    focus: [0, 0, 1.0],
  }).at(465, 10);

  hw3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.1,
      color: '#223358',
      width: 1.2,
      opacity: 0.45,
    }),
  );

  // Shared Host Kernel / Driver Base Platform (gold wireframe)
  addBox3D(hw3d, -2.6, -1.6, 0.06, 5.2, 3.2, 0.24, '#241e10', ROLE.held, {
    faceOpacity: 0.68,
    edgeGlow: 6,
  });

  // GI1 Parent Memory QoS Slab (left, blue) with TWO Compute Instances CI1 & CI2 sharing it!
  addBox3D(hw3d, -2.35, -1.25, 0.42, 2.25, 2.5, 0.48, ROLE.A, ROLE.shared, {
    faceOpacity: 0.72,
    edgeGlow: 7,
  });
  addBox3D(hw3d, -2.2, -1.05, 1.04, 0.9, 2.1, 0.72, ROLE.shared, ROLE.A, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  addBox3D(hw3d, -1.12, -1.05, 1.04, 0.9, 2.1, 0.72, ROLE.shared, ROLE.A, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });

  // GI2 Separate GPU Instance Memory QoS Slab (right, rose) with CI3
  addBox3D(hw3d, 0.25, -1.25, 0.42, 2.1, 2.5, 0.48, ROLE.B, ROLE.B, {
    faceOpacity: 0.72,
    edgeGlow: 7,
  });
  addBox3D(hw3d, 0.5, -1.05, 1.04, 1.6, 2.1, 0.72, ROLE.model, ROLE.B, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });

  hw3d.add(
    ...wireframeSlab3d([-1.22, 0, 1.12], 1.22, 1.32, 0.8, {
      color: ROLE.A,
      width: 2.0,
      glow: 7,
    }),
    ...wireframeSlab3d([1.3, 0, 1.12], 1.15, 1.32, 0.8, {
      color: ROLE.B,
      width: 2.0,
      glow: 7,
    }),
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const sepProc = procOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const giB = giBoundaryOn.value > 0.5;
      const ciSh = ciShareOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const vm = vmPoolOn.value > 0.5;

      const nodes = [
        txt('3D MIG GPU-INSTANCE ISOLATION', 465, -430, 26, ROLE.shared, 'mono', 'center'),
        txt(
          'GI1 (CI1+CI2 SHARED)  ·  GI2 (SEPARATE)',
          465,
          432,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      ];

      if (!b1 && !b2) {
        // Beat 0: Application namespaces vs OS process / container boundaries
        nodes.push(
          rect(860, 148, { fill: '#19150b', stroke: ROLE.held, width: 2.8, radius: 16 }).at(
            -425,
            -152,
          ),
          txt('HOST KERNEL · DRIVER · DEVICE TRUST', -825, -186, 26, ROLE.held, 'mono', 'left'),
          txt(
            'Shared across both processes and containers on one host.',
            -825,
            -132,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),

          rect(412, 220, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(-648, 86)
            .glow(sepProc ? 8 : 4, ROLE.A),
          txt(
            sepProc ? 'PROCESS / CONTAINER A' : 'SHARED WORKER PROCESS',
            -825,
            22,
            26,
            ROLE.A,
            'mono',
            'left',
          ),
          txt(
            sepProc ? 'Separate address space' : 'Shared address space',
            -825,
            84,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt(
            sepProc ? 'Still shares host kernel' : 'A & B share runtime impl',
            -825,
            134,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),

          rect(412, 220, { fill: '#220f1a', stroke: ROLE.B, width: 2.8, radius: 16 })
            .at(-200, 86)
            .glow(sepProc ? 8 : 4, ROLE.B),
          txt(
            sepProc ? 'PROCESS / CONTAINER B' : 'APPLICATION NAMESPACE',
            -378,
            22,
            26,
            ROLE.B,
            'mono',
            'left',
          ),
          txt(
            sepProc ? 'Separate address space' : 'Logical tenant & salt',
            -378,
            84,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt(
            sepProc ? 'Still shares GPU driver' : 'Not an OS security domain',
            -378,
            134,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),

          txt(
            'State which adversary each isolation boundary actually stops.',
            -855,
            305,
            28,
            ROLE.focus,
            'sans',
            'left',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: NVIDIA MIG GPU Instance vs Compute Instance
        nodes.push(
          rect(860, 168, {
            fill: '#0b1428',
            stroke: giB ? ROLE.A : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(-425, -142)
            .glow(giB ? 9 : 2, ROLE.A),
          txt('GPU INSTANCE (GI1 vs GI2)', -825, -188, 28, ROLE.A, 'mono', 'left'),
          txt(
            'Hardware memory QoS & resource partition.',
            -825,
            -134,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt(
            'GI1 and GI2 hold separate GPU-instance memory.',
            -825,
            -90,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),

          rect(860, 192, {
            fill: '#240f19',
            stroke: ciSh ? ROLE.fail : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(-425, 86)
            .glow(ciSh ? 9 : 2, ROLE.fail),
          txt(
            'COMPUTE INSTANCES INSIDE GI1 (CI1 & CI2)',
            -825,
            36,
            28,
            ciSh ? ROLE.fail : ROLE.shared,
            'mono',
            'left',
          ),
          txt('Subdivide compute SMs ONLY.', -825, 92, 30, COSMOS.ink, 'sans', 'left'),
          txt(
            'CI1 & CI2 still share parent GI1 memory and engines!',
            -825,
            140,
            26,
            ROLE.fail,
            'sans',
            'left',
          ),

          txt(
            'Never claim two CIs inside one GI form two separate memory domains.',
            -855,
            305,
            27,
            ROLE.focus,
            'sans',
            'left',
          ),
        );
      } else {
        // Beat 2: VM / dedicated pool + remaining network, storage, identity, ops controls
        nodes.push(
          rect(412, 220, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(-648, -110)
            .glow(vm ? 9 : 4, ROLE.A),
          txt('VM / DEDICATED POOL A', -825, -172, 26, ROLE.A, 'mono', 'left'),
          txt('Guest / host boundary', -825, -110, 28, COSMOS.ink, 'sans', 'left'),
          txt('Model must fit partition', -825, -62, 26, COSMOS.muted, 'sans', 'left'),

          rect(412, 220, { fill: '#220f1a', stroke: ROLE.B, width: 2.8, radius: 16 })
            .at(-200, -110)
            .glow(vm ? 9 : 4, ROLE.B),
          txt('VM / DEDICATED POOL B', -378, -172, 26, ROLE.B, 'mono', 'left'),
          txt('Guest / host boundary', -378, -110, 28, COSMOS.ink, 'sans', 'left'),
          txt('Separate placement pool', -378, -62, 26, COSMOS.muted, 'sans', 'left'),

          rect(860, 200, { fill: '#19150b', stroke: ROLE.focus, width: 2.8, radius: 16 })
            .at(-425, 165)
            .glow(7, ROLE.focus),
          txt(
            'STILL REQUIRED EVEN WITH DEDICATED POOLS',
            -825,
            108,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
          txt(
            'Network · storage · identity · operational access.',
            -825,
            162,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt(
            'Redacted prompts can still retrieve unauthorized docs.',
            -825,
            212,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, hw3d, header, view);
  orbitScene(s, c, hw3d, { theta: -0.22, phi: 0.85 });
  stepOn(s, c, 'mt-runtime-trust-b0', b0On, 1);
  stepAfter(s, c, 'mt-runtime-trust-s0-2', procOn, 1);
  stepOn(s, c, 'mt-runtime-trust-b1', b1On, 1);
  stepAfter(s, c, 'mt-runtime-trust-s1-1', giBoundaryOn, 1);
  stepAfter(s, c, 'mt-runtime-trust-s1-2', ciShareOn, 1);
  stepOn(s, c, 'mt-runtime-trust-b2', b2On, 1);
  stepAfter(s, c, 'mt-runtime-trust-s2-0', vmPoolOn, 1);
}
