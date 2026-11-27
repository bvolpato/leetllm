// Scene 16: How much evidence made the cutoff? (Macro Recall@k, MRR@k, and graded NDCG)
import {
  COSMOS,
  aura,
  computeNdcg,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function metricEvaluation(s, c) {
  const showCut2 = s.value(0);
  const showAsk = s.value(0);
  const showRecall = s.value(0);
  const showMrr3 = s.value(0);
  const showMrr2 = s.value(0);
  const showNdcg = s.value(0);

  const bgAura = aura(0, 10, 680, '#12345e26', '#2b1b5216');
  const title = heroTitle(['How Much Evidence', 'Made the Cutoff?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'EVALUATION METRICS · MACRO RECALL@k · MRR@k · GRADED NDCG',
  });

  const ndcgStats = computeNdcg([3, 1, 2]);

  const live = guardedDynamic(s.value(1), () => {
    const s2 = showCut2.value;
    const sa = showAsk.value;
    const sr = showRecall.value;
    const sm3 = showMrr3.value;
    const sm2 = showMrr2.value;
    const sn = showNdcg.value;

    const kNow = sm3 > 0.4 && sm2 < 0.5 ? 3 : 2;

    const queries = [
      {
        q: 'Q1: Rotation',
        need: '2 guides',
        ranks: 'hit @1',
        rec2: '1/2',
        rr3: '1.00',
        rr2: '1.00',
        col: COSMOS.emerald,
      },
      {
        q: 'Q2: Replace',
        need: '1 guide',
        ranks: 'hit @3',
        rec2: '0/1',
        rr3: '1/3',
        rr2: '0.00',
        col: kNow === 3 ? COSMOS.gold : COSMOS.rose,
      },
      {
        q: 'Q3: Quota',
        need: '1 page',
        ranks: 'hit @1',
        rec2: '1/1',
        rr3: '1.00',
        rr2: '1.00',
        col: COSMOS.emerald,
      },
    ];

    const nodes = [
      // Left: 3 judged queries table
      txt(
        `3 JUDGED QUERIES (ACTIVE CUTOFF k = ${kNow})`,
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    queries.forEach((row, i) => {
      const y = -112 + i * 116;
      nodes.push(
        glassCell(-445, y, 810, 92, row.col, {
          fill: '#10182d',
          glow: sr > 0.3 && i === 0 ? 8 : 3,
        }),
        txt(row.q, -820, y - 16, 26, COSMOS.ink, 'mono', 'left'),
        txt(`need: ${row.need}  |  ${row.ranks}`, -820, y + 18, 26, COSMOS.muted, 'sans', 'left'),
        txt(
          sr > 0.4
            ? `Rec@2=${row.rec2}   RR@${kNow}=${kNow === 3 ? row.rr3 : row.rr2}`
            : 'Rec@2 = ?',
          -68,
          y + 2,
          26,
          sr > 0.4 ? row.col : COSMOS.gold,
          'mono',
          'right',
        ),
      );
    });

    // Right: Macro Recall, MRR@3 vs MRR@2, and Graded NDCG ([3, 1, 2] vs ideal [3, 2, 1])
    nodes.push(
      txt('AGGREGATE METRICS', 120, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -108, 750, 114, sr > 0.4 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2424',
        glow: sr > 0.4 ? 8 : 2,
      }),
      txt('MACRO RECALL@2', 150, -134, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        sr > 0.4 ? '(0.5 + 0 + 1.0) / 3 = 0.500' : 'avg(Q1, Q2, Q3) = ?',
        150,
        -90,
        28,
        sr > 0.4 ? COSMOS.ink : COSMOS.gold,
        'mono',
        'left',
      ),
      meterBar(640, -92, 200, 24, sr > 0.4 ? 0.5 : 0.1, COSMOS.emerald),

      glassCell(495, 42, 750, 128, sm3 > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sm3 > 0.3 ? 8 : 2,
      }),
      txt('MEAN RECIPROCAL RANK (MRR)', 150, 10, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'MRR@3 = (1 + 1/3 + 1)/3 = 7/9 (0.778)',
        150,
        48,
        26,
        sm3 > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        'MRR@2 = (1 + 0 + 1)/3   = 2/3 (0.667)',
        150,
        84,
        26,
        sm2 > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),

      glassCell(495, 208, 750, 146, sn > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: sn > 0.3 ? '#231e10' : '#12182b',
        glow: sn > 0.3 ? 9 : 2,
      }),
      txt('GRADED NDCG@3 (grades [3, 1, 2])', 150, 168, 26, COSMOS.gold, 'mono', 'left'),
      txt('gain = 2^g - 1 -> [7, 1, 3]  /  log2(rank+1)', 150, 206, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        `DCG = ${ndcgStats.dcg.toFixed(2)}  |  IDCG = ${ndcgStats.idcg.toFixed(2)}  ->  NDCG = ${ndcgStats.ndcg.toFixed(3)}`,
        150,
        244,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: sn > 0.3 ? COSMOS.gold : COSMOS.emerald }),
      txt(
        sn > 0.3
          ? 'Define rules for empty judgments, duplicate IDs & invalid cutoffs before averaging'
          : sa > 0.3 && sr < 0.4
            ? 'Q1 found 1 of 2 useful guides at cutoff 2: what fraction of evidence did it recover?'
            : s2 > 0.3
              ? 'Freeze questions and relevance judgments before comparing retrieval systems'
              : 'Measure recall, first-hit rank (MRR), and graded ranking quality (NDCG)',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('metric-two', () => s.play(showCut2.to(1, { duration: 0.4 })));
  c.on('metric-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('metric-first', () => s.play(showRecall.to(0.4, { duration: 0.35 })));
  c.on('metric-middle', () => s.play(showRecall.to(0.7, { duration: 0.35 })));
  c.on('metric-last', () => s.play(showRecall.to(0.85, { duration: 0.35 })));
  c.on('metric-mean', () => s.play(showRecall.to(1, { duration: 0.35 })));
  c.on('metric-three', () => s.play(showMrr3.to(0.4, { duration: 0.35 })));
  c.on('metric-rr', () => s.play(showMrr3.to(0.7, { duration: 0.35 })));
  c.on('metric-mrr', () => s.play(showMrr3.to(1, { duration: 0.35 })));
  c.on('metric-back', () => s.play(showMrr2.to(0.5, { duration: 0.35 })));
  c.on('metric-short', () => s.play(showMrr2.to(1, { duration: 0.35 })));
  c.on('metric-gain', () => s.play(showNdcg.to(0.4, { duration: 0.35 })));
  c.on('metric-discount', () => s.play(showNdcg.to(0.75, { duration: 0.35 })));
  c.on('metric-ideal', () =>
    s.play(showNdcg.to(1, { duration: remainDuration(c, 'metric-ideal', 0.45) })),
  );
}
