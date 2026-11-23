import { drawCard, drawFooter, drawText } from '../defaults.mjs';
export function drawSpeculativePrefix(ctx, scene, state, api) {
  api.focus.target('speculative-prefix-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    const { C: themeColors } = api;
    const cue = (name) => state.cues?.[name]?.phase !== 'before' && !!state.cues?.[name];
    {
      const reveal = cue('speculative-accepted'),
        all = currentBeat > 0 || cue('speculative-all');
      drawText(
        ctx,
        api,
        'Draft proposals · one target verification pass',
        960,
        300,
        32,
        themeColors.cyan,
        'center',
      );
      for (let i = 0; i < 5; i++) {
        const color =
          reveal || all ? (i < 4 || all ? themeColors.green : themeColors.pink) : themeColors.blue;
        drawCard(ctx, api, `d${i + 1}`, 240 + i * 285, 420, 220, 140, color, 37);
      }
      if (reveal || all) {
        drawCard(
          ctx,
          api,
          all ? 'all 5 pass → bonus b' : 'first 4 pass → correction c',
          450,
          710,
          1020,
          110,
          themeColors.green,
          37,
        );
      }
      drawFooter(
        ctx,
        api,
        currentBeat === 0
          ? 'Accept tokens in order until the first rejection'
          : 'Compare time per emitted token, including drafting and verification',
      );
    }
  });
}
export default {
  id: 'speculative-prefix',
  draw: drawSpeculativePrefix,
  cues: [
    'speculative-prefix-b1',
    'speculative-accepted',
    'speculative-all',
    'speculative-prefix-b2',
  ],
};
