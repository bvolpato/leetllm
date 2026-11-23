import { visionFrame } from '../model.mjs';
import { visionCard, visionNote, visionText, visionValue } from '../defaults.mjs';
export function drawMaskedCategories(ctx, scene, state, api) {
  const frameState = visionFrame('masked-categories', state);
  return api.focus.target('dv-masked-categories-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const m = frameState.masked,
        names = ['Torn seam', 'Crushed corner', 'Third category'];
      names.forEach((name, i) => {
        const x = 160 + i * 550;
        visionCard(ctx, api, name, x, 310, 500, 85, i === 2 ? themeColors.muted : themeColors.blue);
        visionValue(ctx, api, 'Supplied logit', m.logits[i], x + 35, 460, true, themeColors.blue);
        visionValue(
          ctx,
          api,
          'Target',
          m.targets[i] ?? 'unknown',
          x + 35,
          620,
          true,
          i === 2 ? themeColors.muted : themeColors.yellow,
        );
        if (currentBeat >= 1)
          visionCard(
            ctx,
            api,
            'Mask ' + m.mask[i],
            x + 260,
            600,
            200,
            90,
            i === 2 ? themeColors.muted : themeColors.cyan,
          );
        if (currentBeat >= 2)
          visionValue(
            ctx,
            api,
            'Observed loss',
            i === 2 ? 'excluded' : m.losses[i].toFixed(4),
            x + 35,
            800,
            resultComplete('masked-losses', 2),
            i === 2 ? themeColors.muted : themeColors.pink,
          );
        if (currentBeat === 3)
          visionText(
            ctx,
            api,
            resultComplete('masked-gradients', 3)
              ? 'Gradient ' + m.gradients[i].toFixed(4)
              : 'Gradient pending',
            x + 250,
            920,
            31,
            i === 2 ? themeColors.muted : themeColors.cyan,
            'center',
          );
      });
      if (currentBeat === 1 && resultComplete('mask-reduction', 1))
        visionText(
          ctx,
          api,
          'Sum observed losses / 2 observed entries · skip an empty mask',
          960,
          912,
          32,
          themeColors.ink,
          'center',
        );
      if (currentBeat === 2 && resultComplete('masked-mean', 2))
        visionText(
          ctx,
          api,
          '(.6931 + 2.1269) / 2 = ' + m.mean.toFixed(4),
          960,
          922,
          35,
          themeColors.yellow,
          'center',
        );
      visionNote(
        ctx,
        api,
        'Independent sigmoid outputs permit co-occurring defects. Unknown is excluded, never silently relabeled negative.',
      );
    }
  });
}
export default {
  id: 'masked-categories',
  draw: drawMaskedCategories,
  cues: [
    'dv-masked-categories-0',
    'dv-masked-categories-operation-0',
    'dv-masked-categories-1',
    'dv-masked-categories-operation-1',
    'dv-mask-reduction',
    'dv-masked-categories-2',
    'dv-masked-categories-operation-2',
    'dv-masked-losses',
    'dv-masked-mean',
    'dv-masked-categories-3',
    'dv-masked-categories-operation-3',
    'dv-masked-gradients',
  ],
};
