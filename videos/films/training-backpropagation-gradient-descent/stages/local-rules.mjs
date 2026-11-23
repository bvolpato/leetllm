import { cueProgress, sampleModel } from '../model.mjs';
import {
  drawTrainingArrow,
  drawTrainingLine,
  drawTrainingMath,
  drawTrainingMatrix,
  drawTrainingText,
  withTrainingFocus,
} from '../defaults.mjs';
export function paintLocalRules(ctx, scene, state, api, C, c, b, P) {
  if (b === 0) {
    drawTrainingText(ctx, api, C, 'Incoming signal', 360, 310, 32, C.pink, 'center');
    drawTrainingMath(ctx, api, C, String.raw`\delta`, 360, 390, 46, C.pink);
    drawTrainingMatrix(ctx, api, C, c, [[-1.5], [0.5]], 300, 440, C.pink, 115);
    drawTrainingText(ctx, api, C, 'Saved input', 1150, 310, 32, C.blue, 'center');
    drawTrainingMatrix(ctx, api, C, c, [[2, 1]], 1040, 350, C.blue, 115);
    const progress = P('dense-outer');
    withTrainingFocus(ctx, api, 'dense-weight-gradient', () => {
      const values = [
        [-3, -1.5],
        [1, 0.5],
      ].map((row, i) => row.map((v, j) => (progress * 4 >= i * 2 + j + 0.3 ? v : '?')));
      drawTrainingMatrix(ctx, api, C, c, values, 1040, 540, C.yellow, 115);
      drawTrainingMath(ctx, api, C, String.raw`\nabla_W L=\delta x^\top`, 1160, 885, 49, C.yellow);
    });
    drawTrainingArrow(ctx, api, C, 540, 575, 965, 575, C.pink, 5);
    drawTrainingText(ctx, api, C, 'pair every row and column', 750, 525, 27, C.muted, 'center');
    withTrainingFocus(ctx, api, 'dense-input-gradient', () =>
      drawTrainingMath(ctx, api, C, String.raw`\nabla_x L=W^\top\delta`, 510, 890, 43, C.blue),
    );
    drawTrainingMath(ctx, api, C, String.raw`\nabla_b L=\delta`, 1500, 985, 39, C.pink);
  } else if (b === 1) {
    drawTrainingText(
      ctx,
      api,
      C,
      'Saved preactivation decides the route',
      960,
      300,
      39,
      C.ink,
      'center',
    );
    const p = P('relu-mask', 1);
    [-1, 2].forEach((z, i) => {
      const x = 590 + i * 740,
        color = i ? C.green : C.pink;
      drawTrainingMath(ctx, api, C, `z=${z}`, x, 410, 50, C.blue);
      drawTrainingMath(ctx, api, C, i ? 'g_h=4' : 'g_h=3', x, 555, 44, color);
      drawTrainingArrow(ctx, api, C, x, 590, x, 675, color, 6);
      drawTrainingLine(ctx, api, C, x - 120, 700, x + 120, 700, z > 0 ? C.green : C.pink, 8);
      if (z > 0 && p > 0) drawTrainingArrow(ctx, api, C, x, 725, x, 845, C.green, 6);
      else {
        drawTrainingLine(ctx, api, C, x - 28, 650, x + 28, 695, C.pink, 6);
        drawTrainingLine(ctx, api, C, x + 28, 650, x - 28, 695, C.pink, 6);
      }
      drawTrainingMath(ctx, api, C, `g_z=${i ? (p === 1 ? 4 : '?') : 0}`, x, 945, 55, color);
    });
    withTrainingFocus(ctx, api, 'relu-routing', () =>
      drawTrainingMath(ctx, api, C, String.raw`g_z=g_h\,\mathbf1_{z>0}`, 960, 1025, 44, C.yellow),
    );
  } else {
    const features = [
      [0.1, 0.42, 0.18, 0.3],
      [0.25, 0.91, 0.44, 0.12],
      [0.08, 0.21, 0.77, 0.55],
      [0.16, 0.14, 0.32, 0.49],
    ];
    const winners = [
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ],
      gs = [0.5, -0.2, 0.1, 0.3],
      colors = [C.blue, C.pink, C.cyan, C.green];
    const p = P('pool-route', 2);
    drawTrainingText(ctx, api, C, 'Saved forward winners', 470, 300, 35, C.ink, 'center');
    drawTrainingText(ctx, api, C, 'Backward destinations', 1450, 300, 35, C.ink, 'center');
    withTrainingFocus(ctx, api, 'pool-routing', () => {
      drawTrainingMatrix(ctx, api, C, c, features, 240, 365, C.muted, 110);
      const gradients = features.map((row) => row.map(() => 0));
      winners.forEach(([row, col], i) => {
        if (p * 4 >= i + 0.4) gradients[row][col] = gs[i];
      });
      drawTrainingMatrix(ctx, api, C, c, gradients, 1220, 365, C.green, 110);
      winners.forEach(([row, col], i) => {
        c.panel({
          x: 238 + col * 110,
          y: 363 + row * 110,
          width: 106,
          height: 106,
          fill: 'transparent',
          stroke: colors[i],
          radius: 0,
        });
      });
      drawTrainingArrow(ctx, api, C, 760, 600, 1135, 600, C.yellow, 6);
    });
    drawTrainingMath(
      ctx,
      api,
      C,
      String.raw`g_{\rm pooled}=[0.5,-0.2,0.1,0.3]`,
      960,
      920,
      43,
      C.yellow,
    );
    drawTrainingText(
      ctx,
      api,
      C,
      'The saved location carries the incoming gradient, including its sign',
      960,
      1025,
      29,
      C.muted,
      'center',
    );
  }
  return;
}
export function drawLocalRulesStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  const P = (id, beat = 0) => cueProgress(state, id, beat);
  return paintLocalRules(ctx, scene, state, api, C, c, b, P);
}
export default {
  id: 'local-rules',
  draw: drawLocalRulesStage,
  cues: ['dense-outer', 'dense-input', 'relu-mask', 'pool-route'],
};
