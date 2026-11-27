// Scene 15: What changes when we split the batch? 7B vs 24 GB OOM floor, microbatch token-mean accumulation, and class-weighted cross-entropy edge cases.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  afterDuration,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  rule,
  txt,
} from '../parts.mjs';

export default function largeModelBudget(s, c) {
  // Part 1: 7B parameter bar vs 24 GB limit (Beats 0..3)
  const showPart1 = s.value(1);
  const wAmt = s.value(0);
  const gAmt = s.value(0);
  const mAmt = s.value(0);
  const fp32Mode = s.value(0);
  const actMode = s.value(0); // 0=off, 1=8GB, 2=4GB

  // Part 2: Microbatch token-mean accumulation (Beats 4..5)
  const showPart2 = s.value(0);
  const microA = s.value(0);
  const microB = s.value(0);
  const showDenom = s.value(0);
  const showSums = s.value(0);
  const showDivide = s.value(0);
  const showMean = s.value(0);

  // Part 3: Class-weighted cross-entropy & ignored-target skip (Beats 6..9)
  const showPart3 = s.value(0);
  const eqScores = s.value(0);
  const baseLoss = s.value(0);
  const weightsLit = s.value(0);
  const wSumsLit = s.value(0);
  const localZero = s.value(0);
  const fullWeightLit = s.value(0);
  const wBackwardLit = s.value(0);
  const ignoredB = s.value(0);
  const zeroWeightLit = s.value(0);
  const skipStepLit = s.value(0);

  const bgAura = aura(0, 30, 560, '#ff6b8b20', '#5ce1e616');

  const title = heroTitle(['Fixed State Floor', 'and Microbatch Scaling'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.rose,
    eyebrow: '7B ON 24 GB · GRADIENT ACCUMULATION · WEIGHTED LOSS',
  });

  // Part 1: 7B parameter memory bars against fixed 24 GB capacity wall
  const part1 = guardedDynamic(showPart1, (a) => {
    const bytesPerVal = 2 + 2 * fp32Mode.value;
    const perTensor = 7 * bytesPerVal; // 14 GB or 28 GB
    const wGB = wAmt.value * perTensor;
    const gGB = gAmt.value * perTensor;
    const mGB = mAmt.value * 2 * perTensor;
    const actGB = actMode.value > 0.05 ? 8 - 4 * Math.max(0, actMode.value - 1) : 0;
    const totalGB = wGB + gGB + mGB + actGB;

    const x0 = -760;
    const pxPerGB = 13.4; // 112 GB = 1500 px
    const capX = x0 + 24 * pxPerGB;
    const barY = -25;

    const terms = [
      { label: 'Weights', gb: wGB, color: COSMOS.blue },
      { label: 'Gradients', gb: gGB, color: COSMOS.cyan },
      { label: '2 Adam moments', gb: mGB, color: COSMOS.rose },
    ];
    if (actMode.value > 0.05) {
      terms.push({ label: 'Activations', gb: actGB, color: COSMOS.emerald });
    }

    const nodes = [
      txt(
        fp32Mode.value > 0.5
          ? '7B PARAMETERS AT 4 BYTES / VALUE (FP32 WEIGHTS + GRADS + MOMENTS)'
          : '7B PARAMETERS AT 2 BYTES / VALUE · FIXED 24 GB GPU LIMIT',
        -855,
        -205,
        26,
        totalGB > 24 ? COSMOS.rose : COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      // 24 GB capacity track background
      rect(24 * pxPerGB, 118, { fill: '#10182b', stroke: COSMOS.rule, width: 2, radius: 6 })
        .at(x0 + 12 * pxPerGB, barY)
        .opacity(a),
    ];

    let cur = 0;
    terms.forEach((term, idx) => {
      if (term.gb > 0.1) {
        const w = term.gb * pxPerGB;
        nodes.push(
          rect(w, 110, { fill: term.color, stroke: null, radius: 4 })
            .at(x0 + cur * pxPerGB + w * 0.5, barY)
            .glow(7, term.color)
            .opacity(0.92 * a),
        );
      }
      cur += term.gb;
      const lx = -760 + idx * 410;
      nodes.push(
        txt(term.label, lx, 165, 28, term.color, 'sans', 'left').opacity(a),
        txt(
          term.gb > 0.1 ? `${term.gb.toFixed(0)} GB` : '·',
          lx,
          216,
          36,
          term.color,
          'mono',
          'left',
        ).opacity(a),
      );
    });

    // 24 GB vertical capacity wall
    nodes.push(
      rule(capX, barY - 82, capX, barY + 82, COSMOS.gold, 5)
        .glow(8, COSMOS.gold)
        .opacity(a),
      txt('24 GB GPU limit', capX, barY - 106, 28, COSMOS.gold, 'mono').opacity(a),
    );

    // Axis ticks
    for (const gb of [0, 24, 56, 84, 112]) {
      const tx = x0 + gb * pxPerGB;
      nodes.push(
        rule(tx, barY + 72, tx, barY + 86, COSMOS.muted, 2).opacity(a),
        txt(`${gb}`, tx, barY + 114, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    const over = totalGB > 24;
    nodes.push(
      glassCell(0, 345, 1700, 102, over ? COSMOS.rose : COSMOS.emerald, {
        fill: over ? '#23101c' : '#0d2224',
        glow: 9,
        opacity: a,
      }),
      txt(
        over
          ? `Total: ${totalGB.toFixed(0)} GB > 24 GB · shrinking activations cannot fit fixed state`
          : `Weights alone: ${totalGB.toFixed(0)} GB <= 24 GB · can a tiny batch train this model?`,
        0,
        348,
        28,
        over ? COSMOS.rose : COSMOS.gold,
        'mono',
      )
        .glow(6, over ? COSMOS.rose : COSMOS.gold)
        .opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Microbatch token-mean accumulation (Ticket A [1] + Ticket B [3, 3, 3] -> 2.5)
  const part2 = guardedDynamic(showPart2, (a) => {
    const mA = microA.value;
    const mB = microB.value;
    const den = showDenom.value;
    const sms = showSums.value;
    const dv = showDivide.value;
    const mn = showMean.value;

    const nodes = [
      txt(
        'GRADIENT ACCUMULATION · MEAN LOSS PER VALID TOKEN',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      // Ticket A (1 valid token, loss 1)
      txt('Microbatch A (1 token)', -540, -110, 30, COSMOS.blue, 'mono').opacity(a),
      glassCell(-540, -10, 250, 112, mA > 0.5 ? COSMOS.blue : COSMOS.rule, {
        fill: '#0f182e',
        glow: mA > 0.5 ? 8 : 0,
        opacity: a,
      }),
      txt(mA > 0.5 ? 'loss 1' : '·', -540, -6, 38, COSMOS.blue, 'mono').opacity(a),

      // Ticket B (3 valid tokens, each loss 3)
      txt('Microbatch B (3 valid tokens)', 260, -110, 30, COSMOS.cyan, 'mono').opacity(a),
    ];

    for (let i = 0; i < 3; i++) {
      const cx = -30 + i * 290;
      const lit = mB * 3 >= i + 0.4;
      nodes.push(
        glassCell(cx, -10, 250, 112, lit ? COSMOS.cyan : COSMOS.rule, {
          fill: '#0e1f30',
          glow: lit ? 8 : 0,
          opacity: a,
        }),
        txt(lit ? 'loss 3' : '·', cx, -6, 38, COSMOS.cyan, 'mono').opacity(a),
      );
    }

    // Full-batch denominator bracket
    if (den > 0.05) {
      nodes.push(
        rule(-665, 92, 675, 92, COSMOS.gold, 4).opacity(den * a),
        txt('4 valid tokens across full batch', 5, 132, 30, COSMOS.gold, 'mono').opacity(den * a),
      );
    }

    // Sums & division by 4
    if (sms > 0.05) {
      nodes.push(
        txt(dv > 0.5 ? '1 / 4 = 0.25' : 'sum = 1', -540, 215, 38, COSMOS.blue, 'mono').opacity(
          sms * a,
        ),
        txt(dv > 0.5 ? '9 / 4 = 2.25' : 'sum = 9', 260, 215, 38, COSMOS.cyan, 'mono').opacity(
          sms * a,
        ),
      );
    }

    // Combined mean readout (strictly withhold 2.5 until showMean!)
    const meanExpr =
      mn > 0.5
        ? '1/4 + 9/4 = 2.5  (exact full-batch mean per token)'
        : dv > 0.5
          ? '1/4 + 9/4 = ?'
          : 'Combined mean loss per token = ?';
    nodes.push(
      glassCell(0, 345, 1480, 108, mn > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#0e1c28',
        glow: 9,
        opacity: a,
      }),
      txt(meanExpr, 0, 348, 36, mn > 0.5 ? COSMOS.emerald : COSMOS.gold, 'mono')
        .glow(6, mn > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
    );
    return group(...nodes);
  });

  // Part 3: Class-weighted cross-entropy + ignored target skip
  const part3 = guardedDynamic(showPart3, (a) => {
    const sc = eqScores.value > 0.5;
    const bl = baseLoss.value > 0.5;
    const wt = weightsLit.value > 0.5;
    const ws = wSumsLit.value > 0.5;
    const lz = localZero.value > 0.5;
    const fw = fullWeightLit.value > 0.5;
    const wb = wBackwardLit.value > 0.5;
    const ig = ignoredB.value > 0.5;
    const zw = zeroWeightLit.value > 0.5;
    const sk = skipStepLit.value > 0.5;

    const nodes = [
      txt(
        bl
          ? 'CLASS-WEIGHTED CROSS-ENTROPY · UNWEIGHTED LOSS = -ln(1/2) = ln(2)'
          : 'CLASS-WEIGHTED CROSS-ENTROPY',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    const colXs = [-710, -430, -110, 240, 620];
    const headers = ['TICKET', 'TARGET', 'LOGITS', 'WEIGHT', 'WEIGHTED SUM'];
    headers.forEach((h, i) => {
      nodes.push(txt(h, colXs[i], -125, 26, COSMOS.muted, 'mono').opacity(a));
    });

    const rows = [
      { name: 'A', target: 'class 0', weight: '0', wSum: '0', color: COSMOS.blue, off: false },
      {
        name: 'B',
        target: ig ? 'ignored' : 'class 1',
        weight: ig ? 'excluded' : '1',
        wSum: ig ? '0' : 'ln(2)',
        color: ig ? COSMOS.dim : COSMOS.cyan,
        off: ig,
      },
    ];

    rows.forEach((r, idx) => {
      const cy = -28 + idx * 124;
      nodes.push(
        glassCell(0, cy, 1660, 96, r.off ? COSMOS.rule : r.color, {
          fill: r.off ? '#0c101c' : '#0f182c',
          glow: r.off ? 0 : 6,
          opacity: a,
        }),
        txt(r.name, colXs[0], cy + 4, 38, r.color, 'mono').opacity(a),
        txt(r.target, colXs[1], cy + 4, 30, r.off ? COSMOS.rose : r.color, 'mono').opacity(a),
        txt(sc ? '[0, 0]' : '·', colXs[2], cy + 4, 32, r.color, 'mono').opacity(a),
        txt(
          wt ? r.weight : '·',
          colXs[3],
          cy + 4,
          32,
          r.off ? COSMOS.rose : r.color,
          'mono',
        ).opacity(a),
        txt(ws ? r.wSum : '?', colXs[4], cy + 4, 34, r.color, 'mono').opacity(a),
      );
    });

    // Bottom totals and decision
    const fullWtText = ig
      ? zw
        ? 'Full batch weight = 0'
        : 'Full batch weight = ?'
      : fw
        ? 'Full batch weight = 0 + 1 = 1'
        : 'Full batch weight = ?';

    const aDivText = ig
      ? ''
      : wb
        ? 'Ticket A backward: 0 / 1 = 0'
        : lz
          ? 'Ticket A local mean: 0 / 0 (NaN!)'
          : '';

    nodes.push(
      txt(fullWtText, -815, 220, 34, COSMOS.gold, 'mono', 'left').opacity(a),
      txt(aDivText, 815, 220, 32, wb ? COSMOS.emerald : COSMOS.rose, 'mono', 'right').opacity(a),
    );

    let verdict = 'Predict Ticket A backward contribution...';
    let vCol = COSMOS.gold;
    if (!ig && wb) {
      verdict = 'Divide by full weight 1 -> Ticket A grad = 0 · Mean loss ≈ 0.693';
      vCol = COSMOS.emerald;
    } else if (ig && !sk) {
      verdict = 'Target B ignored (remaining weight = 0) · Should optimizer step?';
      vCol = COSMOS.gold;
    } else if (ig && sk) {
      verdict = 'Total weight = 0 -> Mean undefined -> SKIP OPTIMIZER STEP';
      vCol = COSMOS.rose;
    }

    nodes.push(
      glassCell(0, 345, 1660, 108, vCol, { fill: '#101627', glow: 9, opacity: a }),
      txt(verdict, 0, 348, 32, vCol, 'mono').glow(6, vCol).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3);

  // Part 1 cues
  c.on('large-weights', () => s.play(wAmt.to(1, { duration: 0.6 })));
  c.on('large-gradients', () => s.play(gAmt.to(1, { duration: 0.6 })));
  c.on('large-moments', () => s.play(mAmt.to(1, { duration: 0.6 })));
  c.on('large-fp32', () => s.play(fp32Mode.to(1, { duration: 0.7 })));
  c.on('large-fixed-floor', () => {
    s.play(fp32Mode.to(0, { duration: 0.25 }));
    s.play(actMode.to(1, { duration: 0.25 }));
    s.play(delay(actMode.to(2, { duration: 0.65 }), 0.3));
  });

  // Part 2 cues
  c.on('micro-first', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(microA.to(1, { duration: 0.35 }), 0.25),
      ),
    );
  });
  c.on('micro-second', () => s.play(microB.to(1, { duration: 0.6 })));
  c.on('micro-denominator', () => s.play(showDenom.to(1, { duration: 0.45 })));
  c.on('micro-sums', () => s.play(showSums.to(1, { duration: 0.45 })));
  c.on('micro-divide', () => s.play(showDivide.to(1, { duration: 0.45 })));
  c.after('micro-mean', () =>
    s.play(showMean.to(1, { duration: afterDuration(c, 'micro-mean', 0.4) })),
  );

  // Part 3 cues
  c.on('equal-scores', () => {
    s.play(
      par(
        showPart2.to(0, { duration: 0.2 }),
        delay(showPart3.to(1, { duration: 0.25 }), 0.22),
        delay(eqScores.to(1, { duration: 0.35 }), 0.25),
      ),
    );
  });
  c.on('base-loss', () => s.play(baseLoss.to(1, { duration: 0.35 })));
  c.on('micro-weight-units', () => s.play(weightsLit.to(1, { duration: 0.45 })));
  c.on('weighted-sums', () => s.play(wSumsLit.to(1, { duration: 0.4 })));
  c.on('local-mean', () => s.play(localZero.to(1, { duration: 0.35 })));
  c.on('weighted-total', () => s.play(fullWeightLit.to(1, { duration: 0.4 })));
  c.after('weighted-backward', () =>
    s.play(wBackwardLit.to(1, { duration: afterDuration(c, 'weighted-backward', 0.4) })),
  );
  c.on('ignore-target', () => s.play(ignoredB.to(1, { duration: 0.4 })));
  c.on('no-target-weight', () => s.play(zeroWeightLit.to(1, { duration: 0.35 })));
  c.after('skip-update', () =>
    s.play(skipStepLit.to(1, { duration: afterDuration(c, 'skip-update', 0.4) })),
  );
}
