import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLedger,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawAdmissionRace(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('admission-race', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'admission-race', () => {
    drawConstructionCenter(
      ctx,
      api,
      modelState.atomic
        ? 'Explicit restart: atomic check and update'
        : 'Unsafe design: both gateways read the same 1,000',
      960,
      285,
      34,
      modelState.atomic ? themeColors.cyan : themeColors.yellow,
    );
    ['G1 / r1', 'G2 / r2'].forEach((id, i) =>
      drawConstructionBox(
        ctx,
        api,
        id + '\nReserve 700',
        150 + i * 1130,
        380,
        490,
        130,
        i ? themeColors.pink : themeColors.blue,
        32,
      ),
    );
    if (!modelState.atomic) {
      drawConstructionArrow(ctx, api, 675, 445, 850, 525, themeColors.blue);
      drawConstructionArrow(ctx, api, 1245, 445, 1070, 525, themeColors.pink);
      drawConstructionBox(
        ctx,
        api,
        'Shared available: 1,000',
        610,
        565,
        700,
        130,
        themeColors.yellow,
        34,
      );
      if (modelState.badResultVisible)
        drawConstructionCenter(
          ctx,
          api,
          '700 + 700 = 1,400 promised · 400 beyond allowance',
          960,
          850,
          35,
          themeColors.pink,
        );
    } else {
      drawConstructionLedger(
        ctx,
        api,
        'admission-race',
        {
          available: modelState.available,
          held: modelState.held,
          settled: 0,
        },
        1000,
        210,
        650,
        1500,
      );
      if (modelState.first)
        drawConstructionCenter(
          ctx,
          api,
          'First reservation committed: 700 held',
          490,
          540,
          29,
          themeColors.green,
        );
      if (modelState.second)
        drawConstructionCenter(
          ctx,
          api,
          'Second observes 300: DENIED',
          1450,
          540,
          29,
          themeColors.pink,
        );
    }
    drawConstructionFoot(
      ctx,
      api,
      'The local fixture orders one process; cross-host safety requires durable authority',
    );
  });
}
export default {
  id: 'admission-race',
  draw: drawAdmissionRace,
  cues: [
    'mt-admission-race-b0',
    'mt-admission-race-s0-2',
    'mt-admission-race-s0-3',
    'mt-admission-race-b1',
    'mt-admission-race-s1-0',
    'mt-admission-race-s1-1',
    'mt-admission-race-s1-2',
    'mt-admission-race-b2',
  ],
};
