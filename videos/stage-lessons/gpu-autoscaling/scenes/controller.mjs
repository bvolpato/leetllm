// Scene 22: controller - The next poll
// Orbiting 3D GPU fleet: 4 solid emerald ready replicas (20 running) + 6 hollow wireframe pending orders (30 waiting).
// Strict prediction withholding on BOTH polls:
//   Poll 0 asks total replicas -> reveals 10 total (+6 pending) AFTER desired-replicas & place-order.
//   Poll 1 asks additional replicas -> reveals 0 additional AFTER pending-counted.
//   Missing sample holds 10 and alerts on collector.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  fadeInNodes,
  glowTex,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function controller(s, c) {
  const step = s.value(0); // 1=poll0 ask, 2=10 total(AFTER), 3=+6 pending(AFTER), 4=poll1 ask, 5=0 add(AFTER), 6=missing telemetry

  const header = cinemaHeader('PENDING-AWARE AUTOSCALER', 'The next poll', 'never double-counts', {
    x: -860,
    y: -420,
    accent: ROLE.control,
    size: 52,
  });

  const bgAura = aura(280, 25, 620, '#60a5fa22', '#6ee7b71a');

  const targetEq = glowTex(String.raw`\lceil (20 + 30) / 5 \rceil = 10`, {
    x: -600,
    y: -15,
    size: 38,
    color: ROLE.active,
    glow: 7,
  });

  // 3D 5x2 GPU Fleet Floor on right (4 emerald ready + 6 blue hollow pending orders revealed AFTER place-order!)
  const fleetView = cinematic3d({
    theta: -0.8,
    phi: 1.0,
    distance: 15.8,
    unit: 112,
    focus: [0, 0, 0.75],
  }).at(285, 28);

  fleetView.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  const pendingOrders = [];
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = -3.45 + col * 1.42;
    const y = -1.45 + row * 1.85;
    if (i < 4) {
      // 4 Ready emerald GPU replicas owning the 20 active streams
      addBox3D(fleetView, x, y, 0.05, 1.12, 1.12, 1.1, ROLE.ready, ROLE.ready, {
        faceOpacity: 0.84,
        edgeWidth: 2.3,
        edgeGlow: 8,
      });
    } else {
      // 6 Pending hollow blue wireframe orders (hidden until AFTER place-order!)
      pendingOrders.push(
        ...addWireBox3D(fleetView, x, y, 0.05, 1.12, 1.12, 1.1, ROLE.pending, {
          width: 2.5,
          opacity: 0.9,
          glow: 9,
        }),
      );
    }
  }
  hideNodes(pendingOrders);

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const missing = st >= 5.5;

      const nodes = [
        txt(
          st >= 2.5
            ? 'FLEET: 4 READY (SOLID) + 6 PENDING (WIREFRAME)'
            : 'FLEET: 4 READY WORKERS (20 SLOTS FULL)',
          285,
          -402,
          26,
          st >= 2.5 ? ROLE.pending : ROLE.ready,
          'mono',
        ).glow(5, st >= 2.5 ? ROLE.pending : ROLE.ready),
        txt(
          missing ? 'DEMAND SAMPLE: MISSING / STALE' : 'SNAPSHOT: 20 RUNNING + 30 WAITING = 50',
          -860,
          -190,
          26,
          missing ? ROLE.expired : ROLE.focus,
          'mono',
          'left',
        ).glow(missing ? 8 : 5, missing ? ROLE.expired : ROLE.focus),
        txt(
          'Capacity:  5 slots / replica  (same workload)',
          -860,
          -135,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),
      ];

      // Poll 0 Prediction (st ~ 1; below targetEq y=-15 and hides immediately on desired-replicas)
      if (st >= 0.5 && st < 1.02) {
        nodes.push(
          txt('POLL 1  ·  PREDICT:', -860, 82, 26, ROLE.predict, 'mono', 'left'),
          txt('How many total replicas to request?', -860, 140, 32, ROLE.predict, 'sans', 'left')
            .glow(8, ROLE.predict)
            .opacity(1),
        );
      }

      // Poll 0 Reveal (AFTER desired-replicas & place-order)
      if (st >= 1.5 && st < 3.5) {
        nodes.push(
          txt('DESIRED = 10 TOTAL', -860, 82, 34, ROLE.active, 'mono', 'left').glow(8, ROLE.active),
        );
        if (st >= 2.5) {
          nodes.push(
            txt(
              '4 ready + 6 pending orders (booting)',
              -860,
              144,
              28,
              ROLE.pending,
              'mono',
              'left',
            ).glow(6, ROLE.pending),
          );
        }
      }

      // Poll 1 Prediction (st ~ 4)
      if (st >= 3.5 && st < 4.5) {
        nodes.push(
          txt(
            'POLL 2: SAME 30 WAITING · 4 READY · 6 STARTING',
            -860,
            78,
            26,
            ROLE.active,
            'mono',
            'left',
          ),
          txt('PREDICT: How many MORE workers?', -860, 145, 32, ROLE.predict, 'sans', 'left')
            .glow(8, ROLE.predict)
            .opacity(1),
        );
      }

      // Poll 1 Reveal (AFTER pending-counted)
      if (st >= 4.5 && st < 5.5) {
        nodes.push(
          txt('+0 ADDITIONAL WORKERS', -860, 86, 36, ROLE.warm, 'mono', 'left').glow(9, ROLE.warm),
          txt(
            'Pending 6 are already inside desired = 10',
            -860,
            152,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt(
            'Router keeps enforcing queue cap while they boot',
            -860,
            210,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      // Missing telemetry (st >= 5.5)
      if (missing) {
        nodes.push(
          txt(
            'HOLD DESIRED = 10  ·  ALERT COLLECTOR',
            -860,
            86,
            30,
            ROLE.focus,
            'mono',
            'left',
          ).glow(8, ROLE.focus),
          txt(
            'Missing telemetry != zero waiting callers',
            -860,
            152,
            28,
            ROLE.expired,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, fleetView, header, dyn);
  orbitScene(s, c, fleetView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0: Question 1 (NO reveal!)
  c.on('waiting-snapshot', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('waiting-snapshot').start, 0.3) }));
  });

  // Beat 1: Strict AFTER reveals
  c.show('desired-replicas', targetEq, { after: true });
  c.after('desired-replicas', () => {
    s.play(step.to(2, { duration: clampDur(c, c.cue('desired-replicas').end, 0.3) }));
  });
  c.after('place-order', () => {
    const t = c.cue('place-order').end;
    s.play(step.to(3, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, pendingOrders, 0.4);
  });

  // Beat 2: Question 2 (NO reveal!)
  c.on('next-poll', () => {
    s.play(step.to(4, { duration: clampDur(c, c.cue('next-poll').start, 0.3) }));
  });

  // Beat 3: Strict AFTER reveal + missing telemetry
  c.after('pending-counted', () => {
    s.play(step.to(5, { duration: clampDur(c, c.cue('pending-counted').end, 0.3) }));
  });
  c.on('missing-telemetry', () => {
    s.play(step.to(6, { duration: clampDur(c, c.cue('missing-telemetry').start, 0.3) }));
  });
}
