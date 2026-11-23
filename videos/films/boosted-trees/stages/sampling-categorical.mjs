import { boostCue } from '../construction.mjs';
import {
  arrow,
  cellText,
  dot,
  footer,
  formatNumber,
  heading,
  line,
  outlineBox,
  withOpacity,
} from '../defaults.mjs';
const categoryLabels = [1, 0, 1];
const exampleProbability = 0.5;

export function drawSamplingCategorical(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const cueProgress = (id, beat = currentBeat) => boostCue(state, id, beat);
  const K = (id, beat = currentBeat) => boostCue(state, id, beat) === 1;
  const S = (id, beat = currentBeat) =>
    state.cues?.[id]
      ? state.cues[id].phase !== 'before'
      : (state.beat ?? 0) > beat || ((state.beat ?? 0) === beat && progress > 0.15);
  api.focus.target('sampling-categorical-model', () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'Retain the large gradients; weight the sampled small rows');
      const gradients = [-1.5, 1, -0.1, 0.2, -0.3, 0.4],
        kept = [true, true, true, false, true, false],
        q = cueProgress('goss-weight', 0);
      line(ctx, api, 310, 590, 1690, 590, themeColors.muted, 3);
      gradients.forEach((g, i) => {
        const x = 410 + i * 230,
          factor = i < 2 ? 1 : 1 + q,
          visible = kept[i] ? 1 : 1 - 0.75 * q,
          h = g * 150 * factor;
        withOpacity(ctx, api, visible, () => {
          api.rect(
            ctx,
            x - 36,
            Math.min(590, 590 - h),
            72,
            Math.abs(h),
            i < 2 ? themeColors.pink : themeColors.blue,
          );
          cellText(ctx, api, 'g ' + g, x, 885, themeColors.ink, 26);
          cellText(
            ctx,
            api,
            i < 2 ? 'keep' : kept[i] ? 'sample · ×' + formatNumber(factor) : 'not sampled',
            x,
            950,
            kept[i] ? themeColors.yellow : themeColors.muted,
            24,
          );
        });
      });
      footer(
        ctx,
        api,
        'Each small row has a ½ chance of selection. Each selected small row gets twice the weight.',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Disjoint active ranges can share one sparse bundle');
      const conflict = S('bundle-conflict', 1),
        rows = [
          [1, 0],
          [0, 1],
          [0, 1],
          [1, 0],
        ];
      if (conflict) rows[1] = [1, 1];
      ['A', 'B', 'bundle code'].forEach((v, i) =>
        cellText(ctx, api, v, 570 + i * 390, 365, themeColors.cyan),
      );
      rows.forEach(([a, z], i) => {
        const y = 490 + i * 125;
        cellText(ctx, api, 'R' + (i + 1), 280, y, themeColors.muted);
        [a, z].forEach((v, j) => {
          const x = 570 + j * 390;
          outlineBox(
            ctx,
            api,
            x - 75,
            y - 44,
            150,
            75,
            v ? (j ? themeColors.blue : themeColors.pink) : themeColors.muted,
          );
          cellText(
            ctx,
            api,
            v,
            x,
            y + 5,
            v ? (j ? themeColors.blue : themeColors.pink) : themeColors.muted,
          );
        });
        arrow(ctx, api, 1090, y - 10, 1210, y - 10, themeColors.muted, 2);
        cellText(
          ctx,
          api,
          a && z ? 'collision' : a ? 1 : z ? 2 : 0,
          1350,
          y + 5,
          a && z ? themeColors.pink : themeColors.yellow,
          30,
        );
      });
      footer(
        ctx,
        api,
        'Zero = neither · distinct ranges identify A or B · simultaneous activation requires an explicit conflict policy.',
      );
    } else if (currentBeat === 2 && !S('ordered-statistic', 2)) {
      heading(ctx, api, 'Category IDs do not define numeric distance');
      const labels = ['C', 'A', 'B'],
        ratios = [-1, 0.25, 1];
      labels.forEach((v, i) => {
        const x = 490 + i * 460;
        outlineBox(ctx, api, x - 120, 450, 240, 260, themeColors.cyan);
        cellText(ctx, api, 'category ' + v, x, 520, themeColors.cyan);
        cellText(ctx, api, 'Σg / Σh', x, 600, themeColors.muted);
        cellText(ctx, api, ratios[i], x, 670, themeColors.yellow, 34);
      });
      line(ctx, api, 720, 410, 720, 790, themeColors.yellow, 5);
      cellText(ctx, api, 'evaluate category partitions', 960, 900, themeColors.ink, 33);
      footer(
        ctx,
        api,
        'Schematic gradient-to-curvature ordering; small-cardinality configurations may use one-versus-rest.',
      );
    } else if (currentBeat === 2) {
      heading(ctx, api, 'A row cannot contribute its own target to its ordered statistic');
      const values = [0.5, 0.75, 0.5];
      categoryLabels.forEach((v, i) => {
        const x = 460 + i * 500;
        cellText(ctx, api, 'R' + (i + 1) + ' · same category', x, 440, themeColors.cyan, 28);
        cellText(ctx, api, 'own y = ' + v, x, 550, themeColors.pink);
        outlineBox(ctx, api, x - 95, 500, 190, 85, themeColors.pink);
        if (i > 0) {
          arrow(ctx, api, x - 350, 675, x - 120, 675, themeColors.blue, 3);
          cellText(ctx, api, 'earlier labels', x - 245, 750, themeColors.blue, 24);
        }
        if (K('ordered-statistic', 2))
          cellText(ctx, api, 'stat = ' + values[i], x, 875, themeColors.yellow, 34);
        else cellText(ctx, api, 'stat pending', x, 875, themeColors.muted, 29);
      });
      footer(
        ctx,
        api,
        'Prior 1/2, smoothing weight 1: (sum preceding labels + 1/2) / (preceding count + 1).',
      );
    } else {
      heading(ctx, api, 'Which labels can the model use to predict row 3?');
      cellText(ctx, api, 'Fit on earlier rows', 581, 372, themeColors.blue, 41);
      cellText(ctx, api, 'Predict the next row', 1425, 372, themeColors.cyan, 41);
      categoryLabels.slice(0, 2).forEach((label, i) => {
        const x = 390 + i * 380;
        outlineBox(ctx, api, x - 150, 435, 300, 188, themeColors.blue, 3);
        cellText(ctx, api, 'Row ' + (i + 1), x, 501, themeColors.ink, 42);
        cellText(ctx, api, label ? 'Missed' : 'On time', x, 580, themeColors.blue, 42);
      });
      const travel = cueProgress('sampling-categorical-step-4', 3);
      line(ctx, api, 945, 535, 1165, 535, themeColors.muted, 3);
      dot(ctx, api, 945 + 220 * travel, 535, themeColors.cyan, 14);
      api.focus.target('ordered-outcome', () => {
        outlineBox(ctx, api, 1200, 435, 450, 188, themeColors.cyan, 3);
        cellText(ctx, api, 'Row 3', 1425, 501, themeColors.ink, 42);
        const revealed = K('ordered-row-label', 3);
        const label = categoryLabels[2];
        cellText(
          ctx,
          api,
          revealed ? 'Missed  ·  y = ' + label : 'Label covered',
          1425,
          580,
          revealed ? themeColors.pink : themeColors.muted,
          38,
        );
        if (K('ordered-row-score', 3))
          cellText(
            ctx,
            api,
            'Predicted miss probability   ' + exampleProbability,
            960,
            765,
            themeColors.cyan,
            44,
          );
        if (K('ordered-row-residual', 3))
          cellText(
            ctx,
            api,
            'Residual   ' +
              label +
              ' − ' +
              exampleProbability +
              ' = +' +
              (label - exampleProbability),
            960,
            891,
            themeColors.yellow,
            54,
          );
      });
    }
  });
}
export default {
  id: 'sampling-categorical',
  draw: drawSamplingCategorical,
  cues: [
    'sampling-categorical-step-1',
    'goss-weight',
    'sampling-categorical-step-2',
    'bundle-conflict',
    'sampling-categorical-step-3',
    'ordered-statistic',
    'sampling-categorical-step-4',
    'ordered-row-score',
    'ordered-row-label',
    'ordered-row-residual',
  ],
};
