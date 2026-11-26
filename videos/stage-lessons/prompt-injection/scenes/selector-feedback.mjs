// Scene 10: selector-feedback - A later result must not rewrite a committed action
// Contrasts the one-way Action-Selector DAG (pre-committed summary pipeline with a
// tripped circuit-breaker blocking tool-result feedback) against a vulnerable recurrent
// allowlist loop where hostile text selects an allowlisted promotion or email exfil.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNodeRadius,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  driftValue,
  gateNode,
  guardedDynamic,
  hexGate,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function selectorFeedback(s, c) {
  const pulse = s.value(0);
  const dagHi = s.value(0);
  const loopHi = s.value(0);

  const header = cinemaHeader(
    'ACTION-SELECTOR CONTROL FLOW',
    'A later result must not',
    'rewrite a committed action',
    { accent: ROLE.ok, size: 48 },
  );

  const stageAura = aura(80, 30, 620, '#6ee7b71a', '#ff6b8b18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const dh = dagHi.value;
      const lh = loopHi.value;
      const nodes = [];

      // Top Lane: One-way Action-Selector Pattern (compact labels so rings stay clean!)
      const topY = -98;
      const nReq = [-680, topY];
      const nSel = [-250, topY];
      const nRun = [195, topY];
      const nOut = [650, topY];

      const rReq = autoNodeRadius('REQ', 48);
      const rSel = autoNodeRadius('SELECT', 48);
      const rRun = autoNodeRadius('READER', 48);
      const rOut = autoNodeRadius('OUTPUT', 48);

      nodes.push(
        txt(
          'ACTION-SELECTOR PATTERN (ONE-WAY COMMITTED PLAN)',
          -855,
          -235,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
      );

      const s1 = trimSeg(nReq, nSel, rReq + 12, rSel + 12);
      const s2 = trimSeg(nSel, nRun, rSel + 12, rRun + 12);
      const s3 = trimSeg(nRun, nOut, rRun + 12, rOut + 12);

      nodes.push(
        beamWithPhotons(s1, ROLE.host, p * 0.9, { width: 3.4, alpha: 0.6 + dh * 0.4 }),
        beamWithPhotons(s2, ROLE.ok, p * 0.9 + 0.3, { width: 3.4, alpha: 0.6 + dh * 0.4 }),
        beamWithPhotons(s3, ROLE.ok, p * 0.9 + 0.6, { width: 3.4, alpha: 0.6 + dh * 0.4 }),
        gateNode(nReq[0], nReq[1], 'REQ', ROLE.host, { radius: 48, sub: 'SUMMARY ONLY' }),
        gateNode(nSel[0], nSel[1], 'SELECT', ROLE.ok, { radius: 48, sub: 'FIXED PLAN' }),
        gateNode(nRun[0], nRun[1], 'READER', ROLE.source, { radius: 48, sub: 'READS REPORT' }),
        gateNode(nOut[0], nOut[1], 'OUTPUT', ROLE.ok, { radius: 48, sub: 'FINAL EVIDENCE' }),
      );

      // Severed feedback circuit breaker between READER and SELECT
      nodes.push(
        circuitBreaker(-28, 32, 130, 1, ROLE.ok),
        txt('NO TOOL-RESULT FEEDBACK', -28, 72, 26, ROLE.denied, 'mono', 'center'),
      );

      // Divider
      nodes.push(line([-855, 114], [845, 114], { stroke: '#25355a', width: 2 }));

      // Bottom Lane: Vulnerable Recurrent Selector + Plain Tool Allowlist
      const botY = 260;
      const bAlpha = 0.42 + lh * 0.58;
      const mPos = [-520, botY];
      const tPos = [-20, botY];
      const pPos = [560, botY];
      const rM = autoNodeRadius('LOOP', 48);
      const rT = autoNodeRadius('TOOLS', 48);

      nodes.push(
        txt(
          'PLAIN TOOL-NAME ALLOWLIST (RE-SELECTS AFTER HOSTILE RESULT)',
          -855,
          144,
          26,
          lh > 0.3 ? ROLE.attack : COSMOS.muted,
          'mono',
          'left',
        ).opacity(bAlpha),
      );

      const fFwd = trimSeg(mPos, tPos, rM + 12, rT + 12);
      const fBad = trimSeg(tPos, pPos, rT + 12, 108);
      const loopBack = quadArcPts([tPos[0] - 58, botY - 58], [mPos[0] + 58, botY - 58], -52, 22);

      nodes.push(
        beamWithPhotons(fFwd, ROLE.untrusted, p * 1.1, { width: 3.4, alpha: bAlpha }),
        beamWithPhotons(loopBack, ROLE.attack, p * 1.2 + 0.3, { width: 3.2, alpha: bAlpha }),
        beamWithPhotons(fBad, ROLE.attack, p * 1.1 + 0.6, { width: 3.4, alpha: bAlpha }),
        gateNode(mPos[0], mPos[1], 'LOOP', ROLE.untrusted, {
          radius: 48,
          sub: 'READS HOSTILE TEXT',
          opacity: bAlpha,
        }),
        gateNode(tPos[0], tPos[1], 'TOOLS', ROLE.attack, {
          radius: 48,
          sub: 'PROMOTE / EMAIL',
          opacity: bAlpha,
        }),
        hexGate(pPos[0], pPos[1], 62, ROLE.denied, {
          label: 'BLOCKED',
          sub: 'POLICY & ARG CHECK',
          opacity: bAlpha,
        }),
        txt(
          'Even fixed send_email leaks via attacker-chosen recipient',
          -20,
          428,
          26,
          ROLE.untrusted,
          'mono',
          'center',
        ).opacity(bAlpha),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('pi-selector-feedback-0', () => {
    s.play(dagHi.to(1, { duration: clampDur(c, c.cue('pi-selector-feedback-0').start, 0.45) }));
  });
  c.on('pi-selector-feedback-1', () => {
    s.play(loopHi.to(1, { duration: clampDur(c, c.cue('pi-selector-feedback-1').start, 0.45) }));
  });
}
