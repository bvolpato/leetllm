// Scene 13 (candidates): "Which program reaches the user?"
// 8-program pool -> 28-pair upper-triangular matrix (13/28 pass@2) -> lower-index selector delivering only 8/28.
import {
  COSMOS,
  PAIRS,
  PROGRAMS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  subsetCoverage,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const COVERED_COUNT = PAIRS.filter((p) => p.pass).length; // 13
const MISS_COUNT = PAIRS.length - COVERED_COUNT; // 15
const DELIVERED_COUNT = PAIRS.filter((p) => PROGRAMS[p.a - 1].pass).length; // 8

verifyInvariant(
  COVERED_COUNT === Math.round(PAIRS.length * subsetCoverage(PROGRAMS.length, 2, 2)),
  'candidates pair availability must equal 13/28',
);
verifyInvariant(DELIVERED_COUNT === 8, 'lower-index selector must deliver 8/28');

export default function candidates(s, c) {
  const phase = s.value(0);
  const showTested = s.value(0);
  const showPrompt = s.value(0);
  const showMap = s.value(0);
  const hiFirst = s.value(0);
  const showTotal = s.value(0);
  const showMisses = s.value(0);
  const showMissCount = s.value(0);
  const showCovered = s.value(0);
  const showAvail = s.value(0);
  const showSelector = s.value(0);
  const drawMode = s.value(0); // 1 = (1,2), 2 = (2,3)
  const showAsk = s.value(0);
  const slideOut1 = s.value(0);
  const showFail1 = s.value(0);
  const slideOut2 = s.value(0);
  const showPass2 = s.value(0);
  const showSelectedMap = s.value(0);
  const showSelectedScore = s.value(0);

  const bgAura = aura(-220, 40, 620, '#133a4434', '#2a1e4a20');
  const title = heroTitle(['Which Program Actually', 'Reaches the User?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.pass,
    eyebrow: 'PASS@K VS SELECTION · 8 PROGRAMS, 28 PAIRS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const tested = showTested.value;
    const mapOp = showMap.value;
    const selMap = showSelectedMap.value;
    const dMode = Math.round(drawMode.value);
    const nodes = [];

    // TOP STRIP: 8 generated programs (#1..#8), #2 & #6 glow emerald after passing-programs
    PROGRAMS.forEach((prog, i) => {
      const cx = -150 + i * 138;
      const cy = -365;
      const col = tested > 0.5 ? (prog.pass ? ROLE.pass : COSMOS.dim) : ROLE.A;
      nodes.push(
        lumBar(cx, cy, 114, 62, {
          color: col,
          fillOpacity: tested > 0.5 && prog.pass ? 0.34 : 0.14,
          strokeWidth: tested > 0.5 && prog.pass ? 2.8 : 2.0,
          glow: tested > 0.5 && prog.pass ? 11 * pulse : 4,
          radius: 10,
        }),
        txt(
          tested > 0.5 ? `#${prog.id} ${prog.pass ? '✓' : '×'}` : `#${prog.id}`,
          cx,
          cy,
          28,
          tested > 0.5 ? col : COSMOS.ink,
          'mono',
        ),
      );
    });

    // LEFT STAGE: 7x7 upper-triangular 28-pair matrix
    const matLeft = -760;
    const matTop = -175;
    const step = 84;
    const baseVis = 0.65 + 0.35 * mapOp;

    nodes.push(
      txt(
        'ALL UNORDERED PAIRS  (ROW < COL)',
        matLeft + 265,
        -242,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(baseVis),
    );

    // Row & column headers
    for (let k = 0; k < 7; k++) {
      nodes.push(
        txt(String(k + 2), matLeft + k * step + 42, matTop - 28, 26, COSMOS.muted, 'mono').opacity(
          baseVis,
        ),
        txt(String(k + 1), matLeft - 36, matTop + k * step + 34, 26, COSMOS.muted, 'mono').opacity(
          baseVis,
        ),
      );
    }

    PAIRS.forEach((pair) => {
      const colIdx = pair.b - 2;
      const rowIdx = pair.a - 1;
      const cx = matLeft + colIdx * step + 42;
      const cy = matTop + rowIdx * step + 34;

      const lowerPass = PROGRAMS[pair.a - 1].pass;
      const isLost = pair.pass && !lowerPass;
      const isHighlight =
        (hiFirst.value > 0.5 && pair.a === 1 && pair.b === 2) ||
        (dMode === 1 && pair.a === 1 && pair.b === 2) ||
        (dMode === 2 && pair.a === 2 && pair.b === 3);

      let markTxt = '';
      let markCol = COSMOS.dim;
      if (selMap > 0.5 && isLost) {
        markTxt = '×';
        markCol = ROLE.fail;
      } else if (pair.pass && showCovered.value > 0.5) {
        markTxt = '✓';
        markCol = ROLE.pass;
      } else if (!pair.pass && showMisses.value > 0.5) {
        markTxt = '×';
        markCol = COSMOS.dim;
      }

      nodes.push(
        lumBar(cx, cy, 70, 62, {
          color: isHighlight ? ROLE.focus : markTxt ? markCol : COSMOS.muted,
          fillOpacity: markTxt
            ? markCol === ROLE.pass
              ? 0.24
              : markCol === ROLE.fail
                ? 0.26
                : 0.12
            : 0.12,
          strokeWidth: isHighlight ? 3.2 : 1.8,
          glow: isHighlight ? 12 * pulse : markCol === ROLE.pass ? 6 : 3,
          radius: 8,
          opacity: baseVis,
        }),
      );
      if (markTxt) {
        nodes.push(txt(markTxt, cx, cy, 34, markCol, 'sans').opacity(baseVis));
      }
    });

    // RIGHT STAGE: Availability tally -> Live Lower-Index Selector
    const rCx = 425;
    const selOp = fadeIn(showSelector.value);
    const prmOp = showPrompt.value * fadeOut(showSelector.value);
    const introRightOp = fadeOut(showTotal.value) * fadeOut(showSelector.value);

    if (introRightOp > 0.02) {
      nodes.push(
        lumBar(rCx, 100, 660, 210, {
          color: ROLE.A,
          fillOpacity: 0.1,
          strokeWidth: 2.0,
          glow: 6,
          radius: 14,
          opacity: introRightOp,
        }),
        txt('DRAW 2 DISTINCT PROGRAMS', rCx, 48, 30, ROLE.A, 'mono').opacity(introRightOp),
        txt('Every unordered pair is equally likely', rCx, 108, 28, COSMOS.ink, 'sans').opacity(
          introRightOp,
        ),
        txt('How often does a pair contain a pass?', rCx, 160, 28, ROLE.focus, 'serif').opacity(
          introRightOp,
        ),
      );
    }

    if (prmOp > 0.02) {
      nodes.push(txt('DOES EITHER PROGRAM PASS?', rCx, -165, 34, ROLE.A, 'mono').opacity(prmOp));
    }
    if (selOp > 0.02) {
      nodes.push(
        txt('SELECTOR: RETURN LOWER INDEX', rCx, -165, 32, ROLE.focus, 'mono')
          .glow(7, ROLE.focus)
          .opacity(selOp),
      );
    }

    // Progressive pair counts (non-overlapping crossfade)
    const totOp = showTotal.value * fadeOut(showMissCount.value);
    const misOp = fadeIn(showMissCount.value) * fadeOut(showAvail.value);
    const avOp = fadeIn(showAvail.value);

    if (totOp > 0.02) {
      nodes.push(
        txt(`${PAIRS.length} possible unordered pairs`, rCx, -82, 34, COSMOS.ink, 'mono').opacity(
          totOp,
        ),
      );
    }
    if (misOp > 0.02) {
      nodes.push(
        txt(
          `${MISS_COUNT} all-failing pairs (from 6 misses)`,
          rCx,
          -82,
          32,
          COSMOS.muted,
          'mono',
        ).opacity(misOp),
      );
    }
    if (avOp > 0.02) {
      nodes.push(
        txt(
          `Available pass@2:  ${COVERED_COUNT} / ${PAIRS.length}`,
          rCx,
          -82,
          38,
          ROLE.pass,
          'mono',
        )
          .glow(8, ROLE.pass)
          .opacity(avOp),
      );
    }

    // Live selector stage (active during drawMode 1 or 2, fades before selected-map)
    const simOp = (dMode > 0 ? 1 : 0) * fadeOut(selMap);
    if (simOp > 0.02) {
      const pairA = dMode === 1 ? 1 : 2;
      const pairB = dMode === 1 ? 2 : 3;
      const slide = dMode === 1 ? slideOut1.value : slideOut2.value;
      const colA = PROGRAMS[pairA - 1].pass ? ROLE.pass : ROLE.fail;
      const colB = PROGRAMS[pairB - 1].pass ? ROLE.pass : COSMOS.dim;

      const startX = rCx + 95;
      const startY = 52;
      const destX = rCx + 95;
      const destY = 192;
      const curX = startX + (destX - startX) * slide;
      const curY = startY + (destY - startY) * slide;

      nodes.push(
        txt(`DRAWN PAIR:  (#${pairA}, #${pairB})`, rCx, -26, 28, COSMOS.muted, 'mono').opacity(
          simOp,
        ),
        // Open luminous output platform below destination (zero closed border to cross!)
        lumBar(rCx, destY + 52, 540, 6, {
          color: ROLE.A,
          fillOpacity: 0.7,
          strokeWidth: 0,
          glow: 8,
          radius: 3,
          opacity: simOp,
        }),
        txt('RETURNED ->', rCx - 125, destY, 28, COSMOS.muted, 'mono').opacity(simOp),
        // Second token stays on left draw slot
        lumBar(rCx - 125, startY, 150, 72, {
          color: colB,
          fillOpacity: 0.24,
          strokeWidth: 2.4,
          glow: 7,
          radius: 10,
          opacity: simOp,
        }),
        txt(`#${pairB}`, rCx - 125, startY, 34, colB, 'mono').opacity(simOp),
        // Lower-index token glides straight down onto the output platform
        lumBar(curX, curY, 150, 72, {
          color: colA,
          fillOpacity: 0.3,
          strokeWidth: 2.8,
          glow: 10 * pulse,
          radius: 10,
          opacity: simOp,
        }),
        txt(`#${pairA}`, curX, curY, 34, colA, 'mono').opacity(simOp),
      );

      // Strictly gated prediction prompt -> verdict
      const askOp = dMode === 1 ? showAsk.value * fadeOut(showFail1.value) : 0;
      const v1Op = dMode === 1 ? fadeIn(showFail1.value) : 0;
      const v2Op = dMode === 2 ? showPass2.value : 0;

      if (askOp > 0.02) {
        nodes.push(
          txt('Which program reaches the user?', rCx, 305, 36, ROLE.focus, 'serif')
            .glow(8, ROLE.focus)
            .opacity(simOp * askOp),
        );
      }
      if (v1Op > 0.02) {
        nodes.push(
          txt('#1 -> FAIL (#2 stayed)', rCx, 305, 34, ROLE.fail, 'mono')
            .glow(8, ROLE.fail)
            .opacity(simOp * v1Op),
        );
      }
      if (v2Op > 0.02) {
        nodes.push(
          txt('#2 -> PASS', rCx, 305, 38, ROLE.pass, 'mono')
            .glow(8, ROLE.pass)
            .opacity(simOp * v2Op),
        );
      }
    }

    // Final selector score summary (after selected-score)
    if (showSelectedScore.value > 0.02) {
      nodes.push(
        lumBar(rCx, 105, 640, 148, {
          color: ROLE.B,
          fillOpacity: 0.2,
          strokeWidth: 2.8,
          glow: 11 * pulse,
          radius: 14,
          opacity: showSelectedScore.value,
        }),
        txt('DELIVERED BY SELECTOR', rCx, 66, 28, ROLE.B, 'mono').opacity(showSelectedScore.value),
        txt(`${DELIVERED_COUNT} / ${PAIRS.length} return a pass`, rCx, 128, 48, ROLE.focus, 'mono')
          .glow(10 * pulse, ROLE.focus)
          .opacity(showSelectedScore.value),
        txt(
          '5 covered pairs lost · record returned answer, test scope, and 2-attempt cost',
          rCx,
          255,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(showSelectedScore.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'passing-programs', showTested, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'pair-draw', showPrompt, 1, { duration: 0.4 });
  tweenCue(s, c, 'pair-map', showMap, 1, { duration: 0.5 });
  tweenCue(s, c, 'first-square', hiFirst, 1, { duration: 0.35 });
  tweenCue(s, c, 'total-pairs', showTotal, 1, { duration: 0.4, after: true });
  c.on('miss-map', () => {
    s.play(hiFirst.to(0, { duration: 0.2 }));
    s.play(showMisses.to(1, { duration: 0.45 }));
  });
  tweenCue(s, c, 'miss-count', showMissCount, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'covered-map', showCovered, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'availability', showAvail, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'selector-rule', showSelector, 1, { duration: 0.45 });
  tweenCue(s, c, 'draw-first', drawMode, 1, { duration: 0.05 });
  tweenCue(s, c, 'pick-ask', showAsk, 1, { duration: 0.4 });
  tweenCue(s, c, 'return-first', slideOut1, 1, { duration: 0.6, after: true });
  tweenCue(s, c, 'fail-first', showFail1, 1, { duration: 0.4, after: true });
  c.on('draw-second', () => {
    s.play(drawMode.to(2, { duration: 0.05 }));
  });
  tweenCue(s, c, 'return-second', slideOut2, 1, { duration: 0.6, after: true });
  tweenCue(s, c, 'pass-second', showPass2, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'selected-map', showSelectedMap, 1, { duration: 0.5 });
  tweenCue(s, c, 'selected-score', showSelectedScore, 1, { duration: 0.45, after: true });
}
