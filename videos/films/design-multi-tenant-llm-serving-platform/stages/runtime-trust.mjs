import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionPanel,
  drawConstructionText,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawRuntimeTrust(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('runtime-trust', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'runtime-trust', () => {
    if (currentBeat === 0) {
      drawConstructionPanel(ctx, api, 120, 320, 1680, 610, themeColors.yellow);
      drawConstructionText(
        ctx,
        api,
        'Host kernel · driver · device trust remains shared',
        160,
        370,
        31,
        themeColors.yellow,
      );
      if (modelState.separateProcesses) {
        drawConstructionBox(
          ctx,
          api,
          'Process A\naddress space A',
          200,
          495,
          680,
          230,
          themeColors.blue,
          35,
        );
        drawConstructionBox(
          ctx,
          api,
          'Process B\naddress space B',
          1040,
          495,
          680,
          230,
          themeColors.pink,
          35,
        );
      } else {
        drawConstructionPanel(ctx, api, 260, 480, 1400, 300, themeColors.cyan);
        drawConstructionCenter(
          ctx,
          api,
          'Shared worker address space',
          960,
          540,
          35,
          themeColors.cyan,
        );
        drawConstructionBox(ctx, api, 'Request A', 360, 620, 480, 100, themeColors.blue, 32);
        drawConstructionBox(ctx, api, 'Request B', 1080, 620, 480, 100, themeColors.pink, 32);
      }
      drawConstructionCenter(
        ctx,
        api,
        'Application namespaces do not create these operating-system domains',
        960,
        875,
        29,
        themeColors.ink,
      );
    } else if (currentBeat === 1) {
      drawConstructionPanel(ctx, api, 120, 320, 1680, 635, themeColors.yellow);
      drawConstructionText(ctx, api, 'Same host / driver', 155, 365, 30, themeColors.yellow);
      for (const [i, id] of ['GI1', 'GI2'].entries()) {
        const x = 180 + i * 840;
        drawConstructionPanel(ctx, api, x, 440, 760, 450, i ? themeColors.pink : themeColors.blue);
        drawConstructionCenter(
          ctx,
          api,
          id + ' · separate GPU-instance memory',
          x + 380,
          490,
          29,
          i ? themeColors.pink : themeColors.blue,
        );
        drawConstructionBox(
          ctx,
          api,
          i ? 'CI3' : 'CI1',
          x + 70,
          565,
          270,
          100,
          themeColors.cyan,
          31,
        );
        if (!i) drawConstructionBox(ctx, api, 'CI2', x + 420, 565, 270, 100, themeColors.cyan, 31);
        drawConstructionBox(
          ctx,
          api,
          'Parent ' + id + ' memory and engines',
          x + 70,
          745,
          620,
          95,
          i ? themeColors.pink : themeColors.blue,
          28,
        );
      }
      if (modelState.sharedParentMemory)
        drawConstructionCenter(
          ctx,
          api,
          'CI1 and CI2 share GI1 memory',
          960,
          980,
          30,
          themeColors.yellow,
        );
    } else {
      drawConstructionPanel(ctx, api, 130, 350, 760, 480, themeColors.blue);
      drawConstructionPanel(ctx, api, 1030, 350, 760, 480, themeColors.pink);
      drawConstructionBox(
        ctx,
        api,
        'VM / pool A\nits guest or host boundary',
        200,
        440,
        620,
        210,
        themeColors.blue,
        34,
      );
      drawConstructionBox(
        ctx,
        api,
        'VM / pool B\nits guest or host boundary',
        1100,
        440,
        620,
        210,
        themeColors.pink,
        34,
      );
      drawConstructionCenter(
        ctx,
        api,
        'Network · storage · identity · operations still need policy',
        960,
        925,
        31,
        themeColors.yellow,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Outlines name shared resources; they are not a linear isolation or security score',
    );
  });
}
export default {
  id: 'runtime-trust',
  draw: drawRuntimeTrust,
  cues: [
    'mt-runtime-trust-b0',
    'mt-runtime-trust-s0-2',
    'mt-runtime-trust-b1',
    'mt-runtime-trust-s1-1',
    'mt-runtime-trust-s1-2',
    'mt-runtime-trust-b2',
    'mt-runtime-trust-s2-0',
  ],
};
