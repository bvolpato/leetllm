// Scene 29: drain - Remove a worker without abandoning its ownership
// Executable Worker drain state machine: close local intake (503) while retaining active R1 & R2,
// release R1 independently while R2 continues, then reach active=0 for safe termination.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  Worker,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function drain(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=close admission, 2=owned R1+R2, 3=R1 completes, 4=R2 still active, 5=empty active, 6=safe shutdown

  const header = cinemaHeader(
    'GRACEFUL WORKER DRAIN',
    'Remove a worker without',
    'dropping active streams',
    {
      x: -860,
      y: -420,
      accent: ROLE.drain,
      size: 52,
    },
  );

  const bgAura = aura(180, 40, 640, '#fb923c20', '#6ee7b71a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const w = new Worker();
      w.loaded = true;
      w.warmed = true;
      w.admit('R1');
      w.admit('R2');
      w.draining = true;
      if (st >= 2.5) w.release('R1');
      if (st >= 4.5) w.release('R2');
      const newStatus = w.admit('R3');
      const safe = w.active.size === 0;

      const nodes = [];

      // Left: Closed Admission Gate (503 on R3)
      nodes.push(
        txt('LOCAL INTAKE GATE', -640, -175, 26, ROLE.drain, 'mono'),
        rect(380, 128, { fill: '#2a161e', stroke: ROLE.expired, width: 2.8, radius: 16 })
          .at(-640, -65)
          .glow(8, ROLE.expired),
        txt('READINESS: FALSE', -640, -88, 28, ROLE.expired, 'mono'),
        txt(`New R3 -> ${newStatus} CLOSED`, -640, -40, 28, ROLE.drain, 'mono'),
        txt('Worker rejects arrivals itself', -640, 44, 26, COSMOS.muted, 'sans'),
        txt('(router propagation lags)', -640, 86, 26, COSMOS.dim, 'sans'),
      );

      // Center: Two Active Stream Ownership Slots (R1 & R2)
      const r1Active = w.active.has('R1');
      const r2Active = w.active.has('R2');
      nodes.push(txt('OWNED ACTIVE STREAMS', 70, -175, 26, ROLE.active, 'mono'));

      const slots = [
        { id: 'R1', active: r1Active, y: -95 },
        { id: 'R2', active: r2Active, y: 45 },
      ];
      for (const sl of slots) {
        const col = sl.active ? ROLE.active : ROLE.warm;
        nodes.push(
          rect(390, 96, {
            fill: sl.active ? '#0f233b' : '#0f2724',
            stroke: col,
            width: 2.6,
            radius: 14,
            ...(sl.active ? {} : { dash: [6, 6] }),
          })
            .at(70, sl.y)
            .glow(sl.active ? 8 : 4, col),
          txt(
            sl.active ? `${sl.id} · ACTIVE STREAM` : `${sl.id} · RELEASED`,
            70,
            sl.y,
            28,
            col,
            'mono',
          ),
        );
        if (sl.active) {
          nodes.push(
            beamWithPhotons(
              [
                [270, sl.y],
                [465, sl.y],
              ],
              ROLE.active,
              p * 1.1,
              { width: 3.4, glow: 9, photonCount: 2 },
            ),
          );
        }
      }

      // Right: Termination Safety Gate
      const termCol = safe ? ROLE.warm : ROLE.drain;
      nodes.push(
        txt('SHUTDOWN GATE', 665, -175, 26, termCol, 'mono'),
        rect(360, 140, {
          fill: safe ? '#0e2b25' : '#261b12',
          stroke: termCol,
          width: 3.0,
          radius: 16,
        })
          .at(665, -25)
          .glow(safe ? 11 : 6, termCol),
        txt(`ACTIVE SET: ${w.active.size}`, 665, -52, 30, COSMOS.ink, 'mono'),
        txt(safe ? 'SAFE TO TERMINATE' : 'WAIT · DO NOT KILL', 665, 2, 26, termCol, 'mono').glow(
          7,
          termCol,
        ),
        glowDot(665, 118, { radius: 10, color: termCol, glow: 12 }),
      );

      // Bottom lifecycle guidance
      const foot =
        st >= 4.5
          ? 'Use downscale stabilization to avoid paying cold starts after brief lulls'
          : st >= 2.5
            ? 'Honor earliest shutdown deadline + cleanup reserve  ·  explicit interrupt if overrun'
            : 'Changing desired replicas never transfers KV state or finishes active streams';
      nodes.push(txt(foot, 0, 355, 28, safe ? ROLE.warm : ROLE.focus, 'sans'));

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'closed-admission', step, 1, 0.25);
  tweenOn(s, c, 'owned-requests', step, 2, 0.25);
  tweenOn(s, c, 'release-one', step, 3, 0.3);
  tweenOn(s, c, 'still-active', step, 4, 0.25);
  tweenOn(s, c, 'empty-active-set', step, 5, 0.3);
  tweenOn(s, c, 'safe-termination', step, 6, 0.3);
}
