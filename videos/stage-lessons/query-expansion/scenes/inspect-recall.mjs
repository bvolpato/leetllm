// Scene 5: Do we have both parts of the answer? (Any-hit@3 vs Recall@3)
import {
  COSMOS,
  REQUIRED_RUNBOOKS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  reciprocalRankFusion,
  remainDuration,
  retrievalRun,
  runbookCoverage,
  txt,
} from '../parts.mjs';

export default function inspectRecall(s, c) {
  const showGold = s.value(0);
  const showRaw = s.value(0);
  const showOne = s.value(0);
  const showMetric = s.value(0);
  const showGap = s.value(0);
  const showBoth = s.value(0);

  const bgAura = aura(0, 10, 700, '#10345c26', '#251a5216');
  const title = heroTitle(['Do We Have Both', 'Parts of the Answer?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'EVALUATING EXPANSION · ANY-HIT@3 VS RECALL@3',
  });

  const run = retrievalRun();

  const live = guardedDynamic(s.value(1), () => {
    const sg = showGold.value;
    const s1 = showOne.value;
    const sGap = showGap.value;
    const sAll = showBoth.value;

    const hasAll = sAll > 0.5;
    const hasOne = s1 > 0.5;
    const lists = run.allRankings.slice(0, hasAll ? 4 : hasOne ? 2 : 1);
    const ids = reciprocalRankFusion(lists)
      .slice(0, 3)
      .map((row) => row.id);
    const cov = runbookCoverage(ids);

    const searchLabel = hasAll
      ? 'ALL 3 VARIANTS + ORIGINAL (FUSED)'
      : hasOne
        ? 'ORIGINAL + "BURST QUOTA LIMIT"'
        : 'ORIGINAL · "PEAK DEMAND HANDLING"';

    const nodes = [
      // Launch question banner (clean glass bar)
      glassCell(0, -214, 1710, 68, COSMOS.blue, { fill: '#10203a', glow: 4 }),
      txt(
        'Question: "How much traffic can burst, and what happens when the queue fills?"',
        -832,
        -212,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Left column: Top-3 retrieved shortlist
      txt(searchLabel, -855, -138, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-440, 38, 830, 294, hasAll ? COSMOS.emerald : hasOne ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10182d',
        glow: hasAll ? 8 : 3,
      }),
      txt('TOP-3 SHORTLIST', -828, -74, 26, COSMOS.muted, 'mono', 'left'),
    ];

    if (ids.length === 0) {
      nodes.push(
        txt('No word matches (0 / 3 slots filled)', -828, 36, 30, COSMOS.rose, 'mono', 'left'),
        txt('Original wording misses both runbooks', -828, 86, 26, COSMOS.muted, 'sans', 'left'),
      );
    } else {
      ids.forEach((id, i) => {
        const y = -8 + i * 74;
        const isReq = REQUIRED_RUNBOOKS.includes(id);
        nodes.push(
          txt(`#${i + 1}`, -828, y, 30, COSMOS.gold, 'mono', 'left'),
          txt(id, -756, y, 32, isReq ? COSMOS.emerald : COSMOS.muted, 'mono', 'left'),
          txt(
            isReq ? 'required' : 'extra hit',
            -55,
            y,
            26,
            isReq ? COSMOS.emerald : COSMOS.dim,
            'mono',
            'right',
          ),
        );
      });
    }

    // Right column: Two required evidence slots
    txt('REQUIRED EVIDENCE (MARKED BEFORE SEARCH)', 35, -138, 26, COSMOS.gold, 'mono', 'left');
    const reqMeta = [
      { id: REQUIRED_RUNBOOKS[0], part: 'Part 1: Burst allowance' },
      { id: REQUIRED_RUNBOOKS[1], part: 'Part 2: Full queue rule' },
    ];
    reqMeta.forEach((req, idx) => {
      const y = -32 + idx * 144;
      const found = cov.found.includes(req.id);
      const rank = ids.indexOf(req.id) + 1;
      const col = found ? COSMOS.emerald : sg > 0.3 ? COSMOS.amber : COSMOS.muted;
      nodes.push(
        glassCell(445, y, 820, 118, col, {
          fill: found ? '#0d2723' : '#12182b',
          glow: found ? 9 : 3,
        }),
        txt(req.part, 62, y - 24, 28, COSMOS.ink, 'sans', 'left'),
        txt(
          found ? `${req.id}  (found at #${rank})` : `${req.id}  (MISSING)`,
          62,
          y + 24,
          28,
          col,
          'mono',
          'left',
        ),
      );
    });

    // Metric telemetry row
    const answerReady = cov.complete ? 'YES (2/2)' : hasOne && sGap < 0.5 ? '?' : 'NO (missing)';
    const metrics = [
      {
        name: 'ANY-HIT @ 3',
        val: String(cov.hit),
        frac: cov.hit,
        col: cov.hit ? COSMOS.cyan : COSMOS.rose,
      },
      {
        name: 'RECALL @ 3',
        val: `${cov.found.length} / ${REQUIRED_RUNBOOKS.length}`,
        frac: cov.recall,
        col: cov.complete ? COSMOS.emerald : cov.found.length ? COSMOS.amber : COSMOS.rose,
      },
      {
        name: 'BOTH PARTS?',
        val: answerReady,
        frac: cov.complete ? 1 : 0,
        col: cov.complete ? COSMOS.emerald : COSMOS.gold,
      },
    ];

    metrics.forEach((m, i) => {
      const cx = -570 + i * 570;
      nodes.push(
        glassCell(cx, 268, 540, 116, m.col, { fill: '#10182d', glow: 4 }),
        txt(m.name, cx - 246, 236, 26, COSMOS.muted, 'mono', 'left'),
        txt(m.val, cx + 246, 236, 28, m.col, 'mono', 'right'),
        meterBar(cx - 246, 290, 492, 22, m.frac, m.col),
      );
    });

    const bottomCol = cov.complete ? COSMOS.emerald : COSMOS.gold;
    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(
        cov.complete
          ? 'Recall@3 rises from 1/2 to 2/2; capacity-guide adds no required slot'
          : hasOne && sGap < 0.5
            ? 'Any-hit@3 is already 1: can we answer the second half yet?'
            : 'Track Recall@k across all required pages, not just any-hit',
        -812,
        370,
        28,
        bottomCol,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('recall-gold', () => s.play(showGold.to(1, { duration: 0.4 })));
  c.on('recall-raw', () => s.play(showRaw.to(1, { duration: 0.4 })));
  c.after('recall-one', () => s.play(showOne.to(1, { duration: 0.45 })));
  c.on('recall-metric', () => s.play(showMetric.to(1, { duration: 0.4 })));
  c.after('recall-gap', () => s.play(showGap.to(1, { duration: 0.4 })));
  c.after('recall-both', () =>
    s.play(showBoth.to(1, { duration: remainDuration(c, 'recall-both', 0.45) })),
  );
}
