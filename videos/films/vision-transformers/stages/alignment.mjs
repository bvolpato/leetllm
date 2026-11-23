import { alignmentSnapshot } from '../construction.mjs';
import { clip } from '../model.mjs';
import { largeEquation, largeMatrix, largeText } from '../defaults.mjs';
export function drawAlignment(ctx, scene, state, api) {
  {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0),
      F = components.fade;
    {
      const current = alignmentSnapshot(currentBeat, progress, state.cues),
        values = current.values;
      api.focus.target('image-caption-comparison', () =>
        largeMatrix(ctx, api, values, 320, 350, 150, themeColors.cyan),
      );
      largeText(
        ctx,
        api,
        'image rows · caption columns',
        550,
        890,
        28,
        themeColors.muted,
        'center',
      );
      largeText(
        ctx,
        api,
        current.mode === 'scores'
          ? 'scaled similarities'
          : current.mode === 'row'
            ? 'row probabilities'
            : 'column probabilities',
        540,
        285,
        38,
        themeColors.cyan,
        'center',
      );
      largeText(
        ctx,
        api,
        'matching pairs lie on the diagonal',
        1370,
        385,
        36,
        themeColors.yellow,
        'center',
      );
      largeEquation(
        ctx,
        api,
        String.raw`i_1=e_1,\quad i_2=e_2,\quad i_3=e_3`,
        1370,
        465,
        38,
        themeColors.muted,
        'center',
      );
      F(current.objectiveVisible ? 1 : 0, () =>
        api.focus.target('symmetric-contrastive-objective', () =>
          largeEquation(
            ctx,
            api,
            String.raw`L=\tfrac12(L_{I\to T}+L_{T\to I})`,
            1370,
            580,
            48,
            themeColors.ink,
            'center',
          ),
        ),
      );
      F(current.lossVisible ? 1 : 0, () =>
        api.focus.target('image-caption-loss', () =>
          largeText(
            ctx,
            api,
            `symmetric loss ≈ ${clip.toFixed(3)}`,
            1370,
            800,
            40,
            themeColors.green,
            'center',
          ),
        ),
      );
      largeText(
        ctx,
        api,
        'Supplied vectors, three image-text pairs',
        960,
        955,
        36,
        themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'alignment',
  draw: drawAlignment,
  cues: [
    'alignment-image-caption-comparison-b1-1',
    'alignment-symmetric-contrastive-objective-b2-1',
    'alignment-column',
    'alignment-objective',
    'alignment-computed',
    'alignment-image-caption-comparison-b3-1',
  ],
};
