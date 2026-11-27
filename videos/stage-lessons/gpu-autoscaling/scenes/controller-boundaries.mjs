// Scene 23: controller-boundaries - When can one worker go?
// Orbiting 3D 12-GPU replica fleet + glowing hysteresis cooldown timeline (100s -> 399s -> 400s boundary).
// Strict prediction withholding: beat 1 advances clock to 399s and asks if a worker can leave;
// reveals drain at 400s strictly AFTER drain-one, then shows upper cap of 20 replicas.
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
  fadeOutNodes,
  glowBar,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function controllerBoundaries(s, c) {
  const step = s.value(0); // 1=56 reqs->12 desired, 2=low@100s, 3=399s question(PREDICT!), 4=400s drain 1(AFTER!), 5=20-replica cap

  const header = cinemaHeader('HYSTERESIS & FLEET BOUNDS', 'When can one', 'worker go?', {
    x: -860,
    y: -420,
    accent: ROLE.drain,
    size: 52,
  });

  const bgAura = aura(285, 20, 620, '#fb923c20', '#6ee7b71a');

  // 3D 4x3 Fleet of 12 Ready GPUs on right (GPU #12 shifts to amber wireframe when draining at 400s!)
  const fleetView = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 15.8,
    unit: 112,
    focus: [0, 0, 0.75],
  }).at(285, 25);

  fleetView.add(
    gridPlane3d({
      x: [-3.6, 3.6],
      y: [-2.5, 2.5],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  let gpu12Solid = [];
  let gpu12Draining = [];
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 4; col++) {
      const idx = r * 4 + col;
      const x = -2.9 + col * 1.48;
      const y = -2.0 + r * 1.48;
      if (idx === 11) {
        gpu12Solid = addBox3D(fleetView, x, y, 0.05, 1.12, 1.12, 1.0, ROLE.ready, ROLE.ready, {
          faceOpacity: 0.84,
          edgeWidth: 2.2,
          edgeGlow: 8,
        });
        gpu12Draining = hideNodes(
          addWireBox3D(fleetView, x, y, 0.05, 1.12, 1.12, 1.0, ROLE.drain, {
            width: 3.0,
            opacity: 0.96,
            glow: 11,
          }),
        );
      } else {
        addBox3D(fleetView, x, y, 0.05, 1.12, 1.12, 1.0, ROLE.ready, ROLE.ready, {
          faceOpacity: 0.78,
          edgeWidth: 2.0,
          edgeGlow: 6,
        });
      }
    }
  }

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;

      const elapsed = st >= 3.5 ? 300 : st >= 2.5 ? 299 : st >= 1.5 ? 40 : 0;
      const clockS = st >= 3.5 ? 400 : st >= 2.5 ? 399 : st >= 1.5 ? 140 : 100;
      const barCol = st >= 3.5 ? ROLE.drain : ROLE.focus;

      const nodes = [
        txt(
          st >= 4.5
            ? 'FLEET CAP: FLOOR 1 · CEILING 20 REPLICAS'
            : st >= 3.5
              ? '11 READY + 1 DRAINING (GPU #12)'
              : '12 READY WORKERS (56 REQS -> CEIL 12)',
          285,
          -402,
          26,
          st >= 3.5 ? ROLE.drain : ROLE.ready,
          'mono',
        ).glow(5, st >= 3.5 ? ROLE.drain : ROLE.ready),
        txt(
          '20 running + 36 waiting = 56 -> 12 desired',
          -860,
          -195,
          26,
          ROLE.active,
          'mono',
          'left',
        ),
        txt(
          'Bounds: min 1 · max 20 · quiet window 300 s',
          -860,
          -142,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      ];

      // Hysteresis cooldown meter (beat 1+)
      if (st >= 1.5 && st < 4.5) {
        nodes.push(
          txt(`QUIET WINDOW CLOCK:  t = ${clockS} s`, -860, -48, 30, barCol, 'mono', 'left').glow(
            6,
            barCol,
          ),
          txt(`Fresh low evidence: ${elapsed} / 300 s`, -860, 8, 28, COSMOS.ink, 'mono', 'left'),
          glowBar(-860, 68, 640, 44, elapsed / 300, { fill: barCol, glow: 9 }),
        );
      }

      // Prediction prompt at 399s (NO reveal yet!)
      if (st >= 2.5 && st < 3.5) {
        nodes.push(
          txt(
            'PREDICT: Can one worker leave at 399 s?',
            -860,
            168,
            30,
            ROLE.predict,
            'sans',
            'left',
          )
            .glow(8, ROLE.predict)
            .opacity(1),
        );
      }

      // Reveal strictly AFTER drain-one
      if (st >= 3.5 && st < 4.5) {
        nodes.push(
          txt('399 s = 299 s evidence -> HOLD at 12', -860, 152, 28, ROLE.focus, 'mono', 'left'),
          txt(
            '400 s = 300 s -> DRAIN 1 (11 desired)',
            -860,
            214,
            30,
            ROLE.drain,
            'mono',
            'left',
          ).glow(8, ROLE.drain),
          txt(
            'Scale-up still reacts immediately on surge',
            -860,
            276,
            26,
            ROLE.warm,
            'sans',
            'left',
          ),
        );
      }

      // Beat 3: Timer resets & 20-worker ceiling
      if (st >= 4.5) {
        nodes.push(
          txt('TIMER RESETS ON:', -860, -52, 26, ROLE.expired, 'mono', 'left'),
          txt('Missing, future, or >30s stale sample', -860, 4, 26, COSMOS.ink, 'sans', 'left'),
          txt('Any pending booting replicas', -860, 56, 26, COSMOS.ink, 'sans', 'left'),
          txt('200 REQUESTS AT CAP = 20 REPLICAS', -860, 154, 28, ROLE.focus, 'mono', 'left').glow(
            7,
            ROLE.focus,
          ),
          txt(
            'Hold cap at 20 and enforce admission control',
            -860,
            214,
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

  s.add(bgAura, fleetView, header, dyn);
  orbitScene(s, c, fleetView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });

  c.on('desired-twelve', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('desired-twelve').start, 0.3) }));
  });
  c.on('low-window', () => {
    s.play(step.to(2, { duration: clampDur(c, c.cue('low-window').start, 0.3) }));
  });
  c.on('still-low', () => {
    // Question at 399s: DO NOT switch GPU 12 to draining yet!
    s.play(step.to(3, { duration: clampDur(c, c.cue('still-low').start, 0.3) }));
  });
  c.after('drain-one', () => {
    const t = c.cue('drain-one').end;
    s.play(step.to(4, { duration: clampDur(c, t, 0.3) }));
    fadeOutNodes(s, c, t, gpu12Solid, 0.25);
    fadeInNodes(s, c, t, gpu12Draining, 0.35);
  });
  c.on('upper-bound', () => {
    s.play(step.to(5, { duration: clampDur(c, c.cue('upper-bound').start, 0.3) }));
  });
}
