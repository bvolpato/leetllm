import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsLine,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawEventMapping(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  api.focus.target('sd-event-mapping-mechanism', () => {
    drawConstructionsCenter(
      ctx,
      api,
      'Illustrative token identities · numeric equality alone cannot align events',
      245,
    );
    drawConstructionsText(
      ctx,
      api,
      'Proposer vocabulary',
      510,
      350,
      34,
      themeColors.cyan,
      'center',
    );
    drawConstructionsText(ctx, api, 'Target vocabulary', 1410, 350, 34, themeColors.blue, 'center');
    drawConstructionsBox(ctx, api, '4012 → cat', 180, 425, 660, themeColors.cyan);
    drawConstructionsBox(ctx, api, '4012 → house', 1080, 425, 660, themeColors.pink);
    drawConstructionsLine(ctx, api, 850, 464, 1070, 464, themeColors.pink, 4);
    drawConstructionsText(ctx, api, '≠', 960, 450, 42, themeColors.pink, 'center');
    if (currentBeat === 1) {
      drawConstructionsBox(ctx, api, 'shared string: cat', 180, 625, 660, themeColors.cyan);
      drawConstructionsBox(ctx, api, '17 → cat', 1080, 625, 660, themeColors.blue);
      api.arrow(ctx, 850, 664, 1065, 664, themeColors.green, 4);
      drawConstructionsCenter(
        ctx,
        api,
        'Normalize strings → shared intersection → constrain → translate IDs',
        835,
        themeColors.green,
        31,
      );
      drawConstructionsCenter(
        ctx,
        api,
        'Split/merge segmentation still needs its own valid contract',
        955,
        themeColors.muted,
      );
    }
  });
  return;
}
export default {
  id: 'event-mapping',
  draw: drawEventMapping,
  cues: ['sd-event-mapping-b0', 'sd-event-mapping-b1'],
};
