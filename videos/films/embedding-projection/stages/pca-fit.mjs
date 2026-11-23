import {
  chapterBox,
  chapterCueComplete,
  chapterCueVisible,
  chapterEquation,
  chapterFooter,
  chapterLine,
  chapterText,
} from '../defaults.mjs';
export function drawPcaFit(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const centered = chapterCueVisible(ctx, api, 'pca-center'),
        project = chapterCueVisible(ctx, api, 'pca-axis'),
        scores = chapterCueComplete(ctx, api, 'pca-scores'),
        plot = teaching.axes({
          x: 180,
          y: 350,
          width: 760,
          height: 540,
          xDomain: [-2, 4],
          yDomain: [-2, 4],
          equalUnits: true,
          xTicks: [-1, 0, 1, 2, 3],
          yTicks: [-1, 0, 1, 2, 3],
          fontSize: 24,
        });
      const values = [1, 2, 3];
      values.forEach((v, i) => {
        const coordinate = centered ? v - 2 : v,
          at = plot.point(coordinate, coordinate);
        api.circle(ctx, at.x, at.y, 12, themeColors.cyan);
        chapterText(ctx, api, ['A', 'B', 'C'][i], at.x + 35, at.y + 30, 27, themeColors.cyan);
      });
      if (project) {
        const a = plot.point(-1.5, -1.5),
          z = plot.point(3.5, 3.5);
        chapterLine(ctx, api, a.x, a.y, z.x, z.y, themeColors.yellow, 4);
      }
      chapterBox(
        ctx,
        api,
        chapterCueVisible(ctx, api, 'pca-mean') ? 'Mean = [2, 2]' : 'Fit the document mean',
        1120,
        365,
        600,
        110,
        themeColors.yellow,
      );
      chapterBox(
        ctx,
        api,
        centered ? 'Centered: [−1, −1], [0, 0], [1, 1]' : 'Rows: [1, 1], [2, 2], [3, 3]',
        1080,
        560,
        680,
        125,
        themeColors.cyan,
      );
      if (scores)
        chapterBox(ctx, api, 'Coordinates: −√2, 0, +√2', 1120, 780, 600, 115, themeColors.green);
    } else if (currentBeat === 1) {
      chapterText(ctx, api, 'Centered X has shape N × d', 960, 285, 36, themeColors.ink);
      if (chapterCueVisible(ctx, api, 'svd-shapes')) {
        chapterBox(ctx, api, 'U\nN × r', 210, 420, 400, 170, themeColors.blue);
        chapterBox(ctx, api, 'Σ\nr × r', 760, 420, 400, 170, themeColors.yellow);
        chapterBox(ctx, api, 'Vᵀ\nr × d', 1310, 420, 400, 170, themeColors.cyan);
        chapterEquation(ctx, api, String.raw`X=U\Sigma V^T`, 960, 700, 52, themeColors.green);
      }
      if (chapterCueVisible(ctx, api, 'centered-rank'))
        chapterText(
          ctx,
          api,
          'rank ≤ min(N − 1, d) · r = min(N, d)',
          960,
          805,
          33,
          themeColors.yellow,
        );
      if (chapterCueVisible(ctx, api, 'pca-covariance'))
        chapterEquation(
          ctx,
          api,
          String.raw`\lambda_i=\sigma_i^2/(N-1)`,
          960,
          900,
          41,
          themeColors.cyan,
        );
      if (chapterCueVisible(ctx, api, 'pca-energy'))
        chapterText(
          ctx,
          api,
          'Retained energy = retained σ² sum / total σ² sum',
          960,
          980,
          31,
          themeColors.green,
        );
    } else {
      chapterText(
        ctx,
        api,
        'Keep the numerical and evaluation contracts',
        960,
        285,
        36,
        themeColors.ink,
      );
      chapterBox(ctx, api, 'Direct SVD of centered X', 220, 390, 650, 135, themeColors.cyan);
      chapterBox(
        ctx,
        api,
        'Covariance XᵀX\ncondition number is squared',
        1040,
        390,
        650,
        135,
        chapterCueVisible(ctx, api, 'pca-condition') ? themeColors.pink : themeColors.yellow,
      );
      if (chapterCueVisible(ctx, api, 'pca-whiten')) {
        chapterBox(ctx, api, 'Centering ≠ standardizing', 220, 655, 650, 110, themeColors.yellow);
        chapterBox(
          ctx,
          api,
          'Whitening changes the metric',
          1040,
          655,
          650,
          110,
          themeColors.yellow,
        );
      }
      if (chapterCueVisible(ctx, api, 'pca-fold'))
        chapterText(
          ctx,
          api,
          'Fit inside training folds · choose dimensions on development · test fresh queries',
          960,
          910,
          30,
          themeColors.green,
        );
    }
    chapterFooter(
      ctx,
      api,
      'Save the fitted mean, basis, solver, encoder and normalization policy',
    );
  }
  return;
}
export default {
  id: 'pca-fit',
  draw: drawPcaFit,
  cues: [
    'pca-mean',
    'pca-center',
    'pca-axis',
    'pca-scores',
    'svd-shapes',
    'centered-rank',
    'pca-covariance',
    'pca-energy',
    'pca-condition',
    'pca-whiten',
    'pca-fold',
  ],
};
