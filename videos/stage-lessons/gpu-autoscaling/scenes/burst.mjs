// Scene 27: burst - Replay the nine o'clock queue
// Orbiting 3D warm GPU fleet scaling 1 -> 3 -> 20 replicas with pinned R21 ticket.
// Strict prediction withholding: beat 1 rewinds with 3 warm GPUs and asks which GPU takes R21 at 10s;
// reveals GPU 2 @ 10s (60 admitted, 40 expired) strictly AFTER more-admitted & queue-expiry!
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  glowBar,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function burst(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=1 warm (20/80), 2=3 warm ask(PREDICT!), 3=R21 on GPU2@10s(AFTER!), 4=60/40(AFTER!), 5=20 warm, 6=all 100@0s

  const header = cinemaHeader(
    'WARM POOL REPLAY  ·  100 REQUESTS',
    'Replay the nine',
    'oclock queue',
    {
      x: -860,
      y: -420,
      accent: ROLE.warm,
      size: 52,
    },
  );

  const bgAura = aura(295, 25, 630, '#6ee7b722', '#ffd1661c');

  // 3D Warm GPU Cluster on right: GPU 1 always visible; GPU 2-3 reveal on three-warm; GPU 4-20 reveal on twenty-ready!
  const poolView = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 16.4,
    unit: 106,
    focus: [0, 0, 0.65],
  }).at(295, 32);

  poolView.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // 5 x 4 grid of up to 20 warm GPUs (all emerald during prediction; gold highlight cage on GPU 2 reveals strictly AFTER more-admitted!)
  const gpu23 = [];
  const gpu420 = [];
  let gpu2Highlight = [];
  for (let i = 0; i < 20; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = -3.45 + col * 1.44;
    const y = -2.4 + row * 1.32;
    const objs = addBox3D(poolView, x, y, 0.05, 1.06, 0.96, 0.85, ROLE.warm, ROLE.warm, {
      faceOpacity: 0.84,
      edgeWidth: 2.1,
      edgeGlow: 7,
    });
    if (i === 1) {
      gpu2Highlight = hideNodes(
        addWireBox3D(poolView, x - 0.1, y - 0.1, 0.02, 1.26, 1.16, 1.02, ROLE.ticket, {
          width: 3.4,
          opacity: 0.98,
          glow: 13,
        }),
      );
    }
    if (i === 1 || i === 2) gpu23.push(...objs);
    else if (i >= 3) gpu420.push(...objs);
  }
  hideNodes(gpu23);
  hideNodes(gpu420);

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const blink = 0.68 + 0.32 * Math.sin(p * 5.0);

      const warmCount = st >= 4.5 ? 20 : st >= 1.5 ? 3 : 1;
      const admitted = st >= 5.5 ? 100 : st >= 3.5 ? 60 : st >= 1.5 ? null : 20;

      const nodes = [
        txt(
          `WARM CLUSTER: ${warmCount} READY GPU${warmCount > 1 ? 's' : ''} (COLD STILL 207s)`,
          295,
          -408,
          26,
          ROLE.warm,
          'mono',
        ).glow(5, ROLE.warm),
        txt('PINNED TICKET:  R21  (30s start gate)', -860, -195, 28, ROLE.ticket, 'mono', 'left'),
      ];

      // Case 1: 1 warm GPU
      nodes.push(
        txt(
          '1 Warm GPU:  20 start  ·  80 expire',
          -860,
          -125,
          28,
          st < 1.5 ? ROLE.expired : COSMOS.muted,
          'mono',
          'left',
        ),
        glowBar(-860, -72, 620, 34, 0.2, { fill: ROLE.active, glow: 6 }),
      );

      // Case 2: 3 warm GPUs -> prediction during st ~ 2, revealed AFTER more-admitted & queue-expiry!
      if (st >= 1.5) {
        nodes.push(
          txt('3 Warm GPUs:  15 start per 10s wave', -860, 12, 28, ROLE.active, 'mono', 'left'),
        );
        if (st < 2.5) {
          nodes.push(
            txt('PREDICT: Which GPU takes R21 at 10 s?', -860, 82, 30, ROLE.predict, 'sans', 'left')
              .glow(8, ROLE.predict)
              .opacity(blink),
            txt(
              'Fill GPU 1 (R16..20), then GPU 2, then GPU 3',
              -860,
              142,
              26,
              COSMOS.muted,
              'sans',
              'left',
            ),
          );
        } else {
          nodes.push(
            txt('R21 -> GPU 2 at t = 10 s!', -860, 72, 32, ROLE.ticket, 'mono', 'left').glow(
              9,
              ROLE.ticket,
            ),
          );
          if (st >= 3.5) {
            nodes.push(
              txt('60 start by 30 s  ·  40 expire', -860, 134, 28, ROLE.expired, 'mono', 'left'),
              glowBar(-860, 188, 620, 34, 0.6, { fill: ROLE.warm, glow: 8 }),
            );
          }
        }
      }

      // Case 3: 20 warm GPUs -> all 100 start immediately at t=0 (floating cinema callout)
      if (st >= 4.5) {
        nodes.push(
          txt(
            st >= 5.5 ? '20 Warm GPUs: ALL 100 start @ 0 s' : '20 Warm GPUs ready before 9:00',
            -860,
            280,
            30,
            ROLE.warm,
            'mono',
            'left',
          ).glow(8, ROLE.warm),
          txt(
            'Zero wait, high idle cost vs 30s wave reuse',
            -860,
            338,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );
      } else if (admitted !== null && st < 1.5) {
        nodes.push(
          txt(
            'R21 sits right behind the 20th admitted request',
            -860,
            26,
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

  s.add(bgAura, poolView, header, dyn);
  orbitScene(s, c, poolView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 6.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('one-warm-outcome', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('one-warm-outcome').start, 0.3) }));
  });
  c.on('three-warm', () => {
    const t = c.cue('three-warm').start;
    s.play(step.to(2, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, gpu23, 0.38);
  });
  c.after('more-admitted', () => {
    const t = c.cue('more-admitted').end;
    s.play(step.to(3, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, gpu2Highlight, 0.35);
  });
  c.after('queue-expiry', () => {
    s.play(step.to(4, { duration: clampDur(c, c.cue('queue-expiry').end, 0.3) }));
  });
  c.on('twenty-ready', () => {
    const t = c.cue('twenty-ready').start;
    s.play(step.to(5, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, gpu420, 0.42);
  });
  c.after('all-at-once', () => {
    s.play(step.to(6, { duration: clampDur(c, c.cue('all-at-once').end, 0.3) }));
  });
}
