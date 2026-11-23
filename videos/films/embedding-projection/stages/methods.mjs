import { PCA_POINTS } from '../fixtures.mjs';
import { PCA_AXIS, PCA_EXPLAINED, centered } from '../model.mjs';
import { coreCueProgress, coreLine, coreText } from '../defaults.mjs';
export function drawMethods(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  {
    const sweep = currentBeat > 0 ? 1 : coreCueProgress(ctx, api, 'axis-sweep'),
      angle = -Math.PI / 3 + (Math.atan2(PCA_AXIS.y, PCA_AXIS.x) + Math.PI / 3) * sweep,
      axis = [Math.cos(angle), Math.sin(angle)],
      progress = currentBeat > 0 ? 1 : coreCueProgress(ctx, api, 'axis-project'),
      variance =
        centered.reduce((s, v) => s + (v.x * axis[0] + v.y * axis[1]) ** 2, 0) /
        (PCA_POINTS.length - 1),
      plot = teaching.axes({
        x: 190,
        y: 390,
        width: 860,
        height: 470,
        xDomain: [-4, 4],
        yDomain: [-3, 3],
        equalUnits: true,
        xTicks: [-3, 0, 3],
        yTicks: [-2, 0, 2],
        fontSize: 24,
      });
    const a = plot.point(-3.7 * axis[0], -3.7 * axis[1]),
      z = plot.point(3.7 * axis[0], 3.7 * axis[1]);
    coreLine(ctx, api, a.x, a.y, z.x, z.y, themeColors.yellow, 4);
    PCA_POINTS.forEach((v, i) => {
      const score = v.x * axis[0] + v.y * axis[1],
        q = {
          x: score * axis[0],
          y: score * axis[1],
        },
        from = plot.point(v.x, v.y),
        to = plot.point(q.x, q.y),
        now = plot.point(v.x + (q.x - v.x) * progress, v.y + (q.y - v.y) * progress);
      coreLine(ctx, api, from.x, from.y, to.x, to.y, themeColors.pink, 2);
      api.circle(
        ctx,
        now.x,
        now.y,
        10,
        [themeColors.cyan, themeColors.blue, themeColors.green, themeColors.yellow][i],
      );
      coreText(
        ctx,
        api,
        v.id,
        1080,
        455 + i * 75,
        27,
        [themeColors.cyan, themeColors.blue, themeColors.green, themeColors.yellow][i],
      );
    });
    coreText(
      ctx,
      api,
      'Candidate-axis variance: ' + variance.toFixed(3),
      610,
      300,
      33,
      themeColors.yellow,
    );
    if (progress === 1)
      coreText(
        ctx,
        api,
        (PCA_EXPLAINED * 100).toFixed(1) + '% of this fixture’s variance retained',
        610,
        960,
        30,
        themeColors.green,
      );
    else
      coreText(
        ctx,
        api,
        'Rotate the ruler; measure actual projected spread',
        610,
        960,
        28,
        themeColors.muted,
      );
    const nodes = [
      [1260, 490],
      [1550, 490],
      [1260, 755],
      [1550, 755],
    ];
    coreText(ctx, api, 'Selected local relationships', 1410, 350, 29, themeColors.ink);
    if (currentBeat > 0) {
      [
        [0, 1],
        [1, 2],
        [2, 3],
      ].forEach(([i, j]) => coreLine(ctx, api, ...nodes[i], ...nodes[j], themeColors.cyan, 4));
    }
    nodes.forEach(([x, y], i) => {
      api.circle(
        ctx,
        x,
        y,
        17,
        [themeColors.cyan, themeColors.blue, themeColors.green, themeColors.yellow][i],
      );
      coreText(
        ctx,
        api,
        String.fromCharCode(65 + i),
        x,
        y + 55,
        28,
        [themeColors.cyan, themeColors.blue, themeColors.green, themeColors.yellow][i],
      );
    });
    coreText(ctx, api, 'Variance ≠ judged relevance', 1410, 960, 31, themeColors.yellow);
  }
  return;
}
export default {
  id: 'methods',
  draw: drawMethods,
  cues: [
    'methods-beat-1-focus-1',
    'methods-beat-1-focus-2',
    'axis-sweep',
    'axis-project',
    'methods-beat-2-focus-1',
    'methods-beat-2-focus-2',
    'methods-beat-3-focus-1',
  ],
};
