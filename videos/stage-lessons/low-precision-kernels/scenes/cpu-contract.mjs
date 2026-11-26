// Scene 12: Which values changed before the multiply? Repeating 8-element pattern of Row 1 under S=2 + twin CPU dot product.
import {
  COSMOS,
  aura,
  experiment,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  large,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function cpuContract(s, c) {
  const phase = s.value(0);
  const showDiv = s.value(0);
  const showRnd = s.value(0);
  const showRec = s.value(0);
  const showNeg = s.value(0);
  const showMatmul = s.value(0);

  const bgAura = aura(0, 30, 620, '#ffd1661f', '#5ce1e61a');
  const title = heroTitle(['Which Values Changed', 'Before Multiply?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'ROW 1 PATTERN (8 × 4 = 32) · SCALE S = 2',
  });

  const blockEntries = experiment.block[1].slice(0, 8);

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const dv = showDiv.value;
    const rn = showRnd.value;
    const rc = showRec.value;
    const ng = showNeg.value;
    const mm = showMatmul.value;

    const cellW = 190;
    const gap = 16;
    const totalW = 8 * cellW + 7 * gap;
    const x0 = -totalW * 0.5;
    const yOrig = -148;
    const yRecon = -40;

    const nodes = [
      txt(
        'ORIGINAL ROW 1 GROUP OF 8 (REPEATED 4× TO 32)',
        x0,
        yOrig - 96,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ),
      txt('RECONSTRUCTED FROM FP8 (S = 2)', x0, yRecon + 70, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    for (let i = 0; i < 8; i++) {
      const cx = x0 + i * (cellW + gap) + cellW * 0.5;
      const orig = large[i];
      const rec = blockEntries[i].reconstructed;
      const isPos3 = i === 3;
      const isPos7 = i === 7;
      const changed = isPos3 || isPos7;
      const showChange = (isPos3 && rc > 0.5) || (isPos7 && ng > 0.5);
      const col = changed ? (showChange ? COSMOS.gold : COSMOS.amber) : COSMOS.emerald;

      nodes.push(
        txt(`[${i}]`, cx, yOrig - 58, 26, COSMOS.dim, 'mono'),
        rect(cellW, 64, {
          fill: '#10182b',
          stroke: changed ? COSMOS.amber : '#2c3d62',
          width: changed ? 2.6 : 1.8,
          radius: 8,
        })
          .at(cx, yOrig)
          .glow(changed ? 6 : 0, COSMOS.amber),
        txt(String(orig), cx, yOrig, 30, COSMOS.ink, 'mono'),
        rect(cellW, 64, {
          fill: showChange ? '#271f10' : '#0d1d26',
          stroke: col,
          width: showChange ? 3.2 : 1.8,
          radius: 8,
        })
          .at(cx, yRecon)
          .glow(showChange ? 9 : 3, col),
        txt(
          changed ? (showChange ? String(rec) : '...') : String(rec),
          cx,
          yRecon,
          30,
          showChange ? COSMOS.gold : COSMOS.emerald,
          'mono',
        ),
      );
    }

    // Middle trace: Positions 3 and 7 step-by-step arithmetic
    const yMid = 148;
    nodes.push(
      glassCell(-435, yMid, 790, 150, COSMOS.gold, {
        fill: '#191714',
        glow: 8,
        opacity: 0.25 + 0.75 * dv,
      }),
      txt(
        'POSITION 3 (500 → 512, Δ = +12)',
        -800,
        yMid - 42,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(0.25 + 0.75 * dv),
      txt(
        rc > 0.5
          ? '500 ÷ 2 = 250  →  E4M3 256  →  × 2 = 512'
          : rn > 0.5
            ? '500 ÷ 2 = 250  →  nearest E4M3 = 256'
            : '500 ÷ 2 = 250',
        -800,
        yMid + 18,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(0.25 + 0.75 * dv),

      glassCell(435, yMid, 790, 150, COSMOS.rose, {
        fill: '#201120',
        glow: 8,
        opacity: 0.2 + 0.8 * ng,
      }),
      txt(
        'POSITION 7 (-250 → -256, Δ = -6)',
        70,
        yMid - 42,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(0.2 + 0.8 * ng),
      txt(
        '-250 ÷ 2 = -125  →  E4M3 -128  →  × 2 = -256',
        70,
        yMid + 18,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(0.2 + 0.8 * ng),
    );

    // Bottom: Twin CPU matmul setup (Beat 1)
    const yBot = 355;
    const opM = 0.2 + 0.8 * mm;
    nodes.push(
      glassCell(-435, yBot, 760, 126, COSMOS.blue, { fill: '#10182e', glow: 7, opacity: opM }),
      txt('CPU RUN 1 · ORIGINAL FP32 OPERANDS', -435, yBot - 28, 26, COSMOS.blue, 'mono').opacity(
        opM,
      ),
      txt(
        'x_orig · w_orig  (6 exact + 500, -250)',
        -435,
        yBot + 22,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(opM),
      glowingArc([-48, yBot], [48, yBot], 0, { color: COSMOS.cyan, width: 3.2, opacity: opM }),
      glassCell(435, yBot, 760, 126, COSMOS.cyan, { fill: '#0e1d2e', glow: 8, opacity: opM }),
      txt('CPU RUN 2 · RECONSTRUCTED FROM FP8', 435, yBot - 28, 26, COSMOS.cyan, 'mono').opacity(
        opM,
      ),
      txt('x_fp8 · w_fp8  (6 exact + 512, -256)', 435, yBot + 22, 28, COSMOS.gold, 'mono').opacity(
        opM,
      ),
      glowDot(-790 + ((p * 0.4) % 1) * 1580, 258, { radius: 5, color: COSMOS.cyan, opacity: 0.7 }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('cpu-divide', () =>
    s.play(showDiv.to(1, { duration: remainDuration(c, 'cpu-divide', 0.45) })),
  );
  c.on('cpu-round', () =>
    s.play(showRnd.to(1, { duration: remainDuration(c, 'cpu-round', 0.45) })),
  );
  c.on('cpu-reconstruct', () =>
    s.play(showRec.to(1, { duration: remainDuration(c, 'cpu-reconstruct', 0.45) })),
  );
  c.on('cpu-negative', () =>
    s.play(showNeg.to(1, { duration: remainDuration(c, 'cpu-negative', 0.45) })),
  );
  c.on('cpu-matmul', () =>
    s.play(showMatmul.to(1, { duration: remainDuration(c, 'cpu-matmul', 0.5) })),
  );
}
