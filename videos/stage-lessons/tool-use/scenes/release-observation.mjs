// Scene 2: release-observation - Why did the canary fail?
// Luminous Telemetry Conduit + Fixed 0-10% Error-Budget Laser Ruler + App vs Hosted Boundary.
// Strict prediction withholding on the excess gap (+6.1 pp) until AFTER `release-gap`!
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  RELEASE_OBS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  gateNode,
  glowDot,
  guardedDynamic,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function releaseObservation(s, c) {
  const pulse = s.value(0);
  const proposeOn = s.value(0);
  const readOn = s.value(0);
  const fileOn = s.value(0);
  const statusOn = s.value(0);
  const budgetOn = s.value(0);
  const rateOn = s.value(0);
  const askOn = s.value(0);
  const gapReveal = s.value(0);
  const hostOn = s.value(0);

  const header = cinemaHeader('LIVE DEPLOYMENT TELEMETRY', 'Why did the canary', 'for v16 fail?', {
    accent: ROLE.fail,
    size: 50,
  });

  const stageAura = aura(120, 40, 640, '#ff6b8b1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const pr = proposeOn.value;
      const rd = readOn.value;
      const fl = fileOn.value;
      const st = statusOn.value;
      const bg = budgetOn.value;
      const rt = rateOn.value;
      const ak = askOn.value;
      const gp = gapReveal.value;
      const hs = hostOn.value;
      const nodes = [];

      // Top telemetry flow (x: -100 -> 740, y: -285)
      const mPt = [-100, -285];
      const hPt = [320, -285];
      const sPt = [740, -285];

      nodes.push(
        gateNode(mPt[0], mPt[1], 'MODEL', ROLE.proposal, {
          radius: 56,
          sub: 'get_release_status',
          glow: pr > 0.3 ? 12 : 6,
        }),
        gateNode(hPt[0], hPt[1], 'HOST', ROLE.runtime, {
          radius: 56,
          sub: 'args + project',
          glow: rd > 0.3 ? 12 : 6,
        }),
        gateNode(sPt[0], sPt[1], 'API', ROLE.server, {
          radius: 56,
          sub: RELEASE_OBS.releaseId,
          glow: st > 0.3 ? 12 : 6,
        }),
      );

      // Beams between stations
      const [mh0, mh1] = trimSeg(mPt, hPt, 54, 54);
      const [hs0, hs1] = trimSeg(hPt, sPt, 54, 54);
      nodes.push(
        beamWithPhotons([mh0, mh1], ROLE.proposal, p * 1.1, {
          alpha: 0.35 + pr * 0.65,
          width: 3.4,
        }),
        beamWithPhotons([hs0, hs1], ROLE.runtime, p * 1.1 + 0.35, {
          alpha: 0.25 + rd * 0.75,
          width: 3.4,
        }),
      );

      if (fl > 0.05) {
        const retArc = quadArcPts([sPt[0], sPt[1] - 102], [mPt[0], mPt[1] - 102], -54);
        nodes.push(
          beamWithPhotons(retArc, ROLE.key, p * 1.25, { alpha: fl, width: 3.4 }),
          txt(`call_id: "${RELEASE_OBS.callId}"`, 320, -455, 26, ROLE.key, 'mono', 'center')
            .glow(7, ROLE.key)
            .opacity(fl),
        );
      }

      // Middle: Fixed 0% -> 10% Precision Error-Budget Laser Ruler (y: 20, x: -780 -> 780)
      const rLeft = -780;
      const rRight = 780;
      const rSpan = rRight - rLeft;
      const rY = 25;
      const xOf = (pct) => rLeft + (pct / 10) * rSpan;

      nodes.push(
        txt('FIXED ERROR-RATE RULER  (0% TO 10%)', -780, -95, 26, COSMOS.muted, 'mono', 'left'),
        line([rLeft, rY], [rRight, rY], { stroke: '#2d3f69', width: 5 }),
      );

      // Status badge on right of ruler title
      if (st > 0.05) {
        nodes.push(
          txt('STATUS: CANARY FAILED', 780, -95, 28, ROLE.fail, 'mono', 'right')
            .glow(8, ROLE.fail)
            .opacity(st),
        );
      }

      // Tick marks 0%, 2%, 4%, 6%, 8%, 10%
      for (let pct = 0; pct <= 10; pct += 2) {
        const tx = xOf(pct);
        nodes.push(
          line([tx, rY - 14], [tx, rY + 14], { stroke: '#4d6496', width: 2.4 }),
          txt(`${pct}%`, tx, rY + 46, 26, COSMOS.muted, 'mono', 'center'),
        );
      }

      const xBudget = xOf(RELEASE_OBS.budgetPct);
      const xObs = xOf(RELEASE_OBS.observedPct);

      // Allowed budget laser mark at 2.0%
      if (bg > 0.05) {
        nodes.push(
          line([xBudget, rY - 62], [xBudget, rY + 18], { stroke: ROLE.budget, width: 4.2 })
            .glow(10, ROLE.budget)
            .opacity(bg),
          glowDot(xBudget, rY, { radius: 8, color: ROLE.budget, glow: 14, opacity: bg }),
          txt('BUDGET: 2.0%', xBudget, rY - 90, 28, ROLE.budget, 'mono', 'center')
            .glow(6, ROLE.budget)
            .opacity(bg),
        );
      }

      // Observed error rate at 8.1%
      if (rt > 0.05) {
        nodes.push(
          line([xObs, rY - 62], [xObs, rY + 18], { stroke: ROLE.fail, width: 4.2 })
            .glow(10, ROLE.fail)
            .opacity(rt),
          glowDot(xObs, rY, { radius: 8.5, color: ROLE.fail, glow: 14, opacity: rt }),
          txt('OBSERVED: 8.1%', xObs, rY - 90, 28, ROLE.fail, 'mono', 'center')
            .glow(6, ROLE.fail)
            .opacity(rt),
        );
      }

      // Prediction gap span between 2.0% and 8.1%
      if (ak > 0.05 || gp > 0.05) {
        const midX = (xBudget + xObs) * 0.5;
        const beamCol = gp > 0.5 ? ROLE.runtime : ROLE.focus;
        nodes.push(
          beamWithPhotons(
            [
              [xBudget, rY],
              [xObs, rY],
            ],
            beamCol,
            p * 1.4,
            { alpha: Math.max(ak, gp), width: 6 },
          ),
          txt(
            gp > 0.5 ? '+6.1 PERCENTAGE POINTS ABOVE BUDGET' : '?  PERCENTAGE POINTS ABOVE BUDGET',
            midX,
            rY + 112,
            34,
            beamCol,
            'mono',
            'center',
          )
            .glow(8, beamCol)
            .opacity(Math.max(ak, gp)),
        );
      } else {
        nodes.push(
          circle(6, { fill: ROLE.runtime, stroke: null })
            .at(rLeft + ((p * 0.45) % 1) * rSpan, rY)
            .glow(10, ROLE.runtime),
        );
      }

      // Bottom execution-boundary comparison (always visible dim, illuminates on `release-host`)
      const bY = 275;
      const dimOp = 0.45 + hs * 0.55;
      nodes.push(
        energyRail(-840, bY - 40, bY + 95, ROLE.runtime, { opacity: dimOp }),
        txt('APPLICATION-HOSTED TOOL', -810, bY - 22, 26, ROLE.runtime, 'mono', 'left').opacity(
          dimOp,
        ),
        txt(
          'Runs in your runtime with your service credentials',
          -810,
          bY + 26,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(dimOp),
        txt(
          'Handles answers · multi-calls · invalid calls · refusals',
          -810,
          bY + 72,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(dimOp),
        energyRail(80, bY - 40, bY + 95, hs > 0.35 ? ROLE.caution : '#2c3d66', {
          opacity: 0.35 + hs * 0.65,
        }),
        txt(
          'PROVIDER-HOSTED TOOL',
          110,
          bY - 22,
          26,
          hs > 0.35 ? ROLE.caution : COSMOS.dim,
          'mono',
          'left',
        ).opacity(0.4 + hs * 0.6),
        txt(
          'Runs inside provider infrastructure',
          110,
          bY + 26,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(0.4 + hs * 0.6),
        txt(
          'Audit data crossing + credential reach',
          110,
          bY + 72,
          26,
          hs > 0.35 ? ROLE.caution : COSMOS.dim,
          'sans',
          'left',
        ).opacity(0.4 + hs * 0.6),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('release-propose', () => {
    s.play(proposeOn.to(1, { duration: clampDur(c, c.cue('release-propose').start, 0.3) }));
  });
  c.on('release-read', () => {
    s.play(readOn.to(1, { duration: clampDur(c, c.cue('release-read').start, 0.3) }));
  });
  c.on('release-file', () => {
    s.play(fileOn.to(1, { duration: clampDur(c, c.cue('release-file').start, 0.3) }));
  });
  c.on('release-status', () => {
    s.play(statusOn.to(1, { duration: clampDur(c, c.cue('release-status').start, 0.3) }));
  });
  c.on('release-budget', () => {
    s.play(budgetOn.to(1, { duration: clampDur(c, c.cue('release-budget').start, 0.35) }));
  });
  c.on('release-rate', () => {
    s.play(rateOn.to(1, { duration: clampDur(c, c.cue('release-rate').start, 0.35) }));
  });
  c.on('release-ask', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('release-ask').start, 0.3) }));
  });
  // Strict prediction withholding: reveal +6.1 pp AFTER spoken answer!
  c.after('release-gap', () => {
    s.play(gapReveal.to(1, { duration: clampDur(c, c.cue('release-gap').end, 0.35) }));
  });
  c.on('release-host', () => {
    s.play(hostOn.to(1, { duration: clampDur(c, c.cue('release-host').start, 0.35) }));
  });
}
