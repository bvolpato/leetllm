import { completed, opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionFocus,
  drawConstructionFooter,
  drawConstructionRows,
  drawConstructionText,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawLatentContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'latent-contract'),
    done = (name) => completed(state, name),
    result = (fn) => drawConstructionFocus(ctx, api, 'df-latent-contract-result', fn);
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Decode the final state with the matching scale'
        : currentBeat === 1
          ? 'Count scalar values and spatial sites separately'
          : 'Test the same image through encode and decode first',
    );
    if (currentBeat === 0) {
      const labels = [
        'Random latent',
        'Denoiser epsilon',
        'Sampler state update',
        'Final latent',
        'Image decoder',
      ];
      labels.forEach((v, i) => {
        drawConstructionBox(
          ctx,
          api,
          v,
          150 + i * 350,
          470,
          300,
          i === 1 ? themeColors.pink : themeColors.cyan,
          120,
          27,
        );
        if (i < 4) drawConstructionArrow(ctx, api, 465 + i * 350, 530, 485 + i * 350, 530);
      });
      drawConstructionFooter(
        ctx,
        api,
        'Epsilon is an update ingredient · do not send it directly to the image decoder',
      );
    } else if (currentBeat === 1)
      result(() => {
        drawConstructionRows(
          ctx,
          api,
          [
            ['Pixel shape', '512 × 512 × 3 = 786,432'],
            ['Latent shape', '64 × 64 × 4 = 16,384'],
            ['Ratio', done('latent-ratio') ? '48 scalar / 64 spatial' : 'pending'],
          ],
          390,
          175,
        );
        drawConstructionFooter(
          ctx,
          api,
          'Continuous pre-quantization diffusion state · optional VQ inside decoder · no speed measurement',
        );
      });
    else {
      drawConstructionBox(ctx, api, 'Same real image', 170, 430, 450, themeColors.blue, 110, 31);
      drawConstructionBox(ctx, api, 'Encode + decode', 740, 430, 450, themeColors.cyan, 110, 31);
      drawConstructionBox(
        ctx,
        api,
        'Text already damaged',
        1310,
        430,
        450,
        themeColors.pink,
        110,
        31,
      );
      drawConstructionArrow(ctx, api, 650, 485, 710, 485);
      drawConstructionArrow(ctx, api, 1220, 485, 1280, 485);
      drawConstructionText(
        ctx,
        api,
        'More denoising steps cannot demonstrate retained VAE information',
        960,
        820,
        33,
        themeColors.yellow,
        'center',
      );
    }
    return;
  }
}
export default {
  id: 'latent-contract',
  draw: drawLatentContract,
  cues: ['df-latent-contract-0', 'df-latent-contract-1', 'df-latent-ratio', 'df-latent-contract-2'],
};
