import {
  completionBox,
  completionCode,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawRoutePolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const drawMechanism = () => {
    completionHeading(ctx, api, 'Three ways to finish a line');
    if (currentBeat === 0) {
      completionCode(ctx, api, 'Polic', 240, 390, 40, themeColors.yellow);
      api.arrow(ctx, 510, 380, 790, 380, themeColors.blue, 4);
      completionBox(
        ctx,
        api,
        'PolicyGraph · local identifier index',
        850,
        330,
        740,
        100,
        themeColors.blue,
      );
      completionCode(ctx, api, 'graph.', 240, 610, 40, themeColors.yellow);
      api.arrow(ctx, 510, 600, 790, 600, themeColors.cyan, 4);
      completionBox(
        ctx,
        api,
        'Receiver type → local LSP members',
        850,
        550,
        740,
        100,
        themeColors.cyan,
      );
      completionCode(ctx, api, 'is_allowed =', 240, 830, 38, themeColors.yellow);
      api.arrow(ctx, 600, 820, 790, 820, themeColors.muted, 4);
      completionBox(ctx, api, 'Permitted generative infill', 850, 770, 740, 100, themeColors.green);
    } else {
      const values = [
        ['True', 'REMOTE · inline or multiline'],
        ['"False"', 'LOCAL FALLBACK'],
        ['None', 'LOCAL FALLBACK'],
        ['1', 'LOCAL FALLBACK'],
      ];
      completionText(
        ctx,
        api,
        'Semantic result available → LOCAL first',
        960,
        390,
        35,
        themeColors.blue,
        'center',
      );
      values.forEach(([v, out], i) => {
        completionCode(
          ctx,
          api,
          v,
          300,
          520 + i * 100,
          32,
          i ? themeColors.pink : themeColors.green,
        );
        api.arrow(ctx, 620, 510 + i * 100, 900, 510 + i * 100, themeColors.muted, 3);
        completionText(
          ctx,
          api,
          out,
          1000,
          520 + i * 100,
          31,
          i ? themeColors.pink : themeColors.green,
        );
      });
      completionFooter(
        ctx,
        api,
        currentBeat === 1
          ? 'Inline target 200 ms   ·   multiline target 500 ms'
          : 'Gateway checks repository access and upload permission',
      );
    }
  };
  api.focus.target('cc-route-policy-mechanism', drawMechanism);
  return;
}
export default {
  id: 'route-policy',
  draw: drawRoutePolicy,
  cues: ['cc-route-policy-0', 'cc-route-policy-1', 'cc-route-permission', 'cc-route-policy-2'],
};
