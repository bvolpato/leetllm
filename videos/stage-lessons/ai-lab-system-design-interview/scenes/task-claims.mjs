// Scene 21: task-claims - Persist the expected state and the attempt that can change it
// Legal transition graph (queued -> provisioning -> running <-> blocked/review -> terminal),
// atomic CAS claim (stale running->review fails vs blocked->running succeeds), & sandbox durability.
import { group, line } from 'vizmatic/stage';
import {
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

export default function taskClaims(s, c) {
  const casOn = s.value(0);
  const sandOn = s.value(0);

  const header = cinemaHeader(
    'DURABLE TASK STATE MACHINE',
    'Persist expected state',
    '& atomic CAS claims',
    {
      x: -860,
      y: -445,
      accent: ROLE.policy,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const cs = casOn.value;
      const sn = sandOn.value;
      const nodes = [];

      // Legal state chain across top-mid (y = -85)
      const qPt = [-660, -85];
      const prPt = [-340, -85];
      const rnPt = [-20, -85];
      const blPt = [300, -85];
      const tmPt = [640, -85];

      const nQ = sysNode(qPt[0], qPt[1], 'QUEUED', ROLE.req, { radius: 60 });
      const nPr = sysNode(prPt[0], prPt[1], 'PROV', ROLE.worker, { radius: 60 });
      const nRn = sysNode(rnPt[0], rnPt[1], 'RUNNING', ROLE.ok, { radius: 66 });
      const nBl = sysNode(blPt[0], blPt[1], 'BLOCKED', ROLE.warn, { radius: 66 });
      const nTm = sysNode(tmPt[0], tmPt[1], 'TERMINAL', ROLE.fail, {
        radius: 68,
        sub: 'fail / cancel / done',
      });

      const pairs = [
        [qPt, nQ.r, prPt, nPr.r, ROLE.req],
        [prPt, nPr.r, rnPt, nRn.r, ROLE.worker],
        [rnPt, nRn.r, blPt, nBl.r, ROLE.warn],
        [blPt, nBl.r, tmPt, nTm.r, ROLE.fail],
      ];
      pairs.forEach(([a, ra, b, rb, col], i) => {
        const [pa, pb] = trimSeg(a, b, ra + 10, rb + 10);
        nodes.push(beamWithPhotons([pa, pb], col, 0, { width: 3.4 }));
      });
      nodes.push(nQ.node, nPr.node, nRn.node, nBl.node, nTm.node);

      // Middle: Atomic Compare-And-Set vs Stale Worker Claim
      const casY = 158;
      const cAlpha = 0.4 + cs * 0.6;
      nodes.push(
        line([-840, 96], [840, 96], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'CURRENT STORAGE STATE = BLOCKED',
          0,
          casY - 22,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(cAlpha),
        txt(
          'Stale claim (expect RUNNING -> REVIEW): FAILS!',
          -420,
          casY + 34,
          26,
          ROLE.fail,
          'mono',
          'center',
        ).opacity(cAlpha),
        txt(
          'Valid CAS (expect BLOCKED -> RUNNING): SUCCEEDS!',
          420,
          casY + 34,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(cAlpha),
      );

      // Bottom: Sandbox durability + new attempt ID rule
      const sAlpha = 0.4 + sn * 0.6;
      nodes.push(
        line([-840, 242], [840, 242], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'New work after a terminal state ALWAYS gets a new attempt_id (never reopen terminal!)',
          0,
          296,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(cAlpha),
        txt(
          'Persist scoped checkout, short-lived creds, tool events, checkpoints & artifacts; UI stream != truth',
          0,
          350,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(sAlpha),
        txt('EDGE CHECK != PERSIST', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Require atomic CAS or valid lease', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('sd-task-claims-1-operation', () => {
    s.play(casOn.to(1, { duration: clampDur(c, c.cue('sd-task-claims-1-operation').start, 0.4) }));
  });
  c.on('sd-task-claims-2-operation', () => {
    s.play(sandOn.to(1, { duration: clampDur(c, c.cue('sd-task-claims-2-operation').start, 0.4) }));
  });
}
