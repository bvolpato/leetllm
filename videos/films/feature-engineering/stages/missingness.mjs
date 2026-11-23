import { featureFrame } from '../model.mjs';
import {
  drawFeatureConstructionArrow,
  drawFeatureConstructionBox,
  drawFeatureConstructionHead,
  drawFeatureConstructionNote,
  drawFeatureConstructionStage,
  drawFeatureConstructionText,
} from '../defaults.mjs';
export function drawMissingness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = featureFrame(state),
    currentBeat = f.b,
    progress = f.p;
  drawFeatureConstructionStage(ctx, api, 'missingness-operation', () => {
    drawFeatureConstructionHead(ctx, api, 'One numeric zero can hide two measurement states');
    for (let i = 0; i < 2; i++) {
      const x = 400 + i * 1000;
      drawFeatureConstructionText(
        ctx,
        api,
        i ? 'no backlog reading' : 'measured empty queue',
        x,
        390,
        34,
        i ? themeColors.pink : themeColors.cyan,
        'center',
      );
      api.rect(
        ctx,
        x - 230,
        450,
        460,
        170,
        themeColors.panel,
        i ? themeColors.pink : themeColors.cyan,
        3,
      );
      drawFeatureConstructionText(
        ctx,
        api,
        i ? '?' : '0 jobs',
        x,
        550,
        48,
        i ? themeColors.pink : themeColors.cyan,
        'center',
      );
      drawFeatureConstructionArrow(
        ctx,
        api,
        x,
        650,
        x,
        730,
        i ? themeColors.pink : themeColors.cyan,
      );
      drawFeatureConstructionBox(
        ctx,
        api,
        i ? 'imputed backlog   0' : 'measured backlog   0',
        x,
        790,
        500,
        80,
        i ? themeColors.yellow : themeColors.cyan,
      );
      if (f.started('missingness-beat-2-focus-2', 1))
        drawFeatureConstructionBox(
          ctx,
          api,
          '[backlog, missing]   [0, ' + i + ']',
          x,
          910,
          500,
          75,
          i ? themeColors.pink : themeColors.green,
        );
    }
    drawFeatureConstructionNote(
      ctx,
      api,
      currentBeat >= 1 ? 'The second coordinate records whether the reading was missing.' : 'Both paths deliver the same numeric backlog.',
    );
  });
}
export default {
  id: 'missingness',
  draw: drawMissingness,
  cues: [
    'missingness-beat-1-focus-1',
    'missingness-beat-2-focus-1',
    'missingness-beat-2-focus-2',
    'missingness-beat-3-focus-1',
    'missingness-beat-3-focus-2',
  ],
};
