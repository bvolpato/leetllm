import { softplus } from '../arithmetic.mjs';
import { training } from '../fixtures.mjs';
import { curvatureFixture, meanHessian, softplusNegative } from '../model.mjs';
import {
  axes,
  cueAmount,
  curve,
  equation,
  labelPoint,
  rectangle,
  segment,
  text,
} from '../defaults.mjs';
export function drawLossCurvature(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-loss-curvature-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-loss-curvature-mechanism', () => {
    if (currentBeat === 0) {
      const r = curvatureFixture(),
        amount = cueAmount(ctx, api, 'lr-bce-derivative'),
        tiny = cueAmount(ctx, api, 'lr-mse-derivative');
      text(ctx, api, 'Same positive row: z = −8', 960, 285, 37, themeColors.pink);
      text(ctx, api, 'p = ' + r.p.toFixed(6), 960, 365, 35, themeColors.cyan);
      const x = 1200;
      segment(ctx, api, 300, 540, 1200, 540, themeColors.muted);
      segment(ctx, api, 300, 745, 1200, 745, themeColors.muted);
      text(ctx, api, 'BCE score gradient', 490, 470, 33, themeColors.pink);
      text(ctx, api, 'Squared-error score gradient', 570, 680, 33, themeColors.blue);
      if (amount > 0) {
        api.arrow(ctx, 1200, 540, 1200 + 850 * r.bce * amount, 540, themeColors.pink, 7);
        if (resultComplete('lr-bce-derivative'))
          text(ctx, api, r.bce.toFixed(6), 1480, 550, 38, themeColors.pink);
      }
      if (tiny > 0) {
        api.arrow(ctx, 1200, 745, 1200 + 850 * r.squaredError * tiny, 745, themeColors.blue, 5);
        if (resultComplete('lr-mse-derivative'))
          text(ctx, api, r.squaredError.toFixed(6), 1480, 755, 38, themeColors.blue);
      }
      equation(ctx, api, '2(p-y)p(1-p)', 960, 925, 48, themeColors.blue);
      text(
        ctx,
        api,
        'The sigmoid is nearly flat here, so squared error gives a tiny gradient.',
        960,
        1000,
        30,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const H = meanHessian(),
        a = cueAmount(ctx, api, 'lr-design-hessian');
      text(ctx, api, 'Actual design: eight rows × three columns', 960, 270, 33, themeColors.muted);
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
          rectangle(
            ctx,
            api,
            240 + j * 190,
            390 + i * 135,
            160,
            95,
            themeColors.panel,
            themeColors.cyan,
          );
          if (a > (i * 3 + j) / 9)
            text(ctx, api, H[i][j].toFixed(3), 320 + j * 190, 450 + i * 135, 34, themeColors.cyan);
        }
      equation(
        ctx,
        api,
        'H=\\frac1N X^T\\operatorname{diag}(p(1-p))X',
        1320,
        470,
        38,
        themeColors.cyan,
      );
      const u = cueAmount(ctx, api, 'lr-duplicate-flat');
      text(ctx, api, 'Separate duplicated-column design', 1320, 610, 31, themeColors.yellow);
      training.slice(0, 4).forEach(([a, support], i) => {
        const y = 675 + i * 66;
        text(
          ctx,
          api,
          '[1, ' + a + ', ' + support + ', ' + a + ']',
          1140,
          y,
          29,
          themeColors.muted,
        );
        const change = a * u + a * -u;
        text(ctx, api, 'Δz = ' + change.toFixed(2), 1570, y, 29, themeColors.green);
      });
      text(
        ctx,
        api,
        'Δw₁ = ' + u.toFixed(2) + ' · Δw₃ = ' + (-u).toFixed(2),
        1320,
        995,
        29,
        themeColors.yellow,
      );
    } else {
      const a = 1 + 9 * op,
        q = axes(
          ctx,
          api,
          240,
          365,
          1050,
          450,
          [0, 10],
          [0, 0.75],
          'coefficient a',
          'mean log loss',
        );
      curve(ctx, api, q, softplusNegative, 0, 10, themeColors.cyan);
      labelPoint(ctx, api, q, a, softplus(-a), themeColors.yellow);
      text(ctx, api, 'Two separated cases', 1510, 370, 33, themeColors.muted);
      text(ctx, api, 'a = ' + a.toFixed(2), 1510, 500, 42, themeColors.yellow);
      text(ctx, api, 'loss = ' + softplus(-a).toFixed(5), 1510, 610, 35, themeColors.cyan);
      if (resultComplete('lr-no-finite-optimum'))
        text(ctx, api, 'No finite unpenalized minimizer', 960, 935, 36, themeColors.pink);
      else
        text(ctx, api, 'What happens as the coefficient grows?', 960, 935, 33, themeColors.muted);
    }
  });
}
export default {
  id: 'loss-curvature',
  draw: drawLossCurvature,
  cues: [
    'lr-loss-curvature-step-0',
    'lr-bce-derivative',
    'lr-mse-derivative',
    'lr-loss-curvature-step-1',
    'lr-design-hessian',
    'lr-duplicate-flat',
    'lr-loss-curvature-step-2',
    'lr-no-finite-optimum',
  ],
};
