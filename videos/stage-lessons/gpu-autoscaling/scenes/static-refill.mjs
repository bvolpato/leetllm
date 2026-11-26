// Scene 07: static-refill - Who gets the short reply's slot?
// Dual decode step grids for replies [8, 2, 5, 3] on 2 slots:
// Static batch (13 steps, 8 empty slot-steps) vs Continuous batching (10 steps, 2 empty slot-steps).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function staticRefill(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=pair1(8,2), 2=static-wait, 3=static-last-pair, 4=cont-refill, 5=static-count, 6=cont-count, 7=orca

  const header = cinemaHeader('ITERATION-LEVEL SCHEDULING', 'Who gets the short', 'replys slot?', {
    x: -860,
    y: -420,
    accent: ROLE.active,
    size: 52,
  });

  const bgAura = aura(150, 70, 660, '#5ce1e61c', '#6ee7b71a');

  const reqColors = {
    R1: ROLE.active,
    R2: ROLE.focus,
    R3: ROLE.decode,
    R4: ROLE.warm,
  };

  function drawSchedule(rows, makespan, yTop, showFromIdx, showEmpty, cellW, xStart, alpha = 1) {
    const out = [];
    const h = 58;
    const gapY = 74;
    for (let slot = 0; slot < 2; slot++) {
      const y = yTop + slot * gapY;
      out.push(txt(`S${slot + 1}`, xStart - 54, y, 26, COSMOS.muted, 'mono').opacity(alpha));
      for (let t = 0; t < makespan; t++) {
        const cx = xStart + t * (cellW + 8) + cellW * 0.5;
        const owner = rows.find((r) => r.slot === slot && t >= r.start && t < r.end);
        const idx = owner ? Number(owner.id.slice(1)) : 99;
        if (owner && idx <= showFromIdx) {
          const col = reqColors[owner.id];
          out.push(
            rect(cellW, h, { fill: '#122138', stroke: col, width: 2.2, radius: 8 })
              .at(cx, y)
              .glow(5, col)
              .opacity(alpha),
            txt(owner.id, cx, y, 26, col, 'mono').opacity(alpha),
          );
        } else if (showEmpty && !owner) {
          out.push(
            rect(cellW, h, {
              fill: '#261220',
              stroke: ROLE.expired,
              width: 2.0,
              radius: 8,
              dash: [5, 5],
            })
              .at(cx, y)
              .opacity(0.85 * alpha),
          );
        }
      }
    }
    return out;
  }

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const xStart = -660;
      const cellW = 84;
      const nodes = [
        txt(
          '4 REPLIES:  R1=8  ·  R2=2  ·  R3=5  ·  R4=3 steps',
          860,
          -355,
          26,
          COSMOS.muted,
          'mono',
          'right',
        ),
      ];

      // Upper: Static Batching (13 steps, 8 empty)
      const statMaxReq = st >= 2.5 ? 4 : 2;
      const statMakespan = st >= 2.5 ? DATA.staticRefill.makespan : 8;
      nodes.push(
        txt('STATIC BATCHING', -714, -188, 26, ROLE.expired, 'mono', 'left'),
        ...drawSchedule(
          DATA.staticRefill.rows,
          statMakespan,
          -118,
          statMaxReq,
          st >= 1.5,
          cellW,
          xStart,
          1,
        ),
      );
      if (st >= 4.5) {
        nodes.push(
          txt(
            `Static: ${DATA.staticRefill.makespan} steps · ${DATA.staticRefill.empty} empty`,
            860,
            -188,
            28,
            ROLE.expired,
            'mono',
            'right',
          ).glow(6, ROLE.expired),
        );
      }

      // Lower: Continuous Batching (10 steps, 2 empty)
      if (st >= 3.5) {
        const cA = Math.min(1, (st - 3.5) * 2.5);
        nodes.push(
          txt('CONTINUOUS BATCHING (REFILL AT STEP 2)', -714, 118, 26, ROLE.warm, 'mono', 'left')
            .glow(6, ROLE.warm)
            .opacity(cA),
          ...drawSchedule(
            DATA.contRefill.rows,
            DATA.contRefill.makespan,
            188,
            4,
            true,
            cellW,
            xStart,
            cA,
          ),
          // Glowing horizontal refill rail strictly underneath Slot 2 starting at step 2
          beamWithPhotons(
            [
              [xStart + 2 * (cellW + 8), 305],
              [xStart + 7 * (cellW + 8), 305],
            ],
            ROLE.focus,
            p * 1.1,
            { width: 3.6, glow: 10, photonCount: 2, alpha: cA },
          ),
        );
      }
      if (st >= 5.5) {
        nodes.push(
          txt(
            `Continuous: ${DATA.contRefill.makespan} steps · ${DATA.contRefill.empty} empty`,
            860,
            118,
            28,
            ROLE.warm,
            'mono',
            'right',
          ).glow(7, ROLE.warm),
        );
      }

      // Step numbers along bottom (shifted below refill rail)
      for (let t = 1; t <= 13; t += 2) {
        nodes.push(
          txt(`${t}`, xStart + (t - 1) * (cellW + 8) + cellW * 0.5, 344, 26, COSMOS.dim, 'mono'),
        );
      }

      // Beat 2 note (Orca + budgets)
      if (st >= 6.5) {
        nodes.push(
          txt(
            'Orca iteration scheduling + token budget, KV space & admission policy',
            0,
            405,
            28,
            ROLE.active,
            'sans',
          ).glow(5, ROLE.active),
        );
      } else {
        nodes.push(
          txt(
            st >= 1.5 && st < 3.5
              ? 'Slot 2 sits idle for 6 steps waiting for R1 to finish'
              : 'Each column is one decode step on the GPU',
            0,
            405,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-static-refill-b0', step, 1, 0.3);
  tweenOn(s, c, 'static-wait', step, 2, 0.3);
  tweenOn(s, c, 'static-last-pair', step, 3, 0.3);
  tweenOn(s, c, 'ga-static-refill-b1', step, 4, 0.35);
  tweenOn(s, c, 'ga-static-count', step, 5, 0.3);
  tweenOn(s, c, 'ga-continuous-count', step, 6, 0.3);
  tweenOn(s, c, 'ga-static-refill-b2', step, 7, 0.35);
}
