// Scene 3: operation-identity - "Which identifier survives a retry?"
// Three luminous identity rings (Trace = trip, Key+Payload = logical work, Job = queue entry).
// Demonstrates same-key replay (-> job-1), changed revision (-> conflict), and fresh key prediction (-> 2 jobs).
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  OP,
  ROLE,
  cinemaAtmosphere,
  glowArrow,
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

export default function operationIdentity(s, c) {
  const title = heroTitle(['Which identifier survives a retry?'], {
    x: -855,
    y: -440,
    size: 52,
    accent: ROLE.op,
  });

  const showKey = s.value(0);
  const showPayload = s.value(0);
  const showSend1 = s.value(0);
  const showSend2 = s.value(0);
  const showJob1 = s.value(0);
  const showThreeIds = s.value(0);
  const showReplay = s.value(0);
  const showConflict = s.value(0);
  const showFreshKey = s.value(0);
  const showAsk = s.value(0);
  const showJob2 = s.value(0); // STRICTLY AFTER 'new-job'!

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const nodes = [];

      // Left column: Three distinct identity beacons
      const idX = -635;
      const traceY = -205;
      const keyY = 25;
      const jobY = 255;

      // 1. Trace ID (rotates per trip)
      const traceCol = ROLE.agent;
      const traceLabel =
        showFreshKey.value > 0.5
          ? 'trace-3 (new trip)'
          : showSend2.value > 0.5
            ? 'trace-1 -> trace-2'
            : 'trace-1 (one trip)';
      nodes.push(
        glowRing(idX, traceY, 72, traceCol, {
          width: showSend1.value > 0.3 ? 3.8 : 2.2,
          glow: showSend1.value > 0.3 ? 10 : 4,
        }).opacity(alpha),
        txt('TRACE', idX, traceY - 12, 26, traceCol, 'mono', 'center').opacity(alpha),
        txt(
          showSend2.value > 0.5 ? '#2' : '#1',
          idX,
          traceY + 22,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        txt(traceLabel, idX + 114, traceY, 26, traceCol, 'mono', 'left').opacity(alpha),
      );

      // 2. Operation Key + Payload (survives retries)
      const keyCol = ROLE.op;
      const activeKeyStr = showFreshKey.value > 0.5 ? OP.altKey : OP.key;
      const activeRevStr =
        showConflict.value > 0.5 && showFreshKey.value < 0.5 ? OP.badRevision : OP.revision;
      nodes.push(
        glowRing(idX, keyY, 76, keyCol, {
          width: showKey.value > 0.3 ? 4.4 : 2.5,
          glow: showKey.value > 0.3 ? 14 : 5,
        }).opacity(alpha),
        txt('OP KEY', idX, keyY - 12, 26, keyCol, 'mono', 'center').opacity(alpha),
        txt(activeKeyStr, idX, keyY + 22, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(
          showPayload.value > 0.3 ? `${OP.run} · ${activeRevStr}` : 'logical operation',
          idX + 114,
          keyY,
          26,
          showConflict.value > 0.5 && showFreshKey.value < 0.5 ? ROLE.fail : keyCol,
          'mono',
          'left',
        ).opacity(alpha),
      );

      // 3. Job ID (belongs to controller queue entry)
      const jobCol = ROLE.sure;
      nodes.push(
        glowRing(idX, jobY, 72, jobCol, {
          width: showJob1.value > 0.3 ? 3.8 : 2.2,
          glow: showJob1.value > 0.3 ? 10 : 4,
        }).opacity(alpha),
        txt('JOB ID', idX, jobY - 12, 26, jobCol, 'mono', 'center').opacity(alpha),
        txt(
          showJob2.value > 0.5 ? '2 jobs' : showJob1.value > 0.5 ? OP.job : 'queue',
          idX,
          jobY + 22,
          26,
          showJob2.value > 0.5 ? ROLE.fail : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          showThreeIds.value > 0.5 ? 'controller queue entry' : 'accepted work',
          idX + 114,
          jobY,
          26,
          jobCol,
          'mono',
          'left',
        ).opacity(alpha),
      );

      // Right side: Controller Ledger + Queue Ledger Matrix (x = 120 .. 830)
      nodes.push(
        line([-75, -270], [-75, 325], {
          stroke: hexAlpha(ROLE.controller, 0.45 * alpha),
          width: 2.2,
        }),
        txt('CONTROLLER LEDGER & QUEUE', 400, -285, 28, ROLE.controller, 'mono', 'center').opacity(
          alpha,
        ),
      );

      // Row 1: Committed job-1 entry (present once send 1 lands)
      const r1Y = -170;
      const hasJob1 = showSend1.value > 0.3 || showJob1.value > 0.3;
      if (hasJob1) {
        const a1 = Math.max(showSend1.value, showJob1.value) * alpha;
        nodes.push(
          glowPill(`${OP.key} · ${OP.revision}  ->  ${OP.job}`, 400, r1Y, ROLE.sure, {
            size: 28,
            alpha: a1,
          }),
        );
      } else {
        nodes.push(
          txt(
            'Waiting for approved rollback...',
            400,
            r1Y,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      // Row 2: Active test probe against the ledger
      const r2Y = -15;
      if (showFreshKey.value > 0.3) {
        const fa = showFreshKey.value * alpha;
        nodes.push(
          glowPill(`fresh key ${OP.altKey} · ${OP.revision}`, 400, r2Y, ROLE.mark, {
            size: 28,
            alpha: fa,
          }),
        );
        if (showJob2.value > 0.5) {
          nodes.push(
            glowArrow(400, r2Y + 38, 400, r2Y + 110, ROLE.fail, { width: 3.5, alpha: fa }),
            glowPill(`NO MATCH -> creates ${OP.job2} (2 queued jobs!)`, 400, r2Y + 152, ROLE.fail, {
              size: 28,
              alpha: showJob2.value * alpha,
            }),
          );
        } else if (showAsk.value > 0.5) {
          nodes.push(
            txt(
              'How many queued jobs will this controller have?',
              400,
              r2Y + 110,
              32,
              ROLE.mark,
              'serif',
              'center',
            )
              .glow(7, ROLE.mark)
              .opacity(showAsk.value * alpha),
            circle(36, {
              fill: hexAlpha(ROLE.mark, 0.14 * alpha),
              stroke: ROLE.mark,
              width: 3,
              dash: [6, 5],
            }).at(400, r2Y + 185),
            txt('?', 400, r2Y + 185, 34, ROLE.mark, 'mono', 'center').opacity(
              showAsk.value * alpha,
            ),
          );
        }
      } else if (showConflict.value > 0.3) {
        const ca = showConflict.value * alpha;
        nodes.push(
          glowPill(`same key ${OP.key} · ${OP.badRevision}`, 400, r2Y, ROLE.fail, {
            size: 28,
            alpha: ca,
          }),
          glowCross(400, r2Y + 78, 34, ROLE.fail, ca),
          txt(
            `CONFLICT: stored target is ${OP.revision}, not ${OP.badRevision}`,
            400,
            r2Y + 140,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(ca),
        );
      } else if (showReplay.value > 0.3) {
        const ra = showReplay.value * alpha;
        nodes.push(
          glowPill(`trace-2 · ${OP.key} · ${OP.revision}`, 400, r2Y, ROLE.agent, {
            size: 28,
            alpha: ra,
          }),
          glowArrow(400, r2Y + 38, 400, r2Y + 106, ROLE.sure, { width: 3.5, alpha: ra }),
          glowPill(`MATCH -> returns existing ${OP.job}`, 400, r2Y + 148, ROLE.sure, {
            size: 28,
            alpha: ra,
          }),
        );
      } else if (showSend2.value > 0.3) {
        nodes.push(
          glowPill(`retry: trace-2 keeps ${OP.key}`, 400, r2Y, ROLE.agent, {
            size: 28,
            alpha: showSend2.value * alpha,
          }),
        );
      } else {
        nodes.push(
          txt(
            'Send 1 reply lost -> retry rotates trace only.',
            400,
            r2Y + 60,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'ROTATE TRACE PER TRIP · KEEP OP KEY ACROSS RETRIES',
          showJob2.value > 0.5
            ? 'NEW KEY -> DUPLICATE JOB-2'
            : showConflict.value > 0.5 && showFreshKey.value < 0.5
              ? 'PAYLOAD DRIFT -> CONFLICT'
              : 'SAME KEY + PAYLOAD -> JOB-1',
          {
            accent:
              showJob2.value > 0.5 || (showConflict.value > 0.5 && showFreshKey.value < 0.5)
                ? ROLE.fail
                : ROLE.op,
            alpha,
          },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.op, ROLE.agent), title, layer);

  playCue(s, c, 'logical-key', (d) => s.play(showKey.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'same-payload', (d) => s.play(showPayload.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'across-attempts', (d) => s.play(showKey.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'attempt-traces', (d) => s.play(showSend1.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'same-key', (d) => s.play(showSend2.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'accepted-job', (d) => s.play(showJob1.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'third-identity', (d) => s.play(showThreeIds.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'enforces', (d) => s.play(showReplay.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'same-key-replay', (d) => s.play(showReplay.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'changed-target', (d) => s.play(showConflict.to(0.65, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'conflict', (d) => s.play(showConflict.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'random-key', (d) => s.play(showFreshKey.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'job-count-question', (d) => s.play(showAsk.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding: reveal 2 jobs ONLY AFTER 'new-job'!
  playCue(s, c, 'new-job', (d) => s.play(showJob2.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
