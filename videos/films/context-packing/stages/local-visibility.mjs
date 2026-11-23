import { longContextModel } from '../construction.mjs';
import { cellGrid, contextText, footer, modelTarget } from '../defaults.mjs';
export function drawLocalVisibility(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('local-visibility', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    contextText(ctx, api, 'Full causal attention', 480, 275, 35, themeColors.blue);
    contextText(ctx, api, 'Width-four local attention', 1390, 275, 35, themeColors.green);
    cellGrid(ctx, api, 250, 350, 10, 10, 43, (r, c) =>
      c <= r ? themeColors.blue : themeColors.panel,
    );
    const visible = Math.ceil(100 * progress);
    modelTarget(ctx, api, 'local-visibility', () =>
      cellGrid(ctx, api, 1160, 350, 10, 10, 43, (r, c) =>
        c <= r && r - c < 4 && (currentBeat > 0 || r * 10 + c < visible)
          ? themeColors.green
          : themeColors.panel,
      ),
    );
    contextText(ctx, api, '55 valid pairs', 465, 850, 41, themeColors.blue);
    contextText(ctx, api, '34 valid pairs', 1375, 850, 41, themeColors.green);
    api.rect(ctx, 1160 + 43, 350 + 9 * 43, 39, 39, 'transparent', themeColors.red, 4);
    contextText(ctx, api, 'Q9 cannot directly read early D1', 1375, 925, 30, themeColors.red);
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Sink retention can stabilize generation · omitted facts still need a retrieval path'
        : 'One layer shown · stacked layers can propagate farther · no universal recall guarantee',
    );
  }
}
export default {
  id: 'local-visibility',
  draw: drawLocalVisibility,
  cues: ['local-visibility-0', 'local-visibility-1', 'local-visibility-2'],
};
