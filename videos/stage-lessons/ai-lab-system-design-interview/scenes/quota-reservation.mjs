// Scene 11: quota-reservation - What happens to a reservation when the stream ends?
// Reserve-settle-refund ledger (10,000 -> -1,800 -> 8,200 -> +280 refund -> 8,480),
// atomic CAS vs naive race (100 bucket: 70 + 60 = 130 race vs atomic 30 left -> deny 60),
// duplicate completion idempotency, and disconnected stream keeping reservation pending!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function quotaReservation(s, c) {
  const phase = s.value(0);
  const resOn = s.value(0); // 10,000 -> 8,200
  const refOn = s.value(0); // +280 -> 8,480
  const raceMode = s.value(0); // 100 bucket naive race 70+60=130
  const atomicOn = s.value(0); // atomic 100-70=30 -> deny 60
  const dupDiscOn = s.value(0); // dup completion & disconnected stream pending

  const header = cinemaHeader('ATOMIC QUOTA LEDGER', 'What happens when', 'a stream ends?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f59e0b18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const rs = resOn.value;
      const rf = refOn.value;
      const rc = raceMode.value;
      const at = atomicOn.value;
      const dd = dupDiscOn.value;
      const nodes = [];

      const lx = -840;
      if (rc > 0.45 && dd < 0.45) {
        // Phase 2: 100-token bucket race (70 + 60 = 130 overspend vs Atomic CAS!)
        nodes.push(
          txt(
            'CONCURRENCY RACE: 100-TOKEN BUCKET  (REQ A: 70  ·  REQ B: 60)',
            lx,
            -185,
            26,
            ROLE.warn,
            'mono',
            'left',
          ),
          txt('NAIVE CHECK-THEN-SPEND (BROKEN):', lx, -110, 26, ROLE.fail, 'mono', 'left'),
          txt(
            '  Both read 100 -> reserve 70 + 60 = 130! (OVERSPENT -30)',
            lx,
            -58,
            26,
            ROLE.fail,
            'mono',
            'left',
          ),
          line([-840, 8], [840, 8], { stroke: '#25355a', width: 2 }).opacity(0.65),
          txt(
            'ATOMIC CHECK + DEDUCT (CAS / SINGLE TX):',
            lx,
            68,
            26,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(0.4 + at * 0.6),
          txt(
            '  Req A claims 70 -> balance = 30  |  Req B needs 60 -> REFUSED (429)!',
            lx,
            122,
            26,
            ROLE.ok,
            'mono',
            'left',
          )
            .glow(at > 0.4 ? 7 : 0, ROLE.ok)
            .opacity(0.4 + at * 0.6),
          glowMeter(lx, 195, 920, 32, at > 0.4 ? 0.3 : 1.0, {
            fill: at > 0.4 ? ROLE.ok : ROLE.fail,
            glow: 8,
          }),
        );
      } else {
        // Phase 1 & 3: 10,000-token bucket reserve -> refund -> duplicate / disconnect
        const bal = rf > 0.4 ? 8480 : rs > 0.4 ? 8200 : 10000;
        nodes.push(
          txt(
            `TEAM BUCKET BALANCE: ${bal.toLocaleString()} / 10,000 TOKENS`,
            lx,
            -185,
            28,
            ROLE.ok,
            'mono',
            'left',
          ),
          glowMeter(lx, -125, 1120, 34, bal / 10000, { fill: ROLE.ok, glow: 8 }),
          txt(
            '1. Reserve prompt + max_output = 1,800  ->  8,200 left',
            lx,
            -50,
            26,
            rs > 0.4 ? ROLE.req : COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            '2. Actual usage = 1,520  ->  refund +280  ->  8,480 left',
            lx,
            8,
            26,
            rf > 0.4 ? ROLE.ok : COSMOS.muted,
            'mono',
            'left',
          ),
        );

        if (dd > 0.35) {
          nodes.push(
            line([-840, 72], [840, 72], { stroke: '#25355a', width: 2 }).opacity(0.65),
            txt('DUPLICATE COMPLETION (SAME REQ ID):', lx, 125, 26, ROLE.ok, 'mono', 'left'),
            txt(
              '  idempotent -> refund already applied (no double credit!)',
              lx,
              175,
              26,
              COSMOS.ink,
              'mono',
              'left',
            ),
            txt('DISCONNECTED STREAM (MISSING USAGE):', lx, 240, 26, ROLE.warn, 'mono', 'left'),
            txt(
              '  keep 1,800 reservation PENDING until provider accounting arrives',
              lx,
              290,
              26,
              ROLE.warn,
              'mono',
              'left',
            ),
          );
        }
      }

      // Top-right hard money limit note
      nodes.push(
        txt('SEPARATE WINDOWS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Tokens · Requests · Hard $ Budget', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('Cache writes can cost > ordinary input', 480, -334, 26, ROLE.warn, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.after('sd-quota-reserved', () => {
    s.play(resOn.to(1, { duration: clampDur(c, c.cue('sd-quota-reserved').end, 0.35) }));
  });
  c.after('sd-quota-refunded', () => {
    s.play(refOn.to(1, { duration: clampDur(c, c.cue('sd-quota-refunded').end, 0.35) }));
  });
  c.after('sd-quota-naive', () => {
    s.play(raceMode.to(1, { duration: clampDur(c, c.cue('sd-quota-naive').end, 0.35) }));
  });
  c.after('sd-quota-claim', () => {
    s.play(atomicOn.to(1, { duration: clampDur(c, c.cue('sd-quota-claim').end, 0.35) }));
  });
  c.on('sd-quota-reservation-2-operation', () => {
    s.play(
      dupDiscOn.to(1, {
        duration: clampDur(c, c.cue('sd-quota-reservation-2-operation').start, 0.4),
      }),
    );
  });
}
