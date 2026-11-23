import { sampleModel } from '../model.mjs';
import { drawCard, legacyEquation, legacyText } from '../defaults.mjs';
export function drawValues(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('values', state),
    { b: currentBeat, q } = modelState;
  {
    legacyText(ctx, api, 'original', 170, 395, 40, themeColors.blue);
    legacyText(ctx, api, 'returned value', 170, 665, 40, themeColors.green);
    [10, 20, 30].forEach((v, i) =>
      api.focus.target('original-array', () =>
        drawCard(ctx, api, v, 670 + i * 340, 330, 260, themeColors.blue, 125, 48),
      ),
    );
    if (modelState.valuesVisible)
      [10, modelState.middleUpdated ? 99 : 20, 30].forEach((v, i) =>
        api.focus.target('returned-array', () =>
          drawCard(
            ctx,
            api,
            i === 1 && !modelState.middleUpdated ? '20 → 99' : v,
            670 + i * 340,
            600,
            260,
            i === 1 && !modelState.middleUpdated ? themeColors.yellow : themeColors.green,
            125,
            48,
          ),
        ),
      );
    if (!currentBeat && q > 0.45 && q < 0.78)
      api.arrow(ctx, 1010, 505, 1010, 575, themeColors.yellow, 4);
    api.focus.target('indexed-update', () =>
      legacyEquation(ctx, api, 'updated=original.at[1].set(99)', 960, 880, 43),
    );
  }
}
export default {
  id: 'values',
  draw: drawValues,
  cues: ['values-b1-1', 'values-b1-2', 'values-b2-1'],
};
