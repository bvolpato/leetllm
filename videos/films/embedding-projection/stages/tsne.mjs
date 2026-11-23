import { mapPairFixture, pairDistanceFor, tsneTerm } from '../arithmetic.mjs';
import { coreBox, coreCueProgress, coreLine, coreText } from '../defaults.mjs';
export function drawTsne(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const move = currentBeat < 2 ? 0 : coreCueProgress(ctx, api, 'tsne-beat-3-focus-1'),
      distance = pairDistanceFor(0.01) + (pairDistanceFor(0.1) - pairDistanceFor(0.01)) * move,
      points = [
        [0, 0],
        [distance, 0],
        [0, 1],
        [1, 1],
      ],
      q = mapPairFixture(distance),
      plot = teaching.axes({
        x: 180,
        y: 400,
        width: 900,
        height: 440,
        xDomain: [-0.5, 6.5],
        yDomain: [-0.5, 2],
        equalUnits: true,
        xTicks: [0, 2, 4, 6],
        yTicks: [0, 1],
        fontSize: 24,
      });
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++) {
        const a = plot.point(...points[i]),
          z = plot.point(...points[j]);
        coreLine(
          ctx,
          api,
          a.x,
          a.y,
          z.x,
          z.y,
          i === 0 && j === 1 ? themeColors.pink : themeColors.line,
          i === 0 && j === 1 ? 5 : 2,
        );
      }
    points.forEach((v, i) => {
      const a = plot.point(...v);
      api.circle(ctx, a.x, a.y, 12, i === 1 ? themeColors.pink : themeColors.cyan);
      coreText(
        ctx,
        api,
        ['i', 'j', 'k', 'l'][i],
        a.x + [-35, 35, -35, 35][i],
        a.y + [35, 35, -20, -20][i],
        28,
        i === 1 ? themeColors.pink : themeColors.cyan,
      );
    });
    coreBox(ctx, api, 'Supplied source pᵢⱼ = 0.10', 1160, 320, 580, 95, themeColors.blue);
    coreBox(ctx, api, 'Map qᵢⱼ = ' + q.q[0][1].toFixed(3), 1160, 465, 580, 95, themeColors.pink);
    coreBox(
      ctx,
      api,
      'All 12 ordered weights\nnormalizer = ' + q.denominator.toFixed(4),
      1160,
      605,
      580,
      135,
      themeColors.cyan,
    );
    if (currentBeat > 0)
      coreBox(
        ctx,
        api,
        'Pair term · ' + tsneTerm(0.1, q.q[0][1]).toFixed(3),
        1160,
        810,
        580,
        95,
        themeColors.yellow,
      );
    coreText(
      ctx,
      api,
      'Only j moves; every normalized map probability is recomputed',
      960,
      995,
      30,
      themeColors.muted,
    );
  }
  return;
}
export default {
  id: 'tsne',
  draw: drawTsne,
  cues: [
    'tsne-beat-1-focus-1',
    'tsne-beat-1-focus-2',
    'tsne-beat-2-focus-1',
    'tsne-beat-2-focus-2',
    'tsne-beat-3-focus-1',
  ],
};
