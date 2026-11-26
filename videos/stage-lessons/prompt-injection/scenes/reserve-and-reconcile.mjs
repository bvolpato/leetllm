// Scene 14: reserve-and-reconcile - The receipt never came back
// Split-universe recovery comparison for OP-9: Run A and Run B show identical empty
// local inboxes while their release-service histories stay veiled during the Beat 0
// prediction pause, then uncover (A crashed before dispatch vs B committed with lost
// reply) and transition to atomic pre-dispatch reservation + idempotent status lookup.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNodeRadius,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  gateNode,
  guardedDynamic,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function reserveAndReconcile(s, c) {
  const pulse = s.value(0);
  const inboxHi = s.value(0);
  const questionHi = s.value(0);
  const revealA = s.value(0);
  const revealB = s.value(0);
  const lostReply = s.value(0);
  const reserveOn = s.value(0);
  const lookupOn = s.value(0);
  const proofOn = s.value(0);

  const header = cinemaHeader('RECOVERY & IDEMPOTENCY', 'The receipt never', 'came back', {
    accent: ROLE.focus,
    size: 50,
  });

  const stageAura = aura(120, 30, 620, '#ffd1661a', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ih = inboxHi.value;
      const qh = questionHi.value;
      const rA = revealA.value;
      const rB = revealB.value;
      const lr = lostReply.value;
      const rs = reserveOn.value;
      const lu = lookupOn.value;
      const pr = proofOn.value;
      const nodes = [];

      const yA = -135;
      const yB = 125;
      const wX = -585;
      const iX = -205;
      const sX = 445;

      const rW = autoNodeRadius('WRK A', 46);
      const rI = autoNodeRadius('INBOX', 46);

      // Run A row (labels cleanly left of node, zero overlap with Run B!)
      nodes.push(
        txt('RUN A', -855, yA - 18, 28, ROLE.source, 'mono', 'left'),
        txt('OP-9', -855, yA + 22, 26, COSMOS.muted, 'mono', 'left'),
        gateNode(wX, yA, 'WRK A', rs > 0.3 ? ROLE.ok : ROLE.source, {
          radius: 46,
          sub: rs > 0.3 ? 'RESERVED OP-9' : 'POPPED DICT',
        }),
        gateNode(iX, yA, 'INBOX', ih > 0.3 ? ROLE.focus : COSMOS.muted, {
          radius: 46,
          sub: 'EMPTY INBOX',
        }),
      );
      const segAI = trimSeg([wX, yA], [iX, yA], rW + 14, rI + 14);
      nodes.push(line(segAI[0], segAI[1], { stroke: '#334673', width: 2.6, dash: [6, 6] }));

      // Run A Service History Box (veiled until revealA!)
      const veilA = fadeOutHalf(rA);
      const openA = fadeInHalf(rA);
      nodes.push(
        rect(675, 134, {
          fill: '#0e1529',
          stroke: openA > 0.3 ? ROLE.source : '#2c3d66',
          width: 2.6,
          radius: 10,
        }).at(sX, yA),
      );
      if (veilA > 0.02) {
        nodes.push(
          txt('SERVICE HISTORY HIDDEN', sX, yA - 18, 28, COSMOS.dim, 'mono', 'center').opacity(
            veilA,
          ),
          txt('Did OP-9 execute?', sX, yA + 26, 26, ROLE.focus, 'serif', 'center').opacity(veilA),
        );
      }
      if (openA > 0.02) {
        nodes.push(
          txt('CRASHED BEFORE DISPATCH', sX, yA - 22, 28, ROLE.source, 'mono', 'center')
            .glow(6, ROLE.source)
            .opacity(openA),
          txt(
            lu > 0.3 ? 'LOOKUP OP-9 -> NOT FOUND (0)' : 'RELEASE COUNT: 0',
            sX,
            yA + 28,
            26,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(openA),
        );
      }

      // Run B row
      nodes.push(
        txt('RUN B', -855, yB - 18, 28, ROLE.host, 'mono', 'left'),
        txt('OP-9', -855, yB + 22, 26, COSMOS.muted, 'mono', 'left'),
        gateNode(wX, yB, 'WRK B', pr > 0.3 ? ROLE.ok : rs > 0.3 ? ROLE.host : ROLE.source, {
          radius: 46,
          sub: pr > 0.3 ? 'RECOVERED' : rs > 0.3 ? 'RESERVED OP-9' : 'POPPED DICT',
        }),
        gateNode(iX, yB, 'INBOX', pr > 0.3 ? ROLE.ok : ih > 0.3 ? ROLE.focus : COSMOS.muted, {
          radius: 46,
          sub: pr > 0.3 ? '1 RECEIPT' : 'EMPTY INBOX',
        }),
      );
      const segBI = trimSeg([wX, yB], [iX, yB], rW + 14, rI + 14);
      nodes.push(line(segBI[0], segBI[1], { stroke: '#334673', width: 2.6, dash: [6, 6] }));

      // Run B Service History Box (veiled until revealB!)
      const veilB = fadeOutHalf(rB);
      const openB = fadeInHalf(rB);
      nodes.push(
        rect(675, 134, {
          fill: '#0e1529',
          stroke: pr > 0.3 ? ROLE.ok : openB > 0.3 ? ROLE.host : '#2c3d66',
          width: 2.6,
          radius: 10,
        }).at(sX, yB),
      );
      if (veilB > 0.02) {
        nodes.push(
          txt('SERVICE HISTORY HIDDEN', sX, yB - 18, 28, COSMOS.dim, 'mono', 'center').opacity(
            veilB,
          ),
          txt('Did OP-9 execute?', sX, yB + 26, 26, ROLE.focus, 'serif', 'center').opacity(veilB),
        );
      }
      if (openB > 0.02) {
        nodes.push(
          txt(
            pr > 0.3 ? 'COMMITTED · RECEIPT RECOVERED (1)' : 'COMMITTED 1 RELEASE · REPLY LOST',
            sX,
            yB - 22,
            26,
            pr > 0.3 ? ROLE.ok : ROLE.host,
            'mono',
            'center',
          )
            .glow(6, pr > 0.3 ? ROLE.ok : ROLE.host)
            .opacity(openB),
          txt(
            lr > 0.3 && pr < 0.3
              ? 'Reply dropped -> inbox matches Run A'
              : 'Idempotent OP-9 prevents duplicate write',
            sX,
            yB + 28,
            26,
            lr > 0.3 && pr < 0.3 ? ROLE.untrusted : ROLE.ok,
            'sans',
            'center',
          ).opacity(openB),
        );
      }

      // Reconciliation query beam from Inbox B -> Service B on Beat 2-3
      if (lu > 0.05) {
        const recArc = quadArcPts([iX + rI + 16, yB], [sX - 342, yB], 0, 18);
        nodes.push(
          beamWithPhotons(recArc, pr > 0.3 ? ROLE.ok : ROLE.host, p * 1.1, {
            width: 3.4,
            alpha: lu,
          }),
        );
      }

      // Bottom band: Non-overlapping prediction question -> atomic reconciliation rule
      const preQ = fadeOutHalf(rA);
      const postQ = fadeInHalf(rA);
      if (preQ > 0.02) {
        nodes.push(
          txt(
            qh > 0.3
              ? 'Can either worker tell from its empty inbox whether the release happened?'
              : 'Both workers removed their local approval and restarted with empty inboxes...',
            0,
            352,
            32,
            ROLE.question,
            'serif',
            'center',
          )
            .glow(qh > 0.3 ? 8 : 4, ROLE.question)
            .opacity(preQ),
        );
      }
      if (postQ > 0.02) {
        nodes.push(
          energyRail(-855, 295, 412, pr > 0.3 ? ROLE.ok : ROLE.host, {
            width: 5,
            opacity: postQ,
          }),
          txt(
            rs > 0.3
              ? 'ATOMIC RESERVE BEFORE DISPATCH -> QUERY OP-9 -> RECOVER OR RETRY SAME IDEMPOTENT OP'
              : 'NEITHER CAN · IDENTICAL EMPTY INBOXES HIDE 0 vs 1 COMMITTED RELEASE',
            -825,
            326,
            26,
            pr > 0.3 ? ROLE.ok : ROLE.host,
            'mono',
            'left',
          ).opacity(postQ),
          txt(
            'Only one worker claims an approval · New args need fresh authz · Recheck expiry & revocation',
            -825,
            382,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(postQ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('recovery-local', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('recovery-local').start, 0.25) }));
  });
  c.on('recovery-inbox', () => {
    s.play(inboxHi.to(1, { duration: clampDur(c, c.cue('recovery-inbox').start, 0.35) }));
  });
  c.after('recovery-question', () => {
    s.play(questionHi.to(1, { duration: clampDur(c, c.cue('recovery-question').end, 0.25) }));
  });
  c.on('recovery-before', () => {
    s.play(revealA.to(1, { duration: clampDur(c, c.cue('recovery-before').start, 0.4) }));
  });
  c.on('recovery-commit', () => {
    s.play(revealB.to(1, { duration: clampDur(c, c.cue('recovery-commit').start, 0.4) }));
  });
  c.on('recovery-lost', () => {
    s.play(lostReply.to(1, { duration: clampDur(c, c.cue('recovery-lost').start, 0.35) }));
  });
  c.on('recovery-reserve', () => {
    s.play(reserveOn.to(1, { duration: clampDur(c, c.cue('recovery-reserve').start, 0.4) }));
  });
  c.on('recovery-status', () => {
    s.play(lookupOn.to(1, { duration: clampDur(c, c.cue('recovery-status').start, 0.4) }));
  });
  c.on('recovery-proof', () => {
    s.play(proofOn.to(1, { duration: clampDur(c, c.cue('recovery-proof').start, 0.4) }));
  });
}
