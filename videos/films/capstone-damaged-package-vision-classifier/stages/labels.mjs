import { sampleModel, visionFrame } from '../model.mjs';
import { originalPhoto, originalText } from '../defaults.mjs';
export function drawLabels(ctx, scene, state, api) {
  const modelState = visionFrame('labels', state);
  let wrapped = api;
  const originalState = {
    ...state,
    visionScene: 'labels',
  };
  const { C: themeColors, components: components } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    wrapped.focus.target('external-photo', () => originalPhoto(ctx, wrapped, 560, 350, 800));
    originalText(ctx, wrapped, 'Visible torn seam', 150, 470, 31, themeColors.pink);
    wrapped.focus.target('visible-seam', () =>
      wrapped.arrow(ctx, 440, 490, 720, 540, themeColors.pink, 4),
    );
    wrapped.focus.target('hidden-contents', () =>
      originalText(ctx, wrapped, 'Contents hidden', 1420, 500, 31, themeColors.muted),
    );
    originalText(
      ctx,
      wrapped,
      'External packaging damage',
      960,
      900,
      35,
      themeColors.yellow,
      'center',
    );
    if (originalModelState.b) {
      ['Another photo', 'Ordinary review', 'Priority inspection'].forEach((label, i) =>
        wrapped.focus.target('review-actions', () =>
          components.card({
            label,
            x: 1410,
            y: 610 + i * 112,
            width: 360,
            height: 88,
            fontSize: 25,
            padding: 12,
            fill: themeColors.panel,
            stroke: i === 2 ? themeColors.yellow : themeColors.cyan,
            textColor: i === 2 ? themeColors.yellow : themeColors.cyan,
          }),
        ),
      );
    }
    wrapped.focus.target('label-state', () =>
      originalText(
        ctx,
        wrapped,
        'Unknown and unusable labels keep their own state',
        960,
        990,
        29,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'labels',
  draw: drawLabels,
  cues: ['labels-b1-1', 'labels-b1-2', 'labels-b1-3', 'labels-b2-1', 'labels-b2-2'],
};
