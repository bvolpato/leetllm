import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionHead,
  drawConstructionText,
} from '../defaults.mjs';
export function drawApiControls(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('api-controls', state),
    progress = (beat, n) => sentence(state, 'api-controls', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(
      ctx,
      api,
      'Model controls and the application ledger have separate owners',
    );
    const labels = [
        'Effort',
        'Execution mode',
        'Compatible reasoning context',
        'Generated-token cap',
      ],
      vals = [
        'relative deliberation',
        'standard / pro',
        'available compatible items',
        'reasoning + output + formatting',
      ];
    labels.forEach((label, i) => {
      const q = currentBeat ? 1 : progress(0, Math.min(2, i));
      drawConstructionText(ctx, api, label, 170, 395 + i * 115, 30, themeColors.cyan);
      drawConstructionBox(
        ctx,
        api,
        q > 0 ? vals[i] : 'awaiting request field',
        800,
        350 + i * 115,
        900,
        90,
        q ? themeColors.blue : themeColors.muted,
        29,
      );
    });
    if (!currentBeat) {
      const q = progress(0, 1);
      if (q > 0) {
        for (let i = 0; i < 3; i++)
          api.rect(
            ctx,
            860 + i * 245,
            800,
            210 * (i < Math.floor(q * 3) ? 1 : (q * 3) % 1),
            15,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
            themeColors.muted,
            1,
          );
        drawConstructionText(
          ctx,
          api,
          'Compatible carried items retain their own interpretation',
          960,
          900,
          29,
          themeColors.muted,
          'center',
        );
      }
    }
    if (currentBeat) {
      const shown = done(1, 2);
      drawConstructionBox(
        ctx,
        api,
        'Shared request: generator + retry + verifier',
        210,
        855,
        1500,
        90,
        shown ? themeColors.yellow : themeColors.muted,
        30,
      );
      drawConstructionText(
        ctx,
        api,
        shown
          ? 'One shared reservation ledger is still required'
          : 'Per-call controls retain their own scope',
        960,
        990,
        31,
        shown ? themeColors.yellow : themeColors.muted,
        'center',
      );
    } else
      drawConstructionFoot(
        ctx,
        api,
        'Changing effort does not authenticate a metrics receipt or construct an external search tree.',
      );
  }
}
export default {
  id: 'api-controls',
  draw: drawApiControls,
  cues: [
    'ra-api-controls-0-0',
    'ra-api-controls-0-1',
    'ra-api-controls-0-2',
    'ra-api-controls-1-0',
    'ra-api-controls-1-1',
    'ra-api-controls-1-2',
    'ra-api-controls-1-3',
  ],
};
