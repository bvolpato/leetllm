// Scene 17 (evaluation-stack): "Would the judge catch the opening error?"
// Human vs LLM-judge rubric labels on 2 rollback answers (prediction hold -> 1 of 2 agree, judge misses "alone"!) -> Config receipt diff catching decoder schema v3 drift!
import {
  BAD_COLOR,
  CONTROL_RECEIPT,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TREATMENT_RECEIPT_DRIFT,
  WARN_COLOR,
  aura,
  guardedDynamic,
  heroTitle,
  lumBar,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function evaluationStack(s, c) {
  const showHuman = s.value(0);
  const showJudge = s.value(0);
  const showAsk = s.value(0);
  const showCompare = s.value(0);
  const toReceipt = s.value(0);
  const showSchema = s.value(0);
  const showReject = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b2a', '#133a4a24');
  const title = heroTitle(['LLM Judge Calibration', '& Configuration Receipts'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: WARN_COLOR,
    eyebrow: 'OFFLINE-TO-ONLINE EVALUATION STACK',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // Part 1: Human vs Judge on the 2 rollback answers
    const p1Op = Math.max(0, 1 - toReceipt.value * 2.6);
    if (p1Op > 0.02) {
      nodes.push(
        txt(
          'OFFLINE CALIBRATION CHECK (RUNBOOK: ACKNOWLEDGEMENT REQUIRED)',
          -855,
          -245,
          26,
          CTRL_COLOR,
          'mono',
          'left',
        ).opacity(p1Op),
        txt('CANDIDATE ANSWER', -855, -172, 26, COSMOS.muted, 'mono', 'left').opacity(p1Op),
        txt('HUMAN LABEL', 135, -172, 26, CTRL_COLOR, 'mono', 'left').opacity(p1Op),
        txt('MODEL JUDGE', 515, -172, 26, WARN_COLOR, 'mono', 'left').opacity(p1Op),

        // Row 1: Requirement claim (both agree: Supported)
        lumBar(0, -85, 1710, 102, { color: GOOD_COLOR, fillOpacity: 0.12, glow: 5, opacity: p1Op }),
        txt(
          '1. “Rollback requires owner acknowledgement.”',
          -830,
          -85,
          28,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(p1Op),
        txt('SUPPORTED', 135, -85, 28, GOOD_COLOR, 'mono', 'left').opacity(
          (0.45 + 0.55 * showHuman.value) * p1Op,
        ),
        txt('SUPPORTED', 515, -85, 28, GOOD_COLOR, 'mono', 'left').opacity(
          (0.35 + 0.65 * showJudge.value) * p1Op,
        ),

        // Row 2: Permission claim ("alone"): Human = UNSUPPORTED, Judge = SUPPORTED (MISS!)
        lumBar(0, 52, 1710, 102, {
          color: showCompare.value > 0.5 ? BAD_COLOR : WARN_COLOR,
          fillOpacity: 0.14,
          glow: 7,
          opacity: p1Op,
        }),
        txt(
          '2. “Acknowledgement alone authorizes rollback.”',
          -830,
          52,
          28,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(p1Op),
        txt('UNSUPPORTED', 135, 52, 28, BAD_COLOR, 'mono', 'left').opacity(
          (0.45 + 0.55 * showHuman.value) * p1Op,
        ),
        txt('SUPPORTED', 515, 52, 28, WARN_COLOR, 'mono', 'left').opacity(
          (0.35 + 0.65 * showJudge.value) * p1Op,
        ),
      );

      // Strict prediction withholding on agreement count
      const qOp = showAsk.value * Math.max(0, 1 - showCompare.value * 2.6) * p1Op;
      if (qOp > 0.02) {
        nodes.push(
          txt(
            'How many of the judge’s labels agree with the human reviewer?',
            -855,
            225,
            34,
            WARN_COLOR,
            'serif',
            'left',
          )
            .glow(7, WARN_COLOR)
            .opacity(qOp),
        );
      }
      const cOp = Math.max(0, (showCompare.value - 0.45) / 0.55) * p1Op;
      if (cOp > 0.02) {
        nodes.push(
          txt(
            'Only 1 of 2! The judge missed “alone.” Always calibrate judges on retained human sets.',
            -855,
            225,
            30,
            BAD_COLOR,
            'mono',
            'left',
          )
            .glow(7, BAD_COLOR)
            .opacity(cOp),
        );
      }
    }

    // Part 2: Configuration receipt validator catching silent decoder schema v3 drift
    const p2Op = Math.max(0, (toReceipt.value - 0.45) / 0.55);
    if (p2Op > 0.02) {
      const drifted = showSchema.value > 0.5;
      const fields = [
        { k: 'index', c: CONTROL_RECEIPT.index, t: TREATMENT_RECEIPT_DRIFT.index, diff: false },
        {
          k: 'generator',
          c: CONTROL_RECEIPT.generator,
          t: TREATMENT_RECEIPT_DRIFT.generator,
          diff: false,
        },
        { k: 'prompt', c: CONTROL_RECEIPT.prompt, t: TREATMENT_RECEIPT_DRIFT.prompt, diff: false },
        {
          k: 'decoder',
          c: CONTROL_RECEIPT.decoder,
          t: drifted ? TREATMENT_RECEIPT_DRIFT.decoder : CONTROL_RECEIPT.decoder,
          diff: drifted,
        },
      ];

      nodes.push(
        txt(
          'CONFIGURATION RECEIPT CHECK (ONLY QUERY POLICY MAY DIFFER)',
          -855,
          -245,
          26,
          CTRL_COLOR,
          'mono',
          'left',
        ).opacity(p2Op),
        txt('FIELD', -855, -172, 26, COSMOS.muted, 'mono', 'left').opacity(p2Op),
        txt('CONTROL RECEIPT', -420, -172, 26, CTRL_COLOR, 'mono', 'left').opacity(p2Op),
        txt('TREATMENT RECEIPT', 165, -172, 26, WARN_COLOR, 'mono', 'left').opacity(p2Op),
        txt('STATUS', 665, -172, 26, COSMOS.muted, 'mono', 'left').opacity(p2Op),
      );

      fields.forEach((f, idx) => {
        const y = -95 + idx * 88;
        const col = f.diff ? BAD_COLOR : GOOD_COLOR;
        nodes.push(
          lumBar(0, y, 1710, 68, {
            color: col,
            fillOpacity: f.diff ? 0.2 : 0.1,
            glow: f.diff ? 9 : 4,
            opacity: p2Op,
          }),
          txt(f.k, -825, y, 28, COSMOS.ink, 'mono', 'left').opacity(p2Op),
          txt(f.c, -420, y, 28, CTRL_COLOR, 'mono', 'left').opacity(p2Op),
          txt(f.t, 165, y, 28, f.diff ? BAD_COLOR : GOOD_COLOR, 'mono', 'left').opacity(p2Op),
          txt(f.diff ? 'MISMATCH!' : 'MATCH', 665, y, 28, col, 'mono', 'left').opacity(p2Op),
        );
      });

      if (showReject.value > 0.02) {
        nodes.push(
          txt(
            'REJECTED BEFORE LIFT: decoder schema v3 confounds rewrite effect with schema change!',
            -855,
            295,
            28,
            BAD_COLOR,
            'mono',
            'left',
          )
            .glow(7, BAD_COLOR)
            .opacity(showReject.value * p2Op),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'human', showHuman, 1, { duration: 0.45 });
  tweenCue(s, c, 'judge', showJudge, 1, { duration: 0.45 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'compare', showCompare, 1, { duration: 0.45, after: true });

  tweenCue(s, c, 'config', toReceipt, 1, { duration: 0.55 });
  tweenCue(s, c, 'schema', showSchema, 1, { duration: 0.45 });
  tweenCue(s, c, 'reject', showReject, 1, { duration: 0.45 });
}
