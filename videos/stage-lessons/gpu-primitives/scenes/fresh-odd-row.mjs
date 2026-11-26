// Scene 23 (Finale): Seven plays and one spare lane. Odd-row padding, +5 offset lift, cross-boundary swap -> 8 vs 5, both finish at 13.
import {
  COSMOS,
  ODD_ROW,
  ODD_SCORES,
  SWAPPED_ROW,
  SWAPPED_SCORES,
  aura,
  boundaries,
  buildScoreTraceNodes,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  number,
  remainDuration,
  runPhase,
  traceBeaconNodes,
  tracePolylineNodes,
  txt,
} from '../parts.mjs';

const BLOCK_B_ODD_LOCAL = boundaries(ODD_ROW.slice(4)); // [0, -2, 2, 8]
const ODD_OFFSET = ODD_SCORES[4]; // 5
const FINAL_TOTAL = ODD_SCORES[7]; // 13

export default function freshOddRow(s, c) {
  const phase = s.value(0);
  const localAsk = s.value(0);
  const showOffsetFive = s.value(0);
  const showLiftedB = s.value(0);
  const showTotal13 = s.value(0);

  const isSwapped = s.value(0);
  const showFreeze = s.value(0);
  const revealEight = s.value(0);
  const tracePenalty = s.value(0);
  const traceRejoin = s.value(0);
  const traceLast = s.value(0);
  const showClosingThesis = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e622', '#6ee7b71a');

  const live = guardedDynamic(1, () => {
    const ask = localAsk.value;
    const off5 = showOffsetFive.value > 0.5;
    const liftB = showLiftedB.value > 0.5;
    const tot13 = showTotal13.value > 0.5;

    const swp = isSwapped.value > 0.5;
    const frz = showFreeze.value > 0.5;
    const eig = revealEight.value > 0.5;
    const pen = tracePenalty.value;
    const rej = traceRejoin.value;
    const lst = traceLast.value;
    const cls = showClosingThesis.value > 0.5;

    const activeRow = swp ? SWAPPED_ROW : ODD_ROW;
    const marked = swp && !frz ? [3, 5] : [4];

    const { nodes, bx, sy } = buildScoreTraceNodes({
      row: activeRow,
      scores: ODD_SCORES,
      x0: -680,
      stepX: 178,
      zeroY: 235,
      pxPerPoint: 20,
      chipY: -175,
      ticks: [-4, 0, 4, 8, 12],
      markedPlays: marked,
      split: true,
      pad: true,
      alpha: 1,
    });

    const out = [
      heroTitle(swp ? ['Swap Across the', 'Block Boundary'] : ['Seven Plays &', 'One Spare Lane'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: cls ? COSMOS.emerald : COSMOS.gold,
        eyebrow: swp
          ? 'EXCHANGE +1 AND +4 · SAME REDUCTION, DIFFERENT PREFIX'
          : 'ODD ROW · LANE 7 PADDED WITH 0 (GUARDED LOAD/STORE)',
      }),
      ...nodes,
    ];

    if (frz) {
      out.push(
        line([bx(4), -130], [bx(4), -72], { stroke: COSMOS.gold, width: 3.5 }).glow(8, COSMOS.gold),
        txt('BEFORE −2', bx(4) + 115, -96, 26, COSMOS.gold, 'mono'),
      );
    }

    if (!swp) {
      // Beat 0-1: Odd row with Block A blue + unshifted gray Block B -> lifted cyan Block B
      out.push(
        ...tracePolylineNodes(ODD_SCORES.slice(0, 5), bx, sy, {
          start: 0,
          steps: off5 ? 4 : 3,
          color: COSMOS.blue,
        }),
        ...tracePolylineNodes(BLOCK_B_ODD_LOCAL, bx, sy, {
          start: 4,
          steps: Math.max(0.01, ask * 2),
          color: COSMOS.dim,
          glow: 0,
          core: false,
          width: 3.6,
        }),
        ...traceBeaconNodes(bx, sy, 4, 0, 'B local 0', COSMOS.muted, { dx: -112, dy: 42 }),
      );

      if (off5) {
        out.push(
          ...traceBeaconNodes(bx, sy, 4, ODD_OFFSET, String(ODD_OFFSET), COSMOS.gold, {
            dx: -54,
            dy: -22,
          }),
        );
      }
      if (liftB) {
        out.push(
          ...tracePolylineNodes(BLOCK_B_ODD_LOCAL, bx, sy, {
            start: 4,
            offset: ODD_OFFSET,
            steps: tot13 ? 3 : 2,
            color: COSMOS.cyan,
          }),
          ...traceBeaconNodes(bx, sy, 5, ODD_SCORES[5], number(ODD_SCORES[5]), COSMOS.cyan, {
            dx: 36,
            dy: 20,
          }),
          ...traceBeaconNodes(bx, sy, 6, ODD_SCORES[6], number(ODD_SCORES[6]), COSMOS.cyan, {
            dx: -42,
            dy: -48,
          }),
        );
      }
      if (tot13) {
        out.push(
          ...traceBeaconNodes(bx, sy, 7, FINAL_TOTAL, String(FINAL_TOTAL), COSMOS.emerald, {
            dx: 38,
            dy: -22,
          }),
        );
      }
    } else {
      // Beat 2-3: Ghost old trace vs new golden swapped trace
      out.push(
        ...tracePolylineNodes(ODD_SCORES, bx, sy, {
          start: 0,
          steps: 7,
          color: COSMOS.dim,
          dots: false,
          glow: 0,
          core: false,
          width: 3.4,
          alpha: 0.65,
        }),
        ...traceBeaconNodes(bx, sy, 4, ODD_SCORES[4], `was ${ODD_SCORES[4]}`, COSMOS.muted, {
          dx: -84,
          dy: 42,
        }),
        ...traceBeaconNodes(bx, sy, 7, FINAL_TOTAL, String(FINAL_TOTAL), COSMOS.emerald, {
          dx: 38,
          dy: -22,
        }),
      );

      // New swapped trace: strictly stop at step 3 (before boundary!) until revealEight!
      const swSteps = eig ? 4 + pen + rej + lst : 3;
      out.push(
        ...tracePolylineNodes(SWAPPED_SCORES, bx, sy, {
          start: 0,
          steps: swSteps,
          color: COSMOS.gold,
        }),
      );
      if (eig) {
        out.push(
          ...traceBeaconNodes(
            bx,
            sy,
            4,
            SWAPPED_SCORES[4],
            `now ${SWAPPED_SCORES[4]}`,
            COSMOS.gold,
            {
              dx: 84,
              dy: -38,
            },
          ),
        );
      }
      if (rej > 0.85) {
        out.push(
          ...traceBeaconNodes(
            bx,
            sy,
            6,
            SWAPPED_SCORES[6],
            `both ${SWAPPED_SCORES[6]}`,
            COSMOS.cyan,
            {
              dx: -68,
              dy: -48,
            },
          ),
        );
      }
    }

    // Bottom prediction & finale thesis banner
    const msgCol = cls
      ? COSMOS.emerald
      : swp
        ? eig
          ? COSMOS.gold
          : COSMOS.cyan
        : tot13
          ? COSMOS.emerald
          : COSMOS.gold;

    const msg = cls
      ? 'Reduction keeps final total 13  ·  Choose exclusive scan when you need the score before every play'
      : swp
        ? eig
          ? `Before −2:  ${ODD_SCORES[4]} → ${SWAPPED_SCORES[4]}   ·   rejoin at 7   ·   both finish at ${FINAL_TOTAL}`
          : 'Swapped +1 & +4 across boundary · same total 13 · What score is before −2 now?'
        : liftB
          ? 'Add offset +5 to Block B local [0, −2, 2]  →  [5, 3, 7]'
          : off5
            ? 'Block A scores 5  →  Block B starts at offset +5'
            : '7 real plays + 1 padded 0 lane  ·  What score appears just before the −2 penalty?';

    out.push(
      glassCell(0, 396, 1580, 82, msgCol, { fill: '#101829', glow: 9 }),
      txt(msg, 0, 396, 28, msgCol, 'sans').glow(cls ? 5 : 0, msgCol),
    );

    return group(...out);
  });

  s.add(bgAura, live);
  runPhase(s, c, phase, 14);

  c.on('fresh-ask', () => s.play(localAsk.to(1, { duration: 0.65 })));
  c.after('fresh-offset-five', () => s.play(showOffsetFive.to(1, { duration: 0.4 })));
  c.after('fresh-odd-row-step-2', () => s.play(showLiftedB.to(1, { duration: 0.5 })));
  c.after('fresh-reduction', () => s.play(showTotal13.to(1, { duration: 0.4 })));

  c.on('fresh-swap', () => s.play(isSwapped.to(1, { duration: 0.45 })));
  c.on('fresh-again', () => s.play(showFreeze.to(1, { duration: 0.35 })));
  c.after('fresh-eight', () => s.play(revealEight.to(1, { duration: 0.4 })));
  c.on('fresh-penalty', () => s.play(tracePenalty.to(1, { duration: 0.45 })));
  c.on('fresh-rejoin', () => s.play(traceRejoin.to(1, { duration: 0.45 })));
  c.on('fresh-last', () => s.play(traceLast.to(1, { duration: 0.45 })));
  c.on('fresh-choose', () =>
    s.play(showClosingThesis.to(1, { duration: remainDuration(c, 'fresh-choose', 0.45) })),
  );
}
