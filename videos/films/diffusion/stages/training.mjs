import { opProgress } from '../construction.mjs';
import { imageNoise } from '../model.mjs';
import {
  drawOriginalArrow,
  drawOriginalCircle,
  drawOriginalLine,
  drawOriginalMath,
  drawOriginalPanel,
  drawOriginalRect,
  drawOriginalSpoken,
  drawOriginalTarget,
  drawOriginalText,
  drawOriginalTile,
} from '../defaults.mjs';
function paintTraining(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0);
  const stage = (index, start = 0.05, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress2, start, end);
  const fade = api.components.fade;
  ctx.save();
  {
    const alpha = 0.35;
    drawOriginalTarget(ctx, api, 'training-clean', () =>
      drawOriginalTile(ctx, api, 150, 350, 240, 1, 'clean'),
    );
    const inputTile = drawOriginalTarget(ctx, api, 'training-input', () =>
      drawOriginalTile(ctx, api, 550, 350, 240, alpha),
    );
    api.focus.target('training-noise', () => drawOriginalTile(ctx, api, 150, 720, 175, 0, 'noise'));
    drawOriginalText(ctx, api, 'clean image', 270, 305, 30, themeColors.cyan, 'center');
    drawOriginalText(ctx, api, 'noisy input', 670, 305, 30, themeColors.cyan, 'center');
    drawOriginalArrow(ctx, api, 410, 470, 525, 470, themeColors.cyan);
    drawOriginalText(ctx, api, 'mix', 465, 430, 28, themeColors.muted, 'center');
    drawOriginalArrow(ctx, api, 280, 690, 570, 615, themeColors.yellow);
    drawOriginalText(ctx, api, 'known noise', 365, 780, 29, themeColors.yellow);
    api.path(
      ctx,
      [
        {
          x: 350,
          y: 855,
        },
        {
          x: 1325,
          y: 855,
        },
        {
          x: 1325,
          y: 710,
        },
        {
          x: 1375,
          y: 710,
        },
      ],
      {
        color: themeColors.yellow,
        width: 3,
      },
    );
    drawOriginalArrow(ctx, api, 1350, 710, 1375, 710, themeColors.yellow, 3);
    const network = drawOriginalTarget(ctx, api, 'training-network', () =>
      drawOriginalPanel(
        ctx,
        api,
        925,
        360,
        330,
        235,
        () => {
          drawOriginalText(ctx, api, 'DENOISER', 1120, 430, 31, themeColors.cyan, 'center');
          drawOriginalMath(ctx, api, String.raw`\epsilon_\theta(x_t,t)`, 1090, 515, 44);
        },
        themeColors.cyan,
        'training-network',
      ),
    );
    api.connect(ctx, inputTile, network, {
      color: themeColors.cyan,
    });
    drawOriginalTarget(ctx, api, 'training-timestep', () => {
      drawOriginalText(ctx, api, 'timestep', 1090, 720, 30, themeColors.yellow, 'center');
      drawOriginalArrow(ctx, api, 1090, 675, 1090, 618, themeColors.yellow);
    });
    const progress = drawOriginalSpoken(ctx, api, 'training-errors', stage(2)),
      targets = imageNoise.slice(0, 3),
      initial = targets.map((target, i) => target + [0.7, -0.55, 0.4][i]);
    api.focus.target(
      'training-noise-error-center-coordinates-0-1-2-center-8d9cb944-mse-loss-tofixe',
      () =>
        drawOriginalPanel(
          ctx,
          api,
          1390,
          340,
          380,
          570,
          () => {
            drawOriginalText(ctx, api, 'NOISE ERROR', 1580, 405, 30, themeColors.muted, 'center');
            drawOriginalText(
              ctx,
              api,
              'coordinates 0 · 1 · 2',
              1580,
              450,
              25,
              themeColors.yellow,
              'center',
            );
            let loss = 0;
            for (let i = 0; i < 3; i++) {
              const predicted = api.lerp(
                initial[i],
                targets[i] + [0.02, -0.02, -0.03][i],
                progress,
              );
              const yy = 520 + i * 100,
                map = (v) => 1440 + ((v + 1.3) / 2.6) * 275;
              drawOriginalLine(ctx, api, 1440, yy, 1715, yy, '#8d9cb944', 2);
              drawOriginalLine(
                ctx,
                api,
                map(targets[i]),
                yy,
                map(predicted),
                yy,
                themeColors.red,
                7,
              );
              drawOriginalCircle(ctx, api, map(targets[i]), yy, 7, themeColors.yellow);
              drawOriginalCircle(ctx, api, map(predicted), yy, 6, themeColors.cyan);
              const side = Math.abs(predicted - targets[i]) * 70;
              drawOriginalRect(
                ctx,
                api,
                1470,
                yy + 12,
                side,
                side,
                '#ff708755',
                themeColors.red,
                0,
              );
              loss += (predicted - targets[i]) ** 2 / 3;
            }
            drawOriginalText(
              ctx,
              api,
              `MSE  ${loss.toFixed(4)}`,
              1580,
              835,
              34,
              themeColors.ink,
              'center',
            );
          },
          themeColors.muted,
          'training-loss',
        ),
    );
    drawOriginalArrow(ctx, api, 1275, 475, 1365, 475, themeColors.cyan);
    drawOriginalText(
      ctx,
      api,
      'schematic parameter update',
      1095,
      955,
      29,
      themeColors.muted,
      'center',
    );
  }
  ctx.restore();
}
export function drawTraining(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  paintTraining(
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
  id: 'training',
  draw: drawTraining,
  cues: [
    'training-choose-input',
    'training-known-noise',
    'df-training-0',
    'training-network-input',
    'training-comparison',
    'df-training-1',
    'training-errors',
    'training-shared-network',
    'df-training-2',
  ],
};
