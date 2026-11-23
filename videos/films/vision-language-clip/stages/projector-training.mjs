import { spokenProgress } from '../construction.mjs';
import { drawClipLine, drawClipRectangle, drawClipText, withClipFocus } from '../defaults.mjs';
export function drawProjectorTraining(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    if (currentBeat === 0) {
      const q = clauseProgress('project-token-width', 0);
      drawClipText(ctx, api, 'A width projection preserves the supplied token count', 960, 290, 38);
      for (let i = 0; i < 24; i++) {
        const x = 240 + i * 60;
        drawClipRectangle(ctx, api, x, 420, 35, 150, themeColors.cyan);
        drawClipRectangle(ctx, api, x, 730, 35, 80 + 90 * q, themeColors.blue);
        if (i % 3 === 0) drawClipLine(ctx, api, x + 17, 590, x + 17, 710, themeColors.muted, 2);
      }
      withClipFocus(ctx, api, 'projector-contract', () => {
        drawClipText(
          ctx,
          api,
          '336 / 14 = 24 · 24² = 576 spatial tokens',
          960,
          360,
          31,
          themeColors.cyan,
        );
        drawClipText(
          ctx,
          api,
          'CLIP feature width → learned connector → language-model width',
          960,
          990,
          30,
          themeColors.yellow,
        );
        drawClipText(
          ctx,
          api,
          'Only 24 token columns drawn; the declared grid contains 576',
          960,
          1045,
          24,
          themeColors.muted,
        );
      });
    } else {
      const q = clauseProgress(
        currentBeat === 1 ? 'projector-stages' : 'training-jobs',
        currentBeat,
      );
      drawClipText(ctx, api, 'Change the trained parameters for the job', 960, 290, 38);
      const names = ['vision tower', 'projector', 'language model'];
      names.forEach((name, i) => {
        const x = 260 + i * 600;
        drawClipText(
          ctx,
          api,
          name,
          x + 180,
          420,
          34,
          [themeColors.cyan, themeColors.yellow, themeColors.blue][i],
        );
        for (let j = 0; j < 18; j++) {
          const train =
            i === 1 ||
            ((currentBeat === 2 || clauseProgress('instruction-stage', 1) > 0.5) && i === 2);
          drawClipRectangle(
            ctx,
            api,
            x + (j % 6) * 53,
            490 + Math.floor(j / 6) * 67,
            36,
            36,
            train
              ? j / 18 < q
                ? [themeColors.cyan, themeColors.yellow, themeColors.blue][i]
                : themeColors.panel
              : themeColors.muted,
          );
        }
        drawClipText(
          ctx,
          api,
          i === 1
            ? 'train connector'
            : i === 2 && clauseProgress('instruction-stage', 1) > 0.5
              ? 'instruction stage: train'
              : 'frozen',
          x + 180,
          820,
          28,
          i === 1 ? themeColors.yellow : themeColors.muted,
        );
      });
      withClipFocus(ctx, api, 'projector-contract', () =>
        drawClipText(
          ctx,
          api,
          currentBeat === 1
            ? 'Original alignment: 595k captions; instruction: 158k generated examples'
            : 'Matching → alignment → instruction behavior → evaluated preference/safety recipe',
          960,
          1010,
          29,
          themeColors.yellow,
        ),
      );
    }
  }
}
export default {
  id: 'projector-training',
  draw: drawProjectorTraining,
  cues: ['project-token-width', 'projector-stages', 'instruction-stage', 'training-jobs'],
};
