// Scene 1: intro: "If the model doubles, how many token rows fit?"
// Glowing 100-square compute sheet (5 x 20 -> 10 x 10) with strict prediction withholding
// until AFTER the spoken "Ten rows" cue, followed by the physical slide-and-drop repack.
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, lumBar, playCue, scenePulse } from '../parts.mjs';

export default function intro(s, c) {
  const cols = 5;
  const rows = 20;
  const half = rows / 2;
  const budget = cols * rows;

  const title = heroTitle(['If the model doubles,', 'how many token rows fit?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tokens,
  });

  const lastRowDock = s.value(0); // 0 -> 1 slides the 20th row cleanly into place
  const highlightCols = s.value(0); // intro-count
  const doublePrompt = s.value(0); // intro-width: shows 10 x ?
  const revealAnswer = s.value(0); // AFTER intro-answer: reveals 10 x 10
  const slidePhase = s.value(0); // intro-slide: 0 -> 0.5 right, 0.5 -> 1 down
  const pulse = s.value(0);

  const stageVis = s.value(1);

  const cell = 31;
  const gridLeft = -560;
  const gridTop = -255;
  const gridBottom = gridTop + rows * cell; // +365

  const layer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const dock = lastRowDock.value;
    const hc = highlightCols.value;
    const dp = doublePrompt.value;
    const ans = revealAnswer.value;
    const sp = slidePhase.value;
    const p = pulse.value;

    // Two-phase physical repack: first slide right, then drop down beside bottom half
    const slideRight = Math.min(1, sp * 2);
    const slideDown = Math.max(0, (sp - 0.5) * 2);
    const dx = cols * cell * slideRight;
    const dy = half * cell * slideDown;

    // Ghost landing slot for the 20th row while docking
    const lastOffset = 180 * (1 - dock) * (1 - dock);
    if (lastOffset > 2) {
      for (let col = 0; col < cols; col++) {
        nodes.push(
          lumBar(gridLeft + (col + 0.5) * cell, gridTop + (rows - 0.5) * cell, cell - 5, cell - 5, {
            color: COSMOS.dim,
            fillOpacity: 0.08,
            strokeWidth: 1.4,
            glow: 0,
            radius: 4,
            opacity: 0.5 * alpha,
          }),
        );
      }
    }

    // 100 glowing compute tiles (5 x 20 -> 10 x 10)
    for (let r = 0; r < rows; r++) {
      const isLast = r === rows - 1;
      const isTopHalf = r < half;
      const ox = gridLeft + (isLast ? lastOffset : isTopHalf ? dx : 0);
      const oy = gridTop + r * cell + (isTopHalf ? dy : 0);
      const colHex =
        isLast && dp < 0.2 ? ROLE.compute : isTopHalf && sp > 0.01 ? ROLE.tokens : ROLE.params;
      const rowGlow = isLast && dp < 0.2 ? 9 : hc > 0.2 && r === 0 ? 8 : 3;

      for (let col = 0; col < cols; col++) {
        nodes.push(
          lumBar(ox + (col + 0.5) * cell, oy + cell / 2, cell - 5, cell - 5, {
            color: colHex,
            fillOpacity: isLast && dp < 0.2 ? 0.58 : isTopHalf && sp > 0.01 ? 0.44 : 0.34,
            strokeWidth: 1.6,
            glow: rowGlow,
            radius: 4,
            opacity: alpha,
          }),
        );
      }
    }

    // Callout for the docking 20th token row (before doubling prompt)
    if (dp < 0.85) {
      const labelFade = (1 - dp) * alpha;
      nodes.push(
        txt(
          '1 token row (5 sq)',
          gridLeft + cols * cell + lastOffset + 24,
          gridTop + (rows - 0.5) * cell,
          28,
          ROLE.compute,
          'mono',
          'left',
        )
          .glow(6, ROLE.compute)
          .opacity(labelFade),
      );
    }

    // Crisp side dimension brackets (hidden briefly while tiles are mid-air)
    const moving = sp > 0.03 && sp < 0.97;
    if (!moving) {
      const curRows = sp >= 0.97 ? half : rows;
      const curCols = budget / curRows;
      const topY = gridBottom - curRows * cell;
      const brX = gridLeft - 24;
      nodes.push(
        line([brX, topY], [brX, gridBottom], { stroke: COSMOS.muted, width: 2.2 }).opacity(alpha),
        line([brX, topY], [brX + 10, topY], { stroke: COSMOS.muted, width: 2.2 }).opacity(alpha),
        line([brX, gridBottom], [brX + 10, gridBottom], {
          stroke: COSMOS.muted,
          width: 2.2,
        }).opacity(alpha),
        txt(
          `${curRows} token rows`,
          brX - 18,
          (topY + gridBottom) / 2,
          30,
          ROLE.tokens,
          'mono',
          'right',
        ).opacity(alpha),
        txt(
          `${curCols} weight units`,
          gridLeft + (curCols * cell) / 2,
          gridBottom + 44,
          30,
          ROLE.params,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // Right-hand floating budget ledger (zero card chrome, floating typography + subtle accent rule)
    const rx = 120;
    nodes.push(
      txt('TRAINING BUDGET', rx, -245, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(String(budget), rx, -145, 118, ROLE.compute, 'mono', 'left')
        .glow(10, ROLE.compute)
        .opacity(alpha),
      txt('compute squares', rx + 250, -135, 36, COSMOS.ink, 'sans', 'left').opacity(alpha),
      line([rx, -58], [820, -58], { stroke: '#2c3d68', width: 2 }).opacity(0.85 * alpha),
      glowDot(rx + ((p * 1.8) % 1) * 700, -58, {
        radius: 4.5,
        color: ROLE.tokens,
        glow: 10,
        opacity: 0.8 * alpha,
      }),
      txt('Model weights  ×  token rows', rx, 4, 30, COSMOS.muted, 'sans', 'left').opacity(alpha),
      // Starting run
      txt('5 × 20', rx, 92, 62, ROLE.params, 'mono', 'left').glow(8, ROLE.params).opacity(alpha),
      txt('Starting run', rx + 290, 92, 34, COSMOS.ink, 'sans', 'left').opacity(alpha),
    );

    // Doubled weights row (withholds "10" until AFTER intro-answer!)
    if (dp > 0.02) {
      const valText = ans > 0.5 ? '10 × 10' : '10 × ?';
      const valCol = ans > 0.5 ? ROLE.optimal : ROLE.compute;
      nodes.push(
        txt(valText, rx, 206, 62, valCol, 'mono', 'left')
          .glow(10, valCol)
          .opacity(dp * alpha),
        txt('Twice the weights', rx + 290, 206, 34, COSMOS.ink, 'sans', 'left').opacity(dp * alpha),
      );
      if (ans < 0.5) {
        nodes.push(
          txt('How many rows fit in 100 squares?', rx, 315, 32, ROLE.compute, 'serif', 'left')
            .glow(7, ROLE.compute)
            .opacity(dp * alpha),
        );
      } else {
        nodes.push(
          txt('Same 100 squares  ·  different shape', rx, 315, 30, ROLE.optimal, 'mono', 'left')
            .glow(6, ROLE.optimal)
            .opacity(ans * alpha),
        );
      }
    }

    return nodes;
  });

  const eq = glowTex('N \\times D = 100', {
    x: 470,
    y: 410,
    size: 40,
    color: ROLE.tokens,
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, layer, eq);
  scenePulse(s, c, pulse);

  // Opening slide-in of the 20th token row
  c.at(0.15, () => {
    s.play(lastRowDock.to(1, { duration: 1.05 }));
  });

  playCue(s, c, 'intro-count', (d) => s.play(highlightCols.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'intro-width', (d) => s.play(doublePrompt.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'intro-answer', (d) => s.play(revealAnswer.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'intro-slide', (d) => s.play(slidePhase.to(1, { duration: d })), { dur: 1.8 });
}
