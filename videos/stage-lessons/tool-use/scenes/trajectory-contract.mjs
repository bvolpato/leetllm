// Scene 23: trajectory-contract - Score linkage, success and rendered text together
// 3-Stage Event Chain Scorer (`call -> observation -> answer`) with live mutation breakers
// exposing text contradiction and `ok: false` leftover status traps, plus BFCL vs tau-bench scope.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TOOL_GOOD_TRACE,
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
  quadArcPts,
  scoreToolTrajectory,
  txt,
} from '../parts.mjs';

export default function trajectoryContract(s, c) {
  const pulse = s.value(0);
  const linkOn = s.value(0);
  const trueOn = s.value(0);
  const renderOn = s.value(0);
  const renderFailOn = s.value(0);
  const okFailOn = s.value(0);
  const benchMode = s.value(0);

  const goodRes = scoreToolTrajectory(TOOL_GOOD_TRACE);

  const header = cinemaHeader(
    'FULL TRAJECTORY SCORING',
    'Score linkage, success',
    'and rendered text together',
    { accent: ROLE.runtime, size: 46 },
  );

  const stageAura = aura(120, 40, 620, '#5ce1e622', '#ff6b8b18');

  // Acts 0-1: Event Chain + Mutation Stress Tests
  const chainAct = guardedDynamic(
    () => fadeOutHalf(benchMode.value),
    (a) => {
      const p = pulse.value;
      const lk = linkOn.value;
      const tr = trueOn.value;
      const rd = renderOn.value;
      const rf = renderFailOn.value;
      const of = okFailOn.value;
      const nodes = [];

      // Top: 3-Station Exact Sequence Chain
      const yChain = -130;
      const x1 = -620;
      const x2 = 0;
      const x3 = 620;

      nodes.push(
        gateNode(x1, yChain, '1. CALL', ROLE.proposal, {
          radius: 56,
          sub: 'id: status-1 (v16)',
          opacity: a,
        }),
        gateNode(x2, yChain, '2. OBS', of > 0.35 ? ROLE.denied : ROLE.ok, {
          radius: 56,
          sub: of > 0.35 ? 'ok: false (FAIL!)' : 'call_id: status-1 · ok===true',
          opacity: a,
          glow: tr > 0.35 || of > 0.35 ? 12 : 6,
        }),
        gateNode(x3, yChain, '3. ANSWER', rf > 0.35 && of < 0.35 ? ROLE.denied : ROLE.runtime, {
          radius: 56,
          sub: rf > 0.35 && of < 0.35 ? '"succeeded" (MISMATCH!)' : 'Release v16: canary_failed.',
          opacity: a,
          glow: rd > 0.35 || rf > 0.35 ? 12 : 6,
        }),
        beamWithPhotons(
          [
            [x1 + 66, yChain],
            [x2 - 66, yChain],
          ],
          lk > 0.35 ? ROLE.key : ROLE.proposal,
          p * 1.1,
          { alpha: a, width: 3.6 },
        ),
        beamWithPhotons(
          [
            [x2 + 66, yChain],
            [x3 - 66, yChain],
          ],
          rf > 0.35 || of > 0.35 ? ROLE.denied : ROLE.ok,
          p * 1.1 + 0.5,
          { alpha: a, width: 3.6 },
        ),
      );

      if (lk > 0.35) {
        const idArc = quadArcPts([x1, yChain - 98], [x2, yChain - 98], -34);
        nodes.push(
          beamWithPhotons(idArc, ROLE.key, p * 1.2, { alpha: a * lk, width: 3.2 }),
          txt('id == call_id', -310, yChain - 44, 26, ROLE.key, 'mono', 'center')
            .glow(6, ROLE.key)
            .opacity(a * lk),
        );
      }

      // Bottom: Live Mutation Stress Breakers
      const mY = 140;
      nodes.push(
        line([-855, 30], [840, 30], { stroke: '#25355a', width: 2 }).opacity(a),
        // Row 1: Good trace
        energyRail(-855, mY - 38, mY + 26, ROLE.ok, { opacity: a }),
        txt('BASELINE TRACE', -825, mY - 22, 26, ROLE.ok, 'mono', 'left').opacity(a),
        txt(
          goodRes.ok ? 'PASS: call -> obs(ok===true) -> rendered answer' : 'FAIL',
          -500,
          mY - 22,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        // Row 2: Mutated visible text
        energyRail(-855, mY + 58, mY + 122, ROLE.denied, { opacity: a * (0.3 + rf * 0.7) }),
        txt('MUTATION 1: TEXT', -825, mY + 74, 26, ROLE.denied, 'mono', 'left').opacity(
          a * (0.3 + rf * 0.7),
        ),
        txt(
          'Text="succeeded" while status="canary_failed" -> REJECT',
          -500,
          mY + 74,
          26,
          ROLE.denied,
          'mono',
          'left',
        )
          .glow(rf > 0.35 ? 6 : 0, ROLE.denied)
          .opacity(a * (0.3 + rf * 0.7)),
        circuitBreaker(705, mY + 74, 95, rf > 0.35 ? 1 : 0, ROLE.ok, {
          opacity: a * (0.3 + rf * 0.7),
        }),
        // Row 3: Failed read with leftover status fields
        energyRail(-855, mY + 154, mY + 218, ROLE.denied, { opacity: a * (0.3 + of * 0.7) }),
        txt('MUTATION 2: ok=false', -825, mY + 170, 26, ROLE.denied, 'mono', 'left').opacity(
          a * (0.3 + of * 0.7),
        ),
        txt(
          'ok: false with plausible leftover status -> REJECT',
          -500,
          mY + 170,
          26,
          ROLE.denied,
          'mono',
          'left',
        )
          .glow(of > 0.35 ? 6 : 0, ROLE.denied)
          .opacity(a * (0.3 + of * 0.7)),
        circuitBreaker(705, mY + 170, 95, of > 0.35 ? 1 : 0, ROLE.ok, {
          opacity: a * (0.3 + of * 0.7),
        }),
      );

      return group(...nodes);
    },
  );

  // Act 2: Scorer Scope & Benchmarks (BFCL vs tau-bench)
  const benchAct = guardedDynamic(
    () => fadeInHalf(benchMode.value),
    (a) => {
      const nodes = [];

      nodes.push(
        txt(
          'DETERMINISTIC SCORER SCOPE & PUBLIC BENCHMARKS',
          -855,
          -205,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        energyRail(-855, -135, 35, ROLE.caution, { opacity: a }),
        txt('WHAT THIS SCORER ASSUMES', -825, -115, 28, ROLE.caution, 'mono', 'left').opacity(a),
        txt(
          'Assumes trusted runtime events & fixed answer renderer',
          -825,
          -52,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'Independently inspect: authorization · final DB state · free-form claims',
          -825,
          4,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        // BFCL vs tau-bench comparison rails
        energyRail(-855, 110, 290, ROLE.proposal, { opacity: a }),
        txt('BFCL', -825, 130, 32, ROLE.proposal, 'mono', 'left').glow(6, ROLE.proposal).opacity(a),
        txt('Tool selection & argument', -825, 192, 28, COSMOS.ink, 'sans', 'left').opacity(a),
        txt('formatting categories', -825, 240, 28, COSMOS.muted, 'sans', 'left').opacity(a),
        energyRail(45, 110, 290, ROLE.ok, { opacity: a }),
        txt('tau-bench', 75, 130, 32, ROLE.ok, 'mono', 'left').glow(6, ROLE.ok).opacity(a),
        txt('Compares final database state', 75, 192, 28, COSMOS.ink, 'sans', 'left').opacity(a),
        txt('against goal under domain rules', 75, 240, 28, COSMOS.muted, 'sans', 'left').opacity(
          a,
        ),
        txt(
          'Pin benchmark versions and test your own production failure boundaries',
          0,
          380,
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

  s.add(stageAura, header, chainAct, benchAct);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-trajectory-contract-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('tu-trajectory-contract-1').start, 0.25) }));
  });
  c.on('tu-trace-link', () => {
    s.play(linkOn.to(1, { duration: clampDur(c, c.cue('tu-trace-link').start, 0.35) }));
  });
  c.on('tu-trace-true', () => {
    s.play(trueOn.to(1, { duration: clampDur(c, c.cue('tu-trace-true').start, 0.35) }));
  });
  c.on('tu-trajectory-contract-2', () => {
    s.play(
      renderOn.to(1, { duration: clampDur(c, c.cue('tu-trajectory-contract-2').start, 0.35) }),
    );
  });
  c.on('tu-trace-render-fail', () => {
    s.play(
      renderFailOn.to(1, { duration: clampDur(c, c.cue('tu-trace-render-fail').start, 0.35) }),
    );
  });
  c.on('tu-trace-ok-fail', () => {
    s.play(okFailOn.to(1, { duration: clampDur(c, c.cue('tu-trace-ok-fail').start, 0.35) }));
  });
  c.on('tu-trajectory-contract-3', () => {
    s.play(
      benchMode.to(1, { duration: clampDur(c, c.cue('tu-trajectory-contract-3').start, 0.35) }),
    );
  });
}
