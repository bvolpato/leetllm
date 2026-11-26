// Scene 28: budget-reservation - Reserve capacity before another dispatch
// Dual admission gauges: Read pool (2 -> 1) & Write pool (1 -> 0 blocking 2nd write,
// timeout retains consumed attempt) beside an atomic token reservation meter where
// 120 input + 80 output = 200 exceeds the 150-token yellow threshold and halts pre-dispatch!
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function budgetReservation(s, c) {
  const pulse = s.value(0);
  const admitOn = s.value(0);
  const noWriteOn = s.value(0);
  const tokPhase = s.value(0);
  const block200On = s.value(0);
  const reportOn = s.value(0);

  const header = cinemaHeader(
    'PRE-DISPATCH BUDGET RESERVATION',
    'Reserve capacity before',
    'sending another call',
    { accent: ROLE.focus, size: 48 },
  );

  const stageAura = aura(160, 40, 620, '#ffd1661c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ad = admitOn.value;
      const nw = noWriteOn.value;
      const tk = tokPhase.value;
      const b2 = block200On.value;
      const rp = reportOn.value;
      const nodes = [];

      // Left: Read (2 slots) & Write (1 slot) Admission Pools
      const lx = -820;
      nodes.push(
        txt('ATTEMPT POOLS (HOST REGISTRY)', lx, -180, 26, ROLE.host, 'mono', 'left'),
        txt('READ POOL: 2 -> 1 LEFT', lx, -105, 28, ROLE.action, 'mono', 'left'),
        circle(48, { fill: ad > 0.35 ? '#1b2642' : ROLE.action, stroke: ROLE.action, width: 3 })
          .at(lx + 58, -28)
          .opacity(0.9),
        txt(
          ad > 0.35 ? 'USED' : 'R1',
          lx + 58,
          -28,
          26,
          ad > 0.35 ? COSMOS.dim : '#070910',
          'mono',
          'center',
        ),
        circle(48, { fill: ROLE.action, stroke: '#ffffff', width: 2.5 })
          .at(lx + 178, -28)
          .glow(8, ROLE.action),
        txt('R2', lx + 178, -28, 26, '#070910', 'mono', 'center'),

        txt(
          'WRITE POOL: 1 -> 0 LEFT',
          lx,
          68,
          28,
          nw > 0.35 ? ROLE.fail : ROLE.caution,
          'mono',
          'left',
        ),
        circle(48, {
          fill: ad > 0.35 ? '#1b2642' : ROLE.caution,
          stroke: nw > 0.35 ? ROLE.fail : ROLE.caution,
          width: 3,
        })
          .at(lx + 58, 148)
          .opacity(0.9),
        txt(
          ad > 0.35 ? 'USED' : 'W1',
          lx + 58,
          148,
          26,
          ad > 0.35 ? COSMOS.dim : '#070910',
          'mono',
          'center',
        ),
        txt(
          nw > 0.35 ? '2ND WRITE BLOCKED · TIMEOUT COUNTS' : 'Reserve at admission',
          lx + 130,
          148,
          26,
          nw > 0.35 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ).glow(nw > 0.35 ? 6 : 0, ROLE.fail),
      );

      // Right: Token Reservation Meter (0..220 tokens, yellow threshold line at 150)
      const rx = 120;
      const bw = 680;
      const scale = bw / 220;
      const mY = 20;
      const limX = rx + 150 * scale;
      const inW = 120 * scale * (0.35 + tk * 0.65);
      const outW = 80 * scale * (0.25 + b2 * 0.75);

      nodes.push(
        line([40, -195], [40, 235], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('ATOMIC TOKEN RESERVATION', rx, -180, 26, ROLE.focus, 'mono', 'left').opacity(
          0.45 + tk * 0.55,
        ),
        rect(bw, 66, { fill: '#0e1529', stroke: '#2d3f6b', width: 2.2, radius: 10 })
          .at(rx + bw * 0.5, mY)
          .opacity(0.9),
        // 120 input tokens (cyan)
        rect(inW, 56, { fill: ROLE.action, stroke: null, radius: 8 })
          .at(rx + 4 + inW * 0.5, mY)
          .opacity(0.88),
        // 80 output tokens (rose when exceeding 150!)
        rect(outW, 56, { fill: b2 > 0.35 ? ROLE.fail : ROLE.policy, stroke: null, radius: 8 })
          .at(rx + 4 + inW + outW * 0.5, mY)
          .glow(b2 > 0.35 ? 10 : 0, ROLE.fail)
          .opacity(0.88),
        // Yellow 150-token remaining ceiling line
        line([limX, mY - 72], [limX, mY + 72], { stroke: ROLE.focus, width: 4, dash: [8, 6] }).glow(
          10,
          ROLE.focus,
        ),
        txt('150 LEFT', limX, mY - 96, 26, ROLE.focus, 'mono', 'center').glow(6, ROLE.focus),
        txt(
          '120 in + 80 out = 200',
          rx + 300,
          mY + 95,
          28,
          b2 > 0.35 ? ROLE.fail : COSMOS.ink,
          'mono',
          'center',
        ).glow(b2 > 0.35 ? 8 : 0, ROLE.fail),
        txt(
          b2 > 0.35
            ? '200 > 150 -> CALL HELD BEFORE TRANSPORT'
            : 'Reserve input + max output atomically',
          rx + 300,
          mY + 148,
          26,
          b2 > 0.35 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom stop report rail
      nodes.push(
        line([-840, 290], [840, 290], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          rp > 0.35
            ? 'TRACK STEPS, TOKENS, TIME & WRITES SEPARATELY · REPORT LIMIT HIT + OPEN OPS'
            : 'Check permission first, then atomically reserve budget before dispatch',
          0,
          350,
          26,
          rp > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-budget-reservation-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-budget-reservation-0').start, 0.25) }));
  });
  c.on('budget-admit', () => {
    s.play(admitOn.to(1, { duration: clampDur(c, c.cue('budget-admit').start, 0.35) }));
  });
  c.on('budget-no-write', () => {
    s.play(noWriteOn.to(1, { duration: clampDur(c, c.cue('budget-no-write').start, 0.35) }));
  });
  c.on('aa-budget-reservation-1', () => {
    s.play(tokPhase.to(1, { duration: clampDur(c, c.cue('aa-budget-reservation-1').start, 0.35) }));
  });
  c.on('budget-twohundred', () => {
    s.play(block200On.to(1, { duration: clampDur(c, c.cue('budget-twohundred').start, 0.4) }));
  });
  c.on('aa-budget-reservation-2', () => {
    s.play(reportOn.to(1, { duration: clampDur(c, c.cue('aa-budget-reservation-2').start, 0.35) }));
  });
}
