// Scene 02: sharing-contract - Follow the boundaries through one shared step
// Signature orbiting 3D frozen 72B weight monolith above two isolated luminous request lanes
// (Alice/A blue, Bob/B rose). Reveals 144 GB / copy and 14.4 TB for 100 copies, then 6 promises.
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DENSE_WEIGHT_GB,
  HUNDRED_COPIES_TB,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  driftValue,
  guardedDynamic,
  orbitScene,
  playOn,
  quadArcPts,
  stepAfter,
  stepOn,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function sharingContract(s, c) {
  const pulse = s.value(0);
  const laneOn = s.value(0);
  const b1On = s.value(0);
  const weightOn = s.value(0);
  const copiesOn = s.value(0);
  const b2On = s.value(0);

  const stageAura = aura(430, -10, 620, '#5ce1e622', '#a78bfa1a');
  const header = cinemaHeader(
    'SHARED WEIGHTS · SEPARATE OWNERSHIP',
    'Follow the boundaries',
    'through one shared step',
    { x: -860, y: -450, accent: ROLE.shared, size: 46 },
  );

  // Orbiting 3D Frozen 72B Weight Monolith on right side
  const weights3d = cinematic3d({
    theta: -0.76,
    phi: 0.96,
    distance: 15.6,
    unit: 104,
    focus: [0, 0, 1.05],
  }).at(475, -10);

  weights3d.add(
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

  // 5 stacked frozen transformer weight slabs (cyan/violet)
  for (let i = 0; i < 5; i++) {
    addBox3D(weights3d, -1.9, -1.1, 0.14 + i * 0.36, 3.8, 2.2, 0.22, ROLE.shared, ROLE.model, {
      faceOpacity: 0.72,
      edgeGlow: 6,
    });
  }
  weights3d.add(
    ...wireframeSlab3d([0, 0, 1.06], 2.12, 1.32, 1.04, {
      color: ROLE.focus,
      width: 2.2,
      glow: 8,
    }),
  );

  // Two isolated 3D request beams passing underneath the shared slab (A blue, B rose)
  addArc3D(weights3d, [-2.7, -0.75, 0.25], [2.7, -0.75, 0.25], ROLE.A, {
    lift: 0.15,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });
  addArc3D(weights3d, [-2.7, 0.75, 0.25], [2.7, 0.75, 0.25], ROLE.B, {
    lift: 0.15,
    pulseVal: pulse,
    phaseOffset: 0.5,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const b1 = b1On.value > 0.5;
      const wOk = weightOn.value > 0.5;
      const cOk = copiesOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const nodes = [
        txt('SHARED IMMUTABLE WEIGHTS (72B)', 475, -430, 26, ROLE.shared, 'mono', 'center'),
        txt(
          'ONE READ-ONLY ARTIFACT · ZERO CROSS-LANE STATE',
          475,
          432,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      ];

      if (b2) {
        // Beat 2: The six enforcing promises
        const promises = [
          ['1. Trusted identity', 'Enforced at gateway + every service', ROLE.A],
          ['2. Scoped state', 'Isolated evidence, KV pages & caches', ROLE.kv],
          ['3. Conserved admission', 'Atomic allowance & page holds', ROLE.held],
          ['4. Bounded shares', 'Weighted fair scheduling per tier', ROLE.ok],
          ['5. Replay-safe billing', 'Idempotent usage settlement', ROLE.model],
          ['6. Recoverable ownership', 'Retire device reads before reuse', ROLE.B],
        ];
        nodes.push(
          txt(
            'SIX DESIGN PROMISES AT ENFORCING COMPONENTS',
            -855,
            -252,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
        );
        promises.forEach(([title, sub, col], i) => {
          const y = -170 + i * 102;
          nodes.push(
            rect(860, 88, { fill: '#0d1528', stroke: col, width: 2.4, radius: 12 })
              .at(-425, y)
              .glow(5, col),
            txt(title, -828, y - 18, 27, col, 'mono', 'left'),
            txt(sub, -828, y + 18, 26, COSMOS.muted, 'sans', 'left'),
          );
        });
      } else {
        // Beat 0 & Beat 1: Two isolated request lanes on the left
        const lanes = [
          { name: 'Alice  /  Workspace A  (A-1)', col: ROLE.A, y: -146 },
          { name: 'Bob    /  Workspace B  (B-1)', col: ROLE.B, y: 42 },
        ];
        const fields = ['ACL', 'Evidence', 'KV', 'Adapter'];
        lanes.forEach((lane, li) => {
          nodes.push(txt(lane.name, -855, lane.y - 66, 28, lane.col, 'mono', 'left'));
          fields.forEach((f, fi) => {
            const fx = -755 + fi * 212;
            nodes.push(
              rect(190, 68, { fill: '#0d1528', stroke: lane.col, width: 2.4, radius: 10 })
                .at(fx, lane.y)
                .glow(4 + laneOn.value * 3, lane.col),
              txt(f, fx, lane.y, 26, COSMOS.ink, 'mono', 'center'),
            );
          });
          nodes.push(
            beamWithPhotons(quadArcPts([-850, lane.y + 52], [-15, lane.y + 52], 0), lane.col, 0, {
              width: 3,
              glow: 8,
              alpha: 0.45 + 0.55 * laneOn.value,
            }),
          );
        });

        if (b1) {
          nodes.push(
            rect(415, 168, {
              fill: '#0c1828',
              stroke: wOk ? ROLE.ok : '#2c3d66',
              width: 2.8,
              radius: 14,
            })
              .at(-648, 258)
              .glow(wOk ? 9 : 0, ROLE.ok),
            txt('1 COPY  (72B × 2 B)', -825, 210, 26, COSMOS.muted, 'mono', 'left'),
            txt(
              wOk ? `${DENSE_WEIGHT_GB} GB` : 'computing...',
              -825,
              272,
              46,
              wOk ? ROLE.ok : COSMOS.dim,
              'mono',
              'left',
            ),
            txt('decimal gigabytes', -825, 316, 26, COSMOS.muted, 'sans', 'left'),

            rect(415, 168, {
              fill: '#191224',
              stroke: cOk ? ROLE.B : '#2c3d66',
              width: 2.8,
              radius: 14,
            })
              .at(-200, 258)
              .glow(cOk ? 9 : 0, ROLE.B),
            txt('100 ISOLATED COPIES', -378, 210, 26, COSMOS.muted, 'mono', 'left'),
            txt(
              cOk ? `${HUNDRED_COPIES_TB} TB` : 'computing...',
              -378,
              272,
              46,
              cOk ? ROLE.B : COSMOS.dim,
              'mono',
              'left',
            ),
            txt('before runtime KV memory', -378, 316, 26, COSMOS.muted, 'sans', 'left'),
          );
        } else {
          nodes.push(
            rect(860, 124, { fill: '#0d1528', stroke: ROLE.shared, width: 2.4, radius: 14 }).at(
              -425,
              250,
            ),
            txt(
              'SHARED EXECUTION · SEPARATE OWNERSHIP',
              -825,
              222,
              26,
              ROLE.shared,
              'mono',
              'left',
            ),
            txt(
              'Same weights run both rows; private state never mixes.',
              -825,
              270,
              26,
              COSMOS.ink,
              'sans',
              'left',
            ),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, weights3d, header, view);
  orbitScene(s, c, weights3d, { theta: -0.18, phi: 0.84 });
  driftValue(s, c, pulse, 4.5);

  playOn(s, c, 'mt-sharing-contract-b0', laneOn, 1, 0.5);
  stepOn(s, c, 'mt-sharing-contract-b1', b1On, 1);
  stepAfter(s, c, 'mt-sharing-contract-s1-0', weightOn, 1);
  stepAfter(s, c, 'mt-sharing-contract-s1-1', copiesOn, 1);
  stepOn(s, c, 'mt-sharing-contract-b2', b2On, 1);
}
