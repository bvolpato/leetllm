// Scene 16: intent-ledger - Separate a replayed operation from a newly approved intent
// Interactive Idempotency Key & 6-Field Fingerprint Optical Ledger tracing:
//   - op-A lost reply -> replay -> requests: 2, effects: 1
//   - op-B distinct approval -> effects: 2
//   - op-A reused with weights-18 -> collision rejected, effects stay 2
//   - durable atomic commit & expired-key reconciliation
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
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function intentLedger(s, c) {
  const pulse = s.value(0);
  const lostOn = s.value(0);
  const replayOn = s.value(0);
  const oneEffOn = s.value(0);
  const act2On = s.value(0);
  const secondOn = s.value(0);
  const attemptCollOn = s.value(0);
  const collisionOn = s.value(0);
  const durableMode = s.value(0);

  const header = cinemaHeader(
    'OPERATION IDENTITY LEDGER',
    'Separate a replayed write',
    'from a new approved intent',
    { accent: ROLE.key, size: 46 },
  );

  const stageAura = aura(150, 40, 620, '#ffd1661c', '#5ce1e61a');

  // Acts 0-1: Key/Fingerprint Ledger + Replay vs New Approval vs Collision
  const mainAct = guardedDynamic(
    () => fadeOutHalf(durableMode.value),
    (a) => {
      const p = pulse.value;
      const ls = lostOn.value;
      const rp = replayOn.value;
      const oe = oneEffOn.value;
      const a2 = act2On.value;
      const sc = secondOn.value;
      const ac = attemptCollOn.value;
      const cl = collisionOn.value;
      const nodes = [];

      const effectsCount = sc > 0.35 ? 2 : 1;
      const reqCount = cl > 0.35 ? 4 : sc > 0.35 ? 3 : rp > 0.35 ? 2 : 1;

      // Top-right live counters
      nodes.push(
        txt(`REQUESTS: ${reqCount}`, 220, -345, 32, ROLE.proposal, 'mono', 'center').opacity(a),
        txt(`LOGICAL EFFECTS: ${effectsCount}`, 640, -345, 32, ROLE.ok, 'mono', 'center')
          .glow(8, ROLE.ok)
          .opacity(a),
      );

      // Left column: Key + 6-Field Fingerprint binding
      nodes.push(
        energyRail(-855, -205, 85, ROLE.key, { opacity: a }),
        txt('LEDGER KEY', -825, -185, 26, ROLE.key, 'mono', 'left').opacity(a),
        txt('(project, action, operation_id)', -825, -132, 28, COSMOS.ink, 'mono', 'left').opacity(
          a,
        ),
        txt('6-FIELD FINGERPRINT', -825, -55, 26, ROLE.runtime, 'mono', 'left').opacity(a),
        txt('principal · project · action', -825, -4, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('release · candidate · policy_ver', -825, 44, 26, COSMOS.muted, 'mono', 'left').opacity(
          a,
        ),
      );

      // Right column: 3 Operations hitting the ledger
      const rows = [
        [
          '1. op-A (v17) -> lost reply -> retry',
          rp > 0.35
            ? 'REPLAYED SAVED RESULT (effects: 1)'
            : ls > 0.35
              ? 'REPLY LOST (recorded)'
              : 'APPLIED',
          rp > 0.35 ? ROLE.ok : ROLE.caution,
          1,
          false,
        ],
        [
          '2. op-B (v17) · new approval',
          sc > 0.35 ? 'APPLIED 2nd EFFECT (effects: 2)' : 'Distinct approved intent',
          ROLE.runtime,
          0.25 + a2 * 0.75,
          false,
        ],
        [
          '3. op-A + weights-18 (corrupt)',
          cl > 0.35 ? 'COLLISION REJECTED (effects: 2)' : 'Fingerprint mismatch!',
          ROLE.denied,
          0.25 + Math.max(ac, cl) * 0.75,
          cl > 0.35,
        ],
      ];

      rows.forEach(([title, status, col, op, tripped], i) => {
        const y = -155 + i * 155;
        nodes.push(
          energyRail(-165, y - 38, y + 48, col, { opacity: a * op }),
          txt(title, -135, y - 16, 26, COSMOS.ink, 'mono', 'left').opacity(a * op),
          txt(status, -135, y + 32, 26, col, 'mono', 'left')
            .glow(op > 0.6 ? 6 : 0, col)
            .opacity(a * op),
          circuitBreaker(695, y + 6, 100, tripped ? 1 : 0, col, { opacity: a * op }),
        );
      });

      // Bottom principle bar
      nodes.push(
        line([-855, 315], [840, 315], { stroke: '#25355a', width: 2 }).opacity(a),
        beamWithPhotons(
          [
            [-400, 315],
            [400, 315],
          ],
          oe > 0.35 ? ROLE.ok : ROLE.key,
          p * 1.1,
          { alpha: a, width: 3 },
        ),
        txt(
          'New transport call_id != new intent  ·  New approval != replay',
          0,
          378,
          28,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: Durable Atomic Persistence & Expired-Key Status Reconciliation
  const durableAct = guardedDynamic(
    () => fadeInHalf(durableMode.value),
    (a) => {
      const p = pulse.value;
      const nodes = [];

      nodes.push(
        txt('PRODUCTION DURABILITY & KEY EXPIRY', -855, -205, 28, ROLE.ok, 'mono', 'left').opacity(
          a,
        ),
        energyRail(-855, -130, 55, ROLE.ok, { opacity: a }),
        txt('ATOMIC TRANSACTION', -825, -110, 28, ROLE.ok, 'mono', 'left')
          .glow(6, ROLE.ok)
          .opacity(a),
        txt(
          'Commit promotion AND durable operation ledger record together',
          -825,
          -48,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'Concurrent retries or caller crashes find the exact saved result',
          -825,
          10,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [-825, 115],
            [825, 115],
          ],
          ROLE.runtime,
          p * 1.1,
          { alpha: a, width: 3.4 },
        ),
        energyRail(-855, 170, 345, ROLE.caution, { opacity: a }),
        txt('IF RETENTION WINDOW EXPIRES', -825, 190, 28, ROLE.caution, 'mono', 'left').opacity(a),
        txt(
          'Do not blindly re-submit as a fresh write',
          -825,
          250,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'Reconcile against the target service’s status record for that promotion',
          -825,
          306,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mainAct, durableAct);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-intent-ledger-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('tu-intent-ledger-1').start, 0.25) }));
  });
  c.on('tu-intent-lost-reply', () => {
    s.play(lostOn.to(1, { duration: clampDur(c, c.cue('tu-intent-lost-reply').start, 0.3) }));
  });
  c.on('tu-intent-replay', () => {
    s.play(replayOn.to(1, { duration: clampDur(c, c.cue('tu-intent-replay').start, 0.3) }));
  });
  c.on('tu-intent-one-effect', () => {
    s.play(oneEffOn.to(1, { duration: clampDur(c, c.cue('tu-intent-one-effect').start, 0.3) }));
  });
  c.on('tu-intent-ledger-2', () => {
    s.play(act2On.to(1, { duration: clampDur(c, c.cue('tu-intent-ledger-2').start, 0.3) }));
  });
  c.on('tu-intent-second', () => {
    s.play(secondOn.to(1, { duration: clampDur(c, c.cue('tu-intent-second').start, 0.3) }));
  });
  c.on('tu-intent-attempt', () => {
    s.play(attemptCollOn.to(1, { duration: clampDur(c, c.cue('tu-intent-attempt').start, 0.3) }));
  });
  c.on('tu-intent-collision', () => {
    s.play(collisionOn.to(1, { duration: clampDur(c, c.cue('tu-intent-collision').start, 0.35) }));
  });
  c.on('tu-intent-ledger-3', () => {
    s.play(durableMode.to(1, { duration: clampDur(c, c.cue('tu-intent-ledger-3').start, 0.35) }));
  });
}
