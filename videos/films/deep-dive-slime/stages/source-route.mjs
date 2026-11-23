import { sampleSlimeChapter } from '../construction.mjs';
import { drawSlimeRule, drawSlimeTile, drawSlimeTitle, drawSlimeWire } from '../defaults.mjs';
export function drawSourceRoute(ctx, scene, state, api) {
  return api.focus.target('sl-source-route-mechanism', () =>
    paintSourceRoute(ctx, scene, state, api),
  );
}
function paintSourceRoute(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('source-route', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'Follow one Sample and one policy through the selected caller');
    const nodes = [
      'train / wait',
      'placement',
      'rollout / SGLang',
      'Sample',
      'loss reducer',
      'actor dispatch',
      'engine update',
      'checkpoint',
      'retained data',
    ];
    nodes.forEach((name, i) => {
      const x = 190 + (i % 3) * 570,
        y = 365 + Math.floor(i / 3) * 185;
      drawSlimeTile(
        ctx,
        api,
        name,
        x,
        y,
        490,
        i <= modelState.stage
          ? i === modelState.stage
            ? themeColors.yellow
            : themeColors.cyan
          : themeColors.muted,
        105,
        30,
      );
      if (i > 0 && i % 3)
        drawSlimeWire(ctx, api, x - 80, y + 52, x, y + 52, i <= modelState.stage ? 1 : 0);
    });
    drawSlimeRule(
      ctx,
      api,
      `slime 681b3ad   /   ${nodes[Math.min(8, modelState.stage)]}`,
      975,
      themeColors.yellow,
      33,
    );
    return;
  }
}
export default {
  id: 'source-route',
  draw: drawSourceRoute,
  cues: [
    'sl-source-route-b0-operation',
    'sl-source-route-b0-s0',
    'sl-source-route-b0-s1',
    'sl-source-route-b0-s2',
    'sl-source-route-b1-operation',
    'sl-source-route-b1-s0',
    'sl-source-route-b1-s1',
    'sl-source-route-b1-s2',
    'sl-source-route-b1-s3',
    'sl-source-route-b2-operation',
    'sl-source-route-b2-s0',
    'sl-source-route-b2-s1',
    'sl-source-route-b2-s2',
  ],
};
