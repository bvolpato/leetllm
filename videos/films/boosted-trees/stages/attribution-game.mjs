import { phase, sigmoid, twoFeatureCredits } from '../arithmetic.mjs';
import { boostCue } from '../construction.mjs';
import {
  arrow,
  cellText,
  chapterEquation,
  chapterText,
  dot,
  footer,
  formatNumber,
  heading,
  line,
  outlineBox,
  valueBar,
} from '../defaults.mjs';
export function drawAttributionGame(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const K = (id, beat = currentBeat) => boostCue(state, id, beat) === 1;
  const S = (id, beat = currentBeat) =>
    state.cues?.[id]
      ? state.cues[id].phase !== 'before'
      : (state.beat ?? 0) > beat || ((state.beat ?? 0) === beat && progress > 0.15);
  const step = (i, from = 0.1, to = 0.75) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : phase(progress, from, to);
  api.focus.target('attribution-game-model', () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'Global split summaries cannot supply this row’s signed local credit');
      const cols = [themeColors.blue, themeColors.pink, themeColors.yellow];
      ['gain', 'split count', 'impurity decrease'].forEach((s, i) => {
        const x = 420 + i * 530;
        cellText(ctx, api, s, x, 410, cols[i], 30);
        [3, 1, 2].forEach((v, j) =>
          valueBar(ctx, api, x - 140, 505 + j * 80, 280, v + (i === 1 ? j : 0), 5, cols[i], 34),
        );
      });
      ['background', 'missing-feature game', 'explained output units'].forEach((s, i) =>
        cellText(ctx, api, s, 450 + i * 510, 900, themeColors.cyan, 28),
      );
      footer(
        ctx,
        api,
        'Schematic global summaries. Correlated inputs can redistribute credit and high-cardinality inputs can gain extra split opportunities.',
      );
    } else if (currentBeat === 1) {
      const game = [0, 2, 1, 5],
        credit = twoFeatureCredits(game);
      heading(ctx, api, 'Compute both orders before averaging the same feature’s increments');
      const values = [
        {
          y: 490,
          order: ['∅', 'A', 'AB'],
          out: [0, 2, 5],
          increments: [2, 3],
          visible: S('shap-first-order', 1),
        },
        {
          y: 740,
          order: ['∅', 'B', 'AB'],
          out: [0, 1, 5],
          increments: [1, 4],
          visible: S('shap-second-order', 1),
        },
      ];
      values.forEach((r) => {
        r.order.forEach((s, i) => {
          const x = 430 + i * 530;
          outlineBox(ctx, api, x - 95, r.y - 52, 190, 105, themeColors.blue);
          cellText(ctx, api, s, x, r.y - 7, themeColors.blue, 30);
          cellText(ctx, api, r.out[i], x, r.y + 130, themeColors.ink, 32);
          if (i < 2) {
            arrow(ctx, api, x + 125, r.y, x + 400, r.y, themeColors.muted, 3);
            if (r.visible)
              cellText(ctx, api, '+' + r.increments[i], x + 260, r.y - 45, themeColors.yellow, 30);
          }
        });
      });
      if (K('shap-average', 1))
        cellText(ctx, api, `φA = (2 + 4)/2 = ${credit.A}`, 550, 970, themeColors.yellow, 30);
      if (K('gbt-shap-b', 1))
        cellText(ctx, api, `φB = (1 + 3)/2 = ${credit.B}`, 1410, 970, themeColors.yellow, 30);
      footer(ctx, api, 'Separate authored explanation game: v(∅)=0, v(A)=2, v(B)=1, v(AB)=5.');
    } else if (currentBeat === 2) {
      heading(ctx, api, 'TreeSHAP propagates path information instead of enumerating every order');
      const q = step(2),
        nodes = [
          {
            x: 600,
            y: 430,
          },
          {
            x: 420,
            y: 670,
          },
          {
            x: 950,
            y: 670,
          },
        ];
      nodes.slice(1).forEach((n, i) => {
        line(ctx, api, nodes[0].x, nodes[0].y + 24, n.x, n.y - 28, themeColors.muted, 3);
        dot(ctx, api, n.x, n.y, i ? themeColors.pink : themeColors.blue, 20);
      });
      dot(ctx, api, 600, 430, themeColors.cyan, 22);
      cellText(ctx, api, 'A split · cover 10', 600, 355, themeColors.cyan);
      cellText(ctx, api, 'cover 6', 420, 765, themeColors.blue);
      cellText(ctx, api, 'cover 4', 950, 765, themeColors.pink);
      const yy = 430 + 240 * q;
      dot(ctx, api, 600 + 350 * q, yy, themeColors.yellow, 12);
      chapterText(
        ctx,
        api,
        'path: feature · zero fraction · one fraction',
        1160,
        430,
        25,
        themeColors.ink,
      );
      chapterText(ctx, api, 'EXTEND: add the next split', 1160, 570, 27, themeColors.cyan);
      chapterText(ctx, api, 'UNWIND: account for a path feature', 1160, 700, 27, themeColors.cyan);
      chapterEquation(ctx, api, String.raw`|S|!(M-|S|-1)!/M!`, 1370, 865, 36, themeColors.yellow);
      footer(
        ctx,
        api,
        'Path-dependent cover is one explanation convention. Original complexity O(T L D²); a background/interventional game changes the assumptions.',
      );
    } else {
      heading(ctx, api, 'A raw-logit contribution must be combined before the sigmoid');
      const values = [-1, 0.42, 0.26],
        colors = [themeColors.blue, themeColors.pink, themeColors.yellow],
        x = [450, 850, 1250];
      let total = 0;
      values.forEach((v, i) => {
        const before = total;
        total += v;
        const y0 = 720 - before * 200,
          y1 = 720 - total * 200;
        api.rect(ctx, x[i] - 70, Math.min(y0, y1), 140, Math.abs(y1 - y0), colors[i]);
        cellText(ctx, api, (v > 0 ? '+' : '') + v, x[i], 430, colors[i], 35);
        if (i < 2) line(ctx, api, x[i] + 70, y1, x[i + 1] - 70, y1, themeColors.muted, 2);
      });
      if (K('shap-logit', 3))
        cellText(ctx, api, 'raw score = ' + formatNumber(total, 2), 960, 930, themeColors.ink, 33);
      if (K('gbt-shap-probability', 3))
        cellText(
          ctx,
          api,
          'sigmoid = ' + formatNumber(sigmoid(total), 6),
          1550,
          690,
          themeColors.green,
          31,
        );
      footer(ctx, api, 'Example log odds     →     sigmoid     →     probability');
    }
  });
}
export default {
  id: 'attribution-game',
  draw: drawAttributionGame,
  cues: [
    'attribution-game-step-1',
    'attribution-game-step-2',
    'shap-first-order',
    'shap-second-order',
    'shap-average',
    'gbt-shap-b',
    'attribution-game-step-3',
    'attribution-game-step-4',
    'shap-logit',
    'gbt-shap-probability',
  ],
};
