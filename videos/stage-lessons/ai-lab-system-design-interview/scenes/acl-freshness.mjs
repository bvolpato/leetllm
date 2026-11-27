// Scene 19: acl-freshness - A young snapshot can still predate a revocation
// Dual-clock timeline: 20s-old ACL snapshot passes 60s age budget YET predates a revocation 1s ago!
// Fast tombstone path before physical compaction + complete audit receipt binding.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function aclFreshness(s, c) {
  const gapOn = s.value(0);
  const auditOn = s.value(0);

  const header = cinemaHeader(
    'ACL SNAPSHOT FRESHNESS',
    'A young snapshot can',
    'predate revocation',
    {
      x: -860,
      y: -445,
      accent: ROLE.warn,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const gp = gapOn.value;
      const au = auditOn.value;
      const nodes = [];

      // Time axis: -60s (budget) .. -20s (snapshot) .. -1s (revocation!) .. 0s (now)
      const x0 = -740;
      const x1 = 740;
      const mapSec = (sec) => x0 + ((sec + 65) / 70) * (x1 - x0);
      const rY = -30;

      const xBud = mapSec(-60);
      const xSnap = mapSec(-20);
      const xRev = mapSec(-1);
      const xNow = mapSec(0);

      nodes.push(
        txt(
          'ACL CLOCK: 20 s SNAPSHOT <= 60 s BUDGET, YET PREDATES 1 s REVOCATION!',
          0,
          rY - 115,
          26,
          ROLE.warn,
          'mono',
          'center',
        ),
        line([x0, rY], [x1, rY], { stroke: '#344770', width: 5 }),
        line([xBud, rY - 40], [xBud, rY + 20], { stroke: ROLE.req, width: 3.5, dash: [8, 6] }),
        txt('-60 s BUDGET', xBud, rY - 66, 26, ROLE.req, 'mono', 'center'),
        glowDot(xSnap, rY, { radius: 9, color: ROLE.ok, glow: 9 }),
        txt('SNAPSHOT (-20 s)', xSnap, rY + 52, 26, ROLE.ok, 'mono', 'center'),
        glowDot(xRev, rY, { radius: 10, color: ROLE.fail, glow: 11, opacity: 0.45 + gp * 0.55 }),
        txt('REVOKED (-1 s)!', xRev - 95, rY - 66, 26, ROLE.fail, 'mono', 'center').opacity(
          0.45 + gp * 0.55,
        ),
        glowDot(xNow, rY, { radius: 8, color: '#ffffff', glow: 8 }),
        txt('NOW (0 s)', xNow, rY + 52, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Highlight the 19-second blind gap between snapshot (-20s) and revocation (-1s)
      if (gp > 0.2) {
        nodes.push(
          line([xSnap + 12, rY], [xRev - 12, rY], { stroke: ROLE.fail, width: 8 })
            .glow(9, ROLE.fail)
            .opacity(gp),
          txt(
            'BLIND TO REVOCATION!',
            (xSnap + xRev) * 0.5,
            rY + 102,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(gp),
        );
      }

      // Bottom two columns: Fast Tombstone vs Authoritative Check & Audit Receipt
      const botY = 180;
      const aAlpha = 0.4 + au * 0.6;
      nodes.push(
        line([-840, 125], [840, 125], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('FAST TOMBSTONE + IMMUTABLE VERSIONS', -430, botY, 26, ROLE.req, 'mono', 'center'),
        txt(
          'Excludes deletes before slow compaction',
          -430,
          botY + 50,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ),
        txt(
          'Monitor connector lag & deletion queues',
          -430,
          botY + 100,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),

        txt('AUDIT RECEIPT & FAIL-CLOSED RULE', 430, botY, 26, ROLE.ok, 'mono', 'center').opacity(
          aAlpha,
        ),
        txt(
          'Tighter SLA -> live auth check / invalidation',
          430,
          botY + 50,
          26,
          ROLE.warn,
          'mono',
          'center',
        ).opacity(aAlpha),
        txt(
          'Bind caller · groups · ACL ver · chunks · cites',
          430,
          botY + 100,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(aAlpha),
        txt('FRESHNESS PREDICATE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('0 <= age <= budget (finite & known!)', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('sd-acl-freshness-1-operation', () => {
    s.play(
      gapOn.to(1, { duration: clampDur(c, c.cue('sd-acl-freshness-1-operation').start, 0.4) }),
    );
  });
  c.on('sd-acl-freshness-2-operation', () => {
    s.play(
      auditOn.to(1, { duration: clampDur(c, c.cue('sd-acl-freshness-2-operation').start, 0.4) }),
    );
  });
}
