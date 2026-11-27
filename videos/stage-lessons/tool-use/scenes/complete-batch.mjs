// Scene 5: complete-batch - Collect and validate the whole batch before dispatch
// Dual-call UTF-8 fragment collector feeding one atomic Whole-Batch Circuit Breaker:
// Call 1 is valid, Call 2 truncates at `{"release_id":` -> breaker snaps open blocking BOTH!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  gateNode,
  glowMeter,
  guardedDynamic,
  hexGate,
  txt,
} from '../parts.mjs';

export default function completeBatch(s, c) {
  const pulse = s.value(0);
  const statusOn = s.value(0);
  const byteCapOn = s.value(0);
  const lateFailMode = s.value(0);
  const rejectAllOn = s.value(0);
  const zeroMode = s.value(0);
  const zeroDetailOn = s.value(0);

  const header = cinemaHeader(
    'ATOMIC BATCH ADAPTER',
    'Validate the whole batch',
    'before any dispatch',
    { accent: ROLE.runtime, size: 48 },
  );

  const stageAura = aura(150, 40, 620, '#5ce1e620', '#ff6b8b18');

  // Acts 0-1: Gate stack + Dual-Call Whole-Batch Breaker
  const mainAct = guardedDynamic(
    () => fadeOutHalf(zeroMode.value),
    (a) => {
      const p = 0;
      const st = statusOn.value;
      const bc = byteCapOn.value;
      const lf = lateFailMode.value;
      const rj = rejectAllOn.value;
      const nodes = [];

      // Left column: 5 independent adapter gates
      const gates = [
        ['response.status == "completed"', st > 0.3 ? ROLE.ok : ROLE.runtime],
        ['each call.status == "completed"', st > 0.3 ? ROLE.ok : ROLE.runtime],
        ['unique non-empty call_id', ROLE.key],
        ['tool in allowlist', ROLE.proposal],
        ['args UTF-8 <= 2048 B + strict model', bc > 0.3 ? ROLE.budget : ROLE.runtime],
      ];
      nodes.push(
        txt('INDEPENDENT ADAPTER GATES', -855, -210, 26, ROLE.runtime, 'mono', 'left').opacity(a),
      );
      gates.forEach(([label, col], i) => {
        const y = -145 + i * 68;
        nodes.push(
          energyRail(-855, y - 16, y + 18, col, { width: 4.5, opacity: a }),
          txt(label, -825, y, 26, COSMOS.ink, 'mono', 'left').opacity(a),
        );
      });

      // Right area: Dual Call Streams -> Whole-Batch Breaker -> Service
      const c1Y = -145;
      const c2Y = 65;
      const breakerX = 505;
      const serviceX = 775;

      // Call 1 (complete, valid)
      nodes.push(
        energyRail(-165, c1Y - 48, c1Y + 56, ROLE.ok, { opacity: a }),
        txt('CALL 1 · status-1 · OK', -135, c1Y - 30, 26, ROLE.ok, 'mono', 'left').opacity(a),
        txt('{"release_id":"v16"}', -135, c1Y + 24, 26, COSMOS.ink, 'mono', 'left').opacity(a),
        beamWithPhotons(
          [
            [295, c1Y + 6],
            [425, -40],
          ],
          rj > 0.4 ? ROLE.fail : ROLE.ok,
          p * 1.1,
          { alpha: a, width: 3.4 },
        ),
      );

      // Call 2 (switches to truncated in Beat 1!)
      const c2Col = lf > 0.35 ? ROLE.fail : ROLE.runtime;
      nodes.push(
        energyRail(-165, c2Y - 48, c2Y + 62, c2Col, { opacity: a }),
        txt(
          lf > 0.35 ? 'CALL 2 · INCOMPLETE' : 'CALL 2 · COLLECTING',
          -135,
          c2Y - 30,
          26,
          c2Col,
          'mono',
          'left',
        ).opacity(a),
        txt(
          lf > 0.35 ? '{"release_id": [CUT]' : '{"release_id":"v17"}',
          -135,
          c2Y + 24,
          26,
          lf > 0.35 ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(lf > 0.35 ? 7 : 0, ROLE.fail)
          .opacity(a),
        beamWithPhotons(
          [
            [295, c2Y + 6],
            [425, -40],
          ],
          c2Col,
          p * 1.1 + 0.4,
          { alpha: a, width: 3.4 },
        ),
      );

      // Whole-Batch Circuit Breaker + Target Service
      const tripped = rj > 0.4 ? 1 : 0;
      nodes.push(
        circuitBreaker(breakerX, -40, 120, tripped, ROLE.ok, { opacity: a }),
        txt(
          'BATCH GATE',
          breakerX,
          -135,
          26,
          tripped ? ROLE.fail : ROLE.runtime,
          'mono',
          'center',
        ).opacity(a),
        gateNode(serviceX, -40, 'SERVICE', tripped ? COSMOS.dim : ROLE.server, {
          radius: 54,
          sub: tripped ? '0 DISPATCHED' : 'AWAITING',
          opacity: a,
          glow: tripped ? 2 : 10,
        }),
      );

      // Bottom UTF-8 byte collector meter + rejection verdict
      nodes.push(
        txt('UTF-8 ARGUMENT CAP (2,048 BYTES)', -855, 250, 26, ROLE.budget, 'mono', 'left').opacity(
          a,
        ),
        glowMeter(-855, 298, 700, 26, bc > 0.35 ? 0.14 : 0.08, {
          fill: ROLE.budget,
          opacity: a,
        }),
        txt(
          rj > 0.4
            ? 'BATCH REJECTED: CALL 1 NEVER REACHES SERVICE'
            : 'NO PARTIAL DISPATCH BEFORE EVERY CALL VALIDATES',
          360,
          298,
          28,
          rj > 0.4 ? ROLE.fail : ROLE.runtime,
          'mono',
          'center',
        )
          .glow(rj > 0.4 ? 8 : 4, rj > 0.4 ? ROLE.fail : ROLE.runtime)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: Zero-call responses & Multi-call scheduling
  const zeroAct = guardedDynamic(
    () => fadeInHalf(zeroMode.value),
    (a) => {
      const p = 0;
      const zd = zeroDetailOn.value;
      const nodes = [];

      nodes.push(
        txt('RESPONSE OUTCOME ROUTER', -855, -210, 28, ROLE.ok, 'mono', 'left').opacity(a),
        hexGate(-620, 40, 82, ROLE.runtime, { label: 'ROUTER', opacity: a }),
        // Branch 1: 0 calls -> Answer or Refusal
        beamWithPhotons(
          [
            [-530, 10],
            [-150, -110],
          ],
          ROLE.ok,
          p * 1.1,
          { alpha: a, width: 3.4 },
        ),
        energyRail(-120, -170, -50, ROLE.ok, { opacity: a }),
        txt('0 CALLS -> ORDINARY ANSWER / REFUSAL', -90, -142, 28, ROLE.ok, 'mono', 'left')
          .glow(zd > 0.3 ? 6 : 0, ROLE.ok)
          .opacity(a),
        txt(
          'Preserve non-call output items in conversation history',
          -90,
          -84,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        // Branch 2: N valid calls -> distinct IDs + per-call permission
        beamWithPhotons(
          [
            [-530, 70],
            [-150, 190],
          ],
          ROLE.proposal,
          p * 1.1 + 0.5,
          { alpha: a, width: 3.4 },
        ),
        energyRail(-120, 125, 265, ROLE.proposal, { opacity: a }),
        txt(
          'N VALID CALLS -> DISTINCT CALL IDs',
          -90,
          152,
          28,
          ROLE.proposal,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Check permission per call, then schedule only allowed calls',
          -90,
          212,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        line([-855, 340], [840, 340], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Validation gates run before authorization or service execution',
          0,
          395,
          28,
          ROLE.focus,
          'serif',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mainAct, zeroAct);

  c.on('tu-complete-batch-1', () => {
    s.play(pulse.to(0.35, { duration: clampDur(c, c.cue('tu-complete-batch-1').start, 0.25) }));
  });
  c.on('tu-batch-response-complete', () => {
    s.play(
      statusOn.to(1, { duration: clampDur(c, c.cue('tu-batch-response-complete').start, 0.35) }),
    );
  });
  c.on('tu-batch-byte-limit', () => {
    s.play(byteCapOn.to(1, { duration: clampDur(c, c.cue('tu-batch-byte-limit').start, 0.35) }));
  });
  c.on('tu-complete-batch-2', () => {
    s.play(lateFailMode.to(1, { duration: clampDur(c, c.cue('tu-complete-batch-2').start, 0.35) }));
  });
  c.on('tu-batch-late-invalid', () => {
    s.play(
      rejectAllOn.to(1, { duration: clampDur(c, c.cue('tu-batch-late-invalid').start, 0.35) }),
    );
  });
  c.on('tu-complete-batch-3', () => {
    s.play(zeroMode.to(1, { duration: clampDur(c, c.cue('tu-complete-batch-3').start, 0.35) }));
  });
  c.on('tu-batch-zero-calls', () => {
    s.play(zeroDetailOn.to(1, { duration: clampDur(c, c.cue('tu-batch-zero-calls').start, 0.3) }));
  });
}
