import { p, z } from '../fixtures.mjs';
import { phraseProgress, phraseStarted } from '../clock.mjs';
import { drawScoreOptions, rowY, shareBar } from '../score-rows.mjs';

export function drawSoftmax(ctx, scene, state, api) {
  const { C } = api;
  const weights = z.map(Math.exp);
  const total = weights.reduce((sum, value) => sum + value, 0);
  const showWeights = phraseStarted(state, 'exp-scores', 0, 0.28);
  const showTotal = phraseStarted(state, 'sum-weights', 0, 0.5);
  const sum = phraseProgress(state, api, 'sum-weights', 0, 0.5, 0.6);
  const deal = phraseProgress(state, api, 'deal-shares', 1, 0.04, 0.26);
  drawScoreOptions(ctx, api);
  api.text(ctx, 'Score', 722, 285, 35, C.muted, 'center');
  api.text(ctx, 'Weight', 999, 285, 35, C.muted, 'center');
  api.text(ctx, 'Share of the total', 1250, 285, 35, C.muted);
  z.forEach((score, i) => {
    const y = rowY(i);
    api.text(ctx, String(score), 722, y, 55, C.ink, 'center');
    api.focus.target('weights', () => {
      api.text(
        ctx,
        showWeights ? weights[i].toFixed(2) : '·',
        999,
        y,
        51,
        showWeights ? C.ink : C.muted,
        'center',
      );
    });
    api.focus.target('probability', () => {
      const color = i === 1 ? C.cyan : C.blue;
      shareBar(ctx, api, 1250, y, 330, p[i], { visible: deal, color });
      api.text(ctx, deal === 1 ? p[i].toFixed(3) : '·', 1800, y, 46, color, 'right');
    });
  });
  api.line(ctx, 110, 850, 1805, 850, C.muted, 2);
  api.focus.target('total', () => {
    const terms = weights.slice(0, Math.min(weights.length, 1 + Math.floor(sum * weights.length)));
    const formula =
      terms.map((v) => v.toFixed(2)).join(' + ') + (sum === 1 ? ' ≈ ' + total.toFixed(2) : '');
    api.text(
      ctx,
      showTotal ? 'Total weight   ' + formula : 'Supplied scores   /   temperature 1',
      110,
      949,
      43,
      C.yellow,
    );
  });
}
export default {
  id: 'softmax',
  draw: drawSoftmax,
  cues: ['exp-scores', 'sum-weights', 'largest-share', 'deal-shares', 'wrong-winner'],
};
