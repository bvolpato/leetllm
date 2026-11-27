// Scene 16: parallel-placement - Fit the model and then account for the physical route
// Orbiting 3D 4-GPU multi-node topology comparing logical sharding (TP / PP / MoE EP) mapped onto
// physical NVLink vs PCIe vs inter-node links, plus Slurm vs Kubernetes/KubeRay substrate separation.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  guardedDynamic,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function parallelPlacement(s, c) {
  const phase = s.value(0);
  const physOn = s.value(0);
  const subOn = s.value(0);

  const header = cinemaHeader(
    'SHARDING & PHYSICAL LINKS',
    'Fit the model, then',
    'check the physical wire',
    {
      x: -860,
      y: -445,
      accent: ROLE.worker,
      size: 46,
    },
  );

  const bgAura = aura(160, 20, 680, '#60a5fa1a', '#a78bfa18');

  // Right-side orbiting 3D 2-node x 2-GPU fabric (NVLink intra-node emerald, network inter-node rose)
  const view3d = cinematic3d({
    pos: [330, 35],
    size: [920, 740],
    fov: 38,
    distance: 7.4,
    azimuth: -0.58,
    elevation: 0.42,
    grid: true,
    gridColor: '#1b294a',
  });

  // Node 1 (front): GPU 0 & GPU 1 linked by fast NVLink (emerald)
  addBox3D(view3d, -2.0, -1.6, 0, 1.15, 1.0, 1.1, '#0f3847', ROLE.req);
  addBox3D(view3d, 0.85, -1.6, 0, 1.15, 1.0, 1.1, '#0f3847', ROLE.req);
  addArc3D(view3d, [-0.85, -1.1, 0.9], [0.85, -1.1, 0.9], ROLE.ok, {
    lift: 0.55,
    pulseVal: phase,
    phaseOffset: 0,
  });

  // Node 2 (back): GPU 2 & GPU 3 linked by fast NVLink (emerald)
  addBox3D(view3d, -2.0, 0.9, 0, 1.15, 1.0, 1.1, '#2b1d52', ROLE.policy);
  addBox3D(view3d, 0.85, 0.9, 0, 1.15, 1.0, 1.1, '#2b1d52', ROLE.policy);
  addArc3D(view3d, [-0.85, 1.4, 0.9], [0.85, 1.4, 0.9], ROLE.ok, {
    lift: 0.55,
    pulseVal: phase,
    phaseOffset: 0.5,
  });

  // Inter-node slow link (rose) connecting Node 1 <-> Node 2
  addArc3D(view3d, [-1.4, -0.6, 1.1], [-1.4, 0.9, 1.1], ROLE.fail, {
    lift: 0.9,
    pulseVal: phase,
    phaseOffset: 0.25,
  });
  addArc3D(view3d, [1.4, -0.6, 1.1], [1.4, 0.9, 1.1], ROLE.fail, {
    lift: 0.9,
    pulseVal: phase,
    phaseOffset: 0.75,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const ph = physOn.value;
      const sb = subOn.value;
      const nodes = [];

      const lx = -860;
      nodes.push(
        txt('1. LOGICAL DIVISION', lx, -185, 26, ROLE.req, 'mono', 'left'),
        txt('TP: splits layer math (tight sync)', lx, -132, 26, COSMOS.ink, 'mono', 'left'),
        txt('PP: stages layers across workers', lx, -82, 26, COSMOS.ink, 'mono', 'left'),
        txt('MoE EP: routes tokens to experts', lx, -32, 26, COSMOS.ink, 'mono', 'left'),

        txt('2. PHYSICAL LINK REALITY', lx, 55, 26, ROLE.fail, 'mono', 'left').opacity(
          0.45 + ph * 0.55,
        ),
        txt('TP over slow wire -> misses SLO!', lx, 108, 26, ROLE.fail, 'mono', 'left').opacity(
          0.45 + ph * 0.55,
        ),
        txt('NVLink != PCIe != inter-node NIC', lx, 158, 26, ROLE.focus, 'mono', 'left').opacity(
          0.45 + ph * 0.55,
        ),

        txt('3. SUBSTRATE SEPARATION', lx, 240, 26, ROLE.policy, 'mono', 'left').opacity(
          0.4 + sb * 0.6,
        ),
        txt(
          'Slurm vs K8s/KubeRay != shard plan',
          lx,
          292,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(0.4 + sb * 0.6),

        txt(
          'GREEN: NVLINK (TP)  ·  ROSE: INTER-NODE (PP/EP)',
          330,
          415,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt('MEMORY FIT DOES NOT PROVE LATENCY SLO', 330, -405, 26, ROLE.focus, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view3d, overlay);
  orbitScene(s, c, view3d, { azimuthDelta: 0.34, elevationDelta: -0.05 });
  driftValue(s, c, phase, 4.4);

  c.on('sd-parallel-placement-1-operation', () => {
    s.play(
      physOn.to(1, {
        duration: clampDur(c, c.cue('sd-parallel-placement-1-operation').start, 0.4),
      }),
    );
  });
  c.on('sd-parallel-placement-2-operation', () => {
    s.play(
      subOn.to(1, { duration: clampDur(c, c.cue('sd-parallel-placement-2-operation').start, 0.4) }),
    );
  });
}
