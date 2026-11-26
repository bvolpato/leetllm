// Scene 18: replica-budget - How many replicas for a hundred active requests?
// Signature orbiting 3D Replica Fleet (3 glowing 3D towers x 5 cyan active-request prisms = 15)
// with strict withholding of "20 replicas" until AFTER replicas-twenty, then 2 amber burst
// prisms arriving onto Replica 1 (5 + 2 = 7 open simultaneously!).
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  REPLICA_MATH,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  glowTex,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function replicaBudget(s, c) {
  const phase = s.value(0);
  const perRepLit = s.value(0.3);
  const askHundred = s.value(0);
  const revealTwenty = s.value(0); // strictly AFTER replicas-twenty!
  const burstArrive = s.value(0);

  const header = cinemaHeader('FLEET SIZING BUDGET', 'How many replicas', 'for 100 active?', {
    x: -860,
    y: -435,
    accent: ROLE.open,
    size: 50,
  });

  const stageAura = aura(300, 20, 640, '#5ce1e622', '#fb923c18');

  // Orbiting 3D Replica Fleet Floor on right half (elevated slightly so bottom caption stays 35+ px clear!)
  const fleetView = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 16.4,
    unit: 104,
    focus: [0, 0, 1.0],
  }).at(300, -18);

  fleetView.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.1,
      color: '#25395e',
      width: 1.2,
      opacity: 0.54,
    }),
  );

  // 3 Replica wireframe chassis, each holding 5 glowing cyan active request cubes (3 x 5 = 15)
  const towerXs = [-2.35, -0.35, 1.65];
  towerXs.forEach((tx) => {
    addWireBox3D(fleetView, tx - 0.14, -1.6, 0.02, 1.18, 3.2, 1.9, ROLE.workload, {
      width: 1.9,
      opacity: 0.72,
      glow: 5,
    });
    for (let j = 0; j < REPLICA_MATH.perReplicaActive; j++) {
      const z = 0.08 + j * 0.34;
      addBox3D(fleetView, tx, -1.38, z, 0.9, 2.76, 0.26, ROLE.open, ROLE.open, {
        faceOpacity: 0.82,
        edgeWidth: 1.8,
        edgeGlow: 6,
      });
    }
  });

  // 2 amber burst request slabs arriving atop Replica 1 (5 + 2 = 7 open!)
  const burstSlabs = hideNodes([
    ...addBox3D(fleetView, towerXs[0], -1.38, 1.94, 0.9, 2.76, 0.28, ROLE.burst, ROLE.focus, {
      faceOpacity: 0.9,
      edgeWidth: 2.3,
      edgeGlow: 10,
    }),
    ...addBox3D(fleetView, towerXs[0], -1.38, 2.3, 0.9, 2.76, 0.28, ROLE.burst, ROLE.focus, {
      faceOpacity: 0.9,
      edgeWidth: 2.3,
      edgeGlow: 10,
    }),
  ]);

  const fleetEq = glowTex(String.raw`1.5 \times 10\text{ s} = 15\text{ active}`, {
    x: -600,
    y: -195,
    size: 38,
    color: ROLE.open,
    glow: 7,
  });

  const leftPanel = guardedDynamic(
    () => 1,
    () => {
      const pr = perRepLit.value;
      const ask = askHundred.value;
      const rev20 = revealTwenty.value;
      const bur = burstArrive.value;

      const nodes = [
        txt('3-REPLICA TEST FLEET (15 ACTIVE MEAN)', 300, -412, 26, ROLE.open, 'mono').glow(
          5,
          ROLE.open,
        ),
        txt(
          bur > 0.2
            ? 'Burst on Replica 1: 5 mean + 2 extra = 7 open now'
            : 'Each glowing prism = 1 active request (5 per replica)',
          300,
          444,
          26,
          bur > 0.2 ? ROLE.burst : COSMOS.muted,
          'mono',
        ),

        // Per-replica baseline
        txt('PER REPLICA (15 / 3)', -860, -108, 26, COSMOS.muted, 'mono', 'left'),
        txt('5 active  ·  0.5 req/s', -860, -52, 36, ROLE.open, 'mono', 'left')
          .glow(6, ROLE.open)
          .opacity(0.65 + 0.35 * pr),
      ];

      // Beat 1: Surge sizing for 100 active (withhold 20 until AFTER replicas-twenty!)
      if (ask > 0.1 && bur < 0.2) {
        nodes.push(
          txt('PLAN FOR 100 ACTIVE REQUESTS', -860, 56, 26, ROLE.focus, 'mono', 'left').opacity(
            ask,
          ),
          txt(
            rev20 > 0.2 ? '100 / 5  =  20 REPLICAS' : '100 / 5  =  ? REPLICAS',
            -860,
            118,
            40,
            rev20 > 0.2 ? ROLE.qualified : ROLE.focus,
            'mono',
            'left',
          )
            .glow(8, rev20 > 0.2 ? ROLE.qualified : ROLE.focus)
            .opacity(ask),
        );
        if (rev20 > 0.2) {
          nodes.push(
            txt(
              'Rate check: 10 req/s / 0.5  =  20',
              -860,
              186,
              28,
              COSMOS.ink,
              'mono',
              'left',
            ).opacity(rev20),
          );
        }
      }

      // Beat 2: Burst headroom + scaling caveats
      if (bur > 0.1) {
        nodes.push(
          txt('INSTANT BURST ON 1 REPLICA', -860, 56, 26, ROLE.burst, 'mono', 'left')
            .glow(5, ROLE.burst)
            .opacity(bur),
          txt('5 + 2  =  7 OPEN NOW', -860, 118, 42, ROLE.burst, 'mono', 'left')
            .glow(9, ROLE.burst)
            .opacity(bur),
          txt(
            'Generator needs burst headroom (> 15)',
            -860,
            194,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(bur),
          txt(
            'Rerun sweep on larger fleet (routing & prefixes shift)',
            -860,
            246,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(bur),
        );
      }

      nodes.push(
        txt(
          'Mean concurrency != peak burst  ·  Longer answers keep slots open longer',
          -860,
          364,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, fleetView, header, fleetEq, leftPanel);
  orbitScene(s, c, fleetView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 7, { startOffset: 0.1, endMargin: 0.5 });

  c.on('replica-budget-beat-0', () => {
    const t = c.cue('replica-budget-beat-0').start;
    s.play(perRepLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('replica-budget-beat-1', () => {
    const t = c.cue('replica-budget-beat-1').start;
    s.play(askHundred.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.after('replicas-twenty', () => {
    const t = c.cue('replicas-twenty').end;
    s.play(revealTwenty.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('replica-budget-beat-2', () => {
    const t = c.cue('replica-budget-beat-2').start;
    s.play(burstArrive.to(1, { duration: clampDur(c, t, 0.45) }));
    fadeInNodes(s, c, t, burstSlabs, 0.45);
  });
}
