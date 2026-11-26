// Scene 27: transfer - Keep proposals, execution, and evidence distinct
// 5-Station Luminous Round-Trip Conduit + Live External Budget Gauges (Attempts 0->1->2,
// Clock 0->400->1000 ms, Spend $0.00->$0.01->$0.02) + Parallel Reads vs Ordered Writes.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  gateNode,
  glowMeter,
  guardedDynamic,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pulse = s.value(0);
  const cycleOn = s.value(0);
  const limitsOn = s.value(0);
  const reserveOn = s.value(0);
  const failCountOn = s.value(0);
  const timeoutProg = s.value(0);
  const parReadsOn = s.value(0);
  const ordWritesOn = s.value(0);
  const reviewOn = s.value(0);

  const header = cinemaHeader(
    'END-TO-END RUNTIME BOUNDARY',
    'Keep proposals, execution,',
    'and evidence distinct',
    { accent: ROLE.runtime, size: 48 },
  );

  const stageAura = aura(120, 40, 620, '#5ce1e622', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const cy = cycleOn.value;
      const lm = limitsOn.value;
      const rs = reserveOn.value;
      const fc = failCountOn.value;
      const to = timeoutProg.value;
      const pr = parReadsOn.value;
      const ow = ordWritesOn.value;
      const rv = reviewOn.value;
      const nodes = [];

      // Top: 5-Station Controlled Round Trip (y = -145)
      const stY = -145;
      const stations = [
        [-720, 'PROPOSE', 'model turn', ROLE.proposal],
        [-360, 'VALIDATE', 'strict schema', ROLE.runtime],
        [0, 'POLICY', 'trusted state', ROLE.session],
        [360, 'EXECUTE', 'bounded op', ROLE.ok],
        [720, 'OBSERVE', 'call_id link', ROLE.key],
      ];

      for (let i = 0; i < stations.length - 1; i++) {
        const [a0, a1] = trimSeg([stations[i][0], stY], [stations[i + 1][0], stY], 62, 62);
        nodes.push(
          beamWithPhotons([a0, a1], stations[i + 1][3], p * 1.1 + i * 0.2, {
            alpha: 0.45 + cy * 0.55,
            width: 3.4,
          }),
        );
      }
      stations.forEach(([x, label, sub, col]) => {
        nodes.push(
          gateNode(x, stY, label, col, {
            radius: 52,
            sub,
            glow: rv > 0.35 || cy > 0.35 ? 11 : 6,
          }),
        );
      });

      // Return review arc on Beat 2 (connecting OBSERVE back to independent state verification)
      if (rv > 0.05) {
        const revArc = quadArcPts([720, stY - 102], [-720, stY - 102], -44);
        nodes.push(
          beamWithPhotons(revArc, ROLE.ok, p * 1.2, { alpha: rv, width: 3.4 }),
          txt(
            'AUDIT: REQUEST -> ADMISSION -> VERIFIED STATE',
            320,
            -355,
            26,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(7, ROLE.ok)
            .opacity(rv),
        );
      }

      // Middle: External Runtime Budget Gauges (Attempts, Clock, Spend)
      const attempts = to > 0.1 ? 2 : rs > 0.35 ? 1 : 0;
      const elapsedMs = fc > 0.35 ? Math.round(400 + 600 * to) : 0;
      const spend = attempts * 0.01;
      const gOp = 0.45 + lm * 0.55;
      const gY = 85;

      nodes.push(
        line([-855, -20], [840, -20], { stroke: '#25355a', width: 2 }),
        txt(
          'EXTERNAL BUDGETS (ENFORCED OUTSIDE PROMPT)',
          -855,
          22,
          26,
          ROLE.budget,
          'mono',
          'left',
        ).opacity(gOp),
        // Gauge 1: Attempts
        txt(
          `ATTEMPTS: ${attempts} / 2`,
          -855,
          gY,
          26,
          attempts >= 2 ? ROLE.denied : ROLE.proposal,
          'mono',
          'left',
        ).opacity(gOp),
        glowMeter(-855, gY + 42, 490, 26, attempts / 2, {
          fill: attempts >= 2 ? ROLE.denied : ROLE.proposal,
          opacity: gOp,
        }),
        // Gauge 2: Clock
        txt(
          `DEADLINE: ${elapsedMs} / 1000 ms`,
          -245,
          gY,
          26,
          elapsedMs >= 1000 ? ROLE.denied : ROLE.caution,
          'mono',
          'left',
        ).opacity(gOp),
        glowMeter(-245, gY + 42, 490, 26, elapsedMs / 1000, {
          fill: elapsedMs >= 1000 ? ROLE.denied : ROLE.caution,
          opacity: gOp,
        }),
        // Gauge 3: Spend
        txt(
          `SPEND: $${spend.toFixed(2)} / $0.02`,
          365,
          gY,
          26,
          spend >= 0.02 ? ROLE.denied : ROLE.ok,
          'mono',
          'left',
        ).opacity(gOp),
        glowMeter(365, gY + 42, 475, 26, spend / 0.02, {
          fill: spend >= 0.02 ? ROLE.denied : ROLE.ok,
          opacity: gOp,
        }),
        txt(
          to > 0.85
            ? 'TIMEOUT EXPLICIT · BUDGET STOPPED AT 2 ATTEMPTS / 1000 ms / $0.02'
            : fc > 0.35
              ? 'Failure counted as attempt #1 (400 ms elapsed)'
              : rs > 0.35
                ? 'Reserved attempt #1 BEFORE dispatch'
                : 'Reserve attempts before dispatch · Count failures as work',
          0,
          gY + 102,
          26,
          to > 0.85 ? ROLE.denied : COSMOS.muted,
          'mono',
          'center',
        ).opacity(gOp),
      );

      // Bottom Concurrency Split: Parallel Reads vs Serialized Writes
      const cY = 305;
      nodes.push(
        line([-855, 232], [840, 232], { stroke: '#25355a', width: 2 }),
        energyRail(-855, cY - 38, cY + 72, ROLE.runtime, { opacity: 0.4 + pr * 0.6 }),
        txt('INDEPENDENT AUTHORIZED READS', -825, cY - 18, 26, ROLE.runtime, 'mono', 'left')
          .glow(pr > 0.35 ? 6 : 0, ROLE.runtime)
          .opacity(0.4 + pr * 0.6),
        txt(
          'Can run concurrently with fan-in checks',
          -825,
          cY + 34,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(0.4 + pr * 0.6),
        energyRail(55, cY - 38, cY + 72, ROLE.focus, { opacity: 0.4 + ow * 0.6 }),
        txt('DEPENDENT / CONFLICTING WRITES', 85, cY - 18, 26, ROLE.focus, 'mono', 'left')
          .glow(ow > 0.35 ? 6 : 0, ROLE.focus)
          .opacity(0.4 + ow * 0.6),
        txt(
          'Serialize with deliberate ordering & idempotency',
          85,
          cY + 34,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(0.4 + ow * 0.6),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('transfer-beat-1-focus-1', () => {
    s.play(cycleOn.to(1, { duration: clampDur(c, c.cue('transfer-beat-1-focus-1').start, 0.35) }));
  });
  c.on('transfer-beat-2-focus-1', () => {
    s.play(limitsOn.to(1, { duration: clampDur(c, c.cue('transfer-beat-2-focus-1').start, 0.3) }));
  });
  c.on('transfer-reserve-attempt', () => {
    s.play(
      reserveOn.to(1, { duration: clampDur(c, c.cue('transfer-reserve-attempt').start, 0.3) }),
    );
  });
  c.on('transfer-count-failure', () => {
    s.play(
      failCountOn.to(1, { duration: clampDur(c, c.cue('transfer-count-failure').start, 0.3) }),
    );
  });
  c.on('transfer-timeout', () => {
    s.play(timeoutProg.to(1, { duration: clampDur(c, c.cue('transfer-timeout').start, 0.6) }));
  });
  c.on('transfer-independent-reads', () => {
    s.play(
      parReadsOn.to(1, { duration: clampDur(c, c.cue('transfer-independent-reads').start, 0.3) }),
    );
  });
  c.on('transfer-order-writes', () => {
    s.play(ordWritesOn.to(1, { duration: clampDur(c, c.cue('transfer-order-writes').start, 0.3) }));
  });
  c.on('transfer-beat-3-focus-1', () => {
    s.play(reviewOn.to(1, { duration: clampDur(c, c.cue('transfer-beat-3-focus-1').start, 0.35) }));
  });
}
