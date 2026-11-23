import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
  drawConstructionTransfer,
} from '../defaults.mjs';
export function drawEvictionArchitecture(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('eviction-architecture', state),
    progress = (beat, n) => sentence(state, 'eviction-architecture', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat
        ? 'Latent recurrence requires a trained architecture'
        : 'Deleting a rare value can remove a needed constraint',
    );
    if (!currentBeat) {
      const gone = done(0, 0);
      drawConstructionGrid(
        ctx,
        api,
        [
          ['KV page', 'value illustration', 'retained state'],
          ['common', 0.2, 'ordinary context'],
          ['rare', 8, gone ? 'EVICTED' : 'critical constraint'],
        ],
        200,
        365,
        1520,
        300,
        themeColors.blue,
        31,
      );
      if (gone) {
        drawConstructionBox(
          ctx,
          api,
          'same failed proposal',
          220,
          775,
          550,
          105,
          themeColors.pink,
          32,
        );
        drawConstructionBox(
          ctx,
          api,
          'retry same proposal',
          1130,
          775,
          550,
          105,
          themeColors.pink,
          32,
        );
        api.line(ctx, 800, 825, 1090, 825, themeColors.pink, 5);
      }
      drawConstructionFoot(ctx, api, 'Compare repeated failures with the uncompressed run.');
    } else {
      const a = drawConstructionBox(
          ctx,
          api,
          'token state',
          200,
          430,
          400,
          130,
          themeColors.blue,
          34,
        ),
        z = drawConstructionBox(
          ctx,
          api,
          'trained latent block',
          850,
          400,
          600,
          190,
          themeColors.cyan,
          34,
        );
      drawConstructionTransfer(ctx, api, a, z, progress(1, 1));
      const q = progress(1, 0);
      if (q > 0) {
        api.line(ctx, 1150, 650, 1540, 650, themeColors.cyan, 5);
        api.line(ctx, 1540, 650, 1540, 350, themeColors.cyan, 5);
        api.line(ctx, 1540, 350, 1150, 350, themeColors.cyan, 5);
      }
      drawConstructionBox(
        ctx,
        api,
        'Purpose-built model + runtime',
        420,
        810,
        1080,
        110,
        themeColors.yellow,
        34,
      );
      drawConstructionFoot(ctx, api, 'Each extra pass spends more compute on the same token.');
    }
  }
}
export default {
  id: 'eviction-architecture',
  draw: drawEvictionArchitecture,
  cues: [
    'ra-eviction-architecture-0-0',
    'ra-eviction-architecture-0-1',
    'ra-eviction-architecture-0-2',
    'ra-eviction-architecture-0-3',
    'ra-eviction-architecture-1-0',
    'ra-eviction-architecture-1-1',
    'ra-eviction-architecture-1-2',
    'ra-eviction-architecture-1-3',
  ],
};
