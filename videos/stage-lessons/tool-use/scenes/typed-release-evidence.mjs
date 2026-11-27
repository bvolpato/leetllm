// Scene 24: typed-release-evidence - Validate receipts before counting their passes and violations
// 4-Run Telemetry Wave with strict type gate + laser threshold caps:
//   3/4 (75%) pass, 0 safety violations, max 3 rounds -> PASS
//   max latency 680 ms (> 600 ms cap) & max cost 3.8 c (> 3.0 c cap) -> REJECTED!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TOOL_RECEIPTS,
  TYPED_EVIDENCE_SUMMARY,
  aura,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function typedReleaseEvidence(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = type validation, 1 = 4-run maxima & caps, 2 = aggregation discipline
  const typeErrOn = s.value(0);
  const pass75On = s.value(0);
  const roundsOn = s.value(0);
  const latOn = s.value(0);
  const costOn = s.value(0);
  const rejectOn = s.value(0);

  const header = cinemaHeader(
    'TYPED RELEASE EVIDENCE GATE',
    'Validate every receipt',
    'before aggregating maxima',
    { accent: ROLE.denied, size: 46 },
  );

  const stageAura = aura(150, 40, 620, '#ff6b8b1c', '#5ce1e61a');

  // Act 0: Strict Receipt Type Contract
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const te = typeErrOn.value;
      const nodes = [];

      const rules = [
        ['runs', 'non-empty receipt list', ROLE.proposal],
        ['passed', 'exact Boolean (reject truthy 1)', ROLE.runtime],
        ['unauthorized_reads / unsafe_writes', 'integers >= 0 (no negative -1!)', ROLE.ok],
        ['rounds', 'integer >= 1', ROLE.key],
        ['latency_ms / cost_cents', 'finite non-negative number (no NaN / bool)', ROLE.caution],
      ];

      nodes.push(
        txt('STRICT PRE-AGGREGATION SCHEMA', -855, -205, 26, ROLE.runtime, 'mono', 'left').opacity(
          a,
        ),
      );
      rules.forEach(([field, spec, col], i) => {
        const y = -125 + i * 94;
        nodes.push(
          energyRail(-855, y - 24, y + 26, col, { opacity: a }),
          txt(field, -825, y, 26, col, 'mono', 'left').opacity(a),
          txt(spec, -155, y, 26, COSMOS.ink, 'sans', 'left').opacity(a),
        );
      });

      nodes.push(
        line([-855, 340], [840, 340], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          te > 0.35
            ? 'MALFORMED EVIDENCE RAISES ERROR BEFORE AGGREGATION'
            : 'Validate every field before computing sums or maxima',
          0,
          395,
          28,
          te > 0.35 ? ROLE.denied : ROLE.focus,
          'mono',
          'center',
        )
          .glow(te > 0.35 ? 8 : 3, te > 0.35 ? ROLE.denied : ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: 4-Run Telemetry Wave + Conjunction Caps
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p75 = pass75On.value;
      const rd = roundsOn.value;
      const lt = latOn.value;
      const cs = costOn.value;
      const rj = rejectOn.value;
      const nodes = [];

      // Left: 4 Run Rows
      nodes.push(
        txt('FOUR SUPPLIED RUN RECEIPTS', -855, -210, 26, ROLE.runtime, 'mono', 'left').opacity(a),
      );
      TOOL_RECEIPTS.forEach((run, i) => {
        const y = -135 + i * 102;
        const isHot = !run.passed;
        const col = isHot ? ROLE.denied : ROLE.ok;
        nodes.push(
          energyRail(-855, y - 28, y + 32, col, { opacity: a }),
          txt(
            `Run ${i + 1} · ${run.passed ? 'PASS' : 'FAIL'}`,
            -825,
            y - 8,
            26,
            col,
            'mono',
            'left',
          ).opacity(a),
          txt(
            `rounds: ${run.rounds}  ·  ${run.latency_ms} ms  ·  ${run.cost_cents.toFixed(1)}c  ·  viol: 0`,
            -555,
            y - 8,
            26,
            isHot ? ROLE.denied : COSMOS.ink,
            'mono',
            'left',
          )
            .glow(isHot && (lt > 0.35 || cs > 0.35) ? 6 : 0, ROLE.denied)
            .opacity(a),
        );
      });

      // Right: Release Conjunction Gauges with Laser Threshold Ticks
      const gx = 120;
      const gw = 700;
      const gauges = [
        [
          'PASS >= 75%',
          `${TYPED_EVIDENCE_SUMMARY.passed}/${TYPED_EVIDENCE_SUMMARY.total} = 75%`,
          0.75,
          0.75,
          ROLE.ok,
          0.45 + p75 * 0.55,
        ],
        [
          'VIOLATIONS / ROUNDS',
          `0 viol · max ${TYPED_EVIDENCE_SUMMARY.rounds}`,
          0.75,
          0.75,
          ROLE.ok,
          0.45 + rd * 0.55,
        ],
        [
          'LATENCY <= 600 ms',
          `${TYPED_EVIDENCE_SUMMARY.latency} ms (OVER)`,
          680 / 800,
          600 / 800,
          ROLE.denied,
          0.4 + lt * 0.6,
        ],
        [
          'COST <= 3.0c',
          `${TYPED_EVIDENCE_SUMMARY.cost.toFixed(1)}c (OVER)`,
          3.8 / 4.5,
          3.0 / 4.5,
          ROLE.denied,
          0.4 + cs * 0.6,
        ],
      ];

      gauges.forEach(([title, val, frac, capFrac, col, op], i) => {
        const y = -165 + i * 114;
        nodes.push(
          txt(title, gx, y - 26, 26, COSMOS.muted, 'mono', 'left').opacity(a * op),
          txt(val, gx + gw, y - 26, 26, col, 'mono', 'right')
            .glow(op > 0.7 ? 6 : 0, col)
            .opacity(a * op),
          glowMeter(gx, y + 18, gw, 24, frac, { fill: col, opacity: a * op }),
          line([gx + gw * capFrac, y + 2], [gx + gw * capFrac, y + 34], {
            stroke: ROLE.budget,
            width: 3.2,
          }).opacity(a * op),
        );
      });

      // Bottom Conjunction Verdict
      nodes.push(
        line([-855, 285], [840, 285], { stroke: '#25355a', width: 2 }).opacity(a),
        circuitBreaker(-620, 358, 110, rj > 0.35 ? 1 : 0.3, ROLE.ok, { opacity: a }),
        txt(
          rj > 0.35 && !TYPED_EVIDENCE_SUMMARY.approved
            ? 'CANDIDATE REJECTED  (LATENCY & COST EXCEED CAPS)'
            : 'ALL CONJUNCTION GATES MUST PASS TOGETHER',
          -490,
          358,
          30,
          rj > 0.35 ? ROLE.denied : ROLE.focus,
          'mono',
          'left',
        )
          .glow(rj > 0.35 ? 8 : 3, rj > 0.35 ? ROLE.denied : ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: Aggregation Integrity & Held-Out Discipline
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const nodes = [];
      const points = [
        [
          'COUNT FAILURES AS WORK',
          'Run 3 failed -> its 680 ms and 3.8 c still set the maxima',
          ROLE.caution,
        ],
        [
          'NO SIGN CANCELLATION',
          'Reject negative counts so -1 never cancels a real violation +1',
          ROLE.denied,
        ],
        [
          'NO SILENT NaN DROP',
          'Non-finite metrics fail validation instead of vanishing in max()',
          ROLE.denied,
        ],
        [
          'SEPARATE TWO METRICS',
          'Report task completion AND policy adherence independently',
          ROLE.ok,
        ],
      ];

      nodes.push(
        txt('PRODUCTION RELEASE GATE INTEGRITY', -855, -205, 28, ROLE.ok, 'mono', 'left').opacity(
          a,
        ),
      );
      points.forEach(([k, v, col], i) => {
        const y = -115 + i * 112;
        nodes.push(
          energyRail(-855, y - 28, y + 32, col, { opacity: a }),
          txt(k, -825, y, 28, col, 'mono', 'left').glow(5, col).opacity(a),
          txt(v, -310, y, 26, COSMOS.ink, 'sans', 'left').opacity(a),
        );
      });

      nodes.push(
        txt(
          'Use held-out tasks, real model calls, controlled tools & labeled policy outcomes',
          0,
          380,
          26,
          ROLE.focus,
          'serif',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);

  c.on('tu-typed-release-evidence-1', () => {
    s.play(
      pulse.to(0.3, { duration: clampDur(c, c.cue('tu-typed-release-evidence-1').start, 0.25) }),
    );
  });
  c.on('tu-receipts-types', () => {
    s.play(typeErrOn.to(1, { duration: clampDur(c, c.cue('tu-receipts-types').start, 0.35) }));
  });
  c.on('tu-typed-release-evidence-2', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('tu-typed-release-evidence-2').start, 0.35) }));
  });
  c.on('tu-receipts-75', () => {
    s.play(pass75On.to(1, { duration: clampDur(c, c.cue('tu-receipts-75').start, 0.3) }));
  });
  c.on('tu-receipts-rounds', () => {
    s.play(roundsOn.to(1, { duration: clampDur(c, c.cue('tu-receipts-rounds').start, 0.3) }));
  });
  c.on('tu-receipts-latency', () => {
    s.play(latOn.to(1, { duration: clampDur(c, c.cue('tu-receipts-latency').start, 0.35) }));
  });
  c.on('tu-receipts-cost', () => {
    s.play(costOn.to(1, { duration: clampDur(c, c.cue('tu-receipts-cost').start, 0.35) }));
  });
  c.on('tu-receipts-reject', () => {
    s.play(rejectOn.to(1, { duration: clampDur(c, c.cue('tu-receipts-reject').start, 0.35) }));
  });
  c.on('tu-typed-release-evidence-3', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('tu-typed-release-evidence-3').start, 0.35) }));
  });
}
