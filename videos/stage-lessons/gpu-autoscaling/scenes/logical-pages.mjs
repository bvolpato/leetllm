// Scene 08: logical-pages - Follow logical token order through scattered physical blocks
// Signature 3D PagedAttention Physical HBM pool (12 cubes) + floating Logical Sequence Tier (L0, L1, L2 -> P5, P2, P8)
// with glowing 3D Bezier pointer arcs and streaming photons, plus next L3 -> free P1.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addPointerArc3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function logicalPages(s, c) {
  const pulse = s.value(0);
  const step = s.value(0); // 1=L0/L1/L2->P5/P2/P8, 2=paging vs contiguous + L3->P1

  const header = cinemaHeader('PAGEDATTENTION BLOCK TABLE', 'Logical order,', 'scattered storage', {
    x: -860,
    y: -420,
    accent: ROLE.active,
    size: 52,
  });

  const bgAura = aura(265, 25, 620, '#5ce1e624', '#ffd1661c');

  const poolView = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 15.8,
    unit: 116,
    focus: [0, 0, 1.0],
  }).at(270, 28);

  poolView.add(
    gridPlane3d({
      x: [-3.6, 3.6],
      y: [-2.5, 2.5],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.52,
    }),
  );

  const physicalMap = [5, 2, 8]; // L0->P5, L1->P2, L2->P8
  const cubeTop = [];
  let p1Cube = [];

  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 4; col++) {
      const idx = r * 4 + col;
      const x = -2.9 + col * 1.48;
      const y = -2.0 + r * 1.48;
      cubeTop[idx] = [x + 0.59, y + 0.59, 0.92];
      if (physicalMap.includes(idx)) {
        const cCol = idx === 5 ? ROLE.active : idx === 2 ? ROLE.focus : ROLE.cold;
        addBox3D(poolView, x, y, 0.04, 1.18, 1.18, 0.86, cCol, cCol, {
          faceOpacity: 0.84,
          edgeWidth: 2.3,
          edgeGlow: 8,
        });
      } else if (idx === 1) {
        addWireBox3D(poolView, x, y, 0.04, 1.18, 1.18, 0.84, ROLE.warm, {
          width: 2.0,
          opacity: 0.72,
          glow: 6,
        });
        p1Cube = hideNodes(
          addBox3D(poolView, x, y, 0.04, 1.18, 1.18, 0.86, ROLE.warm, ROLE.warm, {
            faceOpacity: 0.86,
            edgeWidth: 2.4,
            edgeGlow: 9,
          }),
        );
      } else {
        addWireBox3D(poolView, x, y, 0.04, 1.18, 1.18, 0.82, '#34476e', {
          width: 1.4,
          opacity: 0.45,
          glow: 2,
        });
      }
    }
  }

  // Floating logical sequence blocks L0, L1, L2 at z=2.55
  const logColors = [ROLE.active, ROLE.focus, ROLE.cold];
  for (let i = 0; i < 3; i++) {
    const lx = -2.4 + i * 1.45;
    addBox3D(poolView, lx, -0.35, 2.55, 0.98, 0.7, 0.36, logColors[i], logColors[i], {
      faceOpacity: 0.86,
      edgeWidth: 2.2,
      edgeGlow: 8,
    });
    addPointerArc3D(poolView, [lx + 0.49, 0, 2.54], cubeTop[physicalMap[i]], logColors[i], {
      lift: 0.55 + i * 0.1,
      pulseVal: pulse,
      phaseOffset: i * 0.32,
    });
  }

  // Next logical page L3 -> free physical P1 (revealed in beat 1)
  const nextPage = hideNodes([
    ...addBox3D(poolView, 1.95, -0.35, 2.55, 0.98, 0.7, 0.36, ROLE.warm, ROLE.warm, {
      faceOpacity: 0.88,
      edgeWidth: 2.3,
      edgeGlow: 9,
    }),
    ...addPointerArc3D(poolView, [2.44, 0, 2.54], cubeTop[1], ROLE.warm, {
      lift: 0.75,
      pulseVal: pulse,
      phaseOffset: 0.15,
    }),
  ]);

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const nodes = [
        txt('LOGICAL SEQUENCE TIER (L0 · L1 · L2)', 270, -408, 26, ROLE.active, 'mono').glow(
          5,
          ROLE.active,
        ),
        txt('PHYSICAL HBM POOL (16-SLOT BLOCKS)', 270, 442, 26, ROLE.focus, 'mono').glow(
          5,
          ROLE.focus,
        ),
        txt('BLOCK TABLE', -860, -175, 26, ROLE.focus, 'mono', 'left'),
        txt('L0  ->  P5   [tokens 0..15]', -860, -118, 28, ROLE.active, 'mono', 'left'),
        txt('L1  ->  P2   [tokens 16..31]', -860, -64, 28, ROLE.focus, 'mono', 'left'),
        txt('L2  ->  P8   [tokens 32..47]', -860, -10, 28, ROLE.cold, 'mono', 'left'),
      ];

      if (st >= 1.5) {
        nodes.push(
          txt('L3  ->  P1   (next free block)', -860, 52, 28, ROLE.warm, 'mono', 'left').glow(
            7,
            ROLE.warm,
          ),
          txt('Grows 1 block at a time', -860, 152, 28, COSMOS.ink, 'sans', 'left'),
          txt('Only the last block can have slack', -860, 206, 26, COSMOS.muted, 'sans', 'left'),
          txt('Prefix reuse needs compatible cache', -860, 266, 26, ROLE.warmup, 'mono', 'left'),
        );
      } else {
        nodes.push(
          txt('Order lives in the block table,', -860, 118, 28, COSMOS.ink, 'sans', 'left'),
          txt('not contiguous HBM addresses.', -860, 170, 28, COSMOS.muted, 'sans', 'left'),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, poolView, header, dyn);
  orbitScene(s, c, poolView, { theta: -0.2, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('ga-logical-pages-b0', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('ga-logical-pages-b0').start, 0.3) }));
  });
  c.on('ga-logical-pages-b1', () => {
    const t = c.cue('ga-logical-pages-b1').start;
    s.play(step.to(2, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, [...p1Cube, ...nextPage], 0.4);
  });
}
