// Scene 06: probe-contract - Keep full capacity separate from failed initialization
// Live HTTP status gate (503 / 200 / 409 / 429 / drain 503) + Kubernetes Startup/Readiness/Liveness probes.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function probeContract(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=503 booting, 2=200 R1/R2, 3=409 dup, 4=429 full, 5=probes + drain + atomic claim

  const header = cinemaHeader(
    'HTTP & KUBERNETES PROBES',
    'Separate full capacity',
    'from failed boot',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(240, 40, 620, '#5ce1e61c', '#fb923c1a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const nodes = [];

      // Left: Two-slot worker core
      const active = st >= 1.5;
      const draining = st >= 4.5;
      const workerCol = draining ? ROLE.drain : active ? ROLE.active : ROLE.warmup;
      nodes.push(
        txt(
          draining
            ? 'WORKER: DRAINING (INTAKE CLOSED)'
            : active
              ? 'WORKER: READY (2/2 SLOTS)'
              : 'WORKER: LOADING & WARMING',
          -520,
          -170,
          26,
          workerCol,
          'mono',
        ).glow(6, workerCol),
      );
      for (let i = 0; i < 2; i++) {
        nodes.push(
          rect(280, 110, {
            fill: active ? '#0f243b' : '#0d1426',
            stroke: active ? ROLE.active : '#364970',
            width: 2.6,
            radius: 14,
            ...(active ? {} : { dash: [6, 6] }),
          })
            .at(-675 + i * 310, -55)
            .glow(active ? 8 : 2, ROLE.active),
          txt(
            active ? `R${i + 1} streaming` : `Slot ${i + 1} idle`,
            -675 + i * 310,
            -55,
            28,
            active ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }

      // Status code lanes on right
      const lanes = [
        {
          code: '503',
          desc: 'Loading / warming / draining',
          col: ROLE.warmup,
          on: st >= 0.4,
          y: -155,
        },
        { code: '200', desc: 'R1 & R2 admitted to slots', col: ROLE.ready, on: st >= 1.5, y: -55 },
        { code: '409', desc: 'Duplicate request ID', col: ROLE.decode, on: st >= 2.5, y: 45 },
        {
          code: '429',
          desc: 'Full (R3 rejected, engine green)',
          col: ROLE.reject,
          on: st >= 3.5,
          y: 145,
        },
      ];
      for (const ln of lanes) {
        const op = ln.on ? 1 : 0.25;
        nodes.push(
          beamWithPhotons(
            [
              [-200, -55],
              [60, ln.y],
            ],
            ln.col,
            ln.on ? p * 1.0 : null,
            { width: 3.0, glow: ln.on ? 8 : 0, photonCount: 1, alpha: op },
          ),
          rect(115, 58, { fill: '#10182b', stroke: ln.col, width: 2.4, radius: 10 })
            .at(135, ln.y)
            .glow(ln.on ? 7 : 0, ln.col)
            .opacity(op),
          txt(ln.code, 135, ln.y, 28, ln.col, 'mono').opacity(op),
          txt(ln.desc, 220, ln.y, 26, ln.on ? COSMOS.ink : COSMOS.dim, 'sans', 'left').opacity(op),
        );
      }

      // Lower Probe separation strip
      const probes = [
        { name: 'STARTUP', role: 'Time to load weights', col: ROLE.cold, x: -580 },
        { name: 'READINESS', role: 'Router traffic gate', col: ROLE.ready, x: 0 },
        { name: 'LIVENESS', role: 'Restart only if wedged', col: ROLE.reject, x: 580 },
      ];
      const probeY = 305;
      const pOp = st >= 4.5 ? 1 : 0.45;
      for (const pr of probes) {
        nodes.push(
          glowDot(pr.x - 190, probeY, { radius: 9, color: pr.col, glow: 10, opacity: pOp }),
          txt(pr.name, pr.x - 160, probeY - 16, 26, pr.col, 'mono', 'left').opacity(pOp),
          txt(pr.role, pr.x - 160, probeY + 24, 26, COSMOS.ink, 'sans', 'left').opacity(pOp),
        );
      }

      if (st >= 4.5) {
        nodes.push(
          txt(
            'Atomic check-and-claim prevents two arrivals racing for the last slot',
            0,
            405,
            28,
            ROLE.focus,
            'sans',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Restarting a 429 worker kills active R1 & R2 streams',
            -860,
            145,
            26,
            ROLE.reject,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 5.5, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-probe-contract-b0', step, 1, 0.3);
  tweenOn(s, c, 'ga-probe-ready', step, 2, 0.3);
  tweenOn(s, c, 'ga-probe-duplicate', step, 3, 0.3);
  tweenOn(s, c, 'ga-probe-full', step, 4, 0.3);
  tweenOn(s, c, 'ga-probe-contract-b1', step, 5, 0.35);
}
