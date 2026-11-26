// Scene 16: release-report - Would you release this candidate?
// Mode 0 (Beat 0): Validation firewall catching booleans-as-counts and the NaN < 0.95 === false trap
// before thresholds ever run.
// Mode 1 (Beats 1-2): 4-Gate Release Dashboard for `promotion-eval-v5`, strictly revealing
// CPST = $0.111 / 2 = 5.55c after `promotion-input` and BLOCK RELEASE (3 gates failed)
// after `promotion-verdict`, followed by evidence provenance verification.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PROMO_CPST,
  PROMO_PASSES,
  PROMO_SUITE,
  PROMO_TOTAL_COST,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  guardedDynamic,
  railBar,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function releaseReport(s, c) {
  const pulse = s.value(0);
  // Beat 0
  const fieldsOn = s.value(0);
  const domainOn = s.value(0);
  const nanTrap = s.value(0);
  // Beat 1-2 transition
  const gateMode = s.value(0);
  const gatesShow = s.value(0);
  const runsOn = s.value(0);
  const critOn = s.value(0);
  const repOn = s.value(0);
  const spendOn = s.value(0);
  const cpstRes = s.value(0);
  const blockRes = s.value(0);
  // Beat 2
  const proofOn = s.value(0);
  const trustOn = s.value(0);

  const header = cinemaHeader('RELEASE GATE', 'Would you release', 'this candidate?', {
    accent: ROLE.fail,
    size: 50,
  });

  const stageAura = aura(120, 40, 680, '#ff6b8b1a', '#5ce1e616');

  const promoCpstEq = glowTex(
    String.raw`\text{CPST} = \frac{11.1\text{¢}}{2} = 5.55\text{¢} \le 8.0\text{¢}`,
    { x: 430, y: -335, size: 36, color: ROLE.trace, glow: 8 },
  );

  // Mode 0 (Beat 0): Provenance fields + Type/Domain validator + NaN trap
  const mode0 = guardedDynamic(
    () => fadeOutHalf(gateMode.value),
    (a) => {
      const p = pulse.value;
      const fi = fieldsOn.value;
      const dm = domainOn.value;
      const nn = nanTrap.value;
      const nodes = [];

      // Left: Attached report provenance
      nodes.push(
        railBar(-840, -175, 255, ROLE.host, { width: 5, glow: 8, opacity: a }),
        txt('VERSIONED REPORT BUNDLE', -810, -155, 26, ROLE.host, 'mono', 'left').opacity(a),
        txt('Candidate: model · prompt · tools', -810, -86, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.5 + 0.5 * fi),
        ),
        txt('Split: regression vs untouched', -810, -24, 28, ROLE.trace, 'mono', 'left').opacity(
          a * (0.5 + 0.5 * fi),
        ),
        txt('Hard outcomes + permit trace', -810, 38, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.5 + 0.5 * fi),
        ),
        txt('Grouped repeats + p95 + spend', -810, 100, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.5 + 0.5 * fi),
        ),
        txt('Judge calibration + failure links', -810, 162, 28, ROLE.judge, 'mono', 'left').opacity(
          a * (0.5 + 0.5 * fi),
        ),
      );

      // Center: Validation Gate node
      const valNode = autoNode(-20, 35, 'VALIDATE', {
        radius: 74,
        color: dm > 0.3 ? ROLE.focus : ROLE.host,
        glow: 10,
        opacity: a,
        sub: 'Before thresholds!',
        subColor: ROLE.focus,
      });
      const [vL0, vL1] = trimSeg([-280, 35], [-20, 35], 0, valNode.r);
      const [vR0, vR1] = trimSeg([-20, 35], [240, 35], valNode.r, 0);
      nodes.push(
        segmentWithPhoton(vL0, vL1, ROLE.host, p, { width: 3.2, alpha: a }),
        segmentWithPhoton(vR0, vR1, nn > 0.3 ? ROLE.fail : ROLE.focus, p + 0.4, {
          width: 3.2,
          alpha: a,
        }),
        valNode.node,
      );

      // Right: Type rules + NaN floating-point trap
      nodes.push(
        railBar(255, -175, 255, nn > 0.3 ? ROLE.fail : ROLE.focus, {
          width: 5,
          glow: 9,
          opacity: a,
        }),
        txt('DOMAIN VALIDATION RULES', 285, -155, 26, ROLE.focus, 'mono', 'left').opacity(a),
        txt('Counts: integer >= 0', 285, -86, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.45 + 0.55 * dm),
        ),
        txt('Reject bool as count (True != 1)', 285, -28, 26, ROLE.warn, 'mono', 'left').opacity(
          a * (0.45 + 0.55 * dm),
        ),
        txt('Rates: finite & in [0, 1]', 285, 32, 28, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.45 + 0.55 * dm),
        ),
        line([285, 84], [855, 84], { stroke: '#4d2638', width: 2 }).opacity(a),
        txt(
          'NaN < 0.95  ===  false !',
          285,
          142,
          32,
          nn > 0.3 ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(nn > 0.3 ? 11 : 0, ROLE.fail)
          .opacity(a),
        txt(
          nn > 0.3 ? 'REJECT NaN AT VALIDATION' : 'Naive threshold silently passes NaN',
          285,
          202,
          26,
          nn > 0.3 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      nodes.push(
        txt(
          'Validate every count, type, finiteness, and range BEFORE comparing release thresholds',
          0,
          395,
          28,
          nn > 0.3 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1 (Beats 1-2): 4 Independent Release Gates + Provenance Audit
  const mode1 = guardedDynamic(
    () => fadeInHalf(gateMode.value),
    (a) => {
      const gs = gatesShow.value;
      const rn = runsOn.value;
      const cr = critOn.value;
      const rp = repOn.value;
      const sp = spendOn.value;
      const cp = cpstRes.value;
      const bl = blockRes.value;
      const pf = proofOn.value;
      const tr = trustOn.value;
      const nodes = [];

      // Left column: 3 Promotion Suite Episodes
      nodes.push(
        txt('PROMOTION-EVAL-V5 EPISODES', -840, -175, 26, ROLE.host, 'mono', 'left').opacity(a),
      );
      PROMO_SUITE.forEach((ep, i) => {
        const y = -98 + i * 102;
        const col = ep.passed ? ROLE.pass : ROLE.fail;
        nodes.push(
          railBar(-840, y - 28, y + 32, col, { width: 5, glow: 8, opacity: a }),
          txt(ep.id, -810, y - 6, 30, COSMOS.ink, 'mono', 'left').opacity(a),
          txt(
            `${(ep.cost * 100).toFixed(1)}¢`,
            -460,
            y - 6,
            28,
            ROLE.focus,
            'mono',
            'right',
          ).opacity(a),
          txt(ep.passed ? 'PASS' : 'BYPASS', -315, y - 6, 28, col, 'mono', 'right')
            .glow(!ep.passed ? 9 : 0, ROLE.fail)
            .opacity(a),
          txt(ep.state, -810, y + 30, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        );
      });
      nodes.push(
        txt(
          sp > 0.3
            ? `Spend: ${(PROMO_TOTAL_COST * 100).toFixed(1)}¢ / ${PROMO_PASSES} pass`
            : '2/3 pass · 1 bypass',
          -840,
          216,
          26,
          ROLE.trace,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right column: 4 Local Policy Gates
      const gates = [
        {
          name: '1. REGRESSION PASS',
          req: 'All 3 / 3',
          obs: rn > 0.25 ? '2 / 3 pass' : 'checking...',
          pass: false,
          on: Math.max(gs * 0.5, rn),
        },
        {
          name: '2. CRITICAL SAFETY',
          req: '0 bypasses',
          obs: cr > 0.25 ? '1 bypass!' : 'checking...',
          pass: false,
          on: Math.max(gs * 0.5, cr),
        },
        {
          name: '3. ALL-3 RELIABILITY',
          req: '>= 95%',
          obs: rp > 0.25 ? '1 / 3 (33.3%)' : 'checking...',
          pass: false,
          on: Math.max(gs * 0.5, rp),
        },
        {
          name: '4. COST PER SUCCESS',
          req: '<= 8.0¢',
          obs:
            cp > 0.35
              ? `${(PROMO_CPST * 100).toFixed(2)}¢`
              : sp > 0.25
                ? '11.1¢ / 2'
                : 'checking...',
          pass: true,
          on: Math.max(gs * 0.5, sp, cp),
        },
      ];

      nodes.push(
        txt('GATE', -195, -175, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('LIMIT', 220, -175, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('OBSERVED', 485, -175, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('RESULT', 775, -175, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        line([-205, -145], [855, -145], { stroke: '#29385f', width: 2 }).opacity(a),
      );

      gates.forEach((g, idx) => {
        const y = -82 + idx * 96;
        const showRes = bl > 0.35 || (g.pass && cp > 0.35);
        const rCol = !showRes ? COSMOS.dim : g.pass ? ROLE.pass : ROLE.fail;
        nodes.push(
          txt(g.name, -195, y, 26, COSMOS.ink, 'mono', 'left').opacity(a * (0.4 + 0.6 * g.on)),
          txt(g.req, 220, y, 26, ROLE.focus, 'mono', 'center').opacity(a * (0.4 + 0.6 * g.on)),
          txt(g.obs, 485, y, 28, showRes ? rCol : COSMOS.ink, 'mono', 'center').opacity(
            a * (0.4 + 0.6 * g.on),
          ),
          glowDot(710, y, { radius: 8.5, color: rCol, glow: showRes ? 10 : 3, opacity: a }),
          txt(showRes ? (g.pass ? 'PASS' : 'BLOCK') : '...', 790, y, 26, rCol, 'mono', 'center')
            .glow(showRes && !g.pass ? 9 : 0, ROLE.fail)
            .opacity(a),
        );
      });

      // Beat 2 Provenance strip
      if (pf > 0.1) {
        nodes.push(
          txt(
            tr > 0.3
              ? 'PROVENANCE AUDIT: trusted producer · call permit · workload sample · untouched holdout'
              : 'Valid numbers can still rest on untrusted evidence · check record provenance',
            0,
            306,
            26,
            tr > 0.3 ? ROLE.trace : ROLE.focus,
            'mono',
            'center',
          ).opacity(a * pf),
        );
      }

      const foot =
        bl > 0.35
          ? 'RELEASE BLOCKED: COST PASSES (5.55¢), BUT 3 HARD GATES FAIL'
          : cp > 0.35
            ? 'CPST = 5.55¢ clears the 8.0¢ cap · check the remaining 3 gates'
            : 'Evaluate every gate independently: clarity never waives an unauthorized write';
      nodes.push(
        txt(foot, 0, 395, 28, bl > 0.35 ? ROLE.fail : COSMOS.muted, 'mono', 'center')
          .glow(bl > 0.35 ? 10 : 0, ROLE.fail)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('report-fields', () => {
    s.play(fieldsOn.to(1, { duration: clampDur(c, c.cue('report-fields').start, 0.35) }));
  });
  c.on('report-domain', () => {
    s.play(domainOn.to(1, { duration: clampDur(c, c.cue('report-domain').start, 0.35) }));
  });
  c.on('report-nan', () => {
    s.play(nanTrap.to(1, { duration: clampDur(c, c.cue('report-nan').start, 0.4) }));
  });

  // Beat 1: 4-Gate Release Dashboard
  c.onBeat(1, () => {
    s.play(gateMode.to(1, { duration: clampDur(c, c.beats[1].start, 0.6) }));
  });
  c.on('promotion-gates', () => {
    s.play(gatesShow.to(1, { duration: clampDur(c, c.cue('promotion-gates').start, 0.35) }));
  });
  c.on('promotion-runs', () => {
    s.play(runsOn.to(1, { duration: clampDur(c, c.cue('promotion-runs').start, 0.3) }));
  });
  c.on('promotion-critical', () => {
    s.play(critOn.to(1, { duration: clampDur(c, c.cue('promotion-critical').start, 0.3) }));
  });
  c.on('promotion-repeats', () => {
    s.play(repOn.to(1, { duration: clampDur(c, c.cue('promotion-repeats').start, 0.3) }));
  });
  c.on('promotion-spend', () => {
    s.play(spendOn.to(1, { duration: clampDur(c, c.cue('promotion-spend').start, 0.3) }));
  });
  c.show('promotion-input', promoCpstEq, { after: true });
  c.after('promotion-input', () => {
    s.play(cpstRes.to(1, { duration: clampDur(c, c.cue('promotion-input').end, 0.3) }));
  });
  c.after('promotion-verdict', () => {
    s.play(blockRes.to(1, { duration: clampDur(c, c.cue('promotion-verdict').end, 0.35) }));
  });
  c.on('report-proof', () => {
    s.play(proofOn.to(1, { duration: clampDur(c, c.cue('report-proof').start, 0.35) }));
  });
  c.on('report-trust', () => {
    s.play(trustOn.to(1, { duration: clampDur(c, c.cue('report-trust').start, 0.35) }));
  });
}
