import { E, patches } from '../fixtures.mjs';
import { projectionSnapshot } from '../construction.mjs';
import { embedded } from '../model.mjs';
import { largeMatrix, largeText } from '../defaults.mjs';
export function drawProjection(ctx, scene, state, api) {
  {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0),
      phaseForBeat = (i) =>
        currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.12, 0.88),
      F = components.fade;
    {
      const current = projectionSnapshot(currentBeat, progress, state.cues);
      api.focus.target('flattened-first-patch', () =>
        largeMatrix(ctx, api, [patches[0]], 200, 370, 130, themeColors.cyan),
      );
      api.focus.target('shared-patch-projection', () =>
        largeMatrix(ctx, api, E, 850, 350, 110, themeColors.yellow),
      );
      api.focus.target('patch-column-products', () =>
        largeMatrix(
          ctx,
          api,
          current.products.map((row, i) => (i < current.count ? row : ['·', '·'])),
          1300,
          350,
          110,
          themeColors.pink,
        ),
      );
      if (currentBeat > 0) {
        largeText(
          ctx,
          api,
          current.count === 4 ? 'projected vector' : `accumulated ${current.count} / 4 inputs`,
          1510,
          865,
          28,
          themeColors.muted,
          'center',
        );
        api.focus.target('projected-patch-result', () =>
          largeText(
            ctx,
            api,
            `[${current.partial.map((v) => v.toFixed(2)).join(', ')}]`,
            1510,
            930,
            45,
            themeColors.green,
            'center',
          ),
        );
      }
      largeText(ctx, api, 'patch row', 450, 300, 38, themeColors.cyan, 'center');
      largeText(ctx, api, 'shared projection', 960, 285, 36, themeColors.yellow, 'center');
      largeText(ctx, api, 'mean      contrast', 1415, 285, 32, themeColors.pink, 'center');
      if (currentBeat === 2) {
        const q = phaseForBeat(2);
        largeText(
          ctx,
          api,
          `all four averages: ${embedded
            .slice(0, Math.max(1, Math.ceil(q * 4)))
            .map((v) => v[0].toFixed(1))
            .join('   ')}`,
          600,
          930,
          36,
          themeColors.green,
          'center',
        );
      }
    }
  }
}
export default {
  id: 'projection',
  draw: drawProjection,
  cues: [
    'projection-shared-patch-projection-b1-1',
    'projection-patch-column-products-b2-1',
    'projection-one',
    'projection-four',
    'projection-five',
    'projection-projected-patch-result-b3-1',
  ],
};
