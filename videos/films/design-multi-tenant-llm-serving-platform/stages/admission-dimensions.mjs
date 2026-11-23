import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawAdmissionDimensions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('admission-dimensions', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'admission-dimensions', () => {
    if (currentBeat === 0)
      modelState.limits.forEach(([key, unit], i) => {
        const x = 150 + (i % 3) * 580,
          y = 350 + Math.floor(i / 3) * 230;
        drawConstructionBox(
          ctx,
          api,
          key,
          x,
          y,
          520,
          130,
          [themeColors.blue, themeColors.cyan, themeColors.yellow][i % 3],
          31,
        );
        drawConstructionCenter(ctx, api, unit, x + 260, y + 185, 28, themeColors.muted);
      });
    else {
      drawConstructionBox(
        ctx,
        api,
        'Same request: permission, rate, quota and concurrency pass',
        180,
        285,
        1560,
        95,
        themeColors.cyan,
        30,
      );
      drawConstructionCenter(ctx, api, 'Worker pages available', 500, 455, 33, themeColors.ink);
      for (let j = 0; j < 5; j++) {
        const available = j < modelState.availablePages;
        drawConstructionBox(
          ctx,
          api,
          'P' + j,
          200 + j * 230,
          530,
          180,
          140,
          available ? themeColors.cyan : themeColors.muted,
          34,
        );
        if (!available)
          drawConstructionCenter(
            ctx,
            api,
            'not available',
            290 + j * 230,
            720,
            24,
            themeColors.muted,
          );
      }
      drawConstructionBox(ctx, api, 'Needs 5 pages', 1400, 530, 370, 140, themeColors.yellow, 34);
      if (modelState.checked)
        drawConstructionCenter(
          ctx,
          api,
          modelState.memoryPass
            ? 'Five available: memory condition passes'
            : 'Only four available: WAIT or choose another eligible worker',
          960,
          805,
          33,
          modelState.memoryPass ? themeColors.green : themeColors.pink,
        );
      if (currentBeat === 2) {
        drawConstructionBox(
          ctx,
          api,
          'Assembled prompt + output ceiling',
          360,
          905,
          1200,
          85,
          themeColors.yellow,
          30,
        );
      }
    }
    drawConstructionFoot(
      ctx,
      api,
      'Each reservoir has its own unit; a spare quota unit is not a free physical page',
    );
  });
}
export default {
  id: 'admission-dimensions',
  draw: drawAdmissionDimensions,
  cues: [
    'mt-admission-dimensions-b0',
    'mt-admission-dimensions-b1',
    'mt-admission-dimensions-s1-0',
    'mt-admission-dimensions-s1-1',
    'mt-admission-dimensions-s1-2',
    'mt-admission-dimensions-b2',
    'mt-admission-dimensions-s2-0',
  ],
};
