import { ACTUALS, PREDICTIONS, RESIDUALS } from '../fixtures.mjs';
import { clamp } from '../construction.mjs';
import { calibrationScoresState } from '../model.mjs';
import { caption, dot, line, text } from '../defaults.mjs';
export function drawScores(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const paint = () => {
    const cur = calibrationScoresState(currentBeat, progress),
      x = (v) => 400 + v * 10;
    text(ctx, api, 'request', 180, 305, 25, themeColors.muted);
    text(ctx, api, 'prediction → observation', 850, 305, 29, themeColors.muted, 'center');
    text(ctx, api, 'absolute residual', 1630, 305, 28, themeColors.cyan, 'center');
    for (let i = 0; i < 9; i++) {
      const y = 350 + i * 69;
      text(ctx, api, 'C' + (i + 1), 180, y + 9, 27, themeColors.muted);
      if (i >= cur.visibleCount) continue;
      const px = x(PREDICTIONS[i]),
        ox = x(ACTUALS[i]);
      line(ctx, api, px, y, ox, y, themeColors.cyan, 7);
      dot(ctx, api, px, y, themeColors.yellow, 9);
      dot(ctx, api, ox, y, themeColors.cyan, 9);
      text(ctx, api, PREDICTIONS[i], px, y - 19, 22, themeColors.yellow, 'center');
      text(ctx, api, ACTUALS[i], ox, y + 29, 22, themeColors.cyan, 'center');
      if (currentBeat >= 1 || i < cur.visibleCount - 1)
        text(
          ctx,
          api,
          `|${ACTUALS[i]} − ${PREDICTIONS[i]}| = ${RESIDUALS[i]} ms`,
          1500,
          y + 9,
          25,
          themeColors.ink,
        );
    }
    caption(
      ctx,
      api,
      currentBeat === 2
        ? 'Fixed absolute score ⇒ one common radius; normalized scores need separate calibration.'
        : 'Keep prediction, outcome and residual attached to the same request.',
    );
  };
  if (api.focus) api.focus.target(`${'scores'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'scores',
  draw: drawScores,
  cues: ['scores-b1', 'scores-b2', 'scores-b3'],
};
