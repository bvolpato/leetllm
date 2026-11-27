// Scene 19: work-cost - Charge bounded work rather than counting requests
// Beat 0: Connects 3-round DRR (12:6 work = 2:1 vs 4:6 chunks = 2:3).
// Beat 1: Equal nominal token count (8 tiles) -> vastly different GPU work (prefill vs decode).
// Beat 2: Backlogged credit carry vs explicit idle-reset policy + bounded wait guarantees.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  deficit,
  glowMeter,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

const DRR3 = deficit(3);

export default function workCost(s, c) {
  const b0On = s.value(0);
  const workOn = s.value(0);
  const chunksOn = s.value(0);
  const ratioOn = s.value(0);
  const b1On = s.value(0);
  const b2On = s.value(0);
  const policyOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#60a5fa1a', '#ff6b8b14');
  const header = cinemaHeader(
    'CALIBRATED WORK-COST SCHEDULING',
    'Charge bounded work rather',
    'than counting requests',
    { x: -860, y: -450, accent: ROLE.focus, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const wOk = workOn.value > 0.5;
      const chOk = chunksOn.value > 0.5;
      const rOk = ratioOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const b2 = b2On.value > 0.5;
      const pol = policyOn.value > 0.5;

      const nodes = [];

      if (!b1 && !b2) {
        // Beat 0: Reconnect 3-round DRR totals (12 vs 6 work, 4 vs 6 chunks)
        const rows = [
          { tenant: 'A', col: ROLE.A, y: -115 },
          { tenant: 'B', col: ROLE.B, y: 120 },
        ];
        rows.forEach(({ tenant, col, y }) => {
          const w = DRR3.served[tenant];
          const j = DRR3.jobs[tenant];
          nodes.push(
            txt(`TENANT ${tenant}`, -840, y - 40, 32, col, 'mono', 'left'),
            txt('3-ROUND CHARGED WORK', -560, y - 55, 26, COSMOS.muted, 'mono', 'left'),
            glowMeter(-560, y, 960, 48, wOk ? w / 12 : 0.08, { fill: col }),
            txt(wOk ? `${w} work units` : '...', 440, y, 32, col, 'mono', 'left'),
          );
          if (chOk) {
            for (let k = 0; k < j; k++) {
              const cx = -500 + k * 145;
              nodes.push(
                rect(124, 54, { fill: '#0c1528', stroke: col, width: 2.4, radius: 10 })
                  .at(cx, y + 72)
                  .glow(5, col),
                txt(`${tenant}-${k + 1}`, cx, y + 72, 26, col, 'mono', 'center'),
              );
            }
          }
        });

        nodes.push(
          rect(1660, 96, {
            fill: rOk ? '#0b201b' : '#0b1224',
            stroke: rOk ? ROLE.ok : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(0, 358)
            .glow(rOk ? 9 : 0, ROLE.ok),
          txt(
            rOk
              ? 'WORK SHARE 12 : 6 (2 : 1)   !=   CHUNK COUNT 4 : 6 (2 : 3)'
              : 'Equal request counts were never the scheduling promise.',
            0,
            358,
            30,
            rOk ? ROLE.ok : COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Equal nominal token count (8 tokens each) -> different real GPU cost!
        nodes.push(
          rect(900, 76, { fill: '#19150b', stroke: ROLE.focus, width: 2.6, radius: 14 }).at(
            395,
            -395,
          ),
          txt(
            'EQUAL NOMINAL TOKENS  !=  EQUAL GPU WORK',
            395,
            -395,
            26,
            ROLE.focus,
            'mono',
            'center',
          ),
        );

        const panels = [
          {
            title: 'LONG-CONTEXT PREFILL',
            sub: 'Quadratic attention + cache miss',
            cx: -445,
            col: ROLE.A,
            workFrac: 0.9,
            workLabel: 'High measured GPU work',
            fanLines: 6,
          },
          {
            title: 'SHORT-CONTEXT DECODE',
            sub: 'Bandwidth-bound + prefix cache hit',
            cx: 445,
            col: ROLE.B,
            workFrac: 0.28,
            workLabel: 'Lower measured GPU work',
            fanLines: 2,
          },
        ];

        panels.forEach((pn) => {
          nodes.push(
            rect(780, 520, { fill: '#0b1224', stroke: pn.col, width: 2.8, radius: 18 }).at(
              pn.cx,
              55,
            ),
            txt(pn.title, pn.cx, -152, 30, pn.col, 'mono', 'center'),
            txt(pn.sub, pn.cx, -108, 26, COSMOS.muted, 'sans', 'center'),
            txt('NOMINAL TOKENS: 8', pn.cx - 335, -42, 26, COSMOS.muted, 'mono', 'left'),
          );
          // 8 identical nominal token squares on both sides
          for (let j = 0; j < 8; j++) {
            nodes.push(
              rect(68, 52, { fill: pn.col, stroke: null, radius: 6 }).at(pn.cx - 300 + j * 86, 18),
            );
          }
          // Attention/compute fan lines
          for (let j = 0; j < pn.fanLines; j++) {
            const xA = pn.cx - 260 + j * 95;
            nodes.push(
              line([xA, 78], [pn.cx + 220, 152], { stroke: pn.col, width: 3 }).glow(5, pn.col),
            );
          }
          nodes.push(
            txt('CALIBRATED COST MODEL', pn.cx - 335, 198, 26, ROLE.focus, 'mono', 'left'),
            glowMeter(pn.cx - 335, 248, 670, 38, pn.workFrac, { fill: pn.col }),
            txt(pn.workLabel, pn.cx, 294, 26, COSMOS.ink, 'sans', 'center'),
          );
        });

        nodes.push(
          txt(
            'Calibrate scheduling cost estimates against measured GPU latency and batch interference.',
            0,
            408,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: Credit carry, idle reset, bounded wait & explicit overload rejection
        nodes.push(
          rect(780, 175, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(-440, -110)
            .glow(pol ? 9 : 4, ROLE.A),
          txt('BACKLOGGED TENANT', -440, -152, 28, ROLE.A, 'mono', 'center'),
          txt('Carry leftover credit across rounds', -440, -102, 28, COSMOS.ink, 'sans', 'center'),
          txt('Bound each dispatch chunk size', -440, -58, 26, COSMOS.muted, 'sans', 'center'),

          rect(780, 175, { fill: '#1f101a', stroke: ROLE.B, width: 2.8, radius: 16 })
            .at(440, -110)
            .glow(pol ? 9 : 4, ROLE.B),
          txt('IDLE TRANSITION', 440, -152, 28, ROLE.B, 'mono', 'center'),
          txt('Apply declared credit reset policy', 440, -102, 28, COSMOS.ink, 'sans', 'center'),
          txt('Prevent hoarding bursts after idle', 440, -58, 26, COSMOS.muted, 'sans', 'center'),
        );

        // Waiting lower-tier queue strip
        for (let j = 0; j < 6; j++) {
          const wx = -690 + j * 276;
          nodes.push(
            rect(236, 86, {
              fill: '#0d1528',
              stroke: j === 0 ? ROLE.warn : '#33466e',
              width: 2.4,
              radius: 12,
            }).at(wx, 128),
            txt(
              `Queued #${j + 1}`,
              wx,
              128,
              26,
              j === 0 ? ROLE.warn : COSMOS.muted,
              'mono',
              'center',
            ),
          );
        }

        nodes.push(
          rect(1660, 128, { fill: '#24101a', stroke: ROLE.fail, width: 2.8, radius: 16 })
            .at(0, 320)
            .glow(8, ROLE.fail),
          txt(
            'A 3-ROUND AVERAGE GIVES NO MAXIMUM-WAIT GUARANTEE',
            0,
            294,
            28,
            ROLE.fail,
            'mono',
            'center',
          ),
          txt(
            'Add aging, reserved lower-tier share, and explicit load shedding instead of impossible SLAs.',
            0,
            344,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-work-cost-b0', b0On, 1);
  stepAfter(s, c, 'mt-work-cost-s0-1', workOn, 1);
  stepAfter(s, c, 'mt-work-cost-s0-2', chunksOn, 1);
  stepAfter(s, c, 'mt-work-cost-s0-3', ratioOn, 1);
  stepOn(s, c, 'mt-work-cost-b1', b1On, 1);
  stepOn(s, c, 'mt-work-cost-b2', b2On, 1);
  stepAfter(s, c, 'mt-work-cost-s2-0', policyOn, 1);
}
