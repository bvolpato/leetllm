// Scene 08: quota - Conserve allowance through reservation and settlement
// Living 1,000-unit ledger moving 700 units into Held, settling 420 actual units,
// releasing 280 unused units (580 available), and staying unchanged on duplicate completion delivery.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  buildLedgerNodes,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  playOn,
  quota,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function quotaScene(s, c) {
  const pulse = s.value(0);
  const reserveP = s.value(0);
  const conserveOn = s.value(0);
  const heldFocus = s.value(0);
  const settleP = s.value(0);
  const replayOn = s.value(0);

  const stageAura = aura(0, 40, 760, '#ffd1661c', '#6ee7b716');
  const header = cinemaHeader(
    'FIXED-PERIOD QUOTA LEDGER',
    'Conserve allowance through',
    'reservation and settlement',
    { x: -860, y: -450, accent: ROLE.held, size: 46 },
  );

  const qInit = quota(0);
  const qHeld = quota(1);
  const qDone = quota(2);

  const view = guardedDynamic(
    () => 1,
    () => {
      const r = reserveP.value;
      const st = settleP.value;
      const dup = replayOn.value > 0.5;
      const cons = conserveOn.value > 0.5;

      // Exact conservation at every single animation frame: available + held + settled === 1000
      const held = st > 0.01 ? Math.round(qHeld.held * (1 - st)) : Math.round(qHeld.held * r);
      const settled = Math.round(qDone.settled * st);
      const available = qInit.available - held - settled;

      const nodes = [];

      // Request A-1 receipt pill at top right
      const receiptColor = dup ? ROLE.focus : st > 0.98 ? ROLE.ok : ROLE.shared;
      const receiptLine1 =
        st > 0.02
          ? `A-1  ·  ACTUAL USAGE: 300 IN + 120 OUT = 420`
          : 'A-1  ·  RESERVE: 300 INPUT + 400 MAX OUTPUT = 700';
      const receiptLine2 = dup
        ? 'DELIVERY #2 (DUPLICATE)  ·  NO LEDGER CHANGE'
        : st > 0.5
          ? 'SETTLED ONCE  ·  UNUSED 280 UNITS RELEASED'
          : heldFocus.value > 0.5
            ? 'ALLOWANCE HELD PENDING TRUSTED COMPLETION'
            : 'ATOMIC CHECK-AND-UPDATE BEFORE DISPATCH';

      nodes.push(
        rect(930, 118, { fill: '#0c1528', stroke: receiptColor, width: 2.8, radius: 16 })
          .at(380, -378)
          .glow(7, receiptColor),
        txt(receiptLine1, 380, -404, 26, receiptColor, 'mono', 'center'),
        txt(receiptLine2, 380, -354, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Core conservation ledger bar
      nodes.push(
        ...buildLedgerNodes({
          available,
          held,
          settled,
          total: 1000,
          xLeft: -820,
          yBar: 95,
          width: 1640,
          height: 76,
          showEquation: true,
          equationY: 220,
        }),
      );

      // Three semantic stage cards along the bottom showing transition invariants
      const cards = [
        ['1. RESERVE BEFORE DISPATCH', '300 in + 400 cap = 700 held', r > 0.5, ROLE.held],
        ['2. TRUSTED SETTLEMENT', 'Charge 420 · release 280', st > 0.95, ROLE.ok],
        ['3. IDEMPOTENT REPLAY', 'Same key + receipt -> 580 stays', dup, ROLE.focus],
      ];
      cards.forEach(([title, sub, active, col], i) => {
        const cx = -555 + i * 555;
        nodes.push(
          rect(510, 118, {
            fill: '#0b1224',
            stroke: active ? col : '#263354',
            width: active ? 2.8 : 1.8,
            radius: 14,
          })
            .at(cx, 375)
            .glow(active ? 8 : 0, col),
          txt(title, cx, 348, 26, active ? col : COSMOS.muted, 'mono', 'center'),
          txt(sub, cx, 396, 26, active ? COSMOS.ink : COSMOS.dim, 'sans', 'center'),
        );
      });

      if (cons && st < 0.02) {
        nodes.push(
          txt(
            'Atomic check-and-update keeps two gateways from promising the same remaining 1,000.',
            0,
            -168,
            28,
            ROLE.focus,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0);

  playOn(s, c, 'quota-reserve-before-dispatch', reserveP, 1, 0.9);
  stepOn(s, c, 'quota-conserve-allowance', conserveOn, 1);
  stepOn(s, c, 'quota-into-held', heldFocus, 1);
  c.on('quota-trusted-completion', () => {
    s.play(settleP.to(1, { duration: clampDur(c, c.cue('quota-trusted-completion').start, 1.1) }));
  });
  stepAfter(s, c, 'quota-replay-unchanged', replayOn, 1);
}
