// Scene 17: fairness - How much work fits in A's next turn?
// Living Deficit Round-Robin (DRR) weighted fair-queuing token-bucket visualizer!
// A gets +4 credits/round (cost 3/chunk), B gets +2 credits/round (cost 1/chunk).
// Strictly pauses at round 2 with A's 2 saved credits during `fair-predict`, then runs round 3
// on `fair-round-three` and reveals 12:6 work units (2:1) vs 4:6 chunks (2:3).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  deficitPlayback,
  driftValue,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function fairness(s, c) {
  const pulse = s.value(0);
  const drrTime = s.value(0);
  const askOn = s.value(0);
  const done3On = s.value(0);

  const stageAura = aura(0, 20, 760, '#60a5fa1a', '#ffd16618');
  const header = cinemaHeader(
    'DEFICIT ROUND-ROBIN FAIR QUEUING',
    'How much work fits',
    'in A’s next turn?',
    { x: -860, y: -450, accent: ROLE.credit, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = drrTime.value;
      const st = deficitPlayback(t);
      const ask = askOn.value > 0.5;
      const done3 = done3On.value > 0.5;

      const nodes = [];

      // Round indicator pill at top right
      const roundNum = Math.min(3, Math.ceil(t));
      const roundLabel = done3
        ? 'AFTER 3 ROUNDS:  12 : 6 WORK (2 : 1)  ·  4 : 6 CHUNKS'
        : t >= 2 && ask
          ? 'ROUND 2 PAUSED:  A CARRIES 2 + ADDS 4 = 6 CREDITS'
          : roundNum === 0
            ? 'TWO BACKLOGGED TENANT QUEUES  ·  READY'
            : `DEFICIT ROUND ${roundNum} OF 3`;

      nodes.push(
        rect(910, 78, {
          fill: '#0d1528',
          stroke: done3 ? ROLE.ok : ROLE.credit,
          width: 2.8,
          radius: 14,
        })
          .at(385, -395)
          .glow(7, done3 ? ROLE.ok : ROLE.credit),
        txt(roundLabel, 385, -395, 26, done3 ? ROLE.ok : ROLE.credit, 'mono', 'center'),
      );

      // Column headers
      nodes.push(
        txt('TENANT QUEUE', -840, -238, 26, COSMOS.muted, 'mono', 'left'),
        txt('CREDIT BUCKET', -340, -238, 26, COSMOS.muted, 'mono', 'center'),
        txt(
          'WORK SERVED  (WIDTH = WORK  ·  SEAMS = CHUNKS)',
          -100,
          -238,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );

      const unitPx = 76; // 12 units = 912 px (fits cleanly from x=-100 to x=812)
      const rows = [
        { tenant: 'A', grant: 4, cost: 3, col: ROLE.A, y: -88 },
        { tenant: 'B', grant: 2, cost: 1, col: ROLE.B, y: 162 },
      ];

      rows.forEach(({ tenant, grant, cost, col, y }) => {
        const credit = st.credit[tenant];
        const served = st.served[tenant];
        const jobs = st.jobs[tenant];

        // Queue spec card
        nodes.push(
          rect(350, 150, { fill: '#0b1224', stroke: col, width: 2.8, radius: 16 })
            .at(-665, y)
            .glow(6, col),
          txt(`Tenant ${tenant}`, -805, y - 34, 34, col, 'mono', 'left'),
          txt(`+${grant} credits / round`, -805, y + 12, 26, COSMOS.ink, 'mono', 'left'),
          txt(
            `Chunk cost: ${cost} ${cost === 1 ? 'unit' : 'units'}`,
            -805,
            y + 48,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),

          // Credit bucket gauge
          rect(190, 150, {
            fill: '#17140c',
            stroke: credit > 0 ? ROLE.credit : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(-340, y)
            .glow(credit > 0 ? 9 : 2, ROLE.credit),
          txt(
            String(credit),
            -340,
            y - 10,
            56,
            credit > 0 ? ROLE.credit : COSMOS.muted,
            'mono',
            'center',
          ),
          txt('credit left', -340, y + 46, 26, COSMOS.muted, 'sans', 'center'),

          // Base work ruler track
          line([-100, y + 54], [820, y + 54], { stroke: '#33466e', width: 2.5 }),
        );

        // Completed work chunks (block width = cost * unitPx)
        for (let i = 0; i < jobs; i++) {
          const bx = -100 + i * cost * unitPx;
          const bw = cost * unitPx - 8;
          nodes.push(
            rect(bw, 88, { fill: col, stroke: '#ffffff44', width: 1.5, radius: 8 })
              .at(bx + bw * 0.5, y - 8)
              .glow(7, col),
            txt(String(cost), bx + bw * 0.5, y - 8, 32, COSMOS.bg, 'mono', 'center'),
          );
        }

        // Active filling chunk while DRR executes a round
        if (st.active?.tenant === tenant) {
          const bx = -100 + jobs * cost * unitPx;
          const bw = cost * unitPx - 8;
          const fillW = Math.max(8, bw * st.active.progress);
          nodes.push(
            rect(bw, 88, { fill: '#0b1426', stroke: col, width: 2.4, radius: 8 }).at(
              bx + bw * 0.5,
              y - 8,
            ),
            rect(fillW, 82, { fill: col, stroke: null, radius: 6 })
              .at(bx + fillW * 0.5, y - 8)
              .glow(8, col),
          );
        }

        // Row totals readout
        nodes.push(
          txt(
            `${served} work units  ·  ${jobs} completed ${jobs === 1 ? 'chunk' : 'chunks'}`,
            -100,
            y + 94,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
        );
      });

      // Bottom narration-synced prompt / takeaway
      let note =
        'Both tenants stay backlogged. Watch leftover credit that cannot buy a whole chunk.';
      let noteCol = COSMOS.muted;
      if (t >= 0.99 && t < 1.99) {
        note = 'Round 1 complete: A buys 1 chunk (cost 3) and carries 1 leftover credit forward.';
        noteCol = ROLE.A;
      } else if (t >= 1.99 && t < 2.02) {
        note = ask
          ? 'Round 2 complete: A saved 2 credits and adds 4 on round 3. How many whole chunks fit?'
          : 'Round 2 complete: A buys 1 more chunk and now carries 2 credits forward.';
        noteCol = ROLE.focus;
      } else if (t >= 2.02 && !done3) {
        note = 'Round 3: A spends 6 credits (2 chunks) while B spends 2.';
        noteCol = ROLE.ok;
      } else if (done3) {
        note =
          'A : B = 12 : 6 work units (2 : 1 share)  ·  4 : 6 chunks. Next question: max wait for B?';
        noteCol = ROLE.ok;
      }
      nodes.push(txt(note, 0, 412, 30, noteCol, 'sans', 'center'));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  c.on('fair-round-one', () => {
    const q = c.cue('fair-round-one');
    s.play(drrTime.to(1, { duration: clampDur(c, q.start, Math.max(0.6, q.end - q.start)) }));
  });
  c.on('fair-round-two', () => {
    const q = c.cue('fair-round-two');
    s.play(drrTime.to(2, { duration: clampDur(c, q.start, Math.max(0.6, q.end - q.start)) }));
  });
  stepOn(s, c, 'fair-predict', askOn, 1);
  // Strict prediction withholding: do not start Round 3 until `fair-round-three`!
  c.on('fair-round-three', () => {
    const q = c.cue('fair-round-three');
    s.play(drrTime.to(3, { duration: clampDur(c, q.start, Math.max(0.7, q.end - q.start)) }));
  });
  stepAfter(s, c, 'fair-round-three', done3On, 1);
}
