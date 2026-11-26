// Scene 13: write-gate - A hold needs an authorized intent
// Dual-Path Optical Gate splitting Read vs Write effects, stress-testing target swap (B8) and
// removed grant (0 effects), then rechecking live state and verifying the committed hold.
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
  gateNode,
  guardedDynamic,
  hexGate,
  txt,
} from '../parts.mjs';

export default function writeGate(s, c) {
  const pulse = s.value(0);
  const reqOn = s.value(0);
  const targetOn = s.value(0);
  const grantOn = s.value(0);
  const wrongBookOn = s.value(0);
  const noGrantOn = s.value(0);
  const stopOn = s.value(0);
  const driftOn = s.value(0);
  const recheckOn = s.value(0);
  const verifyOn = s.value(0);

  const header = cinemaHeader('STATE-MUTATING WRITE GATE', 'A hold needs an', 'authorized intent', {
    accent: ROLE.focus,
    size: 48,
  });

  const stageAura = aura(140, 30, 620, '#ffd1661c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const rq = reqOn.value;
      const tg = targetOn.value;
      const gr = grantOn.value;
      const wb = wrongBookOn.value;
      const ng = noGrantOn.value;
      const st = stopOn.value;
      const dr = driftOn.value;
      const rc = recheckOn.value;
      const vr = verifyOn.value;
      const nodes = [];

      // Determine current live test state across beats:
      // Beat 0: proposal enters policy gate
      // Beat 1: grant passes -> wrong target B8 trips -> removed grant trips
      // Beat 2: recheck live state -> verify committed hold-1!
      const isFinalPhase = dr > 0.35 || rc > 0.35 || vr > 0.35;
      const isTripped = !isFinalPhase && (wb > 0.35 || ng > 0.35 || st > 0.35);
      const isPassed = (gr > 0.35 && !isTripped && !isFinalPhase) || rc > 0.35 || vr > 0.35;

      const currentBook = !isFinalPhase && wb > 0.35 && ng < 0.35 ? 'B8' : 'B7';
      const hasGrant = isFinalPhase ? true : gr > 0.35 && ng < 0.35;
      const statusCol = isTripped ? ROLE.denied : isPassed ? ROLE.ok : ROLE.proposal;

      // Top Pipeline: Proposal -> Policy Gate -> Breaker -> Service Effect -> Verified Receipt
      const yPipe = -65;
      nodes.push(
        gateNode(-690, yPipe, 'HOLD', ROLE.proposal, {
          radius: 56,
          sub: `book_id: "${currentBook}"`,
          glow: rq > 0.3 ? 12 : 6,
        }),
        beamWithPhotons(
          [
            [-622, yPipe],
            [-360, yPipe],
          ],
          ROLE.proposal,
          p * 1.1,
          { alpha: 0.45 + rq * 0.55, width: 3.5 },
        ),
        hexGate(-265, yPipe, 84, isTripped ? ROLE.denied : ROLE.session, {
          label: 'POLICY',
          sub: hasGrant ? 'lena + B7 grant' : 'grant missing',
          glow: tg > 0.3 ? 12 : 6,
        }),
        beamWithPhotons(
          [
            [-170, yPipe],
            [25, yPipe],
          ],
          statusCol,
          p * 1.1 + 0.3,
          { alpha: 0.9, width: 3.5 },
        ),
        circuitBreaker(115, yPipe, 120, isTripped ? 1 : 0, ROLE.ok),
        txt(
          isTripped ? 'STOPPED' : isPassed ? 'CLOSED' : 'CHECK',
          115,
          yPipe - 105,
          26,
          statusCol,
          'mono',
          'center',
        ),
        beamWithPhotons(
          [
            [205, yPipe],
            [385, yPipe],
          ],
          isPassed ? ROLE.ok : COSMOS.dim,
          p * 1.1 + 0.6,
          { alpha: isPassed ? 0.95 : 0.25, width: 3.5 },
        ),
        gateNode(465, yPipe, 'EFFECT', isPassed ? ROLE.ok : COSMOS.dim, {
          radius: 56,
          sub: isPassed ? '1 hold written' : '0 effects',
          glow: isPassed ? 12 : 2,
        }),
        beamWithPhotons(
          [
            [532, yPipe],
            [670, yPipe],
          ],
          vr > 0.35 ? ROLE.ok : COSMOS.dim,
          p * 1.2,
          { alpha: vr > 0.35 ? 1 : 0.2, width: 3.5 },
        ),
        gateNode(745, yPipe, 'VERIFY', vr > 0.35 ? ROLE.ok : COSMOS.dim, {
          radius: 52,
          sub: vr > 0.35 ? 'hold-1 confirmed' : 'check state',
          glow: vr > 0.35 ? 14 : 2,
        }),
      );

      // Middle Live Status Telemetry (3 optical rails, zero box chrome)
      const rY = 200;
      nodes.push(
        line([-855, 118], [840, 118], { stroke: '#25355a', width: 2 }),
        // Rail 1: Bound Policy Inputs
        energyRail(-855, rY - 40, rY + 92, ROLE.session),
        txt('RESOURCE-BOUND POLICY', -825, rY - 22, 26, ROLE.session, 'mono', 'left'),
        txt(`caller: lena · target: ${currentBook}`, -825, rY + 26, 26, COSMOS.ink, 'mono', 'left'),
        txt(
          hasGrant ? 'trusted grant: PRESENT (B7)' : 'trusted grant: REMOVED',
          -825,
          rY + 74,
          26,
          hasGrant ? ROLE.ok : ROLE.denied,
          'mono',
          'left',
        ),
        // Rail 2: Current Outcome
        energyRail(-235, rY - 40, rY + 92, statusCol),
        txt('RUNTIME OUTCOME', -205, rY - 22, 26, statusCol, 'mono', 'left'),
        txt(
          isTripped
            ? wb > 0.35 && ng < 0.35
              ? 'BLOCKED: target B8 != grant B7'
              : 'BLOCKED: grant removed -> 0 effects'
            : vr > 0.35
              ? 'VERIFIED: service holds B7 (hold-1)'
              : rc > 0.35
                ? 'RECHECKED AT EXECUTION -> ALLOWED'
                : gr > 0.35
                  ? 'ALLOWED: grant matches lena + B7'
                  : 'VALIDATING WRITE INTENT',
          -205,
          rY + 28,
          26,
          statusCol,
          'mono',
          'left',
        ).glow(6, statusCol),
        txt(
          'Proposal JSON stays identical; trusted policy decides',
          -205,
          rY + 76,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Bottom rule
      nodes.push(
        txt(
          dr > 0.35
            ? 'STALE READS CAN DRIFT · RECHECK MUTABLE STATE AT EXECUTION, THEN VERIFY'
            : 'SEPARATE READ CAPABILITY FROM STATE-MUTATING WRITE AUTHORITY',
          0,
          380,
          26,
          dr > 0.35 ? ROLE.focus : ROLE.runtime,
          'mono',
          'center',
        ).glow(dr > 0.35 ? 6 : 3, dr > 0.35 ? ROLE.focus : ROLE.runtime),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('write-gate-beat-1-focus-1', () => {
    s.play(reqOn.to(1, { duration: clampDur(c, c.cue('write-gate-beat-1-focus-1').start, 0.3) }));
  });
  c.on('write-gate-beat-1-focus-2', () => {
    s.play(
      targetOn.to(1, { duration: clampDur(c, c.cue('write-gate-beat-1-focus-2').start, 0.3) }),
    );
  });
  c.on('write-gate-beat-2-focus-1', () => {
    s.play(grantOn.to(1, { duration: clampDur(c, c.cue('write-gate-beat-2-focus-1').start, 0.3) }));
  });
  c.on('write-change-target', () => {
    s.play(wrongBookOn.to(1, { duration: clampDur(c, c.cue('write-change-target').start, 0.3) }));
  });
  c.on('write-remove-grant', () => {
    s.play(noGrantOn.to(1, { duration: clampDur(c, c.cue('write-remove-grant').start, 0.3) }));
  });
  c.on('write-gate-beat-2-focus-2', () => {
    s.play(stopOn.to(1, { duration: clampDur(c, c.cue('write-gate-beat-2-focus-2').start, 0.3) }));
  });
  c.on('write-gate-beat-3-focus-1', () => {
    s.play(driftOn.to(1, { duration: clampDur(c, c.cue('write-gate-beat-3-focus-1').start, 0.3) }));
  });
  c.on('write-gate-beat-3-focus-2', () => {
    s.play(
      recheckOn.to(1, { duration: clampDur(c, c.cue('write-gate-beat-3-focus-2').start, 0.3) }),
    );
  });
  c.on('write-verify-result', () => {
    s.play(verifyOn.to(1, { duration: clampDur(c, c.cue('write-verify-result').start, 0.35) }));
  });
}
