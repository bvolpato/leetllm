import { uctRows } from '../arithmetic.mjs';
import { cueAmount, cueDone } from '../defaults.mjs';

export function drawUctConstruction(ctx, scene, state, api) {
  const { C } = api;
  const rows = uctRows();
  const meanProgress = cueAmount(state, 'uct-means');
  const bonusProgress = cueAmount(state, 'uct-bonus');
  const showScores = cueDone(state, 'uct-scores');
  const showWinner = cueDone(state, 'uct-winner');
  const winner = rows.reduce((best, row) => (row.score > best.score ? row : best));
  const bestMean = rows.reduce((best, row) => (row.mean > best.mean ? row : best));
  const scale = 395,
    start = 785;
  api.focus.target('formula', () => {
    api.text(ctx, 'Parent visits   10', 145, 270, 37, C.ink);
    if (cueAmount(state, 'uct-rule') > 0) {
      const weight = cueDone(state, 'uct-weight') ? '\\sqrt{2}' : 'c';
      api.math(
        ctx,
        'Q=\\frac{W}{N}\\qquad U=Q+' + weight + '\\sqrt{\\frac{\\ln 10}{N}}',
        1175,
        264,
        46,
        C.ink,
        'center',
      );
    }
  });
  api.focus.target('scores', () => {
    api.text(ctx, 'Simulation', 145, 434, 32, C.muted);
    api.text(ctx, 'Visits', 450, 434, 32, C.muted, 'center');
    api.text(ctx, 'Return sum', 640, 434, 32, C.muted, 'center');
    api.text(ctx, 'Mean return', start, 434, 33, C.blue);
    if (bonusProgress > 0) api.text(ctx, '+ exploration bonus', 1060, 434, 33, C.yellow);
    for (const [i, row] of rows.entries()) {
      const y = 540 + i * 140;
      api.text(ctx, row.id, 145, y + 12, 44, C.ink);
      api.text(ctx, String(row.N), 450, y + 12, 40, C.ink, 'center');
      api.text(ctx, row.W.toFixed(1), 640, y + 12, 40, C.ink, 'center');
      const meanWidth = meanProgress * row.mean * scale;
      if (meanWidth > 0) api.rect(ctx, start, y - 20, meanWidth, 42, C.blue, undefined, 2);
      if (meanProgress === 1) api.text(ctx, row.mean.toFixed(1), start, y + 72, 28, C.blue);
      if (bonusProgress > 0)
        api.rect(
          ctx,
          start + meanWidth,
          y - 20,
          bonusProgress * row.bonus * scale,
          42,
          C.yellow,
          undefined,
          2,
        );
      if (showScores)
        api.text(ctx, row.score.toFixed(3), start + row.score * scale + 18, y + 11, 34, C.ink);
    }
    let caption = 'Which branch has the highest average return?';
    if (cueDone(state, 'uct-best-mean')) caption = 'Highest average   /   ' + bestMean.id;
    if (cueAmount(state, 'uct-choice') > 0) caption = 'Which branch gets the next simulation?';
    if (showWinner) caption = 'Next simulation   /   ' + winner.id;
    if (!cueAmount(state, 'uct-unvisited'))
      api.text(ctx, caption, 960, 985, 39, showWinner ? C.green : C.ink, 'center');
  });
  api.focus.target('unvisited', () => {
    if (cueAmount(state, 'uct-unvisited') > 0)
      api.text(
        ctx,
        'Eligible unvisited child   /   0 visits, infinite selection score',
        960,
        985,
        35,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'uct-construction',
  draw: drawUctConstruction,
  cues: [
    'uct-means',
    'uct-first-question',
    'uct-best-mean',
    'uct-rule',
    'uct-weight',
    'uct-bonus',
    'uct-scores',
    'uct-choice',
    'uct-winner',
    'uct-unvisited',
  ],
};
