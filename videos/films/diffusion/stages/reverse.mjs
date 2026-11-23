import { opProgress } from '../construction.mjs';
import { reverseSampleProgress } from '../construction.mjs';
import {
  drawOriginalArrow,
  drawOriginalCircle,
  drawOriginalMath,
  drawOriginalPanel,
  drawOriginalRect,
  drawOriginalSpoken,
  drawOriginalTarget,
  drawOriginalText,
  drawOriginalTile,
} from '../defaults.mjs';
function paintReverse(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const fade = api.components.fade;
  ctx.save();
  {
    const cycle = reverseSampleProgress(beat, progress);
    const alpha = api.lerp(0.001, 0.97, cycle);
    api.focus.target('reverse-reverse-tile', () =>
      drawOriginalTile(ctx, api, 170, 385, 315, alpha),
    );
    drawOriginalText(
      ctx,
      api,
      beat ? 'RETAINED SAMPLE' : 'CURRENT STATE',
      327,
      320,
      30,
      themeColors.cyan,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      beat ? 'completed loop · timestep 0' : 'schematic state evolution',
      327,
      850,
      27,
      themeColors.muted,
      'center',
    );
    const denoiser = drawOriginalTarget(ctx, api, 'reverse-network', () =>
      drawOriginalPanel(
        ctx,
        api,
        680,
        400,
        345,
        210,
        () => {
          drawOriginalText(ctx, api, 'denoiser', 852, 475, 34, themeColors.cyan, 'center');
          drawOriginalMath(ctx, api, String.raw`\epsilon_\theta(x_t,t)`, 852, 555, 38);
        },
        themeColors.cyan,
        'reverse-denoiser',
      ),
    );
    drawOriginalTarget(ctx, api, 'reverse-network-layers', () => {
      for (let i = 0; i < 4; i++)
        drawOriginalRect(ctx, api, 710 + i * 76, 640, 54, 22, themeColors.cyan, undefined, 3);
      drawOriginalText(
        ctx,
        api,
        'all layers · each prediction',
        852,
        710,
        25,
        themeColors.cyan,
        'center',
      );
    });
    const scheduler = api.focus.target(
      'reverse-sampler-center-prediction-state-update-center-reverse-sampler',
      () =>
        drawOriginalPanel(
          ctx,
          api,
          1240,
          400,
          440,
          210,
          () => {
            drawOriginalText(ctx, api, 'sampler', 1460, 475, 34, themeColors.yellow, 'center');
            drawOriginalText(
              ctx,
              api,
              'prediction → state update',
              1460,
              545,
              27,
              themeColors.ink,
              'center',
            );
          },
          themeColors.yellow,
          'reverse-sampler',
        ),
    );
    if (!beat) drawOriginalArrow(ctx, api, 510, 500, 655, 500, themeColors.cyan);
    api.connect(ctx, denoiser, scheduler, {
      color: themeColors.cyan,
    });
    drawOriginalText(ctx, api, 'Predicted epsilon', 1120, 365, 24, themeColors.cyan, 'center');
    const route = beat
      ? [
          {
            x: 1460,
            y: 640,
          },
          {
            x: 1460,
            y: 760,
          },
          {
            x: 600,
            y: 760,
          },
          {
            x: 600,
            y: 500,
          },
          {
            x: 655,
            y: 500,
          },
        ]
      : [
          {
            x: 1460,
            y: 640,
          },
          {
            x: 1460,
            y: 760,
          },
          {
            x: 327,
            y: 760,
          },
          {
            x: 327,
            y: 725,
          },
        ];
    api.path(ctx, route, {
      color: themeColors.yellow,
      width: 4,
    });
    drawOriginalText(ctx, api, 'Updated state x', 770, 805, 25, themeColors.yellow, 'center');
    if (beat) {
      drawOriginalArrow(ctx, api, 630, 500, 655, 500, themeColors.yellow);
      drawOriginalText(
        ctx,
        api,
        'Separate DDPM step anatomy',
        1460,
        315,
        27,
        themeColors.yellow,
        'center',
      );
    } else {
      drawOriginalArrow(ctx, api, 327, 750, 327, 725, themeColors.yellow);
      const marker = api.pointAlongPath(route, (progress * 2) % 1);
      drawOriginalCircle(ctx, api, marker.x, marker.y, 8, themeColors.yellow);
    }
    const finalStep = drawOriginalSpoken(ctx, api, 'reverse-final-noise', beat > 1 ? 1 : 0) > 0.5;
    drawOriginalTarget(ctx, api, 'reverse-timestep', () => {
      drawOriginalText(
        ctx,
        api,
        beat
          ? `Example step · t=${finalStep ? 1 : 500}`
          : `timestep  ${Math.round(1000 * (1 - cycle))}`,
        852,
        315,
        30,
        themeColors.yellow,
        'center',
      );
      drawOriginalArrow(ctx, api, 852, 335, 852, 375, themeColors.yellow);
    });
    drawOriginalTarget(ctx, api, 'reverse-update', () =>
      drawOriginalMath(ctx, api, String.raw`x_{t-1}=\mu_\theta(x_t,t)+\sigma_t z`, 990, 915, 48),
    );
    drawOriginalTarget(ctx, api, 'reverse-noise-state', () =>
      drawOriginalText(
        ctx,
        api,
        finalStep ? 'final step: extra noise = 0' : 'intermediate steps: fresh Gaussian noise',
        990,
        982,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
  ctx.restore();
}
export function drawReverse(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  paintReverse(
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
  id: 'reverse',
  draw: drawReverse,
  cues: [
    'reverse-sampler',
    'reverse-sample',
    'df-reverse-0',
    'reverse-ddpm-update',
    'reverse-final-noise',
    'df-reverse-1',
    'reverse-time',
    'reverse-layers',
    'reverse-depth-time',
    'df-reverse-2',
  ],
};
