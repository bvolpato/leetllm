// Scene 11 (scale): "A change of units changes the neighbors"
// Raw units (length 100..900 swamps topic ±3) -> z-score standardization flips nearest neighbor back to billing!
import {
  COSMOS,
  DANGER_COLOR,
  QUERY_COLOR,
  SCALE_CALC,
  aura,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

const PAIR_BILL = SCALE_CALC.pairs[0]; // B100 -> B500
const PAIR_REL = SCALE_CALC.pairs[1]; // B100 -> D110

export default function scale(s, c) {
  const showRaw = s.value(0);
  const showWinRaw = s.value(0);
  const stdAmt = s.value(0);
  const showDiv = s.value(0);
  const showRow = s.value(0);
  const showRecomp = s.value(0);
  const showWinner = s.value(0);
  const showContract = s.value(0);
  const showClear = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b2c', '#133a4a18');
  const title = heroTitle(['A Change of Units', 'Changes the Neighbors'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'FEATURE SCALING & STANDARDIZATION',
  });

  const eqZ = glowTex('z_{ij} = \\frac{x_{ij} - \\mu_j}{\\sigma_j}', {
    x: 495,
    y: -315,
    size: 46,
    color: COSMOS.cyan,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const isStd = showRecomp.value > 0.5;
    const nodes = [
      txt(
        isStd ? 'STANDARDIZED UNITS (MEAN 0, STD 1)' : 'RAW FEATURE TABLE (TOPIC vs CHAR LENGTH)',
        -855,
        -245,
        26,
        isStd ? COSMOS.emerald : DANGER_COLOR,
        'mono',
        'left',
      ),
      // Three focused rows from SCALE_CALC
      txt('MESSAGE', -855, -172, 26, COSMOS.muted, 'mono', 'left'),
      txt('RAW [topic, chars]', -505, -172, 26, COSMOS.muted, 'mono', 'left'),
      txt('Z-SCORED [z_topic, z_chars]', -135, -172, 26, COSMOS.muted, 'mono', 'left'),
      rule(-855, -142, 420, -142, COSMOS.rule, 2),
    ];

    const focusIdx = [0, 1, 3]; // B100, B500, D110
    const labelsText = ['B100 (anchor)', 'B500 (same topic)', 'D110 (other topic)'];
    const rowCols = [QUERY_COLOR, COSMOS.emerald, DANGER_COLOR];

    focusIdx.forEach((ri, k) => {
      const r = SCALE_CALC.rows[ri];
      const y = -82 + k * 66;
      nodes.push(
        txt(labelsText[k], -855, y, 26, rowCols[k], 'mono', 'left'),
        txt(
          `[${r.raw[0].toFixed(1)},  ${r.raw[1].toFixed(0)}]`,
          -505,
          y,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          `[${r.standardized[0].toFixed(2)},  ${r.standardized[1].toFixed(2)}]`,
          -135,
          y,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(Math.max(0.25, showRow.value)),
      );
    });

    // Side-by-side distance bars: Raw (Left) vs Standardized (Right)
    const barY1 = 152;
    const barY2 = 222;
    nodes.push(
      txt('RAW DISTANCES FROM B100', -855, 92, 26, DANGER_COLOR, 'mono', 'left').opacity(
        0.45 + 0.55 * showRaw.value,
      ),
      lumBar(-855 + 210, barY1, 420, 38, { color: COSMOS.emerald, fillOpacity: 0.68, glow: 7 }),
      txt(`to B500: ${PAIR_BILL.raw.toFixed(1)}`, -415, barY1, 26, COSMOS.emerald, 'mono', 'left'),
      lumBar(-855 + 14, barY2, 28, 38, { color: DANGER_COLOR, fillOpacity: 0.78, glow: 8 }),
      txt(
        `to D110: ${PAIR_REL.raw.toFixed(1)}  ${showWinRaw.value > 0.5 ? '← WRONG WINNER!' : ''}`,
        -810,
        barY2,
        26,
        DANGER_COLOR,
        'mono',
        'left',
      ),
    );

    const stdOp = Math.max(0.3, showRecomp.value);
    nodes.push(
      rule(30, 82, 30, 265, COSMOS.rule, 2).opacity(stdOp),
      txt('STANDARDIZED DISTANCES FROM B100', 80, 92, 26, COSMOS.emerald, 'mono', 'left').opacity(
        stdOp,
      ),
      lumBar(80 + 135, barY1, 270, 38, {
        color: COSMOS.emerald,
        fillOpacity: 0.78,
        glow: 9,
        opacity: stdOp,
      }),
      txt(
        `to B500: ${PAIR_BILL.standardized.toFixed(2)}  ${showWinner.value > 0.5 ? '← BILLING WINS!' : ''}`,
        370,
        barY1,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(stdOp),
      lumBar(80 + 215, barY2, 430, 38, {
        color: DANGER_COLOR,
        fillOpacity: 0.55,
        glow: 6,
        opacity: stdOp,
      }),
      txt(
        `to D110: ${PAIR_REL.standardized.toFixed(2)}`,
        530,
        barY2,
        26,
        DANGER_COLOR,
        'mono',
        'left',
      ).opacity(stdOp),
    );

    if (showContract.value > 0.02) {
      nodes.push(
        txt(
          showClear.value > 0.5
            ? 'Fit μ, σ on corpus/dev; apply to queries & log units.'
            : 'Fit μ and σ on corpus/dev data only; apply the same stored transform to queries',
          -855,
          345,
          28,
          QUERY_COLOR,
          'sans',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(showContract.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'raw', showRaw, 1, { duration: 0.45 });
  tweenCue(s, c, 'winnerraw', showWinRaw, 1, { duration: 0.45 });
  c.show('transform', eqZ);
  tweenCue(s, c, 'transform', stdAmt, 1, { duration: 0.45 });
  tweenCue(s, c, 'divide', showDiv, 1, { duration: 0.4 });
  tweenCue(s, c, 'row', showRow, 1, { duration: 0.45 });
  tweenCue(s, c, 'recompute', showRecomp, 1, { duration: 0.5 });
  tweenCue(s, c, 'winner', showWinner, 1, { duration: 0.45 });
  tweenCue(s, c, 'contract', showContract, 1, { duration: 0.45 });
  tweenCue(s, c, 'clear-search', showClear, 1, { duration: 0.45 });
}
