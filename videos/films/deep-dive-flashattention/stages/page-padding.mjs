import { gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionEquation,
  drawExtensionFooter,
  drawExtensionRectangle,
  drawExtensionText,
} from '../defaults.mjs';
export function drawPagePadding(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('page-padding', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      const y = 400,
        h = 435,
        w = 360;
      drawExtensionText(
        ctx,
        api,
        'Whole-page loader contract · used keys 270',
        960,
        300,
        35,
        themeColors.yellow,
        'center',
      );
      for (let page = 0; page < 3; page++) {
        const x = 260 + page * 550;
        drawExtensionRectangle(
          ctx,
          api,
          x,
          y,
          w,
          h,
          page === 2 ? themeColors.muted : themeColors.blue,
        );
        const used = page === 0 ? 256 : page === 1 ? 14 : 0,
          usedH = (h * used) / 256;
        if (used)
          api.rect(
            ctx,
            x + 3,
            y + 3,
            w - 6,
            Math.max(0.01, usedH - 3),
            themeColors.blue,
            undefined,
            0,
          );
        if (page === 1)
          api.rect(
            ctx,
            x + 3,
            y + usedH,
            w - 6,
            h - usedH - 3,
            modelState.finite ? themeColors.green : themeColors.pink,
            undefined,
            0,
          );
        drawExtensionText(
          ctx,
          api,
          'page' + page,
          x + w / 2,
          895,
          29,
          page === 2 ? themeColors.muted : themeColors.blue,
          'center',
        );
        drawExtensionText(
          ctx,
          api,
          page === 0 ? '256 used' : page === 1 ? '14 used +242 loaded pad' : 'not loaded',
          x + w / 2,
          960,
          27,
          page === 2 ? themeColors.muted : themeColors.ink,
          'center',
        );
      }
      if (currentBeat === 0) {
        drawExtensionEquation(
          ctx,
          api,
          modelState.contaminated
            ? String.raw`0\cdot\mathrm{NaN}=\mathrm{NaN}`
            : String.raw`0\cdot\mathrm{NaN}=?`,
          960,
          1040,
          32,
          themeColors.pink,
        );
      } else
        drawExtensionFooter(
          ctx,
          api,
          modelState.finite
            ? 'Finite loaded padding repairs the value accumulator; untouched reserve is separate'
            : 'Repair the loaded final-page padding',
        );
    }
  });
}
export default {
  id: 'page-padding',
  draw: drawPagePadding,
  cues: [
    'fa-page-padding-0',
    'fa-padding-nan',
    'fa-page-padding-1',
    'fa-padding-finite',
    'fa-page-padding-2',
  ],
};
