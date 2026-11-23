import { phase } from '../arithmetic.mjs';
import { boostCue } from '../construction.mjs';
import {
  arrow,
  cellText,
  chapterEquation,
  dot,
  footer,
  formatNumber,
  heading,
} from '../defaults.mjs';
export function drawCurvatureSplit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const K = (id, beat = currentBeat) => boostCue(state, id, beat) === 1;
  const step = (i, from = 0.1, to = 0.75) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : phase(progress, from, to);
  api.focus.target('curvature-split-model', () => {
    if (currentBeat === 0 || currentBeat === 3) {
      heading(
        ctx,
        api,
        currentBeat === 0
          ? 'Differentiate the log loss in raw-score units'
          : 'Equal curvature can accompany very different errors',
      );
      const probabilities = currentBeat === 0 ? [0.5, 0.5, 0.5] : [0.99, 0.5, 0.01],
        labels = currentBeat === 0 ? [0, 1, 1] : [1, 1, 1];
      ['p', 'y', 'g = p − y', 'h = p(1 − p)', 'w, λ = 0', 'w, λ = 1'].forEach(
        (s, i) =>
          (currentBeat === 3 || i < 4) &&
          cellText(ctx, api, s, 240 + i * 285, 390, i < 2 ? themeColors.ink : themeColors.cyan, 25),
      );
      probabilities.forEach((p, i) => {
        const y = 520 + i * 170,
          g = p - labels[i],
          h = p * (1 - p);
        [p, labels[i], g, h, -g / h, -g / (h + 1)].forEach((v, j) => {
          if (currentBeat === 0 && j > 3) return;
          if (currentBeat === 3 && j === 4 && !K('gbt-curvature-hundred', 3)) return;
          if (currentBeat === 3 && j === 5 && !K('curvature-regularize', 3)) return;
          cellText(
            ctx,
            api,
            formatNumber(v, j === 3 ? 4 : 2),
            240 + j * 285,
            y,
            j === 2
              ? g > 0
                ? themeColors.blue
                : themeColors.pink
              : j === 5
                ? themeColors.green
                : themeColors.ink,
            31,
          );
        });
      });
      chapterEquation(
        ctx,
        api,
        String.raw`p=\frac{1}{1+e^{-F}},\quad \ell=-y\log p-(1-y)\log(1-p)`,
        960,
        955,
        36,
      );
      footer(
        ctx,
        api,
        currentBeat === 0
          ? 'p = 0.5 is a sign probe; the actual fitted classifier starts at 119/360.'
          : 'Isolated one-row leaf calculation; regularization, admission and update caps remain separate controls.',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'The optimum is a balance of gradient and curvature');
      const G = -1,
        H = 0.5,
        lambda = 1,
        weight = -G / (H + lambda),
        plot = api.teaching.axes({
          x: 240,
          y: 420,
          width: 760,
          height: 420,
          xDomain: [-1, 2],
          yDomain: [-0.5, 2],
          xTicks: [-1, 0, 1, 2],
          yTicks: [0, 1, 2],
          xLabel: 'leaf weight w',
          yLabel: 'quadratic surrogate',
          fontSize: 24,
        });
      api.teaching.curve({
        plot,
        points: Array.from(
          {
            length: 100,
          },
          (_, i) => {
            const w = -1 + i / 33;
            return {
              x: w,
              y: G * w + 0.5 * (H + lambda) * w * w,
            };
          },
        ),
        progress: step(1),
        color: themeColors.cyan,
      });
      chapterEquation(ctx, api, String.raw`Q(w)=Gw+\tfrac12(H+\lambda)w^2`, 1420, 430, 36);
      chapterEquation(ctx, api, String.raw`Q'(w)=G+(H+\lambda)w`, 1420, 570, 36);
      if (K('leaf-optimum', 1)) {
        const at = plot.point(weight, G * weight + 0.5 * (H + lambda) * weight ** 2);
        dot(ctx, api, at.x, at.y, themeColors.yellow, 13);
        chapterEquation(
          ctx,
          api,
          String.raw`w^*=-\frac{G}{H+\lambda}`,
          1420,
          740,
          48,
          themeColors.yellow,
        );
      }
      footer(ctx, api, 'Illustrative leaf G = −1, H = 0.5, λ = 1. The partition is held fixed.');
    } else {
      const lambda = 1;
      const gamma = 0.25;
      const children = [
        { g: -1, h: 1, x: 540 },
        { g: 1, h: 1, x: 1380 },
      ];
      const saving = (g, h) => (0.5 * g ** 2) / (h + lambda);
      const parentG = children.reduce((sum, leaf) => sum + leaf.g, 0);
      const parentH = children.reduce((sum, leaf) => sum + leaf.h, 0);
      const parent = saving(parentG, parentH);
      const gain = children.reduce((sum, leaf) => sum + saving(leaf.g, leaf.h), 0) - parent - gamma;
      heading(ctx, api, 'Saving per leaf  =  ½ × G² / (H + λ)       ·       λ = 1');
      cellText(
        ctx,
        api,
        'Parent    G = ' + parentG + '    H = ' + parentH,
        960,
        382,
        themeColors.ink,
        37,
      );
      cellText(ctx, api, 'Saving   ' + parent, 960, 442, themeColors.cyan, 34);
      const fork = boostCue(state, 'gain-fork', 2);
      if (fork > 0) {
        for (const leaf of children) {
          const x = 960 + (leaf.x - 960) * fork;
          arrow(ctx, api, 960, 474, x, 480 + 107 * fork, themeColors.cyan, 3);
          if (fork === 1) {
            cellText(
              ctx,
              api,
              'G = ' + leaf.g + '    H = ' + leaf.h,
              leaf.x,
              662,
              themeColors.ink,
              37,
            );
            if (K('gain-children', 2))
              cellText(
                ctx,
                api,
                'Saving   ' + saving(leaf.g, leaf.h),
                leaf.x,
                740,
                themeColors.cyan,
                35,
              );
          }
        }
      }
      if (K('gain-charge', 2)) {
        const terms =
          children.map((leaf) => saving(leaf.g, leaf.h)).join(' + ') +
          ' − ' +
          parent +
          ' − ' +
          gamma;
        cellText(
          ctx,
          api,
          'Net gain    ' + terms + '  =  ' + (K('gain-paid', 2) ? gain : '?'),
          960,
          885,
          themeColors.yellow,
          44,
        );
        cellText(
          ctx,
          api,
          'Child savings − parent saving − one extra leaf charge',
          960,
          972,
          themeColors.ink,
          30,
        );
      }
    }
  });
}
export default {
  id: 'curvature-split',
  draw: drawCurvatureSplit,
  cues: [
    'curvature-split-step-1',
    'curvature-split-step-2',
    'leaf-optimum',
    'curvature-split-step-3',
    'gain-fork',
    'gain-children',
    'gain-charge',
    'gain-paid',
    'curvature-split-step-4',
    'curvature-regularize',
    'gbt-curvature-hundred',
  ],
};
