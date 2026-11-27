// Scene 24: fresh-economics - Four receipts and two arrivals
// Mode 0 (beats 0-1): Fresh 4-attempt workload (X1 fail $0.002, X2 accept $0.003, Y1 abandoned $0.004, Z1 accept $0.005).
//   Prediction withheld on beat 0; `total-receipts` merges all 4 into $0.014 / 2 accepted = $0.007.
// Mode 1 (beats 2-4): Two $0.010 arrivals competing for $0.017 balance.
//   Prediction withheld on beat 2; `reserve-first` holds $0.010 leaving $0.007; `timeout` keeps $0.010 held.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_ATTEMPTS,
  FRESH_COST,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  priceMicroDollars,
  reservationTransition,
  txt,
  usd,
} from '../parts.mjs';

export default function freshEconomics(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = 4 receipts (beats 0-1), 1 = $0.017 arrivals (beats 2-4)
  const sumProg = s.value(0); // `total-receipts`
  const claimProg = s.value(0); // `reserve-first`
  const timeoutProg = s.value(0); // `timeout`

  const freeBal = 17000; // $0.017
  const reserve = priceMicroDollars(1600, 0, 400); // 10000 = $0.010

  const header = cinemaHeader('TRANSFER CHECK', 'Fresh receipts,', 'fresh arrivals', {
    x: -860,
    y: -415,
    accent: ROLE.ok,
    size: 52,
  });

  const sceneAura = aura(0, 50, 720, '#6ee7b71e', '#ffd16620');

  // Mode 0: Four Receipts -> Cost per Accepted Task
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const sp = sumProg.value;
      const included = Math.min(4, Math.floor(sp * 4 + 0.05));
      const nodes = [
        txt(
          'FOUR BILLED ATTEMPTS ACROSS TASKS X, Y, Z',
          -840,
          -195,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      ];

      FRESH_ATTEMPTS.forEach((r, idx) => {
        const cx = -630 + idx * 420;
        const col = r.accepted ? ROLE.ok : ROLE.fail;
        const fill = r.accepted ? '#0d2620' : '#351324';
        nodes.push(
          rect(370, 146, { fill, stroke: col, width: 2.6, radius: 14 })
            .at(cx, -65)
            .glow(8, col)
            .opacity(a),
          txt(`${r.id}  ·  ${r.outcome}`, cx, -92, 28, col, 'mono').opacity(a),
          txt(usd(r.costMicro, 3), cx, -32, 42, COSMOS.ink, 'mono').opacity(a),
        );
      });

      // Merged spend strip (ONLY grows on beat 1 `total-receipts`)
      if (sp > 0.02) {
        const barX = -815;
        const barW = 1630;
        let cursor = barX;
        FRESH_ATTEMPTS.slice(0, included).forEach((r) => {
          const w = (r.costMicro / FRESH_COST.spend) * barW;
          const col = r.accepted ? ROLE.ok : ROLE.fail;
          const fill = r.accepted ? '#0d2620' : '#351324';
          nodes.push(
            rect(w - 6, 72, { fill, stroke: col, width: 2.6, radius: 10 })
              .at(cursor + w * 0.5, 130)
              .glow(8, col)
              .opacity(a),
            txt(`${r.id} (${usd(r.costMicro, 3)})`, cursor + w * 0.5, 130, 26, col, 'mono').opacity(
              a,
            ),
          );
          cursor += w;
        });

        if (included === 4) {
          nodes.push(
            txt(
              `${usd(FRESH_COST.spend, 3)} total / 2 accepted tasks (X, Z) = ${usd(FRESH_COST.costPerAccepted, 3)} / accepted task`,
              0,
              275,
              34,
              ROLE.ok,
              'mono',
            )
              .glow(8, ROLE.ok)
              .opacity(a),
          );
        }
        nodes.push(
          txt(
            'If 0 tasks succeed, report spend and failures separately',
            0,
            355,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a),
        );
      } else {
        // Strict beat 0 prediction withholding
        nodes.push(
          txt('What did one accepted task cost?', 0, 200, 44, ROLE.cached, 'serif')
            .glow(7, ROLE.cached)
            .opacity(a),
          txt(
            'X retried · Y abandoned after failure · Z succeeded first try',
            0,
            285,
            28,
            COSMOS.muted,
            'sans',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: Two $0.010 Arrivals on $0.017 Account + Timeout Hold
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const cp = claimProg.value;
      const tp = timeoutProg.value;
      const claimed = cp > 0.5;
      const timedOut = tp > 0.5;
      const acc = reservationTransition(freeBal, reserve, timedOut ? 'timeout' : 'pending');

      const barX = -840;
      const barW = 1680;
      const heldW = (acc.held / freeBal) * barW * cp;
      const freeW = barW - heldW;

      const nodes = [
        txt(
          'TWO NEW ARRIVALS  ·  $0.017 ACCOUNT BALANCE',
          -840,
          -195,
          32,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Each call: 1,600 cold input ($0.004) + 400 cap ($0.006) = $0.010 reservation',
          -840,
          -130,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),

        // Balance bar (y = 20)
        rect(barW, 96, { fill: '#0e2b3d', stroke: ROLE.input, width: 2.6, radius: 12 })
          .at(0, 20)
          .glow(7, ROLE.input)
          .opacity(a),
      ];

      if (heldW > 8) {
        nodes.push(
          rect(heldW - 4, 88, {
            fill: timedOut ? '#3b2410' : '#3a2d0f',
            stroke: timedOut ? ROLE.held : ROLE.cached,
            width: 2.8,
            radius: 10,
          })
            .at(barX + heldW * 0.5, 20)
            .glow(10, timedOut ? ROLE.held : ROLE.cached)
            .opacity(a),
        );
      }

      if (claimed) {
        nodes.push(
          txt(
            timedOut ? '$0.010 HELD (TIMEOUT)' : '$0.010 held for Call 1',
            barX + heldW * 0.5,
            20,
            32,
            timedOut ? ROLE.held : ROLE.cached,
            'mono',
          ).opacity(a),
          txt('$0.007 free', barX + heldW + freeW * 0.5, 20, 32, ROLE.input, 'mono').opacity(a),
        );
      } else {
        nodes.push(txt('$0.017 free', 0, 20, 34, ROLE.input, 'mono').opacity(a));
      }

      // Prediction prompt on beat 2 -> result on beat 3 -> timeout hold on beat 4
      if (timedOut) {
        nodes.push(
          txt(
            'Call 1 timed out before receipt  ->  keep $0.010 held until settled',
            0,
            225,
            34,
            ROLE.held,
            'mono',
          )
            .glow(8, ROLE.held)
            .opacity(tp * a),
          txt(
            'Call 2 still sees only $0.007 free and must wait',
            0,
            310,
            30,
            COSMOS.ink,
            'sans',
          ).opacity(tp * a),
        );
      } else if (claimed) {
        nodes.push(
          txt(
            'ONLY 1 CALL CAN START  ·  Call 2 needs $0.010, sees $0.007 free',
            0,
            235,
            34,
            ROLE.cached,
            'mono',
          )
            .glow(8, ROLE.cached)
            .opacity(cp * a),
        );
      } else {
        nodes.push(
          txt('How many calls can start?', 0, 235, 44, ROLE.cached, 'serif')
            .glow(7, ROLE.cached)
            .opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1);

  c.on('total-receipts', () => {
    const t = c.cue('total-receipts').start;
    s.play(sumProg.to(1, { duration: clampDur(c, t, 0.75) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('reserve-first', () => {
    const t = c.cue('reserve-first').start;
    s.play(claimProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('timeout', () => {
    const t = c.cue('timeout').start;
    s.play(timeoutProg.to(1, { duration: clampDur(c, t, 0.45) }));
  });
}
