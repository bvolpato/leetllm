// Scene 16 (teacher-forcing): "Which word did each row score?"
// Sequence "bug docs today" -> next-token target alignment -> misaligned shift keeps mean 1.238 while changing task!
import {
  COSMOS,
  DANGER_COLOR,
  DOG_TRACE,
  FRESH_LOGITS,
  FRESH_TRACE,
  LOGITS,
  MARK_COLOR,
  SEQ_WORDS,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  crossSwap,
  glowArrow,
  guardedDynamic,
  heroTitle,
  lossTrace,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

const WRONG_R0 = lossTrace(LOGITS, 0); // scoring 'bug' at row 0 -> 0.170
const WRONG_R1 = lossTrace(FRESH_LOGITS, 1); // scoring 'docs' at row 1 -> 2.306
const MEAN_VAL = (DOG_TRACE.loss + FRESH_TRACE.loss) / 2; // 1.238

export default function teacherForcing(s, c) {
  const vTokens = s.value(1);
  const vRows = s.value(0);

  // View 1 state
  const showShift = s.value(0);
  const showObs1 = s.value(0);
  const showObs2 = s.value(0);
  const showLogitsNote = s.value(0);
  const showContextNote = s.value(0);

  // View 2 state
  const showLosses = s.value(0);
  const showMean = s.value(0);
  const showFirstShare = s.value(0);
  const slideWrong = s.value(0); // 0 = aligned [docs, today], 1 = current-word bug [bug, docs]
  const showWrongResult = s.value(0);
  const showMaskRoles = s.value(0);

  const bgAura = aura(0, 20, 620, '#14384432', '#261a4a18');
  const title = heroTitle(['Teacher Forcing &', 'Next-Token Alignment'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: TARGET_COLOR,
    eyebrow: 'SEQUENCE LANGUAGE MODELING',
  });

  // View 1: Sequence tokens -> next-token prediction arrows
  const viewTokens = guardedDynamic(vTokens, (a) => {
    const xs = [-540, 0, 540];
    const yTok = -130;
    const nodes = [
      txt('OBSERVED TRAINING SEQUENCE', -855, -245, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      // Persistent timeline guide rail across lower canvas (keeps frame balanced from t=0!)
      rule(-855, 325, 855, 325, COSMOS.rule, 2.5).opacity(0.75 * a),
      txt('t = 0  (prefix: bug)', -720, 365, 26, WORD_COLOR[0], 'mono').opacity(a),
      txt('t = 1  (predict: docs)', 0, 365, 26, TARGET_COLOR, 'mono').opacity(a),
      txt('t = 2  (predict: today)', 690, 365, 26, WORD_COLOR[2], 'mono').opacity(a),
    ];

    SEQ_WORDS.forEach((w, i) => {
      nodes.push(
        lumBar(xs[i], yTok, 260, 88, {
          color: WORD_COLOR[i],
          fillOpacity: 0.25,
          strokeWidth: 2.5,
          glow: 9,
          opacity: a,
        }),
        txt(w, xs[i], yTok, 42, WORD_COLOR[i], 'serif').opacity(a),
        txt(`pos ${i}`, xs[i], yTok - 68, 26, COSMOS.muted, 'mono').opacity(a),
      );
    });

    if (showShift.value > 0.02 || showObs1.value > 0.02) {
      const op1 = Math.max(showShift.value * 0.5, showObs1.value) * a;
      nodes.push(
        glowArrow([xs[0] + 145, yTok], [xs[1] - 145, yTok], TARGET_COLOR, { opacity: op1 }),
        txt(
          'Step 1:  Input [bug]  →  Target: docs',
          -855,
          8,
          30,
          TARGET_COLOR,
          'mono',
          'left',
        ).opacity(op1),
      );
    }
    if (showObs2.value > 0.02) {
      nodes.push(
        glowArrow([xs[1] + 145, yTok], [xs[2] - 145, yTok], WORD_COLOR[2], {
          opacity: showObs2.value * a,
        }),
        txt(
          'Step 2:  Input [bug, docs]  →  Target: today',
          -855,
          72,
          30,
          WORD_COLOR[2],
          'mono',
          'left',
        ).opacity(showObs2.value * a),
      );
    }
    if (showLogitsNote.value > 0.02) {
      nodes.push(
        txt(
          'Each hidden state projects to |V| logits (weights can tie with input embeddings)',
          -855,
          155,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showLogitsNote.value * a),
      );
    }
    if (showContextNote.value > 0.02) {
      nodes.push(
        txt(
          'Teacher forcing: feed true "docs" into position 2 even if position 1 guessed "bug"',
          -855,
          230,
          30,
          MARK_COLOR,
          'sans',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(showContextNote.value * a),
      );
    }

    return nodes;
  });

  // View 2: Score table with live sliding target alignment (shows invariance of mean 1.238!)
  const viewRows = guardedDynamic(vRows, (a) => {
    const sw = slideWrong.value;
    const isWrong = sw > 0.5;
    const revWrong = showWrongResult.value > 0.5;

    const r0Loss = isWrong ? WRONG_R0.loss : DOG_TRACE.loss;
    const r1Loss = isWrong ? WRONG_R1.loss : FRESH_TRACE.loss;
    const r0Prob = isWrong ? WRONG_R0.probabilities[0] : DOG_TRACE.probabilities[1];
    const r1Prob = isWrong ? WRONG_R1.probabilities[1] : FRESH_TRACE.probabilities[2];

    const nodes = [
      txt(
        isWrong ? 'MISALIGNED: SCORING CURRENT WORDS (OFF BY 1!)' : 'ALIGNED: SCORING NEXT WORDS',
        -855,
        -245,
        28,
        isWrong ? DANGER_COLOR : TARGET_COLOR,
        'mono',
        'left',
      )
        .glow(6, isWrong ? DANGER_COLOR : TARGET_COLOR)
        .opacity(a),
      // Clean floating column headers (zero boxes!)
      txt('PREFIX', -855, -172, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('SCORES [bug, docs, today]', -510, -172, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('TARGET', 30, -172, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('p(target)', 260, -172, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('LOSS', 525, -172, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      rule(-855, -142, 855, -142, COSMOS.rule, 2).opacity(a),
      // Persistent sequence alignment reference strip along bottom (keeps lower half balanced!)
      rule(-855, 388, 855, 388, COSMOS.cyan, 2.2).opacity(0.65 * a),
      txt('SEQUENCE: [ bug  →  docs  →  today ]', 0, 422, 26, COSMOS.muted, 'mono').opacity(a),
    ];

    const rows = [
      {
        y: -75,
        prefix: 'bug',
        scores: '[3.0, 1.0, 0.0]',
        target: isWrong ? 'bug (0)' : 'docs (1)',
        tCol: isWrong ? DANGER_COLOR : TARGET_COLOR,
        prob: r0Prob,
        loss: r0Loss,
      },
      {
        y: 35,
        prefix: 'bug docs',
        scores: '[0.5, 0.0, 2.0]',
        target: isWrong ? 'docs (1)' : 'today (2)',
        tCol: isWrong ? DANGER_COLOR : WORD_COLOR[2],
        prob: r1Prob,
        loss: r1Loss,
      },
    ];

    rows.forEach((r) => {
      const hideWrongLoss = isWrong && !revWrong;
      nodes.push(
        txt(r.prefix, -855, r.y, 30, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(r.scores, -510, r.y, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
        txt(r.target, 30, r.y, 30, r.tCol, 'mono', 'left').glow(6, r.tCol).opacity(a),
      );
      if (showLosses.value > 0.02 && !hideWrongLoss) {
        const bw = Math.max(8, r.prob * 180);
        nodes.push(
          lumBar(260 + bw / 2, r.y, bw, 32, {
            color: r.tCol,
            fillOpacity: 0.72,
            glow: 7,
            opacity: showLosses.value * a,
          }),
          txt(
            `${(r.prob * 100).toFixed(1)}%`,
            260 + bw + 14,
            r.y,
            26,
            r.tCol,
            'mono',
            'left',
          ).opacity(showLosses.value * a),
          txt(`${r.loss.toFixed(3)} nats`, 525, r.y, 30, MARK_COLOR, 'mono', 'left').opacity(
            showLosses.value * a,
          ),
        );
      } else if (hideWrongLoss) {
        nodes.push(txt('?', 565, r.y, 34, MARK_COLOR, 'mono', 'left').opacity(a));
      }
    });

    if (isWrong && !revWrong) {
      nodes.push(
        txt(
          'Targets slid back 1 token: which row carries the bigger loss now?',
          -855,
          165,
          32,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(a),
      );
    }

    if (showMean.value > 0.02) {
      nodes.push(
        rule(-855, 118, 855, 118, COSMOS.rule, 2).opacity(showMean.value * a),
        txt(
          `Mean loss = (${r0Loss.toFixed(3)} + ${r1Loss.toFixed(3)}) / 2 = ${MEAN_VAL.toFixed(3)} nats`,
          -855,
          178,
          32,
          isWrong && revWrong ? DANGER_COLOR : TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, isWrong && revWrong ? DANGER_COLOR : TARGET_COLOR)
          .opacity((isWrong && !revWrong ? 0 : showMean.value) * a),
      );
    }

    if (showFirstShare.value > 0.02 && !isWrong && showMaskRoles.value < 0.5) {
      nodes.push(
        txt(
          'Missed "docs" drives 87.6% of total sequence loss (2.170 of 2.476 nats)',
          -855,
          255,
          28,
          MARK_COLOR,
          'sans',
          'left',
        ).opacity(showFirstShare.value * (1 - showMaskRoles.value) * a),
      );
    }

    if (isWrong && revWrong) {
      nodes.push(
        txt(
          'Row 2 jumped +2.00 nats, Row 1 dropped −2.00 nats → SAME 1.238 mean, WRONG task!',
          -855,
          255,
          28,
          DANGER_COLOR,
          'sans',
          'left',
        ).opacity(a),
      );
    }

    if (showMaskRoles.value > 0.02) {
      nodes.push(
        txt(
          'Causal mask = hides future inputs   ·   Loss mask = picks target positions to score',
          -855,
          335,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        )
          .glow(6, COSMOS.cyan)
          .opacity(showMaskRoles.value * a),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, viewTokens, viewRows);

  // Beat 0 cues
  c.on('teacher-forcing-0', () => {
    s.play(showShift.to(0.25, { duration: 0.3 }));
  });
  tweenCue(s, c, 'teacher-shift', showShift, 1, { duration: 0.45 });
  tweenCue(s, c, 'teacher-observed', showObs1, 1, { duration: 0.45 });
  tweenCue(s, c, 'teacher-prefix-target', showObs2, 1, { duration: 0.45 });
  tweenCue(s, c, 'teacher-logits', showLogitsNote, 1, { duration: 0.45 });
  tweenCue(s, c, 'teacher-context', showContextNote, 1, { duration: 0.45 });

  // Beat 1-3 cues
  crossSwap(s, c, 'teacher-forcing-1', vTokens, vRows, { duration: 0.55 });
  tweenCue(s, c, 'teacher-token-losses', showLosses, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'teacher-loss-mean', showMean, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'teacher-first-contribution', showFirstShare, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'teacher-current', slideWrong, 1, { duration: 0.65 });
  tweenCue(s, c, 'teacher-wrong-result', showWrongResult, 1, { duration: 0.45, after: true });
  c.on('teacher-realign', () => {
    s.play(slideWrong.to(0, { duration: 0.65 }));
    s.play(showWrongResult.to(0, { duration: 0.3 }));
  });
  tweenCue(s, c, 'teacher-mask-roles', showMaskRoles, 1, { duration: 0.5 });
}
