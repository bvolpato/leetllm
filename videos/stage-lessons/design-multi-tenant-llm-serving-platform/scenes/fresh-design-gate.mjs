// Scene 31: fresh-design-gate - Admit a new request for C
// Transfer problem for Workspace C (request 9, attempt 2): 1,500 allowance, 240 input + 360 cap, 16-slot pages.
// Strict prediction withholding on EVERY reveal:
//   - Beat 1: hold 600 / leave 900 (`s1-0`), 37 pages = 592 (`fresh-thirty-seven`), 38 pages + 8 spare (`s1-2`).
//   - Beat 2: ACK missing (`s2-0`), usage 90 output (`s2-2`), read pending -> asks "Can we release either?"
//   - Beat 3: keep both (`fresh-keep-both`), retired (`retired`), settle 330 (`s3-0`),
//             return 270 / 1170 avail (`s3-1`), duplicate leaves 1170 unchanged (`s3-2`).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function freshDesignGate(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const b1On = s.value(0);
  const hold600On = s.value(0);
  const pages37On = s.value(0);
  const pages38On = s.value(0);
  const b2On = s.value(0);
  const ackLostOn = s.value(0);
  const receipt90On = s.value(0);
  const b3On = s.value(0);
  const keepBothOn = s.value(0);
  const retiredOn = s.value(0);
  const settle330On = s.value(0);
  const return270On = s.value(0);
  const replayOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#a78bfa1c', '#ffd16616');
  const header = cinemaHeader(
    'END-TO-END ADMISSION & RECOVERY TRANSFER',
    'Admit a new request for C',
    null,
    { x: -860, y: -455, accent: ROLE.C, size: 48 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const held600 = hold600On.value > 0.5;
      const p37 = pages37On.value > 0.5;
      const p38 = pages38On.value > 0.5;
      const ackLost = ackLostOn.value > 0.5;
      const rec90 = receipt90On.value > 0.5;
      const keepBoth = keepBothOn.value > 0.5;
      const ret = retiredOn.value > 0.5;
      const set330 = settle330On.value > 0.5;
      const ret270 = return270On.value > 0.5;
      const rep = replayOn.value > 0.5;

      // Exact conserved ledger state for Workspace C (total = 1,500)
      const settled = ret270 ? 330 : 0;
      const held = ret270 ? 0 : held600 ? 600 : 0;
      const available = 1500 - held - settled;

      const nodes = [];

      // Request spec pill top right
      nodes.push(
        rect(930, 82, { fill: '#120f26', stroke: ROLE.C, width: 2.8, radius: 14 })
          .at(380, -405)
          .glow(7, ROLE.C),
        txt(
          'C / req 9 / att 2 · 240 in + 360 cap (16/pg)',
          380,
          -405,
          26,
          ROLE.C,
          'mono',
          'center',
        ),
      );

      // Left half: Fixed-period 1,500-unit quota ledger
      nodes.push(
        rect(790, 445, { fill: '#0b1224', stroke: ROLE.A, width: 2.8, radius: 18 }).at(-445, -18),
        txt('PERIOD ALLOWANCE (1,500 UNITS)', -805, -196, 28, ROLE.A, 'mono', 'left'),
      );

      // Horizontal conservation bar inside left panel
      const barLeft = -805;
      const barW = 720;
      const barY = -98;
      nodes.push(
        rect(barW, 58, { fill: '#0c1528', stroke: '#2c3d66', width: 2, radius: 8 }).at(
          barLeft + barW * 0.5,
          barY,
        ),
      );
      let cursor = barLeft + 3;
      const innerW = barW - 6;
      for (const [val, col] of [
        [available, '#4c618a'],
        [held, ROLE.held],
        [settled, ROLE.ok],
      ]) {
        if (val <= 0) continue;
        const w = Math.max(6, (innerW * val) / 1500);
        nodes.push(
          rect(w - 2, 50, { fill: col, stroke: null, radius: 6 }).at(cursor + w * 0.5, barY),
        );
        cursor += w;
      }

      // 3 numeric counters inside left panel
      [
        ['AVAILABLE', available, COSMOS.ink, -695],
        ['HELD', held, ROLE.held, -445],
        ['SETTLED', settled, ROLE.ok, -195],
      ].forEach(([lbl, val, col, cx]) => {
        nodes.push(
          txt(lbl, cx, 12, 26, COSMOS.muted, 'mono', 'center'),
          txt(val.toLocaleString('en-US'), cx, 72, 46, col, 'mono', 'center').glow(6, col),
        );
      });

      nodes.push(
        txt(
          `${available} + ${held} + ${settled} = 1,500`,
          -445,
          158,
          28,
          ROLE.ok,
          'mono',
          'center',
        ),
      );

      // Right half: Worker whole-page reservation (16 positions/page -> 38 tiles in 10x4 grid)
      nodes.push(
        rect(820, 445, { fill: '#0b1224', stroke: ROLE.B, width: 2.8, radius: 18 }).at(430, -18),
        txt('WORKER KV PAGES (16 SLOTS / PAGE)', 60, -196, 28, ROLE.B, 'mono', 'left'),
      );

      if (p37 || p38) {
        const count = p38 ? 38 : 37;
        for (let i = 0; i < count; i++) {
          const tx = 96 + (i % 10) * 74;
          const ty = -114 + Math.floor(i / 10) * 58;
          const usedPos = Math.min(16, 600 - i * 16);
          const isInput = i * 16 < 240;
          nodes.push(
            rect(62, 42, {
              fill: '#0b1426',
              stroke: ret ? ROLE.free : '#3c507a',
              width: 1.8,
              radius: 5,
            }).at(tx, ty),
          );
          if (!ret) {
            const fillW = Math.max(8, (56 * usedPos) / 16);
            const col = isInput ? ROLE.A : ROLE.held;
            nodes.push(
              rect(fillW, 34, { fill: col, stroke: null, radius: 3 }).at(tx - 28 + fillW * 0.5, ty),
            );
          }
        }
        const pageFooter = !p38
          ? '37 pages = 592 positions (8 short!)'
          : ret
            ? '38 pages RELEASED to worker pool'
            : '38 pages reserved · 8 spare slots belong to C';
        nodes.push(
          txt(
            pageFooter,
            430,
            158,
            28,
            ret ? ROLE.free : p38 ? ROLE.ok : ROLE.warn,
            'mono',
            'center',
          ),
        );
      } else {
        nodes.push(
          txt(
            held600 ? '600 positions ÷ 16 = ?' : 'How many whole pages?',
            430,
            -25,
            38,
            ROLE.focus,
            'mono',
            'center',
          ),
          txt('Each tile = 16 token positions', 430, 42, 26, COSMOS.muted, 'sans', 'center'),
        );
      }

      // Evidence strip when ACK is lost / usage 90 arrives
      if (rec90 && !ret) {
        nodes.push(
          rect(1660, 74, { fill: '#221a0b', stroke: ROLE.held, width: 2.6, radius: 12 }).at(0, 275),
          txt(
            'ACK MISSING  ·  TRUSTED RECEIPT: 90 OUTPUT TOKENS  ·  LAST DEVICE READ: PENDING',
            0,
            275,
            27,
            ROLE.held,
            'mono',
            'center',
          ),
        );
      }

      // Context-sensitive bottom teaching line (strictly following every spoken cue!)
      let status =
        'How many allowance units must C hold, and how many whole pages must the worker find?';
      let sCol = ROLE.focus;
      if (rep) {
        status = 'Second delivery for attempt 2: balance stays unchanged at 1,170 available.';
        sCol = ROLE.ok;
      } else if (ret270) {
        status =
          'Returned 270 unused units -> 1,170 available. Settlement conserved all 1,500 units.';
        sCol = ROLE.ok;
      } else if (set330) {
        status = 'With receipt + retirement: settle 240 input + 90 output = 330 units.';
        sCol = ROLE.shared;
      } else if (ret) {
        status = 'Last device read finished & attempt 2 retired -> 38 pages safely released.';
        sCol = ROLE.ok;
      } else if (keepBoth) {
        status = 'Keep BOTH reservations (600 units held & 38 pages pinned) until device retires.';
        sCol = ROLE.held;
      } else if (rec90) {
        status =
          'Usage receipt reports 90 output, but a device read is pending. Can we release either?';
        sCol = ROLE.focus;
      } else if (ackLost) {
        status =
          'Dispatch acknowledgement went missing; keep req 9 / attempt 2 on the reservation.';
        sCol = ROLE.warn;
      } else if (p38) {
        status =
          'Reserve 38 whole pages (608 slots); the 8 spare slots on page 38 stay owned by C.';
        sCol = ROLE.ok;
      } else if (p37) {
        status = '37 pages hold only 592 positions; C needs 8 positions on a 38th page.';
        sCol = ROLE.warn;
      } else if (held600) {
        status = 'Hold 600 units (240 + 360) and leave 900 available.';
        sCol = ROLE.ok;
      }

      nodes.push(txt(status, 0, 392, 30, sCol, 'sans', 'center'));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'mt-fresh-design-gate-b0', b0On, 1);
  stepOn(s, c, 'mt-fresh-design-gate-b1', b1On, 1);
  // Strict prediction withholding on Beat 1 answers!
  stepAfter(s, c, 'mt-fresh-design-gate-s1-0', hold600On, 1);
  stepAfter(s, c, 'fresh-thirty-seven', pages37On, 1);
  stepAfter(s, c, 'mt-fresh-design-gate-s1-2', pages38On, 1);
  stepOn(s, c, 'mt-fresh-design-gate-b2', b2On, 1);
  stepAfter(s, c, 'mt-fresh-design-gate-s2-0', ackLostOn, 1);
  stepAfter(s, c, 'mt-fresh-design-gate-s2-2', receipt90On, 1);
  stepOn(s, c, 'mt-fresh-design-gate-b3', b3On, 1);
  // Strict prediction withholding on Beat 3 recovery & settlement!
  stepAfter(s, c, 'fresh-keep-both', keepBothOn, 1);
  stepAfter(s, c, 'mt-fresh-design-gate-retired', retiredOn, 1);
  stepAfter(s, c, 'mt-fresh-design-gate-s3-0', settle330On, 1);
  stepAfter(s, c, 'mt-fresh-design-gate-s3-1', return270On, 1);
  stepAfter(s, c, 'mt-fresh-design-gate-s3-2', replayOn, 1);
}
