// Scene 15: operation-ledger - Alex asks to page the owner
// Authenticated side-effect request ID, timeout -> STRICT prediction pause ("Should it send
// another page?") -> reconcile by request ID -> interruption clears spoken ack while page stays!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  trimSeg,
  txt,
  voiceNode,
} from '../parts.mjs';

export default function operationLedger(s, c) {
  const authOn = s.value(0);
  const timeoutOn = s.value(0);
  const reconcileOn = s.value(0); // STRICT after page-reconcile!
  const acceptedOn = s.value(0);
  const cutWordsOn = s.value(0);
  const staysOn = s.value(0);

  const header = cinemaHeader('SIDE-EFFECT OPERATION LEDGER', 'Alex asks to', 'page the owner', {
    x: -860,
    y: -445,
    accent: ROLE.tool,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#ffd1661a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const au = authOn.value;
      const tm = timeoutOn.value;
      const rc = reconcileOn.value;
      const ac = acceptedOn.value;
      const cw = cutWordsOn.value;
      const st = staysOn.value;
      const nodes = [];

      const reqPt = [-540, -15];
      const exePt = [0, -15];
      const svcPt = [540, -15];

      const nReq = voiceNode(reqPt[0], reqPt[1], 'REQ #4219', ROLE.audio, {
        radius: 82,
        sub: au > 0.4 ? 'auth + confirm OK' : 'auth & confirm action',
        size: 26,
      });

      const nExe = voiceNode(
        exePt[0],
        exePt[1],
        tm > 0.4 && rc < 0.4 ? 'TIMEOUT' : 'EXECUTOR',
        tm > 0.4 && rc < 0.4 ? ROLE.fail : ROLE.tool,
        {
          radius: 82,
          sub:
            rc > 0.4
              ? 'reconciled same ID'
              : tm > 0.4
                ? 'no response received'
                : 'submits 1 request ID',
          size: 26,
        },
      );

      const svcLabel = ac > 0.4 ? 'ACCEPTED' : rc > 0.4 ? 'LOOKUP ID' : 'PAGER ?';
      const svcCol = ac > 0.4 ? ROLE.ok : rc > 0.4 ? ROLE.audio : ROLE.focus;
      const nSvc = voiceNode(svcPt[0], svcPt[1], svcLabel, svcCol, {
        radius: 82,
        sub: ac > 0.4 ? 'needs delivery receipt' : 'idempotent paging API',
        size: 26,
      });

      const [b1a, b1b] = trimSeg(reqPt, exePt, nReq.r + 18, nExe.r + 18);
      const [b2a, b2b] = trimSeg(exePt, svcPt, nExe.r + 18, nSvc.r + 18);
      nodes.push(
        beamWithPhotons([b1a, b1b], ROLE.audio, 0, { width: 4 }),
        tm > 0.4 && rc < 0.4
          ? line(b2a, b2b, { stroke: ROLE.fail, width: 3.5, dash: [12, 10] }).glow(6, ROLE.fail)
          : beamWithPhotons([b2a, b2b], svcCol, 0, { width: 4 }),
        nReq.node,
        nExe.node,
        nSvc.node,
      );

      // Top-right idempotency rule
      nodes.push(
        txt('IDEMPOTENCY CONTRACT', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('1 request ID -> lookup before retry', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('accepted != delivered to owner', 480, -334, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Bottom lane: Prediction pause OR Decoupled History vs Operation Ledger!
      const botY = 250;
      if (cw > 0.35 || st > 0.35) {
        nodes.push(
          line([-840, 185], [840, 185], { stroke: '#25355a', width: 2 }).opacity(0.65),
          txt('SPOKEN HISTORY', -430, botY - 14, 26, ROLE.cut, 'mono', 'center'),
          txt('cleared (0 words confirmed)', -430, botY + 34, 26, COSMOS.ink, 'mono', 'center'),
          txt('OPERATION LEDGER', 430, botY - 14, 26, ROLE.ok, 'mono', 'center').glow(6, ROLE.ok),
          txt('page STILL ACCEPTED on record!', 430, botY + 34, 26, ROLE.ok, 'mono', 'center'),
        );
      } else if (ac > 0.35 || rc > 0.35) {
        nodes.push(
          txt(
            'DO NOT SEND A SECOND PAGE · LOOK UP ORIGINAL REQUEST ID!',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
          txt(
            'Reuse same ID on retry; wait for delivery receipt before saying owner saw it',
            0,
            botY + 52,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (tm > 0.35) {
        nodes.push(
          txt(
            'The page submission timed out. Should the executor send another page?',
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
            'Re-check permission just before sending; stop immediately if unauthorized',
            0,
            botY,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('page-auth', () => {
    s.play(authOn.to(1, { duration: clampDur(c, c.cue('page-auth').start, 0.35) }));
  });
  c.on('page-timeout', () => {
    s.play(timeoutOn.to(1, { duration: clampDur(c, c.cue('page-timeout').start, 0.35) }));
  });
  c.after('page-reconcile', () => {
    s.play(reconcileOn.to(1, { duration: clampDur(c, c.cue('page-reconcile').end, 0.35) }));
  });
  c.after('page-accepted', () => {
    s.play(acceptedOn.to(1, { duration: clampDur(c, c.cue('page-accepted').end, 0.35) }));
  });
  c.on('page-cut', () => {
    s.play(cutWordsOn.to(1, { duration: clampDur(c, c.cue('page-cut').start, 0.35) }));
  });
  c.on('page-next', () => {
    s.play(staysOn.to(1, { duration: clampDur(c, c.cue('page-next').start, 0.35) }));
  });
}
