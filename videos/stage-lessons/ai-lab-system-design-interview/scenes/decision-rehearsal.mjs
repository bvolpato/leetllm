// Scene 26: decision-rehearsal - What would make you move the queue?
// Shared queue before fork vs split per-route queue when Route B drops to 100 ms budget,
// alongside the 45-minute interview pacing clock (0-14, 14-28, 28-45) & support-engineer audit!
import { group, line, rect } from 'vizmatic/stage';
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

export default function decisionRehearsal(s, c) {
  const phase = s.value(0);
  const splitOn = s.value(0); // STRICT after rehearsal-split!
  const clockOn = s.value(0);
  const lookupOn = s.value(0);

  const header = cinemaHeader(
    'INTERVIEW TRADE-OFF REHEARSAL',
    'What would make you',
    'move the queue?',
    {
      x: -860,
      y: -445,
      accent: ROLE.req,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const sp = splitOn.value;
      const cl = clockOn.value;
      const lk = lookupOn.value;
      const nodes = [];

      // Top diagram: Shared Queue before Fork -> Splits into Route A (250ms) & Route B (100ms)!
      const yTop = -95;
      if (sp < 0.45) {
        const qPt = [-440, yTop];
        const aPt = [240, yTop - 70];
        const bPt = [240, yTop + 70];
        const nQ = sysNode(qPt[0], qPt[1], 'SHARED Q', ROLE.req, {
          radius: 74,
          sub: 'same 250 ms budget',
        });
        const nA = sysNode(aPt[0], aPt[1], 'ROUTE A', ROLE.worker, { radius: 58 });
        const nB = sysNode(bPt[0], bPt[1], 'ROUTE B', ROLE.policy, { radius: 58 });
        const [ea1, ea2] = trimSeg(qPt, aPt, nQ.r + 14, nA.r + 14);
        const [eb1, eb2] = trimSeg(qPt, bPt, nQ.r + 14, nB.r + 14);
        nodes.push(
          beamWithPhotons([ea1, ea2], ROLE.req, p, { width: 3.6, photonCount: 1 }),
          beamWithPhotons([eb1, eb2], ROLE.policy, p + 0.5, { width: 3.6, photonCount: 1 }),
          nQ.node,
          nA.node,
          nB.node,
          txt('One owner enforces shared limit', 560, yTop, 26, COSMOS.muted, 'mono', 'center'),
        );
      } else {
        const fPt = [-540, yTop];
        const qaPt = [-80, yTop - 75];
        const qbPt = [-80, yTop + 75];
        const nF = sysNode(fPt[0], fPt[1], 'FORK', ROLE.focus, { radius: 60 });
        const nQa = sysNode(qaPt[0], qaPt[1], 'Q-A 250ms', ROLE.worker, { radius: 74 });
        const nQb = sysNode(qbPt[0], qbPt[1], 'Q-B 100ms', ROLE.ok, { radius: 74 });
        const [ea1, ea2] = trimSeg(fPt, qaPt, nF.r + 14, nQa.r + 14);
        const [eb1, eb2] = trimSeg(fPt, qbPt, nF.r + 14, nQb.r + 14);
        nodes.push(
          beamWithPhotons([ea1, ea2], ROLE.worker, p, { width: 3.6, photonCount: 1 }),
          beamWithPhotons([eb1, eb2], ROLE.ok, p + 0.5, { width: 4, photonCount: 2 }),
          nF.node,
          nQa.node,
          nQb.node,
          txt('SPLIT QUEUES: slow route cannot', 460, yTop - 22, 26, ROLE.ok, 'mono', 'center'),
          txt('fill fast 100 ms route’s line!', 460, yTop + 26, 26, ROLE.ok, 'mono', 'center'),
        );
      }

      // Middle: 45-Minute Practice Clock (0-14 | 14-28 | 28-45)
      const cY = 145;
      const cAlpha = 0.45 + cl * 0.55;
      nodes.push(
        line([-840, 62], [840, 62], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          '45-MINUTE INTERVIEW BOARD PACING',
          -820,
          cY - 48,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(cAlpha),
        rect(480, 54, { fill: '#0b1428', stroke: ROLE.req, width: 3, radius: 8 })
          .at(-580, cY + 14)
          .opacity(cAlpha),
        txt('0-14m: User · SLO · Math', -580, cY + 14, 26, ROLE.req, 'mono', 'center').opacity(
          cAlpha,
        ),
        rect(500, 54, { fill: '#0b1428', stroke: ROLE.ok, width: 3, radius: 8 })
          .at(-40, cY + 14)
          .opacity(cAlpha),
        txt('14-28m: API · Path · Writes', -40, cY + 14, 26, ROLE.ok, 'mono', 'center').opacity(
          cAlpha,
        ),
        rect(540, 54, { fill: '#0b1428', stroke: ROLE.policy, width: 3, radius: 8 })
          .at(530, cY + 14)
          .opacity(cAlpha),
        txt(
          '28-45m: Failure · Gate · Trade-off',
          530,
          cY + 14,
          26,
          ROLE.policy,
          'mono',
          'center',
        ).opacity(cAlpha),
      );

      // Bottom: Support-engineer self-audit before leaving the board
      const lAlpha = 0.45 + lk * 0.55;
      nodes.push(
        txt(
          'SUPPORT AUDIT: Explain rejection from ID · Metric units & owner · Cache ACL · Bad release · Write recovery',
          0,
          315,
          26,
          lk > 0.4 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ).opacity(lAlpha),
        txt('STATE WHAT CHANGES YOUR MIND', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Log rejected option + trigger condition',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.req,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.after('rehearsal-split', () => {
    s.play(splitOn.to(1, { duration: clampDur(c, c.cue('rehearsal-split').end, 0.4) }));
  });
  c.on('rehearsal-size', () => {
    s.play(clockOn.to(1, { duration: clampDur(c, c.cue('rehearsal-size').start, 0.35) }));
  });
  c.on('rehearsal-lookup', () => {
    s.play(lookupOn.to(1, { duration: clampDur(c, c.cue('rehearsal-lookup').start, 0.35) }));
  });
}
