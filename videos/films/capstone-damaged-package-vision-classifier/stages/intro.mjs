import { photos } from '../fixtures.mjs';
import { route } from '../arithmetic.mjs';
import { sampleModel, visionFrame } from '../model.mjs';
import { originalPhoto, originalText } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const modelState = visionFrame('intro', state);
  let wrapped = api;
  const originalState = {
    ...state,
    visionScene: 'intro',
  };
  const { C: themeColors } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    originalText(
      ctx,
      wrapped,
      'Which evidence can the specialist inspect?',
      960,
      280,
      39,
      themeColors.ink,
      'center',
    );
    photos.forEach((r, i) => {
      const x = 180 + i * 560;
      wrapped.focus.target('photo-cases', () =>
        wrapped.focus.target(i === 0 ? 'dark-photo' : i === 1 ? 'clear-photo' : 'empty-photo', () =>
          originalPhoto(ctx, wrapped, x, 390, 440, {
            dark: i === 0,
            empty: i === 2,
          }),
        ),
      );
      wrapped.focus.target('damage-scores', () =>
        originalText(
          ctx,
          wrapped,
          r.id + ' · damage ' + r.damage,
          x + 220,
          755,
          30,
          themeColors.yellow,
          'center',
        ),
      );
      if (originalModelState.b)
        wrapped.focus.target('case-routes', () =>
          originalText(
            ctx,
            wrapped,
            route(r),
            x + 220,
            850,
            30,
            i === 1 ? themeColors.green : themeColors.pink,
            'center',
          ),
        );
    });
    originalText(
      ctx,
      wrapped,
      'Schematic views and supplied scores · a real image model is not run here',
      960,
      990,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-b1-1', 'intro-b1-2', 'intro-b1-3', 'intro-b2-1', 'intro-b2-2'],
};
