// Scene 25: coldpath - When does the new worker reach the queue?
// Luminous sliding 207s serial startup Gantt (95 Node + 22 Image + 78 Weights + 12 Warmup)
// anchored to fixed 9:00 burst & 9:00:30 deadline gates.
// Strict prediction withholding on 08:58 lead (reveals +87s late AFTER late-readiness)
// and 08:56 lead (reveals -33s early AFTER ready-margin).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  cinemaHeader,
  dashedRule,
  driftValue,
  guardedDynamic,
  phases,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function coldpath(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=chain, 2=207s ready, 3=08:58 ask(PREDICT!), 4=+87s late(AFTER!), 5=08:56 ask(PREDICT!), 6=-33s early(AFTER!)

  const header = cinemaHeader(
    'COLD START CRITICAL PATH',
    'When does the new',
    'worker reach traffic?',
    {
      x: -860,
      y: -420,
      accent: ROLE.cold,
      size: 52,
    },
  );

  const bgAura = aura(120, 40, 680, '#60a5fa20', '#fb923c1a');

  const phaseColors = [ROLE.cold, ROLE.decode, ROLE.active, ROLE.warmup];
  // Shared clock axis: t in [-240s (08:56), +220s (09:03:40)] mapped to x in [-610, 740] (keeps [-860,-640] clear for row labels)
  const secX = (sec) => -610 + ((sec + 240) / 460) * 1350;

  function drawChain(startSec, y, { showEndpoint = true, alpha = 1, clipAt = null } = {}) {
    const out = [];
    let cursor = startSec;
    for (let i = 0; i < phases.length; i++) {
      const [name, dur] = phases[i];
      const segStart = cursor;
      const segEnd = cursor + dur;
      cursor = segEnd;
      if (clipAt !== null && segStart >= clipAt) continue;
      const drawEnd = clipAt !== null ? Math.min(segEnd, clipAt) : segEnd;
      const x1 = secX(segStart);
      const x2 = secX(drawEnd);
      const w = Math.max(8, x2 - x1 - 4);
      const col = phaseColors[i];
      out.push(
        rect(w, 54, { fill: '#111d36', stroke: col, width: 2.4, radius: 8 })
          .at((x1 + x2) * 0.5, y)
          .glow(6, col)
          .opacity(alpha),
      );
      if (w >= 95) {
        out.push(txt(`${name} ${dur}s`, (x1 + x2) * 0.5, y, 26, col, 'mono').opacity(alpha));
      }
    }
    if (showEndpoint) {
      const endSec = startSec + DATA.coldTotal;
      const early = endSec <= 0;
      const eCol = early ? ROLE.warm : ROLE.expired;
      if (early) {
        // Place strictly left of 09:00 line and below the bar so it never crosses 09:00 gate!
        out.push(
          txt(`${endSec}s EARLY`, secX(endSec) - 18, y + 52, 26, eCol, 'mono', 'right')
            .glow(7, eCol)
            .opacity(alpha),
        );
      } else {
        out.push(
          txt(`+${endSec}s`, secX(endSec) + 16, y, 26, eCol, 'mono', 'left')
            .glow(7, eCol)
            .opacity(alpha),
        );
      }
    }
    return out;
  }

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const blink = 0.68 + 0.32 * Math.sin(p * 5.0);
      const nodes = [];

      // Fixed vertical gates segmented strictly in the gaps between rows so strokes never cross bar text during fades
      const x0 = secX(0);
      const x30 = secX(30);
      const gateSpans = [
        [-210, -172],
        [-98, -26],
        [46, 118],
        [192, 260],
      ];
      for (const [y1, y2] of gateSpans) {
        nodes.push(
          dashedRule(x0, y1, x0, y2, ROLE.active, 0.9, 2.8),
          dashedRule(x30, y1, x30, y2, ROLE.deadline, 0.9, 2.8),
        );
      }
      nodes.push(
        txt('09:00 BURST', x0 - 14, -238, 26, ROLE.active, 'mono', 'right'),
        txt('+30s GATE', x30 + 14, -238, 26, ROLE.deadline, 'mono', 'left').glow(6, ROLE.deadline),
      );

      // Clock ticks along bottom of Gantt
      for (const [sec, lbl] of [
        [-240, '08:56'],
        [-120, '08:58'],
        [0, '09:00'],
        [120, '09:02'],
        [207, '+207s'],
      ]) {
        nodes.push(txt(lbl, secX(sec), 295, 26, COSMOS.dim, 'mono'));
      }

      // Row 1: Reactive start at 09:00 (0 -> +207s)
      nodes.push(
        txt('Start 09:00', -860, -135, 26, ROLE.cold, 'mono', 'left'),
        ...drawChain(0, -135, { showEndpoint: st >= 1.5, alpha: 1 }),
      );

      // Row 2: 2-minute lead (08:58 = -120s -> +87s). Withhold endpoint during prediction!
      if (st >= 2.5) {
        const revealed2m = st >= 3.5;
        nodes.push(txt('Start 08:58', -860, 10, 26, ROLE.focus, 'mono', 'left'));
        if (revealed2m) {
          nodes.push(...drawChain(-120, 10, { showEndpoint: true, alpha: 1 }));
        } else {
          // Only show up to 09:00 (Node + Image done) while asking the viewer!
          nodes.push(
            ...drawChain(-120, 10, { showEndpoint: false, alpha: 0.9, clipAt: -3 }),
            txt('???', secX(45), 10, 30, ROLE.predict, 'mono').glow(8, ROLE.predict).opacity(blink),
          );
        }
      }

      // Row 3: 4-minute lead (08:56 = -240s -> -33s). Withhold endpoint during prediction!
      if (st >= 4.5) {
        const revealed4m = st >= 5.5;
        nodes.push(txt('Start 08:56', -860, 155, 26, ROLE.warm, 'mono', 'left'));
        if (revealed4m) {
          nodes.push(...drawChain(-240, 155, { showEndpoint: true, alpha: 1 }));
        } else {
          nodes.push(
            ...drawChain(-240, 155, { showEndpoint: false, alpha: 0.9, clipAt: -120 }),
            txt('???', secX(-60), 155, 30, ROLE.predict, 'mono')
              .glow(8, ROLE.predict)
              .opacity(blink),
          );
        }
      }

      // Bottom verdict / prediction prompt
      if (st >= 2.5 && st < 3.5) {
        nodes.push(
          txt(
            'PREDICT: Started at 08:58 (-120 s) -> ready before 09:00:30?',
            0,
            392,
            30,
            ROLE.predict,
            'sans',
          )
            .glow(8, ROLE.predict)
            .opacity(blink),
        );
      } else if (st >= 3.5 && st < 4.5) {
        nodes.push(
          txt('READY AT +87 s -> MISSES 30 s GATE BY 57 s', 0, 392, 30, ROLE.expired, 'mono').glow(
            8,
            ROLE.expired,
          ),
        );
      } else if (st >= 4.5 && st < 5.5) {
        nodes.push(
          txt(
            'PREDICT: Started at 08:56 (-240 s) -> where does warmup finish?',
            0,
            392,
            30,
            ROLE.predict,
            'sans',
          )
            .glow(8, ROLE.predict)
            .opacity(blink),
        );
      } else if (st >= 5.5) {
        nodes.push(
          txt(
            'READY 33 s EARLY  ·  Measure fleet-wide concurrent starts, not summed percentiles',
            0,
            392,
            26,
            ROLE.warm,
            'sans',
          ).glow(6, ROLE.warm),
        );
      } else {
        nodes.push(
          txt(
            'Node 95s + Image 22s + Weights 78s + Warmup 12s = 207 s serial startup',
            0,
            392,
            28,
            COSMOS.muted,
            'mono',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 7.0, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'startup-chain', step, 1, 0.35);
  tweenOn(s, c, 'ready-boundary', step, 2, 0.3, { after: true });
  tweenOn(s, c, 'two-minute-lead', step, 3, 0.3); // Question 1
  tweenOn(s, c, 'late-readiness', step, 4, 0.3, { after: true });
  tweenOn(s, c, 'four-minute-lead', step, 5, 0.3); // Question 2
  tweenOn(s, c, 'ready-margin', step, 6, 0.3, { after: true });
}
