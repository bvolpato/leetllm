// Scene 20: agent-state - Which record settles the missing reply?
// Task T47 in sandbox: writes intent -> repo accepts commit c42 -> worker crashes before saving reply
// -> STRICT prediction pause -> lookup receiver -> reconcile c42 -> cancel stops worker while c42 persists!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  sysNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function agentState(s, c) {
  const phase = s.value(0);
  const acceptOn = s.value(0);
  const crashOn = s.value(0);
  const recOn = s.value(0); // STRICT after agent-reconcile!
  const cancelOn = s.value(0);
  const exitOn = s.value(0); // STRICT after agent-exit!

  const header = cinemaHeader(
    'DURABLE AGENT RECONCILIATION',
    'Which record settles',
    'the missing reply?',
    {
      x: -860,
      y: -445,
      accent: ROLE.warn,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const ac = acceptOn.value;
      const cr = crashOn.value;
      const rc = recOn.value;
      const cn = cancelOn.value;
      const ex = exitOn.value;
      const nodes = [];

      const wkPt = [-460, -15];
      const rpPt = [460, -15];

      const wkLabel =
        ex > 0.4
          ? 'CANCELED'
          : cn > 0.4
            ? 'STOPPING'
            : rc > 0.4
              ? 'RECONCILED'
              : cr > 0.4
                ? 'RESTARTED'
                : 'TASK T47';
      const wkCol = ex > 0.4 ? ROLE.warn : rc > 0.4 ? ROLE.ok : cr > 0.4 ? ROLE.fail : ROLE.req;
      const nWk = sysNode(wkPt[0], wkPt[1], wkLabel, wkCol, {
        radius: 88,
        sub:
          ex > 0.4
            ? 'logs + artifacts kept'
            : rc > 0.4
              ? 'receipt c42 attached!'
              : cr > 0.4
                ? 'reply lost on crash'
                : 'attempt ID + intent saved',
        size: 26,
      });

      const rpLabel = ac > 0.4 ? 'COMMIT c42' : 'REPO';
      const rpCol = ac > 0.4 ? ROLE.ok : ROLE.worker;
      const nRp = sysNode(rpPt[0], rpPt[1], rpLabel, rpCol, {
        radius: 88,
        sub:
          ex > 0.4
            ? 'STILL EXISTS (needs review!)'
            : ac > 0.4
              ? 'accepted commit c42'
              : 'external write receiver',
        size: 26,
      });

      const [a, b] = trimSeg(wkPt, rpPt, nWk.r + 18, nRp.r + 18);
      nodes.push(
        cr > 0.4 && rc < 0.4
          ? line(a, b, { stroke: ROLE.fail, width: 3.5, dash: [12, 10] }).glow(7, ROLE.fail)
          : beamWithPhotons([a, b], rc > 0.4 ? ROLE.ok : ROLE.req, p, { width: 4, photonCount: 2 }),
        nWk.node,
        nRp.node,
      );

      // Top-right rule
      nodes.push(
        txt('TIMEOUT != FAILURE', 480, -425, 26, ROLE.warn, 'mono', 'center'),
        txt(
          'Auto-replay requires durable receiver idempotency',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction pause -> reconcile -> cancel semantics
      const botY = 265;
      if (ex > 0.4) {
        nodes.push(
          txt(
            'CANCEL INTENT -> STOP NEW CALLS -> SANDBOX EXIT -> MARK CANCELED (c42 STILL EXISTS!)',
            0,
            botY,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).glow(8, ROLE.warn),
        );
      } else if (rc > 0.4) {
        nodes.push(
          txt(
            'CHECK RECEIVER FOR ATTEMPT ID -> FOUND COMMIT c42 -> ATTACH RECEIPT TO T47!',
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else if (cr > 0.4) {
        nodes.push(
          txt(
            'Worker restarted before saving reply. Which record do you check before retrying?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Save attempt ID and write intent BEFORE calling any external mutation tool',
            0,
            botY,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: wkCol,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.after('agent-accept', () => {
    s.play(acceptOn.to(1, { duration: clampDur(c, c.cue('agent-accept').end, 0.35) }));
  });
  c.on('agent-timeout', () => {
    s.play(crashOn.to(1, { duration: clampDur(c, c.cue('agent-timeout').start, 0.35) }));
  });
  c.after('agent-reconcile', () => {
    s.play(recOn.to(1, { duration: clampDur(c, c.cue('agent-reconcile').end, 0.4) }));
  });
  c.on('agent-cancel', () => {
    s.play(cancelOn.to(1, { duration: clampDur(c, c.cue('agent-cancel').start, 0.35) }));
  });
  c.after('agent-exit', () => {
    s.play(exitOn.to(1, { duration: clampDur(c, c.cue('agent-exit').end, 0.35) }));
  });
}
