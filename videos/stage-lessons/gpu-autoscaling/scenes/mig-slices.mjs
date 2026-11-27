// Scene 18: mig-slices - Check each hardware slice before counting independent replicas
// Orbiting 3D H100/A100 silicon die physically partitioned into 7 hardware-isolated MIG chambers,
// each carrying its own blue weights + amber live KV & execution budget.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  guardedDynamic,
  orbitScene,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function migSlices(s, c) {
  const step = s.value(0); // 1=7 MIG hardware slices, 2=per-slice budget & auth/scheduling

  const header = cinemaHeader(
    'MULTI-INSTANCE GPU (MIG)',
    'Check every slice before',
    'counting replicas',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(250, 30, 640, '#5ce1e622', '#60a5fa1a');

  // 3D Partitioned GPU Monolith with 7 hardware-isolated MIG chambers
  const migView = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 17.2,
    unit: 100,
    focus: [0, 0, 0.9],
  }).at(285, -10);

  migView.add(
    gridPlane3d({
      x: [-4.2, 4.2],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // Outer physical GPU chassis wireframe
  addWireBox3D(migView, -3.75, -1.5, 0.02, 7.5, 3.0, 2.1, ROLE.active, {
    width: 2.2,
    opacity: 0.8,
    glow: 7,
  });

  // 7 isolated MIG slices inside the die: each has lower blue weights + upper amber KV/exec
  for (let i = 0; i < 7; i++) {
    const sx = -3.45 + i * 1.01;
    addBox3D(migView, sx, -1.15, 0.08, 0.78, 2.3, 1.05, ROLE.cold, ROLE.cold, {
      faceOpacity: 0.82,
      edgeWidth: 1.9,
      edgeGlow: 6,
    });
    addBox3D(migView, sx, -1.15, 1.18, 0.78, 2.3, 0.72, ROLE.kv, ROLE.kv, {
      faceOpacity: 0.84,
      edgeWidth: 1.9,
      edgeGlow: 7,
    });
  }

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const nodes = [
        txt('UP TO 7 HARDWARE-ISOLATED MIG SLICES', 275, -402, 26, ROLE.active, 'mono').glow(
          5,
          ROLE.active,
        ),
        txt('BLUE: WEIGHTS   ·   AMBER: KV + EXEC PER SLICE', 275, 438, 26, ROLE.kv, 'mono'),
        txt('SUPPORTED GPUs', -860, -185, 26, ROLE.focus, 'mono', 'left'),
        txt('A100 · H100 · H200 (up to 7 instances)', -860, -125, 28, COSMOS.ink, 'mono', 'left'),
        txt('Dedicated compute + HBM per profile', -860, -68, 28, ROLE.active, 'sans', 'left'),
      ];

      if (st >= 1.5) {
        nodes.push(
          txt('PER-SLICE CHECKLIST', -860, 32, 26, ROLE.warm, 'mono', 'left').glow(5, ROLE.warm),
          txt('Fit weights + live KV inside each slice', -860, 92, 28, COSMOS.ink, 'sans', 'left'),
          txt('Verify kernel support & slice latency', -860, 150, 28, ROLE.kv, 'sans', 'left'),
          txt(
            'Serving layer still owns auth & scheduling',
            -860,
            212,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt(
            'Hardware isolation divides HBM bandwidth too',
            -860,
            48,
            28,
            ROLE.kv,
            'sans',
            'left',
          ),
          txt(
            'Never size replicas by dividing GPU price alone',
            -860,
            108,
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

  s.add(bgAura, migView, header, dyn);
  orbitScene(s, c, migView, { theta: -0.24, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-mig-slices-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-mig-slices-b1', step, 2, 0.35);
}
