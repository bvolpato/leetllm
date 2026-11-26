// Scene 25 (fresh-report): "Would you sign the archive release?"
// Grand finale: 200-case archive McNemar (10 fixes, 2 breaks, p=0.0386) + 9/10 permission Wilson ruler (59.6% < 85% -> HOLD) + F031 generation trace + regression retirement.
import {
  COSMOS,
  ROLE,
  aura,
  exactPairedP,
  fadeIn,
  fadeOut,
  freshAuditDecision,
  glowArrow,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
  verifyInvariant,
  wilsonInterval,
} from '../parts.mjs';
import { drawRateRuler } from '../rate-ruler.mjs';

const BROKEN_IDS = ['F031', 'F118'];
const RECORDS = Array.from({ length: 200 }, (_, i) => {
  const num = i + 1;
  const id = 'F' + String(num).padStart(3, '0');
  const baseline = num > 10 && num <= 190;
  return {
    id,
    baseline,
    candidate: num <= 190 && !BROKEN_IDS.includes(id),
    permission: num >= 22 && num <= 31,
  };
});

const REF = freshAuditDecision();
const PERMS = RECORDS.filter((r) => r.permission);
const PERM_PASS = PERMS.filter((r) => r.candidate).length; // 9
const PERM_CI = wilsonInterval(PERM_PASS, PERMS.length); // [0.5958, 0.9821]
const PAIRED_P = exactPairedP(10, 2); // 0.03857...

verifyInvariant(
  Math.abs(PERM_CI.low - REF.criticalLower) < 1e-12 && Math.abs(PAIRED_P - REF.pairedP) < 1e-12,
  'fresh-report 200-case records must recover freshAuditDecision exactly',
);

export default function fresh(s, c) {
  const phase = s.value(0);
  const showFloor = s.value(0);
  const showPairs = s.value(0);
  const showFixes = s.value(0);
  const showBreaks = s.value(0);
  const showAgg = s.value(0);
  const showTails = s.value(0);
  const showP = s.value(0);
  const showPermFile = s.value(0);
  const showPermRate = s.value(0);
  const showPermBand = s.value(0);
  const showAskSign = s.value(0);
  const showLower = s.value(0);
  const showHold = s.value(0);
  const actTrace = s.value(0);
  const focusF031 = s.value(0);
  const showSource = s.value(0);
  const showAnswer = s.value(0);
  const showTraceAsk = s.value(0);
  const showDiag = s.value(0);
  const actNext = s.value(0);
  const showHoldout = s.value(0);

  const bgAura = aura(160, 20, 640, '#14324c38', '#331a2e22');
  const title = heroTitle(['Would You Sign the', 'Archive Release?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.focus,
    eyebrow: 'CAPSTONE AUDIT · 200 ARCHIVE CASES & PERMISSION GATE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const tr = actTrace.value;
    const nx = actNext.value;

    const act1Op = fadeOut(tr) * fadeOut(nx);
    const act2Op = fadeIn(tr) * fadeOut(nx);
    const act3Op = fadeIn(nx);
    const nodes = [];

    // ACT 1: 200-case paired archive constellation + Permission Wilson Gate Ruler
    if (act1Op > 0.02) {
      const permMode = showPermFile.value;
      const gridOp = fadeOut(permMode);
      const permOp = fadeIn(permMode);

      // Top policy rule on right
      nodes.push(
        txt(
          'ARCHIVE POLICY: STAFF APPROVAL REQUIRED',
          855,
          -395,
          26,
          ROLE.A,
          'mono',
          'right',
        ).opacity(act1Op),
      );

      // LEFT HALF: 200-case constellation -> smoothly swaps to 10 permission cases (F022..F031)
      if (gridOp > 0.02) {
        const gLeft = -825;
        const gTop = -155;
        const stepX = 39;
        const stepY = 34;
        const pairVis = 0.3 + 0.7 * showPairs.value;

        nodes.push(
          txt(
            showTails.value > 0.5
              ? '178 BOTH PASS  ·  10 BOTH FAIL  ·  12 DISAGREEMENTS'
              : '200 PAIRED ARCHIVE CASES (F001 TO F200)',
            -445,
            -210,
            26,
            COSMOS.muted,
            'mono',
          ).opacity(act1Op * gridOp),
        );

        RECORDS.forEach((rec, i) => {
          const colIdx = i % 20;
          const rowIdx = Math.floor(i / 20);
          const cx = gLeft + colIdx * stepX;
          const cy = gTop + rowIdx * stepY;
          const isFix = !rec.baseline && rec.candidate;
          const isBrk = rec.baseline && !rec.candidate;
          let col = COSMOS.dim;
          let fillOp = 0.22;
          let gl = 1;
          if (isFix && showFixes.value > 0.3) {
            col = ROLE.pass;
            fillOp = 0.75;
            gl = 9;
          } else if (isBrk && showBreaks.value > 0.3) {
            col = ROLE.fail;
            fillOp = 0.85;
            gl = 11 * pulse;
          }
          nodes.push(
            lumBar(cx, cy, 30, 24, {
              color: col,
              fillOpacity: fillOp,
              strokeWidth: isFix || isBrk ? 2.0 : 1.0,
              glow: gl,
              radius: 4,
              opacity: act1Op * gridOp * pairVis,
            }),
          );
        });

        if (showFixes.value > 0.02) {
          nodes.push(
            txt('10 fixes (F001..F010)', -640, 222, 30, ROLE.pass, 'mono')
              .glow(7, ROLE.pass)
              .opacity(act1Op * gridOp * showFixes.value),
          );
        }
        if (showBreaks.value > 0.02) {
          nodes.push(
            txt('2 breaks (F031, F118)', -245, 222, 30, ROLE.fail, 'mono')
              .glow(7, ROLE.fail)
              .opacity(act1Op * gridOp * showBreaks.value),
          );
        }
      }

      if (permOp > 0.02) {
        nodes.push(
          txt(
            'CANDIDATE · 10 PERMISSION CASES (F022 TO F031)',
            -445,
            -210,
            26,
            ROLE.B,
            'mono',
          ).opacity(act1Op * permOp),
        );
        PERMS.forEach((rec, i) => {
          const colIdx = i % 5;
          const rowIdx = Math.floor(i / 5);
          const cx = -745 + colIdx * 150;
          const cy = -65 + rowIdx * 118;
          const col = rec.candidate ? ROLE.pass : ROLE.fail;
          nodes.push(
            lumBar(cx, cy, 130, 84, {
              color: col,
              fillOpacity: rec.candidate ? 0.22 : 0.32,
              strokeWidth: rec.candidate ? 2.2 : 3.0,
              glow: rec.candidate ? 7 : 12 * pulse,
              radius: 10,
              opacity: act1Op * permOp,
            }),
            txt(`${rec.id} ${rec.candidate ? '✓' : '×'}`, cx, cy, 28, col, 'mono').opacity(
              act1Op * permOp,
            ),
          );
        });
        if (showPermRate.value > 0.02) {
          nodes.push(
            txt('9 / 10 passed (observed 90.0%)', -445, 165, 34, ROLE.B, 'mono')
              .glow(7, ROLE.B)
              .opacity(act1Op * permOp * showPermRate.value),
          );
        }
      }

      // RIGHT HALF: Permission Gate Wilson Ruler (85% floor vs 59.6% lower end)
      const rLeft = 105;
      const rRight = 830;
      const rCy = 0;

      const headHoldOp = fadeIn(showHold.value);
      const headGateOp = fadeOut(showHold.value);
      if (headGateOp > 0.02) {
        nodes.push(
          txt('PERMISSION GATE (95% WILSON LOWER)', 468, -210, 26, ROLE.focus, 'mono')
            .glow(6, ROLE.focus)
            .opacity(act1Op * headGateOp),
        );
      }
      if (headHoldOp > 0.02) {
        nodes.push(
          txt('DECISION: HOLD RELEASE', 468, -210, 42, ROLE.fail, 'mono')
            .glow(12 * pulse, ROLE.fail)
            .opacity(act1Op * headHoldOp),
        );
      }

      const ruler = drawRateRuler({
        left: rLeft,
        right: rRight,
        cy: rCy,
        interval: PERM_CI,
        observed: PERM_PASS / PERMS.length,
        floor: REF.criticalFloor,
        showObserved: showPermRate.value,
        showInterval: showPermBand.value,
        showFloor: showFloor.value,
        showLower: showLower.value,
        opacity: act1Op * (0.25 + 0.75 * showFloor.value),
        pulse,
      });
      nodes.push(...ruler.nodes);

      if (showFloor.value > 0.02) {
        nodes.push(
          txt('85% FLOOR', ruler.atX(REF.criticalFloor), rCy - 72, 26, ROLE.focus, 'mono')
            .glow(7, ROLE.focus)
            .opacity(act1Op * showFloor.value),
          txt('0%', rLeft, rCy + 44, 26, COSMOS.muted, 'mono').opacity(act1Op * showFloor.value),
          txt('100%', rRight, rCy + 44, 26, COSMOS.muted, 'mono').opacity(act1Op * showFloor.value),
        );
      }
      const lowerRevOp = fadeIn(showLower.value);
      if (lowerRevOp > 0.02) {
        nodes.push(
          txt(`${(PERM_CI.low * 100).toFixed(1)}% < 85%`, 468, 135, 46, ROLE.fail, 'mono')
            .glow(10, ROLE.fail)
            .opacity(act1Op * lowerRevOp),
          txt('Lower bound falls below floor', 468, 192, 28, ROLE.fail, 'sans').opacity(
            act1Op * lowerRevOp,
          ),
        );
      }

      const askOp = showAskSign.value * fadeOut(showLower.value);
      if (askOp > 0.02) {
        nodes.push(
          txt('Sign or hold? Which end decides?', 468, 145, 36, ROLE.focus, 'serif')
            .glow(8, ROLE.focus)
            .opacity(act1Op * askOp),
        );
      }

      // Bottom full-width paired McNemar status bar (strictly non-overlapping)
      const aggOp = showAgg.value * fadeOut(showTails.value) * fadeOut(showP.value);
      const tlOp = fadeIn(showTails.value) * fadeOut(showP.value);
      const pOp = fadeIn(showP.value);

      if (aggOp > 0.02) {
        nodes.push(
          txt('Aggregate: 180 / 200 -> 188 / 200 (+8 net passes)', 0, 355, 36, ROLE.A, 'mono')
            .glow(7, ROLE.A)
            .opacity(act1Op * aggOp),
        );
      }
      if (tlOp > 0.02) {
        nodes.push(
          txt('Exact McNemar tails: 2 × (1 + 12 + 66) / 4096', 0, 355, 36, ROLE.focus, 'mono')
            .glow(7, ROLE.focus)
            .opacity(act1Op * tlOp),
        );
      }
      if (pOp > 0.02) {
        nodes.push(
          txt(
            `All 200 cases: 180 -> 188  (exact paired p = ${PAIRED_P.toFixed(4)} < 0.05)  ·  Permission gate checked separately`,
            0,
            355,
            30,
            ROLE.A,
            'mono',
          ).opacity(act1Op * pOp),
        );
      }
    }

    // ACT 2: Retained Regressions F031 & F118 -> Inspect F031 Context vs Returned Answer
    if (act2Op > 0.02) {
      const fHi = focusF031.value;
      nodes.push(
        txt('RETAINED REGRESSIONS (PASS -> FAIL)', 0, -230, 28, ROLE.fail, 'mono').opacity(act2Op),
        lumBar(-380, -145, 560, 84, {
          color: ROLE.fail,
          fillOpacity: 0.28,
          strokeWidth: fHi > 0.3 ? 3.4 : 2.4,
          glow: fHi > 0.3 ? 13 * pulse : 8,
          radius: 12,
          opacity: act2Op,
        }),
        txt('F031  ·  PERMISSION MISS', -380, -145, 30, ROLE.fail, 'mono').opacity(act2Op),
        lumBar(380, -145, 560, 84, {
          color: COSMOS.dim,
          fillOpacity: 0.14,
          strokeWidth: 2.0,
          glow: 4,
          radius: 12,
          opacity: act2Op,
        }),
        txt('F118  ·  RETAINED REGRESSION', 380, -145, 28, COSMOS.muted, 'mono').opacity(act2Op),
      );

      // Both inspection chambers present from Act 2 start (prevents empty lower half!)
      nodes.push(
        lumBar(-435, 65, 760, 210, {
          color: showSource.value > 0.3 ? ROLE.A : COSMOS.muted,
          fillOpacity: showSource.value > 0.3 ? 0.18 : 0.08,
          strokeWidth: 2.4,
          glow: showSource.value > 0.3 ? 9 : 4,
          radius: 14,
          opacity: act2Op,
        }),
        txt('F031 · FINAL CONTEXT SENT TO MODEL', -435, -2, 26, ROLE.A, 'mono').opacity(act2Op),
        glowArrow([-40, 65], [40, 65], showAnswer.value > 0.3 ? ROLE.fail : COSMOS.muted, {
          width: 3.4,
          tip: 12,
          opacity: act2Op * (0.4 + 0.6 * showAnswer.value),
        }),
        lumBar(435, 65, 760, 210, {
          color: showAnswer.value > 0.3 ? ROLE.fail : COSMOS.muted,
          fillOpacity: showAnswer.value > 0.3 ? 0.22 : 0.08,
          strokeWidth: showAnswer.value > 0.3 ? 2.8 : 2.2,
          glow: showAnswer.value > 0.3 ? 11 * pulse : 4,
          radius: 14,
          opacity: act2Op,
        }),
        txt('F031 · RETURNED CANDIDATE ANSWER', 435, -2, 26, ROLE.fail, 'mono').opacity(act2Op),
      );

      const waitSrc = fadeOut(showSource.value);
      const revSrc = fadeIn(showSource.value);
      if (waitSrc > 0.02) {
        nodes.push(
          txt('Inspecting final context...', -435, 78, 30, COSMOS.dim, 'mono').opacity(
            act2Op * waitSrc * 0.75,
          ),
        );
      }
      if (revSrc > 0.02) {
        nodes.push(
          txt('"Staff approval is required."', -435, 78, 42, ROLE.pass, 'serif')
            .glow(7, ROLE.pass)
            .opacity(act2Op * revSrc),
        );
      }

      const waitAns = fadeOut(showAnswer.value);
      const revAns = fadeIn(showAnswer.value);
      if (waitAns > 0.02) {
        nodes.push(
          txt('Inspecting returned answer...', 435, 78, 30, COSMOS.dim, 'mono').opacity(
            act2Op * waitAns * 0.75,
          ),
        );
      }
      if (revAns > 0.02) {
        nodes.push(
          txt('"Staff approval is optional."', 435, 78, 42, ROLE.fail, 'serif')
            .glow(8, ROLE.fail)
            .opacity(act2Op * revAns),
        );
      }

      const askOp = showTraceAsk.value * fadeOut(showDiag.value);
      const dgOp = fadeIn(showDiag.value);
      if (askOp > 0.02) {
        nodes.push(
          txt('Where would you investigate first?', 0, 295, 42, ROLE.focus, 'serif')
            .glow(8, ROLE.focus)
            .opacity(act2Op * askOp),
        );
      }
      if (dgOp > 0.02) {
        nodes.push(
          txt(
            'The rule reached the model -> inspect generation & prompt first, then rerun end to end',
            0,
            295,
            34,
            ROLE.pass,
            'sans',
          )
            .glow(8, ROLE.pass)
            .opacity(act2Op * dgOp),
        );
      }
    }

    // ACT 3: Retire F031 to Regression + Draw Untouched Permission Holdout for Next Release
    if (act3Op > 0.02) {
      nodes.push(
        lumBar(-435, -10, 720, 275, {
          color: ROLE.exposed,
          fillOpacity: 0.16,
          strokeWidth: 2.6,
          glow: 9,
          radius: 14,
          opacity: act3Op,
        }),
        txt('REGRESSION SUITE', -435, -96, 34, ROLE.exposed, 'mono')
          .glow(7, ROLE.exposed)
          .opacity(act3Op),
        lumBar(-435, 16, 420, 86, {
          color: ROLE.fail,
          fillOpacity: 0.28,
          strokeWidth: 2.8,
          glow: 10,
          radius: 12,
          opacity: act3Op,
        }),
        txt('F031  (guided repair)', -435, 16, 32, ROLE.fail, 'mono').opacity(act3Op),
        txt('Catches the same mistake on future runs', -435, 92, 26, COSMOS.muted, 'sans').opacity(
          act3Op,
        ),
        lumBar(435, -10, 720, 275, {
          color: ROLE.A,
          fillOpacity: 0.14,
          strokeWidth: 2.6,
          glow: 9,
          radius: 14,
          opacity: act3Op,
        }),
        txt('NEXT RELEASE SAMPLE', 435, -96, 34, ROLE.A, 'mono').glow(7, ROLE.A).opacity(act3Op),
      );

      if (showHoldout.value > 0.02) {
        nodes.push(
          lumBar(435, 16, 560, 86, {
            color: ROLE.pass,
            fillOpacity: 0.22,
            strokeWidth: 2.8,
            glow: 12 * pulse,
            radius: 12,
            dash: [10, 7],
            opacity: act3Op * showHoldout.value,
          }),
          txt('Untouched permission holdout', 435, 16, 28, ROLE.pass, 'mono').opacity(
            act3Op * showHoldout.value,
          ),
          txt('Freeze repair first · evaluate cleanly', 435, 96, 26, COSMOS.muted, 'sans').opacity(
            act3Op * showHoldout.value,
          ),
        );
      }

      nodes.push(
        txt(
          `Current release held (59.6% < 85% floor) · next: chat templates & training loss masks`,
          0,
          310,
          32,
          ROLE.focus,
          'sans',
        )
          .glow(7, ROLE.focus)
          .opacity(act3Op),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'archive-floor', showFloor, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'archive-pairs', showPairs, 1, { duration: 0.45 });
  tweenCue(s, c, 'fixes', showFixes, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'breaks', showBreaks, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'aggregate', showAgg, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'archive-tails', showTails, 1, { duration: 0.45 });
  tweenCue(s, c, 'archive-p', showP, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'permission-file', showPermFile, 1, { duration: 0.55 });
  tweenCue(s, c, 'permission-rate', showPermRate, 1, { duration: 0.45 });
  tweenCue(s, c, 'permission-band', showPermBand, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'archive-ask', showAskSign, 1, { duration: 0.4 });
  tweenCue(s, c, 'lower-end', showLower, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'archive-hold', showHold, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'retain-broken', actTrace, 1, { duration: 0.55 });
  tweenCue(s, c, 'open-case', focusF031, 1, { duration: 0.4 });
  tweenCue(s, c, 'trace-source', showSource, 1, { duration: 0.45 });
  tweenCue(s, c, 'trace-answer', showAnswer, 1, { duration: 0.45 });
  tweenCue(s, c, 'trace-ask', showTraceAsk, 1, { duration: 0.4 });
  tweenCue(s, c, 'trace-diagnosis', showDiag, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'archive-regression', actNext, 1, { duration: 0.55 });
  tweenCue(s, c, 'next-holdout', showHoldout, 1, { duration: 0.45, after: true });
}
