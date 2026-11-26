// Scene 17: repair-evidence - What did the repair establish?
// Fixed-Scorer Mutation Harness: repairs `attack-014` to open a security review ($0.061),
// verifies all 3 regression rows pass under the UNCHANGED scorer, stress-tests 3 broken
// variants (reversed order, $0.09 over budget, NaN cost), and strictly withholds the
// 0-untouched-trials truth until `c.after('repair-not-trial')`.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  COST_BUDGET,
  OVER_BUDGET_COST,
  REPAIRED_COST,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowMeter,
  guardedDynamic,
  railBar,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function repairEvidence(s, c) {
  const pulse = s.value(0);
  const repairAct = s.value(0);
  const regPass = s.value(0);
  const costPass = s.value(0);
  const varRev = s.value(0);
  const varOver = s.value(0);
  const varNan = s.value(0);
  const varRej = s.value(0);

  const trialMode = s.value(0); // Beat 1: 0 new trials + untouched holdout pipeline
  const zeroTrials = s.value(0);
  const holdoutOn = s.value(0);

  const header = cinemaHeader('REPAIR VERIFICATION', 'What did the', 'repair establish?', {
    accent: ROLE.pass,
    size: 50,
  });

  const stageAura = aura(0, 40, 680, '#6ee7b71a', '#ffd16614');

  // Mode 0 (Beat 0): Locked scorer verifying repaired fixture + rejecting 3 adversarial mutations
  const mode0 = guardedDynamic(
    () => fadeOutHalf(trialMode.value),
    (a) => {
      const p = pulse.value;
      const ra = repairAct.value;
      const rp = regPass.value;
      const cp = costPass.value;
      const vr = varRev.value;
      const vo = varOver.value;
      const vn = varNan.value;
      const vj = varRej.value;
      const nodes = [];

      // Left: Repaired `attack-014` fixture + 3 regression rows
      nodes.push(
        railBar(-840, -180, 260, rp > 0.35 ? ROLE.pass : ROLE.trace, {
          width: 5,
          glow: 9,
          opacity: a,
        }),
        txt('REPAIRED FIXTURE (attack-014)', -810, -160, 26, ROLE.trace, 'mono', 'left').opacity(a),
        txt('1. lookup_candidate', -810, -98, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          '2. open_security_review',
          -810,
          -48,
          28,
          ra > 0.3 ? ROLE.pass : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(ra > 0.3 ? 8 : 0, ROLE.pass)
          .opacity(a),
        txt(
          '3. verify_state',
          -810,
          2,
          28,
          ra > 0.3 ? ROLE.pass : COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        line([-810, 44], [-255, 44], { stroke: '#29385f', width: 2 }).opacity(a),
        txt(
          rp > 0.35 ? 'ALL 3 REGRESSION ROWS: PASS' : 'Checking 3 regression rows...',
          -810,
          96,
          28,
          rp > 0.35 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(rp > 0.35 ? 9 : 0, ROLE.pass)
          .opacity(a),
        txt(
          cp > 0.35
            ? `Cost ${(REPAIRED_COST * 100).toFixed(1)}¢ <= ${(COST_BUDGET * 100).toFixed(0)}¢ budget`
            : 'Checking cost against 8.0¢ cap...',
          -810,
          156,
          26,
          cp > 0.35 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        glowMeter(-810, 206, 540, 22, cp > 0.35 ? REPAIRED_COST / COST_BUDGET : 0, {
          fill: ROLE.pass,
          opacity: a,
        }),
      );

      // Center: Locked Original Scorer Node
      const scNode = autoNode(-55, 40, 'SCORER', {
        radius: 68,
        color: ROLE.host,
        glow: 11,
        opacity: a,
        sub: 'Unchanged rules',
        subColor: ROLE.host,
      });
      const [l0, l1] = trimSeg([-245, 40], [-55, 40], 0, scNode.r);
      const [r0, r1] = trimSeg([-55, 40], [160, 40], scNode.r, 0);
      nodes.push(
        segmentWithPhoton(l0, l1, ROLE.pass, p, { width: 3.4, alpha: a }),
        segmentWithPhoton(r0, r1, vj > 0.35 ? ROLE.fail : ROLE.warn, p + 0.45, {
          width: 3.4,
          alpha: a * (0.35 + 0.65 * Math.max(vr, vo, vn)),
        }),
        scNode.node,
      );

      // Right: 3 Adversarial Scorer-Preservation Mutations
      const variants = [
        {
          label: 'VARIANT A: REVERSED ORDER',
          detail: 'verify -> review -> lookup',
          on: vr,
        },
        {
          label: 'VARIANT B: OVER BUDGET',
          detail: `cost = ${(OVER_BUDGET_COST * 100).toFixed(1)}¢ > 8.0¢`,
          on: vo,
        },
        {
          label: 'VARIANT C: INVALID NaN COST',
          detail: 'cost = NaN (non-finite)',
          on: vn,
        },
      ];
      nodes.push(
        txt('SCORER MUTATION PROBES', 190, -160, 26, ROLE.warn, 'mono', 'left').opacity(a),
      );
      variants.forEach((v, idx) => {
        const y = -82 + idx * 124;
        const active = v.on > 0.3;
        const col = vj > 0.35 ? ROLE.fail : active ? ROLE.warn : COSMOS.dim;
        nodes.push(
          railBar(180, y - 24, y + 48, col, { width: 5, glow: active ? 9 : 3, opacity: a }),
          txt(v.label, 210, y, 26, col, 'mono', 'left').opacity(a),
          txt(v.detail, 210, y + 38, 28, active ? COSMOS.ink : COSMOS.dim, 'mono', 'left').opacity(
            a,
          ),
          glowDot(755, y + 14, { radius: 8.5, color: col, glow: vj > 0.35 ? 11 : 4, opacity: a }),
          txt(
            vj > 0.35 ? 'REJECT' : active ? 'TEST' : '...',
            825,
            y + 14,
            26,
            col,
            'mono',
            'center',
          )
            .glow(vj > 0.35 ? 9 : 0, ROLE.fail)
            .opacity(a),
        );
      });

      const foot =
        vj > 0.35
          ? 'ALL 3 BROKEN VARIANTS REJECTED · ORIGINAL SCORER RULES STAY INTACT'
          : cp > 0.35
            ? 'Repaired row passes (6.1¢ <= 8.0¢) · now mutate it to test the scorer'
            : 'Keep the exact same scorer when verifying a repaired fixture';
      nodes.push(
        txt(
          foot,
          0,
          395,
          28,
          vj > 0.35 ? ROLE.fail : rp > 0.35 ? ROLE.pass : COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1 (Beat 1): 0 new agent trials vs Untouched Release Holdout Pipeline
  const mode1 = guardedDynamic(
    () => fadeInHalf(trialMode.value),
    (a) => {
      const p = pulse.value;
      const zt = zeroTrials.value;
      const ho = holdoutOn.value;
      const nodes = [];

      // Left: Regression Fixture Counter (withholds "0" until `c.after('repair-not-trial')`!)
      nodes.push(
        railBar(-840, -175, 245, zt > 0.35 ? ROLE.focus : COSMOS.muted, {
          width: 5,
          glow: 9,
          opacity: a,
        }),
        txt('HAND-EDITED REGRESSION FIXTURE', -810, -155, 26, ROLE.focus, 'mono', 'left').opacity(
          a,
        ),
        txt('NEW AGENT TRIALS PRODUCED:', -810, -75, 28, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(
          zt > 0.35 ? '0' : '?',
          -560,
          45,
          96,
          zt > 0.35 ? ROLE.focus : COSMOS.dim,
          'mono',
          'center',
        )
          .glow(zt > 0.35 ? 14 : 4, ROLE.focus)
          .opacity(a),
        txt(
          zt > 0.35
            ? 'A new run ID on a copy is still 0 trials'
            : 'Count how many live agent runs happened',
          -810,
          165,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'Keep this case as a regression check',
          -810,
          215,
          26,
          ROLE.trace,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right: Untouched Release Holdout Pipeline (4 connected circular nodes)
      const yTop = -40;
      const yBot = 195;
      const p1 = autoNode(145, yTop, 'FROZEN', {
        radius: 58,
        color: ROLE.host,
        glow: 8 + ho * 4,
        opacity: a,
      });
      const p2 = autoNode(585, yTop, 'UNSEEN', {
        radius: 58,
        color: ho > 0.3 ? ROLE.pass : ROLE.trace,
        glow: 9 + ho * 4,
        opacity: a,
      });
      const p3 = autoNode(145, yBot, 'BUDGET', {
        radius: 58,
        color: ROLE.focus,
        glow: 8 + ho * 4,
        opacity: a,
        sub: 'Keep all runs',
      });
      const p4 = autoNode(585, yBot, 'CHECK', {
        radius: 58,
        color: ROLE.pass,
        glow: 9 + ho * 4,
        opacity: a,
        sub: 'Permit + redact',
      });

      const [e1a, e1b] = trimSeg([145, yTop], [585, yTop], p1.r, p2.r);
      const [e2a, e2b] = trimSeg([585, yTop], [585, yBot], p2.r, p4.r);
      const [e3a, e3b] = trimSeg([145, yTop], [145, yBot], p1.r, p3.r);
      const [e4a, e4b] = trimSeg([145, yBot], [585, yBot], p3.r, p4.r);

      nodes.push(
        txt('REQUIRED FOR RELEASE CLAIM', 365, -210, 26, ROLE.pass, 'mono', 'center').opacity(a),
        txt('Candidate', 145, -148, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('Clean episodes', 585, -148, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        segmentWithPhoton(e1a, e1b, ROLE.pass, p, { width: 3.2, alpha: a * (0.4 + 0.6 * ho) }),
        segmentWithPhoton(e2a, e2b, ROLE.pass, p + 0.3, {
          width: 3.2,
          alpha: a * (0.4 + 0.6 * ho),
        }),
        segmentWithPhoton(e3a, e3b, ROLE.focus, p + 0.5, {
          width: 3.0,
          alpha: a * (0.4 + 0.6 * ho),
        }),
        segmentWithPhoton(e4a, e4b, ROLE.pass, p + 0.7, {
          width: 3.2,
          alpha: a * (0.4 + 0.6 * ho),
        }),
        p1.node,
        p2.node,
        p3.node,
        p4.node,
      );

      nodes.push(
        txt(
          zt > 0.35
            ? '0 NEW TRIALS FROM REGRESSION EDIT · RUN FROZEN CANDIDATE ON UNTOUCHED HOLDOUT'
            : 'Separate regression verification from unseen holdout evaluation',
          0,
          395,
          28,
          zt > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('repair-action', () => {
    s.play(repairAct.to(1, { duration: clampDur(c, c.cue('repair-action').start, 0.35) }));
  });
  c.after('repair-passes', () => {
    s.play(regPass.to(1, { duration: clampDur(c, c.cue('repair-passes').end, 0.3) }));
  });
  c.after('repair-cost-result', () => {
    s.play(costPass.to(1, { duration: clampDur(c, c.cue('repair-cost-result').end, 0.3) }));
  });
  c.on('repair-variants', () => {
    s.play(varRev.to(1, { duration: clampDur(c, c.cue('repair-variants').start, 0.3) }));
  });
  c.on('repair-overbudget-input', () => {
    s.play(varOver.to(1, { duration: clampDur(c, c.cue('repair-overbudget-input').start, 0.3) }));
  });
  c.on('repair-nan', () => {
    s.play(varNan.to(1, { duration: clampDur(c, c.cue('repair-nan').start, 0.3) }));
  });
  c.after('repair-variants-result', () => {
    s.play(varRej.to(1, { duration: clampDur(c, c.cue('repair-variants-result').end, 0.3) }));
  });

  // Beat 1: Zero new trials & untouched holdout
  c.onBeat(1, () => {
    s.play(trialMode.to(1, { duration: clampDur(c, c.beats[1].start, 0.6) }));
  });
  c.after('repair-not-trial', () => {
    s.play(zeroTrials.to(1, { duration: clampDur(c, c.cue('repair-not-trial').end, 0.35) }));
  });
  c.on('new-trials', () => {
    s.play(holdoutOn.to(1, { duration: clampDur(c, c.cue('new-trials').start, 0.4) }));
  });
}
