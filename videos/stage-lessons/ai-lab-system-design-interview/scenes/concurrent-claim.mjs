// Scene 17: concurrent-claim - Can both requests take the last decode slot?
// R-201 & R-202 both read 1 free decode slot + 16 free KV blocks (125 ms wait <= 250 ms) ->
// STRICT prediction pause -> atomic claim gives R-201 all 1+16, R-202 gets HTTP 503, then release!
import { group, line } from 'vizmatic/stage';
import {
  CLAIM_ADM,
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  sysNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function concurrentClaim(s, c) {
  const readOn = s.value(0);
  const claimFirst = s.value(0); // STRICT after claim-first!
  const reject202 = s.value(0); // STRICT after claim-reject!
  const releaseOn = s.value(0);

  const header = cinemaHeader(
    'ATOMIC CAPACITY CLAIM',
    'Can both requests take',
    'the last decode slot?',
    {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#ffd1661a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const rd = readOn.value;
      const cf = claimFirst.value;
      const rj = reject202.value;
      const rl = releaseOn.value;
      const nodes = [];

      const r1Pt = [-540, -105];
      const r2Pt = [-540, 145];
      const poolPt = [160, 20];

      const r1Col = rl > 0.4 ? ROLE.ok : cf > 0.4 ? ROLE.ok : ROLE.req;
      const r2Col = rj > 0.4 ? ROLE.fail : ROLE.req;
      const poolLabel = rl > 0.4 ? '1 SLOT · 16' : cf > 0.4 ? '0 SLOT · 0' : '1 SLOT · 16';
      const poolCol = rl > 0.4 ? ROLE.ok : cf > 0.4 ? ROLE.warn : ROLE.focus;

      const nR1 = sysNode(r1Pt[0], r1Pt[1], 'R-201', r1Col, {
        radius: 74,
        sub:
          rl > 0.4
            ? 'finished -> released'
            : cf > 0.4
              ? 'CLAIMED ATOMICALLY!'
              : 'needs 1 slot + 16 blk',
      });
      const nR2 = sysNode(r2Pt[0], r2Pt[1], 'R-202', r2Col, {
        radius: 74,
        sub: rj > 0.4 ? 'HTTP 503 (keeps receipt)' : 'needs 1 slot + 16 blk',
      });
      const nPool = sysNode(poolPt[0], poolPt[1], poolLabel, poolCol, {
        radius: 92,
        sub: rl > 0.4 ? 'freed together!' : cf > 0.4 ? 'owned by R-201' : 'both read same counts',
        size: 26,
      });

      const [a1, b1] = trimSeg(r1Pt, poolPt, nR1.r + 16, nPool.r + 16);
      const [a2, b2] = trimSeg(r2Pt, poolPt, nR2.r + 16, nPool.r + 16);

      nodes.push(
        beamWithPhotons([a1, b1], r1Col, 0, { width: 4 }),
        rj > 0.4
          ? line(a2, b2, { stroke: ROLE.fail, width: 3.5, dash: [12, 10] }).glow(6, ROLE.fail)
          : beamWithPhotons([a2, b2], r2Col, 0, {
              width: 3.6,
              alpha: 0.45 + rd * 0.55,
            }),
        nR1.node,
        nR2.node,
        nPool.node,
      );

      // Right-hand live wait & spike rules
      const rx = 590;
      nodes.push(
        txt('PREFILL BACKLOG CHECK', rx, -120, 26, ROLE.req, 'mono', 'center'),
        txt(
          `10k / 80k = ${Math.round(CLAIM_ADM.prefill.estimatedWait * 1000)} ms <= 250 ms`,
          rx,
          -68,
          26,
          ROLE.ok,
          'mono',
          'center',
        ),
        txt('10x SPIKE DISCIPLINE:', rx, 30, 26, ROLE.focus, 'mono', 'center'),
        txt('· Bound queue & fair-schedule', rx, 82, 26, COSMOS.ink, 'mono', 'center'),
        txt('· Retry only if deadline remains', rx, 132, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Top-right rule
      nodes.push(
        txt('READ != RESERVATION', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Check is a snapshot; claim must be atomic',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction prompt -> STRICT withholding until claim-first!
      const botY = 325;
      if (rl > 0.4) {
        nodes.push(
          txt(
            'ON COMPLETION: RETURN SLOT + ALL 16 KV BLOCKS TOGETHER FOR NEXT ADMISSION',
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else if (rj > 0.4) {
        nodes.push(
          txt(
            'ONLY ONE STARTS: R-201 CLAIMS ATOMICALLY  |  R-202 RECEIVES HTTP 503 SHARED CAPACITY',
            0,
            botY,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).glow(8, ROLE.fail),
        );
      } else if (cf > 0.4) {
        nodes.push(
          txt(
            'ONLY ONE: ATOMIC CLAIM HANDS LAST SLOT + 16 BLOCKS TO R-201!',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else {
        nodes.push(
          txt(
            'Both checks passed on the same counts. Can both R-201 and R-202 start?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('claim-read', () => {
    s.play(readOn.to(1, { duration: clampDur(c, c.cue('claim-read').start, 0.35) }));
  });
  c.after('claim-first', () => {
    s.play(claimFirst.to(1, { duration: clampDur(c, c.cue('claim-first').end, 0.4) }));
  });
  c.after('claim-reject', () => {
    s.play(reject202.to(1, { duration: clampDur(c, c.cue('claim-reject').end, 0.35) }));
  });
  c.on('claim-release', () => {
    s.play(releaseOn.to(1, { duration: clampDur(c, c.cue('claim-release').start, 0.4) }));
  });
}
