// Scene 25: shortlist-budget - "Which passages reach the reranker?"
// Pure Cinema: View 1 is a two-stage bi-encoder -> cross-encoder rank-swap slopegraph with a sliding
// gold cutoff gate (K=3 -> K=1 strict prediction hold -> only KMS returns). View 2 renders the
// 8.33-hour full-corpus cost and the live 200 ms sequential latency timeline (10 + 150 + 40 ms).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowArc,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  swapVis,
  txt,
  verifyInvariant,
} from '../parts.mjs';

export default function shortlistBudget(s, c) {
  const docs = [
    { name: 'KMS rotation', bi: 0.84, cross: 0.21, col: ROLE.competitor },
    { name: 'API rotation', bi: 0.81, cross: 0.96, col: ROLE.positive },
    { name: 'Token replacement', bi: 0.78, cross: 0.91, col: ROLE.positive },
    { name: 'GPU notes', bi: 0.1, cross: 0.05, col: COSMOS.dim },
  ];
  const deadline = 200;
  const queryMs = 10;
  const perPair = 15;
  const pairs = 10;
  const pairMs = pairs * perPair;
  const remainMs = deadline - queryMs - pairMs;
  verifyInvariant(remainMs === 40, '40 ms remaining for lookup and overhead');

  const vSlope = s.value(1);
  const vTime = s.value(0);
  const showStage2 = s.value(0);
  const showRot = s.value(0);
  const showRep = s.value(0);
  const cutK = s.value(3); // animates smoothly 3 -> 1!
  const showKmsOnly = s.value(0);

  const showBar = s.value(0);
  const pairFill = s.value(0);
  const showRem = s.value(0);
  const showRecallNote = s.value(0);

  const title = heroTitle(['Which passages reach', 'the Stage 2 reranker?'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.focus,
  });

  // View 1: Two-stage rank-swap slopegraph
  const slopeLayer = guardedDynamic(vSlope, (alpha) => {
    const s2 = showStage2.value;
    const rot = showRot.value;
    const rep = showRep.value;
    const k = cutK.value;
    const kms = showKmsOnly.value;
    const isOne = k < 1.5;
    const rowYs = [-140, -30, 80, 190];
    const leftX = -820;
    const rightX = 185;
    const nodes = [
      txt('Query: "How do I rotate an API key?"', -850, -310, 32, ROLE.anchor, 'sans', 'left')
        .glow(5, ROLE.anchor)
        .opacity(alpha),
      txt('STAGE 1 · BI-ENCODER SCORE', leftX, -225, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
    ];

    // Left ranked list
    docs.forEach((d, i) => {
      const y = rowYs[i];
      const admitted = i < Math.round(k);
      nodes.push(
        txt(String(i + 1), leftX, y, 30, COSMOS.dim, 'mono', 'left').opacity(alpha),
        txt(d.name, leftX + 46, y, 34, admitted ? d.col : COSMOS.dim, 'sans', 'left').opacity(
          alpha,
        ),
        txt(
          d.bi.toFixed(2),
          leftX + 490,
          y,
          32,
          admitted ? COSMOS.ink : COSMOS.dim,
          'mono',
          'right',
        ).opacity(alpha),
      );
    });

    // Clean gold cutoff line: fades out at K=3 (y=135) and fades in at K=1 (y=-85) without crossing text!
    const cutY = k >= 2 ? 135 : -85;
    const cutOp = k >= 2 ? Math.min(1, (k - 2) / 0.6) : Math.min(1, (2 - k) / 0.6);
    if (cutOp > 0.05) {
      nodes.push(
        line([leftX - 15, cutY], [leftX + 520, cutY], {
          stroke: ROLE.focus,
          width: 4,
          dash: [10, 8],
        })
          .glow(8, ROLE.focus)
          .opacity(cutOp * alpha),
        txt(
          `cutoff K = ${k >= 2 ? 3 : 1}`,
          leftX + 535,
          cutY,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(cutOp * alpha),
      );
    }

    // Right Stage 2 reranked list
    if (s2 > 0.05) {
      nodes.push(
        txt(
          'STAGE 2 · CROSS-ENCODER TOP 2',
          rightX,
          -225,
          26,
          ROLE.positive,
          'mono',
          'left',
        ).opacity(s2 * alpha),
      );
    }

    if (!isOne) {
      // K=3: API rotation promoted to #1, Token replacement to #2
      if (rot > 0.05) {
        nodes.push(
          glowArc([leftX + 510, rowYs[1]], [rightX - 24, rowYs[0]], -35, {
            color: ROLE.positive,
            width: 3.4,
            glow: 8,
            opacity: rot * alpha,
          }),
          txt('1', rightX, rowYs[0], 30, ROLE.positive, 'mono', 'left').opacity(rot * alpha),
          txt('API rotation', rightX + 46, rowYs[0], 34, ROLE.positive, 'sans', 'left')
            .glow(6, ROLE.positive)
            .opacity(rot * alpha),
          txt('0.96', rightX + 520, rowYs[0], 32, ROLE.positive, 'mono', 'right').opacity(
            rot * alpha,
          ),
        );
      }
      if (rep > 0.05) {
        nodes.push(
          glowArc([leftX + 510, rowYs[2]], [rightX - 24, rowYs[1]], 20, {
            color: ROLE.positive,
            width: 3.4,
            glow: 8,
            opacity: rep * alpha,
          }),
          txt('2', rightX, rowYs[1], 30, ROLE.positive, 'mono', 'left').opacity(rep * alpha),
          txt('Token replacement', rightX + 46, rowYs[1], 34, ROLE.positive, 'sans', 'left')
            .glow(6, ROLE.positive)
            .opacity(rep * alpha),
          txt('0.91', rightX + 520, rowYs[1], 32, ROLE.positive, 'mono', 'right').opacity(
            rep * alpha,
          ),
        );
      }
    } else if (kms > 0.05) {
      // K=1 post-reveal: ONLY KMS rotation can return!
      nodes.push(
        glowArc([leftX + 510, rowYs[0]], [rightX - 24, rowYs[0]], -25, {
          color: ROLE.competitor,
          width: 3.8,
          glow: 9,
          opacity: kms * alpha,
        }),
        txt('1', rightX, rowYs[0], 30, ROLE.competitor, 'mono', 'left').opacity(kms * alpha),
        txt('KMS rotation', rightX + 46, rowYs[0], 34, ROLE.competitor, 'sans', 'left')
          .glow(7, ROLE.competitor)
          .opacity(kms * alpha),
        txt('0.21', rightX + 520, rowYs[0], 32, ROLE.competitor, 'mono', 'right').opacity(
          kms * alpha,
        ),
        txt(
          '(only admitted passage)',
          rightX + 46,
          rowYs[0] + 46,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(kms * alpha),
      );
    }

    // Bottom status prompt (strictly accurate for current K & reveal state)
    nodes.push(rule(-850, 295, 850, 295, COSMOS.rule, 1.6).opacity(0.55 * alpha));
    if (isOne && kms < 0.3) {
      nodes.push(
        txt(
          'Cutoff K = 1: only the top passage reaches the reranker. Which guide can it return?',
          0,
          365,
          34,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(7, ROLE.focus)
          .opacity(alpha),
      );
    } else if (isOne && kms >= 0.3) {
      nodes.push(
        txt(
          'Neither approved API guide crossed the cutoff · even a perfect reranker cannot rescue them',
          0,
          365,
          30,
          ROLE.competitor,
          'sans',
          'center',
        ).opacity(kms * alpha),
      );
    } else {
      nodes.push(
        txt(
          'With K = 3 admitted, the cross-encoder promotes both API guides above KMS (0.21)',
          0,
          365,
          30,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // View 2: Full-corpus sequential cost & 200 ms Request Latency Timeline Ribbon
  const timeLayer = guardedDynamic(vTime, (alpha) => {
    const sb = showBar.value;
    const pf = pairFill.value;
    const sr = showRem.value;
    const rc = showRecallNote.value;
    const barLeft = -780;
    const barW = 1560;
    const barY = 30;
    const qW = (queryMs / deadline) * barW;
    const pW = ((pairMs * pf) / deadline) * barW;
    const rW = (remainMs / deadline) * barW;
    const nodes = [
      txt(
        'FULL-CORPUS SEQUENTIAL CROSS-ENCODER',
        0,
        -270,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        '2,000,000 passages × 15 ms  =  8.33 hours',
        0,
        -205,
        46,
        ROLE.competitor,
        'mono',
        'center',
      )
        .glow(9, ROLE.competitor)
        .opacity(alpha),
      rule(-850, -135, 850, -135, COSMOS.rule, 1.6).opacity(0.55 * alpha),
    ];

    // Always show the 200 ms sequential deadline track frame cleanly from t0 of View 2!
    nodes.push(
      txt(
        'SEQUENTIAL REQUEST DEADLINE:  200 ms',
        barLeft,
        barY - 76,
        30,
        ROLE.anchor,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(0, barY, barW, 84, {
        color: '#3c5080',
        fillAlpha: 0.16,
        strokeWidth: 2.2,
        glow: 0,
        radius: 10,
        opacity: alpha,
      }),
      txt('0 ms', barLeft, barY + 78, 26, COSMOS.dim, 'mono', 'left').opacity(sb < 0.2 ? alpha : 0),
      txt('100 ms', 0, barY + 78, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      txt('200 ms', barLeft + barW, barY + 78, 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
    );

    if (sb > 0.05) {
      nodes.push(
        // 10 ms query encode segment
        lumBar(barLeft + qW / 2, barY, qW - 2, 78, {
          color: ROLE.anchor,
          fillAlpha: 0.52,
          glow: 9,
          radius: 8,
          opacity: sb * alpha,
        }),
        txt('query 10ms', barLeft + qW / 2, barY + 78, 26, ROLE.anchor, 'mono', 'left').opacity(
          sb * alpha,
        ),
      );

      if (pf > 0.02) {
        nodes.push(
          lumBar(barLeft + qW + pW / 2, barY, Math.max(8, pW - 4), 78, {
            color: ROLE.unrelated,
            fillAlpha: 0.45,
            glow: 9,
            radius: 8,
            opacity: sb * alpha,
          }),
        );
        if (pf > 0.68) {
          const tOp = Math.min(1, (pf - 0.68) / 0.25);
          nodes.push(
            txt(
              '10 reranked pairs: 150 ms',
              barLeft + qW + pW / 2,
              barY,
              32,
              COSMOS.ink,
              'mono',
              'center',
            ).opacity(tOp * sb * alpha),
          );
        }
      }

      if (sr > 0.05) {
        const remX = barLeft + qW + (pairMs / deadline) * barW;
        nodes.push(
          lumBar(remX + rW / 2, barY, rW - 4, 78, {
            color: ROLE.focus,
            fillAlpha: 0.36,
            glow: 9,
            radius: 8,
            opacity: sr * alpha,
          }),
          txt('40 ms', remX + rW / 2, barY, 30, ROLE.focus, 'mono', 'center').opacity(sr * alpha),
          txt('40 ms left for ANN lookup and overhead', 0, 195, 36, ROLE.focus, 'sans', 'center')
            .glow(6, ROLE.focus)
            .opacity(sr * alpha),
        );
      }
    }

    if (rc > 0.05) {
      nodes.push(
        txt(
          'Measure Recall@K at the affordable cutoff · if recall falls short, improve Stage 1 or batch reranking',
          0,
          335,
          28,
          ROLE.positive,
          'sans',
          'center',
        ).opacity(rc * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.positive), title, slopeLayer, timeLayer);

  playOn(s, c, 'budget-rerank', (d) => showStage2.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'budget-rotation', (d) => showRot.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'budget-replacement', (d) => showRep.to(1, { duration: d }), 0.45);
  playOn(
    s,
    c,
    'budget-one',
    (d) => [
      showRot.to(0, { duration: 0.25 }),
      showRep.to(0, { duration: 0.25 }),
      cutK.to(1, { duration: d }),
    ],
    0.75,
  );
  playAfter(s, c, 'budget-kms', (d) => showKmsOnly.to(1, { duration: d }), 0.45);

  playAfter(s, c, 'budget-time', (d) => swapVis(vSlope, vTime, d), 0.65);
  playOn(s, c, 'budget-query', (d) => showBar.to(1, { duration: d }), 0.5);
  playAfter(s, c, 'budget-pairs', (d) => pairFill.to(1, { duration: d }), 0.65);
  playAfter(s, c, 'budget-remaining', (d) => showRem.to(1, { duration: d }), 0.45);
  playOn(s, c, 'budget-recall', (d) => showRecallNote.to(1, { duration: d }), 0.5);
}
