import { foldScores } from '../fixtures.mjs';
import { foldFrame } from '../model.mjs';
import { equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawFolds(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const F = api.components.fade;
  {
    const frame = foldFrame(state),
      active = frame.active;
    for (let col = 0; col < 5; col++)
      text(ctx, api, `cohort ${col + 1}`, 437 + col * 275, 260, 26, themeColors.ink, 'center');
    optionalFocusTarget(ctx, api, 'folds-simulation-15', () => {
      for (let row = 0; row < 5; row++) {
        text(ctx, api, `fit ${row + 1}`, 155, 350 + row * 105, 30, themeColors.muted);
        for (let col = 0; col < 5; col++)
          api.components.card({
            label: col === row ? 'held out' : 'train',
            x: 320 + col * 275,
            y: 290 + row * 105,
            width: 235,
            height: 85,
            fill: themeColors.panel,
            stroke: col === row ? themeColors.pink : themeColors.blue,
            textColor: col === row ? themeColors.pink : themeColors.blue,
            fontSize: 30,
            padding: 12,
            opacity: active === row || row < frame.completed ? 0.9 : 0.22,
          });
        if (row < frame.completed)
          text(
            ctx,
            api,
            foldScores[row].toFixed(2),
            1775,
            345 + row * 105,
            29,
            row === frame.completed - 1 ? themeColors.yellow : themeColors.muted,
            'center',
          );
      }
    });
    if (frame.completed < 5) {
      api.rect(ctx, 320, 390 + active * 105, 1335 * frame.fitProgress, 5, themeColors.yellow);
      text(
        ctx,
        api,
        `Fresh pipeline for fit ${active + 1} · ${frame.completed} scores measured`,
        960,
        910,
        36,
        themeColors.yellow,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'Five fresh fits · each cohort held out once',
        960,
        910,
        36,
        themeColors.yellow,
        'center',
      );
      equation(ctx, api, '\\overline{F_1}\\approx0.71', 960, 1000, 44, themeColors.ink, 'center');
    }
  }
}
export default {
  id: 'folds',
  draw: drawFolds,
  cues: ['folds-beat-1-focus-1', 'folds-beat-2-focus-1', 'folds-beat-3-focus-1'],
};
