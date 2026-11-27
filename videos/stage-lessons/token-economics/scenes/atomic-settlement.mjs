// Scene 23: atomic-settlement - What can the second call spend?
// Shared $0.01600 account balance bar splitting atomically into Spent / Held / Free.
// Beat 0 `claim-balance`: A atomically reserves $0.01000 -> $0.00600 free (B waits).
// Beat 1 `settle-usage`: A settles at $0.00457 -> $0.01143 free (B can reserve $0.01000).
// Beat 2 `unresolved-charge`: Parallel timeout lane keeps A's $0.01000 held -> B still sees $0.00600.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  conciseMicro,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  reservationTransition,
  txt,
  usd,
} from '../parts.mjs';

export default function atomicSettlement(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = atomic claim (beat 0), 1 = settled vs timeout comparison (beats 1-2)
  const claimed = s.value(0); // `claim-balance`
  const settled = s.value(0); // `settle-usage`
  const timedOut = s.value(0); // `unresolved-charge`

  const balance = 16000; // $0.01600
  const reserve = 10000; // $0.01000

  const header = cinemaHeader('ATOMIC BUDGET LEDGER', 'Reserve atomically,', 'settle on receipt', {
    x: -860,
    y: -415,
    accent: ROLE.held,
    size: 52,
  });

  const sceneAura = aura(0, 50, 720, '#fb923c20', '#6ee7b71a');

  function renderAccountBar(y, title, r, status, statusColor, a) {
    const barX = -840;
    const barW = 1680;
    const nodes = [txt(title, barX, y - 74, 32, COSMOS.ink, 'sans', 'left').opacity(a)];

    const segs = [
      { name: 'Spent', amount: r.spent, fill: '#351324', stroke: ROLE.output },
      { name: 'Held', amount: r.held, fill: '#3b2810', stroke: ROLE.held },
      { name: 'Free', amount: r.free, fill: '#0e2b3d', stroke: ROLE.input },
    ];

    let cursor = barX;
    for (const seg of segs) {
      if (seg.amount <= 0) continue;
      const w = (seg.amount / balance) * barW;
      nodes.push(
        rect(w - 6, 76, { fill: seg.fill, stroke: seg.stroke, width: 2.6, radius: 10 })
          .at(cursor + w * 0.5, y + 12)
          .glow(8, seg.stroke)
          .opacity(a),
        txt(
          `${seg.name} ${usd(seg.amount, 5)}`,
          cursor + w * 0.5,
          y + 12,
          30,
          seg.stroke,
          'mono',
        ).opacity(a),
      );
      cursor += w;
    }

    if (status) {
      nodes.push(txt(status, barX, y + 90, 28, statusColor, 'mono', 'left').opacity(a));
    }
    return group(...nodes);
  }

  // Mode 0: Concurrent Arrival A & B on $0.01600 account
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const isClaimed = claimed.value > 0.5;
      const r = isClaimed
        ? reservationTransition(balance, reserve, 'pending', 0)
        : { free: balance, held: 0, spent: 0 };

      return group(
        txt(
          'Calls A & B arrive together  ·  each needs $0.01000',
          -840,
          -185,
          32,
          ROLE.cached,
          'sans',
          'left',
        ).opacity(a),
        renderAccountBar(
          45,
          'Shared account balance: $0.01600',
          r,
          isClaimed
            ? 'Atomic claim holds $0.01000 for A  ·  B sees $0.00600 free (cannot start)'
            : 'Race condition hazard: two separate checks would both see $0.01600',
          isClaimed ? ROLE.held : ROLE.fail,
          a,
        ),
        txt(
          'Single atomic check-and-reserve prevents double-spending the shared balance',
          -840,
          345,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );
    },
  );

  // Mode 1: Settled Receipt (top) vs Unresolved Local Timeout (bottom)
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const isSettled = settled.value > 0.5;
      const isTimeout = timedOut.value > 0.5;

      const rTop = reservationTransition(
        balance,
        reserve,
        isSettled ? 'settled' : 'pending',
        conciseMicro,
      );
      const rBot = reservationTransition(balance, reserve, 'timeout', 0);

      return group(
        renderAccountBar(
          -105,
          isSettled ? 'Case 1: A returns warm receipt ($0.00457)' : 'Case 1: A pending receipt',
          rTop,
          isSettled
            ? 'Unused $0.00543 released  ->  $0.01143 free  ->  Call B CAN START'
            : 'Waiting to settle actual usage...',
          isSettled ? ROLE.ok : COSMOS.muted,
          a,
        ),
        renderAccountBar(
          215,
          isTimeout
            ? 'Case 2: A times out locally (no usage receipt)'
            : 'Case 2: Same starting balance before receipt arrives',
          rBot,
          isTimeout
            ? 'Keep $0.01000 held until reconciled  ->  B still sees only $0.00600'
            : 'Reserved cent stays locked to Attempt A',
          isTimeout ? ROLE.fail : COSMOS.muted,
          a,
        ),
        txt(
          'Retries & fallbacks must claim from the same atomic account balance',
          -840,
          405,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );
    },
  );

  s.add(sceneAura, header, mode0, mode1);

  c.on('claim-balance', () => {
    const t = c.cue('claim-balance').start;
    s.play(claimed.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('settle-usage', () => {
    const t = c.cue('settle-usage').start;
    s.play(settled.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('unresolved-charge', () => {
    const t = c.cue('unresolved-charge').start;
    s.play(timedOut.to(1, { duration: clampDur(c, t, 0.5) }));
  });
}
