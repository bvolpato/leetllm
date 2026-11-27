// Scene 17: What still has to be read? Second-pass probability emission (2N reads) + masking & empty partial state.
import {
  ALL,
  COSMOS,
  SOFTMAX_LOGITS,
  SOFTMAX_PROBS,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function normalizerOutput(s, c) {
  const showProb = s.value(1);
  const askRead = s.value(0);
  const readFirst = s.value(0);
  const revealFirstProb = s.value(0);
  const readRest = s.value(0);
  const showEightRow = s.value(0);

  const showMask = s.value(0);
  const showEmptyMerge = s.value(0);

  const bgAura = aura(0, 15, 620, '#5ce1e620', '#6ee7b716');

  // Beat 0-1: Retained (m, d) + 4 logits -> 4 probability slots
  const probView = guardedDynamic(showProb, (a) => {
    const ask = askRead.value;
    const rf = readFirst.value;
    const p0 = revealFirstProb.value;
    const rr = readRest.value;
    const e8 = showEightRow.value;

    const extraReads = (rf > 0.5 ? 1 : 0) + Math.round(3 * rr);
    const filledCount = (p0 > 0.5 ? 1 : 0) + Math.round(3 * rr);
    const cx = (i) => -390 + i * 310;

    const nodes = [
      heroTitle(['Pass 2:', 'Emitting Probabilities'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.emerald,
        eyebrow: 'ONLINE SOFTMAX · TWO LOGICAL READ PASSES',
      }).opacity(a),

      // Retained register state badge
      glassCell(410, -370, 880, 92, COSMOS.gold, { fill: '#221a10', glow: 9, opacity: a }),
      txt(
        `RETAINED IN REGISTERS:  m = ${ALL.maximum},  d ≈ ${ALL.denominator.toFixed(3)}`,
        410,
        -370,
        26,
        COSMOS.gold,
        'mono',
      )
        .glow(5, COSMOS.gold)
        .opacity(a),

      txt('LOGITS (MEM)', -845, -125, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('PROBABILITIES', -845, 145, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
    ];

    SOFTMAX_LOGITS.forEach((x, i) => {
      const xPos = cx(i);
      const isRead = i < extraReads;
      const isFilled = i < filledCount;
      nodes.push(
        glassCell(xPos, -125, 224, 96, isRead ? COSMOS.gold : COSMOS.blue, {
          fill: isRead ? '#241c10' : '#101d38',
          glow: isRead ? 10 : 5,
          opacity: a,
        }),
        txt(String(x), xPos, -125, 44, isRead ? COSMOS.gold : COSMOS.blue, 'mono').opacity(a),

        glassCell(xPos, 145, 224, 96, isFilled ? COSMOS.emerald : COSMOS.dim, {
          fill: isFilled ? '#0d2624' : '#0f1422',
          dash: isFilled ? undefined : [7, 5],
          glow: isFilled ? 10 : 0,
          opacity: a,
        }),
        txt(
          isFilled ? `${(SOFTMAX_PROBS[i] * 100).toFixed(1)}%` : '·',
          xPos,
          145,
          38,
          isFilled ? COSMOS.emerald : COSMOS.dim,
          'mono',
        )
          .glow(isFilled ? 6 : 0, COSMOS.emerald)
          .opacity(a),
      );

      if (isRead) {
        nodes.push(
          glowingArc([xPos, -68], [xPos, 88], 0, {
            color: COSMOS.cyan,
            width: 4,
            opacity: a,
            core: false,
          }),
        );
      }
    });

    // Bottom read counter / prediction prompt
    const msgCol = e8 > 0.5 ? COSMOS.cyan : p0 > 0.5 ? COSMOS.emerald : COSMOS.gold;
    const msg =
      e8 > 0.5
        ? '8-logit row: 8 + 8 = 16 logical reads (vs 3 passes = 24 reads) · cache changes DRAM hits'
        : rf > 0.5
          ? 'Pass 2: re-read each logit → exp(x − 4) / d (4 + 4 = 8 logical reads)'
          : ask > 0.5
            ? 'Only (m, d) live in registers  ·  What must you read to fill these 4 slots?'
            : 'Pass 1 finished · 4 probability slots still empty';

    nodes.push(
      glassCell(0, 365, 1560, 86, msgCol, { fill: '#101829', glow: 9, opacity: a }),
      txt(msg, 0, 365, 28, msgCol, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: Masking & empty partial state (-inf, 0)
  const maskView = guardedDynamic(showMask, (a) => {
    const emp = showEmptyMerge.value;
    const cx = (i) => -390 + i * 310;

    const nodes = [
      heroTitle(['Masked Logits &', 'Empty Partial State'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.rose,
        eyebrow: 'NONE = ZERO MASS · NO (−∞) − (−∞)',
      }).opacity(a),

      txt('ALL MASKED', -845, -120, 26, COSMOS.rose, 'mono', 'left').opacity(a),
    ];

    for (let i = 0; i < 4; i++) {
      nodes.push(
        glassCell(cx(i), -120, 224, 96, COSMOS.rose, {
          fill: '#26111c',
          dash: [8, 6],
          glow: 7,
          opacity: a,
        }),
        txt('None', cx(i), -120, 38, COSMOS.rose, 'mono').opacity(a),
      );
    }

    nodes.push(
      glassCell(0, 48, 1340, 92, COSMOS.rose, { fill: '#22101a', glow: 9, opacity: a }),
      txt(
        'Fully masked row → zero mass → no probability distribution (model rejects)',
        0,
        48,
        29,
        COSMOS.rose,
        'sans',
      ).opacity(a),
    );

    if (emp > 0.02) {
      nodes.push(
        glassCell(-420, 260, 440, 124, COSMOS.dim, {
          fill: '#111626',
          dash: [7, 5],
          glow: 4,
          opacity: emp * a,
        }),
        txt('EMPTY PARTIAL', -420, 232, 26, COSMOS.muted, 'mono').opacity(emp * a),
        txt('(m = −∞,  d = 0)', -420, 282, 32, COSMOS.ink, 'mono').opacity(emp * a),

        txt('+', -130, 260, 48, COSMOS.gold, 'mono').opacity(emp * a),

        glassCell(110, 260, 360, 124, COSMOS.cyan, { fill: '#0e2234', glow: 8, opacity: emp * a }),
        txt('VALID NEIGHBOR', 110, 232, 26, COSMOS.muted, 'mono').opacity(emp * a),
        txt('(m = 4,  d = 1.20)', 110, 282, 30, COSMOS.cyan, 'mono').opacity(emp * a),

        txt('→', 355, 260, 48, COSMOS.emerald, 'mono').opacity(emp * a),

        glassCell(600, 260, 370, 124, COSMOS.emerald, {
          fill: '#0d2624',
          glow: 10,
          opacity: emp * a,
        }),
        txt('HANDLE SEPARATELY', 600, 232, 26, COSMOS.emerald, 'mono').opacity(emp * a),
        txt('Keep neighbor intact', 600, 282, 28, COSMOS.ink, 'sans').opacity(emp * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, probView, maskView);

  c.on('prob-state', () => s.play(showProb.to(1, { duration: 0.3 })));
  c.on('prob-question', () => s.play(askRead.to(1, { duration: 0.35 })));
  c.on('prob-first', () => s.play(readFirst.to(1, { duration: 0.4 })));
  c.after('prob-value', () => s.play(revealFirstProb.to(1, { duration: 0.35 })));
  c.on('prob-rest', () => s.play(readRest.to(1, { duration: 0.65 })));
  c.on('prob-eight', () => s.play(showEightRow.to(1, { duration: 0.4 })));

  c.on('prob-mask', () => swapViews(s, showProb, showMask, 0.16, 0.22));
  c.on('prob-empty', () =>
    s.play(showEmptyMerge.to(1, { duration: remainDuration(c, 'prob-empty', 0.45) })),
  );
}
