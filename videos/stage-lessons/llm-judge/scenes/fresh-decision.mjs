// Scene 18: fresh-decision - What should Maya do with the restore verdict?
// Finale synthesis across 3 living instruments:
//   Act 0 (Beat 0): Restore-41 order-swap dial resolving A(first)=alpha=B(reversed),
//                   then counterfactual reversed=tie -> unresolved.
//   Act 1 (Beat 1): 20-column -> 21-column denominator wave (14/20=70% coverage, 10/14=71.4%
//                   agreement -> +1 parse error drops coverage to 14/21=66.7%, agreement holds!).
//   Act 2 (Beats 2-3): Restore-41 completion track rejecting repeat restore (prediction pause
//                      on Beat 2!) -> finale emerald reveal: Verify recovery by reading file!
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_BASE_REPORT,
  FRESH_PARSE_REPORT,
  ROLE,
  aggregateSwaps,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowMeter,
  guardedDynamic,
  quadArcPts,
  restoreTie,
  restoreVotes,
  txt,
} from '../parts.mjs';

export default function freshDecision(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = restore swap, 1 = 20->21 denominator wave, 2 = completion finale
  const verdOn = s.value(0);
  const alphaReveal = s.value(0);
  const tieMode = s.value(0);
  const tieOutcome = s.value(0);
  const ratesOn = s.value(0);
  const parse21On = s.value(0);
  const newCovOn = s.value(0);
  const agrHoldOn = s.value(0);
  const compRecOn = s.value(0);
  const repeatFailOn = s.value(0);
  const repairReveal = s.value(0);
  const fileCheckOn = s.value(0);

  const restoreWinner = aggregateSwaps(...restoreVotes);
  const tieResult = aggregateSwaps(restoreVotes[0], restoreTie);

  const header = cinemaHeader(
    'END-TO-END DECISION SYNTHESIS',
    'What should Maya do',
    'with the restore verdict?',
    { accent: ROLE.ok, size: 48 },
  );

  const stageAura = aura(200, 40, 640, '#6ee7b71e', '#5ce1e61a');

  // Act 0: Restore-41 swap resolution + tie counterfactual
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const vt = verdOn.value;
      const al = alphaReveal.value;
      const tm = tieMode.value;
      const to = tieOutcome.value;
      const p = 0;
      const nodes = [];

      const c1X = -510;
      const c2X = 510;
      const yA = -60;
      const yB = 75;

      nodes.push(
        txt('CALL 1: (A: alpha, B: beta)', c1X, -135, 26, ROLE.stepwise, 'mono', 'center').opacity(
          a,
        ),
        txt('CALL 2: (A: beta, B: alpha)', c2X, -135, 26, ROLE.stepwise, 'mono', 'center').opacity(
          a,
        ),
        txt('Slot A -> alpha', c1X, yA, 30, ROLE.ok, 'mono', 'center').opacity(a),
        txt('Slot B -> beta', c1X, yB, 28, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('Slot A -> beta', c2X, yA, 28, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('Slot B -> alpha', c2X, yB, 30, ROLE.ok, 'mono', 'center').opacity(a),
      );

      // Verdict badges
      nodes.push(
        txt('Receipt 1: A', c1X, 185, 38, ROLE.verdict, 'mono', 'center')
          .glow(7, ROLE.verdict)
          .opacity(a),
        txt(
          tm > 0.4 ? 'Receipt 2: tie' : vt > 0.35 ? 'Receipt 2: B' : 'Receipt 2: ...',
          c2X,
          185,
          38,
          tm > 0.4 ? ROLE.conflict : ROLE.verdict,
          'mono',
          'center',
        )
          .glow(7, tm > 0.4 ? ROLE.conflict : ROLE.verdict)
          .opacity(a),
      );

      // Glowing identity arcs converging cleanly through the open center [-290..+290]
      if (al > 0.05 && tm < 0.4) {
        nodes.push(
          beamWithPhotons(quadArcPts([-290, yA], [-40, 270], 35), ROLE.ok, p * 1.2, {
            alpha: a * al,
            width: 3.6,
          }),
          beamWithPhotons(quadArcPts([290, yB], [40, 270], 35), ROLE.ok, p * 1.2 + 0.5, {
            alpha: a * al,
            width: 3.6,
          }),
          txt(`BOTH IDENTIFY ${restoreWinner.toUpperCase()}`, 0, 325, 42, ROLE.ok, 'mono', 'center')
            .glow(10, ROLE.ok)
            .opacity(a * al),
        );
      } else if (tm >= 0.4) {
        nodes.push(
          beamWithPhotons(quadArcPts([-290, 185], [-40, 270], 18), ROLE.conflict, p * 1.3, {
            alpha: a,
            width: 3.4,
          }),
          beamWithPhotons(quadArcPts([290, 185], [40, 270], 18), ROLE.conflict, p * 1.3 + 0.5, {
            alpha: a,
            width: 3.4,
          }),
          txt(
            to > 0.4
              ? `A + TIE -> ${tieResult.toUpperCase()} (CONSERVATIVE RULE)`
              : 'REPLAY: ONE PICK + ONE TIE -> ?',
            0,
            325,
            34,
            ROLE.conflict,
            'mono',
            'center',
          )
            .glow(8, ROLE.conflict)
            .opacity(a),
        );
      } else {
        nodes.push(
          txt(
            'Follow each slot letter back to its reply...',
            0,
            325,
            32,
            ROLE.verdict,
            'serif',
            'center',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Act 1: 20-column -> 21-column denominator wave
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const rt = ratesOn.value;
      const p21 = parse21On.value;
      const nc = newCovOn.value;
      const ah = agrHoldOn.value;
      const nodes = [];

      const total = p21 > 0.35 ? FRESH_PARSE_REPORT.attempted : FRESH_BASE_REPORT.attempted;
      const colW = 54;
      const gap = 22;
      const startX = -((total - 1) * (colW + gap)) * 0.5;
      const baseY = 10;

      nodes.push(
        txt(
          p21 > 0.35
            ? '21 ATTEMPTED PAIRS  (10 MATCH · 4 MISS · 6 NON-RESOLVED · 1 PARSE ERR)'
            : '20 ATTEMPTED PAIRS  (14 RESOLVED · 10 MATCH HUMAN LABELS)',
          0,
          -190,
          26,
          p21 > 0.35 ? ROLE.conflict : ROLE.stepwise,
          'mono',
          'center',
        ).opacity(a),
      );

      for (let i = 0; i < total; i++) {
        const x = startX + i * (colW + gap);
        let col = '#32426b';
        let h = 88;
        if (i < 10) {
          col = ROLE.ok;
          h = 152;
        } else if (i < 14) {
          col = ROLE.stepwise;
          h = 122;
        } else if (i === 20) {
          col = ROLE.conflict;
          h = 74;
        }
        const bar = rect(colW, h, {
          fill: col,
          stroke: '#ffffff',
          width: i === 20 ? 2.4 : 1,
          radius: 6,
        })
          .at(x, baseY - h * 0.5)
          .opacity(a * (i < 14 || i === 20 ? 0.9 : 0.45));
        if (i === 20 || i < 10) bar.glow(7, col);
        nodes.push(bar);
      }

      // Bottom coverage vs conditional agreement readouts
      const covFrac = nc > 0.4 ? FRESH_PARSE_REPORT.coverage : FRESH_BASE_REPORT.coverage;
      const covTxt =
        nc > 0.4
          ? `COVERAGE: 14 / 21 = ${(FRESH_PARSE_REPORT.coverage * 100).toFixed(1)}%`
          : p21 > 0.35
            ? `COVERAGE (21 PAIRS): ?  (prior: 14/20 = ${(FRESH_BASE_REPORT.coverage * 100).toFixed(0)}%)`
            : `COVERAGE: 14 / 20 = ${(FRESH_BASE_REPORT.coverage * 100).toFixed(0)}%`;

      if (rt < 0.05) {
        nodes.push(
          txt(
            'EMERALD: 10 MATCH  ·  CYAN: 4 MISS  ·  DIM: 6 NON-RESOLVED',
            0,
            245,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(a),
        );
      }
      if (rt > 0.05) {
        const covSize = p21 > 0.35 && nc <= 0.4 ? 26 : 30;
        const covCol = nc > 0.4 ? ROLE.conflict : p21 > 0.35 ? ROLE.verdict : ROLE.ok;
        nodes.push(
          txt(covTxt, -840, 145, covSize, covCol, 'mono', 'left')
            .glow(7, covCol)
            .opacity(a * rt),
          glowMeter(-840, 198, 740, 28, covFrac, {
            fill: nc > 0.4 ? ROLE.conflict : ROLE.ok,
            opacity: a * rt,
          }),
          txt(
            `CONDITIONAL AGREEMENT: 10 / 14 = ${(FRESH_BASE_REPORT.agreement * 100).toFixed(1)}%`,
            80,
            145,
            30,
            ah > 0.4 ? ROLE.stepwise : ROLE.verdict,
            'mono',
            'left',
          )
            .glow(7, ah > 0.4 ? ROLE.stepwise : ROLE.verdict)
            .opacity(a * rt),
          glowMeter(80, 198, 740, 28, FRESH_BASE_REPORT.agreement, {
            fill: ah > 0.4 ? ROLE.stepwise : ROLE.verdict,
            opacity: a * rt,
          }),
          txt(
            ah > 0.4
              ? 'PARSE FAILURE LOWERS COVERAGE · AGREEMENT STAYS 10 / 14'
              : 'KEEP BOTH DENOMINATORS VISIBLE',
            0,
            310,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(a * rt),
        );
      }

      return group(...nodes);
    },
  );

  // Act 2: Finale Restore-41 completion state & verified recovery!
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = 0;
      const cr = compRecOn.value;
      const rf = repeatFailOn.value;
      const rp = repairReveal.value;
      const fc = fileCheckOn.value;
      const nodes = [];

      const xs = [-620, -200, 220, 640];
      const labels4 = ['REQUESTED', 'RUNNING', 'RESTORE COMPLETED', 'VERIFY RECOVERY'];
      const trackY = 15;

      nodes.push(
        txt(
          'ALPHA (CLARITY WINNER): “Run the restore again.”',
          -840,
          -170,
          28,
          ROLE.stepwise,
          'sans',
          'left',
        ).opacity(a),
        line([xs[0], trackY], [xs[3], trackY], { stroke: '#2a3a62', width: 6 }).opacity(a),
      );

      if (cr > 0.05) {
        nodes.push(
          line([xs[0], trackY], [xs[2], trackY], { stroke: ROLE.ok, width: 6 })
            .glow(10, ROLE.ok)
            .opacity(a * cr),
        );
      }
      if (rp > 0.05) {
        nodes.push(
          line([xs[2], trackY], [xs[3], trackY], { stroke: ROLE.ok, width: 6 })
            .glow(12, ROLE.ok)
            .opacity(a * rp),
        );
      }

      labels4.forEach((lb, i) => {
        const done = (i <= 2 && cr > 0.4) || (i === 3 && rp > 0.4);
        const col = done ? ROLE.ok : '#3d4f7a';
        nodes.push(
          circle(done ? 22 : 18, { fill: '#0b1224', stroke: col, width: done ? 4 : 2.5 })
            .at(xs[i], trackY)
            .glow(done ? 10 : 0, col)
            .opacity(a),
          txt(lb, xs[i], trackY - 54, 26, done ? col : COSMOS.dim, 'mono', 'center').opacity(a),
        );
      });

      if (rf > 0.05) {
        const backArc = quadArcPts([xs[2], trackY + 20], [xs[0], trackY + 20], 105);
        nodes.push(
          beamWithPhotons(backArc, ROLE.conflict, p * 1.2, { alpha: a * rf, width: 3.6 }),
          txt(
            'REPEATING RESTORE REDOS FINISHED WORK',
            -200,
            trackY + 165,
            28,
            ROLE.conflict,
            'mono',
            'center',
          )
            .glow(7, ROLE.conflict)
            .opacity(a * rf),
        );
      }

      // Strict prediction withholding on Beat 2!
      if (rp < 0.05) {
        nodes.push(
          txt(
            'What should Maya check next to see if the backup is usable?',
            0,
            290,
            34,
            ROLE.verdict,
            'serif',
            'center',
          )
            .glow(6, ROLE.verdict)
            .opacity(a),
        );
      } else {
        nodes.push(
          glowDot(xs[3], trackY, { radius: 11, color: ROLE.ok, glow: 18, opacity: a * rp }),
          txt('VERIFY RECOVERY INSTEAD', 430, trackY + 165, 34, ROLE.ok, 'mono', 'center')
            .glow(10, ROLE.ok)
            .opacity(a * rp),
        );
      }

      if (fc > 0.05) {
        nodes.push(
          txt(
            'READ A KNOWN FILE FROM THE RESTORED COPY · COMPARE TO EXPECTED VERSION',
            0,
            290,
            26,
            ROLE.stepwise,
            'mono',
            'center',
          )
            .glow(6, ROLE.stepwise)
            .opacity(a * fc),
          txt(
            'Judge settled clarity preference · Service record changed Maya’s next step',
            0,
            356,
            28,
            COSMOS.ink,
            'serif',
            'center',
          ).opacity(a * fc),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);

  // Beat 0: Restore-41 swap resolution + tie counterfactual
  c.on('fresh-slots', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('fresh-slots').start, 0.25) }));
  });
  c.on('fresh-verdicts', () => {
    s.play(verdOn.to(1, { duration: clampDur(c, c.cue('fresh-verdicts').start, 0.3) }));
  });
  c.on('fresh-predict', () => {
    s.play(verdOn.to(1, { duration: 0.12 }));
  });
  c.after('fresh-identity', () => {
    s.play(alphaReveal.to(1, { duration: clampDur(c, c.cue('fresh-identity').end, 0.35) }));
  });
  c.on('fresh-tie', () => {
    s.play(tieMode.to(1, { duration: clampDur(c, c.cue('fresh-tie').start, 0.35) }));
  });
  c.after('fresh-tie-complete', () => {
    s.play(tieOutcome.to(1, { duration: clampDur(c, c.cue('fresh-tie-complete').end, 0.35) }));
  });

  // Beat 1: 20 -> 21 denominator wave
  c.on('fresh-denominators', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('fresh-denominators').start, 0.35) }));
  });
  c.after('fresh-rates', () => {
    s.play(ratesOn.to(1, { duration: clampDur(c, c.cue('fresh-rates').end, 0.35) }));
  });
  c.on('fresh-parse', () => {
    s.play(parse21On.to(1, { duration: clampDur(c, c.cue('fresh-parse').start, 0.35) }));
  });
  c.after('fresh-new-coverage', () => {
    s.play(newCovOn.to(1, { duration: clampDur(c, c.cue('fresh-new-coverage').end, 0.35) }));
  });
  c.after('fresh-coverage-repair', () => {
    s.play(agrHoldOn.to(1, { duration: clampDur(c, c.cue('fresh-coverage-repair').end, 0.35) }));
  });

  // Beats 2-3: Completion state & finale verify recovery!
  c.on('fresh-return', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('fresh-return').start, 0.35) }));
  });
  c.on('fresh-completion', () => {
    s.play(compRecOn.to(1, { duration: clampDur(c, c.cue('fresh-completion').start, 0.35) }));
  });
  c.after('fresh-state-failure', () => {
    s.play(repeatFailOn.to(1, { duration: clampDur(c, c.cue('fresh-state-failure').end, 0.35) }));
  });
  c.on('fresh-next', () => {
    s.play(repeatFailOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding: reveal "Verify recovery instead" AFTER spoken clause!
  c.after('fresh-state-repair', () => {
    s.play(repairReveal.to(1, { duration: clampDur(c, c.cue('fresh-state-repair').end, 0.35) }));
  });
  c.on('verify-file', () => {
    s.play(fileCheckOn.to(1, { duration: clampDur(c, c.cue('verify-file').start, 0.35) }));
  });
}
