// Pure-cinema aligned 10-question renewal comparison sheet (Q91..Q100) with zero slide boxes.
import { CASES, COSMOS, ROLE, glowRing, lumBar, rule, scoreCases, txt } from './parts.mjs';

export const RENEWALS = Object.freeze(CASES.filter((item) => item.category === 'renewal'));

/**
 * Draw the aligned 10-question renewal sheet for Assistants A and B.
 * Both rows share identical Q91..Q100 x-columns so vertical case identity stays unmistakable.
 */
export function drawRenewalSheet({
  left = -830,
  top = -175,
  rowGap = 152,
  showOrdinaryA = 0,
  showOrdinaryB = 0,
  showMarksA = 0,
  showMarksB = 0,
  highlightIndices = [],
  highlightColor = COSMOS.gold,
  highlightOpacity = 0,
  focusA = 0,
  focusB = 0,
  opacity = 1,
  pulse = 1,
} = {}) {
  const nodes = [];
  const allA = scoreCases('A');
  const allB = scoreCases('B');
  const ordA = scoreCases('A', 'ordinary');
  const ordB = scoreCases('B', 'ordinary');

  const colAll = left + 95;
  const colOrd = left + 290;
  const colGridStart = left + 455;
  const cellStep = 122;
  const headY = top - 58;
  const rowAY = top + 34;
  const rowBY = top + 34 + rowGap;

  // Column headers (floating mono typography, zero banner chrome)
  nodes.push(
    txt('OVERALL', colAll, headY, 26, COSMOS.muted, 'mono').opacity(opacity),
    txt('ORDINARY', colOrd, headY, 26, COSMOS.muted, 'mono').opacity(opacity),
    rule(left, headY + 28, colGridStart + cellStep * 9 + 52, headY + 28, COSMOS.rule, 2).opacity(
      opacity * 0.75,
    ),
  );

  // Q91..Q100 aligned column headers
  const cellXs = RENEWALS.map((item, i) => {
    const cx = colGridStart + i * cellStep;
    const isHi = highlightOpacity > 0.02 && highlightIndices.includes(i);
    nodes.push(
      txt(item.id, cx, headY, 26, isHi ? highlightColor : COSMOS.muted, 'mono')
        .glow(isHi ? 8 : 0, highlightColor)
        .opacity(opacity),
    );
    return cx;
  });

  const drawRow = (model, cy, allRes, ordRes, ordVis, markVis, rowFocus) => {
    const col = model === 'A' ? ROLE.A : ROLE.B;
    nodes.push(
      txt(`Assistant ${model}`, colAll, cy - 22, 30, col, 'sans')
        .glow(5, col)
        .opacity(opacity),
      txt(`${allRes.correct}/${allRes.total}`, colAll, cy + 22, 34, COSMOS.ink, 'mono').opacity(
        opacity,
      ),
    );
    if (ordVis > 0.02) {
      nodes.push(
        txt(`${ordRes.correct}/${ordRes.total}`, colOrd, cy, 36, COSMOS.ink, 'mono')
          .glow(6 * ordVis, col)
          .opacity(opacity * ordVis),
      );
    } else {
      nodes.push(txt('? / 90', colOrd, cy, 30, COSMOS.dim, 'mono').opacity(opacity * 0.6));
    }

    RENEWALS.forEach((item, i) => {
      const cx = cellXs[i];
      const pass = item[model];
      const cellCol = markVis > 0.02 ? (pass ? ROLE.pass : ROLE.fail) : COSMOS.rule;
      const isHi = highlightOpacity > 0.02 && highlightIndices.includes(i);
      nodes.push(
        lumBar(cx, cy, 98, 86, {
          color: isHi ? highlightColor : rowFocus > 0.05 ? COSMOS.gold : cellCol,
          fillOpacity: markVis > 0.02 ? 0.14 + 0.16 * markVis : 0.08,
          strokeWidth: isHi ? 3.2 : rowFocus > 0.05 ? 2.8 : 2.0,
          glow: isHi ? 12 : markVis > 0.5 ? 7 : 3,
          radius: 10,
          opacity,
        }),
      );
      if (markVis > 0.02) {
        nodes.push(
          txt(pass ? '✓' : '×', cx, cy, 48, pass ? ROLE.pass : ROLE.fail, 'sans')
            .glow(8 * pulse, pass ? ROLE.pass : ROLE.fail)
            .opacity(opacity * markVis),
        );
      }
    });
  };

  drawRow('A', rowAY, allA, ordA, showOrdinaryA, showMarksA, focusA);
  drawRow('B', rowBY, allB, ordB, showOrdinaryB, showMarksB, focusB);

  // Optional vertical spotlight rings on highlighted columns
  if (highlightOpacity > 0.02 && highlightIndices.length === 1) {
    const cx = cellXs[highlightIndices[0]];
    nodes.push(
      rule(cx, rowAY + 46, cx, rowBY - 46, highlightColor, 3.2).opacity(opacity * highlightOpacity),
      glowRing(cx, rowAY, 52, highlightColor, {
        width: 2.8,
        glow: 10,
        opacity: opacity * highlightOpacity * 0.85,
      }),
      glowRing(cx, rowBY, 52, highlightColor, {
        width: 2.8,
        glow: 10,
        opacity: opacity * highlightOpacity * 0.85,
      }),
    );
  }

  return { nodes, cellXs, rowAY, rowBY, colAll, colOrd };
}
