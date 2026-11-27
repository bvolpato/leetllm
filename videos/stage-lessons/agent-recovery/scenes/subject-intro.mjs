// Scene 1: subject-intro - "The missing receipt"
// Optical channel between Agent and Controller: countdown ring expires, saved key reconciles job-1,
// then replay exposes the cut connection on the return path.
import { arc, circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  OP,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowCross,
  glowPill,
  glowRing,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';
import { drawOpticalChannel, drawPacket } from '../operation-trace.mjs';

export default function subjectIntro(s, c) {
  const title = heroTitle(['The missing receipt'], {
    x: -855,
    y: -440,
    size: 56,
    accent: ROLE.agent,
  });

  const amb = ambientClock(s, c);
  const timerSweep = s.value(0);
  const timedOut = s.value(0);
  const showSavedKey = s.value(0);
  const askQueue = s.value(0);
  const lookupProg = s.value(0);
  const replyProg = s.value(0);
  const showReply = s.value(0);
  const replayMode = s.value(0);
  const lostProg = s.value(0);
  const showCut = s.value(0);
  const showClaim = s.value(0);

  const ax = -640;
  const cx = 640;
  const topY = -150;
  const botY = 175;

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const nodes = [
        drawOpticalChannel({
          ax,
          cx,
          topY,
          botY,
          agentLabel: 'Agent',
          agentSub: OP.run,
          ctrlLabel: 'Controller',
          ctrlSub: 'Ledger + Queue',
          alpha,
          agentActive: showSavedKey.value > 0.3,
          ctrlActive: showReply.value > 0.3 || replayMode.value > 0.3,
        }),
      ];

      // Receipt timer dial centered cleanly above the top lane at (0, -336)
      const dialX = 0;
      const dialY = -336;
      const dialR = 70;
      const isExpired = timedOut.value > 0.5;
      const dialCol = isExpired ? ROLE.fail : ROLE.agent;
      nodes.push(
        circle(dialR, {
          fill: hexAlpha(dialCol, 0.1 * alpha),
          stroke: hexAlpha(dialCol, 0.35 * alpha),
          width: 3,
        }).at(dialX, dialY),
        arc(dialR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.05, timerSweep.value), {
          stroke: dialCol,
          width: 6,
          fill: '#00000000',
        })
          .at(dialX, dialY)
          .glow(isExpired ? 12 : 6, dialCol),
        txt(isExpired ? 'TIMEOUT' : 'WAIT', dialX, dialY, 26, dialCol, 'mono', 'center').opacity(
          alpha,
        ),
      );

      // Initial request packet sent on top lane (visible from start -> settled at controller)
      if (replayMode.value < 0.5) {
        nodes.push(
          ...drawPacket({
            x1: ax + 88,
            x2: cx - 88,
            y: topY,
            t: Math.min(1, 0.25 + timerSweep.value * 0.75),
            color: ROLE.op,
            label: `${OP.action} ${OP.revision}`,
            alpha,
          }),
        );
      }

      // Agent local journal below Agent orb (ax, botY)
      const jColor = showSavedKey.value > 0.5 ? ROLE.op : ROLE.muted;
      nodes.push(
        glowRing(ax, botY, 104, jColor, {
          width: showSavedKey.value > 0.5 ? 3.8 : 2.2,
          glow: showSavedKey.value > 0.5 ? 10 : 3,
        }).opacity(alpha),
        txt(
          showSavedKey.value > 0.5 ? OP.key : 'local copy',
          ax,
          botY - 16,
          26,
          jColor,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          showSavedKey.value > 0.5 ? OP.revision : 'receipt: ?',
          ax,
          botY + 22,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Controller durable vault below Controller orb (cx, botY)
      const revealedJob = showReply.value > 0.5 || replayMode.value > 0.5;
      const vColor = revealedJob ? ROLE.sure : ROLE.controller;
      nodes.push(
        glowRing(cx, botY, 104, vColor, {
          width: revealedJob ? 4 : 2.4,
          glow: revealedJob ? 12 : 4,
        }).opacity(alpha),
        txt(revealedJob ? OP.job : 'remote', cx, botY - 16, 26, vColor, 'mono', 'center').opacity(
          alpha,
        ),
        txt(
          revealedJob ? OP.state : 'unknown',
          cx,
          botY + 22,
          26,
          revealedJob ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Lookup packet (lookup by saved key)
      if (lookupProg.value > 0.02 && replayMode.value < 0.5) {
        nodes.push(
          ...drawPacket({
            x1: ax + 115,
            x2: cx - 115,
            y: 52,
            t: lookupProg.value,
            color: ROLE.agent,
            label: `lookup(${OP.key})`,
            alpha,
          }),
        );
      }

      // Lookup reply packet (ONLY after lookup-reply cue)
      if (replyProg.value > 0.02 && replayMode.value < 0.5) {
        nodes.push(
          ...drawPacket({
            x1: cx - 115,
            x2: ax + 115,
            y: botY,
            t: replyProg.value,
            color: ROLE.sure,
            label: `${OP.job}, ${OP.state}`,
            alpha,
          }),
        );
      }

      // Replay mode: show original request committed & return receipt cut mid-wire
      if (replayMode.value >= 0.5) {
        const ra = replayMode.value * alpha;
        nodes.push(
          ...drawPacket({
            x1: ax + 115,
            x2: cx - 115,
            y: topY,
            t: 1,
            color: ROLE.sure,
            label: `original: ${OP.key}`,
            alpha: ra,
          }),
        );
        if (lostProg.value > 0.02) {
          nodes.push(
            ...drawPacket({
              x1: cx - 115,
              x2: ax + 115,
              y: botY,
              t: lostProg.value,
              color: ROLE.fail,
              label: showCut.value > 0.5 ? 'receipt cut' : 'receipt sent',
              lostAt: showCut.value > 0.5 ? 0.52 : null,
              alpha: ra,
            }),
          );
        }
        if (showCut.value > 0.5) {
          const cutX = cx - 115 + (ax + 115 - (cx - 115)) * 0.52;
          nodes.push(
            line([cutX, botY - 22], [cutX, botY + 46], {
              stroke: ROLE.fail,
              width: 3,
              dash: [6, 6],
            }).opacity(ra * (0.7 + 0.3 * pulse)),
            glowCross(cutX, botY, 36, ROLE.fail, ra),
          );
        }
      }

      // Center narrative readout / prediction prompt (strict withholding!)
      const midY = 300;
      if (showClaim.value > 0.5) {
        nodes.push(
          glowPill(`${OP.job} was ${OP.state} when checked`, 0, midY, ROLE.sure, {
            size: 30,
            alpha: showClaim.value * alpha,
          }),
          txt(
            'Check the worker for the final rollback outcome.',
            0,
            midY + 62,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(showClaim.value * alpha),
        );
      } else if (replayMode.value > 0.5) {
        nodes.push(
          txt(
            showCut.value > 0.5
              ? 'Controller committed job-1, then the return link dropped.'
              : 'Replay: controller saved job-1 and sent its receipt.',
            0,
            midY + 12,
            30,
            showCut.value > 0.5 ? ROLE.fail : ROLE.sure,
            'sans',
            'center',
          ).opacity(replayMode.value * alpha),
        );
      } else if (showReply.value > 0.5) {
        nodes.push(
          glowPill(`lookup(${OP.key}) -> ${OP.job}, ${OP.state}`, 0, midY, ROLE.sure, {
            size: 30,
            alpha: showReply.value * alpha,
          }),
        );
      } else if (askQueue.value > 0.5) {
        nodes.push(
          txt(
            'Did the controller queue the rollback?',
            0,
            midY + 6,
            34,
            ROLE.mark,
            'serif',
            'center',
          )
            .glow(7, ROLE.mark)
            .opacity(askQueue.value * alpha),
          txt(
            'Timeout hides the reply, not whether the write landed.',
            0,
            midY + 60,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(askQueue.value * alpha),
        );
      } else {
        nodes.push(
          txt(
            `Approved ${OP.action} (${OP.revision}) sent with saved key ${OP.key}.`,
            0,
            midY + 12,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          `KEY: ${OP.key} · PAYLOAD: ${OP.run} / ${OP.revision}`,
          showClaim.value > 0.5
            ? 'OBSERVED: job-1 queued'
            : showReply.value > 0.5
              ? 'RECONCILED BY KEY'
              : 'TIMEOUT -> OUTCOME UNKNOWN',
          { accent: showReply.value > 0.5 ? ROLE.sure : ROLE.agent, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.agent, ROLE.op), title, layer);

  c.at(0.15, () => s.play(timerSweep.to(1, { duration: 2.2 })));
  playCue(s, c, 'timeout', (d) => s.play(timedOut.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'saved-key', (d) => s.play(showSavedKey.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'ask-queue', (d) => s.play(askQueue.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'saved-lookup', (d) => s.play(lookupProg.to(1, { duration: d })), { dur: 0.85 });
  playCue(
    s,
    c,
    'lookup-reply',
    (d) => s.play(replyProg.to(1, { duration: d }), showReply.to(1, { duration: 0.3 })),
    { after: true, dur: 0.65 },
  );
  playCue(s, c, 'inspect-fault', (d) => s.play(replayMode.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'lost-receipt', (d) => s.play(lostProg.to(0.55, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'receipt-broke', (d) => s.play(showCut.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'queued-claim', (d) => s.play(showClaim.to(1, { duration: d })), { dur: 0.45 });
}
