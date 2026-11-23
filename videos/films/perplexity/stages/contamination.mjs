import {
  drawExtendedBox,
  drawExtendedLine,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawContamination(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => api.focus.progress(id, cueProgress());
  {
    if (currentBeat === 0) {
      drawExtendedTitle(
        ctx,
        api,
        'Identifier overlap and copied-content overlap are separate checks',
      );
      drawExtendedBox(ctx, api, 'Training: ticket-103', 220, 390, 600, 100, themeColors.blue);
      drawExtendedBox(ctx, api, 'Evaluation: ticket-103', 1100, 390, 600, 100, themeColors.pink);
      drawExtendedLine(ctx, api, 850, 440, 1070, 440, themeColors.pink, 5);
      api.focus.target('copied-record', () => {
        drawExtendedBox(
          ctx,
          api,
          cue('new-copy-id') > 0.5 ? 'Evaluation: ticket-904' : 'New evaluation identity',
          1100,
          720,
          600,
          100,
          themeColors.pink,
        );
        drawExtendedText(
          ctx,
          api,
          'same copied passage',
          960,
          640,
          35,
          themeColors.yellow,
          'center',
        );
      });
      drawExtendedText(
        ctx,
        api,
        'A renamed record can preserve the trained text',
        960,
        1030,
        34,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      drawExtendedTitle(
        ctx,
        api,
        'Manifest deletion occurs after the checkpoint learned the record',
      );
      const q = cue('manifest-delete');
      drawExtendedBox(
        ctx,
        api,
        q > 0.5 ? 'Training manifest: row removed' : 'Training manifest: ticket-103',
        220,
        410,
        650,
        100,
        q > 0.5 ? themeColors.muted : themeColors.blue,
      );
      api.focus.target('trained-state', () => {
        drawExtendedBox(ctx, api, 'Frozen checkpoint', 1160, 410, 500, 100, themeColors.blue);
        drawExtendedBox(
          ctx,
          api,
          'Learned exposure to ticket-103',
          1040,
          690,
          740,
          100,
          themeColors.pink,
        );
      });
      drawExtendedText(
        ctx,
        api,
        q > 0.5
          ? 'Weights unchanged · the old holdout remains exposed'
          : 'Record exposure is already in the checkpoint history',
        960,
        970,
        35,
        themeColors.pink,
        'center',
      );
    } else {
      drawExtendedTitle(ctx, api, 'Stable regression cases + fresh independent source challenges');
      [201, 202].forEach((v, i) =>
        drawExtendedBox(ctx, api, 'Private ' + v, 220 + i * 400, 430, 330, 90, themeColors.blue),
      );
      const count = 1 + Math.floor(cueProgress() * 2.99);
      api.focus.target('source-holdout', () => {
        for (let i = 0; i < count; i++)
          drawExtendedBox(
            ctx,
            api,
            'Fresh source ' + (301 + i),
            240 + i * 530,
            730,
            450,
            90,
            themeColors.green,
          );
      });
      drawExtendedText(
        ctx,
        api,
        'Development feedback selects checkpoints; final test stays separate',
        960,
        1030,
        31,
        themeColors.yellow,
        'center',
      );
    }
    return;
  }
}
export default {
  id: 'contamination',
  draw: drawContamination,
  cues: ['new-copy-id', 'manifest-delete', 'fresh-challenges'],
};
