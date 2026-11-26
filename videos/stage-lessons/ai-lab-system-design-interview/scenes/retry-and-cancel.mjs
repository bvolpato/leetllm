// Scene 22: retry-and-cancel - A cancel request cannot erase an accepted external write
// Retry matrix from retryMode() (read auto vs writes needing strict Boolean True receiver idempotency),
// plus late commit receipt reconciliation after cancel intent and sandbox termination.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  retryMode,
  txt,
} from '../parts.mjs';

export default function retryAndCancel(s, c) {
  const phase = s.value(0);
  const boolOn = s.value(0);
  const cancelOn = s.value(0);

  const header = cinemaHeader(
    'IDEMPOTENCY & CANCELLATION',
    'Cancel cannot erase',
    'an accepted write',
    {
      x: -860,
      y: -445,
      accent: ROLE.fail,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f43f5e16', '#f59e0b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const bl = boolOn.value;
      const cn = cancelOn.value;
      const nodes = [];

      // Top table: Retry Mode Matrix computed directly from retryMode()!
      const lx = -840;
      const rows = [
        { act: 'repo_read', idem: 'read-only', res: retryMode('repo_read'), col: ROLE.ok, y: -155 },
        {
          act: 'create_commit',
          idem: 'receiver === True',
          res: retryMode('create_commit', true),
          col: ROLE.req,
          y: -85,
        },
        {
          act: 'create_commit',
          idem: 'receiver === "True" (str!)',
          res: retryMode('create_commit', 'True'),
          col: ROLE.fail,
          y: -15,
        },
      ];
      nodes.push(
        txt('ACTION', lx, -215, 26, COSMOS.muted, 'mono', 'left'),
        txt('RECEIVER IDEMPOTENCY', -420, -215, 26, COSMOS.muted, 'mono', 'left'),
        txt('POLICY OUTCOME', 180, -215, 26, ROLE.focus, 'mono', 'left'),
      );
      rows.forEach((r, i) => {
        const alpha = i === 2 ? 0.45 + bl * 0.55 : 1;
        nodes.push(
          txt(r.act, lx, r.y, 26, r.col, 'mono', 'left').opacity(alpha),
          txt(r.idem, -420, r.y, 26, i === 2 ? ROLE.fail : COSMOS.ink, 'mono', 'left').opacity(
            alpha,
          ),
          txt(r.res, 180, r.y, 26, r.col, 'mono', 'left').opacity(alpha),
        );
      });

      // Bottom: Late Commit Receipt vs Cancel Intent Sequence
      const cAlpha = 0.4 + cn * 0.6;
      nodes.push(
        line([-840, 65], [840, 65], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'LATE COMMIT RECEIPT AFTER CANCEL REQUEST',
          0,
          122,
          26,
          ROLE.warn,
          'mono',
          'center',
        ).opacity(cAlpha),
        txt(
          '1. Persist cancel intent -> stop scheduling new calls -> terminate sandbox -> mark canceled',
          0,
          180,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(cAlpha),
        txt(
          '2. Attach late commit receipt to original attempt · keep logs/artifacts · revoke creds',
          0,
          235,
          26,
          ROLE.req,
          'mono',
          'center',
        ).opacity(cAlpha),
        txt(
          'Cancellation & rollback CANNOT retract an external side effect that already happened!',
          0,
          310,
          28,
          ROLE.fail,
          'mono',
          'center',
        )
          .glow(cn > 0.4 ? 8 : 0, ROLE.fail)
          .opacity(cAlpha),
        txt('STRICT BOOLEAN CHECK', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Local key != proof a timed-out write failed',
          480,
          -378,
          26,
          ROLE.warn,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.fail,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('sd-retry-and-cancel-1-operation', () => {
    s.play(
      boolOn.to(1, { duration: clampDur(c, c.cue('sd-retry-and-cancel-1-operation').start, 0.35) }),
    );
  });
  c.on('sd-retry-and-cancel-2-operation', () => {
    s.play(
      cancelOn.to(1, {
        duration: clampDur(c, c.cue('sd-retry-and-cancel-2-operation').start, 0.4),
      }),
    );
  });
}
