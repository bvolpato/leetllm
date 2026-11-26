// Scene 11: observation-loop - Return the result to the request that made it
// 4-Station Luminous Round-Trip Conduit (Call read-7 -> Service -> Linked Observation -> Turn 2)
// transitioning into an Untrusted Data Quarantine that blocks embedded prompt injection!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  gateNode,
  guardedDynamic,
  hexGate,
  observationTrace,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function observationLoop(s, c) {
  const trace = observationTrace();
  const pulse = s.value(0);
  const callOn = s.value(0);
  const countOn = s.value(0);
  const recordOn = s.value(0);
  const attachOn = s.value(0);
  const turn2On = s.value(0);
  const fieldsOn = s.value(0);
  const untrustedMode = s.value(0);
  const writePropOn = s.value(0);
  const policyGateOn = s.value(0);

  const header = cinemaHeader(
    'LINKED OBSERVATION LOOP',
    'Return each result to',
    'the call that made it',
    { accent: ROLE.runtime, size: 48 },
  );

  const stageAura = aura(100, 40, 640, '#5ce1e622', '#fb923c1a');

  // Acts 0-1: Round-trip call_id linkage & 4 distinct metadata dimensions
  const loopAct = guardedDynamic(
    () => fadeOutHalf(untrustedMode.value),
    (a) => {
      const p = pulse.value;
      const cl = callOn.value;
      const ct = countOn.value;
      const rc = recordOn.value;
      const at = attachOn.value;
      const t2 = turn2On.value;
      const fd = fieldsOn.value;
      const nodes = [];

      const p1 = [-680, -70];
      const p2 = [-225, -70];
      const p3 = [225, -70];
      const p4 = [680, -70];

      nodes.push(
        gateNode(p1[0], p1[1], 'CALL', ROLE.proposal, {
          radius: 56,
          sub: `${trace.call.call_id} (B7)`,
          opacity: a,
          glow: cl > 0.3 ? 12 : 6,
        }),
        gateNode(p2[0], p2[1], 'SERVICE', ROLE.server, {
          radius: 56,
          sub: ct > 0.35 ? `${trace.serviceResult.available_copies} copies` : 'library API',
          opacity: a,
          glow: ct > 0.35 ? 12 : 6,
        }),
        gateNode(p3[0], p3[1], 'RECORD', at > 0.35 ? ROLE.key : ROLE.runtime, {
          radius: 56,
          sub: at > 0.35 ? 'id: read-7' : rc > 0.35 ? 'outcome saved' : 'pending',
          opacity: a,
          glow: rc > 0.35 ? 12 : 5,
        }),
        gateNode(p4[0], p4[1], 'TURN 2', t2 > 0.35 ? ROLE.ok : COSMOS.dim, {
          radius: 56,
          sub: t2 > 0.35 ? '3 copies answer' : 'awaiting obs',
          opacity: a,
          glow: t2 > 0.35 ? 12 : 3,
        }),
      );

      const [a0, a1] = trimSeg(p1, p2, 66, 66);
      const [b0, b1] = trimSeg(p2, p3, 66, 66);
      const [c0, c1] = trimSeg(p3, p4, 66, 66);
      nodes.push(
        beamWithPhotons([a0, a1], ROLE.proposal, p * 1.1, {
          alpha: a * (0.35 + cl * 0.65),
          width: 3.5,
        }),
        beamWithPhotons([b0, b1], ROLE.server, p * 1.1 + 0.3, {
          alpha: a * (0.25 + rc * 0.75),
          width: 3.5,
        }),
        beamWithPhotons([c0, c1], ROLE.ok, p * 1.1 + 0.6, {
          alpha: a * (0.2 + t2 * 0.8),
          width: 3.5,
        }),
      );

      // Matching call_id arc directly from CALL to RECORD
      if (at > 0.05) {
        const linkArc = quadArcPts([p1[0], p1[1] - 102], [p3[0], p3[1] - 102], -68);
        nodes.push(
          beamWithPhotons(linkArc, ROLE.key, p * 1.3, { alpha: a * at, width: 3.6 }),
          txt('call_id MATCH: "read-7" == "read-7"', -225, -268, 28, ROLE.key, 'mono', 'center')
            .glow(8, ROLE.key)
            .opacity(a * at),
        );
      }

      // Bottom 4 distinct observation channels
      const chY = 235;
      const chOp = 0.4 + fd * 0.6;
      const dims = [
        [-640, 'TRANSPORT', 'success (HTTP OK)', ROLE.ok],
        [-215, 'BUSINESS', '3 copies (or 0!)', ROLE.runtime],
        [215, 'SOURCE', 'library service', ROLE.proposal],
        [640, 'RETRIEVED', 'timestamped now', ROLE.key],
      ];
      nodes.push(
        line([-855, 118], [840, 118], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'KEEP FOUR OBSERVATION DIMENSIONS DISTINCT',
          0,
          158,
          26,
          fd > 0.35 ? ROLE.runtime : COSMOS.muted,
          'mono',
          'center',
        ).opacity(a * chOp),
      );
      dims.forEach(([x, k, v, col]) => {
        nodes.push(
          energyRail(x - 165, chY - 12, chY + 72, col, { opacity: a * chOp }),
          txt(k, x - 140, chY + 6, 26, col, 'mono', 'left').opacity(a * chOp),
          txt(v, x - 140, chY + 52, 26, COSMOS.ink, 'sans', 'left').opacity(a * chOp),
        );
      });

      return group(...nodes);
    },
  );

  // Act 2: Untrusted Data Quarantine against Indirect Prompt Injection
  const quarantineAct = guardedDynamic(
    () => fadeInHalf(untrustedMode.value),
    (a) => {
      const p = pulse.value;
      const wp = writePropOn.value;
      const pg = policyGateOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'UNTRUSTED OBSERVATION QUARANTINE',
          -855,
          -210,
          28,
          ROLE.untrusted,
          'mono',
          'left',
        ).opacity(a),
        // Untrusted payload on left
        energyRail(-855, -145, 70, ROLE.untrusted, { opacity: a }),
        txt(
          'BOOK DESCRIPTION (DATA, NOT POLICY)',
          -825,
          -125,
          26,
          ROLE.untrusted,
          'mono',
          'left',
        ).opacity(a),
        txt(`"${trace.serviceResult.description}"`, -825, -62, 34, ROLE.fail, 'serif', 'left')
          .glow(7, ROLE.fail)
          .opacity(a),
        txt(
          'Attacker-controlled text supplies ZERO authority',
          -825,
          4,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      // Proposed write -> Policy Boundary Circuit Breaker
      const wOp = 0.4 + wp * 0.6;
      const gOp = 0.4 + pg * 0.6;
      nodes.push(
        beamWithPhotons(
          [
            [-210, -40],
            [40, -40],
          ],
          ROLE.untrusted,
          p * 1.2,
          { alpha: a * wOp, width: 3.4 },
        ),
        hexGate(135, -40, 80, ROLE.proposal, {
          label: 'WRITE?',
          sub: 'place_hold(B7)',
          opacity: a * wOp,
        }),
        beamWithPhotons(
          [
            [230, -40],
            [425, -40],
          ],
          ROLE.denied,
          p * 1.2 + 0.4,
          { alpha: a * gOp, width: 3.4 },
        ),
        circuitBreaker(510, -40, 115, pg > 0.35 ? 1 : 0.6, ROLE.ok, { opacity: a * gOp }),
        txt('POLICY BOUNDARY', 510, -135, 26, ROLE.session, 'mono', 'center').opacity(a * gOp),
        txt(
          pg > 0.35 ? 'TRUSTED INPUTS ONLY' : 'CHECKS GRANT',
          510,
          45,
          26,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a * gOp),
        line([-855, 195], [840, 195], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Allowed ONLY with trusted caller grant · Denied without trusted grant',
          0,
          275,
          30,
          ROLE.ok,
          'mono',
          'center',
        )
          .glow(6, ROLE.ok)
          .opacity(a * gOp),
        txt(
          'Observations inform reasoning; trusted runtime state governs every write',
          0,
          345,
          28,
          COSMOS.muted,
          'serif',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, loopAct, quarantineAct);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('observation-loop-beat-1-focus-1', () => {
    s.play(
      callOn.to(1, { duration: clampDur(c, c.cue('observation-loop-beat-1-focus-1').start, 0.3) }),
    );
  });
  c.on('observation-receive-count', () => {
    s.play(countOn.to(1, { duration: clampDur(c, c.cue('observation-receive-count').start, 0.3) }));
  });
  c.on('observation-record-outcome', () => {
    s.play(
      recordOn.to(1, { duration: clampDur(c, c.cue('observation-record-outcome').start, 0.3) }),
    );
  });
  c.on('observation-attach-call-id', () => {
    s.play(
      attachOn.to(1, { duration: clampDur(c, c.cue('observation-attach-call-id').start, 0.35) }),
    );
  });
  c.on('observation-loop-beat-2-focus-1', () => {
    s.play(
      turn2On.to(1, {
        duration: clampDur(c, c.cue('observation-loop-beat-2-focus-1').start, 0.35),
      }),
    );
  });
  c.on('observation-loop-beat-2-focus-2', () => {
    s.play(
      fieldsOn.to(1, {
        duration: clampDur(c, c.cue('observation-loop-beat-2-focus-2').start, 0.35),
      }),
    );
  });
  c.on('observation-untrusted-description', () => {
    s.play(
      untrustedMode.to(1, {
        duration: clampDur(c, c.cue('observation-untrusted-description').start, 0.35),
      }),
    );
  });
  c.on('observation-write-proposal', () => {
    s.play(
      writePropOn.to(1, { duration: clampDur(c, c.cue('observation-write-proposal').start, 0.35) }),
    );
  });
  c.on('observation-policy-gate', () => {
    s.play(
      policyGateOn.to(1, { duration: clampDur(c, c.cue('observation-policy-gate').start, 0.35) }),
    );
  });
}
