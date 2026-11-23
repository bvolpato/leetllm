import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawWorkCost(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('work-cost', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'work-cost', () => {
    if (currentBeat === 0) {
      ['A', 'B'].forEach((tenant, i) => {
        const y = 400 + i * 270,
          color = i ? themeColors.pink : themeColors.blue;
        drawConstructionCenter(ctx, api, 'Tenant ' + tenant, 300, y, 34, color);
        drawConstructionText(ctx, api, 'Charged work', 590, y - 55, 29, themeColors.muted);
        if (modelState.workVisible) {
          api.rect(ctx, 590, y, 70 * modelState.served[tenant], 70, color, undefined, 0);
          drawConstructionText(
            ctx,
            api,
            modelState.served[tenant] + ' work units',
            1510,
            y + 50,
            32,
            color,
          );
        }
        if (modelState.chunksVisible) {
          for (let j = 0; j < modelState.jobs[tenant]; j++)
            drawConstructionBox(
              ctx,
              api,
              tenant + '-' + (j + 1),
              590 + j * 150,
              y + 120,
              120,
              70,
              color,
              26,
            );
        }
      });
      if (modelState.ratioVisible)
        drawConstructionCenter(
          ctx,
          api,
          'Work 12 : 6 = 2 : 1 · chunks 4 : 6 = 2 : 3',
          960,
          985,
          34,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      drawConstructionCenter(
        ctx,
        api,
        'Equal nominal token totals · different work',
        960,
        285,
        34,
        themeColors.yellow,
      );
      ['Long-context prefill', 'Short-context decode'].forEach((v, i) => {
        const x = 180 + i * 870;
        drawConstructionBox(
          ctx,
          api,
          v,
          x,
          380,
          720,
          100,
          i ? themeColors.pink : themeColors.blue,
          32,
        );
        for (let j = 0; j < 8; j++)
          api.rect(
            ctx,
            x + j * 83,
            555,
            66,
            66,
            i ? themeColors.pink : themeColors.blue,
            undefined,
            0,
          );
        for (let j = 0; j < (i ? 2 : 6); j++)
          drawConstructionLine(
            ctx,
            api,
            x + 25 + j * 95,
            760,
            x + 600,
            825,
            i ? themeColors.pink : themeColors.blue,
            3,
          );
        drawConstructionCenter(ctx, api, 'Nominal tokens', x + 360, 675, 28, themeColors.muted);
        drawConstructionCenter(
          ctx,
          api,
          'Estimate work; calibrate with measurement',
          x + 360,
          925,
          27,
          themeColors.yellow,
        );
      });
    } else {
      drawConstructionCenter(
        ctx,
        api,
        'Backlogged credit and idle policy are explicit',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawConstructionBox(
        ctx,
        api,
        'Backlogged tenant\ncarry unused credit',
        160,
        400,
        710,
        150,
        themeColors.blue,
        32,
      );
      drawConstructionBox(
        ctx,
        api,
        'Idle transition\napply declared reset policy',
        1050,
        400,
        710,
        150,
        themeColors.pink,
        32,
      );
      for (let j = 0; j < 6; j++)
        drawConstructionBox(
          ctx,
          api,
          'waiting ' + (j + 1),
          180 + j * 270,
          700,
          230,
          90,
          themeColors.muted,
          26,
        );
      drawConstructionCenter(
        ctx,
        api,
        'A three-round share proves no maximum wait',
        960,
        925,
        35,
        themeColors.pink,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'The original work-unit example remains separate from real measured GPU cost',
    );
  });
}
export default {
  id: 'work-cost',
  draw: drawWorkCost,
  cues: [
    'mt-work-cost-b0',
    'mt-work-cost-s0-1',
    'mt-work-cost-s0-2',
    'mt-work-cost-s0-3',
    'mt-work-cost-b1',
    'mt-work-cost-b2',
    'mt-work-cost-s2-0',
  ],
};
