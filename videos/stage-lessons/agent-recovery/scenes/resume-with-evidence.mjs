// Scene 8: resume-with-evidence - "Where is the job after a restart?"
// Checkpoint recovery beacon (key + rev-17), controller ledger reconciliation -> job-1 queued at 990s,
// clock at 1000s, strictly withholding "10 seconds ago" until 'age' ({ after: true }).
import { line } from 'vizmatic/stage';
import {
  BOUNDED_CLAIM,
  COSMOS,
  OBSERVATION,
  OP,
  ROLE,
  actorOrb,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowDot,
  glowPill,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function resumeWithEvidence(s, c) {
  const title = heroTitle(['Where is the job after', 'a restart?'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.sure,
  });

  const amb = ambientClock(s, c);
  const showCheckpoint = s.value(0);
  const askJob = s.value(0);
  const lookupProg = s.value(0);
  const showJob1 = s.value(0);
  const showObsTime = s.value(0);
  const showNowTime = s.value(0);
  const revealAge = s.value(0); // STRICTLY AFTER 'age'!
  const showClaim = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const nodes = [];

      // Upper exchange: Restarted Agent <-> Controller Ledger (y = -135)
      const topY = -135;
      const ax = -620;
      const cx = 620;

      nodes.push(
        actorOrb(ax, topY, 64, ROLE.violet, 'Restarted', 'checkpoint loaded', {
          alpha,
          active: showCheckpoint.value > 0.3,
        }),
        actorOrb(cx, topY, 68, ROLE.controller, 'Controller', 'authoritative ledger', {
          alpha,
          active: showJob1.value > 0.3,
        }),
        glowArrow(ax + 86, topY - 22, cx - 86, topY - 22, hexAlpha(ROLE.agent, 0.42 * alpha), {
          width: 2.6,
          alpha,
        }),
        glowArrow(cx - 86, topY + 26, ax + 86, topY + 26, hexAlpha(ROLE.sure, 0.42 * alpha), {
          width: 2.6,
          alpha,
        }),
      );

      // Checkpoint data pills under Restarted Agent
      if (showCheckpoint.value > 0.05) {
        nodes.push(
          glowPill(`key: ${OP.key} · ${OP.revision}`, -440, -295, ROLE.op, {
            size: 26,
            alpha: showCheckpoint.value * alpha,
          }),
        );
      }

      // Question 1 hold: Where can it find the job ID?
      if (askJob.value > 0.3 && lookupProg.value < 0.25) {
        nodes.push(
          txt('Where can it find the job ID?', 0, topY - 125, 32, ROLE.mark, 'serif', 'center')
            .glow(7, ROLE.mark)
            .opacity(askJob.value * alpha * (0.8 + 0.2 * pulse)),
        );
      }

      // Lookup & reply pulses
      if (lookupProg.value > 0.05) {
        const px = ax + 86 + (cx - 86 - (ax + 86)) * lookupProg.value;
        nodes.push(
          glowingTrail(
            [
              [ax + 86, topY - 22],
              [px, topY - 22],
            ],
            { color: ROLE.agent, width: 5, glow: 10, opacity: alpha },
          ),
          glowDot(px, topY - 22, { radius: 10, color: ROLE.agent, glow: 14, opacity: alpha }),
          glowPill(`lookup(${OP.key})`, 0, topY - 76, ROLE.agent, { size: 26, alpha }),
        );
      }

      if (showJob1.value > 0.3) {
        nodes.push(
          glowPill(`${OP.job} · ${OP.state}`, 0, topY + 80, ROLE.sure, {
            size: 28,
            alpha: showJob1.value * alpha,
          }),
        );
      }

      // Lower timeline: Clock Ruler (970s .. 1010s) at y = 175
      const tlY = 175;
      const x0 = -640;
      const x1 = 640;
      const xOf = (sec) => x0 + ((x1 - x0) * (sec - 970)) / 40;

      nodes.push(
        txt('OBSERVATION CLOCK (SECONDS)', 0, tlY - 82, 26, COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
        line([x0, tlY], [x1, tlY], { stroke: '#4a5c88', width: 4 }).opacity(alpha),
      );

      for (const tick of [970, 980, 990, 1000, 1010]) {
        const tx = xOf(tick);
        nodes.push(
          line([tx, tlY - 12], [tx, tlY + 12], { stroke: COSMOS.muted, width: 2.5 }).opacity(alpha),
          txt(`${tick}s`, tx, tlY + 42, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        );
      }

      const obsX = xOf(OBSERVATION.observedAt);
      const nowX = xOf(1000);

      if (showObsTime.value > 0.2) {
        const oa = showObsTime.value * alpha;
        nodes.push(
          glowDot(obsX, tlY, { radius: 12, color: ROLE.sure, glow: 14, opacity: oa }),
          txt(
            `observed: ${OBSERVATION.observedAt}s`,
            obsX - 110,
            tlY - 52,
            26,
            ROLE.sure,
            'mono',
            'center',
          ).opacity(oa),
        );
      }

      if (showNowTime.value > 0.2) {
        const na = showNowTime.value * alpha;
        nodes.push(
          glowDot(nowX, tlY, { radius: 12, color: ROLE.agent, glow: 14, opacity: na }),
          txt('now: 1000s', nowX + 100, tlY - 52, 26, ROLE.agent, 'mono', 'center').opacity(na),
        );
      }

      // Span highlight between 990s and 1000s (strictly withhold "10s" until revealAge > 0.5!)
      if (revealAge.value > 0.5) {
        const aa = revealAge.value * alpha;
        nodes.push(
          glowingTrail(
            [
              [obsX, tlY],
              [nowX, tlY],
            ],
            { color: ROLE.mark, width: 8, glow: 12, opacity: aa },
          ),
          glowPill(`age = ${BOUNDED_CLAIM.age} s`, (obsX + nowX) / 2, tlY + 86, ROLE.mark, {
            size: 26,
            alpha: aa,
          }),
        );
      } else if (showNowTime.value > 0.5) {
        nodes.push(
          line([obsX, tlY], [nowX, tlY], { stroke: ROLE.mark, width: 5, dash: [8, 6] }).opacity(
            showNowTime.value * alpha,
          ),
          txt('?', (obsX + nowX) / 2, tlY - 40, 32, ROLE.mark, 'mono', 'center').opacity(
            showNowTime.value * alpha * (0.75 + 0.25 * pulse),
          ),
        );
      }

      // Bottom readout / prediction prompt
      const capY = 335;
      if (revealAge.value > 0.5 || showClaim.value > 0.5) {
        nodes.push(
          glowPill('Report: "job-1 was queued 10s ago" (save t = 990s)', 0, capY, ROLE.sure, {
            size: 28,
            alpha: Math.max(revealAge.value, showClaim.value) * alpha,
          }),
        );
      } else if (showNowTime.value > 0.5) {
        nodes.push(
          txt('How old is that observation?', 0, capY, 34, ROLE.mark, 'serif', 'center')
            .glow(7, ROLE.mark)
            .opacity(showNowTime.value * alpha),
        );
      } else {
        nodes.push(
          txt(
            'A durable checkpoint keeps the operation key across process restarts.',
            0,
            capY,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          `CHECKPOINT: ${OP.key} -> LEDGER LOOKUP`,
          revealAge.value > 0.5 ? 'DATED: QUEUED 10s AGO (990s)' : 'RECONCILE & DATE OBSERVATION',
          { accent: revealAge.value > 0.5 ? ROLE.sure : ROLE.agent, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.violet, ROLE.sure), title, layer);

  playCue(s, c, 'pending-identity', (d) => s.play(showCheckpoint.to(0.6, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'verified-inputs', (d) => s.play(showCheckpoint.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'job-question', (d) => s.play(askJob.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'reconcile-controller', (d) => s.play(lookupProg.to(1, { duration: d })), {
    dur: 0.75,
  });
  playCue(s, c, 'check-state', (d) => s.play(showJob1.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'current-status', (d) => s.play(showJob1.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'observed-at', (d) => s.play(showObsTime.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'current-time', (d) => s.play(showNowTime.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding: reveal 10s age ONLY AFTER 'age'!
  playCue(s, c, 'age', (d) => s.play(revealAge.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'bounded-claim', (d) => s.play(showClaim.to(1, { duration: d })), { dur: 0.45 });
}
