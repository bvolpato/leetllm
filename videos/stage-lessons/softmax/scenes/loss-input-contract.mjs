// Scene 13 (loss-input-contract): "Did the model get better?"
// Double-softmax illusion (upper frozen strip vs lower PyTorch-scored strip) -> tensor axis transpose & flatten.
import {
  COSMOS,
  DANGER_COLOR,
  DOG_TRACE,
  FRESH_LOGITS,
  GRAD,
  LOGITS,
  MARK_COLOR,
  MODEL,
  PROBS,
  TARGET_COLOR,
  WORD_COLOR,
  WORDS,
  aura,
  crossSwap,
  fmtPct,
  guardedDynamic,
  heroTitle,
  lumBar,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

const SECOND_PROBS = MODEL.second.probabilities;
const SEQ_SCORES = [LOGITS, FRESH_LOGITS];
const SEQ_TARGETS = [1, 2];

export default function lossInputContract(s, c) {
  const vDouble = s.value(1);
  const vLayout = s.value(0);

  // Double-softmax state
  const showDirect = s.value(0);
  const extraSoftmax = s.value(0);
  const showExtraResult = s.value(0);
  const showRestored = s.value(0);

  // Tensor layout state: 0 = [B=1, S=2, V=3], 1 = [B=1, V=3, S=2], 2 = [B*S=2, V=3]
  const showTargetTypes = s.value(0);
  const layoutMode = s.value(0);
  const showTransposedNote = s.value(0);
  const showFlatNote = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a19322c', '#14384418');
  const title = heroTitle(['Did the Model', 'Actually Get Better?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: DANGER_COLOR,
    eyebrow: 'PYTORCH CROSS-ENTROPY INPUT CONTRACT',
  });

  // View 1: Upper frozen model strip vs Lower PyTorch-scored strip
  const viewDouble = guardedDynamic(vDouble, (a) => {
    const ex = extraSoftmax.value;
    const lowerProbs = PROBS.map((p, i) => p + (SECOND_PROBS[i] - p) * ex);
    const curLoss = DOG_TRACE.loss + (MODEL.second.loss - DOG_TRACE.loss) * ex;
    const curGrad = GRAD[1] + (MODEL.wrongGradient[1] - GRAD[1]) * ex;
    const isDouble = ex > 0.35;

    const nodes = [
      txt(
        'FROZEN MODEL PREDICTION (NEVER MOVES)',
        -855,
        -228,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      ...unitRibbon(-855, -162, 1280, 60, PROBS, WORD_COLOR, { opacity: a }),
      txt(`slept: ${fmtPct(PROBS[1])}`, 465, -162, 30, TARGET_COLOR, 'mono', 'left').opacity(a),

      // Pipeline status between strips
      txt(
        isDouble
          ? 'BUG:  logits → softmax → CrossEntropyLoss (normalizes TWICE!)'
          : 'CORRECT:  raw logits → CrossEntropyLoss (fused log_softmax + NLL)',
        -855,
        -58,
        28,
        isDouble ? DANGER_COLOR : TARGET_COLOR,
        'mono',
        'left',
      )
        .glow(isDouble ? 8 : 6, isDouble ? DANGER_COLOR : TARGET_COLOR)
        .opacity(a),

      txt(
        'DISTRIBUTION SCORED INSIDE PYTORCH LOSS',
        -855,
        12,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      ...unitRibbon(-855, 78, 1280, 60, lowerProbs, WORD_COLOR, { opacity: a }),
      txt(
        `slept: ${fmtPct(lowerProbs[1])}`,
        465,
        78,
        30,
        isDouble ? DANGER_COLOR : TARGET_COLOR,
        'mono',
        'left',
      ).opacity(a),
    ];

    if (showDirect.value > 0.02 || showExtraResult.value > 0.02) {
      const op = Math.max(showDirect.value, showExtraResult.value) * a;
      nodes.push(
        txt(
          `Reported loss:  ${curLoss.toFixed(3)} nats`,
          -855,
          215,
          36,
          isDouble ? DANGER_COLOR : MARK_COLOR,
          'mono',
          'left',
        )
          .glow(7, isDouble ? DANGER_COLOR : MARK_COLOR)
          .opacity(op),
        txt(
          `Gradient on z_slept:  ${curGrad.toFixed(3)}`,
          -40,
          215,
          36,
          isDouble ? DANGER_COLOR : TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, isDouble ? DANGER_COLOR : TARGET_COLOR)
          .opacity(op),
      );
    }

    if (isDouble && showExtraResult.value > 0.3 && showRestored.value < 0.2) {
      nodes.push(
        txt(
          'Loss dropped from 2.17 to 1.39, yet model predictions never moved! Keep this?',
          -855,
          312,
          30,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(showExtraResult.value * a),
      );
    }
    if (showRestored.value > 0.02) {
      nodes.push(
        txt(
          'Restored raw logits: both strips agree, full −0.886 gradient returns!',
          -855,
          312,
          30,
          TARGET_COLOR,
          'sans',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(showRestored.value * a),
      );
    }
    return nodes;
  });

  // View 2: Animated 6-cell tensor morph: [1, S=2, V=3] -> [1, V=3, S=2] -> [2, 3]
  const viewLayout = guardedDynamic(vLayout, (a) => {
    const mode = layoutMode.value; // 0..1 = transpose, 1..2 = flatten
    const t1 = Math.max(0, Math.min(1, mode));
    const t2 = Math.max(0, Math.min(1, mode - 1));

    const cw = 136;
    const ch = 76;
    const gap = 16;

    // Coordinates for cell (pos p in {0,1}, vocab v in {0,1,2})
    const pos0 = (p, v) => [-540 + v * (cw + gap), -105 + p * (ch + gap)];
    const pos1 = (p, v) => [-540 + p * (cw + gap), -145 + v * (ch + gap)];
    const pos2 = (p, v) => [-540 + v * (cw + gap), -105 + p * (ch + gap + 36)];

    const interp = (p, v) => {
      const a0 = pos0(p, v);
      const a1 = pos1(p, v);
      const a2 = pos2(p, v);
      if (mode <= 1) {
        return [a0[0] + (a1[0] - a0[0]) * t1, a0[1] + (a1[1] - a0[1]) * t1];
      }
      return [a1[0] + (a2[0] - a1[0]) * t2, a1[1] + (a2[1] - a1[1]) * t2];
    };

    const shapeLabel =
      mode < 0.5
        ? 'RAW LOGITS:  [B=1, S=2, V=3]'
        : mode < 1.5
          ? 'TRANSPOSED (dim 1 = class):  [B=1, V=3, S=2]'
          : 'FLATTENED (row = position):  [B·S=2, V=3]';

    const nodes = [
      txt(shapeLabel, -855, -248, 30, COSMOS.cyan, 'mono', 'left').glow(6, COSMOS.cyan).opacity(a),
    ];

    // Fade cell labels cleanly out while blocks cross each other in mid-flight (zero P5 stroke-over-text!)
    const distFromInt = Math.abs(mode - Math.round(mode));
    const cellTextOp = Math.max(0, 1 - distFromInt * 7) * a;

    for (let p = 0; p < 2; p++) {
      for (let v = 0; v < 3; v++) {
        const [cx, cy] = interp(p, v);
        const isTarget = SEQ_TARGETS[p] === v;
        nodes.push(
          lumBar(cx, cy, cw, ch, {
            color: isTarget ? MARK_COLOR : WORD_COLOR[v],
            fillOpacity: isTarget ? 0.34 : 0.14,
            strokeWidth: isTarget ? 3.8 : 2,
            glow: isTarget ? 12 : 4,
            opacity: a,
          }),
        );
        if (cellTextOp > 0.02) {
          nodes.push(
            txt(
              `${WORDS[v]} ${SEQ_SCORES[p][v]}`,
              cx,
              cy,
              26,
              isTarget ? MARK_COLOR : COSMOS.ink,
              'mono',
            ).opacity(cellTextOp),
          );
        }
      }
    }

    // Right side target type notes & layout takeaways (floating text, zero bullet cards!)
    const rx = 120;
    // Persistent visual axis-index badge across lower-right (keeps viewLayout balanced from start!)
    nodes.push(
      txt('PYTORCH EXPECTED CLASS AXIS: dim 1', rx, 248, 26, COSMOS.cyan, 'mono', 'left').opacity(
        a,
      ),
      txt(
        'Transpose [B, V, S]  or  Flatten [B·S, V]',
        rx,
        304,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
    );
    if (showTargetTypes.value > 0.02) {
      nodes.push(
        txt('TARGET TENSOR CONTRACTS', rx, -210, 26, MARK_COLOR, 'mono', 'left').opacity(
          showTargetTypes.value * a,
        ),
        txt(
          'Hard labels:  LongTensor [1, 2]  (class indices)',
          rx,
          -142,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(showTargetTypes.value * a),
        txt(
          'Soft labels:  FloatTensor  (nonneg, sum = 1)',
          rx,
          -84,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(showTargetTypes.value * a),
      );
    }
    if (showTransposedNote.value > 0.02) {
      nodes.push(
        txt(
          'transpose(1, 2)  →  class axis on dim 1',
          rx,
          24,
          28,
          TARGET_COLOR,
          'mono',
          'left',
        ).opacity(showTransposedNote.value * a),
      );
    }
    if (showFlatNote.value > 0.02) {
      nodes.push(
        txt('reshape(-1, V)  →  [2, 3] paired with [2]', rx, 86, 28, MARK_COLOR, 'mono', 'left')
          .glow(6, MARK_COLOR)
          .opacity(showFlatNote.value * a),
        txt(
          'Gold target cells stay attached in both layouts',
          rx,
          152,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showFlatNote.value * a),
      );
    }
    return nodes;
  });

  s.add(bgAura, title, viewDouble, viewLayout);

  // Beat 0-2 cues
  c.on('loss-input-contract-0', () => {
    s.play(showDirect.to(0.4, { duration: 0.3 }));
  });
  tweenCue(s, c, 'api-direct-result', showDirect, 1, { duration: 0.45, after: true });
  c.on('loss-input-contract-1', () => {
    s.play(extraSoftmax.to(0.4, { duration: 0.4 }));
  });
  tweenCue(s, c, 'api-extra-softmax', extraSoftmax, 1, { duration: 0.7 });
  tweenCue(s, c, 'api-extra-result', showExtraResult, 1, { duration: 0.45, after: true });
  c.after('api-remove-extra', () => {
    s.play(extraSoftmax.to(0, { duration: 0.7 }));
  });
  tweenCue(s, c, 'api-restored', showRestored, 1, { duration: 0.45 });

  // Beat 3-4 cues
  crossSwap(s, c, 'api-sequence', vDouble, vLayout, { duration: 0.55 });
  tweenCue(s, c, 'api-target-types', showTargetTypes, 1, { duration: 0.45 });
  tweenCue(s, c, 'api-class-axis', layoutMode, 1, { duration: 0.85 });
  tweenCue(s, c, 'api-transposed', showTransposedNote, 1, { duration: 0.45 });
  tweenCue(s, c, 'api-flatten', layoutMode, 2, { duration: 0.85 });
  tweenCue(s, c, 'api-flat-result', showFlatNote, 1, { duration: 0.45 });
}
