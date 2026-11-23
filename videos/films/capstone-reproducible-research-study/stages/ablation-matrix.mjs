import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionResult,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawAblationMatrix(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('ablation-matrix', state),
    currentBeat = modelState.b;
  api.focus.target('rs-ablation-matrix-mechanism', () => {
    drawResearchConstructionHeader(ctx, api, 'A named change has a named evidence role');
    const rows = [
      ['E0', 'Φ=0', 'exact harness control'],
      ['E1', 'distance Φ', 'primary training comparison'],
      ['E2', 'same saved outcomes', 'independent-index sensitivity'],
      ['E3', 'reverse Φ sign', 'exploratory stress test'],
    ];
    rows.forEach((r, i) => {
      const y = 370 + i * 125,
        show = i < 2 || currentBeat >= 1;
      drawResearchConstructionText(ctx, api, r[0], 230, y + 35, 38, themeColors.yellow);
      drawResearchConstructionBox(
        ctx,
        api,
        r[1],
        390,
        y,
        540,
        85,
        show ? themeColors.cyan : themeColors.muted,
        30,
      );
      drawResearchConstructionArrow(
        ctx,
        api,
        960,
        y + 43,
        1120,
        y + 43,
        show ? themeColors.cyan : themeColors.muted,
      );
      drawResearchConstructionText(
        ctx,
        api,
        show ? r[2] : 'pending role',
        1170,
        y + 52,
        29,
        show ? themeColors.ink : themeColors.muted,
      );
    });
    if (currentBeat >= 2)
      drawResearchConstructionResult(
        ctx,
        api,
        'An unplanned best row cannot replace the locked primary comparison',
        themeColors.yellow,
        945,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      'E2 resamples completed rows; it does not create another training run',
    );
  });
}
export default {
  id: 'ablation-matrix',
  draw: drawAblationMatrix,
  cues: [
    'rs-ablation-matrix-0',
    'rsx-ablation-matrix-b0-s0',
    'rsx-ablation-matrix-b0-s1',
    'rsx-ablation-matrix-b0-s2',
    'rs-ablation-matrix-1',
    'rsx-ablation-matrix-b1-s0',
    'rsx-ablation-matrix-b1-s1',
    'rsx-ablation-matrix-b1-s2',
    'rs-ablation-matrix-2',
    'rsx-ablation-matrix-b2-s0',
    'rsx-ablation-matrix-b2-s1',
    'rsx-ablation-matrix-b2-s2',
  ],
};
