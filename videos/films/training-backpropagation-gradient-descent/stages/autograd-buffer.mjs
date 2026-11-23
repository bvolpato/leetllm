import { clamp } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import {
  drawTrainingArrow,
  drawTrainingMath,
  drawTrainingPanel,
  drawTrainingText,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintAutogradBuffer(ctx, scene, state, api, C, c, b, s) {
  withTrainingFocus(ctx, api, 'shared-parameter', () =>
    drawTrainingPanel(ctx, api, C, c, 180, 410, 320, 130, C.blue, () =>
      drawTrainingMath(ctx, api, C, 'a=3', 340, 495, 54, C.blue),
    ),
  );
  const slots = [
    [800, 350],
    [800, 590],
  ];
  slots.forEach(([x, y], i) => {
    drawTrainingArrow(ctx, api, C, 520, 475, x - 30, y + 50, C.blue);
    drawTrainingPanel(ctx, api, C, c, x, y, 300, 100, i ? C.pink : C.cyan, () =>
      drawTrainingText(
        ctx,
        api,
        C,
        'same a · 3',
        x + 150,
        y + 64,
        34,
        i ? C.pink : C.cyan,
        'center',
      ),
    );
    drawTrainingArrow(ctx, api, C, x + 320, y + 50, 1430, 475, C.muted);
  });
  drawTrainingPanel(ctx, api, C, c, 1460, 410, 300, 130, C.green, () =>
    drawTrainingMath(ctx, api, C, 'a^2=9', 1610, 495, 48, C.green),
  );
  withTrainingFocus(ctx, api, 'owned-gradient-buffer', () =>
    drawTrainingPanel(ctx, api, C, c, 660, 820, 600, 125, s.clearing ? C.yellow : C.green, () => {
      drawTrainingText(ctx, api, C, 'Gradient buffer owned by a', 960, 865, 29, C.muted, 'center');
      drawTrainingMath(
        ctx,
        api,
        C,
        String(s.currentBuffer),
        960,
        925,
        52,
        s.clearing ? C.yellow : C.green,
      );
    }),
  );
  if (b > 0) {
    const flows =
      s.repeatProgress > 0
        ? [clamp(s.repeatProgress * 2), clamp(s.repeatProgress * 2 - 1)]
        : [s.firstProgress, s.secondProgress];
    flows.forEach((p, i) => {
      const points = i
        ? [
            {
              x: 950,
              y: 710,
            },
            {
              x: 1370,
              y: 710,
            },
            {
              x: 1370,
              y: 880,
            },
            {
              x: 1280,
              y: 880,
            },
          ]
        : [
            {
              x: 800,
              y: 300,
            },
            {
              x: 100,
              y: 300,
            },
            {
              x: 100,
              y: 880,
            },
            {
              x: 640,
              y: 880,
            },
          ];
      const color = i ? C.pink : C.cyan;
      if (p > 0) {
        api.path(ctx, points, {
          color,
          width: 4,
        });
        drawTrainingText(ctx, api, C, '+3', i ? 1380 : 175, i ? 785 : 770, 39, color);
      }
      if (p > 0 && p < 1)
        c.particle({
          points,
          progress: p,
          radius: 11,
          fill: color,
        });
    });
  }
  drawTrainingText(
    ctx,
    api,
    C,
    s.clearing
      ? 'Cleared for the next effective batch'
      : s.repeatProgress > 0
        ? 'Fresh forward + second backward add into the existing buffer'
        : 'Each use contributes to the same derivative',
    960,
    1030,
    29,
    C.muted,
    'center',
  );
  return;
}
export function drawAutogradBufferStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintAutogradBuffer(ctx, scene, state, api, C, c, b, s);
}
export default {
  id: 'autograd-buffer',
  draw: drawAutogradBufferStage,
  cues: ['buffer-shared', 'buffer-first', 'buffer-second', 'buffer-repeat', 'buffer-clear'],
};
