// Scene 21: metric-units - Distinguish waiting work from useful GPU activity
// Triple luminous telemetry instruments: GPU Duty Cycle stays 95% while Active KV climbs 45% -> 92%
// and Queue Wait spikes from Short -> Old, plus stale-collector hold-and-alert guard.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  driftValue,
  glowBar,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function metricUnits(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=healthy busy 95% / 45% KV / short queue, 2=same 95% / 92% KV / old queue + stale guard

  const header = cinemaHeader(
    'DCGM VS ENGINE TELEMETRY',
    'Waiting work vs',
    'useful GPU activity',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(200, 40, 640, '#60a5fa1e', '#ff6b8b1a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const stressed = st >= 1.5;
      const kvFrac = stressed ? 0.92 : 0.45;
      const qFrac = stressed ? 0.84 : 0.08;
      const barLeft = -330;
      const barW = 860;

      const nodes = [
        txt(
          stressed ? 'STATE B: SATURATED QUEUE & KV' : 'STATE A: HEALTHY BUSY GPU',
          860,
          -355,
          28,
          stressed ? ROLE.expired : ROLE.warm,
          'mono',
          'right',
        ).glow(7, stressed ? ROLE.expired : ROLE.warm),

        // Gauge 1: DCGM GPU Duty Cycle (95% in BOTH states!)
        txt('GPU Duty Cycle', -860, -135, 30, ROLE.cold, 'mono', 'left'),
        txt('DCGM hardware', -860, -90, 26, COSMOS.dim, 'mono', 'left'),
        glowBar(barLeft, -115, barW, 56, 0.95, { fill: ROLE.cold, glow: 8 }),
        txt('95% (UNCHANGED)', 560, -115, 28, ROLE.cold, 'mono', 'left'),

        // Gauge 2: Active KV Cache (45% -> 92%)
        txt('Active KV Cache', -860, 20, 30, stressed ? ROLE.expired : ROLE.warm, 'mono', 'left'),
        txt('Live allocations', -860, 65, 26, COSMOS.dim, 'mono', 'left'),
        glowBar(barLeft, 40, barW, 56, kvFrac, {
          fill: stressed ? ROLE.expired : ROLE.warm,
          glow: 9,
        }),
        txt(
          stressed ? '92% PRESSURE' : '45% HEALTHY',
          560,
          40,
          28,
          stressed ? ROLE.expired : ROLE.warm,
          'mono',
          'left',
        ).glow(stressed ? 7 : 4, stressed ? ROLE.expired : ROLE.warm),

        // Gauge 3: Oldest Queue Wait (Short -> Old)
        txt('Waiting Queue', -860, 175, 30, stressed ? ROLE.focus : ROLE.active, 'mono', 'left'),
        txt('Engine intake', -860, 220, 26, COSMOS.dim, 'mono', 'left'),
        glowBar(barLeft, 195, barW, 56, qFrac, {
          fill: stressed ? ROLE.focus : ROLE.active,
          glow: 9,
        }),
        txt(
          stressed ? 'OLDEST WAIT UP' : 'SHORT QUEUE',
          560,
          195,
          28,
          stressed ? ROLE.focus : ROLE.active,
          'mono',
          'left',
        ).glow(stressed ? 7 : 4, stressed ? ROLE.focus : ROLE.active),
      ];

      if (stressed) {
        nodes.push(
          txt(
            'Exclude evictable prefix blocks  ·  If queue gauge stops reporting: HOLD capacity & alert',
            0,
            375,
            26,
            ROLE.focus,
            'sans',
          ).glow(5, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            '95% GPU duty with on-time tokens means useful work, not an autoscaling emergency',
            0,
            375,
            28,
            ROLE.warm,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 5.5, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-metric-units-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-metric-units-b1', step, 2, 0.4);
}
