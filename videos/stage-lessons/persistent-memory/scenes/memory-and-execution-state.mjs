// Scene 10: memory-and-execution-state
// Crash recovery with idempotency key M17: historical note vs checkpoint vs merge destination.
// Strict prediction withholding before found-receipt!
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
  memNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function memoryAndExecutionState(s, c) {
  const phase = s.value(0);
  const pendingOn = s.value(0);
  const foundRec = s.value(0);
  const recSaved = s.value(0);
  const uncommit = s.value(0);
  const expAppr = s.value(0);
  const unknownSt = s.value(0);

  const header = cinemaHeader('EXECUTION STATE', 'Did the Merge', 'Actually Happen?', {
    x: -860,
    y: -445,
    accent: ROLE.pending,
    size: 46,
  });

  const bgAuras = aura(0, 20, 680, '#f59e0b1a', '#5ce1e618');

  const visual = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const fnd = foundRec.value;
      const rec = recSaved.value;
      const unc = uncommit.value;
      const exp = expAppr.value;
      const unk = unknownSt.value;

      const nodes = [];

      const noteX = -560;
      const ckX = 0;
      const dstX = 560;
      const midY = 5;

      const noteNode = memNode(noteX, midY, 'NOTE', ROLE.pending, {
        radius: 82,
        sub: '"merge approved"',
        size: 28,
      });

      let ckLabel = 'M17: pending';
      let ckSub = 'saved before crash';
      let ckCol = ROLE.prompt;
      if (unk > 0.5) {
        ckLabel = 'M17: pending';
        ckSub = 'keep key & retry lookup';
        ckCol = ROLE.pending;
      } else if (unc > 0.5) {
        ckLabel = 'M17: pending';
        ckSub = exp > 0.5 ? 'approval expired' : 'replay crash';
        ckCol = exp > 0.5 ? ROLE.fail : ROLE.pending;
      } else if (rec > 0.5) {
        ckLabel = 'M17: done';
        ckSub = '0 new merge calls';
        ckCol = ROLE.ok;
      }

      const ckNode = memNode(ckX, midY, ckLabel, ckCol, {
        radius: 88,
        sub: ckSub,
        size: 26,
      });

      let dstLabel = 'DEST: ?';
      let dstSub = 'reply lost on crash';
      let dstCol = ROLE.score;
      if (unk > 0.5) {
        dstLabel = 'UNKNOWN';
        dstSub = 'write may be in flight';
        dstCol = ROLE.pending;
      } else if (unc > 0.5) {
        dstLabel = 'NOT MERGED';
        dstSub = 'confirmed uncommitted';
        dstCol = ROLE.prompt;
      } else if (fnd > 0.5) {
        dstLabel = 'RECEIPT';
        dstSub = 'exact repo + rev';
        dstCol = ROLE.ok;
      }

      const dstNode = memNode(dstX, midY, dstLabel, dstCol, {
        radius: 88,
        sub: dstSub,
        size: 26,
      });

      const [nA, nB] = trimSeg([noteX, midY], [ckX, midY], noteNode.r + 18, ckNode.r + 18);
      nodes.push(line(nA, nB, { stroke: ROLE.pending, width: 3.2, dash: [10, 10] }).opacity(0.85));

      const [dA, dB] = trimSeg([ckX, midY], [dstX, midY], ckNode.r + 18, dstNode.r + 18);
      if (fnd > 0.5 || unc > 0.5 || unk > 0.5) {
        nodes.push(beamWithPhotons([dA, dB], dstCol, p, { width: 4, photonCount: 2 }));
      } else {
        nodes.push(
          line(dA, dB, { stroke: ROLE.score, width: 3.5, dash: [12, 10] }).glow(6, ROLE.score),
        );
      }

      nodes.push(noteNode.node, ckNode.node, dstNode.node);

      let runTitle = 'CRASH RESTART';
      let runDesc = 'same note, same pending key M17';
      let runCol = ROLE.score;
      if (unk > 0.5) {
        runTitle = 'OUTCOME 3: UNRESOLVED';
        runDesc = 'keep M17 & reconcile again';
        runCol = ROLE.pending;
      } else if (unc > 0.5) {
        runTitle = 'OUTCOME 2: UNCOMMITTED';
        runDesc =
          exp > 0.5 ? 'approval expired -> request new decision' : 're-check current CI & approval';
        runCol = exp > 0.5 ? ROLE.fail : ROLE.prompt;
      } else if (fnd > 0.5) {
        runTitle = 'OUTCOME 1: COMMITTED';
        runDesc = 'YES: lost reply hid completed merge';
        runCol = ROLE.ok;
      }

      nodes.push(
        txt(runTitle, 470, -425, 28, runCol, 'mono', 'center'),
        txt(runDesc, 470, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      const botY = 285;
      let actionLabel = 'QUESTION: COULD THE MERGE ALREADY HAVE HAPPENED?';
      let actionDetail = 'Note = memory of attempt  |  Destination = source of truth';
      let actionCol = ROLE.score;

      if (unk > 0.5) {
        actionLabel = 'ACTION: KEEP KEY M17 PENDING & RECONCILE AGAIN';
        actionDetail = 'Retry only when policy allows & destination accepts same key';
        actionCol = ROLE.pending;
      } else if (exp > 0.5) {
        actionLabel = 'ACTION: LEAVE PENDING & REQUEST NEW APPROVAL';
        actionDetail = 'Check actor, repo, exact revision, CI, and current reviews';
        actionCol = ROLE.fail;
      } else if (unc > 0.5) {
        actionLabel = 'RE-CHECK LIVE APPROVAL GATE BEFORE ANY RETRY';
        actionDetail = 'Historical note cannot authorize a fresh merge';
        actionCol = ROLE.prompt;
      } else if (rec > 0.5) {
        actionLabel = 'RECORD RECEIPT IN CHECKPOINT (0 NEW MERGE CALLS)';
        actionDetail = 'Idempotency key M17 prevented a duplicate merge';
        actionCol = ROLE.ok;
      } else if (fnd > 0.5) {
        actionLabel = 'YES: RECEIPT FOUND FOR KEY M17 AT DESTINATION';
        actionDetail = 'Matches exact repository and revision';
        actionCol = ROLE.ok;
      }

      nodes.push(
        line([-560, botY - 58], [560, botY - 58], { stroke: actionCol, width: 2.5 }).opacity(0.65),
        txt(actionLabel, 0, botY - 14, 28, actionCol, 'mono', 'center').glow(6, actionCol),
        txt(actionDetail, 0, botY + 40, 26, COSMOS.muted, 'mono', 'center'),
      );

      const dotX = -760 + ((p * 120) % 240);
      nodes.push(glowDot(dotX, 425, { radius: 4.5, color: actionCol, glow: 8, opacity: 0.7 }));

      return group(...nodes);
    },
  );

  s.add(bgAuras, header, visual);
  driftValue(s, c, phase, 4.2);

  c.on('pending-key', () => {
    s.play(pendingOn.to(1, { duration: clampDur(c, c.cue('pending-key').start, 0.35) }));
  });
  c.after('found-receipt', () => {
    s.play(foundRec.to(1, { duration: clampDur(c, c.cue('found-receipt').end, 0.45) }));
  });
  c.after('record-result', () => {
    s.play(recSaved.to(1, { duration: clampDur(c, c.cue('record-result').end, 0.4) }));
  });
  c.after('uncommitted', () => {
    s.play(uncommit.to(1, { duration: clampDur(c, c.cue('uncommitted').end, 0.45) }));
  });
  c.after('expired-approval', () => {
    s.play(expAppr.to(1, { duration: clampDur(c, c.cue('expired-approval').end, 0.4) }));
  });
  c.after('still-unknown', () => {
    s.play(unknownSt.to(1, { duration: clampDur(c, c.cue('still-unknown').end, 0.45) }));
  });
}
