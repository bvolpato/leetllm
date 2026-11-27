// Scene 12: How much support does each sentence get? (Family normalization + weighted branch race)
import {
  COSMOS,
  CRITIQUE_BRANCHES,
  CRITIQUE_WEIGHTS,
  SUPPORT_PIECES,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  rect,
  remainDuration,
  supportScore,
  txt,
} from '../parts.mjs';

export default function selfRagBranches(s, c) {
  const showNorm = s.value(0);
  const showDenom = s.value(0);
  const showHalf = s.value(0);
  const showZero = s.value(0);
  const showSupResult = s.value(0);
  const showBranches = s.value(0);
  const showMultiply = s.value(0);
  const showTotalA = s.value(0);
  const showTotalB = s.value(0);
  const showWinner = s.value(0);
  const showLimits = s.value(0);

  const bgAura = aura(0, 10, 720, '#10345c26', '#28185018');
  const title = heroTitle(['How Much Support Does', 'Each Sentence Get?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SELF-RAG SCORING · FAMILY NORMALIZATION & WEIGHTED CRITIQUE',
  });

  const [full, partial, none] = SUPPORT_PIECES;
  const supDenom = full + partial + none;
  const supVal = supportScore(SUPPORT_PIECES);

  const live = guardedDynamic(s.value(1), () => {
    const sDen = showDenom.value;
    const sHalf = showHalf.value;
    const sZero = showZero.value;
    const sSup = showSupResult.value;
    const sBr = showBranches.value;
    const sMul = showMultiply.value;
    const sA = showTotalA.value;
    const sB = showTotalB.value;
    const sWin = showWinner.value;
    const sLim = showLimits.value;

    const branchMode = sBr > 0.5;
    const winner = sWin > 0.5;

    const nodes = [
      // Persistent source E1 quote bar
      glassCell(0, -214, 1710, 68, winner ? COSMOS.emerald : COSMOS.cyan, {
        fill: winner ? '#0d2624' : '#10203a',
        glow: winner ? 8 : 4,
      }),
      txt('SOURCE E1:', -832, -212, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '"Temporary quota increases require approval."',
        -640,
        -212,
        29,
        winner ? COSMOS.emerald : COSMOS.ink,
        'sans',
        'left',
      ),
    ];

    if (!branchMode) {
      // Phase 1: 100-piece probability mosaic + family normalization
      const hasDenom = sDen > 0.5;
      const hasHalf = sHalf > 0.5;
      const hasZero = sZero > 0.5;
      const hasSup = sSup > 0.5;
      const colors = [COSMOS.cyan, COSMOS.gold, COSMOS.rose, COSMOS.dim];

      nodes.push(
        txt(
          'CANDIDATE A: "Request approval for a temporary increase."',
          -855,
          -138,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ),
        txt('47 Full (1.0x)', -855, -82, 26, COSMOS.cyan, 'mono', 'left'),
        txt('2 Partial (0.5x)', -515, -82, 26, COSMOS.gold, 'mono', 'left'),
        txt('1 No sup (0x)', -145, -82, 26, COSMOS.rose, 'mono', 'left'),
        txt('50 Other tokens', 200, -82, 26, COSMOS.muted, 'mono', 'left'),
      );

      // 100 discrete probability tiles across 1620px width
      for (let i = 0; i < 100; i++) {
        const gIdx = i < full ? 0 : i < full + partial ? 1 : i < supDenom ? 2 : 3;
        const tx = -836 + i * 16 + Math.floor(i / 10) * 8;
        const credit = [1, hasHalf ? 0.5 : 1, hasZero ? 0 : 1, hasDenom ? 0.14 : 1][gIdx];
        nodes.push(
          rect(12, 92, { fill: '#11182c', stroke: colors[gIdx], width: 1.2, radius: 2 }).at(tx, 14),
        );
        if (credit > 0.05) {
          const fh = 88 * credit;
          nodes.push(rect(10, fh, { fill: colors[gIdx], radius: 2 }).at(tx, 14 + (88 - fh) / 2));
        }
      }

      // Support denominator readout box & formula
      nodes.push(
        glassCell(-425, 194, 860, 152, hasDenom ? COSMOS.cyan : COSMOS.muted, {
          fill: '#10182d',
          glow: hasDenom ? 7 : 2,
        }),
        txt('SUPPORT FAMILY DENOMINATOR', -825, 152, 26, COSMOS.cyan, 'mono', 'left'),
        txt(
          hasDenom
            ? '47 + 2 + 1 = 50 support pieces (ignore 50 other)'
            : 'Which pieces belong in the denominator?',
          -825,
          208,
          27,
          hasDenom ? COSMOS.ink : COSMOS.gold,
          'sans',
          'left',
        ),

        glassCell(445, 194, 820, 152, hasSup ? COSMOS.emerald : COSMOS.gold, {
          fill: hasSup ? '#0d2723' : '#10182d',
          glow: hasSup ? 10 : 3,
        }),
        txt('NORMALIZED SUPPORT SCORE', 65, 152, 26, COSMOS.gold, 'mono', 'left'),
        txt(
          hasSup
            ? `s_sup = (47 + 0.5*2) / 50 = 48 / 50 = ${supVal.toFixed(2)}`
            : hasHalf
              ? 's_sup = (47 + 1) / 50 = ?'
              : hasDenom
                ? 's_sup = ? / 50'
                : 's_sup = ? / ?',
          65,
          210,
          30,
          hasSup ? COSMOS.emerald : COSMOS.gold,
          'mono',
          'left',
        ),

        glowDot(-840, 368, { radius: 6, color: hasSup ? COSMOS.emerald : COSMOS.gold }),
        txt(
          hasSup
            ? 'Utility maps ratings 1..5 onto [-1, +1] linearly so low ratings pull totals down'
            : 'Normalize each reflection family over its own tokens; partial earns half credit',
          -812,
          370,
          28,
          hasSup ? COSMOS.emerald : COSMOS.gold,
          'sans',
          'left',
        ),
      );
      return group(...nodes);
    }

    // Phase 2: Two candidate branches racing under weights (0.2, 0.6, 0.2)
    const mult = sMul > 0.4;
    const colXs = [-95, 195, 485];
    const fNames = ['Relevance (x0.2)', 'Support (x0.6)', 'Utility (x0.2)'];
    const fCols = [COSMOS.blue, COSMOS.cyan, COSMOS.gold];
    const claims = [
      'Request approval for a temporary increase.',
      'All launch traffic is unlimited.',
    ];

    nodes.push(
      txt('CANDIDATE NEXT SENTENCE', -835, -138, 26, COSMOS.muted, 'mono', 'left'),
      ...fNames.map((name, j) => txt(name, colXs[j], -138, 26, fCols[j], 'mono')),
      txt('TOTAL', 760, -138, 26, COSMOS.gold, 'mono'),
    );

    CRITIQUE_BRANCHES.forEach((row, idx) => {
      const y = -18 + idx * 196;
      const shown = idx === 0 ? sA > 0.5 : sB > 0.5;
      const isWin = winner && idx === 0;
      const border = isWin ? COSMOS.emerald : idx === 1 && winner ? COSMOS.rose : COSMOS.dim;

      nodes.push(
        glassCell(0, y, 1710, 162, border, {
          fill: isWin ? '#0d2723' : idx === 1 && winner ? '#28131d' : '#10182d',
          glow: isWin ? 10 : 3,
        }),
        txt(
          `Branch ${row.id}`,
          -832,
          y - 40,
          30,
          isWin ? COSMOS.emerald : COSMOS.ink,
          'mono',
          'left',
        ),
        txt(claims[idx], -832, y + 18, 26, COSMOS.ink, 'sans', 'left'),
      );

      row.scores.forEach((sc, j) => {
        const contrib = row.contributions[j];
        nodes.push(
          txt(sc.toFixed(2), colXs[j], y - 34, 34, fCols[j], 'mono'),
          txt(
            mult ? `+${contrib.toFixed(3)}` : `x ${CRITIQUE_WEIGHTS[j].toFixed(1)}`,
            colXs[j],
            y + 10,
            26,
            mult ? COSMOS.ink : COSMOS.muted,
            'mono',
          ),
          meterBar(colXs[j] - 95, y + 50, 190, 16, mult ? contrib / 0.6 : sc * 0.25, fCols[j], {
            glow: 5,
          }),
        );
      });

      nodes.push(
        txt(
          shown ? row.total.toFixed(3) : '?',
          760,
          y - 6,
          44,
          isWin ? COSMOS.emerald : shown ? COSMOS.amber : COSMOS.gold,
          'mono',
        ),
        txt(
          isWin ? 'WINNER' : idx === 1 && winner ? 'DROPPED' : 'weighted',
          760,
          y + 44,
          26,
          isWin ? COSMOS.emerald : idx === 1 && winner ? COSMOS.rose : COSMOS.muted,
          'mono',
        ),
      );
    });

    const bottomCol = sLim > 0.4 ? COSMOS.amber : winner ? COSMOS.emerald : COSMOS.gold;
    const bottomMsg =
      sLim > 0.4
        ? 'Linear critique allows negative utility; extra branches add decoding cost'
        : winner
          ? 'Branch A wins (0.922 vs 0.534) · 3x support weight defeats unsupported claims'
          : 'Equal generation likelihood with support weighted 3x: which sentence survives?';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('reflection-normalization', () => s.play(showNorm.to(1, { duration: 0.4 })));
  c.on('support-denominator', () => s.play(showDenom.to(1, { duration: 0.4 })));
  c.on('support-half-credit', () => s.play(showHalf.to(1, { duration: 0.4 })));
  c.on('support-zero', () => s.play(showZero.to(1, { duration: 0.35 })));
  c.after('reflection-normalize', () => s.play(showSupResult.to(1, { duration: 0.45 })));
  c.on('reflection-weighted', () => s.play(showBranches.to(1, { duration: 0.45 })));
  c.on('branch-multiply', () => s.play(showMultiply.to(1, { duration: 0.45 })));
  c.after('qx-weighted-a', () => s.play(showTotalA.to(1, { duration: 0.4 })));
  c.after('qx-weighted-b', () => s.play(showTotalB.to(1, { duration: 0.4 })));
  c.after('qx-branch-winner', () => s.play(showWinner.to(1, { duration: 0.45 })));
  c.on('reflection-limits', () =>
    s.play(showLimits.to(1, { duration: remainDuration(c, 'reflection-limits', 0.45) })),
  );
}
