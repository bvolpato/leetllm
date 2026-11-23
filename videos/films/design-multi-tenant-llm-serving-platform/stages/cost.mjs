import { sampleModel } from '../observations.mjs';
import { drawTenantCard, drawTenantText } from '../defaults.mjs';
export function drawCost(ctx, scene, state, api, modelId = 'cost') {
  const { C: themeColors } = api,
    modelState = sampleModel(modelId, state),
    currentBeat = modelState.step;
  {
    drawTenantText(
      ctx,
      api,
      'Supplied price: $2 / GPU-hour · four GPUs · 0.2 s step',
      150,
      285,
      35,
    );
    api.focus.target('cost-s-gpuseconds-tofixed-1-gpu-seconds', () =>
      drawTenantCard(
        ctx,
        api,
        modelState.gpuSeconds.toFixed(1) + ' GPU-seconds',
        170,
        420,
        650,
        themeColors.blue,
        120,
        44,
      ),
    );
    api.focus.target('cost-s-cost-tofixed-9-total', () =>
      drawTenantCard(
        ctx,
        api,
        '$' + modelState.cost.toFixed(9) + ' total',
        1100,
        420,
        650,
        themeColors.green,
        120,
        40,
      ),
    );
    drawTenantText(
      ctx,
      api,
      'A share $' + modelState.a.toFixed(9),
      500,
      740,
      38,
      themeColors.blue,
      'center',
    );
    drawTenantText(
      ctx,
      api,
      'B share $' + modelState.b.toFixed(9),
      1430,
      740,
      38,
      themeColors.pink,
      'center',
    );
    drawTenantText(
      ctx,
      api,
      '25% + 75% conserves step cost · whole-node rate uses node-seconds',
      960,
      975,
      29,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'cost',
  draw: drawCost,
  cues: ['cost-beat-1-focus-1', 'cost-beat-2-focus-1', 'cost-beat-2-focus-2'],
};
