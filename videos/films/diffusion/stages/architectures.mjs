import { opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionRoute,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawArchitectures(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'architectures');
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'U-Net carries matching-resolution skip features'
        : currentBeat === 1
          ? 'Patchify → repeated transformer backbone → unpatchify'
          : 'MM-DiT uses separate weights and joint attention',
    );
    if (currentBeat === 0) {
      const xs = [180, 580, 980, 1380],
        ys = [390, 530, 670, 530];
      ['Down', 'Down', 'Bottleneck', 'Up + skip'].forEach((v, i) => {
        drawConstructionBox(ctx, api, v, xs[i], ys[i], 350, themeColors.blue, 105, 29);
        if (i) {
          const from = xs[i - 1] + 365,
            to = xs[i] - 15,
            mid = (from + to) / 2;
          drawConstructionRoute(
            ctx,
            api,
            [
              {
                x: from,
                y: ys[i - 1] + 52.5,
              },
              {
                x: mid,
                y: ys[i - 1] + 52.5,
              },
              {
                x: mid,
                y: ys[i] + 52.5,
              },
              {
                x: to,
                y: ys[i] + 52.5,
              },
            ],
            progress,
          );
        }
      });
      drawConstructionRoute(
        ctx,
        api,
        [
          {
            x: 355,
            y: 370,
          },
          {
            x: 355,
            y: 335,
          },
          {
            x: 1555,
            y: 335,
          },
          {
            x: 1555,
            y: 510,
          },
        ],
        progress,
        themeColors.pink,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Shared backbone reused at each noise level · spatial skip is not a sampler step',
      );
    } else if (currentBeat === 1) {
      drawConstructionGrid(
        ctx,
        api,
        [['Image / latent patch', 'P0', 'P1', 'P2', 'P3']],
        220,
        390,
        1480,
        100,
        themeColors.blue,
        28,
      );
      drawConstructionBox(
        ctx,
        api,
        'Transformer blocks · same weights at every timestep',
        300,
        620,
        1320,
        themeColors.cyan,
        130,
        33,
      );
      drawConstructionArrow(ctx, api, 960, 515, 960, 590);
      drawConstructionArrow(ctx, api, 960, 770, 960, 825);
      drawConstructionGrid(
        ctx,
        api,
        [['Prediction layout', 'P0', 'P1', 'P2', 'P3']],
        220,
        850,
        1480,
        85,
        themeColors.pink,
        27,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Original DiT: class-conditioned ImageNet scope · smaller patches mean more tokens',
      );
    } else {
      drawConstructionBox(
        ctx,
        api,
        'Image tokens · image weights',
        170,
        410,
        700,
        themeColors.blue,
        110,
        31,
      );
      drawConstructionBox(
        ctx,
        api,
        'Text tokens · text weights',
        1050,
        410,
        700,
        themeColors.pink,
        110,
        31,
      );
      drawConstructionBox(
        ctx,
        api,
        'Joint attention denominator',
        520,
        760,
        880,
        themeColors.cyan,
        120,
        35,
      );
      drawConstructionArrow(ctx, api, 520, 550, 760, 725, themeColors.blue);
      drawConstructionArrow(ctx, api, 1400, 550, 1160, 725, themeColors.pink);
      drawConstructionFooter(
        ctx,
        api,
        'SD3: rectified-flow training · selected VAE has 16 channels · no automatic speed claim',
      );
    }
    return;
  }
}
export default {
  id: 'architectures',
  draw: drawArchitectures,
  cues: ['df-architectures-0', 'df-architectures-1', 'df-architectures-2'],
};
