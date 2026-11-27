// Scene 05: readiness - Loaded, warmed and healthy must all agree
// Executable Worker state machine: 3 glowing gates (Loaded, Warmed, Healthy) + 2-slot admission core.
// Rejects 503 when unloaded or unwarmed, admits R1/R2 (200), returns 429 on R3 while Liveness stays green.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  Worker,
  aura,
  beamWithPhotons,
  cinemaHeader,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function readiness(s, c) {
  const step = s.value(0); // 1=weights-missing, 2=not-ready, 3=warmup-pending, 4=engine-readiness, 5=admit-two, 6=overload-third

  const header = cinemaHeader(
    'WORKER STATE MACHINE',
    'Loaded, warmed & healthy',
    'must all agree',
    {
      x: -860,
      y: -420,
      accent: ROLE.warm,
      size: 52,
    },
  );

  const bgAura = aura(240, 40, 620, '#6ee7b71e', '#ff6b8b16');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const worker = new Worker();
      worker.loaded = st >= 2.5;
      worker.warmed = st >= 4.5;
      const r1 = worker.admit('R1');
      const r2 = worker.admit('R2');
      const r3 = worker.admit('R3');
      const isReady = worker.ready();

      const nodes = [];

      // Three readiness gates along top-right / middle-left
      const gates = [
        { label: 'WEIGHTS LOADED', ok: worker.loaded, x: -560 },
        { label: 'ENGINE WARMED', ok: worker.warmed, x: -130 },
        { label: 'LIVENESS HEALTHY', ok: worker.healthy, x: 300 },
      ];
      const gateY = -125;

      for (let i = 0; i < gates.length; i++) {
        const g = gates[i];
        const col = g.ok ? ROLE.ready : i === 0 ? ROLE.reject : ROLE.warmup;
        nodes.push(
          rect(350, 88, {
            fill: g.ok ? '#0e2926' : '#261420',
            stroke: col,
            width: 2.6,
            radius: 14,
          })
            .at(g.x, gateY)
            .glow(7, col),
          txt(g.label, g.x, gateY - 14, 26, COSMOS.ink, 'mono'),
          txt(g.ok ? 'PASS' : 'PENDING', g.x, gateY + 22, 26, col, 'mono').glow(5, col),
        );
        if (i < 2) {
          nodes.push(
            beamWithPhotons(
              [
                [g.x + 180, gateY],
                [gates[i + 1].x - 180, gateY],
              ],
              g.ok ? ROLE.ready : '#394a70',
              0,
              { width: 3.0, glow: 6, photonCount: 1 },
            ),
          );
        }
      }

      // Combined Readiness Badge on right
      const rdCol = isReady ? ROLE.ready : ROLE.reject;
      nodes.push(
        rect(310, 88, {
          fill: isReady ? '#0e2c26' : '#2b1322',
          stroke: rdCol,
          width: 3.0,
          radius: 16,
        })
          .at(700, gateY)
          .glow(9, rdCol),
        txt('READY', 700, gateY - 14, 26, COSMOS.muted, 'mono'),
        txt(isReady ? 'TRUE' : 'FALSE', 700, gateY + 22, 28, rdCol, 'mono').glow(7, rdCol),
      );

      // Lower section: Two Local Slots + Incoming R1, R2, R3 requests
      const slotY = 145;
      nodes.push(txt('LOCAL SLOT BUDGET (2 SLOTS)', -520, slotY - 82, 26, ROLE.active, 'mono'));
      for (let i = 0; i < 2; i++) {
        const occupied = isReady;
        const col = occupied ? ROLE.active : '#384a70';
        nodes.push(
          rect(270, 96, {
            fill: occupied ? '#0f243b' : '#0c1324',
            stroke: col,
            width: 2.6,
            radius: 14,
            ...(occupied ? {} : { dash: [6, 6] }),
          })
            .at(-675 + i * 310, slotY)
            .glow(occupied ? 8 : 2, col),
          txt(
            occupied ? `Slot ${i + 1}: R${i + 1}` : `Slot ${i + 1}: empty`,
            -675 + i * 310,
            slotY,
            28,
            occupied ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }

      // Request verdict streams on right
      const reqs = [
        { id: 'R1', code: r1, y: 80, show: st >= 0.5 },
        { id: 'R2', code: r2, y: 165, show: st >= 4.5 },
        { id: 'R3', code: r3, y: 250, show: st >= 5.5 },
      ];
      for (const rq of reqs) {
        if (!rq.show) continue;
        const col = rq.code === 200 ? ROLE.ready : rq.code === 429 ? ROLE.warmup : ROLE.reject;
        const label =
          rq.code === 200
            ? `${rq.id}  ->  200 ADMITTED`
            : rq.code === 429
              ? `${rq.id}  ->  429 OVERLOAD (FULL)`
              : `${rq.id}  ->  503 UNAVAILABLE`;
        nodes.push(
          beamWithPhotons(
            [
              [-140, slotY],
              [140, rq.y],
            ],
            col,
            0,
            { width: 3.4, glow: 8, photonCount: 1 },
          ),
          glowDot(160, rq.y, { radius: 9, color: col, glow: 12 }),
          txt(label, 190, rq.y, 28, col, 'mono', 'left').glow(6, col),
        );
      }

      // Bottom synthesis line (clean 3-phase progression, no brief flicker)
      const note =
        st >= 4.5
          ? 'Full worker stays healthy: never restart active streams on 429'
          : st >= 2.5
            ? 'Warmup pending -> readiness stays false until engine is warm'
            : 'Sidecar health checks miss uninitialized engine weights';
      nodes.push(txt(note, 0, 395, 28, st >= 5.5 ? ROLE.ready : ROLE.focus, 'sans'));

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'weights-missing', step, 1, 0.25);
  tweenOn(s, c, 'not-ready', step, 2, 0.25);
  tweenOn(s, c, 'warmup-pending', step, 3, 0.3);
  tweenOn(s, c, 'engine-readiness', step, 4, 0.3);
  tweenOn(s, c, 'admit-two', step, 5, 0.3);
  tweenOn(s, c, 'overload-third', step, 6, 0.3);
}
