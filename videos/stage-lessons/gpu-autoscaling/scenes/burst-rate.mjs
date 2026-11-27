// Scene 28: burst-rate - Convert slots to rate under the declared service time
// Dual-curve luminous queue dynamics:
//   Left: 5 slots / 10s = 0.5 RPS/replica; 20 replicas = 100 slots / 10 RPS.
//   Right: Finite 100-req burst draining at 190s (< 207s cold & < 300s budget) vs sustained 1.0 RPS diverging wave!
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  dashedRule,
  glowDot,
  glowTex,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function burstRate(s, c) {
  const step = s.value(0); // 1=0.5 RPS & 20 reps = 10 RPS, 2=finite 100 drains, 3=last group@190s, 4=sustained 1.0 RPS diverges

  const header = cinemaHeader(
    'CONCURRENCY VS OFFERED RATE',
    'Convert slots to rate',
    'with service time',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(240, 40, 640, '#5ce1e620', '#ff6b8b1a');

  const rateEq = glowTex(
    String.raw`\frac{5\;\text{slots}}{10\;\text{s}} = 0.5\;\text{RPS/replica}`,
    {
      x: -550,
      y: -155,
      size: 38,
      color: ROLE.focus,
      glow: 7,
    },
  );

  // Queue depth curve helper: x in [-20, 820] for t in [0, 220s], y in [280, -210] for queue in [0, 150]
  const tx = (t) => -20 + (t / 220) * 840;
  const qy = (q) => 280 - (q / 150) * 470;

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const nodes = [];

      // Left readouts: Concurrency vs Rate
      nodes.push(
        txt('1 warm replica: 5 slots -> 0.5 req/s', -860, -45, 28, ROLE.active, 'mono', 'left'),
        txt('20 replicas: 100 slots -> 10 req/s', -860, 16, 28, ROLE.warm, 'mono', 'left'),
        txt(
          'Concurrency = count · Rate = count / time',
          -860,
          84,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      if (st >= 1.5) {
        nodes.push(
          txt('FINITE BURST (100 @ t=0, 300s budget)', -860, 178, 26, ROLE.warm, 'mono', 'left'),
          txt(
            st >= 2.5
              ? 'Last group starts at 190 s (cold GPU still loading)'
              : 'Queue drains linearly at 0.5 req/s',
            -860,
            234,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );
      }

      if (st >= 3.5) {
        nodes.push(
          txt(
            'SUSTAINED 1.0 RPS > 0.5 RPS CAPACITY',
            -860,
            326,
            28,
            ROLE.expired,
            'mono',
            'left',
          ).glow(7, ROLE.expired),
          txt(
            'Queue grows without bound even while replying',
            -860,
            382,
            26,
            ROLE.expired,
            'sans',
            'left',
          ),
        );
      }

      // Right plot: Queue depth over time (0..220s)
      nodes.push(
        txt('QUEUE DEPTH OVER TIME (1 WARM GPU)', 400, -285, 26, ROLE.focus, 'mono'),
        dashedRule(tx(0), qy(0), tx(220), qy(0), '#3b4f7a', 0.8, 2.2),
        dashedRule(tx(0), qy(0), tx(0), qy(150), '#3b4f7a', 0.8, 2.2),
        dashedRule(tx(207), qy(0), tx(207), qy(150), ROLE.cold, 0.85, 2.4),
        txt('Cold GPU 207s', tx(207) - 10, qy(145), 26, ROLE.cold, 'mono', 'right'),
        txt('0s', tx(0), 322, 26, COSMOS.dim, 'mono'),
        txt('100s', tx(100), 322, 26, COSMOS.dim, 'mono'),
        txt('190s', tx(190), 322, 26, ROLE.warm, 'mono'),
        txt('100', tx(0) - 42, qy(100), 26, COSMOS.dim, 'mono'),
      );

      // Finite burst draining curve: q(t) = max(0, 95 - 0.5*t), hits 0 at t=190s
      const finitePts = [
        [tx(0), qy(95)],
        [tx(190), qy(0)],
      ];
      nodes.push(
        beamWithPhotons(finitePts, ROLE.warm, 0, { width: 4.2, glow: 10, photonCount: 2 }),
        txt('Finite 100 burst', tx(16), qy(116), 26, ROLE.warm, 'mono', 'left'),
      );
      if (st >= 2.5) {
        nodes.push(
          glowDot(tx(190), qy(0), { radius: 10, color: ROLE.warm, glow: 14 }),
          txt('Last start 190s', tx(188), qy(44), 26, ROLE.warm, 'mono', 'right').glow(
            6,
            ROLE.warm,
          ),
        );
      }

      // Sustained 1.0 RPS diverging curve: q(t) = 0.5*t (grows from 0 to 110 over 220s!)
      if (st >= 3.5) {
        const divPts = [
          [tx(0), qy(10)],
          [tx(220), qy(120)],
        ];
        nodes.push(
          beamWithPhotons(divPts, ROLE.expired, 0, { width: 4.4, glow: 11, photonCount: 2 }),
          txt('1.0 RPS arrival -> diverges', tx(110), qy(102), 26, ROLE.expired, 'mono').glow(
            7,
            ROLE.expired,
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, rateEq, dyn);

  tweenOn(s, c, 'ga-burst-rate-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-burst-rate-b1', step, 2, 0.3);
  tweenOn(s, c, 'ga-last-admission', step, 3, 0.3);
  tweenOn(s, c, 'continuing-arrivals', step, 4, 0.35);
}
