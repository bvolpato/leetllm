import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionPage,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawExtraWork(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('extra-work', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'extra-work', () => {
    if (currentBeat === 0) {
      drawConstructionCenter(
        ctx,
        api,
        'Supplied proposal illustration · distinct counters',
        960,
        285,
        33,
        themeColors.yellow,
      );
      modelState.proposals.forEach((p, i) => {
        const x = 250 + i * 565;
        drawConstructionBox(ctx, api, p.id, x, 390, 400, 100, themeColors.blue, 35);
        drawConstructionArrow(ctx, api, x + 200, 515, x + 200, 595, themeColors.cyan);
        drawConstructionBox(
          ctx,
          api,
          'target verifies ' + p.id,
          x,
          625,
          400,
          110,
          themeColors.cyan,
          29,
        );
        if (modelState.countsVisible)
          drawConstructionCenter(
            ctx,
            api,
            p.accepted ? 'accepted proposal' : 'rejected proposal',
            x + 200,
            855,
            29,
            p.accepted ? themeColors.green : themeColors.pink,
          );
      });
      if (modelState.countsVisible)
        drawConstructionCenter(
          ctx,
          api,
          '3 verified positions · 1 accepted proposal',
          960,
          975,
          34,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      drawConstructionBox(ctx, api, 'Victim selected', 130, 295, 690, 100, themeColors.yellow, 34);
      drawConstructionBox(
        ctx,
        api,
        'New request C is waiting',
        1090,
        295,
        690,
        100,
        themeColors.blue,
        32,
      );
      drawConstructionPage(ctx, api, 'extra-work', 'P7', 270, 525, {
        used: 16,
        owner: modelState.newAdmission ? 'new C reservation' : 'old execution',
        refs: modelState.refs,
        fill: modelState.retired ? themeColors.blue : themeColors.yellow,
      });
      drawConstructionBox(
        ctx,
        api,
        modelState.retired ? 'Retirement boundary confirmed' : 'Old device reader still live',
        1000,
        530,
        760,
        130,
        modelState.retired ? themeColors.green : themeColors.pink,
        31,
      );
      if (modelState.newAdmission) {
        drawConstructionArrow(ctx, api, 850, 765, 1040, 765, themeColors.green);
        drawConstructionCenter(
          ctx,
          api,
          'Update ownership, then admit C atomically',
          1260,
          900,
          31,
          themeColors.green,
        );
      } else
        drawConstructionCenter(
          ctx,
          api,
          'Selecting a victim does not free P7',
          960,
          930,
          35,
          themeColors.pink,
        );
    } else {
      drawConstructionCenter(
        ctx,
        api,
        'Repeated prefill remains real work',
        960,
        285,
        35,
        themeColors.yellow,
      );
      for (let i = 0; i < 3; i++) {
        const y = 420 + i * 180;
        drawConstructionBox(
          ctx,
          api,
          'same victim: prefill ' + (i + 1),
          180,
          y,
          650,
          105,
          themeColors.blue,
          31,
        );
        drawConstructionArrow(ctx, api, 875, y + 50, 1040, y + 50, themeColors.yellow);
        drawConstructionBox(
          ctx,
          api,
          'time and cost again',
          1100,
          y,
          650,
          105,
          themeColors.yellow,
          31,
        );
      }
      drawConstructionCenter(
        ctx,
        api,
        'Bound repeated preemption and lower-tier waiting',
        960,
        985,
        30,
        themeColors.pink,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Proposal work, verified positions, accepted proposals and reusable capacity are different quantities',
    );
  });
}
export default {
  id: 'extra-work',
  draw: drawExtraWork,
  cues: [
    'mt-extra-work-b0',
    'mt-extra-work-s0-0',
    'mt-extra-work-s0-1',
    'mt-extra-work-b1',
    'mt-extra-work-s1-1',
    'mt-extra-work-s1-2',
    'mt-extra-work-b2',
    'mt-extra-work-s2-0',
  ],
};
