import { opProgress } from '../construction.mjs';
import { scalarReverseTrace } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFocus,
  drawConstructionGrid,
  drawConstructionText,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawReproducibility(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'reproducibility');
  {
    const r = scalarReverseTrace();
    drawConstructionTitle(
      ctx,
      api,
      'Save state and generator position, then replay the next actual row',
    );
    drawConstructionFocus(ctx, api, 'reproducibility-center-recipe-i', () =>
      drawConstructionGrid(
        ctx,
        api,
        [['Recipe', 'Seed', 'Model / encoders', 'Sampler / guidance', 'Environment']],
        170,
        370,
        1580,
        100,
        themeColors.blue,
        27,
      ),
    );
    drawConstructionFocus(ctx, api, 'reproducibility-resume', () => {
      if (currentBeat < 1) return;
      const showRestore = currentBeat > 1 || progress >= 0.12;
      const showReset = currentBeat > 1 || progress >= 0.48;
      drawConstructionBox(
        ctx,
        api,
        'Same saved latent ' + r.saved.toFixed(6) + ' · next step 1',
        350,
        570,
        1220,
        themeColors.cyan,
        110,
        32,
      );
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Restart choice', 'Next draw', 'Next state'],
          showRestore ? ['Restore RNG state', 'Draw 2: ' + r.rows[1].draw.toFixed(6), r.restoredNext.toFixed(6)] : ['', '', ''],
          showReset ? ['Reset original seed', 'Draw 1: ' + r.rows[0].draw.toFixed(6), r.resetNext.toFixed(6)] : ['', '', ''],
        ],
        230,
        745,
        1460,
        240,
        themeColors.cyan,
        29,
      );
    });
    drawConstructionFocus(ctx, api, 'reproducibility-review', () => {
      if (currentBeat === 2)
        drawConstructionText(
          ctx,
          api,
          'Review exact final bytes · retain content label and provenance',
          960,
          1015,
          27,
          themeColors.green,
          'center',
        );
    });
    return;
  }
}
export default {
  id: 'reproducibility',
  draw: drawReproducibility,
  cues: [
    'reproducibility-beat-1-focus-1',
    'df-reproducibility-0',
    'reproducibility-resume',
    'df-reproducibility-1',
    'reproducibility-review',
    'df-reproducibility-2',
  ],
};
