// Scene 24: Which four-bit code is nearest?: Exact NF4_LEVELS asymmetric quantile ruler + central 5-level zoom prediction + scale-2 decode.
import {
  COSMOS,
  NF4_LEVELS,
  NF4_SAMPLE,
  NF4_SAMPLE_WEIGHTS,
  aura,
  circle,
  fmtNum,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function nf4Codec(s, c) {
  const phase = s.value(0);
  const showLevels = s.value(0);
  const showScale = s.value(0);
  const showNorm = s.value(0);
  const zoomIn = s.value(0);
  const revealPos = s.value(0); // strictly withheld until after nf4-positive!
  const revealNeg = s.value(0); // strictly withheld until after nf4-negative!
  const revealEnds = s.value(0); // strictly withheld until after nf4-ends!
  const decodePos = s.value(0); // strictly withheld until after nf4-read-positive!
  const decodeNeg = s.value(0); // strictly withheld until after nf4-read-negative!

  const bgAura = aura(0, -10, 620, '#ffd1661c', '#5ce1e61a');
  const title = heroTitle(['NormalFloat4 (NF4):', 'Which Code Is Nearest?'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'ASYMMETRIC 16-LEVEL QUANTILE CODEBOOK',
  });

  const rulerY = -95;
  const xSpan = 740;

  const live = guardedDynamic(1, () => {
    const zm = zoomIn.value > 0.35 || showScale.value > 0.35;
    const domain = zm ? 0.21 : 1.0;
    const mapX = (val) => (val / domain) * xSpan;

    const sc = showScale.value > 0.4;
    const nm = showNorm.value > 0.4;
    const rp = revealPos.value > 0.5;
    const rn = revealNeg.value > 0.5;
    const re = revealEnds.value > 0.5;
    const dp = decodePos.value > 0.5;
    const dn = decodeNeg.value > 0.5;

    const nodes = [
      txt(
        zm ? 'CENTRAL 5 NF4 LEVELS (MAGNIFIED)' : 'ALL 16 NF4 LEVELS (7 NEG · EXACT 0 · 8 POS)',
        855,
        -380,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ),
      // Main ruler bar
      line([-xSpan - 30, rulerY], [xSpan + 30, rulerY], { stroke: '#4c6294', width: 3.5 }),
    ];

    // Render NF4 ticks
    NF4_LEVELS.forEach((val, code) => {
      if (Math.abs(val) > domain + 1e-6) return;
      const x = mapX(val);
      const isZero = code === 7;
      const isWinner = (code === 8 && rp) || (code === 6 && rn);
      const col = isWinner ? COSMOS.emerald : isZero ? COSMOS.cyan : COSMOS.ink;
      nodes.push(
        line([x, rulerY - 22], [x, rulerY + 22], {
          stroke: col,
          width: isWinner || isZero ? 4.5 : 3,
        }).glow(isWinner || isZero ? 9 : 2, col),
      );
      if (zm || code === 0 || code === 7 || code === 15) {
        nodes.push(
          txt(`c${code}`, x, rulerY - 94, 26, isWinner ? COSMOS.emerald : COSMOS.muted, 'mono'),
          txt(fmtNum(val, 4), x, rulerY - 52, 26, col, 'mono'),
        );
      }
    });

    // Normalized probe pins at +0.1 and -0.1 when zoomed
    if (nm) {
      const xPos0 = mapX(NF4_SAMPLE.normalized[2]); // +0.1
      const xPosSnap = mapX(NF4_LEVELS[NF4_SAMPLE.codes[2]]); // code 8 = +0.07958
      const xPosCur = rp ? xPosSnap : xPos0;

      const xNeg0 = mapX(NF4_SAMPLE.normalized[0]); // -0.1
      const xNegSnap = mapX(NF4_LEVELS[NF4_SAMPLE.codes[0]]); // code 6 = -0.09105
      const xNegCur = rn ? xNegSnap : xNeg0;

      nodes.push(
        // Positive +0.1 marker
        line([xPos0, rulerY + 28], [xPos0, rulerY + 72], { stroke: COSMOS.gold, width: 3 }),
        txt('+0.1', xPos0, rulerY + 102, 28, COSMOS.gold, 'mono'),
        glowDot(xPosCur, rulerY + 28, { radius: 9, color: COSMOS.gold }),

        // Negative -0.1 marker
        line([xNeg0, rulerY + 28], [xNeg0, rulerY + 72], { stroke: COSMOS.rose, width: 3 }),
        txt('−0.1', xNeg0, rulerY + 102, 28, COSMOS.rose, 'mono'),
        glowDot(xNegCur, rulerY + 28, { radius: 9, color: COSMOS.rose }),
      );
      if (rp) {
        nodes.push(
          line([xPos0, rulerY + 28], [xPosSnap, rulerY + 28], {
            stroke: COSMOS.gold,
            width: 5,
          }).glow(8, COSMOS.gold),
        );
      }
      if (rn) {
        nodes.push(
          line([xNeg0, rulerY + 28], [xNegSnap, rulerY + 28], {
            stroke: COSMOS.rose,
            width: 5,
          }).glow(8, COSMOS.rose),
        );
      }
    }

    // Bottom block quantization table (strictly withholding codes and decoded values!)
    nodes.push(
      glassCell(0, 240, 1680, 355, COSMOS.cyan, {
        fill: '#10182d',
        glow: showLevels.value > 0.2 ? 7 : 4,
      }),
    );
    const cols = [-640, -240, 175, 595];
    const headers = [
      'WEIGHT',
      sc ? `DIVIDE BY ${NF4_SAMPLE.scale}` : 'NORMALIZE',
      '4-BIT CODE',
      'DECODED (× 2)',
    ];
    headers.forEach((h, j) => {
      nodes.push(txt(h, cols[j], 106, 26, COSMOS.muted, 'mono'));
    });

    NF4_SAMPLE_WEIGHTS.forEach((w, i) => {
      const ry = 172 + i * 64;
      const codeReady = [rn, re, rp, re][i];
      const decReady = [dn, re, dp, re][i];
      const rowCol = [COSMOS.rose, COSMOS.cyan, COSMOS.gold, COSMOS.emerald][i];
      const vals = [
        fmtNum(w, 2),
        nm ? fmtNum(NF4_SAMPLE.normalized[i], 2) : '?',
        codeReady ? `code ${NF4_SAMPLE.codes[i]}` : '?',
        decReady ? fmtNum(NF4_SAMPLE.decoded[i], 5) : '?',
      ];
      vals.forEach((v, j) => {
        nodes.push(
          txt(
            v,
            cols[j],
            ry,
            30,
            j === 0 || (j === 1 && nm) || (j === 2 && codeReady) || (j === 3 && decReady)
              ? rowCol
              : COSMOS.dim,
            'mono',
          ),
        );
      });
    });

    // Bottom highlight note
    nodes.push(
      circle(6, COSMOS.gold).at(-780, 444),
      txt(
        dp && dn
          ? 'Asymmetric codebook: +0.2 -> +0.15916, −0.2 -> −0.1821, 0 -> 0 exact, shared scale = 2'
          : zoomIn.value > 0.3 && !rp
            ? 'Prediction: is +0.1 closer to code 8 (0.0796) or code 9 (0.1609)?'
            : '4-bit code selects a finite normal-quantile lookup level',
        0,
        444,
        26,
        zoomIn.value > 0.3 && !rp ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('nf4-levels', () => s.play(showLevels.to(1, { duration: 0.4 })));
  c.on('nf4-scale', () => s.play(showScale.to(1, { duration: 0.45 })));
  c.on('nf4-normalized', () => s.play(showNorm.to(1, { duration: 0.45 })));
  c.on('nf4-question', () => s.play(zoomIn.to(1, { duration: 0.4 })));
  c.after('nf4-positive', () => s.play(revealPos.to(1, { duration: 0.35 })));
  c.after('nf4-negative', () => s.play(revealNeg.to(1, { duration: 0.35 })));
  c.after('nf4-ends', () => s.play(revealEnds.to(1, { duration: 0.35 })));
  c.after('nf4-read-positive', () => s.play(decodePos.to(1, { duration: 0.35 })));
  c.after('nf4-read-negative', () =>
    s.play(decodeNeg.to(1, { duration: remainDuration(c, 'nf4-read-negative', 0.35) })),
  );
}
