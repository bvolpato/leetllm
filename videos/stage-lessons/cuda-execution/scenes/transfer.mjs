// Scene 23: Ten inputs go to twelve workers. Tail neutral zeros, valid divisor 10 (real zero at T9), FP32 stored value, and .1f log.
import {
  COSMOS,
  EXTENDED_REDUCTION,
  afterDuration,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rule,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const tailNeutral = s.value(0);
  const askPred = s.value(0);
  const showSums = s.value(0);
  const showDivisor = s.value(0);
  const showNumeric = s.value(0);
  const showReport = s.value(0);
  const showFormat = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#6ee7b716');

  const title = heroTitle(['Ten Inputs,', 'Twelve Workers'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'REQUEST 103 · GUARDED TAIL · REAL ZERO AT T9',
  });

  const eqPending = glowTex('\\text{pooled feature} = \\, ?', {
    x: 0,
    y: 266,
    size: 46,
    color: COSMOS.gold,
  });
  const eqSums = glowTex('\\frac{10 + 11 + 6}{?} = \\, ?', {
    x: 0,
    y: 266,
    size: 42,
    color: COSMOS.cyan,
  });
  const eqDiv10 = glowTex('\\frac{10 + 11 + 6}{10} = \\, ?', {
    x: 0,
    y: 266,
    size: 42,
    color: COSMOS.cyan,
  });
  const eqExact = glowTex('\\frac{10 + 11 + 6}{10} = 2.7', {
    x: 0,
    y: 266,
    size: 44,
    color: COSMOS.emerald,
  });

  const fp32Scalar = Math.fround(EXTENDED_REDUCTION.mean);

  const live = guardedDynamic(1, () => {
    const tn = tailNeutral.value;
    const pr = askPred.value;
    const sm = showSums.value;
    const dv = showDivisor.value;
    const rep = showReport.value;
    const fmt = showFormat.value;

    const blockCols = [COSMOS.cyan, COSMOS.violet, COSMOS.blue];
    const blockXs = [-595, 0, 595];
    const cellW = 114;
    const step = 128;

    const nodes = [
      txt(
        pr > 0.5 && sm < 0.5
          ? 'BLOCK 2 HAS THREE ZEROS · HOW MANY CAME FROM THE TICKET?'
          : '3 BLOCKS × 4 THREADS · EXTRA WORKERS PUBLISH NEUTRAL 0 AND JOIN BARRIER',
        -855,
        -205,
        26,
        pr > 0.5 && sm < 0.5 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    EXTENDED_REDUCTION.blocks.forEach((blk, bIdx) => {
      const col = blockCols[bIdx];
      const bx = blockXs[bIdx];
      const startX = bx - 1.5 * step;

      nodes.push(
        glassCell(bx, -25, 550, 245, col, { fill: '#0c1324', glow: 6 }),
        txt(`Block ${bIdx}`, bx, -118, 28, col, 'mono'),
      );

      blk.threads.forEach((th, j) => {
        const cx = startX + j * step;
        const isRealZero = th.index === 9;
        const cellStroke = !th.valid
          ? tn > 0.5
            ? COSMOS.gold
            : COSMOS.dim
          : isRealZero
            ? COSMOS.emerald
            : col;
        const label = th.valid ? String(th.value) : tn > 0.5 ? '0' : '?';

        nodes.push(
          glassCell(cx, -25, cellW, 102, cellStroke, {
            fill: !th.valid ? '#1d1912' : isRealZero ? '#0e2522' : '#101a2e',
            glow: !th.valid && tn > 0.5 ? 8 : isRealZero ? 9 : 4,
            dash: !th.valid ? [8, 5] : undefined,
          }),
          txt(label, cx, -22, 38, !th.valid ? COSMOS.gold : COSMOS.ink, 'mono'),
          txt(
            th.valid ? `T${th.index}` : 'no read',
            cx,
            58,
            26,
            !th.valid ? COSMOS.rose : isRealZero ? COSMOS.emerald : COSMOS.muted,
            'mono',
          ),
        );
      });

      if (sm > 0.5) {
        nodes.push(txt(`subtotal ${blk.subtotal}`, bx, 128, 32, col, 'mono').glow(5, col));
      }
    });

    // Valid-input divisor bracket ending cleanly under T9 (excluding guarded 10 & 11)
    if (dv > 0.05) {
      const leftX = blockXs[0] - 1.5 * step - cellW * 0.5;
      const rightX = blockXs[2] - 0.5 * step + cellW * 0.5;
      const reachX = leftX + (rightX - leftX) * dv;
      nodes.push(
        rule(leftX, 168, reachX, 168, COSMOS.emerald, 4).glow(7, COSMOS.emerald),
        txt(
          '10 valid inputs (T0..T9 including real 0 at T9)',
          (leftX + rightX) * 0.5,
          196,
          26,
          COSMOS.emerald,
          'mono',
        ).opacity(dv),
      );
    }

    // Bottom Python .item() FP32 value vs formatted .1f log
    nodes.push(
      glassCell(-430, 405, 800, 86, rep > 0.5 ? COSMOS.cyan : COSMOS.rule, {
        fill: '#0e192a',
        glow: rep > 0.5 ? 8 : 0,
      }),
      txt(
        rep > 0.5 ? `Python .item(): ${fp32Scalar}` : 'Python .item(): awaiting device scalar',
        -430,
        408,
        28,
        rep > 0.5 ? COSMOS.cyan : COSMOS.muted,
        'mono',
      ),

      glassCell(455, 405, 750, 86, fmt > 0.5 ? COSMOS.emerald : COSMOS.rule, {
        fill: '#0e2222',
        glow: fmt > 0.5 ? 9 : 0,
      }),
      txt(
        fmt > 0.5 ? `Formatted log (.1f): ${fp32Scalar.toFixed(1)}` : 'Log (.1f): ·',
        455,
        408,
        32,
        fmt > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live, eqPending);

  c.on('final-tail', () => s.play(tailNeutral.to(1, { duration: 0.55 })));
  c.on('final-predict', () => s.play(askPred.to(1, { duration: 0.35 })));

  c.on('final-sums', () => s.play(showSums.to(1, { duration: 0.45 })));
  c.swap('final-sums', eqPending, eqSums, { fade: 0.2 });
  c.on('final-divide', () => s.play(showDivisor.to(1, { duration: 0.6 })));
  c.swap('final-divide', eqSums, eqDiv10, { fade: 0.2 });
  // Strict prediction withholding: reveal 2.7 ONLY after "The exact mean is two point seven"
  c.after('final-numeric-result', () => {
    const dur = afterDuration(c, 'final-numeric-result', 0.35);
    s.play(showNumeric.to(1, { duration: dur }));
  });
  c.swap('final-numeric-result', eqDiv10, eqExact, { after: true, fade: 0.2 });

  c.after('final-report', () =>
    s.play(showReport.to(1, { duration: afterDuration(c, 'final-report', 0.35) })),
  );
  c.after('final-format', () =>
    s.play(showFormat.to(1, { duration: afterDuration(c, 'final-format', 0.35) })),
  );
}
