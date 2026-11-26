// Scene 21 (tails-and-gates): "What does the release report prove?"
// Act 1: 5 cascading glowing survival bars (A1..A5, each 0.95 emerald / 0.05 rose) feeding a
// shrinking exponential intersection beam 0.95^k + MathJax 0.95^5 = 0.774 (withheld until after `pr-joint`).
// Act 2: Clean discrete swap into 6 glowing release-gate locks testing mutated fail -> all-6 true
// PASS -> missing lifecycle BLOCK -> numeric 1 type-mismatch BLOCK.
import { dynamic, fade, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  REQUIRED_RAG_GATES,
  ROLE,
  assertEqual,
  callerTag,
  cinemaAtmosphere,
  glowTex,
  heroTitle,
  lumBar,
  playCue,
  ragReleaseGate,
  runPhase,
  seq,
  statusPill,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function tailsAndGates(s, c) {
  const within = 0.95;
  const products = Array.from({ length: 5 }, (_, i) => within ** (i + 1));
  const jointVal = products[4];
  assertEqual(jointVal.toFixed(3), '0.774', '0.95^5 = 0.774');

  const completeReport = Object.fromEntries(REQUIRED_RAG_GATES.map((k) => [k, true]));
  const { lifecycle: _removed, ...missingReport } = completeReport;
  assertEqual(ragReleaseGate(completeReport), true, 'all 6 true pass');
  assertEqual(ragReleaseGate(missingReport), false, 'missing lifecycle fails');
  assertEqual(ragReleaseGate({ ...completeReport, lifecycle: 1 }), false, 'numeric 1 fails');

  const phase = s.value(0);
  const showStages = s.value(0);
  const jointStep = s.value(0); // 0..5 progressive intersection fill
  const showJointAns = s.value(0); // strictly after `pr-joint`
  // Act switch: 0 = probability cascade, 1 = 6-gate release report
  const actGates = s.value(0);
  // Gate report state: 0 = mutated (cases=false), 1 = all 6 true (PASS), 2 = missing lifecycle, 3 = lifecycle=1
  const gateState = s.value(0);
  const boolLit = s.value(0);

  const title = heroTitle(['What Does the', 'Release Report Prove?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'TAIL COMPOUNDING · STRICT BOOLEAN RELEASE GATES',
  });

  const probEq = glowTex('P\\left(\\bigcap_{i=1}^{5} A_i\\right) = 0.95^5 \\approx 0.774', {
    x: 420,
    y: -355,
    size: 34,
    color: ROLE.focus,
    glow: 6,
  }).opacity(0);

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const ss = showStages.value;
    const js = jointStep.value;
    const sja = showJointAns.value;
    const inGates = actGates.value > 0.5;
    const gs = Math.round(gateState.value);
    const bl = boolLit.value;

    const nodes = [callerTag(1)];

    if (!inGates) {
      // ACT 1: 5 independent stage survival bars + shrinking intersection cascade
      const leftBarX = -560;
      const barW = 540;
      const rightBarX = 180;
      nodes.push(
        txt('INDEPENDENT STAGE (P = 0.95)', leftBarX, -235, 26, ROLE.admitted, 'mono', 'left'),
        txt('JOINT INTERSECTION (ALL SO FAR)', rightBarX, -235, 26, ROLE.policy, 'mono', 'left'),
      );

      for (let i = 0; i < 5; i++) {
        const ry = -162 + i * 102;
        const fill = Math.min(1, ss);
        const jFill = Math.max(0, Math.min(1, js - i));
        const prod = products[i];

        nodes.push(
          txt(`A${i + 1}`, -740, ry, 30, ROLE.admitted, 'mono', 'center'),
          // Independent bar (0.95 green + 0.05 red)
          lumBar(leftBarX + barW * 0.5, ry, barW, 44, {
            color: '#2c3d63',
            fillAlpha: 0.16,
            strokeWidth: 1.8,
            glow: 0,
            radius: 7,
          }),
        );
        if (fill > 0.05) {
          const wPass = barW * within * fill;
          const wFail = barW * (1 - within) * fill;
          nodes.push(
            lumBar(leftBarX + wPass * 0.5, ry, wPass - 2, 36, {
              color: ROLE.admitted,
              fillAlpha: 0.55,
              strokeWidth: 1.8,
              glow: 7,
              radius: 5,
            }),
            lumBar(leftBarX + wPass + wFail * 0.5, ry, Math.max(6, wFail - 2), 36, {
              color: ROLE.danger,
              fillAlpha: 0.65,
              strokeWidth: 1.8,
              glow: 6,
              radius: 4,
            }),
          );
        }

        // Joint intersection bar
        nodes.push(
          lumBar(rightBarX + barW * 0.5, ry, barW, 44, {
            color: '#2c3d63',
            fillAlpha: 0.16,
            strokeWidth: 1.8,
            glow: 0,
            radius: 7,
          }),
        );
        if (jFill > 0.05) {
          const wJoint = barW * prod * jFill;
          const isFinal = i === 4;
          nodes.push(
            lumBar(rightBarX + wJoint * 0.5, ry, wJoint - 2, 36, {
              color: isFinal ? ROLE.focus : ROLE.policy,
              fillAlpha: 0.58,
              strokeWidth: 2,
              glow: isFinal ? 12 * pulse : 7,
              radius: 5,
            }),
          );
          if (i < 4 || sja > 0.3) {
            nodes.push(
              txt(
                `${(prod * 100).toFixed(1)}%`,
                rightBarX + barW + 24,
                ry,
                28,
                isFinal ? ROLE.focus : ROLE.policy,
                'mono',
                'left',
              ),
            );
          }
        }
      }

      // Act 1 footer
      nodes.push(
        txt(
          sja > 0.3
            ? '0.95^5 = 77.4% stay inside all 5 bounds  ·  measure total request p95 directly'
            : 'Each of 5 independent stages stays within its bound 95% of the time...',
          -855,
          415,
          30,
          sja > 0.3 ? ROLE.focus : COSMOS.muted,
          'mono',
          'left',
        ).glow(sja > 0.3 ? 7 : 0, ROLE.focus),
      );
    } else {
      // ACT 2: 6 Required Boolean Release Gates
      const candHeader =
        gs === 0
          ? 'CANDIDATE WITH 30-DAY CLAIM  (FAILED FROZEN CASE)'
          : 'REVIEWED FIXTURE CANDIDATE  ·  6 REQUIRED BOOLEAN GATES';
      nodes.push(
        txt(candHeader, -855, -246, 28, gs === 0 ? ROLE.danger : ROLE.policy, 'mono', 'left').glow(
          7,
          gs === 0 ? ROLE.danger : ROLE.policy,
        ),
        line([-855, -214], [855, -214], { stroke: '#2c3d63', width: 2.2 }),
      );

      REQUIRED_RAG_GATES.forEach((gate, i) => {
        const colIdx = i % 3;
        const rowIdx = Math.floor(i / 3);
        const cx = -565 + colIdx * 565;
        const cy = -82 + rowIdx * 195;

        let valText = 'true';
        let col = ROLE.admitted;
        if (gs === 0) {
          if (gate === 'cases') {
            valText = 'false';
            col = ROLE.danger;
          } else {
            valText = 'pending';
            col = COSMOS.muted;
          }
        } else if (gs === 2 && gate === 'lifecycle') {
          valText = 'MISSING';
          col = ROLE.danger;
        } else if (gs === 3 && gate === 'lifecycle') {
          valText = '1  (number != bool)';
          col = ROLE.danger;
        }

        const isLifeFocus = gate === 'lifecycle' && (bl > 0.3 || gs >= 2);
        nodes.push(
          lumBar(cx, cy, 515, 145, {
            color: isLifeFocus && gs === 1 ? ROLE.focus : col,
            fillAlpha: col === ROLE.danger ? 0.18 : 0.09,
            strokeWidth: isLifeFocus || col === ROLE.danger ? 2.8 : 2.0,
            glow: col === ROLE.danger ? 12 * pulse : col === ROLE.admitted ? 7 : 0,
            radius: 16,
          }),
          txt(gate.toUpperCase(), cx, cy - 34, 28, COSMOS.ink, 'mono', 'center'),
          txt(`report["${gate}"] === true`, cx, cy + 4, 26, COSMOS.muted, 'mono', 'center'),
          txt(valText, cx, cy + 46, 30, col, 'mono', 'center').glow(
            col === ROLE.danger ? 9 : 6,
            col,
          ),
        );
      });

      // Verdict pill right above footer
      const verdictPill =
        gs === 1
          ? { text: 'PROMOTION PERMITTED (ALL 6 === TRUE)', col: ROLE.admitted, w: 620 }
          : gs === 2
            ? { text: 'BLOCKED: REQUIRED GATE MISSING', col: ROLE.danger, w: 560 }
            : gs === 3
              ? { text: 'BLOCKED: NUMERIC 1 IS NOT BOOLEAN TRUE', col: ROLE.danger, w: 650 }
              : { text: 'BLOCKED: FROZEN CASE FAILED', col: ROLE.danger, w: 510 };
      nodes.push(
        statusPill(verdictPill.text, 0, 275, {
          color: verdictPill.col,
          width: verdictPill.w,
          height: 52,
        }),
      );

      // Act 2 footer
      const footMap = [
        { text: 'Mutated 30-day candidate fails the frozen-case release gate', col: ROLE.danger },
        {
          text: 'All 6 required gates === true  ->  earns integration trial & canary',
          col: ROLE.admitted,
        },
        {
          text: 'Missing lifecycle gate blocks promotion even when remaining 5 are true',
          col: ROLE.warn,
        },
        {
          text: 'Strict Boolean check rejects numeric 1  ·  use untouched slices & canary',
          col: ROLE.danger,
        },
      ];
      const ft = footMap[Math.max(0, Math.min(footMap.length - 1, gs))];
      nodes.push(txt(ft.text, -855, 415, 30, ft.col, 'mono', 'left').glow(7, ft.col));
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.admitted), title, probEq, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'pr-independent', showStages, 1, { dur: 0.6 });
  playCue(
    s,
    c,
    'pr-all-five',
    (d) =>
      s.play(
        seq(
          jointStep.to(1, { duration: d * 0.2 }),
          jointStep.to(2, { duration: d * 0.2 }),
          jointStep.to(3, { duration: d * 0.2 }),
          jointStep.to(4, { duration: d * 0.2 }),
          jointStep.to(5, { duration: d * 0.2 }),
        ),
      ),
    { dur: 1.5 },
  );
  playCue(
    s,
    c,
    'pr-joint',
    (d) => s.play(showJointAns.to(1, { duration: d }), fade(probEq, 1, { duration: d })),
    { after: true, dur: 0.45 },
  );
  playCue(
    s,
    c,
    'pr-mutation',
    () =>
      s.play(
        actGates.to(1, { duration: 0.001 }),
        gateState.to(0, { duration: 0.001 }),
        fade(probEq, 0, { duration: 0.2 }),
      ),
    { dur: 0.25 },
  );
  playCue(s, c, 'pr-required', () => s.play(gateState.to(1, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
  tweenCue(s, c, 'pr-alltrue', boolLit, 1, { dur: 0.45 });
  playCue(s, c, 'pr-missing', () => s.play(gateState.to(2, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'pr-number', () => s.play(gateState.to(3, { duration: 0.001 })), {
    after: true,
    dur: 0.1,
  });
}
