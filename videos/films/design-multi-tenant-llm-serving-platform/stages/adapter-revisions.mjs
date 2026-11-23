import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawAdapterRevisions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('adapter-revisions', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'adapter-revisions', () => {
    if (currentBeat === 0) {
      drawConstructionBox(ctx, api, 'Frozen base W', 170, 390, 600, 150, themeColors.blue, 38);
      drawConstructionBox(
        ctx,
        api,
        'Learned low-rank B A',
        1120,
        390,
        600,
        150,
        themeColors.cyan,
        36,
      );
      drawConstructionCenter(ctx, api, '+', 955, 480, 60, themeColors.yellow);
      drawConstructionArrow(ctx, api, 475, 575, 475, 730, themeColors.blue);
      drawConstructionArrow(ctx, api, 1425, 575, 1425, 730, themeColors.cyan);
      drawConstructionLine(ctx, api, 475, 730, 1425, 730, themeColors.muted, 3);
      drawConstructionCenter(ctx, api, 'y = W x + B A x', 960, 850, 43, themeColors.green);
      drawConstructionCenter(
        ctx,
        api,
        'Behavior change ≠ document authorization',
        960,
        970,
        32,
        themeColors.yellow,
      );
    } else {
      drawConstructionBox(
        ctx,
        api,
        'Alias docs-current → ' + modelState.alias,
        350,
        280,
        1220,
        100,
        themeColors.yellow,
        34,
      );
      drawConstructionBox(
        ctx,
        api,
        'Running A-1\npinned ' + modelState.pinned,
        150,
        455,
        700,
        155,
        themeColors.blue,
        33,
      );
      drawConstructionBox(
        ctx,
        api,
        modelState.newRequest
          ? 'New A-2\nresolved ' + modelState.newRequest
          : 'New request waits for resolution',
        1070,
        455,
        700,
        155,
        modelState.newRequest ? themeColors.cyan : themeColors.muted,
        32,
      );
      drawConstructionBox(
        ctx,
        api,
        'A-1 KV history stays ' + modelState.oldKV,
        150,
        720,
        700,
        110,
        themeColors.blue,
        29,
      );
      if (currentBeat === 1)
        drawConstructionBox(
          ctx,
          api,
          'A-1 reference stays live',
          1070,
          720,
          700,
          110,
          themeColors.yellow,
          30,
        );
      else {
        drawConstructionBox(
          ctx,
          api,
          'Every artifact slot pinned',
          1070,
          720,
          700,
          110,
          themeColors.pink,
          30,
        );
        if (modelState.waitVisible)
          drawConstructionCenter(
            ctx,
            api,
            'Cold artifact waits or chooses another worker',
            960,
            940,
            33,
            themeColors.pink,
          );
      }
    }
    drawConstructionFoot(
      ctx,
      api,
      'Authorization and base compatibility precede residency; old requests retain immutable revisions',
    );
  });
}
export default {
  id: 'adapter-revisions',
  draw: drawAdapterRevisions,
  cues: [
    'mt-adapter-revisions-b0',
    'mt-adapter-revisions-s0-1',
    'mt-adapter-revisions-s0-2',
    'mt-adapter-revisions-b1',
    'mt-adapter-revisions-s1-0',
    'mt-adapter-revisions-s1-1',
    'mt-adapter-revisions-b2',
    'mt-adapter-revisions-s2-3',
  ],
};
