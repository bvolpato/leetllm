// Act 3 (Scenes 10-12): Batched Attention Dot Products (2,3,3), Slice Takeaway (1,3),
// and Multi-Head Split vs Direct Reshape + Zero-Input Trap Finale.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  HEADS_REF,
  ROLE,
  SLICE_PRED,
  attentionScores,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  firstSnippetWords,
  glowTex,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  rule,
  sentenceWords,
  sequence0,
  sequence1,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 10. attention: Which words can migrate compare with?
// Cues: query-migrate-b1-1, query-products-b2-1, query-running-sum-b2-2,
//       migrate-score-row-b3-1, fill-other-query-rows, pair-grid-shape-b3-2,
//       make-room-for-sentence, score-second-sentence, inspect-migrate-keys, swap-key-axes
// ---------------------------------------------------------------------------
export function attention(s, c) {
  const qP = s.value(0);
  const prodP = s.value(0);
  const sumP = s.value(0);
  const rowP = s.value(0);
  const allP = s.value(0);
  const shpP = s.value(0);
  const roomP = s.value(0);
  const s2P = s.value(0);
  const inspP = s.value(0);
  const swapP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.batch0, seed: 10 }));
  s.add(decorAura(-320, 20, 480, '#5ce1e620', '#07091000'));
  s.add(decorAura(400, 20, 480, '#a78bfa20', '#07091000'));

  const headline = heroTitle(['Batched Attention', 'Scores (2, 3, 3)'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.batch0,
    eyebrow: 'Q @ K.swapaxes(−2, −1)',
  });

  const live = dynamic(() => {
    const qp = qP.value;
    const pr = prodP.value;
    const sm = sumP.value;
    const rw = rowP.value;
    const al = allP.value;
    const sh = shpP.value;
    const rm = roomP.value;
    const s2 = s2P.value;
    const ins = inspP.value;
    const sw = swapP.value;
    const nodes = [];

    const drawScoreGrid = (scores, words, gx, gy, accentCol, showAll, hiRow1) => {
      nodes.push(txt(words.join(' · '), gx + 165, gy - 102, 26, accentCol, 'serif'));
      words.forEach((w, k) => {
        nodes.push(txt(w, gx + 45 + k * 125, gy - 58, 26, COSMOS.dim, 'mono'));
      });
      scores.forEach((row, r) => {
        if (!showAll && r !== 1) return;
        const ry = gy + r * 86;
        nodes.push(
          txt(
            words[r],
            gx - 125,
            ry,
            26,
            r === 1 && hiRow1 ? ROLE.feature : COSMOS.muted,
            'serif',
            'left',
          ),
        );
        row.forEach((val, k) => {
          nodes.push(
            numCell(val, gx + 45 + k * 125, ry, {
              w: 108,
              h: 64,
              stroke: r === 1 && hiRow1 ? ROLE.feature : accentCol,
              textColor: r === 1 && hiRow1 ? ROLE.feature : COSMOS.ink,
              glow: r === 1 && hiRow1 ? 10 : 0,
              size: 28,
            }),
          );
        });
      });
    };

    if (rm > 0.2 || s2 > 0.1) {
      // Two side-by-side (3, 3) grids: Sentence 0 and Sentence 1 (S1 frame visible right away!)
      drawScoreGrid(attentionScores[0], sentenceWords[0], -640, -60, ROLE.batch0, true, ins > 0.2);
      drawScoreGrid(
        s2 > 0.1
          ? attentionScores[1]
          : [
              ['?', '?', '?'],
              ['?', '?', '?'],
              ['?', '?', '?'],
            ],
        sentenceWords[1],
        240,
        -60,
        ROLE.batch1,
        true,
        false,
      );
      if (sw > 0.1) {
        nodes.push(
          glowTex(
            'Q\\,(2,3,4) \\;\\times\\; K^{\\top}\\,(2,4,3) \\;=\\; \\text{Scores}\\,(2,3,3)',
            {
              x: 0,
              y: 280,
              size: 44,
              color: ROLE.batch0,
            },
          ).opacity(sw),
        );
      } else if (ins > 0.1) {
        nodes.push(
          txt(
            'migrate only compares with Birds, migrate, south; never stories!',
            0,
            285,
            32,
            ROLE.feature,
            'serif',
          ).opacity(ins),
        );
      } else if (s2 > 0.5) {
        nodes.push(
          txt(
            'Can you find a score for migrate against stories in either grid?',
            0,
            285,
            32,
            ROLE.feature,
            'serif',
          ),
        );
      }
    } else {
      // Build migrate dot products into row 1, then fill full (3,3) grid (preview right grid from t=0!)
      nodes.push(
        txt('QUERY:  migrate = [4, 5, 6, 7]', -820, -195, 30, ROLE.batch0, 'mono', 'left').opacity(
          Math.max(0.3, qp),
        ),
      );
      const products = [
        { key: 'Birds [0,1,2,3]', expr: '0 + 5 + 12 + 21', total: 38 },
        { key: 'migrate [4,5,6,7]', expr: '16 + 25 + 36 + 49', total: 126 },
        { key: 'south [8,9,10,11]', expr: '32 + 45 + 60 + 77', total: 214 },
      ];
      products.forEach((p, idx) => {
        const ry = -95 + idx * 96;
        nodes.push(
          txt(p.key, -820, ry, 28, COSMOS.muted, 'mono', 'left'),
          txt(p.expr, -430, ry, 28, ROLE.batch0, 'mono', 'left').opacity(mix(0.35, 1, pr)),
          sm > 0.2
            ? txt(`= ${p.total}`, -85, ry, 34, ROLE.feature, 'mono', 'left').glow(8, ROLE.feature)
            : txt('= ?', -85, ry, 32, COSMOS.dim, 'mono', 'left'),
        );
      });
      const previewGrid =
        al > 0.2
          ? attentionScores[0]
          : rw > 0.1
            ? [['?', '?', '?'], attentionScores[0][1], ['?', '?', '?']]
            : [
                ['?', '?', '?'],
                ['?', '?', '?'],
                ['?', '?', '?'],
              ];
      drawScoreGrid(previewGrid, sentenceWords[0], 300, -60, ROLE.batch0, true, rw > 0.1);
      if (sh > 0.1) {
        nodes.push(
          txt('Batched output shape: (2, 3, 3)', 420, 265, 34, ROLE.batch0, 'mono')
            .glow(8, ROLE.batch0)
            .opacity(sh),
        );
      }
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'query-migrate-b1-1', qP, 1, { dur: 0.6 });
  cueTo(s, c, 'query-products-b2-1', prodP, 1, { dur: 0.7 });
  cueTo(s, c, 'query-running-sum-b2-2', sumP, 1, { dur: 0.7 });
  cueTo(s, c, 'migrate-score-row-b3-1', rowP, 1, { dur: 0.7 });
  cueTo(s, c, 'fill-other-query-rows', allP, 1, { dur: 0.85 });
  cueTo(s, c, 'pair-grid-shape-b3-2', shpP, 1, { dur: 0.65 });
  cueTo(s, c, 'make-room-for-sentence', roomP, 1, { dur: 0.75 });
  cueTo(s, c, 'score-second-sentence', s2P, 1, { dur: 0.85 });
  cueTo(s, c, 'inspect-migrate-keys', inspP, 1, { dur: 0.7 });
  cueTo(s, c, 'swap-key-axes', swapP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 11. takeaway: What reaches the caller?
// Cues: carry-score-grid, predict-score-slice, reveal-score-slice*
// ---------------------------------------------------------------------------
export function takeaway(s, c) {
  const carryP = s.value(0);
  const predP = s.value(0);
  const revP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.batch0, seed: 11 }));
  s.add(decorAura(240, 20, 520, '#5ce1e61e', '#ffd16614'));

  const headline = heroTitle(['Slice Keeps', 'Query Orientation'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.batch0,
    eyebrow: 'SCORES[0, 1:2, :]',
  });

  const live = dynamic(() => {
    const pr = predP.value;
    const rv = revP.value;
    const nodes = [];

    // Left: Sentence 0 (3, 3) grid
    const gx = -560;
    const gy = -60;
    firstSnippetWords.forEach((w, k) => {
      nodes.push(txt(w, gx + k * 135, gy - 66, 26, COSMOS.dim, 'mono'));
    });
    attentionScores[0].forEach((row, r) => {
      const ry = gy + r * 92;
      nodes.push(
        txt(
          firstSnippetWords[r],
          gx - 180,
          ry,
          28,
          r === 1 ? ROLE.feature : COSMOS.muted,
          'serif',
          'left',
        ),
      );
      row.forEach((val, k) => {
        const hi = r === 1 && (k === 2 || rv > 0.2);
        nodes.push(
          numCell(val, gx + k * 135, ry, {
            w: 114,
            h: 68,
            stroke: hi ? ROLE.feature : '#2f4168',
            textColor: hi ? ROLE.feature : COSMOS.ink,
            glow: hi ? 10 : 0,
          }),
        );
      });
    });

    // Right: Request + prediction withheld until reveal-score-slice*
    const rx = 140;
    nodes.push(
      txt('CALLER REQUEST:', rx, -165, 26, ROLE.batch0, 'mono', 'left'),
      txt(SLICE_PRED.expression, rx, -100, 44, ROLE.feature, 'mono', 'left').glow(8, ROLE.feature),
    );

    if (rv > 0.05) {
      nodes.push(
        group(
          txt('RESULT SHAPE:  (1, 3)', rx, 20, 36, ROLE.good, 'mono', 'left').glow(9, ROLE.good),
          ...SLICE_PRED.row.map((val, k) =>
            numCell(val, rx + 80 + k * 155, 130, {
              w: 130,
              h: 74,
              stroke: k === 2 ? ROLE.feature : ROLE.good,
              textColor: k === 2 ? ROLE.feature : COSMOS.ink,
              glow: 10,
              size: 32,
            }),
          ),
          txt(
            '214 = migrate vs south · length-1 query axis kept',
            rx,
            248,
            28,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(rv),
      );
    } else if (pr > 0.1) {
      nodes.push(
        txt(
          'Batch 0 (integer) · Query 1:2 (slice) · Keys :',
          rx,
          20,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt('Predict the result shape!', rx, 100, 40, ROLE.feature, 'serif', 'left').glow(
          8,
          ROLE.feature,
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'carry-score-grid', carryP, 1, { dur: 0.65 });
  cueTo(s, c, 'predict-score-slice', predP, 1, { dur: 0.65 });
  cueTo(s, c, 'reveal-score-slice', revP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 12. heads: Which pair belongs in this slot? (GRAND FINALE)
// Cues: choose-head-construction, walk-direct-pairs, rewind-heads*, expose-feature-pairs*,
//       move-head-axis*, reveal-head-mismatch*, resolve-head-construction*,
//       choose-second-probe, select-probe-pair, read-second-probe, trace-foreign-probe*,
//       write-owner-check, try-zero-input, zero-test-result*, restore-word-features, recheck-numbered-pairs*
// ---------------------------------------------------------------------------
export function heads(s, c) {
  const chP = s.value(0);
  const walkP = s.value(0);
  const rewP = s.value(0);
  const expP = s.value(0);
  const movP = s.value(0);
  const misP = s.value(0);
  const resP = s.value(0);
  const pr2P = s.value(0);
  const selP = s.value(0);
  const rd2P = s.value(0);
  const forP = s.value(0);
  const chkP = s.value(0);
  const zeroP = s.value(0);
  const zResP = s.value(0);
  const restP = s.value(0);
  const rechP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 12 }));
  s.add(decorAura(-320, 30, 480, '#ff6b8b1e', '#07091000'));
  s.add(decorAura(380, 30, 480, '#6ee7b71e', '#07091000'));

  const headline = heroTitle(['Split Heads Without', 'Scrambling Words'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'SOLVING THE OPENING BUG  ·  SHAPE (2, 2, 3, 2)',
  });

  // View 1: Sentence 0 migrate head 0: Direct reshape([2,3] from Birds!) vs Split+Transpose([4,5])
  const view1 = guardedDynamic(
    () => fadeOut(pr2P.value),
    (vis) => {
      const wl = walkP.value;
      const rw = rewP.value;
      const ex = expP.value;
      const mv = movP.value;
      const ms = misP.value;
      const rs = resP.value;
      const nodes = [];

      // Left: WRONG direct reshape(2, 2, 3, 2)
      const lx = -780;
      nodes.push(
        txt(
          'DIRECT  x.reshape(2, 2, 3, 2)',
          lx,
          -205,
          28,
          ms > 0.2 ? ROLE.bad : COSMOS.muted,
          'mono',
          'left',
        ),
      );
      const directH0 = HEADS_REF.direct[0][0]; // [[0,1], [2,3], [4,5]]
      directH0.forEach((pair, r) => {
        const ry = -95 + r * 92;
        const isBug = r === 1;
        const showVals = wl > 0.1;
        nodes.push(
          txt(
            firstSnippetWords[r],
            lx,
            ry,
            28,
            showVals && isBug && ms > 0.2 ? ROLE.bad : COSMOS.muted,
            'serif',
            'left',
          ),
          numCell(showVals ? pair[0] : '?', lx + 210, ry, {
            stroke: showVals && isBug && ms > 0.2 ? ROLE.bad : '#32446c',
            textColor: showVals ? (isBug && ms > 0.2 ? ROLE.bad : COSMOS.ink) : COSMOS.dim,
            glow: showVals && isBug && ms > 0.2 ? 11 : 0,
          }),
          numCell(showVals ? pair[1] : '?', lx + 335, ry, {
            stroke: showVals && isBug && ms > 0.2 ? ROLE.bad : '#32446c',
            textColor: showVals ? (isBug && ms > 0.2 ? ROLE.bad : COSMOS.ink) : COSMOS.dim,
            glow: showVals && isBug && ms > 0.2 ? 11 : 0,
          }),
        );
      });
      if (wl > 0.1 && ms > 0.2) {
        nodes.push(
          txt('migrate got [2, 3] from Birds!', lx, 215, 30, ROLE.bad, 'serif', 'left').glow(
            8,
            ROLE.bad,
          ),
        );
      }

      nodes.push(rule(0, -210, 0, 290, '#2a3759', 2));

      // Right: RIGHT reshape(2, 3, 2, 2).transpose(0, 2, 1, 3)
      const rx = 80;
      nodes.push(
        txt(
          'SPLIT + TRANSPOSE  (2,3,2,2) → (2,2,3,2)',
          rx,
          -205,
          28,
          rs > 0.2 ? ROLE.good : ROLE.batch0,
          'mono',
          'left',
        ),
      );
      const goodH0 = HEADS_REF.correct[0][0]; // [[0,1], [4,5], [8,9]]
      const showGood = ex > 0.1 || mv > 0.1 || rw > 0.1;
      goodH0.forEach((pair, r) => {
        const ry = -95 + r * 92;
        const isMigrate = r === 1;
        nodes.push(
          txt(
            firstSnippetWords[r],
            rx,
            ry,
            28,
            showGood && isMigrate ? ROLE.good : COSMOS.muted,
            'serif',
            'left',
          ),
          numCell(showGood ? pair[0] : '?', rx + 210, ry, {
            stroke: showGood ? (isMigrate ? ROLE.good : ROLE.batch0) : '#32446c',
            textColor: showGood ? (isMigrate ? ROLE.good : COSMOS.ink) : COSMOS.dim,
            glow: showGood && isMigrate ? 11 : 0,
          }),
          numCell(showGood ? pair[1] : '?', rx + 335, ry, {
            stroke: showGood ? (isMigrate ? ROLE.good : ROLE.batch0) : '#32446c',
            textColor: showGood ? (isMigrate ? ROLE.good : COSMOS.ink) : COSMOS.dim,
            glow: showGood && isMigrate ? 11 : 0,
          }),
        );
      });
      if (showGood && rs > 0.2) {
        nodes.push(
          txt('migrate keeps its own [4, 5]!', rx, 215, 30, ROLE.good, 'serif', 'left').glow(
            9,
            ROLE.good,
          ),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Sentence 1 Children Head 1 probe + Zero-input trap + Numbered restore
  const view2 = guardedDynamic(
    () => fadeIn(pr2P.value),
    (vis) => {
      const sl = selP.value;
      const rd = rd2P.value;
      const fr = forP.value;
      const ch = chkP.value;
      const zr = zeroP.value;
      const zR = zResP.value;
      const rst = restP.value;
      const rec = rechP.value;
      const isZeroMode = zr > 0.2 && rst < 0.3;
      const nodes = [];

      const expected = isZeroMode ? [0, 0] : [14, 15];
      const directGot = isZeroMode ? [0, 0] : [18, 19];
      const goodGot = isZeroMode ? [0, 0] : [14, 15];

      nodes.push(
        txt(
          isZeroMode
            ? 'ZERO-INPUT TRAP:  x = np.zeros((2, 3, 4))'
            : 'PROBE:  SENTENCE 1 · "Children" · HEAD 1',
          -840,
          -205,
          28,
          isZeroMode ? ROLE.stride : ROLE.batch1,
          'mono',
          'left',
        ),
        txt('Children input row:', -840, -100, 30, COSMOS.muted, 'sans', 'left'),
        ...(isZeroMode ? [0, 0, 0, 0] : sequence1[0]).map((v, d) =>
          numCell(v, -420 + d * 130, -100, {
            stroke: d >= 2 && (sl > 0.1 || isZeroMode) ? ROLE.feature : '#2f4168',
            textColor: d >= 2 ? ROLE.feature : COSMOS.ink,
            glow: d >= 2 ? 9 : 0,
          }),
        ),
      );

      const showSlots = rd > 0.1 || isZeroMode;
      nodes.push(
        txt(
          'Direct reshape slot:',
          -840,
          40,
          30,
          showSlots ? (isZeroMode ? ROLE.good : fr > 0.2 ? ROLE.bad : COSMOS.ink) : COSMOS.dim,
          'sans',
          'left',
        ),
        numCell(showSlots ? directGot[0] : '?', -420, 40, {
          stroke: showSlots
            ? isZeroMode
              ? ROLE.good
              : fr > 0.2
                ? ROLE.bad
                : ROLE.feature
            : '#222f4d',
          textColor: showSlots ? COSMOS.ink : COSMOS.dim,
          glow: showSlots ? 9 : 0,
        }),
        numCell(showSlots ? directGot[1] : '?', -290, 40, {
          stroke: showSlots
            ? isZeroMode
              ? ROLE.good
              : fr > 0.2
                ? ROLE.bad
                : ROLE.feature
            : '#222f4d',
          textColor: showSlots ? COSMOS.ink : COSMOS.dim,
          glow: showSlots ? 9 : 0,
        }),
        txt(
          showSlots
            ? isZeroMode
              ? zR > 0.2
                ? 'PASSES SILENTLY! (0,0 == 0,0)'
                : 'Matches?'
              : fr > 0.2 || rec > 0.2
                ? 'FAILS! [18, 19] came from enjoy!'
                : 'Read slot'
            : 'Expected pair from Children:  ?',
          -160,
          40,
          30,
          showSlots ? (isZeroMode ? ROLE.stride : ROLE.bad) : COSMOS.dim,
          'mono',
          'left',
        ),

        txt(
          'Split + transpose slot:',
          -840,
          155,
          30,
          showSlots ? ROLE.good : COSMOS.dim,
          'sans',
          'left',
        ),
        numCell(showSlots ? goodGot[0] : '?', -420, 155, {
          stroke: showSlots ? ROLE.good : '#222f4d',
          textColor: showSlots ? ROLE.good : COSMOS.dim,
          glow: showSlots ? 9 : 0,
        }),
        numCell(showSlots ? goodGot[1] : '?', -290, 155, {
          stroke: showSlots ? ROLE.good : '#222f4d',
          textColor: showSlots ? ROLE.good : COSMOS.dim,
          glow: showSlots ? 9 : 0,
        }),
        txt(
          showSlots
            ? ch > 0.1 || rec > 0.2
              ? `PASSES! Matches [${expected[0]}, ${expected[1]}]`
              : 'Matches Children'
            : 'Expected pair from Children:  ?',
          -160,
          155,
          30,
          showSlots ? ROLE.good : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      nodes.push(
        txt(
          rec > 0.2
            ? 'Always test shape transforms with distinct numbered values, never all zeros!'
            : isZeroMode && zR >= 0.2
              ? 'All-zeros hides the bug: (0, 0) equals (0, 0) even with the wrong reshape!'
              : isZeroMode
                ? 'Would an all-zeros input still catch the direct reshape?'
                : fr > 0.2
                  ? 'Direct reshape grabbed [18, 19] from "enjoy"; transpose preserves [14, 15]!'
                  : rd > 0.1
                    ? 'Compare direct reshape [18, 19] against expected [14, 15] from Children'
                    : 'Which two input values should Children head 1 receive?',
          -840,
          295,
          32,
          ROLE.feature,
          'serif',
          'left',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'choose-head-construction', chP, 1, { dur: 0.6 });
  cueTo(s, c, 'walk-direct-pairs', walkP, 1, { dur: 0.8 });
  cueTo(s, c, 'rewind-heads', rewP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'expose-feature-pairs', expP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'move-head-axis', movP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'reveal-head-mismatch', misP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'resolve-head-construction', resP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'choose-second-probe', pr2P, 1, { dur: 0.85 });
  cueTo(s, c, 'select-probe-pair', selP, 1, { dur: 0.6 });
  cueTo(s, c, 'read-second-probe', rd2P, 1, { dur: 0.65 });
  cueTo(s, c, 'trace-foreign-probe', forP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'write-owner-check', chkP, 1, { dur: 0.65 });
  cueTo(s, c, 'try-zero-input', zeroP, 1, { dur: 0.7 });
  cueTo(s, c, 'zero-test-result', zResP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'restore-word-features', restP, 1, { dur: 0.7 });
  cueTo(s, c, 'recheck-numbered-pairs', rechP, 1, { after: true, dur: 0.6 });
}
