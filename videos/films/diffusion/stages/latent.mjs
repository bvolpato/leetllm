import { opProgress } from '../construction.mjs';
import { forwardValue } from '../arithmetic.mjs';
import { image, imageNoise } from '../model.mjs';
import {
  drawOriginalArrow,
  drawOriginalMath,
  drawOriginalPanel,
  drawOriginalRect,
  drawOriginalSpoken,
  drawOriginalTarget,
  drawOriginalText,
  drawOriginalTile,
  valueColor,
} from '../defaults.mjs';
function paintLatent(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const stage = (index, start = 0.05, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const fade = api.components.fade;
  ctx.save();
  {
    drawOriginalText(ctx, api, 'TRAINING: ENCODE REAL IMAGES', 170, 280, 29, themeColors.muted);
    drawOriginalTile(ctx, api, 170, 345, 165, 1, 'clean');
    drawOriginalArrow(ctx, api, 360, 425, 415, 425, themeColors.cyan);
    drawOriginalTarget(ctx, api, 'latent-training-encoder', () =>
      drawOriginalPanel(
        ctx,
        api,
        440,
        350,
        270,
        160,
        () => {
          drawOriginalText(ctx, api, 'image encoder', 575, 415, 29, themeColors.cyan, 'center');
          drawOriginalText(ctx, api, 'compression', 575, 470, 26, themeColors.muted, 'center');
        },
        themeColors.cyan,
        'latent-encoder',
      ),
    );
    drawOriginalArrow(ctx, api, 735, 425, 790, 425, themeColors.cyan);
    const latentValues = Array.from(
      {
        length: 16,
      },
      (_, i) => image[(Math.floor(i / 4) * 4 + 2) * 16 + (i % 4) * 4 + 2],
    );
    const latentNoise = imageNoise.slice(0, 16);
    const latentGrid = (id, x, y, alpha) =>
      drawOriginalTarget(ctx, api, id, () => {
        for (let i = 0; i < 16; i++)
          drawOriginalRect(
            ctx,
            api,
            x + (i % 4) * 31,
            y + Math.floor(i / 4) * 31,
            29,
            29,
            valueColor(forwardValue(latentValues[i], latentNoise[i], alpha)),
            undefined,
            3,
          );
      });
    latentGrid('latent-clean', 815, 365, 1);
    drawOriginalText(ctx, api, 'clean latent', 875, 550, 26, themeColors.cyan, 'center');
    drawOriginalArrow(ctx, api, 960, 425, 1025, 425, themeColors.yellow);
    latentGrid('latent-corrupted', 1050, 365, 0.3);
    drawOriginalText(ctx, api, 'corrupted', 1110, 550, 26, themeColors.yellow, 'center');
    drawOriginalArrow(ctx, api, 1190, 425, 1250, 425, themeColors.cyan);
    drawOriginalTarget(ctx, api, 'latent-training-denoiser', () =>
      drawOriginalPanel(
        ctx,
        api,
        1275,
        350,
        440,
        160,
        () => {
          drawOriginalText(ctx, api, 'latent denoiser', 1495, 415, 30, themeColors.cyan, 'center');
          drawOriginalText(
            ctx,
            api,
            'known noise → training target',
            1495,
            470,
            24,
            themeColors.yellow,
            'center',
          );
        },
        themeColors.cyan,
        'latent-training-denoiser',
      ),
    );
    drawOriginalText(
      ctx,
      api,
      'GENERATION: START IN LATENT SPACE',
      170,
      635,
      29,
      themeColors.muted,
    );
    const latentProgress = drawOriginalSpoken(ctx, api, 'latent-generation-update', stage(1));
    const latent = drawOriginalTarget(ctx, api, 'latent-generation-loop', () =>
      drawOriginalPanel(
        ctx,
        api,
        170,
        690,
        520,
        200,
        () => {
          drawOriginalText(
            ctx,
            api,
            'seeded latent → state updates',
            430,
            740,
            29,
            themeColors.yellow,
            'center',
          );
          latentGrid('latent-generation-state', 225, 745, latentProgress);
          drawOriginalText(
            ctx,
            api,
            `update ${Math.round(latentProgress * 20)} / 20`,
            505,
            820,
            28,
            themeColors.cyan,
            'center',
          );
        },
        themeColors.yellow,
        'latent-loop',
      ),
    );
    const decoder = api.focus.target(
      'latent-image-decoder-center-final-latent-pixels-center-latent-decoder',
      () =>
        drawOriginalPanel(
          ctx,
          api,
          890,
          705,
          350,
          170,
          () => {
            drawOriginalText(ctx, api, 'image decoder', 1065, 775, 31, themeColors.cyan, 'center');
            drawOriginalText(
              ctx,
              api,
              'final latent → pixels',
              1065,
              835,
              27,
              themeColors.muted,
              'center',
            );
          },
          themeColors.cyan,
          'latent-decoder',
        ),
    );
    api.connect(ctx, latent, decoder, {
      color: themeColors.yellow,
    });
    drawOriginalArrow(ctx, api, 1265, 790, 1370, 790, themeColors.cyan);
    const decoded =
      beat > 1 || (beat === 1 && state.cues?.['latent-generation-decode']?.phase === 'after');
    if (decoded) drawOriginalTile(ctx, api, 1395, 680, 220, 1, 'clean');
    else
      drawOriginalPanel(
        ctx,
        api,
        1395,
        680,
        260,
        220,
        () =>
          drawOriginalText(ctx, api, 'Decode pending', 1525, 800, 25, themeColors.yellow, 'center'),
        themeColors.muted,
        'latent-pending',
      );
    drawOriginalText(ctx, api, 'same sample L0', 1510, 945, 24, themeColors.cyan, 'center');
    drawOriginalText(
      ctx,
      api,
      'schematic representations',
      1590,
      590,
      25,
      themeColors.muted,
      'center',
    );
    drawOriginalTarget(ctx, api, 'latent-compression-count', () =>
      drawOriginalMath(
        ctx,
        api,
        String.raw`\frac{512\times512\times3}{64\times64\times4}=48`,
        955,
        1000,
        39,
      ),
    );
  }
  ctx.restore();
}
export function drawLatent(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  paintLatent(
    ctx,
    scene,
    {
      ...state,
      beatP: p,
    },
    api,
  );
}
export default {
  id: 'latent',
  draw: drawLatent,
  cues: [
    'latent-training-encode',
    'latent-training-corruption',
    'df-latent-0',
    'latent-generation-seed',
    'latent-generation-update',
    'latent-generation-decode',
    'df-latent-1',
    'latent-compression',
    'df-latent-2',
  ],
};
